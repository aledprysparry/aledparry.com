# Buan migrations

SQL migrations for the Buan multi-tenant schema. Each file is **idempotent**
(safe to re-run) and prefixed with a zero-padded sequence number.

| File | What it does |
|------|--------------|
| `0001_init.sql` | Creates the `buan` schema, all Phase 0 tables (`businesses, users, locations, sub_locations, products, stock, orders, offers, subscriptions`), indexes, `updated_at` triggers, and row-level security with explicit grants. |

## How to apply

Buan is co-located on the shared Supabase project for now (same pattern as the
`socialdesk` schema - see `components/demos/engine/SUPABASE_SETUP.md`). It lives
in its own isolated `buan` schema so it never collides with other demos.

### Option A - Supabase SQL editor (quickest)

1. Open your Supabase project -> **SQL Editor** -> **New query**.
2. Paste the contents of `0001_init.sql` and **Run**. Re-running is safe.
3. Expose the schema to the API:
   **Settings -> API -> "Exposed schemas" -> add `buan`** -> Save.

### Option B - Supabase CLI

```bash
# from repo root, with the project linked (supabase link ...)
supabase db execute --file buan/migrations/0001_init.sql
```

Or copy the file into a `supabase/migrations/` directory if you adopt the CLI's
migration runner later.

## Environment variables

The Buan data-access layer (`lib/buan/*`) is **env-gated**. Without these set,
every Buan module is a graceful no-op and the site build is unaffected:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

Public/anon key only - it is safe in the browser bundle and RLS does the
enforcement. **No service-role key belongs in client code.** Business
onboarding (creating a `businesses` row + its first `users` membership) is the
one operation that needs the service role; that runs server-side in the P2
onboarding flow, never in the browser.

## RLS model (summary)

- **Tenant isolation**: every business-scoped table carries `business_id` and a
  `*_member_all` policy gated on `buan.is_member(business_id)`.
- **Public read** (for QR menus, no login): `businesses, locations,
  sub_locations, products, stock, offers` allow anon `SELECT`.
- **Orders**: anon can `INSERT` (place an order) and `SELECT` (live tracker).
  The anon `SELECT` currently mirrors the open Tanio demo and exposes customer
  fields - see the "open decisions" in `BUAN_P0_NOTES.md` before going live.
- **users / subscriptions**: members only; subscription writes are service-role
  (P5 billing).

## Conventions

- Money is stored as **integer pennies** (`*_pennies` columns), never floats.
- New migrations: add `0002_*.sql`, `0003_*.sql`, ... and keep each idempotent
  (`create ... if not exists`, `drop policy if exists` then `create policy`).
