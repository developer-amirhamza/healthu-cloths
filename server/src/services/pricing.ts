import { prisma } from "../lib/prisma";
import { ROLES, normaliseRole } from "../middlewares/role";

// ── Settings ───────────────────────────────────────────────────────────────
// All pricing rules live in the Setting table so the admin team can edit them
// without a code change. These defaults are used only when a key is missing.
export const SETTING_DEFAULTS = {
  gstEnabled: false, // continence aids / NDIS supplies may be GST-free
  gstRate: 0.1,
  ndisAnnualDiscountPct: 0,
  consumerSubscriptionDiscountPct: 0,
  deliveryMode: "FLAT" as "FLAT" | "POSTCODE",
  deliveryFlatFee: 0,
  freeDeliveryThreshold: 0,
};

export type Settings = typeof SETTING_DEFAULTS;

// Load all settings, merged over the defaults.
export const getSettings = async (): Promise<Settings> => {
  const rows = await prisma.setting.findMany();
  const map: Record<string, any> = {};
  for (const row of rows) map[row.key] = row.value;
  return { ...SETTING_DEFAULTS, ...map };
};

// Upsert a single setting (admin).
export const setSetting = async (key: string, value: any) => {
  return prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
};

// ── Unit price resolution ────────────────────────────────────────────────────
// Resolve the unit price for a product, given the buyer's role and quantity.
//   0. NegotiatedPrice for (user, product) — per-account custom rate (Phase 3)
//   1. PriceOverride for (product, role)   — explicit per-product price
//   2. TRADE: highest matching volume tier (minQuantity <= quantity)
//   3. Fallback: product retail price (minus its own discount)
export const resolveUnitPrice = async (params: {
  productId: string;
  role?: string | null;
  quantity?: number;
  userId?: string | null;
}): Promise<number> => {
  const { productId } = params;
  const role = normaliseRole(params.role);
  const quantity = params.quantity ?? 1;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { title: true, price: true, discount: true },
  });
  if (!product) throw new Error("Product not found");

  // A corrupted/blank price (NaN, null, 0 or negative) must never silently
  // flow into a quote/order total as NaN — fail loudly and name the product
  // so the coordinator/admin knows exactly what to fix.
  const assertFinitePrice = (value: unknown, source: string): number => {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) {
      throw new Error(
        `"${product.title}" has an invalid ${source} price — please fix its price before quoting/ordering it.`
      );
    }
    return n;
  };

  // 0. Per-account negotiated price wins over everything.
  if (params.userId) {
    const negotiated = await prisma.negotiatedPrice.findUnique({
      where: { userId_productId: { userId: params.userId, productId } },
    });
    if (negotiated) return assertFinitePrice(negotiated.price, "negotiated");
  }

  // 1. Explicit override for this role.
  const override = await prisma.priceOverride.findUnique({
    where: { productId_role: { productId, role } },
  });
  if (override) return assertFinitePrice(override.price, "role override");

  // 2. Trade volume tiers — highest minQuantity that the quantity satisfies.
  if (role === ROLES.TRADE) {
    const tier = await prisma.pricingTier.findFirst({
      where: {
        role: ROLES.TRADE,
        minQuantity: { lte: quantity },
        OR: [{ productId }, { productId: null }],
      },
      orderBy: [{ productId: "desc" }, { minQuantity: "desc" }],
    });
    if (tier) return assertFinitePrice(tier.pricePerUnit, "trade tier");
  }

  // 3. Retail price with the product's own discount applied.
  const discount = Number.isFinite(product.discount) ? product.discount : 0;
  const retail = assertFinitePrice(product.price, "retail");
  return discount > 0 ? +(retail - (retail * discount) / 100).toFixed(2) : retail;
};

// ── Delivery & GST helpers ────────────────────────────────────────────────────
export const calcDelivery = (settings: Settings, orderSubtotal: number): number => {
  if (settings.freeDeliveryThreshold > 0 && orderSubtotal >= settings.freeDeliveryThreshold) {
    return 0;
  }
  // POSTCODE mode is a future extension (NSW-only Year 1); for now both modes
  // use the flat fee until postcode rules are added.
  return settings.deliveryFlatFee ?? 0;
};

export const calcGst = (settings: Settings, taxableAmount: number): number => {
  if (!settings.gstEnabled) return 0;
  return +(taxableAmount * settings.gstRate).toFixed(2);
};

// ── Subscribe & Save tiers ──────────────────────────────────────────────────
// "Subscribe & Save" auto-refill discount, keyed by interval in days. Longer
// commitments earn a bigger discount — mirrors the standard e-commerce
// 2 / 4 / 6 / 12-month refill pattern.
export const SUBSCRIPTION_INTERVAL_TIERS = [
  { months: 2, days: 60, discountPct: 10 },
  { months: 4, days: 120, discountPct: 15 },
  { months: 6, days: 180, discountPct: 18 },
  { months: 12, days: 365, discountPct: 20 },
] as const;

// Resolve the discount % for a given interval — exact day match first, else
// the closest tier by day count (so odd custom intervals still get a sane
// discount instead of silently falling back to 0).
export const subscriptionDiscountPctForInterval = (intervalDays?: number | null): number => {
  if (!intervalDays || intervalDays <= 0) return 0;
  const exact = SUBSCRIPTION_INTERVAL_TIERS.find((t) => t.days === intervalDays);
  if (exact) return exact.discountPct;
  const closest = SUBSCRIPTION_INTERVAL_TIERS.reduce((best, t) =>
    Math.abs(t.days - intervalDays) < Math.abs(best.days - intervalDays) ? t : best
  );
  return closest.discountPct;
};

// ── Quote / cart totals ───────────────────────────────────────────────────────
// Shared total builder used by the NDIS quote engine and B2B/consumer carts.
// `annual` applies the NDIS 12-month discount; `subscriptionIntervalDays`
// applies the tiered Subscribe & Save discount for that refill cadence.
export const buildTotals = async (params: {
  net: number; // subtotal AFTER any line-level pricing, BEFORE order-level discounts
  settings?: Settings;
  annual?: boolean;
  subscription?: boolean;
  subscriptionIntervalDays?: number | null;
}) => {
  const settings = params.settings ?? (await getSettings());
  const subtotal = +params.net.toFixed(2);

  let discount = 0;
  if (params.annual && settings.ndisAnnualDiscountPct > 0) {
    discount = +((subtotal * settings.ndisAnnualDiscountPct) / 100).toFixed(2);
  } else if (params.subscriptionIntervalDays) {
    const pct = subscriptionDiscountPctForInterval(params.subscriptionIntervalDays);
    if (pct > 0) discount = +((subtotal * pct) / 100).toFixed(2);
  } else if (params.subscription && settings.consumerSubscriptionDiscountPct > 0) {
    // Legacy fallback for callers that only know "this is a subscription"
    // without an interval (kept for backward compatibility).
    discount = +((subtotal * settings.consumerSubscriptionDiscountPct) / 100).toFixed(2);
  }

  const netAfterDiscount = +(subtotal - discount).toFixed(2);
  const delivery = calcDelivery(settings, netAfterDiscount);
  const gst = calcGst(settings, netAfterDiscount + delivery);
  const total = +(netAfterDiscount + delivery + gst).toFixed(2);

  return { subtotal, discount, delivery, gst, total, settings };
};