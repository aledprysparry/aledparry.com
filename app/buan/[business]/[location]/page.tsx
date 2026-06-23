import Link from "next/link";
import { notFound } from "next/navigation";
import { isReservedSlug, isValidBusinessSlug } from "@/lib/buan/reservedSlugs";
import { buanConfigured } from "@/lib/buan/supabaseClient";
import { resolveScope } from "@/lib/buan/store";

// buan.co/<business>/<location> - the customer entry point a QR code links to.
// Phase 0 placeholder: resolves the business+location pair by slug. The full
// ordering flow (the generalised Tanio UI) is wired on top of lib/buan/store in
// a later phase.
export const dynamic = "force-dynamic";

interface Props {
  params: { business: string; location: string };
}

export default async function LocationPage({ params }: Props) {
  const businessSlug = params.business.toLowerCase();
  const locationSlug = params.location.toLowerCase();

  if (isReservedSlug(businessSlug) || !isValidBusinessSlug(businessSlug)) {
    notFound();
  }

  const resolved = buanConfigured()
    ? await resolveScope(businessSlug, locationSlug)
    : null;

  if (buanConfigured() && !resolved) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
        Location
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">
        {resolved?.location.name ?? locationSlug}
      </h1>
      <p className="mt-1 text-stone-500">
        {resolved?.business.name ?? businessSlug}
      </p>

      <p className="mt-6 text-stone-600">
        {resolved
          ? "Resolved live. This is where the customer ordering flow (menu, cart, payment, live tracker) renders."
          : "Placeholder: connect Supabase and seed a business + location to resolve this route. The ordering UI is built on lib/buan/store in a later phase."}
      </p>

      <Link
        href={`/buan/${businessSlug}`}
        className="mt-10 inline-block text-sm text-stone-500 hover:text-stone-800"
      >
        ← {resolved?.business.name ?? businessSlug}
      </Link>
    </main>
  );
}
