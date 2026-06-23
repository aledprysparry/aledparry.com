# Buan — P0 (Foundation) handoff notes

Branch: `buan/p0-foundation`. Build verified green (`npm run build`). `main` untouched.
Nothing is wired to a live database or deployed.

## What P0 delivers

**Schema** — `buan/migrations/0001_init.sql` (idempotent)
- 9 tables: businesses, business_members, locations, sub_locations, products, stock, orders, offers, subscriptions.
- Membership-scoped RLS via `is_business_member()`; public read for the customer menu; public insert for orders; explicit Data-API grants.

**Data layer** — `lib/buan/` (no new npm dependency — plain fetch to Supabase PostgREST, like the Tanio store)
- `types.ts` domain types · `config.ts` env flags + slug rules (reserved-slug set, `slugify`, `isValidSlug`) · `api.ts` business/location/menu/order access, all env-gated (return empty/null when Supabase env absent).

**Routing** — slug-based, multi-tenant
- `app/buan/[business]/page.tsx` — business → its locations.
- `app/buan/[business]/[location]/page.tsx` — read-only menu skeleton (shows price, "only X left", "sold out"). Basket/checkout land in P4.
- Reserved-slug guard (`admin`, `login`, `api`, `support`, …) via `isReservedSlug`; static routes (e.g. `/buan/login`) win over the dynamic `[business]` segment.
- With no Supabase env, routes render a tasteful "not configured" placeholder instead of erroring.

**Auth scaffold** — `lib/buan/auth.ts` (interface + signed-out stub) + `app/buan/login/page.tsx` (placeholder form).

## Stubbed / deferred (deliberately)
- **Auth is not functional.** Wiring Supabase Auth adds `@supabase/supabase-js` (or GoTrue REST) — a dependency decision held until after P0. `getSession()` returns null for now.
- No basket, payments, stock mutation, offers UI, dashboard, or admin (those are P3–P8).

## Decisions needed (gates)
1. **Repo/domain extraction** — you chose to stay in `aledparry` and build sequentially. Revisit at P2: own repo + `buan.co` + dedicated Supabase project. (Buan code is namespaced under `buan/`, `lib/buan/`, `app/buan/` so extraction is clean.)
2. **Supabase project** — P0 has no live DB. Before P3/P4 we need a (dedicated) Supabase project to run `0001_init.sql` against, plus `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. **Auth dependency** — approve `@supabase/supabase-js` for real auth, or stay on REST.
4. **Pull custom-domain/white-label forward to P2** — recommended by the ideas doc (it's the headline Pro upgrade and cheap).

## How to bring it online (when ready)
Create a Supabase project → run `buan/migrations/0001_init.sql` in its SQL editor → set the two `NEXT_PUBLIC_*` env vars → the `/buan/...` routes go live automatically (env-gated).

## Next phase
**P1 — Marketing site** (bilingual, independent of the product layer). Awaiting your review of P0 before I start.
