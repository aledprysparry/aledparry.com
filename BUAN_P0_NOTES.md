# Buan - Phase 0 (Foundation) notes

Phase 0 turns the single-tenant **Tanio** demo into the foundation for **Buan**,
a multi-tenant QR-ordering SaaS ("a digital sales layer for physical
businesses"). Everything here is **additive and env-gated**: the live Tanio demo
and the existing site build are untouched, and without Supabase env vars every
new module is a graceful no-op.

> Scope discipline: no Stripe (P5), no real secrets, no extraction. This is the
> prerequisite layer the later phases build on.

## What landed

### 1. Multi-tenant Supabase schema + RLS
`buan/migrations/0001_init.sql` (idempotent, safe to re-run) plus
`buan/migrations/README.md` (how to apply + RLS summary).

- Tables: `businesses, users, locations, sub_locations, products, stock,
  orders, offers, subscriptions` - all in an isolated `buan` schema (same
  co-location pattern as the existing `socialdesk` schema).
- Every business-scoped table carries `business_id` and a `*_member_all` RLS
  policy gated on a `SECURITY DEFINER` helper `buan.is_member(business_id)`.
- `DROP POLICY IF EXISTS` then `CREATE POLICY` throughout; explicit `GRANT`s to
  `anon` (public menus + order placement) and `authenticated` (staff CRUD).
- Money stored as integer **pennies** (`*_pennies`), never floats.
- `updated_at` triggers; indexes on every `business_id` hot path.

### 2. Data-access layer (`lib/buan/`)
Generalises `components/demos/tanioStore.js` from single-tenant Blob to
multi-tenant Supabase, scoped by `{ businessId, locationId }`.

- `supabaseClient.ts` - env-gated client on the `buan` schema (`buanConfigured()`
  + `getBuanClient()`).
- `types.ts` - TypeScript mirror of the schema.
- `store.ts` - `getBusinessBySlug`, `getLocationBySlug`, `resolveScope`,
  `loadProducts`, `loadOffers`, `loadOrders`, `placeOrder`, `setOrderStatus`,
  `clearOrders`, `subscribeOrders` (Supabase realtime + polling fallback,
  matching Tanio's `subscribe` contract), plus `money` / `timeAgo` / `normRef`
  helpers. Every read returns empty and every write is a no-op when unconfigured.
- `reservedSlugs.ts` - reserved-slug set + `isReservedSlug` / `isValidBusinessSlug`.
- `auth.ts` - Supabase Auth wrappers (`getSession`, `getUser`,
  `signInWithPassword`, `signInWithMagicLink`, `signOut`, `onAuthChange`).

### 3. Slug-routing skeleton (`app/buan/`)
- `/buan` - landing/shell placeholder, shows backend-connected status.
- `/buan/[business]` - resolves a tenant by slug; **blocks reserved slugs** and
  malformed slugs with `notFound()`.
- `/buan/[business]/[location]` - the customer QR entry point; resolves the
  business+location pair.
- `/buan/login` - staff sign-in placeholder wired to the auth scaffold (reserved
  slug, so the static route always wins over `[business]`).

All routes are `force-dynamic` and render placeholders until Supabase is
configured, so the build passes with no env.

### 4. Auth scaffold
Structure only (per the brief): session helpers + a minimal magic-link sign-in
form. No role-aware dashboard routing yet.

## What is stubbed / deferred

- **Ordering UI**: the customer flow and staff dashboard are not ported yet -
  the location route is a placeholder. The data-access layer it will sit on is
  done. Porting the Tanio UI onto `lib/buan/store` is early P1/P2 work.
- **Onboarding**: creating a `businesses` row + first `users` membership needs
  the service-role key (RLS blocks anon/authenticated `INSERT` on `businesses`
  by design). That server-side flow is P2.
- **Auth UI**: login is a scaffold; no signup, password reset, or post-login
  redirect to a dashboard.
- **Subscriptions**: table exists with nullable `provider_*` columns ready for
  Stripe, but no billing logic (P5).
- **Welsh copy**: the new shell/login/route pages are English-only placeholders.
  Any customer-facing Welsh strings (the ordering UI will need them) should be
  flagged for native review per the repo's welsh-language rule - none are
  shipped in this phase, so nothing needs review yet.

## Open decisions

1. **P2 extraction gate (flagged, not actioned).** Whether/when to move Buan to
   its own repo, its own `buan.co` domain, and a dedicated Supabase project.
   - *Now (P0):* Buan lives under `/buan` inside aledparry.com and co-locates on
     the shared Supabase project in an isolated `buan` schema. This keeps the
     iteration loop tight and avoids premature infra.
   - *Recommendation:* extract at the start of P2 (onboarding/billing), before
     real tenants and any PII land in the shared project. Triggers to extract:
     first paying customer, real customer data, or needing `buan.co` for QR
     links. Until then, do **not** extract.

2. **Anon order visibility (PII).** RLS currently lets `anon` `SELECT` orders so
   the live customer tracker works - this mirrors the open Tanio demo and
   exposes `customer_name` / `customer_ref` for a location. Before any real
   launch, tighten to per-order access tokens or server-side reads. Tracked in
   the migration comments.

3. **Slug namespace.** `<business>` and system routes (`login`, `admin`, ...)
   share one namespace. Handled via the reserved-slug list + Next.js static
   routes winning over `[business]`. Onboarding (P2) must reject reserved slugs
   at sign-up using the same `isReservedSlug` source of truth.

4. **Route base path.** Routes live at `/buan/...` for now (not a domain). When
   `buan.co` is wired, `[business]` becomes the first path segment on the apex
   domain; the route structure already matches that shape.

## How to enable locally

1. Run `buan/migrations/0001_init.sql` in Supabase, then expose the `buan`
   schema (Settings -> API -> Exposed schemas).
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Seed a business + location, then visit `/buan/<business>/<location>`.

## Recommended next step

**P2 onboarding**: a service-role-backed flow to create a business + its first
`users` membership (rejecting reserved slugs), then port the Tanio customer +
dashboard UI onto `lib/buan/store`. Make the extraction decision (open decision
#1) at the start of P2, before real tenant data lands.
