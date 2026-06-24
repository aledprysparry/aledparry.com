import Link from "next/link";
import { PLANS } from "@/lib/buan/pricing";

/* Buan platform admin (P8) – internal operator view: all businesses, plans,
   status, headline MRR. Scaffold uses sample data; wire to the businesses +
   subscriptions tables (service role) behind real admin auth when live.
   "admin" is a reserved slug, so this static route wins over /buan/[business]. */
export const dynamic = "force-dynamic";

type Plan = "free" | "pro" | "business" | "enterprise";
interface Biz { name: string; slug: string; plan: Plan; status: "active" | "pending"; locations: number; }

const SAMPLE: Biz[] = [
  { name: "The Bridge Café", slug: "bridge-cafe", plan: "pro", status: "active", locations: 1 },
  { name: "Parc Menai Coffee", slug: "parc-menai", plan: "business", status: "active", locations: 3 },
  { name: "Tesla Hub Bangor", slug: "tesla-bangor", plan: "free", status: "active", locations: 1 },
  { name: "Gŵyl Fwyd Pop-up", slug: "gwyl-fwyd", plan: "business", status: "pending", locations: 6 },
  { name: "Caffi'r Cei", slug: "caffir-cei", plan: "free", status: "pending", locations: 1 },
];

const priceOf = (p: Plan) => PLANS.find((x) => x.id === p)?.priceMonthly ?? 0;

export default function BuanAdmin() {
  const total = SAMPLE.length;
  const active = SAMPLE.filter((b) => b.status === "active").length;
  const pending = SAMPLE.filter((b) => b.status === "pending").length;
  const mrr = SAMPLE.filter((b) => b.status === "active").reduce((s, b) => s + (priceOf(b.plan) || 0), 0);

  const planBadge: Record<Plan, string> = {
    free: "bg-stone-700/40 text-stone-300",
    pro: "bg-emerald-500/15 text-emerald-300",
    business: "bg-sky-500/15 text-sky-300",
    enterprise: "bg-purple-500/15 text-purple-300",
  };

  return (
    <div className="min-h-screen bg-stone-950 px-6 py-10 text-stone-100">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <Link href="/buan" className="text-lg font-extrabold tracking-tight">Buan</Link>
          <span className="rounded-full border border-stone-700 px-3 py-1 text-xs text-stone-400">Platform admin</span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["Businesses", String(total)], ["Active", String(active)], ["Pending", String(pending)], ["MRR (placeholder)", "£" + mrr]].map(([l, v]) => (
            <div key={l} className="rounded-xl border border-stone-800 bg-stone-900 p-4">
              <div className="text-xs uppercase tracking-wide text-stone-500">{l}</div>
              <div className="mt-1 text-2xl font-extrabold tabular-nums">{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-stone-800">
          <table className="w-full text-sm">
            <thead className="bg-stone-900 text-left text-xs uppercase tracking-wide text-stone-500">
              <tr><th className="p-3">Business</th><th className="p-3">Plan</th><th className="p-3">Status</th><th className="p-3 text-right">Locations</th></tr>
            </thead>
            <tbody>
              {SAMPLE.map((b) => (
                <tr key={b.slug} className="border-t border-stone-800">
                  <td className="p-3"><div className="font-semibold">{b.name}</div><div className="text-xs text-stone-500">buan.co/{b.slug}</div></td>
                  <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${planBadge[b.plan]}`}>{b.plan}</span></td>
                  <td className="p-3">{b.status === "pending" ? <span className="text-amber-300">Pending approval</span> : <span className="text-emerald-300">Active</span>}</td>
                  <td className="p-3 text-right tabular-nums">{b.locations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-center text-xs text-stone-500">Buan P8 scaffold · sample data, no admin auth yet. MRR is placeholder (from pricing tiers).</p>
      </div>
    </div>
  );
}
