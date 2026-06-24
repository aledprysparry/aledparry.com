import ManageNav from "@/components/buan/ManageNav";
import { money } from "@/lib/buan/config";

/* Buan business analytics (P8). Scaffold computes from sample orders; swap the
   sample for a date-ranged query over the orders table when Supabase is live. */
export const dynamic = "force-dynamic";

interface Row { hour: number; items: { name: string; qty: number; price: number }[] }
const SAMPLE: Row[] = [
  { hour: 8, items: [{ name: "Flat White", qty: 2, price: 3.2 }] },
  { hour: 9, items: [{ name: "Latte", qty: 1, price: 3.4 }, { name: "Butter Croissant", qty: 1, price: 2.8 }] },
  { hour: 12, items: [{ name: "Bacon Roll", qty: 2, price: 4.5 }, { name: "Flat White", qty: 1, price: 3.2 }] },
  { hour: 12, items: [{ name: "Latte", qty: 2, price: 3.4 }] },
  { hour: 12, items: [{ name: "Flat White", qty: 1, price: 3.2 }, { name: "Mocha", qty: 1, price: 3.6 }] },
  { hour: 13, items: [{ name: "Bacon Roll", qty: 1, price: 4.5 }] },
  { hour: 15, items: [{ name: "Blueberry Muffin", qty: 1, price: 2.9 }] },
];
const MISSED = 4; // sold-out attempts (lost sales) – sample

function compute() {
  const orders = SAMPLE.length;
  const revenue = SAMPLE.reduce((s, r) => s + r.items.reduce((a, i) => a + i.qty * i.price, 0), 0);
  const qtyByItem: Record<string, number> = {};
  const byHour: Record<number, number> = {};
  for (const r of SAMPLE) {
    byHour[r.hour] = (byHour[r.hour] || 0) + 1;
    for (const i of r.items) qtyByItem[i.name] = (qtyByItem[i.name] || 0) + i.qty;
  }
  const best = Object.entries(qtyByItem).sort((a, b) => b[1] - a[1])[0];
  const peak = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];
  return { orders, revenue, avg: revenue / orders, best, peak, byHour };
}

export default function BuanAnalytics() {
  const { orders, revenue, avg, best, peak, byHour } = compute();
  const maxHour = Math.max(...Object.values(byHour));
  const cards: [string, string, string?][] = [
    ["Orders today", String(orders)],
    ["Revenue today", money(revenue)],
    ["Average order", money(avg)],
    ["Best seller", best ? best[0] : "–", best ? `${best[1]} sold` : ""],
    ["Peak hour", peak ? `${peak[0]}:00` : "–", peak ? `${peak[1]} orders` : ""],
    ["Missed sales", String(MISSED), "sold-out attempts"],
  ];
  return (
    <div className="min-h-screen bg-stone-950 px-6 py-10 text-stone-100">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <a href="/buan" className="text-lg font-extrabold tracking-tight">Buan</a>
          <ManageNav active="analytics" />
        </div>
        <h1 className="mt-4 text-xl font-bold">Analytics</h1>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {cards.map(([label, value, sub]) => (
            <div key={label} className="rounded-xl border border-stone-800 bg-stone-900 p-4">
              <div className="text-xs uppercase tracking-wide text-stone-500">{label}</div>
              <div className="mt-1 text-2xl font-extrabold tabular-nums">{value}</div>
              {sub ? <div className="text-xs text-stone-500">{sub}</div> : null}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-stone-800 bg-stone-900 p-4">
          <div className="text-xs uppercase tracking-wide text-stone-500">Orders by hour</div>
          <div className="mt-3 flex items-end gap-2" style={{ height: 96 }}>
            {Object.entries(byHour).map(([h, n]) => (
              <div key={h} className="flex flex-1 flex-col items-center justify-end">
                <div className="w-full rounded-t bg-emerald-400" style={{ height: `${(n / maxHour) * 80}px` }} />
                <div className="mt-1 text-[10px] text-stone-500">{h}:00</div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-stone-500">Buan P8 scaffold · sample data; live metrics from the orders table when Supabase is connected.</p>
      </div>
    </div>
  );
}
