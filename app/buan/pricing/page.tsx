import Link from "next/link";
import { PLANS, fmtPlanPrice, PLATFORM_FEE, PRICING_NOTE } from "@/lib/buan/pricing";

// Buan pricing page (P5). Rendered entirely from lib/buan/pricing – tweak the
// figures there and this page updates. All placeholder, to be confirmed.
export const dynamic = "force-dynamic";

export default function BuanPricing() {
  return (
    <div className="min-h-screen bg-stone-950 px-6 py-12 text-stone-100">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <Link href="/buan" className="text-lg font-extrabold tracking-tight">Buan</Link>
          <Link href="/buan/start" className="text-sm text-emerald-400 hover:underline">Start free</Link>
        </div>

        <h1 className="mt-8 text-center text-3xl font-extrabold tracking-tight">Simple, honest pricing</h1>
        <p className="mx-auto mt-2 max-w-xl text-center text-stone-400">
          The free tier is built to run a real business on. Pay only when you want your own brand, scale, or automation.
        </p>
        <p className="mx-auto mt-2 max-w-xl rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-center text-xs text-amber-300">
          {PRICING_NOTE}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <div key={p.id} className={`flex flex-col rounded-xl border p-5 ${p.highlight ? "border-emerald-500 bg-emerald-500/5" : "border-stone-800 bg-stone-900"}`}>
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-bold">{p.name}</h2>
                {p.highlight ? <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[10px] font-bold text-emerald-950">POPULAR</span> : null}
              </div>
              <div className="mt-2 text-2xl font-extrabold tabular-nums">{fmtPlanPrice(p)}</div>
              <p className="mt-1 text-sm text-stone-400">{p.tagline}</p>
              <ul className="mt-4 flex-1 space-y-1.5 text-sm text-stone-300">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2"><span className="text-emerald-400">✓</span>{f}</li>
                ))}
              </ul>
              <Link href="/buan/start" className={`mt-5 rounded-lg px-4 py-2.5 text-center font-bold ${p.highlight ? "bg-emerald-400 text-emerald-950 hover:brightness-105" : "border border-stone-700 hover:border-emerald-400"}`}>
                {p.priceMonthly === null ? "Contact us" : "Get started"}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-stone-500">
          Plus a small per-order fee to cover payment processing – placeholder {PLATFORM_FEE.percent}% + {PLATFORM_FEE.fixedPence}p, lower on paid tiers.
        </p>
      </div>
    </div>
  );
}
