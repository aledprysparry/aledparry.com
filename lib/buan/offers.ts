// Buan end-of-day offers (P7).
//
// A business clears remaining stock by discounting selected products near close.
// These helpers apply active offers to customer-facing pricing. When the DB is
// live, offers come from the `offers` table; the scaffold passes them directly.

import type { Product } from "./types";

export interface Offer {
  id: string;
  productIds: string[];
  discountPct: number; // 1-100
  active: boolean;
  label?: string;
}

export function offerFor(productId: string, offers: Offer[]): Offer | null {
  return offers.find((o) => o.active && o.discountPct > 0 && o.productIds.includes(productId)) ?? null;
}

export function discountPct(productId: string, offers: Offer[]): number {
  return offerFor(productId, offers)?.discountPct ?? 0;
}

export function effectivePrice(product: Product, offers: Offer[]): number {
  const o = offerFor(product.id, offers);
  if (!o) return product.price;
  return +(product.price * (1 - o.discountPct / 100)).toFixed(2);
}
