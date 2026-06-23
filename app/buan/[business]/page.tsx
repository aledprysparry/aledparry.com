import { notFound } from "next/navigation";
import Link from "next/link";
import { isReservedSlug, BUAN_LIVE } from "@/lib/buan/config";
import { getBusinessBySlug, listLocations } from "@/lib/buan/api";

export const dynamic = "force-dynamic";

// Buan business page: buan.co/[business] — lists the business's locations.
export default async function BusinessPage({
  params,
}: {
  params: { business: string };
}) {
  if (isReservedSlug(params.business)) notFound();

  if (!BUAN_LIVE) {
    return <NotConfigured slug={params.business} />;
  }

  const business = await getBusinessBySlug(params.business);
  if (!business) notFound();
  const locations = await listLocations(business.id);

  return (
    <div className="min-h-screen bg-stone-50 px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Buan</p>
        <h1 className="mt-1 text-3xl font-bold text-stone-900">{business.name}</h1>
        {business.description ? (
          <p className="mt-2 text-stone-600">{business.description}</p>
        ) : null}

        <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-stone-500">
          Choose a location
        </h2>
        <div className="mt-3 space-y-3">
          {locations.length === 0 ? (
            <p className="text-stone-500">No locations yet.</p>
          ) : (
            locations.map((loc) => (
              <Link
                key={loc.id}
                href={`/buan/${params.business}/${loc.slug}`}
                className="block rounded-lg border border-stone-200 p-4 transition-colors hover:border-emerald-400"
              >
                <div className="font-semibold text-stone-900">{loc.name}</div>
                {loc.address ? <div className="text-sm text-stone-500">{loc.address}</div> : null}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function NotConfigured({ slug }: { slug: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-6">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Buan</p>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">Almost there</h1>
        <p className="mt-2 text-stone-600">
          The ordering backend for <span className="font-mono">{slug}</span> isn&apos;t connected yet.
          Set the Supabase environment variables to bring this location online.
        </p>
        <p className="mt-4 text-sm text-stone-400">Buan P0 scaffold · multi-tenant routing live.</p>
      </div>
    </div>
  );
}
