-- ============================================================
-- Tanio demo – orders table for cross-device live ordering
-- Idempotent: safe to run more than once.
-- This is a PUBLIC demo with no end-user auth, so the anon role
-- is allowed full CRUD on this one table. Do NOT copy these
-- permissive policies to any real, data-bearing table.
-- ============================================================

create table if not exists public.tanio_orders (
  id         text primary key,
  name       text not null,
  plate      text not null,                 -- car numberplate (powers visit stats + loyalty)
  items      jsonb not null default '[]'::jsonb,
  total      numeric not null default 0,
  status     text not null default 'new',   -- new → preparing → enroute → delivered
  placed_at  timestamptz not null default now()
);

create index if not exists tanio_orders_placed_at_idx
  on public.tanio_orders (placed_at desc);

-- Numberplate lookups for returning-customer / loyalty stats.
create index if not exists tanio_orders_plate_idx
  on public.tanio_orders (upper(plate));

-- Row Level Security ------------------------------------------------
alter table public.tanio_orders enable row level security;

drop policy if exists tanio_orders_anon_all on public.tanio_orders;
create policy tanio_orders_anon_all
  on public.tanio_orders
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- Data API GRANTs (required for new tables – auto-grant is being
-- phased out for existing Supabase projects; grant explicitly).
grant select, insert, update, delete on public.tanio_orders to anon, authenticated;
