# Buan — Build Plan & Schedule

> **Buan** (Welsh: *fast / quick / soon*) — the digital sales layer for physical businesses.
> Scan a QR, order, collect when ready. No app, no queue, no complex setup.
>
> This is the productization of the **Tanio** demo (`/app/msparc/tanio`) into a
> multi-tenant SaaS. EV/Tesla charging is now one use-case among many (hospitality,
> workplace catering, events, retail, services).
>
> Decision (2026-06-02): **evolve from the existing Tanio demo** rather than a fresh
> repo. See "Graduation gate" below — the demo seeds the front-end; the platform
> layer (auth, multi-tenant DB, payments, admin) is net-new.

---

## 1. Starting point — what the Tanio demo already gives us

Reusable as the seed (proven, live, bilingual):
- **Customer ordering flow** — menu → cart → details → mock pay → confirmation.
- **Live order tracker** — 4 steps (new → preparing → on its way → delivered).
- **Staff dashboard** — live orders, status advance, returning-customer badge.
- **Bilingual EN/CY** with persisted toggle + natural Welsh.
- **Numberplate capture + spend-based loyalty** (per-identifier visit/spend stats).
- **Shared server store pattern** — `/api/tanio` over Vercel Blob (cross-device).
- Design system (scoped tokens), QR generation, view-by-query-param routing.

What it is NOT (the net-new platform work):
- Single-tenant, no auth, no business accounts, no slugs.
- Blob JSON store, not a relational multi-tenant DB.
- Mock payment, no Stripe, no subscriptions.
- No stock, no collection slots, no offers, no admin, no analytics.

## 2. Graduation gate (important)

"Evolve the demo" works for the **front-end MVP**, but a multi-tenant SaaS with
Stripe + auth + `buan.co/company-x/location` routing will outgrow a component in a
portfolio site. Plan to **extract to its own repo + `buan.co` deployment + dedicated
Supabase project** at the point we add real auth + payments (≈ end of Phase 2 / start
of Phase 3). Until then, prototype in `aledparry.com` to reuse the demo directly.
**This extraction is an explicit Phase-2 decision, not a surprise.**

## 3. Architecture (proposed — matches your existing stack)

- **Frontend:** Next.js (App Router) — evolve the demo's React components.
- **DB + auth:** Supabase (Postgres + RLS) — multi-tenant, same pattern as
  Capsiynau / Nodiadau / social-desk. RLS keyed on `business_id`.
- **Payments:** Stripe Checkout + webhooks (MVP) → Stripe Connect (marketplace, later).
- **Notifications:** email/SMS first (Resend, as elsewhere) — push is "Later".
- **AI hooks (Phase 2):** reuse your Anthropic experience — menu import, demand
  forecasting, end-of-day assistant.
- **Domain:** `buan.co` (slug + location path routing).

### Data model sketch
`businesses` (slug, name, branding, category, vat/company, owner) ·
`locations` (business_id, slug, address, hours, collection_instructions, qr) ·
`sub_locations` (location_id, label — floor/stand/bay; **Later**) ·
`products` (location_id, name, price, image, category, prep_time, allergens, tags, visible) ·
`stock` (product_id, type unlimited|limited|out, qty) ·
`orders` (location_id, items jsonb, total, status, collection_slot, customer, placed_at) ·
`offers` (location_id, products, discount, window) ·
`users` (business_id, role) · `subscriptions` (business_id, plan, stripe_*).
All business-scoped tables: RLS `using (business_id = auth-derived)` + explicit GRANTs.

## 4. Phased build (evolves from the demo)

| Phase | Goal | Rough effort | Key reuse / notes |
|------|------|------|------|
| **P0 Foundation** | Extract demo into a Buan shell; Supabase schema + RLS; auth; slug routing skeleton | ~1–2 wks | Lift demo components; swap Blob store → Supabase |
| **P1 Marketing site** | `buan.co` landing, how-it-works, use-cases, pricing (flexible), lead capture | ~1 wk | New; bilingual from day 1 |
| **P2 Onboarding** | Account → business setup → unique slug → locations → QR generation; **extraction to own repo/domain** | ~2 wks | Slug rules (reserved words blocked); QR engine from demo |
| **P3 Menu & stock** | Product CRUD, categories, live stock (unlimited/limited/out), "only X left" | ~1–2 wks | Demo menu schema → real products |
| **P4 Customer ordering** | Multi-tenant public menu + basket + order receipt; evolve demo flow | ~1–2 wks | Demo customer flow + tracker = the seed |
| **P5 Payments** | Stripe Checkout + webhooks for order-state validation | ~1–2 wks | Replaces mock pay |
| **P6 Time slots / queue** | Dynamic prep-time engine + capacity throttle + smart nudge ("13:00 busy, collect 13:10") | ~1–2 wks | Extends the demo tracker; key B2B value prop |
| **P7 Offers** | End-of-day prompt + discount validation + notifications | ~1 wk | Email/SMS via Resend |
| **P8 Admin & analytics** | Platform admin (approve businesses, billing, slugs); business analytics (best-sellers, peak times, missed sales) | ~1–2 wks | Internal |
| **P9 Premium / AI** | AI menu import (URL/PDF/photo) · demand forecasting · AI end-of-day assistant · Stripe Connect · sub-locations / multi-vendor event mode · push | ongoing | Reuse Anthropic experience |

## 5. MVP cut (from the spec)

- **Must:** marketing site · registration/onboarding · slug + location config · QR engine · product/menu (manual stock) · customer ordering + basket · Stripe payment · order dashboard.
- **Should:** low-stock "only X left" · prep-time estimate · location-level QR · email notifications · end-of-day offer prompt.
- **Later:** push · Stripe Connect · AI menu import · smart queue optimisation · multi-vendor event mode · table/bay QRs · full custom reporting · demand forecasting.

## 6. Reuse map (your existing assets)

- **Tanio demo** → customer flow, tracker, dashboard, bilingual shell, QR, loyalty.
- **Supabase multi-tenant + RLS pattern** → Capsiynau / Nodiadau / social-desk.
- **Stripe** → (new for your stack here; social-desk token-vault pattern for secrets).
- **Resend email** → Capsiynau email-layout contract.
- **Anthropic/AI** → Capsiynau intelligence layer, menu-import precedent.
- **SEO pages** → `seo-page` skill for buan.co marketing/use-case pages.

## 7. Business model (keep flexible in MVP)

A) Subscription only (~£10/£25/£49 mo) · B) Subscription + per-order fee ·
C) Managed transactions (Buan pays out) · D) Business owns transactions (their Stripe).
MVP: simple subscription + small txn fee; pricing "to be confirmed, from ~£10/mo testing".

## 8. Open decisions / risks

1. **Repo/domain extraction timing** — confirm `buan.co` + own Supabase project at P2.
2. **Pricing model** — A–D above; pick before P5.
3. **Payments custody** — managed (Connect) vs business-owns-Stripe — affects P5/P9.
4. **Welsh** — native review of all customer + marketing copy before any real launch (Tanio copy is first-draft).
5. **Notifications** — SMS cost (Twilio?) vs email-only for MVP.
6. **Multi-vendor / sub-location** — deferred to P9; data model leaves room now.

## 9. Schedule (full-focus cadence — set 2026-06-23)

Kickoff **tomorrow, Wed 24 Jun 2026**. Full focus, ~3–5 working days per phase. Target
**payments-capable MVP ≈ Fri 24 Jul** (~4.5 wks); **full MVP feature set ≈ Mon 11 Aug**
(~7 wks). Weekend work flexes the dates earlier. Critical path: P0 → P2 (extraction) →
P4 → P5.

| Phase | Target window 2026 | Gate / note |
|------|------|------|
| **P0** Foundation / extract | Wed 24 – Fri 26 Jun | — |
| **P1** Marketing site | Mon 29 Jun – Wed 1 Jul | can overlap P0 tail |
| **P2** Onboarding + slugs + QR | Thu 2 – Wed 8 Jul | ⛳ **extraction-gate decision** (~2 Jul): own repo + buan.co + Supabase project |
| **P3** Menu & stock | Thu 9 – Mon 13 Jul | — |
| **P4** Customer ordering | Tue 14 – Fri 17 Jul | — |
| **P5** Payments (Stripe) | Mon 20 – Fri 24 Jul | ⛳ **pricing + payment-custody decision** before this · 🎯 **payments-MVP ~24 Jul** |
| **P6** Time-slots / queue | Mon 27 – Thu 30 Jul | — |
| **P7** Offers | Fri 31 Jul – Tue 4 Aug | — |
| **P8** Admin & analytics | Wed 5 – Mon 11 Aug | 🎯 **full MVP feature set ~11 Aug** |
| **P9** Premium / AI | from ~mid-Aug, ongoing | menu import · forecasting · Connect · multi-vendor |

⛳ Also blocking before any real launch: **native Welsh review** of all customer +
marketing copy.

**Driver:** a **weekday daily "Buan standup" agent** (09:00 Mon–Fri) reads this dated
table, reports today's target phase + next 3 actions, flags any decision gate that's due,
and lists recent commits/blockers.

_Last updated: 2026-06-23 — plan + dated schedule (no code yet; build starts 24 Jun)._
