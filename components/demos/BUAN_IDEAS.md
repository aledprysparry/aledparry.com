# Buan — Feature & Monetization Backlog

> **Buan** (Welsh: *fast / quick / soon*) — the digital sales layer for physical businesses.
> Scan a QR, order, collect when ready.
>
> Companion to [BUAN_BUILD_PLAN.md](./BUAN_BUILD_PLAN.md). That doc owns the **what/when**
> (phases P0–P9, schedule, data model). This doc owns the **what-we-charge-for**: the tiering,
> the premium backlog, the moat, the money levers, and the go-to-market wedge.
>
> Status: planning/ideas only. No product code here. All prices are **ranges to confirm**,
> not committed pricing. Welsh customer-facing strings are flagged `🏴 Welsh review` and must
> pass native review before launch (Tanio demo copy is first-draft).
>
> _Created 2026-06-23._

---

## 0. How to read this doc

Every idea carries four tags so the backlog is actionable, not a wishlist:

- **Tier** — `Free` · `Pro` · `Business` · `Enterprise` · `Add-on` (one-off or metered, sits on top of any tier).
- **Effort** — `S` (≤2 days) · `M` (≤1 week) · `L` (multi-week / needs new infra).
- **Phase** — maps to BUAN_BUILD_PLAN P0–P9. `⏩` = worth pulling earlier than its natural phase.
- **Why** — the one-line reason it sits in that tier (the upgrade trigger, or why it must stay free).

Design rule for the whole model: **the free tier must be good enough to run a real business on**,
or word-of-mouth dies. We monetize *scale, brand control, automation, and money-movement* — not
basic functioning. A café that takes 20 orders a day should never feel punished. A 12-stand festival
or a 5-site chain should feel the ceiling immediately.

---

## 1. Tiering table

Four tiers. Most of the world lives in **Free** and **Pro**; **Business** is multi-location and
events; **Enterprise** is custom contracts. Add-ons cut across all of them.

| Capability | Free | Pro | Business | Enterprise |
|---|:--:|:--:|:--:|:--:|
| **URL / brand** | | | | |
| Path slug `buan.co/your-cafe` | ✅ | ✅ | ✅ | ✅ |
| Premium short slug (reserved/vanity) | – | ✅ | ✅ | ✅ |
| Custom domain `order.yourcafe.com` | – | ✅ | ✅ | ✅ |
| White-label (remove "Powered by Buan") | – | ✅ | ✅ | ✅ |
| Full theme control (fonts, colours, CSS) | basic colour | ✅ | ✅ | ✅ |
| **Locations & menu** | | | | |
| Locations | 1 | 1 | up to ~10 | unlimited |
| Products / menu items | up to ~30 | unlimited | unlimited | unlimited |
| Live stock (unlimited/limited/out, "only X left") | ✅ | ✅ | ✅ | ✅ |
| Categories, allergens, prep-time per item | ✅ | ✅ | ✅ | ✅ |
| Scheduled menus (breakfast/lunch/day-of-week) | – | ✅ | ✅ | ✅ |
| AI menu import (URL / PDF / photo) | 1 trial | ✅ | ✅ | ✅ |
| **Ordering** | | | | |
| QR ordering + basket + receipt | ✅ | ✅ | ✅ | ✅ |
| Order dashboard + status advance | ✅ | ✅ | ✅ | ✅ |
| Timed collection slots + queue smoothing | basic | ✅ | ✅ | ✅ |
| Capacity throttle / "kitchen busy" nudge | – | ✅ | ✅ | ✅ |
| Sub-location QRs (table / bay / stand) | – | – | ✅ | ✅ |
| Multi-vendor event mode (shared event, many sellers) | – | – | ✅ | ✅ |
| **Money** | | | | |
| Per-order platform fee | higher | lower | lowest | 0 / negotiated |
| Payments (business's own Stripe) | ✅ | ✅ | ✅ | ✅ |
| Managed payouts (Stripe Connect, Buan custody) | – | ✅ | ✅ | ✅ |
| **Growth & retention** | | | | |
| End-of-day offers + stock recovery | 1 active | ✅ | ✅ | ✅ |
| Loyalty (visit/spend, stamp cards) | basic | ✅ | ✅ | ✅ |
| Re-engagement marketing (email/SMS blasts) | – | ✅ | ✅ | ✅ |
| Discovery listing on `buan.co` map | ✅ | ✅ boosted | ✅ boosted | ✅ boosted |
| **Insight** | | | | |
| Core analytics (today's sales, best-sellers) | ✅ | ✅ | ✅ | ✅ |
| Advanced analytics (peak times, missed sales, cohort) | – | ✅ | ✅ | ✅ |
| Demand forecasting (AI prep/stock guidance) | – | – | ✅ | ✅ |
| Cross-location roll-up reporting | – | – | ✅ | ✅ |
| Data export (CSV) | ✅ | ✅ | ✅ | ✅ |
| **Platform** | | | | |
| Staff accounts / roles | 1 user | up to ~5 | up to ~25 | unlimited |
| SMS notifications | – | Add-on | included pool | included pool |
| API + webhooks | – | read-only | full | full + SLA |
| Integrations (accounting, EPOS) | – | – | ✅ | ✅ |
| Priority support / onboarding concierge | community | email | priority | dedicated + SLA |
| Audit log, SSO, contractual SLA | – | – | – | ✅ |

**Why the lines fall where they do**

- **Free is a working till, not a trial.** One location, a real menu, real card payments, live
  stock, core analytics. A solo café never *needs* to upgrade to operate. We earn from them on the
  per-order fee, not by crippling them. This is the growth engine.
- **Pro is the "this is my brand / this is my main channel" tier.** The moment ordering matters to
  a business, three things start to itch: the URL says *buan.co* not *them*, there's a "Powered by
  Buan" footer, and they want to push offers and loyalty to bring people back. Pro removes all three.
  Custom domain + white-label + marketing + lower per-order fee. **This is the core revenue tier.**
- **Business is "more than one of me".** Chains, multi-site operators, and event organizers running
  many vendors under one roof. The upgrade triggers are physical: 2nd location, sub-location QRs,
  multi-vendor, cross-location reporting, forecasting, EPOS/accounting sync. Per-order fee drops
  again to reward volume.
- **Enterprise is contractual, not feature-gated.** SSO, audit log, SLA, zero or negotiated per-order
  fee, dedicated support, custom integrations. Sold by conversation, priced bespoke.

**Indicative pricing (RANGES TO CONFIRM — do not quote):**
Free £0 + higher per-order fee · Pro ~£15–29/mo · Business ~£59–99/mo (or per-location) ·
Enterprise custom. Per-order fee tapering ~1.5–2% (Free) → ~0.5–1% (Pro) → ~0% (Business) is the
**second lever** that makes upgrading pay for itself for high-volume businesses (see §4).

---

## 2. Pro / premium feature backlog

Grouped by theme. The seed example (bespoke URL) leads.

### 2.1 Brand & URL control

| Idea | Tier | Effort | Phase | Why |
|---|---|:--:|:--:|---|
| **Premium short / vanity slug** | Pro | S | P2 | Free gets `buan.co/the-bridge-cafe-cardiff`; Pro can claim the clean `buan.co/bridge`. Reserved-word + collision rules already needed in P2; this just gates the good ones. |
| **Custom domain** `order.yourcafe.com` | Pro | M | P2 ⏩ | The headline upgrade. CNAME + automated TLS (Vercel domains API). Sell the moment onboarding ships — it is the single clearest "looks like *my* business" lever. |
| **White-label (remove "Powered by Buan")** | Pro | S | P1/P4 ⏩ | One flag on the footer/meta. Trivial to build, high perceived value. Keep the free badge tasteful so it's an *aspiration*, not an embarrassment. |
| **Full theme control** (fonts, colour, logo, hero, custom CSS snippet) | Pro | M | P3 | Free = pick brand colour + logo. Pro = own the whole page. Matches "looks like my brand" upgrade trigger. |
| **Branded receipts / confirmation emails** | Pro | S | P5 | Reuse Capsiynau email-layout contract; swap Buan chrome for the tenant's. |
| **Branded PWA / "add to home screen"** | Business | M | P9 | Their icon on a customer's phone. Repeat-venue businesses (workplace canteens) love this. |

### 2.2 AI & automation (your Anthropic edge)

| Idea | Tier | Effort | Phase | Why |
|---|---|:--:|:--:|---|
| **AI menu import (URL / PDF / photo)** | Free 1 trial, then Pro | M | P9 ⏩ | Biggest onboarding friction-killer. Point at an existing menu page / upload a PDF or a photo of a chalkboard → structured products, prices, categories, allergens drafted for review. One free run to prove magic; unlimited on Pro. **Pull this forward — it shortens time-to-first-menu for everyone and is a demo centrepiece.** |
| **Demand forecasting** | Business | L | P9 | "Based on last 4 Fridays + weather, prep ~40 baguettes; you usually sell out of flat whites by 10:30." Needs order history, so it naturally rewards tenure. Drives Business upgrades. |
| **AI end-of-day assistant** | Pro | M | P7/P9 | At close, looks at unsold limited-stock and *proposes* an offer + the notification copy. Turns waste into recovered revenue with one tap. Bilingual copy 🏴 Welsh review. |
| **Smart prep-time / queue engine** | Pro | M | P6 | Dynamic ETA from live order load, not a static number. "Kitchen busy — collect 13:10." This is a genuine B2B value prop, not a gimmick. |
| **AI review/insight digest** | Business | S | P8 | Weekly plain-English "here's what changed and what to do" over the analytics. Cheap with your existing AI plumbing; high stickiness. |
| **Auto-translate menu (EN↔CY + more)** | Pro | M | P3/P9 | Draft the other language from one. **Must** route through native Welsh review before publish — never auto-publish CY. 🏴 Welsh review. |

### 2.3 Analytics & insight

| Idea | Tier | Effort | Phase | Why |
|---|---|:--:|:--:|---|
| Core dashboard (today's sales, order count, best-sellers) | Free | S | P8 | Table stakes. Keep it free or the product feels blind. |
| **Advanced analytics** (peak times, missed-sales / out-of-stock lost revenue, basket size, repeat rate) | Pro | M | P8 | "Missed sales" is the killer chart — shows money left on the table, which *is* the upgrade pitch. |
| **Cohort / loyalty analytics** (new vs returning, RFM) | Pro | M | P8 | Pairs with loyalty + re-engagement. |
| **Cross-location roll-up** | Business | M | P8 | Only meaningful with >1 site; clean tier boundary. |
| **Scheduled report email / PDF** | Pro | S | P8 | "Your week at Bridge Café." Low effort, feels premium, keeps them logging in. |

### 2.4 Money movement & payments

| Idea | Tier | Effort | Phase | Why |
|---|---|:--:|:--:|---|
| Business's own Stripe (they keep custody) | Free+ | M | P5 | Default, lowest-risk for us. Their money never touches us → less compliance burden. |
| **Managed payouts (Stripe Connect)** | Pro | L | P5/P9 | We custody + pay out. Convenience some businesses want (one less Stripe account). Enables multi-vendor event splits. Higher compliance load → price accordingly. |
| **Reduced / zero per-order fee** | Pro→Business→Enterprise | S | P5 | The fee taper *is* a feature. High-volume sites do the maths and upgrade to kill the per-order cut. |
| **Tips / gratuity** | Free | S | P4/P5 | Add a tip step at checkout. Free to all (goodwill), but raises basket size → raises our per-order take. |
| **Pre-auth / tab mode** (open a tab, pay on collect) | Business | L | P9 | Festivals, bars. Needs Connect + auth-and-capture. Niche but high-value for events. |
| **Deposits / pre-orders for events** | Business | M | P9 | Take a deposit to hold a slot. Event/catering vertical. |

### 2.5 Retention, loyalty & marketing

| Idea | Tier | Effort | Phase | Why |
|---|---|:--:|:--:|---|
| Basic loyalty (visit/spend per identifier) | Free | S | P3/P4 | Demo already proves this (numberplate/spend). Keep a basic version free. |
| **Digital stamp cards / rewards** ("10th coffee free") | Pro | M | P7 | Classic café retention, clean Pro feature. |
| **Re-engagement campaigns** (email/SMS blast to past customers: "we miss you", new menu) | Pro | M | P7/P9 | Owns the customer relationship → real lock-in. SMS metered as Add-on. 🏴 Welsh review on templates. |
| **Customer CRM** (consented profiles, order history, segments) | Pro | M | P8 | Foundation for campaigns + cohort analytics. Consent/GDPR care needed. |
| **Referral / "share this order"** | Free | S | P4 | Customer-side virality — every shared order markets Buan + the business. Free on purpose. |
| **Win-back offer automation** | Business | M | P9 | "Auto-send a 10%-off to anyone who hasn't ordered in 30 days." Sits on CRM + offers. |

### 2.6 Operations, slots & queue

| Idea | Tier | Effort | Phase | Why |
|---|---|:--:|:--:|---|
| Timed collection slots | Free basic / Pro full | M | P6 | Free: fixed slot length. Pro: dynamic, capacity-aware, throttling. |
| **Capacity throttle / "sold out for now"** | Pro | M | P6 | Stops the kitchen drowning at 12:30. Operationally valuable → easy upsell. |
| **Sub-location QRs** (table, bay, stand, desk) | Business | M | P9 | "Deliver to table 4" / "charging bay 7". The original EV use-case lives here. Multi-vendor needs it too. |
| **Printable QR / poster designer** | Free template / Pro branded | S | P2 | Free = standard QR PDF. Pro = branded table-tent / A-board / window-cling templates. Reuse your design-system + poster work. |
| **Kitchen / barista display mode (KDS)** | Pro | M | P4/P6 | A full-screen "tickets" view for the prep station, separate from the admin dashboard. |
| **Print to receipt/ticket printer** | Business | L | P9 | ESC/POS or cloud-print integration. Real kitchens want paper tickets. Hardware-adjacent → Business. |

### 2.7 Platform, API & integrations

| Idea | Tier | Effort | Phase | Why |
|---|---|:--:|:--:|---|
| **Webhooks** (order.created, order.ready, payment.succeeded) | Pro read-only / Business full | M | P9 | Lets a business wire Buan into Slack, Zapier, their own tools. Developer hook = stickiness. |
| **Public API** | Business | L | P9 | Programmatic menu/order access. Enterprise gets SLA. |
| **Accounting integration** (Xero / QuickBooks-style export) | Business | M | P9 | Daily takings → their books. Confirm partners; build CSV/export first, native connector later. |
| **EPOS / till integration** | Business | L | P9 | Sync menu + orders with an existing till. High-value, partner-dependent. Confirm targets before committing. |
| **SMS notifications** ("your order's ready") | Add-on | M | P7 | Metered (Twilio-class cost). Pool included on Business+. Email free for all. |
| **Multi-vendor event mode** (one event, many sellers, one customer basket) | Business | L | P9 | Festivals/markets. The standout B2B2C play. Needs Connect for split payouts + sub-locations. |
| **SSO / audit log / role granularity** | Enterprise | M | P9 | Procurement requirements for larger/public-sector clients. |
| **Staff accounts & roles** | tiered counts | S | P0/P8 | 1 free → ~5 Pro → ~25 Business. Natural scaling gate, low build cost. |

---

## 3. Differentiators / moat

Generic QR-menu tools (the "scan to see a PDF menu" crowd) stop at *display*. Buan's defensible
edges are about *moving stock, smoothing time, and owning the relationship*:

1. **Queue-smoothing as a first-class engine, not a label.** Dynamic prep-time + capacity throttle
   + "collect at 13:10" nudges. This is operational software, not a menu viewer. (P6, Pro.)
2. **End-of-day stock recovery.** The "turn waste into a flash offer in one tap, with AI-drafted
   copy" loop. No generic QR tool does revenue *recovery*. Emotionally resonant for owners who hate
   binning food. (P7, Pro.)
3. **Demand forecasting from real order history.** Compounding moat — the longer a business stays,
   the better and stickier it gets. Switching cost rises with tenure. (P9, Business.)
4. **Bilingual / Welsh-first by default.** Genuinely differentiated in the Welsh market and a
   credibility signal everywhere (msparc, public sector, festivals, Eisteddfod-type events).
   Competitors bolt on translation; Buan is bilingual natively. 🏴 Welsh review on all copy.
5. **Agent-assisted setup.** AI menu import + auto-translate + AI offer copy collapse onboarding
   from "an afternoon of data entry" to "point at your existing menu." Lowest time-to-value in the
   category, powered by your existing Anthropic experience. (P9 ⏩.)
6. **Multi-vendor event mode.** One QR, one basket, many sellers, split payouts. Turns Buan from a
   per-shop tool into event infrastructure — a wedge a generic menu tool structurally can't reach.
   (P9, Business.)
7. **Own-the-customer retention layer.** Loyalty + CRM + re-engagement means the business's repeat
   trade lives in Buan. That is the real lock-in; menus are commodity, the customer list is not.

**Where the moat is shallow (be honest):** the basic scan→order→pay loop is replicable. Don't
defend that — defend the *recovery / forecasting / events / relationship* layer above it. Free tier
intentionally commoditizes the loop so adoption is frictionless; we earn on everything above it.

---

## 4. Monetization levers

### Recommended model (from owner pricing discussion, 2026-06-24)

Buan is **not a marketplace** (see §3), so it must not price like one. Three coherent levers, aligned
with the "your shop, not a marketplace" promise that is now live on the landing page:

1. **Per-location subscription = the engine.** One predictable monthly cost per location (tiered
   Free / Pro / Business). This is the **primary** revenue, not the transaction fee. Scales with the
   customer's footprint; gives predictable MRR.
2. **Card fee thin and honest: ~2-3% all-in, tapering to ~0% on higher tiers. Cash = free.** Frame it
   as "card processing at cost plus a small platform fee", **never** "commission". Cash orders still
   flow through Buan (ordering, queue, collection code, analytics) at no transaction cost; the
   per-location sub still applies because they are using the software.
3. **Add-ons for expansion.** Keep the base price low for acquisition; charge for what costs us money
   per use (SMS, AI, payouts) or delivers brand/scale/insight (see lever 4 + §2). **Replace any
   upfront "join fee" with optional paid onboarding** (done-for-you setup, poster pack) - a mandatory
   join fee is friction on acquisition, the opposite of what a land-grab freemium needs.

**Why a flat 10% commission was rejected:** card processing actually costs ~1.5-2%; **10% is Just Eat
/ Deliveroo marketplace-commission territory** and directly contradicts §3 and the live landing copy.
It can also exceed a café's net margin (hospitality runs thin), so we would be taking more than the
business earns on those sales. Owners do this maths in the first meeting:

| Card fee on £2,000/week card sales | Per week | Per year |
|---|---|---|
| 10% (rejected) | £200 | £10,400 |
| ~2-3% (recommended, processing + thin margin) | £40-60 | ~£2,000-3,000 |
| ~1.5% (pass-through only) | £30 | £1,560 |

Keep the cut thin; earn on the per-location subscription + add-ons. All figures are ranges to confirm.

**The five levers in detail** (deliberately stacked so a business can pay us in whatever way suits it):

1. **Subscription tier (primary).** Free / Pro / Business / Enterprise per §1. Predictable MRR.
   Pro is the volume revenue tier; Business is the expansion tier.
2. **Per-order platform fee (secondary, and a feature in disguise).** Small % per paid order,
   **tapering by tier**: highest on Free, near-zero on Business, negotiable on Enterprise. This does
   two jobs: monetizes the large free base, and makes upgrading *pay for itself* for high-volume
   sites (the fee they save exceeds the subscription). Confirm the exact taper before P5.
3. **Payment-custody choice.** (a) Business's own Stripe = our lowest risk, default. (b) Managed
   payouts via Connect = a convenience we can charge a small margin for, and the enabler for
   multi-vendor splits. Offering both widens the funnel.
4. **Metered add-ons.** SMS notification pool, extra/priority collection-slot capacity at peak,
   extra staff seats, additional locations beyond a tier's cap, AI-import credits beyond the free
   allowance. Usage-based revenue that scales with the customer's own success.
5. **Services / one-offs.** Onboarding concierge, custom-domain setup-done-for-you, branded poster
   pack, bespoke integration builds (Enterprise). Low-frequency, high-margin, and a relationship
   on-ramp.

**Pricing posture:** keep it *flexible* through MVP (BUAN_BUILD_PLAN open decision #2). Launch with a
**per-location subscription (real Free tier) + a thin card fee (~2-3%, cash free)** and *announce*
Pro/Business so the upgrade path is visible from day one. Lock the per-location price, the card-fee
taper and the Pro price before P5 (payments). All numbers above are ranges to confirm - do not
publish them. **Do not price like a marketplace** - it breaks the §3 moat.

---

## 5. Growth / wedge

### 5.1 Which verticals to win first

Sequence by *fastest time-to-value* and *tightest word-of-mouth loop*, not by market size:

1. **Independent cafés & coffee shops (beachhead).** Daily repeat trade, acute queue pain at peak,
   real end-of-day waste, owners who feel both. The end-of-day-offer + queue-smoothing story lands
   hardest here. Win the local cluster, let foot-traffic-adjacent owners see it. **Start here.**
2. **Workplace / office catering & canteens.** Captive repeat audience, pre-order smooths the lunch
   rush, branded-PWA "add to home screen" sticks. Cleaner sales cycle (one facilities buyer, many
   daily users). Strong second.
3. **Events, festivals & markets.** The multi-vendor event-mode showcase. Spiky but high-visibility;
   one good festival = dozens of vendors seeing Buan in the wild + a flagship case study. Pull in
   once event-mode (P9) is real; until then, single-vendor pop-ups/food-trucks are a fine entry.
4. **EV / Tesla charging & dwell-time retail** (the original Tanio use-case). "Order while you
   charge, collect when ready." Sub-location/bay QRs (P9) unlock it. Keep warm, not first.
5. **Service businesses & retail click-and-collect.** Broadest but vaguest pain → later, once the
   core loop and references exist.

**Welsh-market wedge:** lead in Wales where bilingual-by-default is a genuine differentiator and
your network (msparc, Capsiynau/Nodiadau footprint, Welsh public-sector/events) gives warm intros.
Win Wales credibly, then the bilingual capability travels as a *feature* into England/Ireland rather
than a *constraint*. 🏴 Welsh review on every public string before any of this.

### 5.2 Referral & viral loops

- **Customer-side (built-in, free):** every order page is a billboard. "Share this order", referral
  codes, and the (tasteful) free-tier "Powered by Buan" footer each turn a customer interaction into
  acquisition. The footer is the freemium flywheel — it's why white-label is a *paid* removal.
- **Business-side:** referral credit ("give a month, get a month"), and a public **case-study / "Buan
  in the wild"** stream of real venues. Local density compounds — neighbouring shops notice.
- **Event-led:** organizers onboard many vendors at once. One event signup = a batch of businesses
  meeting Buan simultaneously. Highest-leverage B2B loop; design event-mode onboarding for it.

### 5.3 Marketplace / discovery angle

- **`buan.co` discovery map / directory.** Every business gets a free listing (find places ordering
  with Buan near you). For the business it's free inbound; for Buan it's a consumer-facing surface
  that compounds as density grows.
- **Boosted placement** = a Pro/Business perk (and a future ad lever). Don't over-invest pre-density
  — a directory is only valuable once enough venues exist in an area. Treat it as a **Phase-2+ growth
  bet**, not an MVP must. Ship the free listing early (cheap), earn from boost/ads later.
- **Consumer "Buan" app/PWA (long-horizon):** one identity, order anywhere, loyalty that travels
  across venues. This is the platform end-state — a network where the *customer* relationship is
  Buan's, not just the business's. Only pursue once multi-venue density is real; flag, don't build.

---

## 6. Open questions to resolve (carry into the build-plan decisions)

These extend BUAN_BUILD_PLAN §8. Resolve the starred ones before the phase noted:

1. **Per-location price + card-fee taper** — the monthly per-location price per tier, and the card-fee
   taper (~2-3% → ~0%). Direction set (see §4 recommended model); confirm exact numbers. ⭐ Before **P5**.
2. **Pro price point** — ~£15 vs ~£29 changes the whole funnel. ⭐ Before **P5**.
3. **Custom-domain mechanics** — Vercel domains API vs manual; who pays for the cert/renewal
   (absorbed vs add-on). Before **P2** (custom domain is a P2⏩ Pro feature).
4. **AI-import free allowance** — 1 run? per-month credits? Cost-control on the Anthropic spend.
   Before pulling AI-import forward.
5. **SMS** — Twilio-class provider + metered pricing, or stay email-only through MVP. Before **P7**.
6. **Managed payouts** — do we take on Connect custody at all in v1, or business-owns-Stripe only
   until events demand splits. Before **P5**.
7. **Discovery directory** — commit to the consumer surface, or hold until density. Growth call, not
   a blocker.
8. **🏴 Welsh review gate** — every customer + marketing string (offer copy, re-engagement templates,
   auto-translate output) passes native review before publish. Standing gate, all phases.

---

_Pairs with [BUAN_BUILD_PLAN.md](./BUAN_BUILD_PLAN.md). Ideas/planning only — no committed pricing,
no product code. All £ figures are ranges to confirm. Last updated 2026-06-23._
