// ============================================================
// Buan pricing (P5) – SINGLE SOURCE OF TRUTH.
//
// ⚠️ ALL FIGURES ARE PLACEHOLDERS, to be confirmed during testing.
// Tweak everything here: the marketing pricing section, the /buan/pricing
// page, and the order fee calculation all read from this file. Nothing about
// pricing is hardcoded elsewhere – change a number here and it flows through.
// ============================================================

export const PRICING_IS_PLACEHOLDER = true;
export const PRICING_NOTE = "Placeholder pricing – figures are indicative and will be confirmed during early testing.";

export type PlanId = "free" | "pro" | "business" | "enterprise";

export interface BuanPlan {
  id: PlanId;
  name: string;
  /** Monthly price in £. 0 = free, null = custom / contact us. PLACEHOLDER. */
  priceMonthly: number | null;
  tagline: string;
  features: string[];
  highlight?: boolean;
}

export const PLANS: BuanPlan[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    tagline: "Good enough to run a real business on.",
    features: ["1 location", "QR ordering page", "Live stock control", "Email order alerts", "buan.co/your-name link"],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 19, // PLACEHOLDER
    tagline: "Look like your own brand.",
    features: ["Everything in Free", "Custom domain + white-label", "Timed collection slots", "End-of-day offers", "Lower transaction fee", "Priority support"],
    highlight: true,
  },
  {
    id: "business",
    name: "Business",
    priceMonthly: 49, // PLACEHOLDER
    tagline: "Multiple sites and events.",
    features: ["Everything in Pro", "Multiple locations", "Multi-vendor event mode", "Advanced analytics", "Demand forecasting"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: null,
    tagline: "Custom contracts.",
    features: ["Everything in Business", "SLAs and onboarding", "Custom integrations", "Dedicated support"],
  },
];

// Per-order platform fee (covers payment processing + platform). PLACEHOLDER.
export const PLATFORM_FEE = { percent: 1.5, fixedPence: 20 };

/** Platform fee on an order total (in £). PLACEHOLDER calc. */
export function feeFor(totalGbp: number): number {
  return +(totalGbp * (PLATFORM_FEE.percent / 100) + PLATFORM_FEE.fixedPence / 100).toFixed(2);
}

export function fmtPlanPrice(p: BuanPlan): string {
  if (p.priceMonthly === null) return "Custom";
  if (p.priceMonthly === 0) return "Free";
  return `£${p.priceMonthly}/mo`;
}

// Headline shown on the marketing page (lowest paid tier). Derived, so it tracks
// whatever you set above.
export const HEADLINE_PRICE: string = (() => {
  const paid = PLANS.filter((p) => typeof p.priceMonthly === "number" && (p.priceMonthly as number) > 0);
  const lowest = paid.sort((a, b) => (a.priceMonthly as number) - (b.priceMonthly as number))[0];
  return lowest ? `£${lowest.priceMonthly}/mo` : "Free";
})();
