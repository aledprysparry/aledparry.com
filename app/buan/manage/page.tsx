"use client";

import { useMemo, useState } from "react";
import { money } from "@/lib/buan/config";

/* Buan menu manager (P3). Business-side product + stock management:
   add/edit/remove items, categories, visibility, and live stock
   (unlimited / limited+qty / sold out) with low-stock indicators.

   Scaffold: fully functional on in-browser state so it's demoable now;
   the lib/buan/api product+stock CRUD wires it to Supabase once a project
   + sign-in are connected. Admin-facing, English (bilingual admin = follow-up). */

const LOW_STOCK = 5;
type StockType = "unlimited" | "limited" | "out";
interface Item {
  id: string;
  name: string;
  price: number;
  category: string;
  prep: number;
  visible: boolean;
  stockType: StockType;
  qty: number;
}

let _id = 100;
const nid = () => "p" + ++_id;

const SEED: Item[] = [
  { id: nid(), name: "Flat White", price: 3.2, category: "Coffee", prep: 4, visible: true, stockType: "unlimited", qty: 0 },
  { id: nid(), name: "Latte", price: 3.4, category: "Coffee", prep: 4, visible: true, stockType: "unlimited", qty: 0 },
  { id: nid(), name: "Bacon Roll", price: 4.5, category: "Kitchen", prep: 12, visible: true, stockType: "limited", qty: 4 },
  { id: nid(), name: "Blueberry Muffin", price: 2.9, category: "Bakery", prep: 0, visible: true, stockType: "limited", qty: 0 },
];

export default function BuanManage() {
  const [items, setItems] = useState<Item[]>(SEED);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [prep, setPrep] = useState("");
  const [offerPct, setOfferPct] = useState("20");
  const [offerActive, setOfferActive] = useState(false);
  const inOffer = (it: Item) => offerActive && it.stockType === "limited" && it.qty > 0;

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price) return;
    setItems((xs) => [
      ...xs,
      { id: nid(), name: name.trim(), price: parseFloat(price) || 0, category: category.trim() || "Other", prep: parseInt(prep) || 0, visible: true, stockType: "unlimited", qty: 0 },
    ]);
    setName(""); setPrice(""); setCategory(""); setPrep("");
  }
  const patch = (id: string, p: Partial<Item>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const remove = (id: string) => setItems((xs) => xs.filter((x) => x.id !== id));

  const byCat = useMemo(() => {
    const m: Record<string, Item[]> = {};
    for (const it of items) (m[it.category] ||= []).push(it);
    return m;
  }, [items]);

  const lowCount = items.filter((i) => i.stockType === "limited" && i.qty > 0 && i.qty <= LOW_STOCK).length;
  const outCount = items.filter((i) => i.stockType === "out" || (i.stockType === "limited" && i.qty <= 0)).length;

  return (
    <div className="min-h-screen bg-stone-950 px-6 py-10 text-stone-100">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <a href="/buan" className="text-lg font-extrabold tracking-tight">Buan</a>
          <span className="text-sm text-stone-400">Menu</span>
        </div>

        <div className="mt-4 flex gap-3 text-xs">
          <span className="rounded-full bg-stone-800 px-3 py-1">{items.length} items</span>
          {lowCount > 0 && <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-300">{lowCount} low stock</span>}
          {outCount > 0 && <span className="rounded-full bg-red-500/15 px-3 py-1 text-red-300">{outCount} sold out</span>}
        </div>

        {/* end-of-day offer */}
        <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="text-sm font-semibold text-amber-200">🕒 Closing soon?</div>
          <p className="mt-0.5 text-xs text-stone-400">Clear remaining stock with a quick discount on your limited-stock items. Customers see it instantly on the menu.</p>
          {offerActive ? (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-amber-300">Live: {offerPct}% off remaining stock</span>
              <button onClick={() => setOfferActive(false)} className="rounded border border-stone-700 px-3 py-1.5 text-xs hover:border-emerald-400">End offer</button>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2">
              <input value={offerPct} onChange={(e) => setOfferPct(e.target.value)} inputMode="numeric" className={`${inp} w-20`} />
              <span className="text-sm text-stone-400">% off</span>
              <button onClick={() => setOfferActive(true)} className="ml-auto rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-amber-950 hover:brightness-105">Launch offer</button>
            </div>
          )}
        </div>

        {/* add item */}
        <form onSubmit={add} className="mt-5 rounded-xl border border-stone-800 bg-stone-900/60 p-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <input className={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" />
            <input className={inp} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="£ price" inputMode="decimal" />
            <input className={inp} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
            <input className={inp} value={prep} onChange={(e) => setPrep(e.target.value)} placeholder="Prep min" inputMode="numeric" />
          </div>
          <button className="mt-3 w-full rounded-lg bg-emerald-400 px-4 py-2.5 font-bold text-emerald-950 hover:brightness-105">Add item</button>
        </form>

        {/* list by category */}
        <div className="mt-6 space-y-6">
          {Object.entries(byCat).map(([cat, list]) => (
            <div key={cat}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">{cat}</h2>
              <div className="space-y-2">
                {list.map((it) => {
                  const soldOut = it.stockType === "out" || (it.stockType === "limited" && it.qty <= 0);
                  const low = it.stockType === "limited" && it.qty > 0 && it.qty <= LOW_STOCK;
                  return (
                    <div key={it.id} className={`rounded-lg border p-3 ${it.visible ? "border-stone-800 bg-stone-900" : "border-stone-800/60 bg-stone-900/40 opacity-60"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold">{it.name} <span className="ml-1 text-sm font-normal text-stone-400 tabular-nums">{money(it.price)}</span>
                            {inOffer(it) ? <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">{offerPct}% off</span> : null}</div>
                          <div className="text-xs text-stone-500">{it.prep > 0 ? `${it.prep} min prep` : "ready to go"}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {soldOut ? <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-300">Sold out</span>
                            : low ? <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-300">Only {it.qty} left</span>
                            : it.stockType === "limited" ? <span className="text-xs text-stone-400">{it.qty} in stock</span>
                            : <span className="text-xs text-stone-500">Unlimited</span>}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <select value={it.stockType} onChange={(e) => patch(it.id, { stockType: e.target.value as StockType })}
                          className="rounded border border-stone-700 bg-stone-800 px-2 py-1">
                          <option value="unlimited">Unlimited</option>
                          <option value="limited">Limited</option>
                          <option value="out">Sold out</option>
                        </select>
                        {it.stockType === "limited" && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => patch(it.id, { qty: Math.max(0, it.qty - 1) })} className={qbtn}>-</button>
                            <span className="w-7 text-center tabular-nums">{it.qty}</span>
                            <button onClick={() => patch(it.id, { qty: it.qty + 1 })} className={qbtn}>+</button>
                          </div>
                        )}
                        <button onClick={() => patch(it.id, { visible: !it.visible })} className="rounded border border-stone-700 px-2 py-1 hover:border-emerald-400">
                          {it.visible ? "Hide" : "Show"}
                        </button>
                        <button onClick={() => remove(it.id)} className="ml-auto rounded border border-stone-700 px-2 py-1 text-stone-400 hover:border-red-400 hover:text-red-300">Remove</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-stone-500">
          Buan P3 scaffold · changes are in-browser until Supabase + sign-in are connected.
        </p>
      </div>
    </div>
  );
}

const inp = "rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100 focus:border-emerald-400 focus:outline-none";
const qbtn = "grid h-6 w-6 place-items-center rounded border border-stone-700 bg-stone-800 hover:border-emerald-400";
