# Capsiynau Learning Loop — 2-Week MVP

The smallest version of the loop described in `../capsiynau-learning-layer.md`. Goal: produce **one measured accuracy number** for **one series**, end to end, in two weeks. Everything in this folder is a starting point a dev can lift into the Capsiynau repo.

## Scope, ruthlessly narrow

| Decision | Choice | Why |
|---|---|---|
| Event type | Contributor name corrections only | Highest signal, lowest linguistic risk |
| Tenant | One pilot series | Real users, real corrections, no cross-tenant complexity yet |
| Rule application | Glossary injection into the transcription prompt | No fine-tuning, no embeddings, no infra to wait on |
| Curation | Notion / Linear board, manual approve/reject | UI is a year-two problem |
| Measurement | Named-entity precision on a 30-minute hand-labelled clip from the same series | One number, defensible |

If anything below tempts you to expand scope before the loop closes once, **don't**. Broaden after you have the first measured delta.

## Two-week plan

### Week 1 — instrument and label

**Day 1–2 — Schema and capture**
- Apply `schema.sql` to the Capsiynau database.
- Wire the editor so every name correction posts an event row (`event_type = 'name_correction'`). Capture `before`, `after`, `series_id`, `episode_id`, `user_id`, `source_model`, `source_prompt_hash`.
- Backfill from the last 30 days of edit history if you can. Skip if not.

**Day 3–4 — Golden set**
- Pick 30 minutes of finished, broadcast-quality content from the pilot series.
- A producer or linguist hand-labels the reference transcript using `labelling-guide.md`. Names, places, programme-specific terminology only — not full transcription review.
- Store the golden set as `golden_set` rows.

**Day 5 — Baseline measurement**
- Re-transcribe the golden-set audio with the current production prompt (no rules applied).
- Compute named-entity precision and recall against the labelled reference. Record as the baseline. This is the number you will beat.

### Week 2 — close the loop

**Day 6–7 — Proposal generation**
- Cluster the captured `name_correction` events by normalised `after` value.
- Surface any cluster with ≥3 occurrences from ≥2 distinct users as a proposed rule. Post each to a Notion/Linear board with the supporting events linked.

**Day 8 — Curation**
- A human (producer + linguist, 60–90 minutes) walks the board. Approve, reject, or hold. Approved rules write to `learned_rules` with `status = 'approved'`.

**Day 9–10 — Application and re-measurement**
- Use `apply_rules.ts` as the reference: load approved rules for the series, inject them as a glossary block into the system prompt, re-transcribe the golden-set audio.
- Recompute named-entity precision and recall. Compare to baseline.
- Write a one-page memo: how many rules approved, the precision delta, any regressions on previously-correct entities.

That memo is your first defensible "the system learned X" claim. Everything afterwards is iteration on the same loop.

## What "results" looks like at the end of two weeks

- A populated `events` table from real pilot usage
- A 30-minute golden set for one series
- 5–20 curator-approved rules in `learned_rules`
- Two measured numbers (precision before, precision after) with the delta
- A reversibility test: flip the rules off, re-measure, confirm you return to baseline

If any of those five are missing, the loop is not closed yet. Don't widen scope until they all are.

## What this MVP deliberately skips

- Vector embeddings (not needed for exact-match name rules)
- Cross-tenant memory (one series, one tenant)
- Automated regression suite (manual re-measurement is fine at this volume)
- Customer-facing dashboards (year two)
- Welsh mutation handling (different event type, next iteration)
- Auto-promotion (every rule is human-approved)

Each of those is a planned next step in `../capsiynau-learning-layer.md`. None of them gates the first measured result.

## Files in this folder

- `schema.sql` — minimum tables: `events`, `learned_rules`, `golden_set`
- `apply_rules.ts` — reference for loading approved rules and injecting them as a cached glossary block on transcription
- `labelling-guide.md` — how the producer/linguist should label the golden set, and how to compute the precision/recall numbers
