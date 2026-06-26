# Postio creative-judgement layer + learning loop

The generator behaves like a **social producer first, designer second**: hook
first, design after. Every generated post passes a creative test before it is
presented, and the system **gets better over time** from real feedback.

## 1. The judgement loop (per generation)

`lib/creative/guide.ts` encodes the Social Creative Guide as the generator's
system prompt: the hook-first questions, the angle bank, and the five scored
dimensions (hook / clarity / shareability / Welsh tone / CTA).

`lib/creative/judge.ts` runs **draft (hook-first) -> self-score -> auto-revise
the concept** until every dimension clears 8, or the budget (2 rewrites) is
spent, when it returns its best attempt with an honest scorecard.

Wired in `app/api/ai/social/route.ts`: `intent-plan` + `autofill` run through
the loop; `intent-detect` is enriched with hook-first framing. Nothing publishes
- a human approves every output.

## 2. The learning loop (over time)

Improvement needs a signal the model does not generate itself. There are two,
and the loop uses both.

### Stage 0 - substrate
`ApprovalSignal` (in `lib/voiceai/types.ts`, persisted by `lib/voiceai/persist.ts`)
now captures, per decision: the creative scorecard, the **draft copy vs the copy
the human shipped** (the hook diff is the highest-value signal), platform,
language, and an optional `engagement` slot for real audience response.

### Stage 1 - learn from human decisions (in-context, ships working)
`creative-learn` (route) distils a brand's signals into a `CreativeProfile`:
winning vs losing angles, hooks the human keeps vs rewrites, and a one-paragraph
rubric. `lib/creative/profile.creativeProfileSummary()` renders it into a prompt
block that is injected into every future generation. The orchestrator re-learns
automatically once `LEARN_THRESHOLD` (5) new decisions have landed, and on demand
from the panel's "Improve from feedback" button. No AI call on mount.

### Stage 2 - learn from real performance
The distil task already reasons over `engagement` when present (it weights those
rows hardest and fills `audienceInsights`). The **only remaining integration** is
binding a real analytics source to `persist.recordEngagement(graphicId, metrics)`
once a published post can be mapped back to its originating graphic (Meta / IG
insights via Social Desk). Until then the loop learns from human decisions alone
and `audienceInsights` stays empty - it degrades cleanly.

### Stage 3 - keep the self-score honest
The distil task compares the AI's self-scores to what the human actually did
(a draft scored hook=9 that got rewritten = over-scoring) and writes
`scoreCalibration`. That calibration is injected back so the next generation
scores stricter on the dimensions it has inflated. (A fully blind critic pass is
the next hardening step beyond in-context calibration.)

## Operator action items

- **Bind real engagement** to `recordEngagement()` to switch the profile basis
  from `human` to `both` and unlock `audienceInsights`.
- **Native Welsh review** of the new `va.creative.*` and `va.learn.*` `cy` keys
  (machine-draft, flagged in `lib/i18n/strings.ts`).

## Data (backend-ready)

`approvalSignals` + `creativeProfiles` live under the `cg.v1.*` localStorage
namespace today; at M0 they become `socialdesk.cg_*` rows (flat, brand-scoped,
one jsonb each) with no reshaping.
