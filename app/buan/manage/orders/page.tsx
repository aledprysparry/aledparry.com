"use client";

import { useEffect, useState } from "react";
import { money } from "@/lib/buan/config";
import ManageNav from "@/components/buan/ManageNav";

/* Buan business orders dashboard (P8) – the counter/staff view. Live orders,
   advance status new -> preparing -> on its way -> delivered. Scaffold runs on
   sample data; wire to lib/buan listOrders + setStatus (poll) when Supabase is
   connected. Staff-facing (English).

   Stale-order nudge: each order tracks how long it has sat in its current status
   (the clock resets every time staff advance it). If it sits past the per-status
   threshold below, the card is flagged "needs attention" and floats to the top so
   nothing is silently forgotten. */

type Status = "new" | "preparing" | "enroute" | "delivered";
const NEXT: Record<Status, Status | null> = { new: "preparing", preparing: "enroute", enroute: "delivered", delivered: null };
const LABEL: Record<Status, string> = { new: "New", preparing: "Preparing", enroute: "On its way", delivered: "Delivered" };
const BTN: Record<Status, string> = { new: "Start preparing", preparing: "Out for delivery", enroute: "Mark delivered", delivered: "" };
const PILL: Record<Status, string> = {
  new: "bg-amber-500/15 text-amber-300",
  preparing: "bg-emerald-500/15 text-emerald-300",
  enroute: "bg-sky-500/15 text-sky-300",
  delivered: "bg-stone-700/40 text-stone-400",
};

// Minutes an order may sit in a status before staff get nudged.
const STALE_AFTER: Record<Status, number> = { new: 4, preparing: 12, enroute: 10, delivered: Infinity };
// What the nudge tells staff to do about it.
const NUDGE_HINT: Record<Status, string> = {
  new: "Not started yet – start preparing, or check with the customer.",
  preparing: "Sitting in prep a while – check the kitchen or update the customer.",
  enroute: "Ready for a while – has it been collected?",
  delivered: "",
};

interface Order { id: string; name: string; items: { name: string; qty: number; price: number }[]; total: number; status: Status; slot: string; baseSecs: number; markTick: number; }

let _n = 0;
const oid = () => "BN" + (4100 + ++_n);
const SEED: Order[] = [
  { id: oid(), name: "Sioned", items: [{ name: "Flat White", qty: 2, price: 3.2 }, { name: "Butter Croissant", qty: 1, price: 2.8 }], total: 9.2, status: "new", slot: "12:50", baseSecs: 360, markTick: 0 },
  { id: oid(), name: "Marco", items: [{ name: "Bacon Roll", qty: 1, price: 4.5 }, { name: "Latte", qty: 1, price: 3.4 }], total: 7.9, status: "preparing", slot: "13:00", baseSecs: 180, markTick: 0 },
  { id: oid(), name: "Priya", items: [{ name: "Mocha", qty: 1, price: 3.6 }], total: 3.6, status: "enroute", slot: "12:40", baseSecs: 510, markTick: 0 },
];

// Seconds the order has been in its current status. tick is seconds-since-mount
// (0 on the server + first client render, so there is no hydration mismatch).
const elapsedSecs = (o: Order, tick: number) => (o.markTick === 0 ? o.baseSecs : 0) + (tick - o.markTick);
const fmtAgo = (secs: number) => { const m = Math.floor(secs / 60); return m < 1 ? "just now" : `${m} min ago`; };
const fmtWait = (secs: number) => { const m = Math.max(1, Math.floor(secs / 60)); return `${m} min`; };
const isStale = (o: Order, tick: number) => o.status !== "delivered" && elapsedSecs(o, tick) >= STALE_AFTER[o.status] * 60;

export default function BuanOrders() {
  const [orders, setOrders] = useState<Order[]>(SEED);
  const [tick, setTick] = useState(0); // seconds since mount; drives the live clocks

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 10), 10_000);
    return () => clearInterval(id);
  }, []);

  // Advancing resets this order's clock (markTick) so staleness measures the new status.
  const advance = (id: string) =>
    setOrders((xs) => xs.map((o) => (o.id === id ? { ...o, status: NEXT[o.status] ?? o.status, markTick: tick } : o)));

  const active = orders.filter((o) => o.status !== "delivered");
  const staleCount = active.filter((o) => isStale(o, tick)).length;
  // Needs-attention floats to the top; otherwise keep insertion order (stable sort).
  const view = [...orders].sort((a, b) => {
    const rank = (o: Order) => (o.status === "delivered" ? 2 : isStale(o, tick) ? 0 : 1);
    return rank(a) - rank(b);
  });

  return (
    <div className="min-h-screen bg-stone-950 px-6 py-10 text-stone-100">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <a href="/buan" className="text-lg font-extrabold tracking-tight">Buan</a>
          <ManageNav active="orders" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold">Orders</h1>
          <span className="inline-flex items-center gap-1.5 text-sm text-stone-400"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />Live</span>
          {staleCount > 0 && (
            <span aria-live="polite" className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
              {staleCount} need{staleCount === 1 ? "s" : ""} attention
            </span>
          )}
          <span className="ml-auto text-sm text-stone-400">{active.length} active</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {view.map((o) => {
            const secs = elapsedSecs(o, tick);
            const stale = isStale(o, tick);
            return (
              <div key={o.id} className={`rounded-xl border bg-stone-900 p-4 transition-colors ${stale ? "border-amber-500/60 ring-1 ring-amber-500/25" : "border-stone-800"}`}>
                {stale && (
                  <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    <span className="mt-0.5 shrink-0" aria-hidden>⏱</span>
                    <span><span className="font-bold">Waiting {fmtWait(secs)} in “{LABEL[o.status]}”.</span> {NUDGE_HINT[o.status]}</span>
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold">{o.name}</div>
                    <div className="text-xs text-stone-500">{o.id} · {fmtAgo(secs)}</div>
                  </div>
                  <div className="rounded-lg bg-emerald-400 px-2.5 py-1 text-center text-emerald-950">
                    <div className="text-[9px] font-bold uppercase tracking-wide opacity-70">Collect</div>
                    <div className="text-sm font-extrabold tabular-nums">{o.slot}</div>
                  </div>
                </div>
                <ul className="mt-3 space-y-0.5 text-sm">
                  {o.items.map((i, idx) => (
                    <li key={idx} className="flex justify-between"><span><span className="font-bold text-emerald-400">{i.qty}×</span> {i.name}</span><span className="tabular-nums">{money(i.qty * i.price)}</span></li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-stone-800 pt-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${PILL[o.status]}`}>{LABEL[o.status]}</span>
                  {NEXT[o.status] ? (
                    <button onClick={() => advance(o.id)} className={`rounded-lg px-3 py-1.5 text-sm font-bold hover:brightness-105 ${stale ? "bg-amber-400 text-amber-950" : "bg-emerald-400 text-emerald-950"}`}>{BTN[o.status]}</button>
                  ) : (
                    <span className="text-xs text-stone-500">✓ Done</span>
                  )}
                </div>
                <div className="mt-2 text-right text-sm font-bold tabular-nums">{money(o.total)}</div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-stone-500">Buan P8 scaffold · sample orders; live order feed + nudge thresholds when Supabase is connected.</p>
      </div>
    </div>
  );
}
