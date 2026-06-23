-- ============================================================================
-- Buan - Phase 0 multi-tenant schema (idempotent, safe to re-run)
-- ----------------------------------------------------------------------------
-- A "digital sales layer for physical businesses": QR ordering SaaS grown out
-- of the Tanio demo. Every business-scoped table carries a business_id and is
-- protected by row-level security keyed on that column, so one tenant can
-- never read or write another tenant's rows.
--
-- Conventions (follow the repo's existing socialdesk schema, see
-- components/demos/engine/SUPABASE_SETUP.md):
--   * Everything lives in an isolated `buan` schema (co-located on the shared
--     Supabase project for now; P2 may move Buan to its own project - see
--     BUAN_P0_NOTES.md).
--   * Money is stored in integer pennies (no floats).
--   * RLS uses `drop policy if exists` then `create policy`, with explicit
--     grants to anon / authenticated.
--
-- After running this, expose the schema:
--   Dashboard -> Settings -> API -> "Exposed schemas" -> add `buan`.
-- ============================================================================

create extension if not exists pgcrypto;          -- gen_random_uuid()

create schema if not exists buan;
grant usage on schema buan to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Shared updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function buan.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- Tables
-- ============================================================================

-- businesses: the tenant root. `slug` powers buan.co/<business>.
create table if not exists buan.businesses (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  owner_id    uuid references auth.users(id) on delete set null,
  settings    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- users: membership / role mapping between auth.users and a business.
-- (auth identities live in Supabase's auth.users; this is the Buan-side join.)
create table if not exists buan.users (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null references auth.users(id) on delete cascade,
  business_id   uuid not null references buan.businesses(id) on delete cascade,
  email         text,
  role          text not null default 'staff' check (role in ('owner','admin','staff')),
  created_at    timestamptz not null default now(),
  unique (auth_user_id, business_id)
);

-- locations: a physical site for a business. `slug` powers
-- buan.co/<business>/<location>. Unique per business.
create table if not exists buan.locations (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references buan.businesses(id) on delete cascade,
  slug        text not null,
  name        text not null,
  address     text,
  timezone    text not null default 'Europe/London',
  active      boolean not null default true,
  settings    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (business_id, slug)
);

-- sub_locations: tables / bays / rooms / seats within a location. A QR code
-- typically deep-links to one of these (e.g. table 12, bay 3).
create table if not exists buan.sub_locations (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references buan.businesses(id) on delete cascade,
  location_id uuid not null references buan.locations(id) on delete cascade,
  slug        text,
  label       text not null,
  kind        text not null default 'table' check (kind in ('table','bay','room','seat','zone','other')),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (location_id, slug)
);

-- products: menu / catalogue items. location_id null = available business-wide.
create table if not exists buan.products (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references buan.businesses(id) on delete cascade,
  location_id  uuid references buan.locations(id) on delete cascade,
  sku          text,
  name         text not null,
  description  text,
  price_pennies integer not null default 0 check (price_pennies >= 0),
  currency     text not null default 'GBP',
  emoji        text,
  category     text,
  active       boolean not null default true,
  sort_order   integer not null default 0,
  meta         jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- stock: optional per-product, per-location availability tracking.
create table if not exists buan.stock (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references buan.businesses(id) on delete cascade,
  product_id  uuid not null references buan.products(id) on delete cascade,
  location_id uuid references buan.locations(id) on delete cascade,
  quantity    integer not null default 0,
  track       boolean not null default false,
  updated_at  timestamptz not null default now(),
  unique (product_id, location_id)
);

-- orders: a customer order, generalised from the Tanio store. `code` is the
-- short human-facing id (e.g. TA1234); `customer_ref` holds the
-- numberplate / table label / phone the staff match against.
create table if not exists buan.orders (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references buan.businesses(id) on delete cascade,
  location_id     uuid not null references buan.locations(id) on delete cascade,
  sub_location_id uuid references buan.sub_locations(id) on delete set null,
  code            text,
  customer_name   text,
  customer_ref    text,
  items           jsonb not null default '[]'::jsonb,
  total_pennies   integer not null default 0,
  currency        text not null default 'GBP',
  status          text not null default 'new'
                    check (status in ('new','preparing','enroute','ready','delivered','cancelled')),
  notes           text,
  placed_at       timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- offers: promotions / loyalty rules per business (optionally per location).
create table if not exists buan.offers (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references buan.businesses(id) on delete cascade,
  location_id   uuid references buan.locations(id) on delete cascade,
  title         text not null,
  description   text,
  kind          text not null default 'discount' check (kind in ('discount','loyalty','bundle','freebie')),
  value_pennies integer,
  value_percent integer,
  active        boolean not null default true,
  starts_at     timestamptz,
  ends_at       timestamptz,
  meta          jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- subscriptions: one billing record per business. Stripe wiring is P5 - the
-- provider_* columns are intentionally nullable and unused for now.
create table if not exists buan.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  business_id              uuid not null references buan.businesses(id) on delete cascade,
  plan                     text not null default 'free' check (plan in ('free','starter','pro','enterprise')),
  status                   text not null default 'active'
                             check (status in ('active','trialing','past_due','canceled','paused')),
  provider                 text,   -- P5: 'stripe'
  provider_customer_id     text,   -- P5
  provider_subscription_id text,   -- P5
  current_period_end       timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (business_id)
);

-- ----------------------------------------------------------------------------
-- Indexes (business_id is the hot path for every tenant-scoped query)
-- ----------------------------------------------------------------------------
create index if not exists buan_users_auth_idx       on buan.users (auth_user_id);
create index if not exists buan_users_business_idx    on buan.users (business_id);
create index if not exists buan_locations_business_idx on buan.locations (business_id);
create index if not exists buan_sublocs_location_idx  on buan.sub_locations (location_id);
create index if not exists buan_products_business_idx  on buan.products (business_id, location_id);
create index if not exists buan_stock_business_idx     on buan.stock (business_id);
create index if not exists buan_orders_business_idx    on buan.orders (business_id, location_id);
create index if not exists buan_orders_status_idx      on buan.orders (location_id, status);
create index if not exists buan_orders_placed_idx      on buan.orders (placed_at desc);
create index if not exists buan_offers_business_idx    on buan.offers (business_id);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'businesses','locations','products','stock','orders','offers','subscriptions'
  ]
  loop
    execute format('drop trigger if exists touch_updated_at on buan.%I', t);
    execute format(
      'create trigger touch_updated_at before update on buan.%I
         for each row execute function buan.touch_updated_at()', t);
  end loop;
end $$;

-- ============================================================================
-- Row-level security
-- ----------------------------------------------------------------------------
-- Membership check. SECURITY DEFINER so it bypasses RLS on buan.users
-- (avoids recursive policy evaluation) and answers: is the current auth user
-- a member of business <bid>?
-- ============================================================================
create or replace function buan.is_member(bid uuid)
returns boolean
language sql
stable
security definer
set search_path = buan, public
as $$
  select exists (
    select 1 from buan.users u
    where u.business_id = bid
      and u.auth_user_id = auth.uid()
  );
$$;

grant execute on function buan.is_member(uuid) to anon, authenticated;

-- ---- Public-readable, member-writable tables --------------------------------
-- locations / sub_locations / products / stock / offers: anyone (anon) can read
-- (a QR scan must resolve the public menu without a login); only members of the
-- owning business can write.
do $$
declare t text;
begin
  foreach t in array array['locations','sub_locations','products','stock','offers']
  loop
    execute format('alter table buan.%I enable row level security', t);

    execute format('drop policy if exists %I on buan.%I', t || '_public_read', t);
    execute format(
      'create policy %I on buan.%I for select to anon, authenticated using (true)',
      t || '_public_read', t);

    execute format('drop policy if exists %I on buan.%I', t || '_member_all', t);
    execute format(
      'create policy %I on buan.%I for all to authenticated
         using (buan.is_member(business_id)) with check (buan.is_member(business_id))',
      t || '_member_all', t);
  end loop;
end $$;

-- ---- businesses -------------------------------------------------------------
-- anon can read (resolve <business> slug); members can update/delete their own.
-- INSERT is intentionally NOT granted here - businesses are created by the
-- onboarding flow using the service-role key (P2), which bypasses RLS.
alter table buan.businesses enable row level security;

drop policy if exists businesses_public_read on buan.businesses;
create policy businesses_public_read on buan.businesses
  for select to anon, authenticated using (true);

drop policy if exists businesses_member_update on buan.businesses;
create policy businesses_member_update on buan.businesses
  for update to authenticated
  using (buan.is_member(id)) with check (buan.is_member(id));

drop policy if exists businesses_member_delete on buan.businesses;
create policy businesses_member_delete on buan.businesses
  for delete to authenticated using (buan.is_member(id));

-- ---- users (membership) -----------------------------------------------------
-- A user can see their own membership rows; members of a business can see and
-- manage their co-members.
alter table buan.users enable row level security;

drop policy if exists users_self_read on buan.users;
create policy users_self_read on buan.users
  for select to authenticated
  using (auth_user_id = auth.uid() or buan.is_member(business_id));

drop policy if exists users_member_manage on buan.users;
create policy users_member_manage on buan.users
  for all to authenticated
  using (buan.is_member(business_id)) with check (buan.is_member(business_id));

-- ---- orders -----------------------------------------------------------------
-- Customers are anonymous: they INSERT an order from a QR scan, and the live
-- tracker SELECTs to follow its status. Staff (members) get full control.
--
-- NOTE (open decision, see BUAN_P0_NOTES.md): the anon SELECT below exposes
-- customer_name / customer_ref for a location's orders, matching the current
-- Tanio demo's openness. Before production this should be tightened to
-- per-order access tokens or server-side reads so customer PII is not public.
alter table buan.orders enable row level security;

drop policy if exists orders_anon_insert on buan.orders;
create policy orders_anon_insert on buan.orders
  for insert to anon, authenticated with check (true);

drop policy if exists orders_public_read on buan.orders;
create policy orders_public_read on buan.orders
  for select to anon, authenticated using (true);

drop policy if exists orders_member_all on buan.orders;
create policy orders_member_all on buan.orders
  for all to authenticated
  using (buan.is_member(business_id)) with check (buan.is_member(business_id));

-- ---- subscriptions ----------------------------------------------------------
-- Members can read their plan; writes happen via the service role (P5 billing
-- webhooks), so no anon/authenticated write policy is defined.
alter table buan.subscriptions enable row level security;

drop policy if exists subscriptions_member_read on buan.subscriptions;
create policy subscriptions_member_read on buan.subscriptions
  for select to authenticated using (buan.is_member(business_id));

-- ============================================================================
-- Grants (RLS still filters rows; grants open the table-level door)
-- ============================================================================
-- anon (customers)
grant select on buan.businesses    to anon;
grant select on buan.locations     to anon;
grant select on buan.sub_locations to anon;
grant select on buan.products      to anon;
grant select on buan.stock         to anon;
grant select on buan.offers        to anon;
grant select, insert on buan.orders to anon;

-- authenticated (staff) - RLS scopes which rows they can touch
grant select, update, delete         on buan.businesses    to authenticated; -- insert via service role
grant select, insert, update, delete on buan.users         to authenticated;
grant select, insert, update, delete on buan.locations     to authenticated;
grant select, insert, update, delete on buan.sub_locations to authenticated;
grant select, insert, update, delete on buan.products      to authenticated;
grant select, insert, update, delete on buan.stock         to authenticated;
grant select, insert, update, delete on buan.orders        to authenticated;
grant select, insert, update, delete on buan.offers        to authenticated;
grant select                         on buan.subscriptions to authenticated; -- writes via service role (P5)

-- ============================================================================
-- End of Buan Phase 0 migration.
-- ============================================================================
