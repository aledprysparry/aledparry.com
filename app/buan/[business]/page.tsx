import Link from "next/link";
import { notFound } from "next/navigation";
import { isReservedSlug, isValidBusinessSlug } from "@/lib/buan/reservedSlugs";
import { buanConfigured } from "@/lib/buan/supabaseClient";
import { getBusinessBySlug } from "@/lib/buan/store";

// buan.co/<business> - resolves a tenant by slug. Reserved slugs (admin, login,
// api, support, ...) are blocked here so they can never be claimed and so the
// real system routes keep working. Placeholder page for Phase 0.
export const dynamic = "force-dynamic";

interface Props {
  params: { business: string };
}

export default async function BusinessPage({ params }: Props) {
  const slug = params.business.toLowerCase();

  // Reserved-slug blocking: a business may never occupy a system namespace.
  if (isReservedSlug(slug) || !isValidBusinessSlug(slug)) notFound();

  const business = buanConfigured() ? await getBusinessBySlug(slug) : null;

  // When the backend is live, an unknown slug is a genuine 404.
  if (buanConfigured() && !business) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
        Business
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">
        {business?.name ?? slug}
      </h1>
      <p className="mt-3 text-stone-600">
        {business
          ? "Resolved from the buan schema. Pick a location to see its menu."
          : "Placeholder: this slug is valid and not reserved. Connect Supabase to resolve a real business and list its locations."}
      </p>

      <p className="mt-8 text-sm text-stone-500">
        Location routes live at{" "}
        <code className="rounded bg-stone-100 px-1.5 py-0.5">
          /buan/{slug}/&lt;location&gt;
        </code>
        .
      </p>

      <Link
        href="/buan"
        className="mt-10 inline-block text-sm text-stone-500 hover:text-stone-800"
      >
        ← Buan
      </Link>
    </main>
  );
}
