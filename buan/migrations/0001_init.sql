-- ============================================================
-- Buan — multi-tenant core schema (P0 Foundation)
-- Idempotent: safe to run more than once.
--
-- Tenancy: every business-owned row carries business_id. Access is
-- granted to members of that business (business_members), with a
-- public (anon) read path for the customer-facing menu and a public
-- insert path for placing orders. Mirrors the Capsiynau / Nodiadau /
-- social-desk RLS pattern. Data API GRANTs are explicit (auto-grant
-- is being phased out for existing Supabase projects).
--
-- Apply against a dedicated Buan Supabase project (decision pending —
-- see BUAN_P0_NOTES.md). Nothing here is wired to a live DB yet.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- businesses ----------
create table if not exists public.businesses (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name           text not null,
  logo_url       text,
  description    text,
  category       text,
  contact_email  text,
  contact_phone  text,
  vat_number     text,
  company_number text,
  owner_id       uuid not null references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now()
);

-- staff / multi-user access to a business
create table if not exists public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'staff' check (role in ('owner','manager','staff')),
  created_at  timestamptz not null default now(),
  primary key (business_id, user_id)
);

-- ---------- locations ----------
create table if not exists public.locations (
  id                      uuid primary key default gen_random_uuid(),
  business_id             uuid not null references public.businesses(id) on delete cascade,
  slug                    text not null,
  name                    text not null,
  address                 text,
  opening_hours           jsonb not null default '{}'::jsonb,
  collection_instructions text,
  created_at              timestamptz not null default now(),
  unique (business_id, slug)
);

-- optional future granularity: floor / stand / bay / table
create table if not exists public.sub_locations (
  id          uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  label       text not null,
  kind        text,                       -- floor | zone | stand | bay | table | stall
  created_at  timestamptz not null default now()
);

-- ---------- products + stock ----------
create table if not exists public.products (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses(id) on delete cascade,
  location_id   uuid not null references public.locations(id) on delete cascade,
  name          text not null,
  description   text,
  price         numeric(10,2) not null default 0,
  image_url     text,
  category      text,
  prep_time_mins int not null default 0,
  allergens     text[] not null default '{}',
  dietary_tags  text[] not null default '{}',
  visible       boolean not null default true,
  created_at    timestamptz not null default now()
);

create table if not exists public.stock (
  product_id uuid primary key references public.products(id) on delete cascade,
  type       text not null default 'unlimited' check (type in ('unlimited','limited','out')),
  qty        int not null default 0
);

-- ---------- orders ----------
create table if not exists public.orders (
  id              text primary key,                 -- human-readable, e.g. BN1234
  business_id     uuid not null references public.businesses(id) on delete cascade,
  location_id     uuid not null references public.locations(id) on delete cascade,
  items           jsonb not null default '[]'::jsonb,
  total           numeric(10,2) not null default 0,
  status          text not null default 'new' check (status in ('new','preparing','enroute','delivered','cancelled')),
  collection_slot timestamptz,
  customer_name   text,
  customer_contact text,
  placed_at       timestamptz not null default now()
);

-- ---------- offers ----------
create table if not exists public.offers (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  location_id  uuid not null references public.locations(id) on delete cascade,
  product_ids  uuid[] not null default '{}',
  discount_pct int not null check (discount_pct between 1 and 100),
  starts_at    timestamptz not null default now(),
  ends_at      timestamptz,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ---------- subscriptions (billing) ----------
create table if not exists public.subscriptions (
  business_id          uuid primary key references public.businesses(id) on delete cascade,
  plan                 text not null default 'free' check (plan in ('free','pro','business','enterprise')),
  status               text not null default 'active',
  stripe_customer_id   text,
  stripe_subscription_id text,
  current_period_end   timestamptz,
  updated_at           timestamptz not null default now()
);

-- ---------- indexes ----------
create index if not exists locations_business_idx on public.locations (business_id);
create index if not exists products_location_idx  on public.products (location_id) where visible;
create index if not exists orders_location_idx     on public.orders (location_id, placed_at desc);
create index if not exists offers_location_active_idx on public.offers (location_id) where active;

-- ============================================================
-- Row Level Security
-- Helper: is the current user a member of this business?
-- ============================================================
create or replace function public.is_business_member(b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.business_members m
    where m.business_id = b and m.user_id = auth.uid()
  );
$$;

alter table public.businesses       enable row level security;
alter table public.business_members enable row level security;
alter table public.locations        enable row level security;
alter table public.sub_locations    enable row level security;
alter table public.products         enable row level security;
alter table public.stock            enable row level security;
alter table public.orders           enable row level security;
alter table public.offers           enable row level security;
alter table public.subscriptions    enable row level security;

-- businesses: members manage; owner can insert their own
drop policy if exists businesses_member_rw on public.businesses;
create policy businesses_member_rw on public.businesses for all to authenticated
  using (public.is_business_member(id)) with check (public.is_business_member(id) or owner_id = auth.uid());

-- business_members: members of the business can see; owners manage
drop policy if exists members_rw on public.business_members;
create policy members_rw on public.business_members for all to authenticated
  using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));

-- locations / products / offers / sub_locations: members manage
do $$
declare t text;
begin
  foreach t in array array['locations','products','offers','sub_locations'] loop
    execute format('drop policy if exists %1$s_member_rw on public.%1$s', t);
  end loop;
end $$;
create policy locations_member_rw on public.locations for all to authenticated
  using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
create policy products_member_rw on public.products for all to authenticated
  using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
create policy offers_member_rw on public.offers for all to authenticated
  using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));
create policy sublocations_member_rw on public.sub_locations for all to authenticated
  using (exists (select 1 from public.locations l where l.id = location_id and public.is_business_member(l.business_id)))
  with check (exists (select 1 from public.locations l where l.id = location_id and public.is_business_member(l.business_id)));

-- stock: members manage (joined through product -> business)
drop policy if exists stock_member_rw on public.stock;
create policy stock_member_rw on public.stock for all to authenticated
  using (exists (select 1 from public.products p where p.id = product_id and public.is_business_member(p.business_id)))
  with check (exists (select 1 from public.products p where p.id = product_id and public.is_business_member(p.business_id)));

-- subscriptions: members read; writes happen via service role (Stripe webhook)
drop policy if exists subscriptions_member_read on public.subscriptions;
create policy subscriptions_member_read on public.subscriptions for select to authenticated
  using (public.is_business_member(business_id));

-- ----- public (anon) customer-facing paths -----
-- read visible menu: locations, visible products, their stock, active offers
drop policy if exists locations_public_read on public.locations;
create policy locations_public_read on public.locations for select to anon, authenticated using (true);

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select to anon, authenticated using (visible);

drop policy if exists stock_public_read on public.stock;
create policy stock_public_read on public.stock for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.visible));

drop policy if exists offers_public_read on public.offers;
create policy offers_public_read on public.offers for select to anon, authenticated using (active);

drop policy if exists businesses_public_read on public.businesses;
create policy businesses_public_read on public.businesses for select to anon, authenticated using (true);

-- customers place + read their own order (anon insert; read by id is acceptable for the demo flow)
drop policy if exists orders_public_insert on public.orders;
create policy orders_public_insert on public.orders for insert to anon, authenticated with check (true);

drop policy if exists orders_member_rw on public.orders;
create policy orders_member_rw on public.orders for all to authenticated
  using (public.is_business_member(business_id)) with check (public.is_business_member(business_id));

drop policy if exists orders_public_read on public.orders;
create policy orders_public_read on public.orders for select to anon, authenticated using (true);

-- status updates by staff only (the member_rw policy above covers update for authenticated members)

-- ============================================================
-- Data API GRANTs (explicit — required for new tables)
-- ============================================================
grant select, insert, update, delete on
  public.businesses, public.business_members, public.locations, public.sub_locations,
  public.products, public.stock, public.orders, public.offers, public.subscriptions
  to authenticated;

grant select on
  public.businesses, public.locations, public.products, public.stock, public.offers
  to anon;
grant insert, select on public.orders to anon;
