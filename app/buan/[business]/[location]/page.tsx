import { notFound } from "next/navigation";
import { isReservedSlug, BUAN_LIVE } from "@/lib/buan/config";
import { getBusinessBySlug, getLocationBySlug, getMenu } from "@/lib/buan/api";
import OrderFlow from "@/components/buan/OrderFlow";
import type { Product } from "@/lib/buan/types";

export const dynamic = "force-dynamic";

// Demo menu used when no Supabase backend is wired, so the customer ordering
// flow is fully demoable in-browser. Real menus come from the DB when live.
const SAMPLE_MENU: Product[] = [
  { id: "s1", location_id: "demo", name: "Flat White", description: "Double ristretto, silky milk", price: 3.2, category: "Coffee", prep_time_mins: 4, allergens: [], dietary_tags: [], visible: true, stock: { product_id: "s1", type: "unlimited", qty: 0 } },
  { id: "s2", location_id: "demo", name: "Latte", description: "Smooth and milky", price: 3.4, category: "Coffee", prep_time_mins: 4, allergens: [], dietary_tags: [], visible: true, stock: { product_id: "s2", type: "unlimited", qty: 0 } },
  { id: "s3", location_id: "demo", name: "Bacon Roll", description: "Smoked back bacon, brown sauce", price: 4.5, category: "Kitchen", prep_time_mins: 12, allergens: [], dietary_tags: [], visible: true, stock: { product_id: "s3", type: "limited", qty: 4 } },
  { id: "s4", location_id: "demo", name: "Blueberry Muffin", description: "Warm, gooey", price: 2.9, category: "Bakery", prep_time_mins: 0, allergens: [], dietary_tags: [], visible: true, stock: { product_id: "s4", type: "out", qty: 0 } },
];

const titled = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default async function LocationMenu({
  params,
}: {
  params: { business: string; location: string };
}) {
  if (isReservedSlug(params.business)) notFound();

  if (!BUAN_LIVE) {
    return (
      <OrderFlow
        live={false}
        business={{ id: "demo", slug: params.business, name: titled(params.business) }}
        location={{ id: "demo", business_id: "demo", slug: params.location, name: titled(params.location) }}
        menu={SAMPLE_MENU}
      />
    );
  }

  const business = await getBusinessBySlug(params.business);
  if (!business) notFound();
  const location = await getLocationBySlug(business.id, params.location);
  if (!location) notFound();
  const menu = await getMenu(location.id);

  return <OrderFlow live business={business} location={location} menu={menu} />;
}
