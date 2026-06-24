"use client";

import { useMemo, useState } from "react";
import { money } from "@/lib/buan/config";
import { prepMinutesFrom, collectionSlots, quietest, labelFor } from "@/lib/buan/slots";
import { effectivePrice, discountPct } from "@/lib/buan/offers";
import type { Offer } from "@/lib/buan/offers";
import type { Business, Location, Product, Stock } from "@/lib/buan/types";

/* Buan customer ordering (P4-P6). Multi-tenant menu -> basket -> details +
   collection slot -> payment -> confirmation. Bilingual EN/CY (customer-facing).
   Posts to /api/buan/order (persists when Supabase is wired; simulates otherwise).
   Prep estimate + staggered slots + busy-slot nudge from lib/buan/slots.
   Welsh is FIRST-DRAFT, flagged for native review. */

type Lang = "en" | "cy";
type Step = "menu" | "details" | "pay" | "done";

const T = {
  en: {
    sub: "Order & collect", q: "What can we get you?", subtotal: "Subtotal",
    add_details: "Add your details →", where: "Almost done",
    name: "Your name", name_ph: "e.g. Sioned", contact: "Phone or email (for updates)",
    to_pay: "Continue to payment →", back: "← Back to menu",
    pay_h: "Payment", total_pay: "Total to pay", card_label: "Card number (demo, not charged)",
    pay_btn: "Pay {total}", paying: "Processing…", back_details: "← Back",
    pay_note: "No real payment is taken. This simulates a successful charge.",
    soldout: "Sold out", left: "left",
    collect_h: "Collection time", ready_in: "Ready in about {n} min", busy_tag: "busy",
    nudge: "{t} looks busy. {alt} will be quicker.", collect_label: "Collect at {t}",
    done_h: "Order received!", done_sub: "Thanks {name}, we're on it.",
    order_line: "Order {id} · {total}", another: "Order again",
    welsh: "Welsh is a first draft, pending native review.",
  },
  cy: {
    sub: "Archebu a chasglu", q: "Beth gawn ni i chi?", subtotal: "Is-gyfanswm",
    add_details: "Ychwanegu eich manylion →", where: "Bron yna",
    name: "Eich enw", name_ph: "e.e. Sioned", contact: "Ffôn neu e-bost (ar gyfer diweddariadau)",
    to_pay: "Ymlaen i dalu →", back: "← Yn ôl i'r fwydlen",
    pay_h: "Talu", total_pay: "Cyfanswm i'w dalu", card_label: "Rhif cerdyn (demo, dim tâl)",
    pay_btn: "Talu {total}", paying: "Yn prosesu…", back_details: "← Yn ôl",
    pay_note: "Ni chodir tâl go iawn. Mae hyn yn dynwared taliad llwyddiannus.",
    soldout: "Wedi gwerthu allan", left: "ar ôl",
    collect_h: "Amser casglu", ready_in: "Yn barod mewn tua {n} munud", busy_tag: "prysur",
    nudge: "Mae {t} yn brysur. Bydd {alt} yn gynt.", collect_label: "Casglu am {t}",
    done_h: "Archeb wedi dod i law!", done_sub: "Diolch {name}, rydyn ni wrthi.",
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
  business, location, menu, live, offers = [],
}: {
  business: Business; location: Location; menu: Product[]; live: boolean; offers?: Offer[];
}) {
  const [lang, setLang] = useState<Lang>("en");
  const [step, setStep] = useState<Step>("menu");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<{ id: string; total: number; slot: string } | null>(null);
  const [nowMs] = useState(() => Date.now());
  const [slot, setSlot] = useState("");
  const t = T[lang];
  const byId = useMemo(() => Object.fromEntries(menu.map((m) => [m.id, m])), [menu]);

  const adjust = (id: string, d: number) =>
    setCart((c) => {
      const q = Math.max(0, (c[id] || 0) + d);
      const n = { ...c };
      if (q === 0) delete n[id]; else n[id] = q;
      return n;
    });
  const lines = Object.entries(cart).map(([id, qty]) => ({ id, name: byId[id]?.name ?? "", qty, price: byId[id] ? effectivePrice(byId[id], offers) : 0 }));
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);

  const prepMins = prepMinutesFrom(Object.keys(cart).map((id) => byId[id]?.prep_time_mins ?? 0));
  const slots = useMemo(() => collectionSlots(prepMins, 5, nowMs), [prepMins, nowMs]);
  const selectedSlot = slot || quietest(slots)?.iso || "";
  const quiet = quietest(slots);
  const selectedBusy = slots.find((s) => s.iso === selectedSlot)?.busy ?? false;

  async function place() {
    setPlacing(true);
    try {
      const res = await fetch("/api/buan/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: business.id, location_id: location.id,
          items: lines, total, customer_name: name.trim(), customer_contact: contact.trim(),
          collection_slot: selectedSlot,
        }),
      });
      const j = await res.json();
      setPlaced({ id: j.order?.id ?? "BN0000", total, slot: labelFor(selectedSlot, slots) });
      setStep("done");
    } catch {
      setPlaced({ id: "BN0000", total, slot: labelFor(selectedSlot, slots) });
      setStep("done");
    } finally {
      setPlacing(false);
    }
  }
  const reset = () => { setCart({}); setName(""); setContact(""); setSlot(""); setPlaced(null); setStep("menu"); };

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
              <button key={l} onClick={() => setLang(l)} lang={l} aria-pressed={l === lang} aria-label={l === "cy" ? "Newid i'r Gymraeg" : "Switch to English"} className={l === lang ? "bg-emerald-400 px-3 py-1 text-emerald-950" : "px-3 py-1 text-stone-400"}>{l === "cy" ? "Cymraeg" : "English"}</button>
            ))}
          </div>
        </div>

        {step === "menu" && (
          <>
            <h2 className="mt-7 text-lg font-bold">{t.q}</h2>
            <div className="mt-3 space-y-2">
              {menu.map((p) => {
                const s = stockOf(p); const out = soldOut(p);
                const dp = discountPct(p.id, offers); const eff = effectivePrice(p, offers);
                return (
                  <div key={p.id} className={`flex items-center gap-3 rounded-lg border border-stone-800 bg-stone-900 p-3 ${out ? "opacity-50" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{p.name}</div>
                      {p.description ? <div className="truncate text-xs text-stone-500">{p.description}</div> : null}
                      {s?.type === "limited" && s.qty > 0 ? <div className="text-xs text-amber-400">{s.qty} {t.left}</div> : null}
                    </div>
                    {dp > 0 ? (
                      <div className="text-right">
                        <div className="text-xs text-stone-500 line-through tabular-nums">{money(p.price)}</div>
                        <div className="font-semibold tabular-nums text-emerald-400">{money(eff)}</div>
                        <div className="text-[10px] font-bold uppercase text-amber-400">{dp}% off</div>
                      </div>
                    ) : (
                      <div className="font-semibold tabular-nums text-emerald-400">{money(p.price)}</div>
                    )}
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
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-400">{t.collect_h}</span>
                {prepMins > 0 ? <span className="text-xs text-stone-500">{fill(t.ready_in, { n: String(prepMins) })}</span> : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {slots.map((sl) => (
                  <button key={sl.iso} onClick={() => setSlot(sl.iso)}
                    className={`rounded-lg border px-3 py-2 text-sm ${selectedSlot === sl.iso ? "border-emerald-400 bg-emerald-400/10 text-emerald-300" : "border-stone-700 text-stone-300 hover:border-emerald-400"}`}>
                    {sl.label}{sl.busy ? <span className="ml-1 text-[10px] uppercase text-amber-400">{t.busy_tag}</span> : null}
                  </button>
                ))}
              </div>
              {selectedBusy && quiet ? (
                <p className="mt-2 text-xs text-amber-300">{fill(t.nudge, { t: labelFor(selectedSlot, slots), alt: quiet.label })}</p>
              ) : null}
            </div>
            <button disabled={!name.trim()} onClick={() => setStep("pay")} className="mt-4 w-full rounded-lg bg-emerald-400 px-4 py-3 font-bold text-emerald-950 hover:brightness-105 disabled:opacity-40">{t.to_pay}</button>
            <button onClick={() => setStep("menu")} className="mt-2 w-full rounded-lg border border-stone-700 px-4 py-3 font-semibold hover:border-emerald-400">{t.back}</button>
          </div>
        )}

        {step === "pay" && (
          <div className="mt-7 rounded-xl border border-stone-800 bg-stone-900 p-5">
            <h2 className="mb-4 text-lg font-bold">{t.pay_h}</h2>
            <div className="flex justify-between border-b border-stone-800 pb-3 text-sm">
              <span className="text-stone-400">{t.total_pay}</span>
              <span className="font-bold tabular-nums">{money(total)}</span>
            </div>
            <label className="mb-1 mt-4 block"><span className="mb-1 block text-sm text-stone-400">{t.card_label}</span>
              <input className={inp} defaultValue="4242 4242 4242 4242" inputMode="numeric" /></label>
            <button disabled={placing} onClick={place} className="mt-4 w-full rounded-lg bg-emerald-400 px-4 py-3 font-bold text-emerald-950 hover:brightness-105 disabled:opacity-40">{placing ? t.paying : fill(t.pay_btn, { total: money(total) })}</button>
            <button onClick={() => setStep("details")} className="mt-2 w-full rounded-lg border border-stone-700 px-4 py-3 font-semibold hover:border-emerald-400">{t.back_details}</button>
            <p className="mt-3 text-center text-xs text-stone-500">{t.pay_note}</p>
          </div>
        )}

        {step === "done" && placed && (
          <div className="mt-10 rounded-xl border border-stone-800 bg-stone-900 p-6 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-400 text-3xl text-emerald-950">✓</div>
            <h2 className="mt-4 text-xl font-bold">{t.done_h}</h2>
            <p className="mt-1 text-stone-400">{fill(t.done_sub, { name: name || "" })}</p>
            <p className="mt-3 text-sm text-stone-500">{fill(t.order_line, { id: placed.id, total: money(placed.total) })}</p>
            {placed.slot ? <div className="mt-3 inline-block rounded-full border border-emerald-500 bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-300">{fill(t.collect_label, { t: placed.slot })}</div> : null}
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
