import Link from "next/link";
import { buanConfigured } from "@/lib/buan/supabaseClient";

// Buan landing / shell placeholder (Phase 0). Real marketing + onboarding
// arrive in P2. The link below is the entry to the slug-routing skeleton.
export const dynamic = "force-dynamic";

export default function BuanHome() {
  const configured = buanConfigured();
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
        Phase 0 - foundation
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Buan</h1>
      <p className="mt-4 text-lg text-stone-600">
        The digital sales layer for physical businesses. QR ordering, live
        kitchen dashboards, offers and loyalty - multi-tenant, scoped per
        business and location.
      </p>

      <div className="mt-8 rounded-lg border border-stone-200 bg-white p-5 text-sm">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              configured ? "bg-emerald-500" : "bg-stone-300"
            }`}
          />
          <span className="font-medium">
            Supabase backend {configured ? "connected" : "not configured"}
          </span>
        </div>
        <p className="mt-2 text-stone-500">
          {configured
            ? "Business and location slugs resolve live from the buan schema."
            : "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable live data. Until then the routes render as placeholders."}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link
          href="/buan/demo-cafe/drive-in"
          className="rounded-md bg-stone-900 px-4 py-2 font-medium text-white hover:bg-stone-700"
        >
          Open a sample location route
        </Link>
        <Link
          href="/buan/login"
          className="rounded-md border border-stone-300 px-4 py-2 font-medium hover:border-stone-500"
        >
          Staff sign in
        </Link>
      </div>

      <p className="mt-10 text-xs text-stone-400">
        Grown from the Tanio demo. See BUAN_P0_NOTES.md for what is built,
        stubbed, and the open decisions.
      </p>
    </main>
  );
}
