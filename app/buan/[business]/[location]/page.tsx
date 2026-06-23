import { notFound } from "next/navigation";
import { isReservedSlug, BUAN_LIVE, money } from "@/lib/buan/config";
import { getBusinessBySlug, getLocationBySlug, getMenu } from "@/lib/buan/api";
import type { Product, Stock } from "@/lib/buan/types";

export const dynamic = "force-dynamic";

function stockOf(p: Product): Stock | null {
  if (!p.stock) return null;
  return Array.isArray(p.stock) ? p.stock[0] ?? null : p.stock;
}

// Buan customer menu: buan.co/[business]/[location]
// P0 = read-only menu skeleton. Basket + ordering land in P4.
export default async function LocationMenu({
  params,
}: {
  params: { business: string; location: string };
}) {
  if (isReservedSlug(params.business)) notFound();

  if (!BUAN_LIVE) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
        <div className="max-w-md text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Buan</p>
          <h1 className="mt-2 text-2xl font-bold text-stone-900">Menu coming online</h1>
          <p className="mt-2 text-stone-600">
            This ordering page is scaffolded but its backend isn&apos;t connected yet.
          </p>
        </div>
      </div>
    );
  }

  const business = await getBusinessBySlug(params.business);
  if (!business) notFound();
  const location = await getLocationBySlug(business.id, params.location);
  if (!location) notFound();
  const menu = await getMenu(location.id);

  return (
    <div className="min-h-screen bg-stone-50 px-6 py-12">
      <div className="mx-auto max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">{business.name}</p>
        <h1 className="mt-1 text-2xl font-bold text-stone-900">{location.name}</h1>
        {location.collection_instructions ? (
          <p className="mt-2 text-sm text-stone-500">{location.collection_instructions}</p>
        ) : null}

        <div className="mt-8 space-y-2">
          {menu.length === 0 ? (
            <p className="text-stone-500">No items on the menu yet.</p>
          ) : (
            menu.map((p) => {
              const s = stockOf(p);
              const soldOut = s?.type === "out" || (s?.type === "limited" && s.qty <= 0);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-4"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-stone-900">{p.name}</div>
                    {p.description ? (
                      <div className="truncate text-sm text-stone-500">{p.description}</div>
                    ) : null}
                    {s?.type === "limited" && s.qty > 0 ? (
                      <div className="mt-1 text-xs font-medium text-amber-600">Only {s.qty} left</div>
                    ) : null}
                  </div>
                  <div className="ml-4 text-right">
                    <div className="font-semibold tabular-nums text-stone-900">{money(p.price)}</div>
                    {soldOut ? (
                      <div className="text-xs font-semibold uppercase text-stone-400">Sold out</div>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p className="mt-10 text-center text-xs text-stone-400">
          Buan P0 scaffold · basket &amp; checkout arrive in P4.
        </p>
      </div>
    </div>
  );
}
