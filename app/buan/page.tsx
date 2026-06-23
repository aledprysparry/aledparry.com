"use client";

import { useState } from "react";

/* Buan marketing landing (P1). Bilingual EN/CY (toggle, persisted).
   Welsh is FIRST-DRAFT — flagged for native review before launch. */

type Lang = "en" | "cy";

const T = {
  en: {
    nav_signin: "Sign in",
    hero_eyebrow: "QR ordering for physical businesses",
    hero_h: "Sell faster. Queue less.",
    hero_p: "Buan gives cafés, pop-ups, events and retailers a simple QR ordering system, with live stock, timed collection and easy setup.",
    cta_start: "Start free", cta_demo: "Watch demo",
    how_h: "How it works",
    how: [
      ["Create your business", "Add your products, opening hours and locations."],
      ["Print your QR code", "Every location gets its own QR code and ordering page."],
      ["Start taking orders", "Customers scan, order and collect when ready."],
    ],
    why_h: "Why businesses love Buan",
    why: ["Setup in minutes", "No app required", "Reduce queues", "Live stock management", "Multiple locations", "Timed collection slots", "End-of-day offers", "Works on any phone"],
    uses_h: "Built for anywhere people buy quickly",
    uses: ["Cafés & coffee shops", "Office & workplace catering", "EV charging stops", "Events & festivals", "Pop-ups & market stalls", "Service businesses"],
    nowebsite_h: "No website? No problem.",
    nowebsite_p: "Already have a website? Buan can use it to set up your ordering page fast. No website yet? Buan gives you a hosted ordering page with its own QR code and URL.",
    pricing_h: "Simple monthly pricing",
    pricing_p: "We're testing a simple subscription with a small transaction fee to cover payment processing. Pricing to be confirmed, from around £10/month during early testing.",
    lead_h: "Be an early business on Buan",
    lead_email: "Your email", lead_biz: "Business name", lead_type: "Business type (e.g. café)",
    lead_send: "Request early access", lead_sending: "Sending…",
    lead_ok: "Thanks — we'll be in touch.", lead_err: "Something went wrong. Try again.",
    footer: "Buan — the digital sales layer for physical businesses.",
    welsh_note: "Welsh shown is a first draft, pending native review.",
  },
  cy: {
    nav_signin: "Mewngofnodi",
    hero_eyebrow: "Archebu drwy god QR i fusnesau",
    hero_h: "Gwerthu'n gynt. Llai o giwio.",
    hero_p: "Mae Buan yn rhoi system archebu QR syml i gaffis, siopau dros dro, digwyddiadau a manwerthwyr, gyda stoc byw, casglu ar amser a sefydlu hawdd.",
    cta_start: "Dechrau am ddim", cta_demo: "Gweld y demo",
    how_h: "Sut mae'n gweithio",
    how: [
      ["Crëwch eich busnes", "Ychwanegwch eich cynnyrch, oriau agor a lleoliadau."],
      ["Argraffwch eich cod QR", "Mae pob lleoliad yn cael ei god QR a'i dudalen archebu ei hun."],
      ["Dechrau cymryd archebion", "Mae cwsmeriaid yn sganio, archebu a chasglu pan fydd yn barod."],
    ],
    why_h: "Pam mae busnesau wrth eu bodd â Buan",
    why: ["Sefydlu mewn munudau", "Dim angen ap", "Llai o giwiau", "Rheoli stoc byw", "Sawl lleoliad", "Slotiau casglu ar amser", "Cynigion diwedd dydd", "Gweithio ar unrhyw ffôn"],
    uses_h: "Wedi'i wneud ar gyfer unrhyw le mae pobl yn prynu'n gyflym",
    uses: ["Caffis a siopau coffi", "Arlwyo swyddfa a gweithle", "Mannau gwefru cerbydau trydan", "Digwyddiadau a gwyliau", "Siopau dros dro a stondinau", "Busnesau gwasanaeth"],
    nowebsite_h: "Dim gwefan? Dim problem.",
    nowebsite_p: "Gwefan gennych eisoes? Gall Buan ei defnyddio i sefydlu'ch tudalen archebu'n gyflym. Dim gwefan eto? Mae Buan yn rhoi tudalen archebu i chi gyda'i chod QR a'i URL ei hun.",
    pricing_h: "Prisio misol syml",
    pricing_p: "Rydyn ni'n profi tanysgrifiad syml gyda ffi trafodion fach i dalu am brosesu taliadau. Prisio i'w gadarnhau, o tua £10/mis yn ystod y cyfnod profi cynnar.",
    lead_h: "Byddwch yn un o fusnesau cynnar Buan",
    lead_email: "Eich e-bost", lead_biz: "Enw'r busnes", lead_type: "Math o fusnes (e.e. caffi)",
    lead_send: "Gofyn am fynediad cynnar", lead_sending: "Yn anfon…",
    lead_ok: "Diolch — fe fyddwn ni mewn cysylltiad.", lead_err: "Aeth rhywbeth o'i le. Rhowch gynnig arall.",
    footer: "Buan — yr haen werthu ddigidol i fusnesau go iawn.",
    welsh_note: "Drafft cyntaf yw'r Gymraeg, yn aros am adolygiad gan siaradwr iaith gyntaf.",
  },
} as const;

export default function BuanMarketing() {
  const [lang, setLang] = useState<Lang>("en");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const t = T[lang];

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setStatus("sending");
    try {
      const res = await fetch("/api/buan/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fd.get("email"),
          business_name: fd.get("business_name"),
          business_type: fd.get("business_type"),
        }),
      });
      setStatus(res.ok ? "ok" : "err");
    } catch {
      setStatus("err");
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <div className="text-lg font-extrabold tracking-tight">Buan</div>
        <div className="flex items-center gap-4">
          <div className="flex overflow-hidden rounded-full border border-stone-700 text-xs font-bold">
            {(["en", "cy"] as Lang[]).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={l === lang ? "bg-emerald-400 px-3 py-1 text-emerald-950" : "px-3 py-1 text-stone-400"}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <a href="/buan/login" className="text-sm text-stone-300 hover:text-white">{t.nav_signin}</a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-10 pt-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">{t.hero_eyebrow}</p>
        <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{t.hero_h}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-stone-300">{t.hero_p}</p>
        <div className="mt-7 flex justify-center gap-3">
          <a href="#start" className="rounded-lg bg-emerald-400 px-6 py-3 font-bold text-emerald-950 hover:brightness-105">{t.cta_start}</a>
          <a href="/app/msparc/tanio" className="rounded-lg border border-stone-700 px-6 py-3 font-semibold hover:border-emerald-400">{t.cta_demo}</a>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-center text-2xl font-bold">{t.how_h}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {t.how.map(([h, p], i) => (
            <div key={i} className="rounded-xl border border-stone-800 bg-stone-900 p-5">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-400 font-bold text-emerald-950">{i + 1}</div>
              <h3 className="mt-3 font-semibold">{h}</h3>
              <p className="mt-1 text-sm text-stone-400">{p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why / features */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-center text-2xl font-bold">{t.why_h}</h2>
        <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {t.why.map((f) => (
            <div key={f} className="rounded-lg border border-stone-800 bg-stone-900 px-3 py-3 text-center text-sm text-stone-200">✅ {f}</div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="text-center text-2xl font-bold">{t.uses_h}</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {t.uses.map((u) => (
            <div key={u} className="rounded-xl border border-stone-800 bg-stone-900 p-5 font-medium">{u}</div>
          ))}
        </div>
      </section>

      {/* No website */}
      <section className="mx-auto max-w-3xl px-6 py-12 text-center">
        <h2 className="text-2xl font-bold">{t.nowebsite_h}</h2>
        <p className="mt-3 text-stone-300">{t.nowebsite_p}</p>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-3xl px-6 py-12 text-center">
        <h2 className="text-2xl font-bold">{t.pricing_h}</h2>
        <p className="mx-auto mt-3 max-w-xl text-stone-300">{t.pricing_p}</p>
      </section>

      {/* Lead capture */}
      <section id="start" className="mx-auto max-w-md px-6 py-12">
        <h2 className="text-center text-2xl font-bold">{t.lead_h}</h2>
        {status === "ok" ? (
          <p className="mt-6 rounded-lg border border-emerald-500 bg-emerald-500/10 p-4 text-center text-emerald-300">{t.lead_ok}</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-3">
            <input name="email" type="email" required placeholder={t.lead_email}
              className="w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 focus:border-emerald-400 focus:outline-none" />
            <input name="business_name" placeholder={t.lead_biz}
              className="w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 focus:border-emerald-400 focus:outline-none" />
            <input name="business_type" placeholder={t.lead_type}
              className="w-full rounded-lg border border-stone-700 bg-stone-900 px-4 py-3 focus:border-emerald-400 focus:outline-none" />
            <button type="submit" disabled={status === "sending"}
              className="w-full rounded-lg bg-emerald-400 px-4 py-3 font-bold text-emerald-950 hover:brightness-105 disabled:opacity-50">
              {status === "sending" ? t.lead_sending : t.lead_send}
            </button>
            {status === "err" ? <p className="text-center text-sm text-red-400">{t.lead_err}</p> : null}
          </form>
        )}
      </section>

      <footer className="mx-auto max-w-5xl border-t border-stone-800 px-6 py-8 text-center text-sm text-stone-500">
        <p>{t.footer}</p>
        <p className="mt-1 text-xs text-stone-600">🏴 {t.welsh_note}</p>
      </footer>
    </div>
  );
}
