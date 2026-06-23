# Postio Voice AI — Architecture & MVP Roadmap (Phase 0)

*Status: PLAN ONLY. No product code in this round beyond the thin MVP slice (gated behind review).
This document is the thing to review before mass implementation.*

*Reframe: Postio stops asking "what TYPE of content do you want to make?" and starts asking
"what are you trying to ACHIEVE?". The human owns **intent** and **approval**. The AI owns
**execution**. Nothing publishes by itself.*

Companion docs (this plan sits on top of them, does not replace them):
`POSTIO_ARCHITECTURE_V2.md` (the one-pipeline/one-template refactor), `POSTIO_BUILD_PLAN.md`
(the 80%-reuse / 20%-new audit), `DESIGN_PRINCIPLES.md`, `LIGHT_THEME_SPEC.md`.

---

## 0. The one-paragraph version

A single **intent bar** is the new front door. You speak or type (or drop an image, a clip, a
document, a URL) and say what you want to *happen* — "It's ten years since the Brexit vote, I want
something that gets people talking" — not which template to open. An **orchestrator** runs the
input through an **intent engine** (what is this person trying to achieve?), proposes 2-3 concrete
**candidate outputs** (a quiz, a carousel, a reel, a poll), and on your pick, a **planning agent**
decides what to make and what it needs, then **delegates to Postio's existing generators** (the
template registry, the clip pipeline, Coach). Every result lands in a **review surface** with the
AI's reasoning and alternatives. You approve, edit, or reject — and that signal trains a
**learning engine** (brand voice + org rules) so the next answer is better. Distribution stays in
social-desk, and **nothing leaves Postio without an explicit per-item human approval**.

The honest scope: **~90% of this is orchestration glue over things that already exist.** The only
genuinely new building blocks are (a) two new AI tasks — intent-detection and planning — added to
the existing gated route, and (b) a thin client-side orchestrator that sequences calls and writes
new `cg.v1.*` collections. Everything downstream (generation, rendering, export, scoring) is
already built.

---

## 1. Positioning & first principles

| Tool | Starts from |
|---|---|
| Canva | a blank **design** |
| ChatGPT | a **conversation** |
| Adobe | a **tool** |
| **Postio Voice AI** | the **outcome** |

Principles, in priority order:

1. **Intent before tools.** No "pick a template" as step one. The platform infers the format.
2. **Human = intent + approval; AI = execution.** This is both the product philosophy *and* a hard
   safety rule. See §10.
3. **Nothing auto-publishes, auto-sends, or auto-posts.** Every outward action is a draft a human
   approves, one item at a time.
4. **Reuse over rebuild.** The orchestrator calls existing generators; it does not re-implement
   them. If a layer already exists (Coach scoring, export, transcription), it is wired, not cloned.
5. **Welsh-first where the brand is.** Machine-drafted Welsh is always flagged for native review;
   we never present confident-but-unreviewed Welsh as final. Bilingual EN+CY throughout.
6. **Explainable.** Every draft carries the AI's reasoning ("I led with this stat because…") and
   real alternatives, so the human is approving a decision, not a black box.

---

## 2. System architecture

### 2.1 The seven layers (faithful to the vision) mapped onto real code

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 1. VOICE & INPUT ENGINE                                                        │
│    voice · text · image · video · document · URL                               │
│    REUSE: /api/postio/transcribe (Capsiynau v1, Welsh+English) for voice→text  │
│    NEW: a lightweight input router (which modality? normalise to a prompt blob) │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ 2. INTENT ENGINE                  NEW AI TASK: 'intent-detect'                  │
│    "what are they trying to achieve?" → goal + audience + 2-3 candidate formats│
└───────────────────────────────┬──────────────────────────────────────────────┘
                                 ▼  (human picks a candidate — the FIRST approval gate)
┌──────────────────────────────────────────────────────────────────────────────┐
│ 3. PLANNING AGENT                 NEW AI TASK: 'intent-plan'                    │
│    decides WHAT to create, WHICH generator, WHAT assets are needed,            │
│    asks for missing info ONLY when blocking ("Instagram, Facebook or TikTok?") │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ 4. CREATIVE GENERATION (LLM copy/concepts)   REUSE existing tasks:             │
│    social-copy · captions · autofill · improve · coach-strategy (scroll_post)  │
├──────────────────────────────────────────────────────────────────────────────┤
│ 5. ASSET GENERATION (real deliverables)      REUSE existing generators:        │
│    store.createTemplate→createGraphic→updateGraphic→export*                    │
│    stills/carousels (exportZip) · animated (downloadAnimatedWebM) ·            │
│    clips (Pipeline + /api/postio/render FFmpeg worker)                          │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                 ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│ 6. REVIEW ENGINE                  REUSE: Coach (preExportCheck + runPostAnalysis)│
│    draft + AI reasoning + Option A/B/C. NOTHING auto-publishes. (approval gate) │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                 ▼  (human approves/edits/rejects — trains layer 7)
┌──────────────────────────────────────────────────────────────────────────────┐
│ 7. LEARNING ENGINE                REUSE: VoiceProfile (lib/coach/voice.ts)      │
│    accepted/rejected/edited → brand voice + org rules → better next time        │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 The agent structure

One **Orchestrator** owns the session state machine and delegates to specialist agents. The
specialists are *prompt-and-tool configurations of the same gated route*, not separate servers.

```
                         ┌─────────────────┐
                         │  ORCHESTRATOR   │  client-side state machine
                         │  (the spine)    │  owns: session, plan, gates, undo
                         └───┬───┬───┬───┬─┘
        ┌────────────────────┘   │   │   └────────────────────┐
        ▼                        ▼   ▼                         ▼
  ┌───────────┐         ┌───────────┐ ┌───────────┐    ┌────────────┐
  │ RESEARCH  │         │ CREATIVE  │ │  DESIGN   │    │   VIDEO    │
  │ context / │         │ ideas /   │ │ graphics  │    │ clips /    │
  │ facts     │         │ copy      │ │ (registry)│    │ subtitles  │
  └───────────┘         └───────────┘ └───────────┘    └────────────┘
                                                              │
                                              ┌───────────────┘
                                              ▼
                                       ┌────────────┐
                                       │ PUBLISHING │  EXPORT ONLY in MVP;
                                       │  (export)  │  social-desk handoff is
                                       └────────────┘  human-approved, later phase
```

- **Orchestrator** — a finite state machine in the browser (`lib/voiceai/orchestrator.ts`). States:
  `idle → capturing → detecting-intent → awaiting-pick → planning → awaiting-info? → generating →
  reviewing → approved/rejected`. It never calls Anthropic directly; it calls the gated route and
  the store. It is the only thing that writes the `IntentSession` record.
- **Research** — optional; gathers context/facts for the brief. In MVP this is folded into the
  intent + planning prompts (no live web scraping — see §10). A dedicated research agent is a
  later phase.
- **Creative** — copy and concepts. Maps to existing `social-copy`, `captions`, `autofill`,
  `improve`, `coach-strategy` tasks.
- **Design** — graphics. Maps to the template registry + export pipeline (§4).
- **Video** — clips + subtitles. Maps to `Pipeline.tsx` + `clip-analysis` + transcription +
  the FFmpeg render worker.
- **Publishing** — export in MVP (download / ZIP / WebM). Social-desk publishing is a *separate,
  per-item, human-approved* later phase, never automatic.

**Why client-side orchestration for the MVP:** the entire engine is a localStorage SPA today. The
orchestrator is a deterministic state machine that calls the (already gated, already deployed)
`/api/ai/social` route and the existing store. That keeps the MVP shippable with zero new
infrastructure. The design is explicitly **backend-ready** (§3.3) so the orchestrator can move to a
server job model under Supabase (M0) without reshaping the data.

### 2.3 Request lifecycle (one full pass)

```
user input (voice/text/image/url)
  │  voice → POST /api/postio/transcribe → poll → text
  ▼
orchestrator: POST /api/ai/social { task:'intent-detect', input, brand, voice }
  ▼  → { goal, audience, language, candidates:[ {format, why, generatorKind, confidence} x2-3 ] }
human picks candidate ───────────────────────────────────────────────── APPROVAL GATE #1
  ▼
orchestrator: POST /api/ai/social { task:'intent-plan', candidate, input, brand, voice }
  ▼  → { steps:[…], generator:{kind, inputsNeeded}, missingInfo:[…], creativeBrief }
  ├─ missingInfo non-empty & blocking? → ask ONE question, await answer
  ▼
orchestrator runs the generator chain (existing code):
  store.createTemplate(brandId, kind) → createGraphic → updateGraphic({inputs|slides})
  (+ existing creative tasks for copy: social-copy / captions / autofill)
  ▼
orchestrator: Coach review — preExportCheck(graphic, brand, platform)  [deterministic, instant]
             + optional runPostAnalysis(...)                            [AI, async]
  ▼
REVIEW SURFACE: draft + reasoning + Option A/B/C ───────────────────── APPROVAL GATE #2
  ▼
human: approve → export (download)   |   edit → opens existing GraphicEditor   |   reject
  ▼
learning: write ApprovalSignal → update VoiceProfile (debounced)
```

---

## 3. Data model & schema (backend-ready, localStorage today)

### 3.1 What already exists (reuse verbatim)

The engine persists through `lib/store/persist.ts` under the `cg.v1.*` namespace, one collection
per key, via the `useStore()` context API. Existing collections relevant here:
`cg.v1.brands`, `cg.v1.templates`, `cg.v1.graphics`, `cg.v1.clips`, `cg.v1.assets` (IndexedDB),
`cg.v1.voiceProfiles`, `cg.v1.postAnalyses`, `cg.v1.aiRecommendations`. The Supabase mirror
(`socialdesk.cg_*`, one `id text / data jsonb / updated_at` table per collection) is built but
env-gated.

`Brand`, `GeneratedGraphic`, `VoiceProfile`, `Clip` shapes already exist and are reused unchanged.

### 3.2 New collections (Voice AI)

Four new collections, following the identical `id / data jsonb / updated_at` pattern so the
existing Supabase sync picks them up with zero new sync code — just four new tables.

```ts
// cg.v1.intentSessions  — one per intent-bar interaction
interface IntentSession {
  id: ID;
  brandId: ID;
  createdAt: ISODate;
  updatedAt: ISODate;
  state: 'capturing'|'detecting'|'awaiting-pick'|'planning'|'awaiting-info'
        |'generating'|'reviewing'|'approved'|'rejected'|'error';
  input: {
    modality: 'voice'|'text'|'image'|'video'|'document'|'url';
    rawText?: string;          // transcribed/typed text
    mediaAssetId?: ID;         // ref into cg.v1.assets (never the bytes here)
    sourceUrl?: string;        // for URL inputs (fetched server-side, see §10)
    lang: 'en'|'cy'|'auto';
  };
  detected?: IntentResult;     // output of intent-detect
  chosenCandidateId?: string;  // which candidate the human picked (gate #1)
  plan?: IntentPlan;           // output of intent-plan
  producedGraphicIds: ID[];    // links to cg.v1.graphics created this session
  producedClipIds: ID[];       // links to cg.v1.clips
  reviewId?: ID;               // ref into cg.v1.reviewDrafts
}

// cg.v1.intentResults  (embedded in session.detected; typed here for clarity)
interface IntentResult {
  goal: string;                // "spark conversation about Brexit anniversary"
  audience?: string;
  language: 'en'|'cy'|'bilingual';
  reasoning: string;           // why this goal (explainability)
  candidates: IntentCandidate[];
}
interface IntentCandidate {
  id: string;                  // 'c1','c2','c3'
  format: string;              // human label e.g. "3-slide quiz"
  generatorKind: string;       // a real TemplateKind id e.g. 'cwis-quiz' | 'universal-listicle'
  outputClass: 'still'|'carousel'|'animated'|'clip';
  why: string;                 // one line: why this fits the goal
  confidence: number;          // 0..100
}

// cg.v1.intentPlans  (embedded in session.plan; typed here)
interface IntentPlan {
  generatorKind: string;
  steps: { id: string; label: string; agent: 'creative'|'design'|'video'|'research' }[];
  creativeBrief: string;       // the prompt context handed to creative tasks
  inputsNeeded: string[];      // graphic input keys the generator requires
  missingInfo: { id: string; question: string; blocking: boolean; options?: string[] }[];
}

// cg.v1.reviewDrafts  — the review surface state, with reasoning + alternatives
interface ReviewDraft {
  id: ID;
  sessionId: ID;
  brandId: ID;
  graphicId?: ID;              // primary produced asset
  reasoning: string;           // "I used this headline because…"
  options: {                   // Option A/B/C — alternative copy/concepts
    id: 'A'|'B'|'C';
    label: string;
    copyOverrides?: Record<string,string>;
    note?: string;
  }[];
  chosenOptionId?: 'A'|'B'|'C';
  coachCheck?: CheckItem[];    // from preExportCheck (deterministic)
  coachScore?: number;         // from runPostAnalysis (optional AI)
  status: 'pending'|'approved'|'edited'|'rejected';
  createdAt: ISODate;
}

// cg.v1.approvalSignals  — the training data for the learning engine
interface ApprovalSignal {
  id: ID;
  brandId: ID;
  sessionId: ID;
  graphicId?: ID;
  decision: 'approved'|'edited'|'rejected';
  chosenOptionId?: 'A'|'B'|'C';
  editDelta?: Record<string,string>;  // what the human changed (final vs draft)
  intentGoal: string;          // denormalised for fast voice-learning queries
  generatorKind: string;
  createdAt: ISODate;
}
```

### 3.3 Backend-ready / M0 migration path

- **No new persistence code.** New collections plug into the existing `saveCollection` /
  `syncCollectionToSupabase` machinery. M0 adds four `socialdesk.cg_*` tables (same DDL as the rest)
  and they sync automatically.
- **Media stays referenced, never hosted** (per `POSTIO_ARCHITECTURE_V2.md` §4). `IntentSession.input`
  holds an `assetId` or a `sourceUrl`, not bytes. Source video/audio flows through the existing
  transcription/render proxies which already take URLs.
- **Orchestrator → server jobs.** Today the orchestrator runs in the browser. Under M0 the same
  state machine can run as a server job (the `IntentSession.state` field is already the job state),
  which is how voice/long-running multi-step plans scale. No schema change required.
- **RLS-ready.** When auth lands, every new collection is brand-scoped (`brandId`) exactly like the
  existing ones, so the social-desk RLS pattern (per-user → per-brand) drops in unchanged.

---

## 4. API design

### 4.1 Reuse: the gated route is the only AI surface

All AI goes through `app/api/ai/social/route.ts`, which is already gated by `requireGate()`
(HMAC `postio_gate` cookie, 30-day TTL) and keyed by `ANTHROPIC_API_KEY` (set in prod). Model:
`claude-sonnet-4-6` for the fast classify/plan tasks; the route's structured-JSON parsing
(markdown-fence strip + brace-extract fallback) and `coachMaxTokens()` budgeting are reused as-is.

### 4.2 Two new tasks (additive — same dispatch pattern)

Add to the `Body['task']` union and the `buildPrompt()` switch. No new endpoint, no new gate.

**`intent-detect`** — input → goal + candidates.
```
POST /api/ai/social
{ task:'intent-detect',
  input: { text, modality, lang },
  brand?: { name, toneNotes, colours, fonts },
  voice?: string,                       // voiceSummary(VoiceProfile) for tone-fit
  availableKinds: string[] }            // the generator kinds this brand actually has
→ { result: IntentResult }              // goal, audience, language, reasoning, candidates[2..3]
```
System prompt rules: classify the *outcome* not the medium; only propose `generatorKind` values
present in `availableKinds`; reply in the input's language; 4-part reasoning (what you noticed /
why this goal / which formats fit / expected effect); never invent stats; no em-dashes.
`max_tokens` ≈ 1000.

**`intent-plan`** — chosen candidate → executable plan.
```
POST /api/ai/social
{ task:'intent-plan',
  candidate: IntentCandidate,
  input: {...}, brand?, voice?,
  kindSpec: { copyFields, imageSlots, dataHint } }  // from the registry, so the model knows the shape
→ { result: IntentPlan }                            // steps, creativeBrief, inputsNeeded, missingInfo
```
System prompt rules: produce a concrete plan for *this* generator kind; list `inputsNeeded` using
the real `copyFields` keys; ask for `missingInfo` ONLY when a field is blocking and not inferable
(e.g. target platform when it changes aspect ratio); set `blocking:false` for nice-to-haves.
`max_tokens` ≈ 2400.

### 4.3 Reuse: everything else

| Need | Existing surface |
|---|---|
| voice → text | `POST /api/postio/transcribe` → poll `GET ?jobId=` (Capsiynau, Welsh+English) |
| copy / captions / variants | `task:'social-copy' | 'captions' | 'autofill' | 'improve'` |
| strategy / scroll-post | `task:'coach-strategy'` (play `scroll_post`) |
| review score | `runPostAnalysis()` (AI) + `preExportCheck()` (deterministic) in `lib/coach/*` |
| brand voice | `deriveVoiceProfile()` / `refineVoiceProfile()` in `lib/coach/voice.ts` |
| clip cutting / burn-in | `POST /api/postio/render` (FFmpeg worker, env-gated) |
| asset generation | store `createTemplate`/`createGraphic`/`updateGraphic` + `export*` (§ below) |

### 4.4 Reuse: generator invocation contract (no DOM, pure store + export)

The orchestrator drives generators through the store and the deterministic exporters — the same
calls the UI already makes:

```ts
const tpl = store.createTemplate(brandId, kind /* e.g. 'cwis-quiz' */);
const g   = store.createGraphic(brandId, tpl.id, { name });
store.updateGraphic(g.id, { inputs: { rawText?, copyOverrides, images? } });   // carousel/still/animated
// or, for freeform kinds:                       { slides: [{ elements: [...] }] }
// export (deterministic, side-effect = browser download):
await exportZip(slides, rows, copy, mime, name, ratio, brand, imageUrls);       // stills/carousels
await downloadAnimatedWebM(name, { copy, ratio, brand });                       // animated
```

---

## 5. Front-end flow & wireframes (described)

### 5.1 Where it slots into the current IA

Today: `AppShell` (sidebar: Dashboard · Start a post/Clips · Brands · Settings); a brand has
**Content / Brand / Insights** tabs. The intent bar becomes the **primary surface of the
Dashboard** and a persistent **command affordance** (a "⌘ Create with intent" bar pinned top of
Dashboard and reachable via a keyboard shortcut). It does **not** replace the existing tabs — it
sits *above* them as the new front door. Power users keep every existing path.

### 5.2 The intent bar (the MVP front door)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ◎  What are you trying to achieve?                              [🎙]  │   ← one input
│      e.g. "get more people playing Cwis Bob Dydd today"               │   ← rotating placeholder
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐               │
│  │  Text  │ │ Voice  │ │ Image  │ │  Clip  │ │  URL   │   modality    │   ← chips (Text default)
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘               │
│  brand: [Cwis Bob Dydd ▾]                              [ Continue → ]  │
└──────────────────────────────────────────────────────────────────────┘
```
- Voice: tap 🎙 → record → existing transcribe proxy → text fills the bar (with a "transcribed,
  edit me" affordance). Welsh+English auto.
- Calm, conversational, premium. Geist, violet accent, generous whitespace, `eng-rise` entrance.
  Feels like talking to a creative assistant, not filling a form.

### 5.3 Candidate picker (approval gate #1)

```
  I think you want to: spark a conversation about the Brexit anniversary.   ← goal + reasoning
  Here are three ways to do it:

  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
  │ ●  Quick quiz        │  │ ○  Poll              │  │ ○  Listicle carousel │
  │ 3-slide, app CTA     │  │ single still         │  │ 5-slide "what changed"│
  │ "drives replies and  │  │ "fastest, native     │  │ "depth, saves and     │
  │  app opens"  92%     │  │  IG sticker"  78%    │  │  shares"  74%         │
  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘
                                                   [ Make the quiz → ]
```
- 2-3 cards, each = format + one-line why + confidence. SegmentedControl/Panel primitives.
- This is the first hard human gate. Nothing is generated until a card is picked.

### 5.4 Clarify (only when blocking)

```
  One thing before I build it:
  Where's this going?   ( Instagram )  ( Facebook )  ( TikTok )      ← only if it changes the output
```
- Single question, inline, dismissible defaults. If `missingInfo` is empty/non-blocking, skip
  entirely (the vision: "ask only when necessary").

### 5.5 Review surface (approval gate #2)

```
┌── DRAFT ───────────────────────────┐   ┌── WHY ─────────────────────────────┐
│  [ rendered slide preview ]        │   │ I led with the question "Beth..." to│
│  ◂ slide 1 / 3 ▸                   │   │ pull replies, kept it to one line   │
│                                    │   │ for mobile, and used your gold + navy.│
│                                    │   │                                     │
│                                    │   │ Coach: ✓ legible ✓ safe-area  ⚠ add │
│                                    │   │ a CTA verb.  Score 84.              │
└────────────────────────────────────┘   ├── ALTERNATIVES ────────────────────┤
                                          │ ( A current ) ( B punchier hook )  │
                                          │ ( C bilingual )                    │
  [ Approve & export ]  [ Open in editor ]  [ Reject ]   [ 🇨🇾 flag Welsh for review ]
```
- Draft + reasoning + Option A/B/C + Coach check. The three actions map to the three approval
  outcomes (approve / edit / reject) and each writes an `ApprovalSignal`.
- "Open in editor" hands off to the **existing** `GraphicEditor` — the orchestrator created a real
  `GeneratedGraphic`, so power-user editing is free.
- "Flag Welsh for review" sets a flag on the draft; we never present unreviewed Welsh as final.

### 5.6 Motion & feel

Reuse the design system's motion tokens (`cubic-bezier(0.22,1,0.36,1)`, 120/200/300ms,
`eng-rise`, reduced-motion-safe). The waiting states matter most (perceived performance): show a
**streamed, narrated** progress line during detect/plan/generate ("understanding… → drafting three
options… → rendering…") rather than a dead spinner. Optimistic candidate cards skeleton in.

---

## 6. User journeys

**J1 — "More people playing Cwis today" (voice, Welsh-first).**
Aled taps 🎙, says *"Dwi isio i fwy o bobl chwarae'r cwis heddiw."* → transcribed → intent-detect
returns goal=drive plays, candidates=[quiz, poll, animated CTA]. He picks the animated CTA →
plan needs only a headline (inferable) → generates an `animated-caption` graphic → review shows the
WebM loop + reasoning + A/B/C hooks + a Welsh-review flag. He tweaks hook B, approves, exports the
WebM. One `ApprovalSignal{decision:'edited', chosenOptionId:'B'}` nudges the voice profile toward
his punchier phrasing.

**J2 — "Ten years since Brexit" (text).**
Types the sentence → goal=spark conversation, candidates=[quiz, poll, listicle]. Picks listicle →
plan asks the one blocking question (Instagram vs Facebook, different ratio) → generates a
`universal-listicle` carousel with AI copy via `social-copy` → review → approve → ZIP export.

**J3 — "Turn this talk into clips" (video URL).**
Drops a video URL → modality=video → orchestrator routes to the **video agent**: transcribe →
`clip-analysis` → candidates are the top clips, not formats. Picks a clip → plan adds burn-in
captions → render via FFmpeg worker → review the MP4 → approve → download. (Publishing to
social-desk is offered as a *separate* approved step, never automatic.)

**J4 — Power-user escape hatch.**
Anyone who wants the old flow ignores the bar and uses Content/Brand/Insights exactly as today.
The reframe is additive.

---

## 7. Reuse map (build vs net-new)

| Capability | Source | Status |
|---|---|---|
| Voice → text (Welsh+English) | `/api/postio/transcribe` (Capsiynau v1) | **reuse** |
| Gated AI route + structured JSON + budgeting | `/api/ai/social` + `requireGate` | **reuse** |
| Intent detection | new `task:'intent-detect'` | **NEW (prompt only)** |
| Planning | new `task:'intent-plan'` | **NEW (prompt only)** |
| Creative copy/captions/variants | `social-copy`/`captions`/`autofill`/`improve` | **reuse** |
| Strategy / scroll-post | `coach-strategy` | **reuse** |
| Graphics generation (stills/carousels/freeform) | template registry + store + `exportZip` | **reuse** |
| Animated output | `downloadAnimatedWebM` | **reuse** |
| Clips (find/cut/burn-in) | `Pipeline.tsx` + `clip-analysis` + `/api/postio/render` | **reuse** |
| Review scoring | `preExportCheck` + `runPostAnalysis` (Coach) | **reuse** |
| Brand-voice learning | `VoiceProfile` + `deriveVoiceProfile`/`refineVoiceProfile` | **reuse** |
| Orchestrator state machine | `lib/voiceai/orchestrator.ts` | **NEW (glue)** |
| 4 new collections + types | `cg.v1.intent*` / `reviewDrafts` / `approvalSignals` | **NEW (data)** |
| Intent bar + candidate/review UI | `components/voiceai/*` | **NEW (UI)** |
| Distribution (publish + performance) | social-desk (Meta) | **reuse, later, human-approved** |

**Net-new surface area: two AI prompts, one state machine, four data collections, three screens.**
Everything that actually makes a deliverable already exists.

---

## 8. Security model

- **AI is gated.** Both new tasks ride the existing `requireGate()` HMAC cookie + `ANTHROPIC_API_KEY`.
  No new public surface, no new secret. Same 401/503 behaviour.
- **Job tokens.** Transcription/render polling already uses signed job tokens (`signJobToken` /
  `verifyJobToken`) to prevent IDOR; the orchestrator reuses them unchanged.
- **URL inputs are fetched server-side, allow-listed, and size/timeout-capped** (SSRF guard): the
  client never makes the orchestrator hit arbitrary internal hosts; a thin `/api/postio/fetch-url`
  (gated) resolves public URLs only, strips redirects to private ranges. (MVP can defer URL input
  entirely and ship text+voice first — see §9.)
- **No secrets client-side.** All keys stay server-side in the route; the orchestrator only ever
  sees gated proxy responses.
- **Cost guard.** Reuse Coach's daily-cap pattern (per-brand call ceiling, deterministic fallback)
  so the intent loop can't run up an unbounded Anthropic bill; intent-detect/plan are cheap
  (`sonnet-4-6`, ≤2.4k tokens) but still capped.
- **Rate-limiting note.** The intent bar is an unauthenticated-feeling fast path; it must sit
  behind the gate AND a per-session throttle, because it spends model tokens. Flagged for the
  security audit before any public exposure.

## 9 & 10 below: approval safety + MVP roadmap.

## 10. Guardrails (hard rules baked into the design)

- **Human-approval-before-publish is structural, not a setting.** There is no code path from
  generation to social-desk/Meta that does not pass through a `ReviewDraft.status='approved'` set by
  a human action. Export (download) is the only automatic terminal; publishing is always a separate,
  per-item, explicitly-approved step.
- **No live social scraping. No auto-posting. No auto-sending.** Research uses model knowledge +
  user-supplied material only in the MVP.
- **Welsh integrity.** Machine-drafted Welsh is flagged (`needsWelshReview`) and never presented as
  final; a native-review pass is a release gate, mirroring every other Postio Welsh surface.
- **Copy rules.** No em-dashes anywhere (including comments); dates dd.mm.yyyy; never "Gog".
- **Additive only.** The reframe must not break the template/animation/clip/Coach systems or the
  Content/Brand/Insights + Settings UX. Power-user paths stay intact.
- **Worktree + no auto-deploy.** Work in the isolated `buan/voice-ai` worktree; never push to `main`
  without an explicit ask (merge = Vercel prod build = cost).

---

## 9. Phased MVP roadmap

The rule: **thin end-to-end slice first, then widen.** Each milestone is shippable and leaves the
app working. Ship M-V1 and stop for review before M-V2.

**M-V0 — Plan (this document).** Architecture + roadmap. → *review gate (you are here).*

**M-V1 — The thin intent slice (text → quiz/post/carousel → review).** *Smallest proof.*
- New `task:'intent-detect'` + `task:'intent-plan'` on the gated route.
- `lib/voiceai/orchestrator.ts` state machine + the 4 `cg.v1.*` collections + types.
- `components/voiceai/IntentBar.tsx` (text only), `CandidatePicker.tsx`, `ReviewDraft.tsx`.
- Routes to **one** existing generator path first (start with `cwis-quiz` + `universal-listicle`
  + a freeform still), shows the draft in the review surface, "Approve & export" downloads,
  "Open in editor" hands off to `GraphicEditor`. Writes `ApprovalSignal`.
- Bilingual EN+CY strings (Welsh flagged for review). Light+dark. `tsc` clean, build green.
- **Out of scope for M-V1:** voice, image, URL, clips, AI review scoring, learning loop applied.

**M-V2 — Voice input + Coach review.**
- Wire 🎙 → existing transcribe proxy. Add `preExportCheck` to the review surface (instant,
  deterministic) and optional `runPostAnalysis` score.
- Add Option A/B/C alternatives (a second `social-copy`/`improve` pass).

**M-V3 — The learning loop applied.**
- `ApprovalSignal` history feeds `refineVoiceProfile`; intent-detect/plan receive the voice summary
  so tone/format preferences actually shift. Show a "your voice" card.

**M-V4 — Video intent (clips).**
- Route video-modality inputs through the clip pipeline (transcribe → `clip-analysis` → render).
  Candidates become clips. MP4 review + export.

**M-V5 — Image + URL inputs.**
- Image → `template-from-image` as a candidate source. URL → gated, SSRF-guarded fetch → intent.

**M-V6 — Backend (M0 alignment).**
- Four `socialdesk.cg_*` tables; orchestrator optionally runs as a server job; RLS when auth lands.

---

## 11. Future roadmap (beyond MVP)

- **Producer mode** — multi-asset campaigns from one intent ("a week of Brexit-anniversary posts"):
  the planning agent emits a content calendar (reuse `coach-strategy thirty_day_plan`) and the
  orchestrator batches drafts, each still individually approved.
- **Real research agent** — opt-in, gated, source-cited context gathering (still no auto-publish).
- **Welsh voiceover / audiograms** — Llais `/v1/speak` on approved clips.
- **Distribution loop** — approved assets → social-desk publish → performance back into
  `PerformanceEntry` → recommendations into the next intent. Closes the create→measure→improve loop.
- **Org rules engine** — codify "Welsh-first / bilingual / formal / casual" as brand policies the
  planning agent must honour, learned from `ApprovalSignal` patterns.
- **Multilingual** — extend beyond EN+CY to any language the speech + translation models support.

---

## 12. Open questions for review

1. **Front door vs section?** Intent bar as the Dashboard's primary surface (recommended) vs a
   new "Voice AI" tab alongside Content/Brand/Insights. I've planned the former (additive, power
   paths intact). Confirm.
2. **M-V1 generator set** — start with `cwis-quiz` + `universal-listicle` + one freeform still?
   Or a different first trio?
3. **URL input** — defer to M-V5 (recommended; SSRF surface) or want it in the thin slice?
4. **Model tier** — `sonnet-4-6` for intent+plan (recommended: fast, cheap). Reserve `opus-4-8`
   for a future "producer mode" planner only?
5. **Brand requirement** — does the intent bar require a selected brand up front, or can it run
   brand-less and attach one at review? (I've assumed brand-first.)
```
