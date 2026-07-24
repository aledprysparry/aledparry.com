-- ═══ Postio Interactive Campaigns: Supabase schema (M0 backend) ═══
--
-- Adds the campaign collections to the existing `socialdesk` schema, in the
-- SAME shape as the rest of the engine (see SUPABASE_SETUP.md): one table per
-- collection, (id text primary key, data jsonb, updated_at). Idempotent, safe
-- to re-run. Paste into the Supabase SQL editor, then expose the schema:
-- Dashboard -> Settings -> API -> "Exposed schemas" -> ensure `socialdesk`.
--
-- Tracker: issue #140, Phase 1 #142. Data shapes: lib/campaigns/types.ts.

create schema if not exists socialdesk;
grant usage on schema socialdesk to anon, authenticated;

-- Authoring side (builder drafts) + the record of what participants submit.
create table if not exists socialdesk.cg_campaigns          (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists socialdesk.cg_campaign_versions  (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists socialdesk.cg_campaign_entries   (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists socialdesk.cg_consent_receipts   (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists socialdesk.cg_moderation_results (id text primary key, data jsonb not null, updated_at timestamptz default now());

-- POC access: open via the anon key, matching the rest of the engine today.
-- WARNING: cg_campaign_entries / cg_consent_receipts / cg_moderation_results
-- hold participant PII once the public experience is live. Before that launch,
-- REPLACE anon_all on those three with insert-only-for-anon (no anon SELECT),
-- and move reads behind authenticated moderator access (spec §28). The open
-- policy below is for internal prototyping only.
do $$
declare t text;
begin
  foreach t in array array['cg_campaigns','cg_campaign_versions','cg_campaign_entries','cg_consent_receipts','cg_moderation_results']
  loop
    execute format('alter table socialdesk.%I enable row level security', t);
    execute format('drop policy if exists anon_all on socialdesk.%I', t);
    execute format('create policy anon_all on socialdesk.%I for all to anon using (true) with check (true)', t);
    execute format('grant select, insert, update, delete on socialdesk.%I to anon', t);
  end loop;
end $$;
