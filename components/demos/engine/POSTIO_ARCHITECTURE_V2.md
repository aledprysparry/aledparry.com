# Postio — Architecture & Workflow Refactor (proposal, no code yet)

Goal: collapse Postio from "several tools side by side" into **one pipeline + one
template model**. The functionality is already strong; the *seams* are the problem.

---

## 1. The fragmentation, concretely (current code)

| Fragment | Where | Problem |
|---|---|---|
| **3 editors** | `GraphicEditor` dispatches `editor: 'carousel' | 'freeform' | 'animated'` → 3 separate components (carousel pipeline, `FreeformEditor`, `AnimatedEditor`) | "Still" and "animated" are literally different systems. Issue 1. |
| **Kind conflates type + editor** | `registry.ts`: a kind has both `type` (carousel/still/sequence) *and* `editor` | Output format (still vs motion) is baked into the template identity, not a switch. |
| **Clip Finder is an island** | `/clips` (`ClipFinder.tsx`), standalone, brand-less | The most valuable feature (AI clipping) isn't connected to projects, briefs, brands, or export. Issue 3. |
| **No project/brief/media layer** | model is `Brand → Template/Graphic/Asset/Folder` | There's nowhere for "a brief + linked footage + the clips it produced" to live. |
| **Export is per-editor** | carousel exports ZIP/PNG; animated exports WebM; clips have no export | No single "Export" step. |

**Net:** the user must already understand *which* sub-tool they're in. That's the coherence gap.

---

## 2. Target model — ONE template, output modes

Collapse `type` + `editor` into a single **Template** with an **output mode**:

```
Template {
  layout, branding, typography, palette,
  assetPlaceholders, dataFields,
  animation?            // optional; absence = still-only
  supports: { still: bool, animated: bool }
}
OutputMode = 'still' | 'animated'
```

- A template is **the same object** whether exported as a JPG or an MP4. "Quote card" → Still (IG image) *or* Animated (text fade-in + logo move). Issue 1 solved.
- The current 3 editors become **one editor with tabs**: **Design · Animation · Export**. A still template just leaves Animation untouched; the Export tab offers PNG/JPG and (when `supports.animated`) MP4/MOV.
- Migration: `editor` becomes an internal *renderer* detail (canvas vs element vs frame-loop), not a user-facing fork. The existing `animated-caption` kind becomes "any template, animated mode"; `freeform`/`carousel` keep their renderers but present as one editor.

This reuses everything already built — `CanvasRenderer`/`brandPaint` already draw both stills and animation frames (M2a proved "a caption is a still per frame"). The unification is mostly **UI + model**, not new rendering.

---

## 3. Target pipeline — ONE journey

```
Project → Brief → Media → AI Analysis → Suggested Clips → Edit → Brand/Template → Export
```

New top-level entity that everything hangs off:

```
Project { kind: 'social-post' | 'campaign' | 'series', brand, brief, media[], analyses[], outputs[] }
Brief   { source: 'written' | 'pdf' | 'docx' | 'txt', objective, audience, platform, tone, cta, raw }
MediaRef { kind: 'linked-video' | 'image' | 'template', ref, label }   // see §4 — reference, never hosted
VideoAnalysis { mediaRef, transcript, summary }
ClipSuggestion { start, end, reason, hook, caption, platforms[], score, status: accepted|adjusted|rejected }
```

- The **Clip Finder stops being a page** and becomes Steps 4–5 *inside a project*. Its AI (`clip-analysis`) and the Capsiynau transcription wiring move under the project.
- "Generate assets" (Step 7) = apply a **template** (the unified model) to an accepted clip → Reel / Story / Square / Carousel / Short, each a `supports`-checked output mode. The clip→caption loop already built is the seed of this.
- Brand/Template/Graphic stay — they become the *creation* substrate the pipeline targets, not parallel tools.

---

## 4. Media = referenced, never hosted (Premiere model)

Postio must **not** become media storage. Issue 2.

- `MediaRef` stores a **pointer**, not bytes: a File System Access API handle (local/NAS/shared drive), or a URL the analysis worker can reach (production storage). Postio holds the reference + derived lightweight artefacts (transcript, thumbnails, the cut clip output) — not the source footage.
- Transcription already takes a **URL** (`/api/postio/transcribe` → Capsiynau), which fits. For *local* files, the browser can't hand a path to a server: two honest paths — (a) the FFmpeg worker runs where the footage lives (NAS/production storage) and resolves the reference; or (b) client-side audio extraction for transcription only. The model stays "reference + derived artefacts."
- Storage cost stays near-zero: only captions, clip outputs and graphics live in Supabase/Storage; never the rushes.

---

## 5. One export system

A single exporter keyed on (template, output mode):
- **Still** → client canvas → PNG/JPG/ZIP (exists: `exportCarousel`).
- **Animated / clip** → FFmpeg **worker** → MP4/MOV (the one piece of real new infra, M3). WebM client export (M2a) stays as the no-worker fallback.
One "Export" tab/step, format list filtered by what the template + mode support.

---

## 6. What's reused vs genuinely new

| Reuse (do not rebuild) | New (this refactor) |
|---|---|
| `CanvasRenderer`, `brandPaint`, `FramedRenderer` | Unified `Template` model (merge type+editor → output modes) |
| Brand model, master/override copy, folders | `Project` / `Brief` / `MediaRef` layer + entities |
| `clip-analysis` AI + Capsiynau transcription wiring | One editor shell (Design/Animation/Export tabs) |
| Stills export pipeline, M2a WebM | One export entry point; FFmpeg worker (M3) |
| social-desk backend pattern + `socialdesk` schema | File System Access handles for local linking |

---

## 7. Phased refactor (non-breaking — current features keep working throughout)

- **R1 — Unify the template/editor model.** One editor shell with Design/Animation/Export tabs; `output mode` replaces the user-facing still/animated fork. Keep the three renderers under the hood. *Visible win, no new infra.*
- **R2 — Introduce Project + Brief + Media-link.** New entities + a Project surface; the dashboard becomes "Projects" with Brand as a setting. Brief write/upload (PDF/DOCX/TXT parse).
- **R3 — Fold Clip Finder into the project pipeline.** Steps 4–5 inside a project; wire transcription + clip-analysis there; clip→template→export.
- **R4 — One export system** (still client / animated worker). Stand up the FFmpeg worker.
- **Roadmap hooks (architecture only, build later):** subtitles (Capsiynau), animated caption styles, graphics overlays (lower-thirds/CTA/progress), AI social copy, thumbnails, the analytics feedback loop (social-desk insights → recommendations).

Each Rx is shippable on its own and leaves the app working.

---

## 8. Honest constraints
- R4's FFmpeg worker + true local-file linking (File System Access API / worker-on-storage) are real infrastructure — they can't be faked; sequence them last and stand up the worker deliberately.
- Backend (`socialdesk` schema) is live but env-pending; Projects/Briefs persist there once env is set.
- This is a **refactor for coherence**, not new features — the roadmap items stay *hooks* until the pipeline is solid.

## 9. Recommended first move
**R1** — unify the template model + editor shell. It's the highest-coherence-per-effort change, needs no backend, reuses all existing rendering, and directly kills the "still vs motion are different products" confusion (Issue 1). R2/R3 (the project pipeline) follow once the template model is one thing.
