"use client";

/* ============================================================
   Buan – marketing landing (Phase 1)
   "The digital sales layer for physical businesses."
   Buan (adj.) = Welsh for fast / quick.

   Grown from the Tanio QR-ordering demo in this repo, but the
   marketing site is independent of the product build. This file
   is a self-contained bilingual (EN/CY) landing experience with
   its own copy dictionary + language toggle, matching Tanio's
   bilingual approach. Rendered with the site's Tailwind tokens.

   Sections: hero · how-it-works (3 steps) · use-cases grid ·
   key features · "No website? No problem" · flexible pricing
   (clearly TBC) · early-access lead form (stubbed submit).

   ⚠️ WELSH COPY IS A FIRST DRAFT – NOT FINAL.
   All Cymraeg below was drafted for this build and has NOT been
   checked by a native speaker. It is naturalised rather than
   literal, but it must be reviewed before any public release.
   A slim notice bar surfaces this in-product on this branch.
   ============================================================ */

import { useState, useEffect, useCallback } from "react";

const DEFAULT_LANG = "en";
const LANG_KEY = "buan_lang";

type Lang = "en" | "cy";

/* ---------------------------------------------------------------- */
/*  Bilingual copy                                                   */
/* ---------------------------------------------------------------- */
const COPY = {
  en: {
    // chrome
    reviewFlag: "First-draft Welsh – pending native-speaker review.",
    nav_how: "How it works",
    nav_uses: "Use cases",
    nav_pricing: "Pricing",
    nav_cta: "Get early access",
    back: "aledparry.com",

    // hero
    hero_eyebrow: "The digital sales layer for physical businesses",
    hero_title_a: "Sell faster.",
    hero_title_b: "Queue less.",
    hero_sub: "Order faster. Collect smarter.",
    hero_lede:
      "Buan turns any spot into a point of sale. Customers scan a QR code, order and pay on their phone, and you take orders without the queue, the hardware or the wait.",
    hero_cta_primary: "Get early access",
    hero_cta_secondary: "See how it works",
    hero_name_note: "Buan (adj.) – Welsh for fast.",

    // phone mock
    mock_business: "Caffi Buan",
    mock_tagline: "Scan · order · collect",
    mock_item1: "Flat White",
    mock_item2: "Bacon Roll",
    mock_item3: "Blueberry Muffin",
    mock_total: "Total",
    mock_pay: "Order & pay",

    // how it works
    how_eyebrow: "How it works",
    how_heading: "Up and running in minutes",
    how_sub: "No app to build, no hardware to buy.",
    how_s1_t: "Create your business",
    how_s1_b:
      "Add your menu or product list, set your prices, and choose how customers collect or are served.",
    how_s2_t: "Print your QR code",
    how_s2_b:
      "Put your unique Buan code on a table, a counter, a poster or a charging bay. That is your whole storefront.",
    how_s3_t: "Start taking orders",
    how_s3_b:
      "Customers scan, order and pay in seconds. Orders land on your dashboard the moment they are placed.",

    // use cases
    uses_eyebrow: "Where Buan works",
    uses_heading: "One tool, many counters",
    uses_sub: "If people queue, pay or collect, Buan fits.",
    use_hospitality_t: "Hospitality",
    use_hospitality_b:
      "Cafés, pubs, food trucks and restaurants – order at the table or to the car.",
    use_workplace_t: "Workplace & office catering",
    use_workplace_b:
      "Staff canteens and office coffee runs, ordered ahead and collected without the crush.",
    use_ev_t: "EV charging",
    use_ev_b:
      "Order food and drink while you charge, ready by the time your car is.",
    use_events_t: "Events & festivals",
    use_events_b:
      "Cut bar and food queues with order-ahead and pay-on-phone at every stall.",
    use_retail_t: "Retail",
    use_retail_b:
      "Let customers browse, reserve and pay from the shop floor or the shelf edge.",
    use_service_t: "Service businesses",
    use_service_b:
      "Take bookings, deposits and orders without a website or a card machine.",

    // features
    feat_eyebrow: "What's included",
    feat_heading: "Everything you need to start selling",
    feat: [
      ["📲", "QR ordering & payment", "Customers pay on their phone. Nothing to download."],
      ["📋", "Live orders dashboard", "See orders as they arrive and move them through to done."],
      ["🍽️", "Your own menu or catalogue", "Add items, prices, photos and options in minutes."],
      ["🏴", "Bilingual by default", "Welsh and English, switchable for every customer."],
      ["📱", "Works on any phone", "No app, no hardware, no card reader required."],
      ["💷", "Simple, flexible pricing", "A low monthly cost while we test together."],
    ] as [string, string, string][],

    // no website
    nw_heading: "No website? No problem.",
    nw_body:
      "Buan is your storefront. Your QR code is a working shop your customers can order from today – no domain, no design project, no developer. Already have a website? Add Buan to it with a single link.",
    nw_point1: "Live the day you sign up",
    nw_point2: "Share it as a link, poster or sticker",
    nw_point3: "Slots into an existing site if you have one",

    // pricing
    price_eyebrow: "Pricing",
    price_heading: "Simple monthly pricing",
    price_sub: "One plan, no surprises. We're still in early testing, so the numbers below are indicative.",
    price_from: "from around",
    price_amount: "£10",
    price_per: "/month",
    price_tag: "Early-testing price · to be confirmed",
    price_bullets: [
      "One simple monthly fee",
      "No setup cost while we test",
      "Cancel any time",
      "Final pricing confirmed before launch",
    ],
    price_disclaimer:
      "Prices shown are indicative and may change. Final pricing will be confirmed before general release.",
    price_cta: "Register your interest",

    // lead form
    lead_eyebrow: "Early access",
    lead_heading: "Be one of the first to use Buan",
    lead_sub:
      "Tell us a little about your business and we'll be in touch as we open up early access.",
    lead_name: "Your name",
    lead_name_ph: "e.g. Sioned",
    lead_business: "Business name",
    lead_business_ph: "e.g. Caffi'r Cei",
    lead_email: "Email",
    lead_email_ph: "you@business.com",
    lead_type: "Type of business",
    lead_type_options: [
      "Hospitality",
      "Workplace / office catering",
      "EV charging",
      "Events / festivals",
      "Retail",
      "Service business",
      "Something else",
    ],
    lead_type_ph: "Choose one",
    lead_message: "Anything else? (optional)",
    lead_message_ph: "Tell us what you'd want from Buan.",
    lead_submit: "Request early access",
    lead_sending: "Sending…",
    lead_success_t: "Diolch!",
    lead_success_b: "You're on the list. We'll be in touch as early access opens.",
    lead_again: "Send another",
    lead_privacy: "We'll only use your details to talk to you about Buan.",
    lead_preview: "Preview: submissions reach a stub endpoint only and aren't stored yet.",
    lead_err_name: "Please add your name.",
    lead_err_email: "Please add a valid email.",

    // footer
    foot_tagline: "The digital sales layer for physical businesses.",
    foot_note: "Buan is an early-stage product concept. Pricing and features are indicative and subject to change.",
    foot_lang: "Iaith",
  },

  cy: {
    // chrome
    reviewFlag: "Cymraeg drafft cyntaf – yn aros am adolygiad gan siaradwr iaith gyntaf.",
    nav_how: "Sut mae'n gweithio",
    nav_uses: "Defnyddiau",
    nav_pricing: "Prisio",
    nav_cta: "Mynediad cynnar",
    back: "aledparry.com",

    // hero
    hero_eyebrow: "Yr haen werthu ddigidol ar gyfer busnesau go iawn",
    hero_title_a: "Gwerthu'n gyflymach.",
    hero_title_b: "Ciwio'n llai.",
    hero_sub: "Archebu'n gyflymach. Casglu'n gallach.",
    hero_lede:
      "Mae Buan yn troi unrhyw fan yn bwynt gwerthu. Mae cwsmeriaid yn sganio cod QR, yn archebu ac yn talu ar eu ffôn, ac rydych chi'n cymryd archebion heb y ciw, y caledwedd na'r aros.",
    hero_cta_primary: "Cael mynediad cynnar",
    hero_cta_secondary: "Gweld sut mae'n gweithio",
    hero_name_note: "Buan (ans.) – cyflym.",

    // phone mock
    mock_business: "Caffi Buan",
    mock_tagline: "Sganio · archebu · casglu",
    mock_item1: "Flat White",
    mock_item2: "Rholyn Bacwn",
    mock_item3: "Myffin Llus",
    mock_total: "Cyfanswm",
    mock_pay: "Archebu a thalu",

    // how it works
    how_eyebrow: "Sut mae'n gweithio",
    how_heading: "Ar waith mewn munudau",
    how_sub: "Dim ap i'w adeiladu, dim caledwedd i'w brynu.",
    how_s1_t: "Crëwch eich busnes",
    how_s1_b:
      "Ychwanegwch eich bwydlen neu restr gynnyrch, gosodwch eich prisiau, a dewiswch sut mae cwsmeriaid yn casglu neu'n cael eu gwasanaethu.",
    how_s2_t: "Argraffwch eich cod QR",
    how_s2_b:
      "Rhowch eich cod Buan unigryw ar fwrdd, cownter, poster neu fan gwefru. Dyna'ch siop gyfan.",
    how_s3_t: "Dechreuwch gymryd archebion",
    how_s3_b:
      "Mae cwsmeriaid yn sganio, archebu a thalu mewn eiliadau. Mae archebion yn cyrraedd eich dangosfwrdd y foment maen nhw'n cael eu gosod.",

    // use cases
    uses_eyebrow: "Lle mae Buan yn gweithio",
    uses_heading: "Un offeryn, sawl cownter",
    uses_sub: "Os yw pobl yn ciwio, yn talu neu'n casglu, mae Buan yn ffitio.",
    use_hospitality_t: "Lletygarwch",
    use_hospitality_b:
      "Caffis, tafarndai, faniau bwyd a bwytai – archebu wrth y bwrdd neu i'r car.",
    use_workplace_t: "Arlwyo gweithle a swyddfa",
    use_workplace_b:
      "Ffreuturau staff a thripiau coffi'r swyddfa, wedi'u harchebu ymlaen llaw a'u casglu heb y gwasgfa.",
    use_ev_t: "Gwefru cerbydau trydan",
    use_ev_b:
      "Archebwch fwyd a diod wrth i chi wefru, yn barod erbyn i'ch car orffen.",
    use_events_t: "Digwyddiadau a gwyliau",
    use_events_b:
      "Torrwch giwiau'r bar a'r bwyd gydag archebu ymlaen llaw a thalu ar ffôn ym mhob stondin.",
    use_retail_t: "Manwerthu",
    use_retail_b:
      "Gadewch i gwsmeriaid bori, cadw a thalu o lawr y siop neu ymyl y silff.",
    use_service_t: "Busnesau gwasanaeth",
    use_service_b:
      "Cymerwch archebion, blaendaliadau a thaliadau heb wefan na pheiriant cardiau.",

    // features
    feat_eyebrow: "Beth sydd wedi'i gynnwys",
    feat_heading: "Popeth sydd ei angen arnoch i ddechrau gwerthu",
    feat: [
      ["📲", "Archebu a thalu drwy QR", "Mae cwsmeriaid yn talu ar eu ffôn. Dim byd i'w lawrlwytho."],
      ["📋", "Dangosfwrdd archebion byw", "Gwelwch archebion wrth iddyn nhw gyrraedd a'u symud drwodd."],
      ["🍽️", "Eich bwydlen neu gatalog eich hun", "Ychwanegwch eitemau, prisiau, lluniau a dewisiadau mewn munudau."],
      ["🏴", "Dwyieithog o'r dechrau", "Cymraeg a Saesneg, i'w newid ar gyfer pob cwsmer."],
      ["📱", "Yn gweithio ar unrhyw ffôn", "Dim ap, dim caledwedd, dim darllenydd cardiau."],
      ["💷", "Prisio syml, hyblyg", "Cost fisol isel wrth i ni brofi gyda'n gilydd."],
    ] as [string, string, string][],

    // no website
    nw_heading: "Dim gwefan? Dim problem.",
    nw_body:
      "Buan yw eich siop. Mae eich cod QR yn siop weithredol y gall eich cwsmeriaid archebu ohoni heddiw – dim parth, dim prosiect dylunio, dim datblygwr. Gwefan gennych chi'n barod? Ychwanegwch Buan ati gydag un ddolen.",
    nw_point1: "Yn fyw y diwrnod rydych chi'n ymuno",
    nw_point2: "Rhannwch hi fel dolen, poster neu sticer",
    nw_point3: "Yn ffitio i mewn i wefan bresennol os oes un gennych",

    // pricing
    price_eyebrow: "Prisio",
    price_heading: "Prisio misol syml",
    price_sub: "Un cynllun, dim syrpreisys. Rydyn ni'n dal i brofi'n gynnar, felly mae'r ffigurau isod yn rhai dangosol.",
    price_from: "o tua",
    price_amount: "£10",
    price_per: "/mis",
    price_tag: "Pris cyfnod profi cynnar · i'w gadarnhau",
    price_bullets: [
      "Un ffi fisol syml",
      "Dim cost gosod wrth i ni brofi",
      "Canslo unrhyw bryd",
      "Prisio terfynol yn cael ei gadarnhau cyn lansio",
    ],
    price_disclaimer:
      "Mae'r prisiau a ddangosir yn rhai dangosol a gallant newid. Bydd y prisio terfynol yn cael ei gadarnhau cyn ei ryddhau'n gyffredinol.",
    price_cta: "Cofrestrwch eich diddordeb",

    // lead form
    lead_eyebrow: "Mynediad cynnar",
    lead_heading: "Byddwch ymhlith y rhai cyntaf i ddefnyddio Buan",
    lead_sub:
      "Dywedwch ychydig wrthym am eich busnes a byddwn mewn cysylltiad wrth i ni agor mynediad cynnar.",
    lead_name: "Eich enw",
    lead_name_ph: "e.e. Sioned",
    lead_business: "Enw'r busnes",
    lead_business_ph: "e.e. Caffi'r Cei",
    lead_email: "E-bost",
    lead_email_ph: "chi@busnes.com",
    lead_type: "Math o fusnes",
    lead_type_options: [
      "Lletygarwch",
      "Arlwyo gweithle / swyddfa",
      "Gwefru cerbydau trydan",
      "Digwyddiadau / gwyliau",
      "Manwerthu",
      "Busnes gwasanaeth",
      "Rhywbeth arall",
    ],
    lead_type_ph: "Dewiswch un",
    lead_message: "Unrhyw beth arall? (dewisol)",
    lead_message_ph: "Dywedwch wrthym beth fyddech chi am ei gael gan Buan.",
    lead_submit: "Gofyn am fynediad cynnar",
    lead_sending: "Anfon…",
    lead_success_t: "Diolch!",
    lead_success_b: "Rydych chi ar y rhestr. Byddwn mewn cysylltiad wrth i fynediad cynnar agor.",
    lead_again: "Anfon un arall",
    lead_privacy: "Byddwn ond yn defnyddio'ch manylion i siarad â chi am Buan.",
    lead_preview: "Rhagolwg: dim ond at bwynt terfyn dros dro mae'r ceisiadau'n mynd, ac nid ydyn nhw'n cael eu cadw eto.",
    lead_err_name: "Ychwanegwch eich enw os gwelwch yn dda.",
    lead_err_email: "Ychwanegwch e-bost dilys os gwelwch yn dda.",

    // footer
    foot_tagline: "Yr haen werthu ddigidol ar gyfer busnesau go iawn.",
    foot_note: "Mae Buan yn gysyniad cynnyrch cynnar. Mae prisio a nodweddion yn rhai dangosol ac yn agored i newid.",
    foot_lang: "Iaith",
  },
};

type Copy = (typeof COPY)[Lang];

/* ---------------------------------------------------------------- */
/*  Small building blocks                                            */
/* ---------------------------------------------------------------- */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-sans font-semibold uppercase tracking-[0.18em] text-teal-700">
      {children}
    </p>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-teal-600 font-sans text-lg font-bold text-white">
      {n}
    </span>
  );
}

/* Decorative QR-style grid – purely visual, not a real code. */
function QrMark() {
  // A small deterministic pattern so it reads as a QR without encoding anything.
  const cells = [
    1, 1, 1, 0, 1, 0, 1, 1,
    1, 0, 1, 0, 0, 1, 0, 1,
    1, 0, 1, 1, 1, 0, 1, 1,
    0, 1, 0, 1, 0, 1, 0, 0,
    1, 1, 1, 0, 1, 1, 1, 0,
    0, 0, 1, 1, 0, 0, 1, 1,
    1, 1, 0, 1, 1, 0, 1, 0,
    1, 0, 1, 0, 1, 1, 0, 1,
  ];
  return (
    <div
      aria-hidden
      className="grid grid-cols-8 gap-0.5 rounded-lg bg-white p-2 shadow-sm ring-1 ring-stone-200"
    >
      {cells.map((c, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-[1px] ${c ? "bg-stone-900" : "bg-transparent"}`}
        />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Lead-capture form (stubbed submit)                               */
/* ---------------------------------------------------------------- */
function LeadForm({ t }: { t: Copy }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();

    if (!name) {
      setErr(t.lead_err_name);
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr(t.lead_err_email);
      return;
    }
    setErr(null);
    setSending(true);

    // STUB: posts to /api/buan-lead, which only logs a non-PII breadcrumb and
    // returns 200 – nothing is persisted yet. We never block the confirmation
    // on the request, so the form still works offline. No PII is logged here.
    const payload = Object.fromEntries(data.entries());
    try {
      await fetch("/api/buan-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // No backend dependency – ignore network errors for this stub.
    }

    setSending(false);
    setSent(true);
    form.reset();
  };

  if (sent) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200 sm:p-10">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-2xl">
          ✓
        </div>
        <h3 className="font-serif text-2xl text-stone-900">{t.lead_success_t}</h3>
        <p className="mt-2 text-stone-600">{t.lead_success_b}</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 text-sm font-medium text-teal-700 underline underline-offset-4 hover:text-teal-800"
        >
          {t.lead_again}
        </button>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30";

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200 sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label htmlFor="buan-name" className="mb-1.5 block text-sm font-medium text-stone-700">
            {t.lead_name}
          </label>
          <input id="buan-name" name="name" type="text" autoComplete="name" placeholder={t.lead_name_ph} className={inputCls} />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="buan-business" className="mb-1.5 block text-sm font-medium text-stone-700">
            {t.lead_business}
          </label>
          <input id="buan-business" name="business" type="text" placeholder={t.lead_business_ph} className={inputCls} />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="buan-email" className="mb-1.5 block text-sm font-medium text-stone-700">
            {t.lead_email}
          </label>
          <input id="buan-email" name="email" type="email" autoComplete="email" placeholder={t.lead_email_ph} className={inputCls} />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="buan-type" className="mb-1.5 block text-sm font-medium text-stone-700">
            {t.lead_type}
          </label>
          <select id="buan-type" name="businessType" defaultValue="" className={inputCls}>
            <option value="" disabled>
              {t.lead_type_ph}
            </option>
            {t.lead_type_options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="buan-message" className="mb-1.5 block text-sm font-medium text-stone-700">
            {t.lead_message}
          </label>
          <textarea id="buan-message" name="message" rows={3} placeholder={t.lead_message_ph} className={inputCls} />
        </div>
      </div>

      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}

      <button
        type="submit"
        disabled={sending}
        className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-teal-600 px-6 py-3.5 font-sans font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60 sm:w-auto"
      >
        {sending ? t.lead_sending : t.lead_submit}
      </button>

      <p className="mt-4 text-xs text-stone-500">{t.lead_privacy}</p>
      <p className="mt-1 text-xs italic text-stone-400">{t.lead_preview}</p>
    </form>
  );
}

/* ---------------------------------------------------------------- */
/*  Main landing                                                     */
/* ---------------------------------------------------------------- */
export default function Buan() {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    const saved = localStorage.getItem(LANG_KEY) as Lang | null;
    if (saved === "en" || saved === "cy") {
      setLangState(saved);
    } else if (typeof navigator !== "undefined") {
      const prefs = navigator.languages?.length ? navigator.languages : [navigator.language];
      if (prefs.some((l) => l?.toLowerCase().startsWith("cy"))) setLangState("cy");
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  }, []);

  const t = COPY[lang];

  const uses: [string, string, string][] = [
    ["🍽️", t.use_hospitality_t, t.use_hospitality_b],
    ["🏢", t.use_workplace_t, t.use_workplace_b],
    ["⚡", t.use_ev_t, t.use_ev_b],
    ["🎪", t.use_events_t, t.use_events_b],
    ["🛍️", t.use_retail_t, t.use_retail_b],
    ["🛠️", t.use_service_t, t.use_service_b],
  ];

  return (
    <div lang={lang} className="min-h-screen bg-stone-50 font-sans text-stone-800">
      {/* First-draft Welsh reviewer flag – visible on this review branch. */}
      <div className="bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-900">
        {t.reviewFlag}
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-stone-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-content items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 font-serif text-lg font-bold text-white">
              B
            </span>
            <span className="font-serif text-xl font-bold tracking-tight text-stone-900">Buan</span>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-stone-600 md:flex">
            <a href="#how" className="hover:text-stone-900">{t.nav_how}</a>
            <a href="#uses" className="hover:text-stone-900">{t.nav_uses}</a>
            <a href="#pricing" className="hover:text-stone-900">{t.nav_pricing}</a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="inline-flex overflow-hidden rounded-full border border-stone-300" role="group" aria-label="Language / Iaith">
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1 text-xs font-bold transition ${lang === "en" ? "bg-teal-600 text-white" : "text-stone-500 hover:text-stone-900"}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("cy")}
                lang="cy"
                className={`px-3 py-1 text-xs font-bold transition ${lang === "cy" ? "bg-teal-600 text-white" : "text-stone-500 hover:text-stone-900"}`}
              >
                CY
              </button>
            </div>
            <a
              href="#early-access"
              className="hidden rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 sm:inline-flex"
            >
              {t.nav_cta}
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-teal-50 via-stone-50 to-emerald-50" />
        <div className="mx-auto grid max-w-content items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
          <div>
            <Eyebrow>{t.hero_eyebrow}</Eyebrow>
            <h1 className="mt-4 font-serif text-5xl font-bold leading-[1.05] tracking-tight text-stone-900 sm:text-6xl">
              {t.hero_title_a}
              <br />
              <span className="text-teal-600">{t.hero_title_b}</span>
            </h1>
            <p className="mt-4 text-xl font-medium text-stone-700">{t.hero_sub}</p>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-stone-600">{t.hero_lede}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#early-access"
                className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-7 py-3.5 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg"
              >
                {t.hero_cta_primary}
              </a>
              <a
                href="#how"
                className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-7 py-3.5 font-semibold text-stone-800 transition hover:border-stone-400"
              >
                {t.hero_cta_secondary}
              </a>
            </div>
            <p className="mt-5 text-sm italic text-stone-500">{t.hero_name_note}</p>
          </div>

          {/* Phone + QR mock */}
          <div className="relative mx-auto flex w-full max-w-sm items-center justify-center">
            <div className="relative w-64 rounded-[2.5rem] border-[10px] border-stone-900 bg-white shadow-2xl">
              <div className="rounded-t-[1.8rem] bg-teal-600 px-5 pb-4 pt-6 text-white">
                <p className="text-sm font-bold">{t.mock_business}</p>
                <p className="text-xs text-teal-100">{t.mock_tagline}</p>
              </div>
              <div className="space-y-2.5 px-5 py-5">
                {[
                  [t.mock_item1, "£3.20"],
                  [t.mock_item2, "£4.50"],
                  [t.mock_item3, "£2.90"],
                ].map(([name, price]) => (
                  <div key={name} className="flex items-center justify-between rounded-lg bg-stone-100 px-3 py-2.5">
                    <span className="text-sm font-medium text-stone-800">{name}</span>
                    <span className="text-sm font-semibold text-teal-700">{price}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1 text-sm">
                  <span className="text-stone-500">{t.mock_total}</span>
                  <span className="font-bold text-stone-900">£10.60</span>
                </div>
                <div className="mt-2 rounded-lg bg-teal-600 py-2.5 text-center text-sm font-semibold text-white">
                  {t.mock_pay}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-2 rotate-6 sm:-right-4">
              <QrMark />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 border-t border-stone-200 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-content px-4 sm:px-6">
          <div className="max-w-2xl">
            <Eyebrow>{t.how_eyebrow}</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              {t.how_heading}
            </h2>
            <p className="mt-3 text-lg text-stone-600">{t.how_sub}</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              [1, t.how_s1_t, t.how_s1_b],
              [2, t.how_s2_t, t.how_s2_b],
              [3, t.how_s3_t, t.how_s3_b],
            ].map(([n, title, body]) => (
              <div key={n as number} className="relative">
                <StepNumber n={n as number} />
                <h3 className="mt-4 font-serif text-xl font-bold text-stone-900">{title as string}</h3>
                <p className="mt-2 leading-relaxed text-stone-600">{body as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="uses" className="scroll-mt-20 border-t border-stone-200 bg-stone-50 py-16 sm:py-24">
        <div className="mx-auto max-w-content px-4 sm:px-6">
          <div className="max-w-2xl">
            <Eyebrow>{t.uses_eyebrow}</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              {t.uses_heading}
            </h2>
            <p className="mt-3 text-lg text-stone-600">{t.uses_sub}</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {uses.map(([emoji, title, body]) => (
              <div key={title} className="rounded-2xl bg-white p-6 ring-1 ring-stone-200 transition hover:-translate-y-1 hover:shadow-md">
                <div className="text-3xl">{emoji}</div>
                <h3 className="mt-4 font-serif text-lg font-bold text-stone-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-stone-200 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-content px-4 sm:px-6">
          <div className="max-w-2xl">
            <Eyebrow>{t.feat_eyebrow}</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              {t.feat_heading}
            </h2>
          </div>
          <div className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {t.feat.map(([emoji, title, body]) => (
              <div key={title} className="flex gap-4">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-teal-50 text-xl">
                  {emoji}
                </span>
                <div>
                  <h3 className="font-semibold text-stone-900">{title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-stone-600">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* No website? No problem */}
      <section className="border-t border-stone-200 bg-stone-900 py-16 text-white sm:py-24">
        <div className="mx-auto grid max-w-content items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">{t.nw_heading}</h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-stone-300">{t.nw_body}</p>
          </div>
          <ul className="space-y-4">
            {[t.nw_point1, t.nw_point2, t.nw_point3].map((p) => (
              <li key={p} className="flex items-center gap-3 rounded-xl bg-stone-800/70 px-5 py-4">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-teal-500 text-sm font-bold text-stone-900">
                  ✓
                </span>
                <span className="font-medium text-stone-100">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 border-t border-stone-200 bg-stone-50 py-16 sm:py-24">
        <div className="mx-auto max-w-content px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>{t.price_eyebrow}</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              {t.price_heading}
            </h2>
            <p className="mt-3 text-lg text-stone-600">{t.price_sub}</p>
          </div>

          <div className="mx-auto mt-12 max-w-md rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200 sm:p-10">
            <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
              {t.price_tag}
            </span>
            <div className="mt-5 flex items-end gap-2">
              <span className="text-sm text-stone-500">{t.price_from}</span>
              <span className="font-serif text-5xl font-bold text-stone-900">{t.price_amount}</span>
              <span className="pb-1 text-stone-500">{t.price_per}</span>
            </div>
            <ul className="mt-6 space-y-3">
              {t.price_bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-stone-700">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                    ✓
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <a
              href="#early-access"
              className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-teal-600 px-6 py-3.5 font-semibold text-white transition hover:bg-teal-700"
            >
              {t.price_cta}
            </a>
            <p className="mt-4 text-xs leading-relaxed text-stone-500">{t.price_disclaimer}</p>
          </div>
        </div>
      </section>

      {/* Early access lead form */}
      <section id="early-access" className="scroll-mt-20 border-t border-stone-200 bg-white py-16 sm:py-24">
        <div className="mx-auto grid max-w-content gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow>{t.lead_eyebrow}</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
              {t.lead_heading}
            </h2>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-stone-600">{t.lead_sub}</p>
            <div className="mt-8 hidden items-center gap-4 lg:flex">
              <QrMark />
              <p className="max-w-[12rem] text-sm text-stone-500">{t.hero_name_note}</p>
            </div>
          </div>
          <LeadForm t={t} />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-800 bg-stone-900 py-12 text-stone-400">
        <div className="mx-auto max-w-content px-4 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 font-serif text-base font-bold text-white">
                B
              </span>
              <div>
                <p className="font-serif text-lg font-bold text-white">Buan</p>
                <p className="text-xs">{t.foot_tagline}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-500">{t.foot_lang}:</span>
              <button onClick={() => setLang("en")} className={lang === "en" ? "font-bold text-white" : "hover:text-white"}>
                EN
              </button>
              <span className="text-stone-600">·</span>
              <button onClick={() => setLang("cy")} lang="cy" className={lang === "cy" ? "font-bold text-white" : "hover:text-white"}>
                CY
              </button>
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-xs leading-relaxed text-stone-500">{t.foot_note}</p>
        </div>
      </footer>
    </div>
  );
}
