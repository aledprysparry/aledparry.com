-- Capsiynau learning loop — MVP schema
-- Postgres 14+. Designed to be the smallest thing that lets you close the
-- correction -> proposal -> approval -> application -> measurement loop.
-- Extend later; do not skip fields marked "important for reproducibility".

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- events: every meaningful user action against AI output. Append-only.
-- ---------------------------------------------------------------------------
create table if not exists events (
  event_id           uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null,
  series_id          uuid,                 -- nullable for non-series content
  episode_id         uuid,
  project_id         uuid,
  user_id            uuid not null,

  event_type         text not null
    check (event_type in (
      'name_correction',                   -- MVP scope: only this one is wired up
      'segmentation_edit',
      'timing_edit',
      'register_change',
      'speaker_relabel',
      'approval',
      'rejection',
      'export'
    )),

  before             jsonb not null,       -- raw AI output for the changed span
  after              jsonb not null,       -- human-corrected value
  context            jsonb,                -- surrounding tokens, timestamp, speaker

  -- Important for reproducibility. Skipping these makes regression analysis
  -- impossible later. Do not omit.
  source_model       text not null,        -- e.g. "whisper-large-v3" or "claude-opus-4-7"
  source_prompt_hash text not null,        -- sha256 of the system prompt used

  created_at         timestamptz not null default now()
);

create index if not exists events_tenant_series_idx
  on events (tenant_id, series_id, event_type, created_at desc);

create index if not exists events_after_normalised_idx
  on events using gin ((after));

-- ---------------------------------------------------------------------------
-- learned_rules: curator-approved rules applied at transcription time.
-- ---------------------------------------------------------------------------
create table if not exists learned_rules (
  rule_id            uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null,
  series_id          uuid,                 -- null = org-wide
  rule_type          text not null
    check (rule_type in ('name_spelling', 'glossary_term', 'pronunciation')),

  -- For MVP these are simple strings. The wrong form the model tends to emit,
  -- and the canonical correction. `context_hint` disambiguates homographs.
  pattern            text not null,
  replacement        text not null,
  context_hint       text,

  status             text not null
    check (status in ('proposed', 'approved', 'rejected', 'retired'))
    default 'proposed',

  -- Provenance: which events triggered this proposal. Important for audit
  -- and for the reversibility test.
  supporting_events  uuid[] not null default '{}',

  proposed_at        timestamptz not null default now(),
  approved_at        timestamptz,
  approved_by        uuid,
  retired_at         timestamptz,
  retired_reason     text,

  unique (tenant_id, series_id, rule_type, pattern, replacement)
);

create index if not exists learned_rules_active_idx
  on learned_rules (tenant_id, series_id, status)
  where status = 'approved';

-- ---------------------------------------------------------------------------
-- golden_set: hand-labelled reference data for measuring accuracy.
-- One row per labelled span. Keep the granularity tight — one entity per row.
-- ---------------------------------------------------------------------------
create table if not exists golden_set (
  span_id            uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null,
  series_id          uuid not null,
  episode_id         uuid not null,
  audio_ref          text not null,        -- path or asset ID
  start_ms           integer not null,
  end_ms             integer not null,

  entity_type        text not null
    check (entity_type in ('person', 'place', 'organisation', 'programme_term')),
  reference_text     text not null,        -- the correct, human-verified value

  labelled_by        uuid not null,
  labelled_at        timestamptz not null default now(),
  notes              text
);

create index if not exists golden_set_series_idx
  on golden_set (tenant_id, series_id, episode_id);

-- ---------------------------------------------------------------------------
-- measurement_runs: each before/after evaluation. Keep them; you'll want
-- the timeline for the eventual "weekly intelligence" reports.
-- ---------------------------------------------------------------------------
create table if not exists measurement_runs (
  run_id             uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null,
  series_id          uuid not null,
  run_at             timestamptz not null default now(),

  rules_applied      uuid[] not null default '{}',
  source_model       text not null,
  source_prompt_hash text not null,

  precision_score    numeric(5,4),
  recall_score       numeric(5,4),
  f1_score           numeric(5,4),
  true_positives     integer,
  false_positives    integer,
  false_negatives    integer,

  notes              text
);

create index if not exists measurement_runs_series_idx
  on measurement_runs (tenant_id, series_id, run_at desc);
