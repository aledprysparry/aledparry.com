# Postio — Full Audit & Detailed Build Plan

*Supersedes the Phase-2 sketch. Postio = a Welsh-first social content workspace: Design engine
(stills, built) + Video engine (new) + Intelligence engine (reuse Capsiynau/Llais). Distribution
is social-desk (built). UK English.*

---

## PART A — AUDIT (current state across the ecosystem)

The most important audit result: **Postio is ~80% integration of things you already own, ~20%
genuinely new.** The new 20% is one thing — a video worker that cuts clips and burns in captions.

### A1. Design engine — the stills system *(built; client-only)*
`aledparry.com/components/demos/engine`, mounted at `/app/carousel`. React-Router SPA, **no backend**.

- Canvas: `lib/canvas/CanvasRenderer.ts` (fraction-based `drawText/drawRect/drawImage`); `lib/carousel/framedRenderer.ts` (ratio framing); `lib/carousel/brandPaint.ts` (palette/fonts/logo/bg).
- Templates: `lib/templates/registry.ts` — kinds = `{ slides: SlideDef[], copyFields, defaultCopy, editor }`; carousel + scoreboard + freeform.
- Export: `lib/carousel/exportCarousel.ts` — canvas → PNG/JPEG/ZIP.
- Model: `lib/model/types.ts` — `AssetType` **already includes `video`/`gif`**; `TemplateType` **already includes `'sequence'`**; `Brand`/`Template`/`GeneratedGraphic`.
- Persistence: `lib/store/StoreProvider.tsx` (localStorage + IndexedDB) **+ dormant `lib/store/supabaseSync.ts` + `supabaseClient.ts`** — the graduation hook.
- **Verdict:** the canvas + brand-paint + export are the reusable heart. `CanvasRenderer` will render caption frames for video (a caption is "a still per frame"). Stills are self-contained → safe to extend. **Must graduate off localStorage** to add video.

### A2. social-desk — the backend pattern + distribution half *(built today, M1–M3)*
`~/Documents/GitHub/social-desk` (private GitHub). Next 16 + Supabase (auth, RLS, Storage, AES-GCM token vault), Meta publish (FB/IG), approval workflow, AI captions.
- **Verdict:** this *is* Postio's backend stack — reuse the auth/RLS/storage/env patterns verbatim. Strategically it's the **distribution + measurement** half: Postio creates the asset → social-desk publishes it + pulls performance → performance feeds Postio's recommendations. Do **not** duplicate brands/captions across both; share one Supabase.

### A3. Capsiynau — the Intelligence engine *(reuse as an API)*
`~/Documents/GitHub/Capsiynau_V2_ClaudeAI`. Welsh+English ASR. **Five endpoints callable today** (auth = API key, `Authorization: Bearer` / `X-API-Key`, rate-limited):

| Endpoint | Use |
|---|---|
| `POST /api/v1/transcribe` | submit transcription job (Whisper <24MB, AssemblyAI ≥24MB, Techiaith Welsh) → `{jobId}` |
| `GET /api/v1/status?jobId=` | poll progress |
| `GET /api/v1/export?projectId=&format=srt\|vtt\|ttml\|ebutt\|json` | captions out |
| `GET /api/upload/presigned` | presigned R2 PUT for media |
| `GET /api/media/{fileId}` | auth'd media fetch (1h presigned GET) |

- Worker: **Upstash Redis queue (BRPOP) + FFmpeg** in a Railway Node container. Does `extractMonoAudio()`, denoise, quality scoring — **audio only**.
- Storage: Cloudflare **R2** (presigned upload + secure proxy).
- Transcript segment shape: `{ start_time, end_time, text, confidence, speaker, words[] }`.
- **GAPS (not in Capsiynau):** ❌ video clip cutting · ❌ caption burn-in to video · ❌ diarisation.
- **Verdict:** transcription + caption export + R2 upload/serve are reuse-as-API, zero rebuild. The **worker pattern (Redis + FFmpeg + R2) is the template** for Postio's new video worker.

### A4. PMA — source assets *(integrate via REST)*
`~/Documents/GitHub/PMA`. Production-media app, R2 storage, `MediaAsset` model (`type/url/duration/mime`), and **already has a media→Capsiynau transcription pipeline**. REST + JWT.
- **Verdict:** a source of rushes/finished videos Postio can pull; can store finished social cuts back as PMA `Deliverable`s.

### A5. Llais — Welsh voiceover *(reuse as an API)*
`~/Documents/GitHub/Llais`. Welsh TTS `POST /v1/speak` (Nia/Aled/Bangor voices), optional translate-before-synthesis via Capsiynau, Redis+R2 cache, origin-bound API key, drop-in widget.
- **Verdict:** auto Welsh voiceovers / audiograms for clips, no backend work. Phase 3+ nicety.

---

## PART B — TARGET ARCHITECTURE

### B1. The spine: one `Asset` model
```
AssetKind = 'image' | 'carousel' | 'animated' | 'video' | 'captioned-video'
Journey (all kinds): Create Asset → Add Content → Generate → Edit → Preview → Export
```
Existing stills map onto `image`/`carousel` unchanged. `kind` selects the engine.

### B2. Where every capability comes from (build vs reuse)
| Capability | Source | Type |
|---|---|---|
| Graphics / carousels / brand kits / exports | Design engine (built) | **reuse** |
| Auth / DB / storage / RLS backend | social-desk pattern + Supabase | **reuse pattern** |
| Transcription (Welsh+English) | Capsiynau `POST /api/v1/transcribe` | **API** |
| Captions SRT/VTT | Capsiynau `GET /api/v1/export` | **API** |
| Media upload/serve | Capsiynau presigned R2 / own R2 | **API/reuse** |
| Source rushes | PMA REST | **API** |
| Welsh voiceover | Llais `/v1/speak` | **API** |
| Caption *frame* rendering | Design engine `CanvasRenderer` | **reuse** |
| Clip analysis (best moments) | new AI call (Claude), transcript→JSON | **BUILD (small)** |
| **Video clip cut + caption burn-in / animated MP4** | **new FFmpeg worker** | **BUILD (the one big new thing)** |
| Publishing + performance | social-desk | **reuse** |

### B3. The one new piece of infra
A **video worker** on the Capsiynau/Railway pattern (Redis queue + FFmpeg + R2). It:
- cuts a clip (`ffmpeg -ss/-to`),
- burns in captions (`-vf subtitles=` from Capsiynau's SRT, or overlays **animated** caption frames rendered by `CanvasRenderer`),
- outputs platform-ready MP4 (9:16 / 1:1 / 16:9), writes back to R2.
This is the only genuinely novel build. It extends a worker pattern that already runs FFmpeg in production.

---

## PART C — SCHEMA (additive; on the graduated Supabase backend)

Reuse social-desk's RLS+grants conventions. New/extended tables:
- `assets` — `{ id, owner_id, brand_id, kind, project_id, source_url|storage_path, status, created_at }` (one table, all kinds; existing graphics get `kind` via a default-by-template migration, like the master re-link).
- `briefs` — `{ project_id, raw_text, objective, audience, tone, key_message, cta, hashtags }`.
- `video_analyses` — `{ asset_id, transcript_ref, capsiynau_job_id, summary, status }`.
- `clip_suggestions` — `{ video_analysis_id, start_time, end_time, duration_s, title, hook, reason, caption, platforms[], aspect_ratio, score }`.
- `render_jobs` — `{ asset_id, type: cut|burnin|animated, params jsonb, status, output_url, error }` (the worker queue mirror).
- Stills keep working from localStorage during transition (dual-mode read).

---

## PART D — DETAILED BUILD SEQUENCE (milestones, each a shippable PR set)

**M0 — Backend graduation** *(reuse social-desk stack)*
Stand up Supabase (auth/storage) for Postio via the dormant `supabaseSync.ts`; one shared Supabase with social-desk. Dual-mode so stills still load from localStorage. Decide repo home (see open decisions).

**M1 — Asset model + Create flow** *(additive; stills untouched)*
`AssetKind` + `AssetKindChooser` in the create flow; existing kinds default-map to `image`/`carousel`. Migration adds `kind`. Stills regression checklist must pass.

**M2a — Animated captions, client-side** *(no worker, ships fast)*
`animated` kind: looping caption/text post rendered via `CanvasRenderer` → WebM (`MediaRecorder(canvas.captureStream())`). Brand-styled caption presets reusing `brandPaint`. First motion output, zero infra.

**M2b — Video ingest + intelligence** *(Capsiynau APIs)*
Upload (presigned R2) or paste link / pull from PMA → create `video` Asset → `POST /api/v1/transcribe` → poll → store transcript → **clip-analysis AI call** → `clip_suggestions` cards (read-only first: highest value, lowest risk).

**M3 — Video worker: cut + burn-in** *(the new infra)*
Railway worker (Redis + FFmpeg + R2, cloned from Capsiynau's pattern): cut selected clip, burn Capsiynau SRT, export MP4 in chosen ratio. Manual in/out trim UI.

**M4 — Animated caption MP4** *(combine M2a + M3)*
Render caption frames with `CanvasRenderer`, composite over the cut clip via FFmpeg → branded animated-caption MP4 (Reels/TikTok/Shorts).

**M5 — Distribution loop** *(reuse social-desk)*
Hand the finished Asset to social-desk for publish/schedule; pull Meta insights back to rank future `clip_suggestions`. Optional: Llais Welsh voiceover; PMA Deliverable write-back.

---

## PART E — RISKS / COST / SAFETY
- **Worker compute + R2 egress + AI tokens** are the real running costs (video is heavy). Gate by plan; cap minutes (Capsiynau already has a monthly-cap pattern to copy).
- **Serverless timeouts**: all video work is worker/queue, never a Vercel function. Long IG video already needs polling.
- **Stills regression** after every change: `next build` clean · carousel+scoreboard render identically · PNG/JPEG/ZIP export · 5 ratios · master-template inheritance · localStorage load · freeform editor · video behind a flag (off = today's behaviour).
- **No fabricated capability**: where a piece needs Meta App Review / a worker not yet deployed, show a clear setup state (the pattern already used).

## PART F — OPEN DECISIONS (need your call before M0)
1. **Home**: graduate the engine out of `/app/carousel` into a standalone Postio app (reusing social-desk's stack), or keep it in aledparry.com and add a backend? Standalone recommended once video/backend is involved.
2. **One Supabase or two**: share social-desk's Supabase (clean create→publish→measure loop, shared brands) — recommended — or keep separate and hand off by export.
3. **Postio ↔ social-desk boundary**: confirm Postio = create, social-desk = distribute/measure, no duplicated brands/captions.

> Bottom line: the build is mostly *wiring assets you already own* around **one new video worker**. Start M2a (no infra) in parallel with the M0 backend decision.
