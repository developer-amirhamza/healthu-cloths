import { prisma } from "../lib/prisma";
import { ROLES } from "../middlewares/role";
import { resolveUnitPrice, buildTotals } from "./pricing";

// Days for each supply period. One-off uses the product's pack quantity
// (passed per-line), Monthly = 30, Annual = 365 — exactly per the brief.
export const SUPPLY_PERIOD_DAYS: Record<string, number | "PACK"> = {
  "One-off": "PACK",
  Monthly: 30,
  Annual: 365,
};

export interface QuoteLineInput {
  productId: string;
  size?: string;
  absorbency?: string;
  dailyPads: number;
  // For One-off, the pack quantity (days defaults to packQuantity).
  packQuantity?: number;
}

// Compute a full NDIS quote (line items + totals) without persisting.
// Mirrors the Excel calculator: total pads = daily pads × days; subtotal =
// total pads × unit price; annual discount + delivery + configurable GST.
export const computeQuote = async (params: {
  supplyPeriod: string;
  lines: QuoteLineInput[];
}) => {
  const { supplyPeriod, lines } = params;
  const periodDays = SUPPLY_PERIOD_DAYS[supplyPeriod] ?? 30;

  const items = [];
  let net = 0;

  for (const line of lines) {
    const product = await prisma.product.findUnique({
      where: { id: line.productId },
      select: { id: true, title: true },
    });
    if (!product) throw new Error(`Product not found: ${line.productId}`);

    // Days in this line's supply period.
    const days =
      periodDays === "PACK" ? line.packQuantity ?? 1 : (periodDays as number);

    const totalPads = Math.max(0, Math.round(line.dailyPads * days));

    // NDIS coordinators are quoted at the NDIS price (override) or retail.
    const unitPrice:any = await resolveUnitPrice({
      productId: line.productId,
      role: ROLES.NDIS_COORDINATOR,
      quantity: totalPads,
    });

    const lineTotal = +(totalPads * unitPrice).toFixed(2);
    net += lineTotal;

    items.push({
      productId: product.id,
      productName: product.title,
      size: line.size ?? null,
      absorbency: line.absorbency ?? null,
      dailyPads: line.dailyPads,
      days,
      totalPads,
      unitPrice,
      lineTotal,
    });
  }

  // Annual supply triggers the configurable NDIS annual discount.
  const totals = await buildTotals({ net, annual: supplyPeriod === "Annual" });

  return { items, ...totals };
};