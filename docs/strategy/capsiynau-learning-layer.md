# Capsiynau / Captionate — Self-Learning Intelligence Layer

**Version 2.1 — Strategy & architecture, ordered by build sequence**

---

## TL;DR

The strategic thesis is right: in a market where transcription, translation, and subtitle export are commodities, the moat is **tenant-scoped institutional memory and Welsh-specific linguistic adaptation**. But the previous draft front-loads the visible layer (dashboards, weekly reports, "AI feels alive") before the unglamorous infrastructure that has to exist for any of it to be true rather than performative.

This version reverses the order. Build the evaluation harness, event log, memory isolation, and reversibility story first. Ship one credible learning loop end-to-end. Add visible intelligence on top of something that actually works.

Three principles run through everything below:

1. **No metric without ground truth.** If you can't measure it against a held-out reference, you don't report it.
2. **Tenant isolation is a legal requirement, not a feature.** Broadcast clients will not share data with competitors. Design for that from day one.
3. **Reversibility before automation.** Any rule the system learns must be auditable, attributable, and undoable.

---

## 1. What the moat actually is

It is not "self-learning AI". Every wrapper claims that. The defensible assets are concrete:

- **Welsh linguistic infrastructure** — mutation handling, dialect coverage, bilingual phrasing, pronunciation models. This is a rules-plus-model engineering problem, not an emergent property of "learning from users".
- **Tenant-scoped production memory** — names, places, recurring contributors, house style, segmentation preferences, per-series glossaries.
- **Workflow telemetry** — the data showing which AI outputs are accepted, which are reworked, and why. Nobody else has this loop closed for Welsh-language production.
- **Trust and integration depth** — once a broadcaster's house style lives inside the platform, switching cost is high.

Everything else in this document supports building those four things.

---

## 2. The honest problem statement

The current system suggests glossary entries occasionally. That is not a learning system; it is a feedback inbox. The gap is not "users can't see the intelligence" — the gap is that there is no closed loop between:

```
correction  →  structured event  →  evaluation  →  rule proposal  →  human approval  →  rollout  →  measured impact  →  reversibility
```

Until that loop exists end-to-end for one narrow case (say, contributor name spellings on a single series), no dashboard or weekly report is honest. Build the loop once, narrow and deep, before broadening.

---

## 3. Architecture, in the order it should be built

### 3.1 Event capture (build this first)

Every user action becomes a structured, immutable event. Minimum schema:

```
event_id            uuid
tenant_id           uuid           # org, never null
user_id             uuid
project_id          uuid
series_id           uuid | null    # for recurring productions
event_type          enum           # correction | approval | rejection | export | edit_timing | segmentation | speaker_label
before              jsonb          # original AI output
after               jsonb          # human-corrected output
context             jsonb          # surrounding tokens, timestamps, speaker, programme metadata
created_at          timestamptz
source_model        text           # which model version produced `before`
source_prompt_hash  text           # prompt/version pinning for reproducibility
```

Two things that are easy to skip and expensive to retrofit:

- **`source_model` and `source_prompt_hash`.** Without these you cannot tell whether a regression came from a model upgrade or a learned rule.
- **`series_id`.** Production memory is mostly series-level, not org-level. Drama and news inside the same broadcaster need separate memories.

Storage: Postgres for the event log, partitioned by tenant. Move to a streaming layer (Kafka, Redpanda) only when volume justifies it. Do not start there.

### 3.2 Memory layers, with explicit isolation rules

| Layer | Scope | Writeable by | Readable by | Notes |
|---|---|---|---|---|
| Session | Single project | Auto | Project only | Discarded on export unless promoted |
| User | One editor | Auto, with prompt | That user across their projects | Personal preferences |
| Series | One programme/series within an org | Curator approval | Series team | Highest-value layer — strongest signal-to-noise |
| Organisation | One tenant | Curator approval | Org-wide | House style, terminology |
| Global Welsh | Platform | Engineering only, with explicit contractual opt-in | All tenants | Linguistic-only — never client data |

The **Global Welsh** layer is the one most likely to cause a contract dispute. Restrict it to language-level signals (mutation patterns, pronunciation, dialect recognition) and never to client-specific terminology, programme content, or names. Make the opt-in explicit in the MSA. Assume some broadcasters will refuse and design for that case to still be commercially viable.

### 3.3 Evaluation harness (build this second, before any learning ships)

This is the gap that turns "self-learning" into theatre if skipped.

- **Per-tenant golden sets.** Hand-labelled reference transcripts and translations, 30–60 minutes minimum per tenant, refreshed quarterly. Track WER, mutation accuracy, named-entity precision, and subtitle-timing fidelity.
- **Held-out regression suite.** Before any learned rule promotes to org or global memory, it must pass the regression suite. A rule that fixes one phrase but degrades two others gets rejected automatically.
- **Per-series eval where it matters.** Drama and sports need different reference sets.
- **Reported accuracy is always measured, never inferred.** "Welsh confidence improved 91.2% → 94.1%" is only allowed if both numbers came from the same held-out set.

This is the single most important piece of infrastructure. Without it the rest is unfalsifiable.

### 3.4 Confidence-weighted learning, with curatorship

The original tiered approach (single → suggest → adopt) is correct. Two refinements:

- **Independence of corroboration matters more than count.** Five corrections from one editor on one project ≠ five corrections from five editors across three projects. Score by independent contributors, not raw occurrences.
- **Negative evidence counts.** If a proposed rule fires three times and gets rejected twice, it loses confidence rather than slowly accumulating.

Promotion gates:

| Stage | Trigger | Action |
|---|---|---|
| Detected | ≥3 occurrences, ≥2 contributors | Stored as candidate |
| Proposed | Passes regression suite on golden set | Surfaced to curator |
| Adopted | Human curator approves | Promoted to series or org memory |
| Audited | Quarterly review | Removed if acceptance rate drops |

### 3.5 Correction intelligence (this is the real ML work)

The previous draft gave this one paragraph. It is the hardest and most defensible part of the system.

Classifying *why* a correction was made — not just what changed — is what turns an event log into intelligence. Categories worth modelling:

- Linguistic: mutation, agreement, register, dialect
- Stylistic: house tone, formality, punctuation convention
- Production: subtitle pacing, line length, reading speed, segmentation
- Factual: named-entity correction (person, place, programme)
- AI failure mode: hallucination, omission, code-switching error

Approach: start with a rules-based classifier trained on a few hundred hand-labelled corrections, layered with embeddings for similarity clustering. Use the classifications to route learning into the right pipeline — a named-entity fix updates the glossary; a subtitle-pacing pattern updates segmentation parameters; a register correction updates the prompt for that tenant. Do not let everything flow into a single "the model learned" pool.

### 3.6 Reversibility, attribution, audit

Every learned rule must carry:

- The events that triggered it
- The curator who approved it
- The golden-set delta at time of promotion
- An undo path that restores prior behaviour for new content without rewriting history

Without this, a bad rule contaminates the system silently and you cannot diagnose regressions. This is also a contractual requirement once broadcasters audit the platform.

### 3.7 Welsh linguistics — engineering, not emergence

Mutation handling, dialect recognition, and bilingual phrasing will not appear by themselves from user corrections. They need:

- An explicit Welsh NLP layer (rules-based mutation handler at minimum) feeding both pre-processing and post-processing
- A dialect tagger (N/S/Mid Wales, plus register) with labelled training data
- Pronunciation lexicons for high-frequency names and places, seeded from S4C/BBC archives where licensable
- Linguist review built into the curator role for borderline cases

Budget for a part-time Welsh-language computational linguist on retainer. This is not optional.

---

## 4. Visible intelligence — but only on top of real intelligence

Once the loop above is closed for at least one narrow case, the user-facing layer matters. The previous draft's instincts here are good; the constraint is that everything shown must be measured, not asserted.

- **"What we learned this week" reports** — fine, provided every figure traces to a golden-set measurement or an audited rule promotion. No vanity percentages.
- **Suggestion transparency** — "Suggested because 8 editors across 4 projects corrected this phrase" is honest and powerful. Build it.
- **Learning dashboard** — defer to year two. Internal curator tooling first; customer-facing dashboards once the data is trustworthy enough to defend in a client meeting.

---

## 5. Governance, IP, and contracts

Treat this as a product surface, not a legal afterthought.

- **Default isolation.** A new tenant's data feeds only their own memory layers. Global Welsh participation is opt-in with a separate clause.
- **Data residency.** UK-hosted by default. Some broadcasters will require this contractually.
- **Right to extract and delete.** Tenants can export their memory and revoke it. Build the API early; retrofitting is painful.
- **Linguist provenance.** Track which learned rules were curator-approved versus auto-promoted. Broadcasters will ask.
- **No cross-tenant leakage in prompts.** Especially relevant if you use a single shared model with tenant context — the prompt construction layer must prove isolation.

---

## 6. Unit economics

The original draft did not mention cost. Embeddings, retrieval, per-tenant context windows, and any fine-tuning add up fast.

- Cache aggressively at the prompt-prefix level (tenant memory rarely changes within a session).
- Tier the model: cheap model for first pass, stronger model only on low-confidence segments or on curator review.
- Vector storage scales linearly with terminology growth; budget for it and prune stale entries on a schedule.
- Measure cost-per-minute-of-finished-content per tenant. If a tenant's unit cost rises faster than their contract value, the learning is working against you.

---

## 7. Metrics worth tracking (and only these)

Grounded in measurement, not vibes:

**Quality**
- WER on per-tenant golden set, by language and dialect
- Mutation accuracy (Welsh-specific)
- Named-entity precision/recall on tenant glossary
- Subtitle-timing fidelity vs. broadcaster spec

**Learning loop health**
- Time from first correction to curator review
- Curator approval rate (target band: 40–70%; outside that, the proposer is either too loose or too strict)
- Rule retirement rate (rules removed at audit)
- Regression suite failure rate on proposed rules

**Production impact**
- Edit time per finished minute, trend over time
- Review-cycle count per project
- Export-to-broadcast turnaround

**Commercial**
- Cost per finished minute, by tenant
- Tenant retention vs. memory-layer maturity (the hypothesis test for the moat)

---

## 8. Build order

A realistic sequence. Twelve to eighteen months total.

**Phase 1 — Foundations (months 0–4)**
- Event log schema and ingestion
- Tenant isolation primitives
- One per-tenant golden set, manually labelled
- Curator tooling (internal CLI is fine)
- Welsh mutation handler v1 (rules-based)

**Phase 2 — First closed loop (months 4–8)**
- Pick one narrow case: contributor name corrections on one series
- Run the full loop: event → proposal → curator approval → promoted rule → measured impact
- Add reversibility and audit trail
- Add correction-intent classifier v1

**Phase 3 — Broaden (months 8–14)**
- Expand to segmentation, register, and glossary learning
- Series and organisation memory layers active
- Curator workflow productised
- Suggestion transparency in the editor UI

**Phase 4 — Visible intelligence (months 14–18)**
- Customer-facing learning dashboard
- "What we learned" reports, all figures golden-set-backed
- Global Welsh layer behind opt-in contract clause

---

## 9. What not to build first

- Customer-facing dashboards before the data behind them is trustworthy
- Weekly intelligence reports before a golden set exists
- Cross-tenant pooling before the contract clause exists
- A vector store before you know what you would query it for
- Auto-promotion of rules without curator approval

Each of these is tempting because it demos well. Each is a year-two problem.

---

## 10. The one-line version

A bilingual production intelligence system whose learning is **measured, attributable, reversible, and contractually clean** — and which therefore can credibly claim to get better every time a team uses it.

The previous draft promised the perception. This version describes the infrastructure that makes the perception true.
