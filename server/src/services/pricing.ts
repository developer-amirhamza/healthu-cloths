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
}) => {
  const { productId } = params;
  const role = normaliseRole(params.role);
  const quantity = params.quantity ?? 1;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { price: true, discount: true },
  });
  if (!product) throw new Error("Product not found");

  // 0. Per-account negotiated price wins over everything.
  if (params.userId) {
    const negotiated = await prisma.negotiatedPrice.findUnique({
      where: { userId_productId: { userId: params.userId, productId } },
    });
    if (negotiated) return negotiated.price;
  }

  // 1. Explicit override for this role.
  const override = await prisma.priceOverride.findUnique({
    where: { productId_role: { productId, role } },
  });
  if (override) return override.price;
}





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

// ── Quote / cart totals ───────────────────────────────────────────────────────
// Shared total builder used by the NDIS quote engine and B2B/consumer carts.
// `annual` applies the NDIS 12-month discount; `subscription` applies the
// consumer recurring discount. Both default to off.
export const buildTotals = async (params: {
  net: number; // subtotal AFTER any line-level pricing, BEFORE order-level discounts
  settings?: Settings;
  annual?: boolean;
  subscription?: boolean;
}) => {
  const settings = params.settings ?? (await getSettings());
  const subtotal = +params.net.toFixed(2);

  let discount = 0;
  if (params.annual && settings.ndisAnnualDiscountPct > 0) {
    discount = +((subtotal * settings.ndisAnnualDiscountPct) / 100).toFixed(2);
  } else if (params.subscription && settings.consumerSubscriptionDiscountPct > 0) {
    discount = +((subtotal * settings.consumerSubscriptionDiscountPct) / 100).toFixed(2);
  }

  const netAfterDiscount = +(subtotal - discount).toFixed(2);
  const delivery = calcDelivery(settings, netAfterDiscount);
  const gst = calcGst(settings, netAfterDiscount + delivery);
  const total = +(netAfterDiscount + delivery + gst).toFixed(2);

  return { subtotal, discount, delivery, gst, total, settings };
};