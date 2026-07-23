# Postio – Campaign Microsites (technical spec, evaluation phase)

*Extends Postio from **content creation** into **campaign creation**: a brand launches an
interactive, browser-based social campaign (photo competition, selfie wall, community
challenge, "share your story") in minutes, then collects, moderates, curates and
repurposes the user-generated content (UGC) it gathers – all inside Postio. UK English.*

The strategic framing matches the rest of the Postio ecosystem: **this is ~80% wiring of
capabilities we already own, ~20% genuinely new.** The new 20% is one surface (a public,
unauthenticated, custom-domain-capable microsite + upload endpoint) plus one moderation
AI call. Everything else – Brand Brain, the canvas/brand-paint renderer, the gated AI
route pattern, R2 storage, the Coach analysis layer, social-desk distribution – is reuse.

---

## 1. Positioning (the recommendation, up front)

Campaign Microsites is a **core Postio capability, not a standalone product**. It extends
the workflow from *Create → Engage → Collect → Curate → Repurpose → Publish*:

- **Create** – the Campaign Builder is the existing brand/template authoring surface with a
  new output kind.
- **Engage / Collect** – the public microsite is the one new runtime; it feeds UGC back in.
- **Curate** – moderation + tagging reuse the Coach AI layer and the gated route pattern.
- **Repurpose** – collected UGC becomes source assets for the existing graphics/video engine.
- **Publish** – finished collages/reels hand off to social-desk exactly as today.

Do **not** build a parallel system. Every service below names the Postio thing it reuses.

---

## 2. The two surfaces (the architecture split that matters most)

Postio today is a **client-only React-Router SPA mounted at `/app/postio`, gated behind
`AppGate`** (`app/app/postio/[[...slug]]/page.tsx` → `@engine/EngineApp`). That is exactly
right for the **authoring** side of campaigns and wrong for the **public** side.

| | Builder (authoring) | Microsite (public runtime) |
|---|---|---|
| Who | Marketing manager, logged in | Anonymous member of the public |
| Auth | Behind `AppGate` (as today) | **None** – must work with zero login |
| Rendering | Client SPA (fine) | **Server-rendered**, SEO-indexable, fast first paint, OG tags |
| Where it lives | `EngineApp.tsx` route (new `campaigns` section) | **New Next route group**, not the SPA |
| Domain | `aledparry.com/app/postio` | `postia.co.uk/campaign/{brand}/{slug}`, `{brand}.postia.co.uk/{slug}`, or white-label `campaign.brand.co.uk` |

**The Builder is a reuse of the existing engine.** **The Microsite is the one genuinely new
front-end surface** and it cannot live inside the client-only SPA: public campaign pages must
be indexable, shareable (Open Graph / Twitter card previews), fast on a cold mobile
connection, and reachable on custom domains. Spec it as a **new Next App-Router route group**
(server components) – e.g. `app/(campaign)/c/[brand]/[slug]/page.tsx` – served publicly,
reading published campaign config from the backend and posting uploads to a signed endpoint.
Custom/white-label domains resolve to the same route group via middleware host-mapping.

Naming note: the brief says "Postia"; the product in this repo is **Postio**. Treat them as
the same product and keep the codebase name `Postio`.

---

## 3. What already exists to reuse (audit)

Grounded in `components/demos/engine` and the ecosystem audited in `POSTIO_BUILD_PLAN.md`.

| Capability the brief asks for | Where it already exists | Type |
|---|---|---|
| Branding: logo, colours, fonts, backgrounds | `Brand` / `BrandAsset` in `lib/model/types.ts`; `brandPaint.ts`, `brandTokens.ts` ("Brand Brain") | **reuse** |
| Branded landing page render (hero, palette, type) | `CanvasRenderer` + `brandPaint` + `framedRenderer` | **reuse** |
| Branded frames / overlays / stickers / badges | `BrandAsset` (`logo`/`background`/`image`), freeform `GraphicElement` overlays | **reuse** |
| Media upload + serve | Capsiynau presigned R2 (`GET /api/upload/presigned`, `GET /api/media/{fileId}`) | **API/reuse** |
| Auth / DB / storage / RLS backend | social-desk pattern + Supabase (dormant `supabaseSync.ts`) | **reuse pattern** |
| AI analysis / structured JSON out | gated `app/api/ai/social/route.ts` + `lib/postioGate.ts`, latest Claude | **reuse pattern** |
| Image understanding, tagging, scoring, highlights | Coach analysis layer (`PostAnalysis`, `AnalysisCategoryResult`, `AIRecommendation`) | **reuse pattern** |
| Auto-generated social content (carousel, album, reel, recap) | Design engine (stills) + video worker (M3, see build plan) | **reuse** |
| AI copywriting (captions, winner posts, press release) | Coach Strategy/Voice layer (`VoiceProfile`, `CoachBrief`, gated route) | **reuse pattern** |
| Publishing + performance loop | social-desk (`app/api/social/instagram/*`) | **reuse** |
| Bilingual EN/CY | `lib/i18n/strings.ts` + `I18nProvider` | **reuse** |
| Video campaigns (Phase 3) | video worker milestone (M3/M4 in build plan) | **reuse** |

**Genuinely new (the 20%):**

1. **Public microsite route group** (server-rendered, custom-domain-capable) – §2.
2. **Signed public upload endpoint** – anonymous, rate-limited, virus-scanned, writes to R2.
3. **One moderation AI call** – NSFW/violence/hate/quality classifier, reusing the gated route
   shape. (This is a new prompt + schema, not new infra.)
4. **Campaign + Submission data model** – additive tables (§5).
5. **Camera capture UX** – `getUserMedia` + `<canvas>` overlay preview, upload fallback (§6).
6. **QR generation** – a small utility (SVG/PNG), no infra.

Everything else is configuration and wiring of things Postio already does.

---

## 4. Campaign Service decomposition (mapped to reuse)

The brief's suggested architecture, annotated with what each sub-service actually is here:

```
Campaign Service
├── Campaign Builder      → new "campaigns" section in EngineApp (reuses Brand/Template/brandPaint)
├── Public Microsites     → NEW app/(campaign) route group (server-rendered, custom domains)
├── Upload Service        → NEW signed public endpoint → R2 (Capsiynau presigned pattern)
├── AI Moderation         → NEW gated route + prompt/schema (app/api/ai/social pattern)
├── AI Analysis           → reuse Coach analysis layer (tagging, understanding, scoring)
├── Gallery               → server-rendered read of approved submissions (public route group)
├── Analytics             → reuse Coach performance shapes + social-desk insights
├── QR Generator          → NEW small util (SVG/PNG)
├── Content Generator     → reuse Design engine + video worker (collages, reels, recap)
└── Publishing            → reuse social-desk
```

> The rule from `POSTIO_ARCHITECTURE_V2.md` holds: reuse Postio's auth, Brand Brain, media
> management and AI orchestration; avoid parallel systems.

---

## 5. Data model (additive, backend-ready)

Follows the existing conventions in `lib/model/types.ts`: stable string ids, `brandId` on
every record, ISO timestamps, no derived UI state baked in. Persists via the same Repository
pattern (localStorage today for authoring drafts; Supabase on graduation – the same shared
backend as social-desk / the video work).

```ts
export interface Campaign {
  id: ID;
  brandId: ID;                       // inherits Brand Brain (logo/colours/fonts/tone)
  name: string;                      // "Summer at the Beach"
  slug: string;                      // "summer2027" → /c/{brand}/summer2027
  status: 'draft' | 'live' | 'paused' | 'ended';
  submissionType: SubmissionType;    // photo | video | photo+caption | story | testimonial | audio
  description: RichText;             // rich text, images, video, rules, prize info
  countdownEndsAt?: ISODate;
  branding: {                        // resolved from Brand Brain, overridable per campaign
    logoAssetId?: ID; heroAssetId?: ID; backgroundAssetId?: ID;
    colours?: string[]; fonts?: string[];
  };
  frames: ID[];                      // BrandAsset ids: PNG/animated overlays, stickers, badges
  consent: ConsentConfig;            // §7
  gallery: GalleryConfig;            // §9 (can be disabled)
  captcha: 'off' | 'invisible' | 'challenge';
  languages: ('en' | 'cy')[];        // first-class EN/CY, future expansion
  domain?: string;                   // white-label host, e.g. campaign.brand.co.uk
  createdAt: ISODate; updatedAt: ISODate;
}

export type SubmissionType =
  | 'photo' | 'video' | 'photo-caption' | 'video-caption'
  | 'story' | 'testimonial' | 'audio';   // future-proof: extend the union

export interface Submission {
  id: ID;
  campaignId: ID;
  mediaStoragePath: string;          // R2 object (never inline bytes)
  mediaMime: string;
  thumbnailPath?: string;
  caption?: string;
  consent: {                         // captured values, GDPR audit trail
    terms: boolean; privacy: boolean; marketing: boolean; ageConfirmed: boolean;
    acceptedAt: ISODate; ipHash?: string; userAgent?: string;
  };
  moderation: ModerationResult;      // §8
  analysis?: SubmissionAnalysis;     // §8 (tags/objects/mood)
  state: 'pending' | 'approved' | 'rejected' | 'featured' | 'archived';
  createdAt: ISODate;
}

export interface ModerationResult {
  verdict: 'safe' | 'needs-review' | 'rejected';
  flags: string[];                   // nsfw | violence | hate | offensive | low-quality | duplicate | spam | low-res | blurry
  scores: Record<string, number>;    // 0-1 per flag
  isDuplicateOf?: ID;                // perceptual-hash match
  modelUsed: string;
  humanOverride?: { by: string; verdict: 'approved' | 'rejected'; at: ISODate };
}

export interface SubmissionAnalysis {  // reuses the Coach "structured JSON out" shape
  objects: string[]; activities: string[]; mood: string[]; colours: string[];
  location?: string; weather?: string; peopleCount?: number;
  brandVisible?: boolean; products?: string[];
  tags: string[];                    // flattened searchable metadata: beach, sunset, dog…
  modelUsed: string;
}
```

Supabase tables mirror these (RLS + grants from the social-desk convention): `campaigns`,
`submissions`, `moderation_results`, `submission_analyses`, plus `render_jobs` reused from the
video-worker plan for generated collages/reels. Existing brands/templates are untouched.

---

## 6. Camera + upload experience (the public capture flow)

Browser only, no app. "Should feel like Instagram, not a web form."

```
Open URL → Branded landing (server-rendered) → Capture/Upload → Preview (retake) →
Caption → Consent → Submit → Thank-you page
```

- **Capture:** `navigator.mediaDevices.getUserMedia({ video: { facingMode } })` on mobile and
  desktop webcam; **Upload** fallback (`<input type="file" accept="image/*,video/*" capture>`)
  when the camera is denied or on old browsers. Never require camera permission to participate.
- **Branded frame preview:** the selected campaign frame (a `BrandAsset` PNG/animated overlay)
  is composited over the live preview and the captured still on a `<canvas>` – the **same
  compositing model as `CanvasRenderer`/`brandPaint`**, so overlays render identically to the
  authoring engine. Frame is baked into the exported image on submit.
- **Client-side pre-flight:** downscale/re-encode before upload (bandwidth), read basic EXIF,
  cheap blur/resolution check to warn *before* the round-trip (never block – mirrors the
  AI-camera-features "never mandatory" rule).
- **Upload:** request a **signed R2 PUT** from the public upload endpoint (Capsiynau
  `GET /api/upload/presigned` pattern), PUT the media directly to R2, then POST the submission
  record (path + caption + consent) to the campaign endpoint. Rate-limited + CAPTCHA-gated per
  campaign config. Target: **public submission completed in under 60 seconds.**
- **AI camera assistance (framing, face-centring, exposure, smile/blur detection)** is a
  **Phase 3 optional layer** and always opt-in.

---

## 7. Consent + GDPR

Consent is captured per submission and stored as an audit trail (see `Submission.consent`):

- **Required:** Accept Terms, Accept Privacy Policy, Age confirmation.
- **Optional:** Marketing consent.
- Each toggle stored with `acceptedAt`, hashed IP + user-agent for provenance. Marketing
  consent gates whether the submitter is offered a Postio account / added to any list.
- Right-to-erasure: deleting a `Submission` removes the R2 object + derived thumbnails/tags;
  campaign export honours per-submission marketing consent. Full GDPR posture, bilingual T&Cs.

---

## 8. Moderation + analysis pipeline

Every upload is analysed. Two AI calls, both on the **gated `app/api/ai/social/route.ts`
pattern** (`requireGate`, `ANTHROPIC_API_KEY`, structured JSON out, latest Claude):

1. **Moderation** (new prompt + schema → `ModerationResult`): NSFW, violence, hate symbols,
   offensive gestures, poor quality, low resolution, blur, spam. **Duplicate detection** via a
   cheap perceptual hash computed on upload (compare within the campaign) – not an AI call.
   Verdict ∈ `safe | needs-review | rejected`. **Human override is always available** in the
   dashboard and is recorded on the record.
2. **Understanding + tagging** (reuses the Coach analysis shape → `SubmissionAnalysis`):
   objects, activities, mood, colours, location, weather, people count, brand visibility,
   products → a flattened `tags[]` for search/filter. No manual tagging.

Target from success metrics: **moderation accuracy > 95%**, flagged content resolved in
**< 2 minutes average**. Phase-1 ships with **manual** moderation (dashboard queue); the AI
moderation/tagging is **Phase 2** – the queue UI is identical, the AI just pre-sorts it.

---

## 9. Dashboard, gallery, curation, content generation

- **Campaign dashboard** – live metrics (submissions, unique users, approval/rejection rate,
  views, shares, CTR, conversion, source, device, daily growth). Reuses the Coach
  `PostPerformanceMetrics`/`PerformanceEntry` shapes; traffic/insight numbers come through the
  social-desk measurement half where a post has been published.
- **Submission management** – approve / reject / feature / download / archive / delete, with
  **bulk actions**. This is the manual-moderation surface in Phase 1.
- **Public gallery** (optional, per campaign, can be disabled) – server-rendered read of
  `approved`/`featured` submissions; newest / most-popular / staff-picks / random, with search
  + filtering over the tag metadata. Lives in the public route group (§2).
- **AI highlights** – "top 20", most-emotional, best-composition, funniest, most-colourful:
  a scoring/collection pass over `SubmissionAnalysis` via the gated route, producing saved
  collections (same pattern as Coach highlights).
- **AI social content** – once enough approved UGC exists: Instagram carousel / Facebook album
  / reel / stories / LinkedIn collage / recap video, generated by the **existing Design engine
  (stills) + video worker (M3/M4)**. Success metric: **≥ 50% of campaign assets reused** in
  AI-generated social content.
- **AI copywriting** – captions, winner announcements, reminders, thank-you posts, press
  releases, email copy – via the Coach Strategy/Voice layer (`VoiceProfile` in the brand's own
  voice), gated route, structured out. **Human approves every output** (house rule).
- **Automation** (Phase 3) – "every Friday generate a recap"; "when submissions > 100 create a
  reel" – trigger rules over the same generators.

---

## 10. QR, white-label, multi-language, accessibility, security

- **QR codes** – campaign / poster / table / event QR, downloadable **SVG + PNG**. Small new
  util, no infra; encodes the microsite URL.
- **White-label** – enterprise `campaign.brand.co.uk` resolves to the public route group via
  middleware host-mapping (`Campaign.domain`); Postio hosts, brand's domain in the bar.
- **Multi-language** – first-class **EN/CY**, future expansion. All public-facing copy flows
  through `lib/i18n/strings.ts` + `I18nProvider`; Welsh is machine-draft and **flagged for
  native review** (house rule), never confidently invented. A campaign declares its
  `languages[]`; the microsite offers a language switch.
- **Accessibility** – **WCAG AA minimum**: keyboard navigation, screen-reader labels, high
  contrast, captions for video. The engine already carries density/tap-target tokens
  (`--eng-ctl-min`, 44px coarse-pointer floor) and reduced-motion handling – carry them into the
  microsite.
- **Security** – signed upload URLs (R2 presigned), per-campaign rate limiting, bot protection,
  configurable CAPTCHA (`off | invisible | challenge`), virus scanning on ingest, encrypted R2
  storage, audit logging (consent + moderation overrides), role-based permissions (reuse
  social-desk RLS + the token-vault pattern). All heavy work is worker/queue, never a Vercel
  function (serverless-timeout rule from the build plan).

---

## 11. Commercial model (maps to feature gates)

| Tier | Gate |
|---|---|
| **Starter** | 1 live campaign, basic branding, standard analytics, manual moderation |
| **Professional** | Multiple campaigns, AI moderation, AI highlights, public gallery, team collaboration |
| **Enterprise** | Unlimited campaigns, white-label domains, advanced analytics, API access, SSO, custom branding |

Gating hangs off the existing plan/entitlement layer; the same "cap the expensive thing"
approach as the video worker (worker minutes, R2 egress, AI tokens are the real running cost).

---

## 12. Phased build (each phase a shippable PR set)

Mirrors the milestone style of `POSTIO_BUILD_PLAN.md`; each leaves the app working and the
stills regression checklist green.

**Phase 1 – MVP (no new AI infra; ships the two surfaces)**
1. **Campaign model + Builder** – new `campaigns` section in `EngineApp.tsx`; reuse
   Brand/Template/brandPaint for name, slug, description, branding, frames, consent config.
2. **Public microsite route group** – `app/(campaign)/c/[brand]/[slug]` server-rendered
   landing + capture/preview/caption/consent/submit/thank-you flow (§6). OG tags, bilingual.
3. **Signed upload endpoint** – anonymous, rate-limited, CAPTCHA-gated → R2 (presigned pattern).
4. **Admin dashboard + manual moderation** – submissions queue with approve/reject/feature/
   download/archive/delete + bulk actions; consent audit trail.
5. **Basic analytics** – submissions / unique users / approval rate, reusing Coach metric shapes.
6. **QR generation** – SVG/PNG util.
7. **Media-library integration** – approved submissions land as `BrandAsset`s / source media,
   reusable by the Design + video engines.

**Phase 2 – Intelligence + reach**
8. **AI moderation** – gated route + `ModerationResult` schema; pre-sorts the same queue.
9. **AI tagging + understanding** – `SubmissionAnalysis` via the Coach analysis pattern.
10. **AI highlights** + **public galleries** (search/filter over tags).
11. **Automatic social-post generation** (carousel/album/reel/recap) via Design engine + worker.
12. **Campaign templates** + **multi-language** polish (EN/CY, native-review flagged).

**Phase 3 – Advanced**
13. AI-generated branded frames (describe → asset), video campaigns, live-event mode,
    real-time leaderboards, gamification, community voting, advanced automation,
    API + webhook integrations (Zapier / Power Automate / CRM / Mailchimp).

---

## 13. Success metrics (from the brief, made testable)

- Campaign created in **< 5 minutes** (Builder time-to-live).
- Public submission completed in **< 60 seconds** (capture → thank-you).
- **No app download** – browser-only capture with upload fallback.
- AI moderation accuracy **> 95%**; flagged content average resolution **< 2 minutes**.
- **≥ 50%** of campaign assets reused in AI-generated social content.
- New user acquisition via public participation; retention via recurring campaigns.

---

## 14. Open decisions (need a call before Phase 1)

1. **Backend graduation.** Public submissions cannot persist to localStorage – the microsite
   is anonymous and multi-device. Phase 1 requires the **Supabase graduation** already flagged
   as M0 in the build plan (one shared backend with social-desk). Confirm shared vs separate.
2. **Domain + hosting model.** Confirm the URL scheme (`postia.co.uk/campaign/{brand}/{slug}`
   vs `{brand}.postia.co.uk/{slug}`) and how white-label custom domains are provisioned/verified
   (DNS + TLS). This drives the middleware host-mapping design.
3. **Storage.** Reuse Capsiynau's R2 (presigned upload + secure proxy) for submission media, or
   stand up a dedicated bucket? Recommend reuse – same egress/caps pattern.
4. **Where the microsite code lives.** Same repo as the engine (a new route group here) or the
   standalone Postio app once the backend graduates (build-plan decision F1). The route group
   is repo-portable either way.

> Bottom line: Campaign Microsites is mostly **configuration + wiring of Brand Brain, the
> canvas renderer, R2, the gated AI pattern, and social-desk** around **one new public surface**
> (server-rendered microsite + signed anonymous upload) and **one new AI call** (moderation).
> Start Phase 1 steps 1–4 once the M0 backend decision is made; the manual-moderation MVP needs
> no new AI infrastructure.
