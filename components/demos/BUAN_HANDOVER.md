# Buan - Handover & State of Play

> Written 2026-06-24 to clear up confusion from duplicate/parallel sessions.
> Read this FIRST before doing any Buan work. Companion to
> [BUAN_BUILD_PLAN.md](./BUAN_BUILD_PLAN.md) (what/when) and
> [BUAN_IDEAS.md](./BUAN_IDEAS.md) (tiering/monetization).

## TL;DR

> **Update 2026-06-24 (later):** `main` ALREADY HAS the canonical **Supabase
> line** (`lib/buan/store.ts` = multi-tenant Supabase, plus supabaseClient/types/
> migrations, `components/demos/Buan.tsx`). So the canonical Buan is on `main`,
> not just a feature branch. **PR #107** (which would have merged the interim
> `buan/p0-foundation` Blob line into `main`) was **CLOSED, not merged** - it
> conflicted across the whole `lib/buan` + `app/buan` surface and merging it would
> have regressed `main` to the interim architecture.

There were **two divergent Buan codebases**:

- **Canonical = the Supabase line, now LIVE on `main`** (proper schema, RLS,
  migrations). Env-gated: dormant until Supabase is configured.
- **Interim, to be harvested then retired:** branch `buan/p0-foundation` (tip
  `766b4fc`, diverged, **PR #107 closed**) - a working but throwaway Blob/fs auth
  + full dashboards. Its **dashboard UIs** (menu manager, orders + nudge,
  analytics, admin) are the only part worth keeping; **port them onto `main`'s
  Supabase store** in a fresh PR, then delete the branch.

---

## The two branches

### A. `fix/demo-language-toggles` - the CANONICAL Supabase line
The architecturally-correct Buan that matches the build plan.

- `lib/buan/store.ts` - Supabase data-access (businesses, locations, products,
  offers, orders; realtime; money in **pennies**).
- `lib/buan/supabaseClient.ts`, `reservedSlugs.ts`, `types.ts` - proper schema
  types. `Product` has `price_pennies`, `category`, and a **`meta` jsonb** bag.
  `OrderStatus` already includes `ready`. `MemberRole` = owner/admin/staff.
- `lib/buan/auth.ts` - Supabase Auth wrappers (signInWithPassword, magic-link,
  getSession, onAuthChange). Env-gated.
- `buan/migrations/0001_init.sql` - real migration: `buan` schema, all Phase 0
  tables, RLS policies + grants. Idempotent. **Not yet applied** (no project).
- `components/demos/Buan.tsx` - marketing landing (merged via PR #104).
- `app/buan/{layout,page,login,[business]/page,[business]/[location]/page}` -
  public ordering pages + a login placeholder.
- **MISSING:** staff dashboards (menu manager, orders, analytics, admin), working
  auth/onboarding UI. The Supabase line deferred these to "P2".
- **DORMANT:** everything is env-gated. With no Supabase config, every read
  returns empty. There is no `.env.local` with real values yet.

### B. `buan/p0-foundation` - the INTERIM line (harvest, then retire)
Built earlier in a parallel session before the Supabase line was in view.

- Full **dashboards**: `app/buan/manage/page.tsx` (menu), `manage/orders/page.tsx`
  (with the **stale-order nudge**), `manage/analytics/page.tsx`, `admin/`.
- **Interim auth** (to DROP): `lib/buan/session.ts` (HMAC cookie + scrypt),
  `lib/buan/store.ts` as a **Blob/fs** account store, `app/api/buan/auth/*`,
  `app/api/buan/menu/route.ts`. Demo login `demo@buan.app` / `buan1234`.
- Marketing **"your shop, not a marketplace"** section (on the old client landing).
- `BUAN_IDEAS.md` **pricing model** in §4 (per-location + thin card fee, reject
  the flat 10% commission) and the AI-menu-import idea.
- Cymraeg/English toggle labels.
- Tip `766b4fc`. Committed, not pushed, not merged.

---

## Reconciliation decision (agreed with owner, 2026-06-24)

1. **Adopt the Supabase line as canonical.** It has migrations, RLS, the right
   schema. The build plan mandates Supabase.
2. **Drop the interim Blob/fs auth** (`session.ts`, Blob `store.ts`,
   `/api/buan/auth/*`) - superseded by Supabase Auth.
3. **Port the dashboard UIs** (menu manager, orders + nudge, analytics, admin)
   onto the Supabase `Product`/`Order` store. This is the valuable, portable part.
4. **Carry over** the "not a marketplace" section, the BUAN_IDEAS §4 pricing
   edits, and the toggle fixes (architecture-agnostic content/UI).

---

## What is blocking everything: Supabase is not connected

Verified 2026-06-24: no `.env.local`, no Supabase env vars -> data layer is a
no-op. To bring it alive (see `buan/migrations/README.md`):

1. Supabase project -> SQL Editor -> run `buan/migrations/0001_init.sql`.
2. **Settings -> API -> Exposed schemas -> add `buan`** (REQUIRED - the client
   uses `{ db: { schema: "buan" } }`, so without this every call 404s).
3. Settings -> API -> copy Project URL + anon key into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL=`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=`
   - `SUPABASE_SERVICE_ROLE_KEY=` (server-side only; onboarding bypasses RLS)
   - `ANTHROPIC_API_KEY=` (for the menu-import endpoint below)
4. Restart dev. Add the same vars to Vercel for prod.

A `.env.local` scaffold with these slots already exists (git-ignored).

---

## This session's deliverables on the canonical branch (UNCOMMITTED)

On `fix/demo-language-toggles`, working tree:
- `app/api/buan/menu-import/route.ts` - **NEW. The AI photo-to-menu import.**
  Adapts the in-repo vision pattern (`app/api/ai/social/route.ts`): base64 menu
  photo -> Claude vision -> draft items shaped to the real `Product` schema
  (`price_pennies`, `category`, `description`, `allergens`). Returns DRAFTS only.
  Gated by a Supabase session in prod; open in dev so it is testable with just
  `ANTHROPIC_API_KEY`. Verified: compiles, returns a clean 503 when no key.
- `.claude/launch.json` - `autoPort: true` added (preview server convenience).
- `.env.local` - scaffold (git-ignored, not committed).

> Decide whether to commit these here or on a fresh `buan/*` branch (see below).

## Pending features (requested, not yet built)

Both need a **menu-manager dashboard host**, which needs Supabase + a minimal
sign-in/scope first:
- **Specials board** - add `special` to a product via `Product.meta.special`
  (no schema change needed; `meta` jsonb already exists). Dashboard toggle +
  badge + a "Today's specials" group; later surfaced on the customer menu.
- **Photo-import UI** - a "Scan menu photo" button in the manager that calls
  `/api/buan/menu-import`, shows the drafts for review, and saves accepted items
  as `Product`s.

---

## Next steps (in order) for whoever picks this up

1. **Owner action:** connect Supabase (steps above) + set `ANTHROPIC_API_KEY`.
2. Create a clean **`buan/*` branch off the canonical line** (not the toggle
   branch). Decide what to do with `buan/p0-foundation` after harvesting.
3. Add product **write helpers** to the Supabase `lib/buan/store.ts`
   (`upsertProduct`, `deleteProduct`) - the manager needs them; current store is
   read-mostly for the catalogue.
4. Build a **minimal sign-in + onboarding** (creates a `businesses` row + first
   `users` membership via the service-role key) so the manager has a tenant scope.
5. **Port the menu manager** onto the Product store; then **orders + nudge**,
   analytics, admin.
6. Build **specials** (`meta.special`) and wire the **import button**.
7. Carry over the "not a marketplace" section + BUAN_IDEAS §4 pricing.

## Branch hygiene (important)

We are on `fix/demo-language-toggles`, which is named for unrelated toggle work
yet now hosts the canonical Buan + new Buan code. This is part of the confusion.
**Recommendation:** branch the Buan reconciliation off this line into a properly
named `buan/foundation-supabase` (or similar), and stop adding Buan code to the
toggle branch.

## Quick reference

- Demo login (interim line only): `demo@buan.app` / `buan1234`.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`.
- Migration: `buan/migrations/0001_init.sql` (+ expose `buan` schema).
- Canonical store contract: pennies (`price_pennies`), `Product.meta` jsonb,
  `OrderStatus` includes `ready`, roles owner/admin/staff.

_Last updated: 2026-06-24._
