"use client";

/* ============================================================
   Tanio – QR drive-in ordering demo (M-SPARC)
   Bilingual (English / Cymraeg) single full-screen demo with
   three views, switched by the ?view= query param so the QR
   code can deep-link straight to the customer menu:
     (none)          → QR landing / table-tent
     ?view=menu      → customer order flow + live progress tracker
     ?view=dashboard → café staff dashboard

   Customers identify their car by NUMBERPLATE (stored, so it
   powers visit stats + a simple loyalty layer). Order status
   runs new → preparing → enroute → delivered, and the customer's
   confirmation screen subscribes to its own order so it updates
   live as the kitchen advances it.

   Realtime via ./tanioStore (shared /api/tanio server store backed
   by Vercel Blob; localStorage + BroadcastChannel fallback if the
   API is unreachable, e.g. local dev without the Blob token).
   ============================================================ */

import {
  useState, useEffect, useCallback, createContext, useContext,
} from "react";
import {
  money, newId, timeAgo, normPlate, probeApi,
  placeOrder, setStatus, clearAll, subscribe,
} from "./tanioStore";

const DEFAULT_LANG = "en";
const LANG_KEY = "tanio_lang";
const REWARD_THRESHOLD = 50; // £ spent per plate earns a free coffee (demo loyalty)

/* ---------------------------------------------------------------- */
/*  Menu (bilingual)                                                 */
/* ---------------------------------------------------------------- */
const MENU = [
  { id: "flatwhite",  emoji: "☕", price: 3.20, en: ["Flat White", "Double ristretto, silky milk"],   cy: ["Flat White", "Ristretto dwbl, llaeth sidanaidd"] },
  { id: "cappuccino", emoji: "☕", price: 3.00, en: ["Cappuccino", "Classic, dusted with cocoa"],       cy: ["Cappuccino", "Clasurol, â thaeniad o goco"] },
  { id: "latte",      emoji: "🥛", price: 3.40, en: ["Latte", "Smooth and milky"],                      cy: ["Latte", "Llyfn a llaethog"] },
  { id: "espresso",   emoji: "⚡", price: 2.50, en: ["Espresso", "Single origin, short & sharp"],       cy: ["Espresso", "Tarddiad sengl, byr a chryf"] },
  { id: "mocha",      emoji: "🍫", price: 3.60, en: ["Mocha", "Espresso + chocolate"],                  cy: ["Mocha", "Espresso a siocled"] },
  { id: "croissant",  emoji: "🥐", price: 2.80, en: ["Butter Croissant", "Baked this morning"],         cy: ["Croissant Menyn", "Wedi'i bobi y bore 'ma"] },
  { id: "bacon",      emoji: "🥓", price: 4.50, en: ["Bacon Roll", "Smoked back bacon, brown sauce"],   cy: ["Rholyn Bacwn", "Bacwn cefn mwg, saws brown"] },
  { id: "avocado",    emoji: "🥑", price: 6.50, en: ["Avocado Toast", "Sourdough, chilli, lime"],       cy: ["Tost Afocado", "Bara surdoes, tsili, leim"] },
  { id: "muffin",     emoji: "🫐", price: 2.90, en: ["Blueberry Muffin", "Warm, gooey"],                cy: ["Myffin Llus", "Cynnes a gludiog"] },
];
const BY_ID = Object.fromEntries(MENU.map((m) => [m.id, m]));
const itemName = (it, lang) => (BY_ID[it.id] ? BY_ID[it.id][lang][0] : it.name);

/* ---------------------------------------------------------------- */
/*  Translations                                                     */
/* ---------------------------------------------------------------- */
const DICT = {
  en: {
    sub_landing: "QR ordering – straight to your car",
    sub_customer: "Order to your car",
    sub_dash: "Live incoming orders · counter view",
    eyebrow: "Table tent / drive-in sticker",
    scan_head: "Scan to order",
    scan_sub: "Point your phone camera at the code. Order from your car – we'll bring it out to you.",
    open_menu: "Open the menu (this device)",
    view_dash: "View café staff dashboard →",
    demo_note_live: "Demo note: the QR encodes this page's menu link, so scanning on a phone opens the real flow. Orders sync live to the café dashboard on any device.",
    demo_note_local: "Demo note: the QR encodes this page's menu link, so scanning on a phone opens the real flow. Orders sync live to the café dashboard within this browser (open the dashboard in another tab).",
    banner_title: "Find out more about Tanio",
    banner_sub: "An M-SPARC initiative · m-sparc.com/tanio",
    lbl_menu: "Menu", lbl_details: "Details", lbl_pay: "Pay",
    q_head: "What can we get you?",
    subtotal: "Subtotal",
    add_details: "Add details →",
    where_head: "Your car",
    your_name: "Your name", name_ph: "e.g. Sioned",
    plate_label: "Car numberplate", plate_ph: "e.g. CA12 XYZ",
    plate_note: "📍 Staff bring your order out to your car – we'll match it to your numberplate.",
    to_pay: "Continue to payment →",
    back_menu: "← Back to menu",
    pay_head: "Payment",
    total_pay: "Total to pay",
    card_label: "Card number (demo – not charged)",
    pay_btn: "🔒 Pay & place order",
    processing: "Processing…",
    back: "← Back",
    pay_note: "No real payment is processed. This simulates a successful charge and sends the order to the café dashboard.",
    delivering_to: "🚗 Bringing it to {plate}",
    order_line: "Order {id} · {total}",
    peek_dash: "Peek at the café dashboard →",
    another: "Place another order",
    back_start: "← Back to start",
    live: "Live",
    clear_all: "Clear all",
    clear_confirm: "Clear all demo orders?",
    no_orders: "No orders yet",
    no_orders_sub: "Place one from the menu and it'll appear here automatically.",
    st_new: "New", st_preparing: "Preparing", st_enroute: "On its way", st_delivered: "Delivered",
    btn_start: "Start preparing", btn_enroute: "Out for delivery", btn_deliver: "Mark delivered",
    done_tick: "✓ Done",
    plate_badge: "Reg",
    returning: "↺ Returning · {n}",
    how_head: "How delivery works:",
    how_body: " each order shows the customer's numberplate in green. Staff tap Start preparing, then Out for delivery, then Mark delivered. New orders appear automatically – no refresh needed.",
    mode_live: "● Live · cross-device",
    mode_local: "● Local demo (this browser)",
    track_received: "Received", track_preparing: "Preparing", track_enroute: "On its way", track_delivered: "At your car",
    head_new: "Order received!",
    head_prep: "Your order is being prepared",
    head_enroute: "On its way to your car",
    head_delivered: "Delivered to your car – enjoy!",
    sub_new: "We've got it, {name} – we'll start shortly.",
    sub_prep: "Sit tight, {name} – we're on it.",
    sub_enroute: "Bringing it out to {plate} now.",
    sub_delivered: "It's at your car. Diolch!",
    eta_line: "Typically ready in about 5 min",
    eta_enroute: "Arriving at your car now",
    ordered_ago: "Ordered {ago}",
    updates_live: "Updates live as the kitchen works",
    loyalty_first: "★ First visit – croeso! We'll remember {plate} next time.",
    loyalty_back: "★ Welcome back · visit #{n} · £{spent} with us",
    reward_soon: "£{x} more spend until a free coffee ☕",
    reward_now: "🎉 £{threshold} reached – your next coffee is on us!",
  },
  cy: {
    sub_landing: "Archebu drwy god QR – yn syth i'ch car",
    sub_customer: "Archebu i'ch car",
    sub_dash: "Archebion byw yn cyrraedd · golwg cownter",
    eyebrow: "Cerdyn bwrdd / sticer gyrru-i-mewn",
    scan_head: "Sganiwch i archebu",
    scan_sub: "Anelwch gamera'ch ffôn at y cod. Archebwch o'ch car – fe ddown ni ag e atoch chi.",
    open_menu: "Agor y fwydlen (y ddyfais hon)",
    view_dash: "Gweld dangosfwrdd y staff →",
    demo_note_live: "Nodyn demo: mae'r cod QR yn cynnwys dolen y fwydlen, felly bydd sganio ar ffôn yn agor y broses go iawn. Mae archebion yn cydweddu'n fyw â dangosfwrdd y caffi ar unrhyw ddyfais.",
    demo_note_local: "Nodyn demo: mae'r cod QR yn cynnwys dolen y fwydlen, felly bydd sganio ar ffôn yn agor y broses go iawn. Mae archebion yn cydweddu'n fyw â dangosfwrdd y caffi o fewn y porwr hwn (agorwch y dangosfwrdd mewn tab arall).",
    banner_title: "Dysgwch fwy am Tanio",
    banner_sub: "Menter gan M-SPARC · m-sparc.com/tanio",
    lbl_menu: "Bwydlen", lbl_details: "Manylion", lbl_pay: "Talu",
    q_head: "Beth gawn ni i chi?",
    subtotal: "Is-gyfanswm",
    add_details: "Ychwanegu manylion →",
    where_head: "Eich car",
    your_name: "Eich enw", name_ph: "e.e. Sioned",
    plate_label: "Rhif cofrestru'r car", plate_ph: "e.e. CA12 XYZ",
    plate_note: "📍 Bydd y staff yn dod â'ch archeb at eich car – fe wnawn ni ei chydweddu â'ch rhif cofrestru.",
    to_pay: "Ymlaen i dalu →",
    back_menu: "← Yn ôl i'r fwydlen",
    pay_head: "Talu",
    total_pay: "Cyfanswm i'w dalu",
    card_label: "Rhif cerdyn (demo – ni chodir tâl)",
    pay_btn: "🔒 Talu a gosod yr archeb",
    processing: "Yn prosesu…",
    back: "← Yn ôl",
    pay_note: "Ni phrosesir taliad go iawn. Mae hyn yn dynwared taliad llwyddiannus ac yn anfon yr archeb at ddangosfwrdd y caffi.",
    delivering_to: "🚗 Yn dod ag e at {plate}",
    order_line: "Archeb {id} · {total}",
    peek_dash: "Cipolwg ar ddangosfwrdd y caffi →",
    another: "Gosod archeb arall",
    back_start: "← Yn ôl i'r dechrau",
    live: "Byw",
    clear_all: "Clirio popeth",
    clear_confirm: "Clirio holl archebion y demo?",
    no_orders: "Dim archebion eto",
    no_orders_sub: "Gosodwch un o'r fwydlen ac fe ymddengys yma'n awtomatig.",
    st_new: "Newydd", st_preparing: "Yn paratoi", st_enroute: "Ar ei ffordd", st_delivered: "Danfonwyd",
    btn_start: "Dechrau paratoi", btn_enroute: "Ar ei ffordd", btn_deliver: "Nodi fel wedi'i ddanfon",
    done_tick: "✓ Wedi gorffen",
    plate_badge: "Rhif",
    returning: "↺ Dychwelyd · {n}",
    how_head: "Sut mae'r danfon yn gweithio:",
    how_body: " mae pob archeb yn dangos rhif cofrestru'r cwsmer mewn gwyrdd. Mae'r staff yn tapio Dechrau paratoi, yna Ar ei ffordd, yna Nodi fel wedi'i ddanfon. Mae archebion newydd yn ymddangos yn awtomatig – does dim angen adnewyddu.",
    mode_live: "● Byw · traws-ddyfais",
    mode_local: "● Demo lleol (y porwr hwn)",
    track_received: "Derbyniwyd", track_preparing: "Paratoi", track_enroute: "Ar ei ffordd", track_delivered: "Wrth eich car",
    head_new: "Archeb wedi dod i law!",
    head_prep: "Mae eich archeb yn cael ei pharatoi",
    head_enroute: "Ar ei ffordd at eich car",
    head_delivered: "Wedi'i ddanfon i'ch car – mwynhewch!",
    sub_new: "Rydyn ni wedi'i derbyn, {name} – fe ddechreuwn ni cyn bo hir.",
    sub_prep: "Arhoswch yn eich unfan, {name} – rydyn ni wrthi.",
    sub_enroute: "Yn dod ag e at {plate} nawr.",
    sub_delivered: "Mae wrth eich car. Diolch!",
    eta_line: "Yn barod fel arfer mewn tua 5 munud",
    eta_enroute: "Yn cyrraedd eich car nawr",
    ordered_ago: "Archebwyd {ago}",
    updates_live: "Yn diweddaru'n fyw wrth i'r gegin weithio",
    loyalty_first: "★ Ymweliad cyntaf – croeso! Fe gofiwn ni {plate} y tro nesaf.",
    loyalty_back: "★ Croeso'n ôl · ymweliad #{n} · £{spent} gyda ni",
    reward_soon: "£{x} eto o wariant cyn coffi am ddim ☕",
    reward_now: "🎉 £{threshold} wedi'i gyrraedd – mae'r coffi nesaf ar y tŷ!",
  },
};

const fill = (str, vars) =>
  str.replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] != null ? vars[k] : ""));

const I18n = createContext({ lang: "en", t: (k) => k, setLang: () => {}, live: null });
const useI18n = () => useContext(I18n);

/* ---------------------------------------------------------------- */
/*  Shared bits                                                      */
/* ---------------------------------------------------------------- */
function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="langtoggle" role="group" aria-label="Language">
      <button lang="en" className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>English</button>
      <button lang="cy" className={lang === "cy" ? "on" : ""} onClick={() => setLang("cy")}>Cymraeg</button>
    </div>
  );
}

function Brand({ sub }) {
  return (
    <div className="brand">
      <div className="brand__logo">T</div>
      <div>
        <div className="brand__name">Tanio</div>
        <div className="brand__sub">{sub}</div>
      </div>
    </div>
  );
}

function Header({ sub }) {
  return (
    <div className="header">
      <Brand sub={sub} />
      <LangToggle />
    </div>
  );
}

function Banner() {
  const { t } = useI18n();
  return (
    <a className="banner" href="https://m-sparc.com/tanio/" target="_blank" rel="noopener noreferrer">
      <span className="banner__icon">T</span>
      <span className="banner__body">
        <span className="banner__title">{t("banner_title")}</span>
        <span className="banner__sub">{t("banner_sub")}</span>
      </span>
      <span className="banner__arrow">→</span>
    </a>
  );
}

function ModeChip() {
  const { t, live } = useI18n();
  const isLive = live !== false; // null (checking) shows as live/optimistic
  return (
    <span className={`mode ${isLive ? "mode--live" : "mode--local"}`}>
      {isLive ? t("mode_live") : t("mode_local")}
    </span>
  );
}

/* ---------------------------------------------------------------- */
/*  Landing / QR table-tent                                          */
/* ---------------------------------------------------------------- */
function Landing({ menuUrl, go }) {
  const { t, live } = useI18n();
  const qrSrc = menuUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(menuUrl)}`
    : null;
  return (
    <div className="wrap">
      <Header sub={t("sub_landing")} />
      <div className="card qr-card">
        <div className="eyebrow">{t("eyebrow")}</div>
        <h1>{t("scan_head")}</h1>
        <p className="muted">{t("scan_sub")}</p>
        <div id="qrcode">{qrSrc && <img src={qrSrc} width="220" height="220" alt="QR" />}</div>
        <p className="qr-url">{menuUrl || "…"}</p>
        <div className="spacer" />
        <button className="btn" onClick={() => go("menu")}>{t("open_menu")}</button>
        <div className="spacer" />
        <button className="btn btn--ghost" onClick={() => go("dashboard")}>{t("view_dash")}</button>
        <div className="note">{live === false ? t("demo_note_local") : t("demo_note_live")}</div>
      </div>
      <Banner />
      <div className="footrow"><ModeChip /></div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Live order tracker (shown to the customer after paying)          */
/* ---------------------------------------------------------------- */
const TRACK_IDX = { new: 0, preparing: 1, enroute: 2, delivered: 3 };

function OrderTracker({ initial }) {
  const { t, lang } = useI18n();
  const [order, setOrder] = useState(initial);
  const [visits, setVisits] = useState(1);
  const [spent, setSpent] = useState(initial.total || 0);

  useEffect(() => {
    return subscribe((list) => {
      const found = list.find((o) => o.id === initial.id);
      if (found) setOrder(found);
      const target = found || initial;
      const mine = list.filter((o) => normPlate(o.plate) === normPlate(target.plate));
      setVisits(mine.length || 1);
      setSpent(mine.reduce((s, o) => s + (Number(o.total) || 0), 0) || (target.total || 0));
    });
  }, [initial.id]);

  const status = order?.status || "new";
  const curIdx = TRACK_IDX[status] ?? 0;
  const steps = [t("track_received"), t("track_preparing"), t("track_enroute"), t("track_delivered")];

  const head =
    status === "delivered" ? t("head_delivered")
    : status === "enroute" ? t("head_enroute")
    : status === "preparing" ? t("head_prep")
    : t("head_new");
  const subKey =
    status === "delivered" ? "sub_delivered"
    : status === "enroute" ? "sub_enroute"
    : status === "preparing" ? "sub_prep"
    : "sub_new";

  // Loyalty (demo): reward each £REWARD_THRESHOLD spent on this plate.
  // The order that tips the running total past a threshold unlocks the reward.
  const spentBefore = Math.max(0, spent - (Number(order.total) || 0));
  const rewardNow = Math.floor(spent / REWARD_THRESHOLD) > Math.floor(spentBefore / REWARD_THRESHOLD);
  const remaining = REWARD_THRESHOLD - (spent % REWARD_THRESHOLD);
  const loyaltyMsg = visits <= 1
    ? t("loyalty_first", { plate: order.plate })
    : t("loyalty_back", { n: visits, spent: spent.toFixed(2) });
  const rewardMsg = rewardNow
    ? t("reward_now", { threshold: REWARD_THRESHOLD })
    : t("reward_soon", { x: remaining.toFixed(2) });

  return (
    <div className="card confirm">
      <div className="confirm__check">{status === "delivered" ? "🎉" : "✓"}</div>
      <h2 style={{ marginBottom: 8 }}>{head}</h2>
      <p className="muted">{t(subKey, { name: order.name || "", plate: order.plate }).replace(/\s+,/, ",")}</p>

      <div className="track">
        {steps.map((label, i) => (
          <div key={i} className={`track__step ${i < curIdx ? "done" : ""} ${i === curIdx ? "active" : ""}`}>
            {i > 0 && <span className={`track__line ${i <= curIdx ? "track__line--on" : ""}`} />}
            <div className="track__dot">{i < curIdx ? "✓" : i + 1}</div>
            <div className="track__label">{label}</div>
          </div>
        ))}
      </div>

      <div className="bay-badge">{t("delivering_to", { plate: order.plate })}</div>
      <p className="muted" style={{ fontSize: 14 }}>{t("order_line", { id: order.id, total: money(order.total) })}</p>

      {status !== "delivered" && <p className="eta">{status === "enroute" ? t("eta_enroute") : t("eta_line")}</p>}
      <p className="liveline">{t("ordered_ago", { ago: timeAgo(order.placed_at, lang) })} · {t("updates_live")}</p>

      <div className={`loyalty ${rewardNow ? "loyalty--reward" : ""}`}>
        <div className="loyalty__msg">{loyaltyMsg}</div>
        <div className="loyalty__reward">{rewardMsg}</div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Customer order flow                                              */
/* ---------------------------------------------------------------- */
function Customer({ go }) {
  const { t, lang } = useI18n();
  const [cart, setCart] = useState({});
  const [step, setStep] = useState("menu");
  const [name, setName] = useState("");
  const [plate, setPlate] = useState("");
  const [paying, setPaying] = useState(false);
  const [placed, setPlaced] = useState(null);

  const adjust = (id, delta) =>
    setCart((c) => {
      const q = Math.max(0, (c[id] || 0) + delta);
      const next = { ...c };
      if (q === 0) delete next[id]; else next[id] = q;
      return next;
    });

  const lines = Object.entries(cart).map(([id, qty]) => ({
    id, name: BY_ID[id][lang][0], qty, price: BY_ID[id].price,
  }));
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const stepIdx = { menu: 0, details: 1, pay: 2, done: 3 }[step];

  const pay = async () => {
    setPaying(true);
    try {
      const cleanPlate = plate.trim().toUpperCase();
      const order = await placeOrder({ id: newId(), name: name.trim(), plate: cleanPlate, items: lines, total });
      setPlaced(order || { id: newId(), name: name.trim(), plate: cleanPlate, total, status: "new", placed_at: new Date().toISOString() });
      setStep("done");
    } catch (e) {
      alert("Sorry, could not place the order (demo backend). " + e.message);
    } finally {
      setPaying(false);
    }
  };

  const reset = () => { setCart({}); setName(""); setPlate(""); setPlaced(null); setStep("menu"); };
  const steps = [`1 · ${t("lbl_menu")}`, `2 · ${t("lbl_details")}`, `3 · ${t("lbl_pay")}`];

  return (
    <div className="wrap">
      <Header sub={t("sub_customer")} />
      {step !== "done" && (
        <div className="steps">
          {steps.map((s, i) => (
            <div key={i} className={`step ${i === stepIdx ? "step--active" : ""} ${stepIdx > i ? "step--done" : ""}`}>{s}</div>
          ))}
        </div>
      )}

      {step === "menu" && (
        <>
          <h2>{t("q_head")}</h2>
          <div className="menu">
            {MENU.map((m) => (
              <div className="item" key={m.id} onClick={() => adjust(m.id, +1)}>
                <div className="item__emoji">{m.emoji}</div>
                <div className="item__body">
                  <div className="item__name">{m[lang][0]}</div>
                  <div className="item__desc">{m[lang][1]}</div>
                </div>
                <div className="item__price">{money(m.price)}</div>
                <button className="qtybtn" aria-label="−" onClick={(e) => { e.stopPropagation(); adjust(m.id, -1); }}>−</button>
                <span className="item__qty">{cart[m.id] || 0}</span>
                <button className="qtybtn" aria-label="+" onClick={(e) => { e.stopPropagation(); adjust(m.id, +1); }}>+</button>
              </div>
            ))}
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <div className="totals" style={{ border: 0, margin: 0, padding: 0 }}>
              <span className="muted">{t("subtotal")}</span>
              <strong className="tabular">{money(total)}</strong>
            </div>
            <div className="spacer" />
            <button className="btn" disabled={total === 0} onClick={() => setStep("details")}>{t("add_details")}</button>
          </div>
        </>
      )}

      {step === "details" && (
        <>
          <h2>{t("where_head")}</h2>
          <div className="card">
            <div className="field">
              <label>{t("your_name")}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name_ph")} />
            </div>
            <div className="field">
              <label>{t("plate_label")}</label>
              <input className="plate-input" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder={t("plate_ph")} />
            </div>
            <div className="note">{t("plate_note")}</div>
            <div className="spacer" />
            <button className="btn" disabled={!(name.trim() && plate.trim())} onClick={() => setStep("pay")}>{t("to_pay")}</button>
            <div className="spacer" />
            <button className="btn btn--ghost" onClick={() => setStep("menu")}>{t("back_menu")}</button>
          </div>
        </>
      )}

      {step === "pay" && (
        <>
          <h2>{t("pay_head")}</h2>
          <div className="card">
            <ul className="order__lines">
              {lines.map((l) => (
                <li key={l.id}><span><span className="q">{l.qty}×</span>{l.name}</span>
                  <span className="tabular">{money(l.qty * l.price)}</span></li>
              ))}
            </ul>
            <div className="totals"><span className="muted">{t("total_pay")}</span><strong className="tabular">{money(total)}</strong></div>
            <div className="spacer" />
            <div className="field">
              <label>{t("card_label")}</label>
              <input defaultValue="4242 4242 4242 4242" inputMode="numeric" />
            </div>
            <button className="btn" disabled={paying} onClick={pay}>{paying ? t("processing") : t("pay_btn")}</button>
            <div className="spacer" />
            <button className="btn btn--ghost" disabled={paying} onClick={() => setStep("details")}>{t("back")}</button>
            <div className="note">{t("pay_note")}</div>
          </div>
        </>
      )}

      {step === "done" && placed && (
        <>
          <OrderTracker initial={placed} />
          <div className="spacer" />
          <button className="btn btn--ghost" onClick={() => go("dashboard")}>{t("peek_dash")}</button>
          <div className="spacer" />
          <button className="btn btn--ghost" onClick={reset}>{t("another")}</button>
        </>
      )}

      <Banner />
      <div className="footrow">
        <button className="linkbtn" onClick={() => go("landing")}>{t("back_start")}</button>
        <ModeChip />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Café staff dashboard                                             */
/* ---------------------------------------------------------------- */
const NEXT = { new: "preparing", preparing: "enroute", enroute: "delivered", delivered: null };

function Dashboard({ go }) {
  const { t, lang } = useI18n();
  const [orders, setOrders] = useState([]);
  useEffect(() => subscribe(setOrders), []);

  const statusBtn = (s) =>
    s === "new" ? t("btn_start")
    : s === "preparing" ? t("btn_enroute")
    : s === "enroute" ? t("btn_deliver")
    : null;

  const advance = async (o) => {
    const next = NEXT[o.status];
    if (!next) return;
    setOrders((cur) => cur.map((x) => (x.id === o.id ? { ...x, status: next } : x)));
    await setStatus(o.id, next);
  };

  const wipe = async () => {
    if (confirm(t("clear_confirm"))) { await clearAll(); setOrders([]); }
  };

  const plateVisits = (plate) => orders.filter((o) => normPlate(o.plate) === normPlate(plate)).length;

  return (
    <div className="wrap wrap--wide">
      <div className="dash-head">
        <Brand sub={t("sub_dash")} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <LangToggle />
          <span className="live-dot">{t("live")}</span>
          <button className="btn btn--ghost" style={{ width: "auto", padding: "8px 14px" }} onClick={wipe}>{t("clear_all")}</button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="empty">
          <div className="empty__icon">🍽️</div>
          <h3>{t("no_orders")}</h3>
          <p className="muted">{t("no_orders_sub")}</p>
        </div>
      ) : (
        <div className="orders">
          {orders.map((o) => {
            const btn = statusBtn(o.status);
            const visits = plateVisits(o.plate);
            return (
              <div className="order" key={o.id}>
                <div className="order__top">
                  <div>
                    <div className="order__name">
                      {o.name}
                      {visits > 1 && <span className="returning">{t("returning", { n: visits })}</span>}
                    </div>
                    <div className="order__time">{o.id} · {timeAgo(o.placed_at, lang)}</div>
                  </div>
                  <div className="order__bay"><small>{t("plate_badge")}</small>{o.plate}</div>
                </div>
                <ul className="order__lines">
                  {(o.items || []).map((i, idx) => (
                    <li key={idx}><span><span className="q">{i.qty}×</span>{itemName(i, lang)}</span>
                      <span className="tabular">{money(i.qty * i.price)}</span></li>
                  ))}
                </ul>
                <div className="order__foot">
                  <span className={`status-pill status-${o.status}`}>{t(`st_${o.status}`)}</span>
                  {btn
                    ? <button className="btn" style={{ width: "auto", padding: "8px 14px" }} onClick={() => advance(o)}>{btn}</button>
                    : <span className="muted" style={{ fontSize: 12 }}>{t("done_tick")}</span>}
                </div>
                <div className="tabular" style={{ textAlign: "right", marginTop: 8, fontWeight: 700 }}>{money(o.total)}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="note"><strong>{t("how_head")}</strong>{t("how_body")}</div>
      <div className="footrow"><button className="linkbtn" onClick={() => go("landing")}>{t("back_start")}</button><ModeChip /></div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Root: language + view switch                                     */
/* ---------------------------------------------------------------- */
export default function Tanio() {
  const [view, setView] = useState("landing");
  const [menuUrl, setMenuUrl] = useState("");
  const [lang, setLangState] = useState(DEFAULT_LANG);
  const [live, setLive] = useState(null); // null = checking, true = shared server, false = local only

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view");
    if (v === "menu" || v === "dashboard") setView(v);
    setMenuUrl(window.location.origin + window.location.pathname + "?view=menu");
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "en" || saved === "cy") setLangState(saved);
    } catch {}
    probeApi().then(setLive);
  }, []);

  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem(LANG_KEY, l); } catch {}
  }, []);

  const t = useCallback((k, vars) => fill((DICT[lang] && DICT[lang][k]) || DICT.en[k] || k, vars), [lang]);

  const go = useCallback((v) => {
    setView(v);
    try {
      const url = new URL(window.location.href);
      if (v === "landing") url.searchParams.delete("view");
      else url.searchParams.set("view", v);
      window.history.replaceState({}, "", url);
    } catch {}
  }, []);

  return (
    <I18n.Provider value={{ lang, setLang, t, live }}>
      <div className="tanio" lang={lang}>
        <style>{CSS}</style>
        {view === "landing" && <Landing menuUrl={menuUrl} go={go} />}
        {view === "menu" && <Customer go={go} />}
        {view === "dashboard" && <Dashboard go={go} />}
      </div>
    </I18n.Provider>
  );
}

/* ---------------------------------------------------------------- */
/*  Scoped styles (all under .tanio)                                */
/* ---------------------------------------------------------------- */
const CSS = `
.tanio{
  --bg:#0f1211;--surface:#181c1b;--surface-2:#202624;--line:#2c3331;
  --text:#f4f6f5;--muted:#9aa5a1;--accent:#3ddc97;--accent-ink:#06281c;--warn:#ffd166;--info:#7fb1ff;
  --radius:14px;--radius-sm:10px;--shadow:0 8px 30px rgba(0,0,0,.35);
  --ease:cubic-bezier(.4,0,.2,1);
  position:absolute;inset:0;overflow:auto;background:var(--bg);color:var(--text);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  font-size:16px;line-height:1.5;-webkit-font-smoothing:antialiased;
}
.tanio *{box-sizing:border-box;}
.tanio h1,.tanio h2,.tanio h3,.tanio button,.tanio input{font-family:inherit;}
.tanio .wrap{max-width:480px;margin:0 auto;padding:24px 16px 48px;}
.tanio .wrap--wide{max-width:960px;}
.tanio .header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:24px;}
.tanio .brand{display:flex;align-items:center;gap:12px;}
.tanio .brand__logo{width:40px;height:40px;border-radius:12px;background:var(--accent);color:var(--accent-ink);display:grid;place-items:center;font-weight:800;font-size:20px;}
.tanio .brand__name{font-weight:700;font-size:20px;letter-spacing:-.01em;}
.tanio .brand__sub{color:var(--muted);font-size:12px;margin-top:-2px;}
.tanio .langtoggle{display:inline-flex;border:1px solid var(--line);border-radius:999px;overflow:hidden;flex:none;}
.tanio .langtoggle button{background:transparent;border:none;color:var(--muted);font-size:12px;font-weight:700;padding:6px 12px;cursor:pointer;transition:background .15s var(--ease),color .15s var(--ease);}
.tanio .langtoggle button.on{background:var(--accent);color:var(--accent-ink);}
.tanio h1{font-size:34px;line-height:1.15;letter-spacing:-.02em;margin:0 0 12px;}
.tanio h2{font-size:26px;letter-spacing:-.01em;margin:0 0 16px;}
.tanio h3{font-size:16px;margin:0 0 8px;}
.tanio .muted{color:var(--muted);}
.tanio .eyebrow{text-transform:uppercase;letter-spacing:.12em;font-size:12px;color:var(--accent);font-weight:700;margin-bottom:8px;}
.tanio .card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:24px;box-shadow:var(--shadow);}
.tanio .menu{display:flex;flex-direction:column;gap:8px;}
.tanio .item{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--surface);cursor:pointer;transition:border-color .15s var(--ease),transform .08s var(--ease);}
.tanio .item:hover{border-color:var(--accent);}
.tanio .item:active{transform:scale(.99);}
.tanio .item__emoji{font-size:24px;width:34px;text-align:center;}
.tanio .item__body{flex:1;min-width:0;}
.tanio .item__name{font-weight:600;}
.tanio .item__desc{font-size:12px;color:var(--muted);}
.tanio .item__price{font-variant-numeric:tabular-nums;font-weight:600;color:var(--accent);}
.tanio .item__qty{min-width:26px;text-align:center;font-variant-numeric:tabular-nums;font-weight:700;}
.tanio .qtybtn{width:30px;height:30px;border-radius:8px;border:1px solid var(--line);background:var(--surface-2);color:var(--text);font-size:18px;line-height:1;cursor:pointer;display:grid;place-items:center;transition:border-color .12s var(--ease);}
.tanio .qtybtn:hover{border-color:var(--accent);}
.tanio label{display:block;font-size:14px;margin-bottom:4px;color:var(--muted);}
.tanio .field{margin-bottom:16px;}
.tanio input{width:100%;padding:12px 14px;background:var(--surface-2);border:1px solid var(--line);border-radius:var(--radius-sm);color:var(--text);font-size:16px;transition:border-color .15s var(--ease),box-shadow .15s var(--ease);}
.tanio input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(61,220,151,.18);}
.tanio .plate-input{text-transform:uppercase;letter-spacing:.12em;font-weight:700;}
.tanio .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px 18px;border:none;border-radius:var(--radius-sm);background:var(--accent);color:var(--accent-ink);font-size:16px;font-weight:700;cursor:pointer;transition:transform .08s var(--ease),filter .15s var(--ease),opacity .15s var(--ease);}
.tanio .btn:hover{filter:brightness(1.05);}
.tanio .btn:active{transform:scale(.985);}
.tanio .btn:disabled{opacity:.4;cursor:not-allowed;}
.tanio .btn--ghost{background:transparent;color:var(--text);border:1px solid var(--line);}
.tanio .btn--ghost:hover{border-color:var(--accent);filter:none;}
.tanio .totals{border-top:1px dashed var(--line);margin-top:16px;padding-top:16px;display:flex;justify-content:space-between;align-items:baseline;}
.tanio .totals strong{font-size:20px;}
.tanio .tabular{font-variant-numeric:tabular-nums;}
.tanio .steps{display:flex;gap:8px;margin-bottom:24px;}
.tanio .step{flex:1;text-align:center;font-size:12px;padding:8px;border-radius:999px;background:var(--surface-2);color:var(--muted);border:1px solid var(--line);}
.tanio .step--active{background:var(--accent);color:var(--accent-ink);border-color:var(--accent);font-weight:700;}
.tanio .step--done{color:var(--accent);border-color:var(--accent);}
.tanio .confirm{text-align:center;padding:28px 16px;}
.tanio .confirm__check{width:72px;height:72px;border-radius:50%;background:var(--accent);color:var(--accent-ink);display:grid;place-items:center;margin:0 auto 20px;font-size:38px;animation:tanio-pop .4s var(--ease);}
@keyframes tanio-pop{0%{transform:scale(0);}70%{transform:scale(1.1);}100%{transform:scale(1);}}
.tanio .track{display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin:24px 0 16px;}
.tanio .track__step{flex:1;text-align:center;position:relative;}
.tanio .track__dot{position:relative;z-index:1;width:28px;height:28px;border-radius:50%;margin:0 auto 8px;display:grid;place-items:center;background:var(--surface-2);border:2px solid var(--line);color:var(--muted);font-size:13px;font-weight:800;transition:all .3s var(--ease);}
.tanio .track__step.done .track__dot,.tanio .track__step.active .track__dot{background:var(--accent);border-color:var(--accent);color:var(--accent-ink);}
.tanio .track__step.active .track__dot{box-shadow:0 0 0 5px rgba(61,220,151,.18);}
.tanio .track__label{font-size:11px;color:var(--muted);line-height:1.3;}
.tanio .track__step.active .track__label{color:var(--text);font-weight:700;}
.tanio .track__line{position:absolute;top:13px;right:50%;width:100%;height:2px;background:var(--line);z-index:0;}
.tanio .track__line--on{background:var(--accent);}
.tanio .eta{font-size:13px;color:var(--accent);font-weight:600;margin:0;}
.tanio .liveline{font-size:12px;color:var(--muted);margin-top:8px;display:inline-flex;align-items:center;gap:6px;}
.tanio .liveline::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--accent);animation:tanio-pulse 1.6s infinite;}
.tanio .loyalty{margin-top:20px;padding:12px 16px;border-radius:var(--radius-sm);background:var(--surface-2);border:1px solid var(--line);}
.tanio .loyalty--reward{border-color:var(--accent);background:rgba(61,220,151,.1);}
.tanio .loyalty__msg{font-size:13px;font-weight:700;color:var(--text);}
.tanio .loyalty__reward{font-size:12px;color:var(--accent);margin-top:2px;font-weight:600;}
.tanio .bay-badge{display:inline-flex;align-items:center;gap:8px;background:var(--surface-2);border:1px solid var(--accent);border-radius:999px;padding:8px 18px;font-weight:700;font-size:18px;letter-spacing:.06em;margin:8px 0;}
.tanio .qr-card{text-align:center;}
.tanio #qrcode{display:inline-block;padding:16px;background:#fff;border-radius:var(--radius);margin:16px 0;}
.tanio #qrcode img{display:block;}
.tanio .qr-url{font-size:12px;color:var(--muted);word-break:break-all;background:var(--surface-2);padding:8px 12px;border-radius:8px;border:1px solid var(--line);}
.tanio .dash-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;}
.tanio .live-dot{display:inline-flex;align-items:center;gap:8px;font-size:14px;color:var(--muted);}
.tanio .live-dot::before{content:"";width:9px;height:9px;border-radius:50%;background:var(--accent);animation:tanio-pulse 1.6s infinite;}
@keyframes tanio-pulse{0%{box-shadow:0 0 0 0 rgba(61,220,151,.55);}70%{box-shadow:0 0 0 10px rgba(61,220,151,0);}100%{box-shadow:0 0 0 0 rgba(61,220,151,0);}}
.tanio .orders{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;}
.tanio .order{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:16px;animation:tanio-slidein .35s var(--ease);}
@keyframes tanio-slidein{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
.tanio .order__top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;gap:8px;}
.tanio .order__bay{background:var(--accent);color:var(--accent-ink);border-radius:10px;padding:6px 10px;font-weight:800;font-size:15px;text-align:center;line-height:1.2;letter-spacing:.04em;white-space:nowrap;text-transform:uppercase;}
.tanio .order__bay small{display:block;font-size:9px;font-weight:700;opacity:.7;text-transform:uppercase;letter-spacing:.1em;}
.tanio .order__name{font-weight:700;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.tanio .returning{font-size:10px;font-weight:700;color:var(--info);background:rgba(127,177,255,.14);border:1px solid rgba(127,177,255,.4);padding:2px 7px;border-radius:999px;letter-spacing:.03em;}
.tanio .order__time{font-size:12px;color:var(--muted);}
.tanio .order__lines{list-style:none;padding:0;margin:0 0 12px;font-size:14px;}
.tanio .order__lines li{display:flex;justify-content:space-between;padding:2px 0;}
.tanio .order__lines .q{color:var(--accent);font-weight:700;margin-right:6px;}
.tanio .order__foot{display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);padding-top:12px;}
.tanio .status-pill{font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;text-transform:uppercase;letter-spacing:.06em;}
.tanio .status-new{background:rgba(255,209,102,.16);color:var(--warn);}
.tanio .status-preparing{background:rgba(61,220,151,.16);color:var(--accent);}
.tanio .status-enroute{background:rgba(127,177,255,.16);color:var(--info);}
.tanio .status-delivered{background:var(--surface-2);color:var(--muted);}
.tanio .empty{text-align:center;color:var(--muted);padding:48px 16px;border:1px dashed var(--line);border-radius:var(--radius);}
.tanio .empty__icon{font-size:42px;margin-bottom:12px;opacity:.6;}
.tanio .spacer{height:16px;}
.tanio .note{font-size:12px;color:var(--muted);background:var(--surface-2);border:1px solid var(--line);border-radius:var(--radius-sm);padding:12px;margin-top:16px;}
.tanio .banner{display:flex;align-items:center;gap:12px;text-decoration:none;background:linear-gradient(90deg,rgba(61,220,151,.14),rgba(61,220,151,.04));border:1px solid rgba(61,220,151,.35);border-radius:var(--radius-sm);padding:12px 16px;margin-top:24px;color:var(--text);transition:border-color .15s var(--ease);}
.tanio .banner:hover{border-color:var(--accent);}
.tanio .banner__icon{width:34px;height:34px;flex:none;border-radius:9px;background:var(--accent);color:var(--accent-ink);display:grid;place-items:center;font-size:18px;font-weight:800;}
.tanio .banner__body{flex:1;min-width:0;line-height:1.3;display:flex;flex-direction:column;}
.tanio .banner__title{font-weight:700;font-size:14px;}
.tanio .banner__sub{color:var(--muted);font-size:12px;}
.tanio .banner__arrow{color:var(--accent);font-weight:700;font-size:20px;}
.tanio .footrow{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:24px;}
.tanio .linkbtn{background:none;border:none;color:var(--accent);font-size:14px;cursor:pointer;padding:0;}
.tanio .linkbtn:hover{text-decoration:underline;}
.tanio .mode{font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;letter-spacing:.04em;}
.tanio .mode--live{background:rgba(61,220,151,.16);color:var(--accent);}
.tanio .mode--local{background:var(--surface-2);color:var(--muted);border:1px solid var(--line);}
`;
