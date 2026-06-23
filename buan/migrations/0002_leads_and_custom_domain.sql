-- ============================================================
-- Buan — migration 0002
-- (a) leads: capture marketing-site sign-ups (P1 lead form).
-- (b) custom_domain: Pro "bespoke URL" support, pulled forward to the
--     schema now (it's the headline Pro upgrade per BUAN_IDEAS.md).
-- Idempotent; layers on top of 0001_init.sql.
-- ============================================================

-- (a) marketing leads ----------------------------------------
create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  business_name text,
  business_type text,
  existing_url  text,
  message       text,
  source        text not null default 'marketing',
  created_at    timestamptz not null default now()
);

create index if not exists leads_created_idx on public.leads (created_at desc);

alter table public.leads enable row level security;

-- anyone can submit the form; only signed-in platform staff can read.
drop policy if exists leads_public_insert on public.leads;
create policy leads_public_insert on public.leads
  for insert to anon, authenticated with check (true);

drop policy if exists leads_auth_read on public.leads;
create policy leads_auth_read on public.leads
  for select to authenticated using (true);   -- TODO: tighten to platform-admin role

grant insert on public.leads to anon, authenticated;
grant select on public.leads to authenticated;

-- (b) bespoke URL (Pro) --------------------------------------
alter table public.businesses add column if not exists custom_domain text;

-- one custom domain per business, case-insensitive, ignoring NULLs.
create unique index if not exists businesses_custom_domain_idx
  on public.businesses (lower(custom_domain)) where custom_domain is not null;
