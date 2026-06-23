import { Metadata } from "next";
import BuanLoader from "./loader";

// Canonical, indexable home for the Buan marketing landing. Lives at the
// top level (not under /app, which robots.ts disallows) so search crawlers
// can index it. /app/buan redirects here for any legacy/showcase links.
export const metadata: Metadata = {
  title: "Buan – Sell faster. Queue less.",
  description:
    "Buan is the digital sales layer for physical businesses. Customers scan a QR code, order and pay on their phone, and you take orders without the queue or the hardware. Bilingual Welsh/English.",
  alternates: { canonical: "https://aledparry.com/buan" },
};

export default function BuanMarketingPage() {
  return <BuanLoader />;
}
