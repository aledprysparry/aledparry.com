# Postio Phase 2 — Video + Animated Captions (technical plan)

**Rule honoured throughout:** the existing stills system is additive-only. Nothing below
edits the stills render/template/export pipeline. Video lives in new modules behind a new
route + feature flag.

---

## 1. Audit of the existing stills system

The engine (`components/demos/engine`, mounted at `/app/carousel`) is a **client-only**
React-Router SPA. Stills are drawn on a `<canvas>` and exported in-browser. No server is
in the path today.

| Concern | Where it lives | Notes |
|---|---|---|
| Canvas drawing | `lib/canvas/CanvasRenderer.ts` | fraction-based `drawText/drawRect/drawImage`; W/H |
| Ratio framing | `lib/carousel/framedRenderer.ts` | maps the 4:5 composition onto any ratio |
| Brand paint | `lib/carousel/brandPaint.ts`, `lib/canvas/brandTokens.ts` | palette, fonts, logo, bg, shadows |
| Template kinds | `lib/templates/registry.ts` | each kind = `{ slides: SlideDef[], copyFields, defaultCopy, editor }` |
| Stills/carousel kinds | `lib/carousel/{scoreboard,template}.ts` | `SlideDef.draw(r, props)` |
| Freeform editor | `lib/freeform/*` | element-based canvas |
| Platform sizes | `lib/platforms/presets.ts` | per-platform W/H + safe areas |
| Export | `lib/carousel/exportCarousel.ts` | canvas → PNG/JPEG blob, ZIP via JSZip |
| Data model | `lib/model/types.ts` | `Brand`, `BrandAsset` (AssetType already incl. `video`/`gif`), `Template` (TemplateType incl. `'sequence'`), `GeneratedGraphic` |
| Persistence | `lib/store/StoreProvider.tsx` + `persist.ts` + `assetStore.ts` | localStorage + IndexedDB (asset blobs) |
| Dormant backend | `lib/store/supabaseClient.ts`, `supabaseSync.ts` | **already scaffolded** — the graduation hook |

**Conclusion:** stills are self-contained and safe to extend. The model already half-anticipates
this (`AssetType` has `video`/`gif`; `TemplateType` has `'sequence'`; a Supabase adapter exists).

---

## 2. The architecture decision (and the honest constraint)

**Spine = the Asset model.** Add a single `kind` discriminator that selects the engine:

```
AssetKind = 'image' | 'carousel' | 'animated' | 'video' | 'captioned-video'
```

Journey stays one flow for all kinds: **Create Asset → Choose Kind → Add Content → Generate → Edit → Preview → Export.**
Existing stills map onto `image`/`carousel` with zero behaviour change.

**The constraint to be honest about:** stills are client-only, but video is not.

- `animated` (looping caption/text posts) **can** render client-side by reusing the existing
  canvas pipeline + `MediaRecorder(canvas.captureStream())` → WebM. **Zero backend.**
- `video` / `captioned-video` (upload, transcription, clip analysis, FFmpeg cut, burnt-in MP4)
  **cannot** run on the client or on Vercel/Edge. They need: object storage, the **Capsiynau API**
  for transcription, an AI clip-analysis call, and an **FFmpeg worker** (the Capsiynau/Railway
  pattern). This is the engine "graduating" onto a real backend — reuse the **social-desk**
  stack (Supabase auth/storage/RLS) + Capsiynau's worker, don't reinvent.

So Phase 2 splits cleanly into **2a (no backend, ships fast)** and **2b (backend)**.

---

## 3. Schema / model changes

Additive only.

- `GeneratedGraphic`: add `kind: AssetKind` (default `'image'`/`'carousel'` for existing rows — a
  one-time migration like the master-template re-link, defaulting by template type).
- New `VideoAsset` (2b): `{ id, brandId, sourceUrl|storagePath, mime, duration, width, height, transcriptId?, status }`.
- New `VideoAnalysis` + `ClipSuggestion` (matches the JSON the AI returns):
  `ClipSuggestion = { startTime, endTime, durationSeconds, title, hook, reason, caption, platforms[], aspectRatio, score }`.
- `Template`: `TemplateType` already has `'sequence'`; add caption/overlay template subkinds via the
  existing `layout`/`seedElements` fields — **no change to still-template logic**.
- Persistence: 2a stays in the current store; 2b activates `supabaseSync.ts` (the dormant adapter)
  so video assets/analyses live server-side. Stills can keep working from localStorage during the
  transition (dual-mode).

---

## 4. File / component structure (new only — stills files untouched)

```
lib/
  asset/assetKind.ts            # AssetKind enum + helpers (which engine, which export)
  video/captionRenderer.ts      # reuses CanvasRenderer to draw caption frames
  video/animatedExport.ts       # canvas.captureStream → WebM (2a)
  video/clipAnalysis.ts         # AI clip-suggestion call (2b)
  intelligence/capsiynau.ts     # thin client for Capsiynau transcription/caption API (2b)
  video/ffmpeg.ts               # worker client: cut, burn-in, MP4 (2b, calls the worker)
components/
  asset/AssetKindChooser.tsx    # the Create-Post kind picker
  video/VideoUpload.tsx         # file upload / paste link
  video/TranscriptView.tsx
  video/ClipSuggestionCard.tsx
  video/CaptionStylePanel.tsx   # presets, brand colour, font, position, safe-area
  video/MotionPreview.tsx
pages/
  CreateAsset.tsx               # extends/wraps the existing create flow with the kind chooser
  VideoStudio.tsx               # new route /app/carousel/video (feature-flagged)
```

Route added in `EngineApp.tsx`; gated by a `POSTIO_VIDEO` flag (env or store toggle).

---

## 5. Reusable existing code (the leverage)

- **`CanvasRenderer` + `brandPaint` + `framedRenderer`** → render animated caption frames and
  burnt-in overlays with the *same* drawing code as stills. This is the big win: captions on video
  are "a still, per frame."
- **`platforms/presets.ts`** → 9:16 / 1:1 / 16:9 sizes + safe areas apply directly to video export.
- **`exportCarousel.ts`** patterns → extend for an MP4/WebM export path (new function, same shape).
- **`templates/registry.ts`** → add caption/overlay/lower-third/end-card kinds alongside existing
  ones (additive map entries).
- **`store/supabaseSync.ts`** → the graduation backend, already scaffolded.
- **Capsiynau** → transcription, Welsh/English captions, SRT/VTT, burn-in. Call it; don't rebuild.

---

## 6. New components / services

- AssetKind chooser + the unified Create flow.
- `capsiynau.ts` intelligence client (transcribe → transcript + segments).
- `clipAnalysis.ts` (AI: transcript → ranked `ClipSuggestion[]`, structured JSON only).
- Caption renderer (canvas frames) + animated WebM exporter (2a) and FFmpeg worker client (2b).
- Video Studio UI (upload, transcript, suggestion cards, caption-style panel, preview).

---

## 7. Safe implementation sequence

**Phase 2a — no backend, additive, ships fast**
1. `AssetKind` + chooser in the create flow (existing kinds default-map; stills behaviour unchanged).
2. `animated` kind: looping caption/text post rendered via existing canvas → **WebM export**
   (`MediaRecorder`). First video-ish output with zero infra.
3. Caption-style presets (brand colour/font/position/safe-area) reusing `brandPaint`.

**Phase 2b — backend (engine graduates; reuse social-desk + Capsiynau patterns)**
4. Stand up Supabase (auth/storage) via `supabaseSync.ts`; dual-mode so stills keep working.
5. `VideoUpload` → storage; create `VideoAsset`.
6. `capsiynau.ts` → transcript.
7. `clipAnalysis.ts` → `ClipSuggestion[]` cards (read-only first — highest value, lowest risk).
8. Manual in/out adjust + **FFmpeg worker** clip export (MP4).
9. Burnt-in captions (worker) + animated-caption MP4.

Each step is a separate PR; stills pipeline is never touched.

---

## 8. Testing checklist — prove stills still work

Run after **every** Phase-2 change:

- [ ] `next build` clean.
- [ ] Existing carousel + scoreboard graphics render identically (pixel-spot-check cover/list/winner/cta + scoreboard footer).
- [ ] PNG export, JPEG export, ZIP export all still produce files.
- [ ] All 5 ratios still render (FramedRenderer unaffected).
- [ ] Master-template inheritance + copyOverrides still resolve.
- [ ] Existing graphics load from localStorage unchanged (the `kind` migration defaults correctly).
- [ ] Freeform editor unaffected.
- [ ] No new console errors on the stills routes.
- [ ] Video route is behind the flag — off = engine looks/behaves exactly as today.

---

## First slice recommendation
Ship **2a step 1–2** first: the Asset-kind chooser + an `animated` looping/caption post exported
as WebM, reusing the canvas pipeline. It's additive, needs no backend, proves the Asset model, and
gives a real "motion" output. The heavy video intelligence (2b) starts once the Supabase backend is
live — and that's the same stack social-desk already uses.
```
