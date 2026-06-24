"use client";

import { useState } from "react";
import { money } from "@/lib/buan/config";
import ManageNav from "@/components/buan/ManageNav";

/* Buan business orders dashboard (P8) – the counter/staff view. Live orders,
   advance status new -> preparing -> on its way -> delivered. Scaffold runs on
   sample data; wire to lib/buan listOrders + setStatus (poll) when Supabase is
   connected. Staff-facing (English). */

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

interface Order { id: string; name: string; items: { name: string; qty: number; price: number }[]; total: number; status: Status; slot: string; ago: string; }

let _n = 0;
const oid = () => "BN" + (4100 + ++_n);
const SEED: Order[] = [
  { id: oid(), name: "Sioned", items: [{ name: "Flat White", qty: 2, price: 3.2 }, { name: "Butter Croissant", qty: 1, price: 2.8 }], total: 9.2, status: "new", slot: "12:50", ago: "just now" },
  { id: oid(), name: "Marco", items: [{ name: "Bacon Roll", qty: 1, price: 4.5 }, { name: "Latte", qty: 1, price: 3.4 }], total: 7.9, status: "preparing", slot: "13:00", ago: "3 min ago" },
  { id: oid(), name: "Priya", items: [{ name: "Mocha", qty: 1, price: 3.6 }], total: 3.6, status: "enroute", slot: "12:40", ago: "8 min ago" },
];

export default function BuanOrders() {
  const [orders, setOrders] = useState<Order[]>(SEED);
  const advance = (id: string) => setOrders((xs) => xs.map((o) => (o.id === id ? { ...o, status: (NEXT[o.status] ?? o.status) } : o)));
  const active = orders.filter((o) => o.status !== "delivered");

  return (
    <div className="min-h-screen bg-stone-950 px-6 py-10 text-stone-100">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <a href="/buan" className="text-lg font-extrabold tracking-tight">Buan</a>
          <ManageNav active="orders" />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <h1 className="text-xl font-bold">Orders</h1>
          <span className="inline-flex items-center gap-1.5 text-sm text-stone-400"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />Live</span>
          <span className="ml-auto text-sm text-stone-400">{active.length} active</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-stone-800 bg-stone-900 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold">{o.name}</div>
                  <div className="text-xs text-stone-500">{o.id} · {o.ago}</div>
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
                  <button onClick={() => advance(o.id)} className="rounded-lg bg-emerald-400 px-3 py-1.5 text-sm font-bold text-emerald-950 hover:brightness-105">{BTN[o.status]}</button>
                ) : (
                  <span className="text-xs text-stone-500">✓ Done</span>
                )}
              </div>
              <div className="mt-2 text-right text-sm font-bold tabular-nums">{money(o.total)}</div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-stone-500">Buan P8 scaffold · sample orders; live order feed when Supabase is connected.</p>
      </div>
    </div>
  );
}
