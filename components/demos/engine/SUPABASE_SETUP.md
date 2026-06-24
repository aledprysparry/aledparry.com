# Backend persistence (Supabase) - setup

Turns the engine from **local-first** (this browser only) into
**server-backed**: every creation's `/app/carousel/graphics/:id` URL
then resolves on any device and survives a cleared cache. **Dormant**
until the env vars are set - without them the engine stays local-first
exactly as now.

## 1. Create a Supabase project
At supabase.com. Then run this SQL (idempotent - safe to re-run) in the
SQL editor:

```sql
-- Co-located in the isolated `socialdesk` schema (shared project, alongside
-- social-desk). One table per collection: (id, data jsonb).
create schema if not exists socialdesk;
grant usage on schema socialdesk to anon, authenticated;

create table if not exists socialdesk.cg_brands           (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists socialdesk.cg_assets           (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists socialdesk.cg_social_accounts  (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists socialdesk.cg_template_styles  (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists socialdesk.cg_templates        (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists socialdesk.cg_graphics         (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists socialdesk.cg_clips            (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists socialdesk.cg_folders          (id text primary key, data jsonb not null, updated_at timestamptz default now());
-- Coach layer (analysis settings, briefs, strategy artifacts, learned voice).
-- Without these the collections sync silently no-ops (errors are swallowed),
-- so they save locally but never reach the backend (Codex #97).
create table if not exists socialdesk.cg_coach_settings    (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists socialdesk.cg_coach_briefs      (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists socialdesk.cg_strategy_artifacts(id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists socialdesk.cg_voice_profiles    (id text primary key, data jsonb not null, updated_at timestamptz default now());
-- Voice AI layer (intent-to-output). The intent bar persists a session per
-- interaction and an approval signal per human decision (the learning data).
-- Review drafts stay in-session in M-V1; their table will be added when they
-- are persisted. Same shape + sync pattern as every collection above.
create table if not exists socialdesk.cg_intent_sessions   (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists socialdesk.cg_approval_signals  (id text primary key, data jsonb not null, updated_at timestamptz default now());
-- Reactive Coach (scores existing posts): reference accounts, analyses,
-- recommendations, performance history, presets - also mirrored by
-- supabaseSync.TABLE, so missing tables silently no-op too (Codex #101).
create table if not exists socialdesk.cg_reference_accounts(id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists socialdesk.cg_post_analyses     (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists socialdesk.cg_ai_recommendations(id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists socialdesk.cg_performance       (id text primary key, data jsonb not null, updated_at timestamptz default now());
create table if not exists socialdesk.cg_coach_presets     (id text primary key, data jsonb not null, updated_at timestamptz default now());

-- POC access: open via the anon key (one shared workspace, no login).
-- Replace with auth + per-user RLS before real multi-user.
do $$
declare t text;
begin
  foreach t in array array['cg_brands','cg_assets','cg_social_accounts','cg_template_styles','cg_templates','cg_graphics','cg_clips','cg_folders','cg_coach_settings','cg_coach_briefs','cg_strategy_artifacts','cg_voice_profiles','cg_intent_sessions','cg_approval_signals','cg_reference_accounts','cg_post_analyses','cg_ai_recommendations','cg_performance','cg_coach_presets']
  loop
    execute format('alter table socialdesk.%I enable row level security', t);
    execute format('drop policy if exists anon_all on socialdesk.%I', t);
    execute format('create policy anon_all on socialdesk.%I for all to anon using (true) with check (true)', t);
    execute format('grant select, insert, update, delete on socialdesk.%I to anon', t);
  end loop;
end $$;
-- Then expose the schema: Dashboard → Settings → API → "Exposed schemas" → add `socialdesk`.
```

## 2. Set env vars (Vercel + .env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```
(Public/anon key only - safe in the browser bundle. No service-role key here.)

## What happens once set
- On load, the engine reads all collections from Supabase (source of truth) instead of localStorage.
- Every change mirrors to Supabase (local cache still kept for offline).
- A `/graphics/:id` link now opens the saved session on any device.

## Honest limits / next steps
- **Single shared workspace** (no auth yet): anyone with the password sees all brands. Add Supabase Auth + per-user RLS for true multi-user/accounts.
- **Assets** are stored as data URLs inside `cg_assets.data` (jsonb). Fine for a POC; for scale, move binaries to **Supabase Storage** and keep only URLs in the row.
- Sync is whole-collection upsert + delete-missing (fine at POC scale; a row-level diff is the optimisation later).
