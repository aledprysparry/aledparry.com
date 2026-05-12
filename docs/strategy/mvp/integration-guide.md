# Integrating the Series Memory engine into the Capsiynau repo

This branch ships a working learning loop with three usable surfaces:

- A pure-TS engine at `lib/capsiynau/` (no DOM, no DB, no I/O).
- A Next.js API route at `app/api/capsiynau/measure/route.ts` that runs the engine against a held-out reference clip.
- A React UI at `components/demos/CapsiynauMemory.tsx` (served at `/app/capsiynau`) that lets a visitor experience the loop end-to-end.
- A headless CLI at `scripts/capsiynau-loop-cli.ts` that prints precision/recall against the same reference.

The engine and the demo data are deliberately separated so the engine can be lifted into the Capsiynau production repo cleanly. This document is the lift-and-fit guide.

## What's portable, what isn't

| File | Lift as-is | Reason |
|---|---|---|
| `lib/capsiynau/types.ts` | ✅ Yes | Pure types, no runtime imports. |
| `lib/capsiynau/engine.ts` | ✅ Yes | Pure functions. Zero dependencies. |
| `lib/capsiynau/data.ts` | ❌ No | Demo seed data. In production, replace with Postgres queries. |
| `app/api/capsiynau/measure/route.ts` | 🟡 Pattern | Copy the shape; replace the data import with DB queries. |
| `scripts/capsiynau-loop-cli.ts` | 🟡 Pattern | Useful as a regression-test harness once the real data is in place. |
| `components/demos/CapsiynauMemory.tsx` | ❌ No | Demo-specific UX. The production curator UI and editor UI will be different surfaces. |

## Step 1 — Copy the engine

In the Capsiynau repo:

```
src/
  lib/
    learning/
      types.ts      # copy of lib/capsiynau/types.ts
      engine.ts     # copy of lib/capsiynau/engine.ts
```

Adjust import paths if your repo uses a different alias (e.g. `@/lib/learning` instead of `@/lib/capsiynau`).

## Step 2 — Back the engine with the real schema

The engine accepts plain TypeScript objects. It does not assume Postgres, Drizzle, Prisma, or anything else. You write the adapter.

Suggested adapter signatures (whichever ORM / query layer Capsiynau uses):

```ts
// src/lib/learning/repo.ts
import type { CorrectionEvent, Entity, Rule, GoldenSpan } from "./types";

export async function getEntitiesForSeries(seriesId: string): Promise<Entity[]> {
  // select canonical, variant, type from series_entities where series_id = $1
}

export async function getEventsForSeries(seriesId: string): Promise<CorrectionEvent[]> {
  // select * from events where series_id = $1 and event_type = 'name_correction'
}

export async function getApprovedRulesForSeries(seriesId: string): Promise<Rule[]> {
  // select * from learned_rules where series_id = $1 and status = 'approved'
}

export async function insertProposedRule(rule: Rule): Promise<void> { /* ... */ }
export async function approveRule(ruleId: string, approvedBy: string): Promise<void> { /* ... */ }
export async function retireRule(ruleId: string, reason: string): Promise<void> { /* ... */ }

export async function getGoldenSetForSeries(seriesId: string): Promise<GoldenSpan[]> {
  // select * from golden_set where series_id = $1
}
```

The DDL for these tables is at `docs/strategy/mvp/schema.sql` on this branch.

## Step 3 — Wire the loop into the transcription pipeline

The engine has two integration points in the production pipeline:

### 3a. Glossary injection at transcription time

When the ASR / post-processing step is invoked for a series, prefix the system prompt (or post-processing prompt) with the approved rules as a glossary:

```ts
import { indexRules } from "@/lib/learning/engine";
import { getApprovedRulesForSeries } from "@/lib/learning/repo";

async function transcribe(audio: AudioRef, seriesId: string) {
  const rules = await getApprovedRulesForSeries(seriesId);
  const glossary = formatGlossary(rules); // simple list, see apply_rules.ts reference
  // ... call your existing ASR + Claude post-processing with the glossary in the prompt
}
```

A reference for the Claude side is at `docs/strategy/mvp/apply_rules.ts` (uses prompt caching since the glossary is stable per series).

### 3b. Event capture in the editor

Every name correction the editor makes posts an event:

```ts
import type { CorrectionEvent } from "@/lib/learning/types";
import { insertEvent } from "@/lib/learning/repo";

async function onEditorCorrection({
  before, after, seriesId, episodeId, userId, sourceModel, sourcePromptHash, span,
}) {
  const event: CorrectionEvent = {
    id: crypto.randomUUID(),
    entityCanonical: after,
    spanKey: `${episodeId}-${span.startMs}`,
    before, after,
    userId,
    episodeId,
    occurredAt: Date.now(),
  };
  await insertEvent(event);
  // Also persist sourceModel + sourcePromptHash for reproducibility
  // (see schema.sql — those columns are mandatory).
}
```

## Step 4 — The proposal worker

Run this as a scheduled job (cron, Trigger.dev, Inngest — whatever Capsiynau uses) per series, say every hour:

```ts
import { proposeRules } from "@/lib/learning/engine";
import {
  getEntitiesForSeries,
  getEventsForSeries,
  getApprovedRulesForSeries,
  insertProposedRule,
} from "@/lib/learning/repo";

export async function proposeNewRulesFor(seriesId: string) {
  const [events, existingRules, entities] = await Promise.all([
    getEventsForSeries(seriesId),
    getApprovedRulesForSeries(seriesId),
    getEntitiesForSeries(seriesId),
  ]);
  const proposals = proposeRules({ events, existingRules, entities });
  for (const p of proposals) {
    await insertProposedRule({
      id: crypto.randomUUID(),
      entityCanonical: p.entityCanonical,
      pattern: p.pattern,
      replacement: p.replacement,
      type: p.type,
      status: "approved",                    // not really — these go to 'proposed'
      supportingEventIds: p.supportingEventIds,
      contributors: p.contributors,
      approvedAt: 0,
    });
  }
}
```

The proposal is then surfaced to a curator. The engine deliberately does not auto-approve.

## Step 5 — The curator surface

The demo at `/app/capsiynau` shows one in-editor curator pattern (single proposal card, one-click approve). The production curator UI can be different — a dashboard, a Linear-style board, or an email digest with one-click approve links — but it should expose:

- The pattern → replacement
- Supporting event count and distinct contributor count
- Links to the source corrections (so the curator can verify)
- Approve / Reject / Hold actions
- Audit history (who approved what, when, against which golden-set delta)

## Step 6 — Regression test on every rule approval

This is the part most teams skip. Before a proposed rule is approved into a series, run measurement against the held-out golden set both with and without the proposed rule. If precision drops on any previously-correct entity, block the approval and surface the regression to the curator.

```ts
import { measureAgainstGoldenSet } from "@/lib/learning/engine";

async function safeApprove(proposalId: string, curatorId: string) {
  const series = await getSeriesForProposal(proposalId);
  const goldenSet = await getGoldenSetForSeries(series.id);
  const current = await getApprovedRulesForSeries(series.id);
  const candidate = await materialiseProposal(proposalId, curatorId);

  const before = measureAgainstGoldenSet({ goldenSet, rules: current, entities, transcribe });
  const after  = measureAgainstGoldenSet({ goldenSet, rules: [...current, candidate], entities, transcribe });

  if (after.precision < before.precision || after.recall < before.recall) {
    throw new Error(`Approval would regress precision (${before.precision} → ${after.precision}). Block.`);
  }
  await approveRule(proposalId, curatorId);
}
```

`transcribe` is the same function the production ASR uses — feed it the audio for each golden span and let it produce text. The engine does not care how that's done.

## Step 7 — Reversibility

The schema includes `retired_at` and `retired_reason` on `learned_rules`. Make rule retirement a first-class action in the curator UI. Without an undo path, a bad rule contaminates the system silently.

When a rule retires:
- It stops being included in `getApprovedRulesForSeries`.
- Existing transcripts are NOT rewritten.
- A measurement run is automatically queued to confirm the system returned to the prior baseline.

## What the demo proves about the engine

The headless CLI run on this branch:

```
$ npx tsx scripts/capsiynau-loop-cli.ts

Capsiynau learning loop — held-out measurement
===============================================
Series           : Y Sesiwn
Tenant           : tenant-capsiynau-pilot
Events ingested  : 18 (7 backstory + 11 session)
Rules approved   : 7
Golden set spans : 30

                  precision   recall      f1     TP / FP / FN
Baseline       :    30.0%     30.0%     30.0%    9 / 21 / 21
With rules     :    83.3%     83.3%     83.3%    25 / 5 / 5
Delta          :    53.3%     53.3%     53.3%
```

The same engine drives the API route at `/api/capsiynau/measure` and the React demo at `/app/capsiynau`. Three callers, one engine, one set of numbers. That's the property to preserve when lifting into the Capsiynau repo: every consumer of the loop must agree on the result.

## What is **not** in this engine (deliberately)

- **Welsh-specific NLP.** Mutation handling, dialect detection, pronunciation modelling. Those need a separate module driven by linguistic rules, not user corrections.
- **Cross-tenant pooling.** The engine operates on one tenant's events. Any cross-tenant learning must go through an explicit contractual opt-in and a separate global-rules pipeline.
- **Per-tenant fine-tuning.** Out of scope; glossary injection at prompt time gets you most of the way.
- **Correction-intent classification.** The "why did the editor change this?" step described in the strategy doc. Build it as a separate classifier that runs on events; the engine here only cares about whether the events cluster.

Add these as separate modules, layered on top of (or beside) the engine, not bolted into it.
