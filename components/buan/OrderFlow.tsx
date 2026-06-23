"use client";

import { useMemo, useState } from "react";
import { money } from "@/lib/buan/config";
import type { Business, Location, Product, Stock } from "@/lib/buan/types";

/* Buan customer ordering (P4). Multi-tenant menu -> basket -> details ->
   place order -> confirmation. Bilingual EN/CY (customer-facing). Posts to
   /api/buan/order (persists when Supabase is wired; simulates otherwise).
   Payment is P5 and collection slots are P6 — flagged, not yet built.
   Welsh is FIRST-DRAFT, flagged for native review. */

type Lang = "en" | "cy";
type Step = "menu" | "details" | "done";

const T = {
  en: {
    sub: "Order & collect", q: "What can we get you?", subtotal: "Subtotal",
    add_details: "Add your details →", where: "Almost done",
    name: "Your name", name_ph: "e.g. Sioned", contact: "Phone or email (for updates)",
    place: "Place order", placing: "Placing…", back: "← Back to menu",
    soldout: "Sold out", left: "left", note: "Payment and collection times arrive next (P5/P6).",
    done_h: "Order received!", done_sub: "Thanks {name} — we're on it.",
    order_line: "Order {id} · {total}", another: "Order again",
    welsh: "Welsh is a first draft, pending native review.",
  },
  cy: {
    sub: "Archebu a chasglu", q: "Beth gawn ni i chi?", subtotal: "Is-gyfanswm",
    add_details: "Ychwanegu eich manylion →", where: "Bron yna",
    name: "Eich enw", name_ph: "e.e. Sioned", contact: "Ffôn neu e-bost (ar gyfer diweddariadau)",
    place: "Gosod archeb", placing: "Yn gosod…", back: "← Yn ôl i'r fwydlen",
    soldout: "Wedi gwerthu allan", left: "ar ôl", note: "Bydd talu ac amseroedd casglu yn cyrraedd nesaf (P5/P6).",
    done_h: "Archeb wedi dod i law!", done_sub: "Diolch {name} — rydyn ni wrthi.",
    order_line: "Archeb {id} · {total}", another: "Archebu eto",
    welsh: "Drafft cyntaf yw'r Gymraeg, yn aros am adolygiad iaith gyntaf.",
  },
} as const;

const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");
function stockOf(p: Product): Stock | null {
  if (!p.stock) return null;
  return Array.isArray(p.stock) ? p.stock[0] ?? null : p.stock;
}
function soldOut(p: Product) {
  const s = stockOf(p);
  return s?.type === "out" || (s?.type === "limited" && s.qty <= 0);
}

export default function OrderFlow({
  business, location, menu, live,
}: {
  business: Business; location: Location; menu: Product[]; live: boolean;
}) {
  const [lang, setLang] = useState<Lang>("en");
  const [step, setStep] = useState<Step>("menu");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<{ id: string; total: number } | null>(null);
  const t = T[lang];
  const byId = useMemo(() => Object.fromEntries(menu.map((m) => [m.id, m])), [menu]);

  const adjust = (id: string, d: number) =>
    setCart((c) => {
      const q = Math.max(0, (c[id] || 0) + d);
      const n = { ...c };
      if (q === 0) delete n[id]; else n[id] = q;
      return n;
    });
  const lines = Object.entries(cart).map(([id, qty]) => ({ id, name: byId[id]?.name ?? "", qty, price: byId[id]?.price ?? 0 }));
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);

  async function place() {
    setPlacing(true);
    try {
      const res = await fetch("/api/buan/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: business.id, location_id: location.id,
          items: lines, total, customer_name: name.trim(), customer_contact: contact.trim(),
        }),
      });
      const j = await res.json();
      setPlaced({ id: j.order?.id ?? "BN0000", total });
      setStep("done");
    } catch {
      setPlaced({ id: "BN0000", total });
      setStep("done");
    } finally {
      setPlacing(false);
    }
  }
  const reset = () => { setCart({}); setName(""); setContact(""); setPlaced(null); setStep("menu"); };

  return (
    <div className="min-h-screen bg-stone-950 px-6 py-10 text-stone-100">
      <div className="mx-auto max-w-md">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">{business.name}</p>
            <h1 className="text-2xl font-bold">{location.name}</h1>
            <p className="text-xs text-stone-500">{t.sub}{live ? "" : " · demo"}</p>
          </div>
          <div className="flex overflow-hidden rounded-full border border-stone-700 text-xs font-bold">
            {(["en", "cy"] as Lang[]).map((l) => (
              <button key={l} onClick={() => setLang(l)} className={l === lang ? "bg-emerald-400 px-3 py-1 text-emerald-950" : "px-3 py-1 text-stone-400"}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {step === "menu" && (
          <>
            <h2 className="mt-7 text-lg font-bold">{t.q}</h2>
            <div className="mt-3 space-y-2">
              {menu.map((p) => {
                const s = stockOf(p); const out = soldOut(p);
                return (
                  <div key={p.id} className={`flex items-center gap-3 rounded-lg border border-stone-800 bg-stone-900 p-3 ${out ? "opacity-50" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{p.name}</div>
                      {p.description ? <div className="truncate text-xs text-stone-500">{p.description}</div> : null}
                      {s?.type === "limited" && s.qty > 0 ? <div className="text-xs text-amber-400">{s.qty} {t.left}</div> : null}
                    </div>
                    <div className="font-semibold tabular-nums text-emerald-400">{money(p.price)}</div>
                    {out ? (
                      <span className="text-xs font-semibold uppercase text-stone-500">{t.soldout}</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button onClick={() => adjust(p.id, -1)} className={qbtn}>-</button>
                        <span className="w-6 text-center tabular-nums font-bold">{cart[p.id] || 0}</span>
                        <button onClick={() => adjust(p.id, 1)} className={qbtn}>+</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 rounded-xl border border-stone-800 bg-stone-900 p-4">
              <div className="flex justify-between"><span className="text-stone-400">{t.subtotal}</span><span className="font-bold tabular-nums">{money(total)}</span></div>
              <button disabled={total === 0} onClick={() => setStep("details")} className="mt-3 w-full rounded-lg bg-emerald-400 px-4 py-3 font-bold text-emerald-950 hover:brightness-105 disabled:opacity-40">{t.add_details}</button>
            </div>
          </>
        )}

        {step === "details" && (
          <div className="mt-7 rounded-xl border border-stone-800 bg-stone-900 p-5">
            <h2 className="mb-4 text-lg font-bold">{t.where}</h2>
            <label className="mb-3 block"><span className="mb-1 block text-sm text-stone-400">{t.name}</span>
              <input className={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder={t.name_ph} /></label>
            <label className="mb-1 block"><span className="mb-1 block text-sm text-stone-400">{t.contact}</span>
              <input className={inp} value={contact} onChange={(e) => setContact(e.target.value)} /></label>
            <p className="mt-3 rounded-lg border border-stone-800 bg-stone-950 px-3 py-2 text-xs text-stone-500">{t.note}</p>
            <button disabled={!name.trim() || placing} onClick={place} className="mt-4 w-full rounded-lg bg-emerald-400 px-4 py-3 font-bold text-emerald-950 hover:brightness-105 disabled:opacity-40">{placing ? t.placing : t.place}</button>
            <button onClick={() => setStep("menu")} className="mt-2 w-full rounded-lg border border-stone-700 px-4 py-3 font-semibold hover:border-emerald-400">{t.back}</button>
          </div>
        )}

        {step === "done" && placed && (
          <div className="mt-10 rounded-xl border border-stone-800 bg-stone-900 p-6 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-400 text-3xl text-emerald-950">✓</div>
            <h2 className="mt-4 text-xl font-bold">{t.done_h}</h2>
            <p className="mt-1 text-stone-400">{fill(t.done_sub, { name: name || "" }).replace(/\s+—/, " —")}</p>
            <p className="mt-3 text-sm text-stone-500">{fill(t.order_line, { id: placed.id, total: money(placed.total) })}</p>
            <button onClick={reset} className="mt-6 w-full rounded-lg border border-stone-700 px-4 py-3 font-semibold hover:border-emerald-400">{t.another}</button>
          </div>
        )}

        <p className="mt-8 text-center text-[11px] text-stone-600">🏴 {t.welsh}</p>
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg border border-stone-700 bg-stone-950 px-4 py-3 text-stone-100 focus:border-emerald-400 focus:outline-none";
const qbtn = "grid h-7 w-7 place-items-center rounded border border-stone-700 bg-stone-800 hover:border-emerald-400";
