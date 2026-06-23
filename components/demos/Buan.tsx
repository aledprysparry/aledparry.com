"use client";

/* ============================================================
   Buan – marketing landing (Phase 1)
   "The digital sales layer for physical businesses."
   Buan (adj.) = Welsh for fast / quick.

   Grown from the Tanio QR-ordering demo in this repo, but the
   marketing site is independent of the product build. This file
   is a self-contained bilingual (EN/CY) landing experience with
   its own copy dictionary + language toggle, matching Tanio's
   bilingual approach. Rendered with the site's Tailwind tokens
   plus a small scoped <style> block for motion + gradient text.

   Sections: hero · how-it-works (3 steps) · use-cases grid ·
   key features · "No website? No problem" · flexible pricing
   (clearly TBC) · early-access lead form (stubbed submit).

   ⚠️ WELSH COPY IS A FIRST DRAFT – NOT FINAL.
   All Cymraeg below was drafted for this build and has NOT been
   checked by a native speaker. It is naturalised rather than
   literal, but it must be reviewed before any public release.
   A slim notice bar surfaces this in-product on this branch.
   ============================================================ */

import { useState, useEffect, useCallback, useRef } from "react";

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
    menu_open: "Open menu",
    menu_close: "Close menu",

    // hero
    hero_pill: "Early access now open",
    hero_eyebrow: "The digital sales layer for physical businesses",
    hero_title_a: "Sell faster.",
    hero_title_b: "Queue less.",
    hero_sub: "Order faster. Collect smarter.",
    hero_lede:
      "Buan turns any spot into a point of sale. Customers scan a QR code, order and pay on their phone, and you take orders without the queue, the hardware or the wait.",
    hero_cta_primary: "Get early access",
    hero_cta_secondary: "See how it works",
    hero_name_note: "Buan (adj.) – Welsh for fast.",
    hero_chips: ["No app to download", "No hardware", "Pay on phone"],

    // phone mock
    mock_business: "Caffi Buan",
    mock_tagline: "Scan · order · collect",
    mock_live: "Live",
    mock_item1: "Flat White",
    mock_item2: "Bacon Roll",
    mock_item3: "Blueberry Muffin",
    mock_total: "Total",
    mock_pay: "Order & pay",
    mock_scan: "Scan to order",

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
      ["QR ordering & payment", "Customers pay on their phone. Nothing to download."],
      ["Live orders dashboard", "See orders as they arrive and move them through to done."],
      ["Your own menu or catalogue", "Add items, prices, photos and options in minutes."],
      ["Bilingual by default", "Welsh and English, switchable for every customer."],
      ["Works on any phone", "No app, no hardware, no card reader required."],
      ["Simple, flexible pricing", "A low monthly cost while we test together."],
    ] as [string, string][],

    // no website
    nw_eyebrow: "No barriers",
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
    foot_staff: "Staff sign in",
  },

  cy: {
    // chrome
    reviewFlag: "Cymraeg drafft cyntaf – yn aros am adolygiad gan siaradwr iaith gyntaf.",
    nav_how: "Sut mae'n gweithio",
    nav_uses: "Defnyddiau",
    nav_pricing: "Prisio",
    nav_cta: "Mynediad cynnar",
    menu_open: "Agor dewislen",
    menu_close: "Cau dewislen",

    // hero
    hero_pill: "Mynediad cynnar ar agor nawr",
    hero_eyebrow: "Yr haen werthu ddigidol ar gyfer busnesau go iawn",
    hero_title_a: "Gwerthu'n gyflymach.",
    hero_title_b: "Ciwio'n llai.",
    hero_sub: "Archebu'n gyflymach. Casglu'n gallach.",
    hero_lede:
      "Mae Buan yn troi unrhyw fan yn bwynt gwerthu. Mae cwsmeriaid yn sganio cod QR, yn archebu ac yn talu ar eu ffôn, ac rydych chi'n cymryd archebion heb y ciw, y caledwedd na'r aros.",
    hero_cta_primary: "Cael mynediad cynnar",
    hero_cta_secondary: "Gweld sut mae'n gweithio",
    hero_name_note: "Buan (ans.) – cyflym.",
    hero_chips: ["Dim ap i'w lawrlwytho", "Dim caledwedd", "Talu ar ffôn"],

    // phone mock
    mock_business: "Caffi Buan",
    mock_tagline: "Sganio · archebu · casglu",
    mock_live: "Byw",
    mock_item1: "Flat White",
    mock_item2: "Rholyn Bacwn",
    mock_item3: "Myffin Llus",
    mock_total: "Cyfanswm",
    mock_pay: "Archebu a thalu",
    mock_scan: "Sganiwch i archebu",

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
      ["Archebu a thalu drwy QR", "Mae cwsmeriaid yn talu ar eu ffôn. Dim byd i'w lawrlwytho."],
      ["Dangosfwrdd archebion byw", "Gwelwch archebion wrth iddyn nhw gyrraedd a'u symud drwodd."],
      ["Eich bwydlen neu gatalog eich hun", "Ychwanegwch eitemau, prisiau, lluniau a dewisiadau mewn munudau."],
      ["Dwyieithog o'r dechrau", "Cymraeg a Saesneg, i'w newid ar gyfer pob cwsmer."],
      ["Yn gweithio ar unrhyw ffôn", "Dim ap, dim caledwedd, dim darllenydd cardiau."],
      ["Prisio syml, hyblyg", "Cost fisol isel wrth i ni brofi gyda'n gilydd."],
    ] as [string, string][],

    // no website
    nw_eyebrow: "Dim rhwystrau",
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
    foot_staff: "Mewngofnodi staff",
  },
};

type Copy = (typeof COPY)[Lang];

/* ---------------------------------------------------------------- */
/*  Scoped styles: motion, gradient text, button shine               */
/*  (reduced-motion friendly)                                        */
/* ---------------------------------------------------------------- */
const STYLES = `
/* Reveal stays fully visible unless JS is active, so no-JS / pre-hydration
   never hides content. Only once .buan-js is set do elements start hidden
   and animate in on scroll. */
.buan-js .buan-reveal{opacity:0;transform:translateY(24px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1);will-change:opacity,transform;}
.buan-js .buan-reveal.is-in{opacity:1;transform:none;}
.buan-root a:focus-visible,.buan-root button:focus-visible{outline:2px solid #0d9488;outline-offset:3px;border-radius:10px;}
.buan-root ::selection{background:#0d9488;color:#fff;}
html{scroll-padding-top:4.5rem;}
@media (prefers-reduced-motion: no-preference){html{scroll-behavior:smooth;}}
@keyframes buan-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes buan-floatslow{0%,100%{transform:translateY(0) rotate(5deg)}50%{transform:translateY(-8px) rotate(5deg)}}
@keyframes buan-pulse{0%,100%{opacity:1}50%{opacity:.35}}
.buan-float-slow{transform:rotate(5deg);}
@media (prefers-reduced-motion: no-preference){
  .buan-float{animation:buan-float 6.5s ease-in-out infinite;}
  .buan-float-slow{animation:buan-floatslow 7.5s ease-in-out infinite;}
  .buan-pulse{animation:buan-pulse 2s ease-in-out infinite;}
}
@media (prefers-reduced-motion: reduce){
  .buan-js .buan-reveal{opacity:1;transform:none;transition:none;}
}
`;

/* ---------------------------------------------------------------- */
/*  Inline line-icon set (premium, consistent stroke)                */
/* ---------------------------------------------------------------- */
function Icon({ name, className = "h-6 w-6" }: { name: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    coffee: (
      <>
        <path d="M5 8h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" />
        <path d="M16 9h2.5a2 2 0 0 1 0 4H16" />
        <path d="M8 3.5c0 1-1 1.3-1 2.2M11.5 3.5c0 1-1 1.3-1 2.2" />
        <path d="M5 20.5h11" />
      </>
    ),
    building: (
      <>
        <path d="M4 20.5V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15.5" />
        <path d="M13 9h6a1 1 0 0 1 1 1v10.5" />
        <path d="M3 20.5h18" />
        <path d="M7 8h2M7 12h2M7 16h2M16 12.5h1M16 16h1" />
      </>
    ),
    bolt: <path d="M12.5 3 6 13h4.5l-1 8L17 11h-4.5l0-8Z" />,
    ticket: (
      <>
        <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h13A1.5 1.5 0 0 1 20 8.5v1a2 2 0 0 0 0 4v1a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 14.5v-1a2 2 0 0 0 0-4v-1Z" />
        <path d="M11 7.5v9" strokeDasharray="2 2" />
      </>
    ),
    bag: (
      <>
        <path d="M6.5 8h11l-.8 11.2a1.5 1.5 0 0 1-1.5 1.4H8.8a1.5 1.5 0 0 1-1.5-1.4L6.5 8Z" />
        <path d="M9 8V7a3 3 0 0 1 6 0v1" />
      </>
    ),
    briefcase: (
      <>
        <rect x="3.5" y="7.5" width="17" height="12" rx="1.5" />
        <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
        <path d="M3.5 13h17" />
      </>
    ),
    qr: (
      <>
        <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.2" />
        <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.2" />
        <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.2" />
        <path d="M14 14v2.2M16.6 14v3M19.2 14.6v1.4M14 18.8h2M17.6 18.8h2.9M20.5 16.4v4" />
      </>
    ),
    dashboard: (
      <>
        <rect x="3.5" y="4" width="17" height="16" rx="2" />
        <path d="M3.5 9h17M9 9v11" />
      </>
    ),
    menu: (
      <>
        <rect x="6" y="5" width="12" height="16" rx="1.5" />
        <path d="M9 4.5h6a1 1 0 0 1 1 1V6H8v-.5a1 1 0 0 1 1-1Z" />
        <path d="M9 10h6M9 13.5h6M9 17h3.5" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17" />
        <path d="M12 3.5c2.6 2.4 2.6 14.6 0 17M12 3.5c-2.6 2.4-2.6 14.6 0 17" />
      </>
    ),
    phone: (
      <>
        <rect x="7" y="3.5" width="10" height="17" rx="2" />
        <path d="M10.5 17.5h3" />
      </>
    ),
    pound: (
      <>
        <path d="M8 20h9" />
        <path d="M9.5 20c1.6-1.4 1.8-3.2 1.8-5V9.2A3.2 3.2 0 0 1 17 8" />
        <path d="M7.5 13.5h6" />
      </>
    ),
    check: <path d="M5 12.5 9.5 17 19 7" />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}

const USE_ICONS = ["coffee", "building", "bolt", "ticket", "bag", "briefcase"];
const FEAT_ICONS = ["qr", "dashboard", "menu", "globe", "phone", "pound"];

/* ---------------------------------------------------------------- */
/*  Reveal-on-scroll wrapper (IntersectionObserver)                  */
/* ---------------------------------------------------------------- */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const ob = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            ob.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`buan-reveal ${inView ? "is-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Small building blocks                                            */
/* ---------------------------------------------------------------- */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-[0.2em] text-teal-700">
      <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
      {children}
    </span>
  );
}

/* Decorative QR-style grid – purely visual, not a real code. */
function QrMark({ className = "" }: { className?: string }) {
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
      className={`grid grid-cols-8 gap-[3px] rounded-2xl bg-white p-3 shadow-lg ring-1 ring-stone-900/5 ${className}`}
    >
      {cells.map((c, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-[2px] ${c ? "bg-stone-900" : "bg-stone-100"}`}
        />
      ))}
    </div>
  );
}

/* Refined phone mock used in the hero. */
function PhoneMock({ t }: { t: Copy }) {
  return (
    // Decorative product mockup: hidden from assistive tech so screen readers
    // skip the illustrative menu/prices and reach the real copy.
    <div className="relative buan-float" aria-hidden>
      {/* soft brand glow */}
      <div className="absolute -inset-8 -z-10 rounded-full bg-teal-400/20 blur-3xl" />
      <div className="relative w-[15rem] rounded-[2.6rem] border-[11px] border-stone-900 bg-stone-900 shadow-2xl sm:w-[16.5rem]">
        {/* notch */}
        <div className="absolute left-1/2 top-2 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-black/70" />
        <div className="relative overflow-hidden rounded-[1.9rem] bg-white">
          {/* subtle screen sheen */}
          <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-tr from-transparent via-transparent to-white/30" />
          <div className="bg-gradient-to-br from-teal-600 to-emerald-600 px-5 pb-5 pt-7 text-white">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">{t.mock_business}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold">
                <span className="buan-pulse h-1.5 w-1.5 rounded-full bg-emerald-300" />
                {t.mock_live}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-teal-50/90">{t.mock_tagline}</p>
          </div>
          <div className="space-y-2.5 px-5 py-5">
            {[
              [t.mock_item1, "£3.20"],
              [t.mock_item2, "£4.50"],
              [t.mock_item3, "£2.90"],
            ].map(([name, price]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2.5 ring-1 ring-stone-900/5"
              >
                <span className="text-sm font-medium text-stone-800">{name}</span>
                <span className="text-sm font-semibold tabular-nums text-teal-700">{price}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1 text-sm">
              <span className="text-stone-500">{t.mock_total}</span>
              <span className="font-bold tabular-nums text-stone-900">£10.60</span>
            </div>
            <div className="mt-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 py-3 text-center text-sm font-semibold text-white shadow-sm">
              {t.mock_pay}
            </div>
            {/* home indicator */}
            <div className="mx-auto mt-3 h-1 w-24 rounded-full bg-stone-300" />
          </div>
        </div>
      </div>

      {/* floating QR card */}
      <div className="buan-float-slow absolute -bottom-7 -right-5 sm:-right-9">
        <QrMark className="w-28" />
        <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-wider text-stone-500">
          {t.mock_scan}
        </p>
      </div>
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
      (form.querySelector("#buan-name") as HTMLInputElement | null)?.focus();
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr(t.lead_err_email);
      (form.querySelector("#buan-email") as HTMLInputElement | null)?.focus();
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
      <div className="flex min-h-[22rem] flex-col items-center justify-center rounded-3xl bg-white p-8 text-center shadow-xl shadow-teal-900/5 ring-1 ring-stone-900/5 sm:p-10">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30">
          <Icon name="check" className="h-8 w-8" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-stone-900">{t.lead_success_t}</h3>
        <p className="mt-2 max-w-xs text-stone-600">{t.lead_success_b}</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 text-sm font-medium text-teal-700 underline underline-offset-4 transition hover:text-teal-800"
        >
          {t.lead_again}
        </button>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-stone-300/80 bg-white px-4 py-3 text-stone-900 shadow-sm transition placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/15";
  const labelCls = "mb-1.5 block text-sm font-medium text-stone-700";

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-3xl bg-white p-6 shadow-xl shadow-teal-900/5 ring-1 ring-stone-900/5 sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="buan-name" className={labelCls}>{t.lead_name}</label>
          <input id="buan-name" name="name" type="text" autoComplete="name" placeholder={t.lead_name_ph} className={inputCls} />
        </div>
        <div>
          <label htmlFor="buan-business" className={labelCls}>{t.lead_business}</label>
          <input id="buan-business" name="business" type="text" placeholder={t.lead_business_ph} className={inputCls} />
        </div>
        <div>
          <label htmlFor="buan-email" className={labelCls}>{t.lead_email}</label>
          <input id="buan-email" name="email" type="email" autoComplete="email" placeholder={t.lead_email_ph} className={inputCls} />
        </div>
        <div>
          <label htmlFor="buan-type" className={labelCls}>{t.lead_type}</label>
          <select id="buan-type" name="businessType" defaultValue="" className={inputCls}>
            <option value="" disabled>{t.lead_type_ph}</option>
            {t.lead_type_options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="buan-message" className={labelCls}>{t.lead_message}</label>
          <textarea id="buan-message" name="message" rows={3} placeholder={t.lead_message_ph} className={inputCls} />
        </div>
      </div>

      {err && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {err}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-teal-600 px-7 py-3.5 font-sans font-semibold text-white shadow-lg shadow-teal-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-teal-700 disabled:translate-y-0 disabled:opacity-60 sm:w-auto"
      >
        {sending ? t.lead_sending : t.lead_submit}
        {!sending && <Icon name="arrow" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />}
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [jsReady, setJsReady] = useState(false);

  // Marks JS as active so the reveal animations arm only when they can run.
  // Without this, no-JS visitors would see permanently hidden content.
  useEffect(() => setJsReady(true), []);

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

  const navLinks: [string, string][] = [
    ["#how", t.nav_how],
    ["#uses", t.nav_uses],
    ["#pricing", t.nav_pricing],
  ];

  const uses: [string, string, string][] = [
    [USE_ICONS[0], t.use_hospitality_t, t.use_hospitality_b],
    [USE_ICONS[1], t.use_workplace_t, t.use_workplace_b],
    [USE_ICONS[2], t.use_ev_t, t.use_ev_b],
    [USE_ICONS[3], t.use_events_t, t.use_events_b],
    [USE_ICONS[4], t.use_retail_t, t.use_retail_b],
    [USE_ICONS[5], t.use_service_t, t.use_service_b],
  ];

  const steps: [string, string][] = [
    [t.how_s1_t, t.how_s1_b],
    [t.how_s2_t, t.how_s2_b],
    [t.how_s3_t, t.how_s3_b],
  ];

  const LangToggle = ({ light = false }: { light?: boolean }) => (
    <div
      className={`inline-flex overflow-hidden rounded-full border ${light ? "border-white/20" : "border-stone-300"}`}
      role="group"
      aria-label="Language / Iaith"
    >
      {(["en", "cy"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          lang={l}
          aria-pressed={lang === l}
          className={`px-3 py-1 text-xs font-bold transition ${
            lang === l
              ? "bg-teal-600 text-white"
              : light
                ? "text-white/70 hover:text-white"
                : "text-stone-500 hover:text-stone-900"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );

  return (
    <div lang={lang} className={`buan-root min-h-screen bg-white font-sans text-stone-800 antialiased ${jsReady ? "buan-js" : ""}`}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* First-draft Welsh reviewer flag – visible on this review branch. */}
      <div className="flex items-center justify-center gap-2 border-b border-amber-200/70 bg-amber-50 px-4 py-1.5 text-center text-xs font-medium text-amber-800">
        <span className="h-1.5 w-1.5 flex-none rounded-full bg-amber-400" aria-hidden />
        {t.reviewFlag}
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-content items-center justify-between gap-3 px-5 py-3.5 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 font-serif text-lg font-bold text-white shadow-sm">
              B
            </span>
            <span className="font-serif text-xl font-bold tracking-tight text-stone-900">Buan</span>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-stone-600 md:flex">
            {navLinks.map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="relative transition hover:text-stone-900 after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-teal-600 after:transition-transform after:duration-300 hover:after:scale-x-100"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <LangToggle />
            <a
              href="#early-access"
              className="hidden rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 sm:inline-flex"
            >
              {t.nav_cta}
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? t.menu_close : t.menu_open}
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-700 transition hover:bg-stone-100 md:hidden"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-5 w-5" aria-hidden>
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-stone-200/70 bg-white md:hidden">
            <nav className="mx-auto flex max-w-content flex-col gap-1 px-5 py-3">
              {navLinks.map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-2 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
                >
                  {label}
                </a>
              ))}
              <a
                href="#early-access"
                onClick={() => setMenuOpen(false)}
                className="mt-1 rounded-full bg-stone-900 px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                {t.nav_cta}
              </a>
            </nav>
          </div>
        )}
      </header>

      <main id="top">
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* layered background */}
          <div className="absolute inset-0 -z-10" aria-hidden>
            <div className="absolute inset-0 bg-gradient-to-b from-teal-50/80 via-white to-white" />
            <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-teal-300/30 blur-3xl" />
            <div className="absolute -right-20 top-10 h-80 w-80 rounded-full bg-emerald-300/25 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.05)_1px,transparent_0)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
          </div>

          <div className="mx-auto grid max-w-content items-center gap-12 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-8 lg:py-28">
            {/* Hero renders instantly (no reveal) for an immediate first paint. */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50/80 px-3.5 py-1.5 text-xs font-semibold text-teal-700 shadow-sm">
                <span className="buan-pulse h-1.5 w-1.5 rounded-full bg-teal-500" />
                {t.hero_pill}
              </span>
              <h1 className="mt-6 font-serif font-bold leading-[1.0] tracking-[-0.02em] text-stone-900 text-[clamp(2.75rem,7vw,4.75rem)]">
                {t.hero_title_a}
                <br />
                <span className="text-teal-600">{t.hero_title_b}</span>
              </h1>
              <p className="mt-6 text-xl font-medium text-stone-700">{t.hero_sub}</p>
              <p className="mt-4 max-w-xl text-pretty text-lg leading-relaxed text-stone-500">{t.hero_lede}</p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#early-access"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-teal-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-teal-600/25 transition duration-200 hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-xl hover:shadow-teal-600/25"
                >
                  {t.hero_cta_primary}
                  <Icon name="arrow" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </a>
                <a
                  href="#how"
                  className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white/70 px-7 py-3.5 font-semibold text-stone-800 backdrop-blur transition duration-200 hover:border-stone-400 hover:bg-white"
                >
                  {t.hero_cta_secondary}
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2.5">
                {t.hero_chips.map((chip) => (
                  <span key={chip} className="inline-flex items-center gap-1.5 text-sm text-stone-600">
                    <Icon name="check" className="h-4 w-4 text-teal-600" />
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <PhoneMock t={t} />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-24 border-t border-stone-100 bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-content px-5 sm:px-6 lg:px-8">
            <Reveal className="max-w-2xl">
              <Eyebrow>{t.how_eyebrow}</Eyebrow>
              <h2 className="mt-4 font-serif font-bold tracking-tight text-stone-900 text-balance text-[clamp(1.875rem,4vw,2.75rem)]">
                {t.how_heading}
              </h2>
              <p className="mt-3 text-pretty text-lg text-stone-600">{t.how_sub}</p>
            </Reveal>

            <div className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
              {/* connecting line on desktop */}
              <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-teal-200 via-teal-200 to-transparent md:block" aria-hidden />
              {steps.map(([title, body], i) => (
                <Reveal key={title} delay={i * 120} className="relative">
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 font-serif text-xl font-bold text-white shadow-lg shadow-teal-600/20 ring-4 ring-white">
                    {i + 1}
                  </div>
                  <h3 className="mt-5 font-serif text-xl font-bold text-stone-900">{title}</h3>
                  <p className="mt-2 leading-relaxed text-stone-600">{body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section id="uses" className="scroll-mt-24 border-t border-stone-100 bg-stone-50 py-20 sm:py-28">
          <div className="mx-auto max-w-content px-5 sm:px-6 lg:px-8">
            <Reveal className="max-w-2xl">
              <Eyebrow>{t.uses_eyebrow}</Eyebrow>
              <h2 className="mt-4 font-serif font-bold tracking-tight text-stone-900 text-balance text-[clamp(1.875rem,4vw,2.75rem)]">
                {t.uses_heading}
              </h2>
              <p className="mt-3 text-pretty text-lg text-stone-600">{t.uses_sub}</p>
            </Reveal>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {uses.map(([icon, title, body], i) => (
                <Reveal key={title} delay={(i % 3) * 90}>
                  <div className="group h-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-900/5 hover:ring-teal-200">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition group-hover:bg-teal-600 group-hover:text-white">
                      <Icon name={icon} className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 font-serif text-lg font-bold text-stone-900">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone-600">{body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-stone-100 bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-content px-5 sm:px-6 lg:px-8">
            <Reveal className="max-w-2xl">
              <Eyebrow>{t.feat_eyebrow}</Eyebrow>
              <h2 className="mt-4 font-serif font-bold tracking-tight text-stone-900 text-balance text-[clamp(1.875rem,4vw,2.75rem)]">
                {t.feat_heading}
              </h2>
            </Reveal>

            <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {t.feat.map(([title, body], i) => (
                <Reveal key={title} delay={(i % 3) * 90} className="flex gap-4">
                  <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 text-teal-700 ring-1 ring-teal-100">
                    <Icon name={FEAT_ICONS[i]} className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-stone-900">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-stone-600">{body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* No website? No problem */}
        <section className="relative overflow-hidden bg-stone-950 py-20 text-white sm:py-28">
          <div className="absolute inset-0 -z-0" aria-hidden>
            <div className="absolute -right-24 top-0 h-96 w-96 rounded-full bg-teal-600/25 blur-3xl" />
            <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-emerald-600/20 blur-3xl" />
          </div>
          <div className="relative mx-auto grid max-w-content items-center gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:px-8">
            <Reveal>
              <Eyebrow>{t.nw_eyebrow}</Eyebrow>
              <h2 className="mt-4 font-serif font-bold tracking-tight text-balance text-[clamp(1.875rem,4vw,2.75rem)]">
                {t.nw_heading}
              </h2>
              <p className="mt-4 max-w-lg text-pretty text-lg leading-relaxed text-stone-300">{t.nw_body}</p>
            </Reveal>
            <Reveal delay={120}>
              <ul className="space-y-3.5">
                {[t.nw_point1, t.nw_point2, t.nw_point3].map((p) => (
                  <li
                    key={p}
                    className="flex items-center gap-3.5 rounded-2xl bg-white/5 px-5 py-4 ring-1 ring-white/10 backdrop-blur"
                  >
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-400 text-stone-900">
                      <Icon name="check" className="h-4 w-4" />
                    </span>
                    <span className="font-medium text-stone-100">{p}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-24 border-t border-stone-100 bg-stone-50 py-20 sm:py-28">
          <div className="mx-auto max-w-content px-5 sm:px-6 lg:px-8">
            <Reveal className="mx-auto max-w-2xl text-center">
              <div className="flex justify-center">
                <Eyebrow>{t.price_eyebrow}</Eyebrow>
              </div>
              <h2 className="mt-4 font-serif font-bold tracking-tight text-stone-900 text-balance text-[clamp(1.875rem,4vw,2.75rem)]">
                {t.price_heading}
              </h2>
              <p className="mt-3 text-pretty text-lg text-stone-600">{t.price_sub}</p>
            </Reveal>

            <Reveal delay={100} className="mx-auto mt-12 max-w-md">
              {/* gradient ring wrapper */}
              <div className="rounded-[1.75rem] bg-gradient-to-br from-teal-500/40 via-emerald-500/30 to-transparent p-px shadow-xl shadow-teal-900/10">
                <div className="rounded-[1.7rem] bg-white p-8 sm:p-10">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                    {t.price_tag}
                  </span>
                  <div className="mt-5 flex items-end gap-2">
                    <span className="text-sm text-stone-500">{t.price_from}</span>
                    <span className="font-serif text-6xl font-bold tracking-tight tabular-nums text-stone-900">{t.price_amount}</span>
                    <span className="pb-1.5 text-stone-500">{t.price_per}</span>
                  </div>
                  <ul className="mt-7 space-y-3.5">
                    {t.price_bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3 text-stone-700">
                        <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-teal-100 text-teal-700">
                          <Icon name="check" className="h-3.5 w-3.5" />
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#early-access"
                    className="group mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-teal-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-teal-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-teal-700"
                  >
                    {t.price_cta}
                    <Icon name="arrow" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </a>
                  <p className="mt-4 text-xs leading-relaxed text-stone-500">{t.price_disclaimer}</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Early access lead form */}
        <section id="early-access" className="scroll-mt-24 border-t border-stone-100 bg-white py-20 sm:py-28">
          <div className="mx-auto grid max-w-content gap-12 px-5 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
            <Reveal>
              <Eyebrow>{t.lead_eyebrow}</Eyebrow>
              <h2 className="mt-4 font-serif font-bold tracking-tight text-stone-900 text-balance text-[clamp(1.875rem,4vw,2.75rem)]">
                {t.lead_heading}
              </h2>
              <p className="mt-4 max-w-md text-pretty text-lg leading-relaxed text-stone-600">{t.lead_sub}</p>
              <div className="mt-8 hidden items-center gap-4 lg:flex">
                <QrMark className="w-24" />
                <p className="max-w-[12rem] text-sm italic text-stone-500">{t.hero_name_note}</p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <LeadForm t={t} />
            </Reveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-stone-950 py-12 text-stone-400">
        <div className="mx-auto max-w-content px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 font-serif text-base font-bold text-white">
                B
              </span>
              <div>
                <p className="font-serif text-lg font-bold text-white">Buan</p>
                <p className="text-xs">{t.foot_tagline}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-500">{t.foot_lang}</span>
              <LangToggle light />
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-xs leading-relaxed text-stone-400">{t.foot_note}</p>
            <a
              href="/buan/login"
              className="inline-flex flex-none items-center gap-1.5 text-xs font-medium text-stone-400 transition hover:text-white"
            >
              {t.foot_staff}
              <Icon name="arrow" className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
