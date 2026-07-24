# Postio – Interactive Campaigns (technical spec, evaluation phase)

*Working title: Interactive Campaigns (earlier working title: Campaign Microsites). Extends
Postio from **content creation** into **campaign creation**: one natural-language brief
produces the social post, the branded interactive experience behind it, the compliance layer
(terms, privacy, promoter declaration), the entry + moderation + winner system, and the
measurement that ties the social asset to the experience. UK English.*

**The key product decision, up front.** An Instagram or Facebook feed image cannot contain a
running mini-game: once uploaded it is treated as visual media and any embedded script, hidden
HTML or interactive layer is stripped or ignored. Postio must **not** attempt to disguise
executable content as an image or circumvent platform rules. Instead the **social post is the
doorway**, and the interaction happens in a **fast, branded, Postio-hosted experience** reached
by link / QR / Story link / advert destination.

```
Social asset  →  Campaign link or QR  →  Postia-hosted interactive experience
              →  Participation / entry / gameplay  →  Moderation, winner selection, reporting
```

This is a defensible, cross-platform, measurable, moderatable product. It is also honestly a
**bigger build than "collect some UGC"**: on top of the reuse core (§3) it adds three genuinely
new subsystems that are *not* reuse and must be planned as such: a **compliance/terms engine**
(§11), a **winner-selection engine** (§10), and a **mini-game runtime** (§9). Scope the reuse
where it is real and resource the new subsystems where they are not.

---

## 1. Positioning

Interactive Campaigns is a **core Postio capability, not a standalone product**. It extends the
workflow *Create → Engage → Collect → Curate → Repurpose → Publish*:

- **Create** – the Campaign Builder is the existing brand/template authoring surface plus a new
  campaign object and an ask-first brief.
- **Engage** – the public experience (landing → interact/enter → thank-you) is the new runtime.
- **Collect** – entries + uploads flow back into Postio's media layer.
- **Curate** – moderation + tagging reuse the Coach AI layer and the gated route pattern.
- **Repurpose** – entries and winners become source assets for the graphics/video engine.
- **Publish** – assets and winner announcements hand off to social-desk exactly as today.

Do **not** build a parallel system. Every service below names the Postio thing it reuses, and
flags the parts that are genuinely new.

---

## 2. The surfaces (the architecture split that matters most)

Postio today is a **client-only React-Router SPA mounted at `/app/postio`, gated behind
`AppGate`** (`app/app/postio/[[...slug]]/page.tsx` → `@engine/EngineApp`). That is right for the
**authoring** side and wrong for the **public** side.

| | Builder (authoring) | Public experience (runtime) |
|---|---|---|
| Who | Brand / social / agency manager, logged in | Anonymous participant arriving from a post |
| Auth | Behind `AppGate` (as today) | **None** – must work with zero account |
| Rendering | Client SPA (fine) | **Server-rendered**, SEO/OG, sub-2.5s mobile first paint |
| Where it lives | `EngineApp.tsx` (new `campaigns` section) | **New Next route group**, not the SPA |
| Trust boundary | Tenant-scoped, RLS | Public internet, bot-exposed, signed uploads only |

**Domain separation** (from the spec; reduces blast radius): keep the management app and the
public experience on separate hosts.

```
app.postia.co.uk      – management (the engine, behind AppGate)
play.postia.co.uk      – public campaign experiences  → /{brand}/{campaign}
assets.postia.co.uk    – CDN for approved public derivatives only
api.postia.co.uk       – API with strict tenant isolation
```

White-label enterprise domains (`campaigns.brand.co.uk`) resolve to the public route group via
middleware host-mapping. **The Builder is reuse of the existing engine; the public experience is
the one genuinely new front-end surface** and cannot live inside the client-only SPA: public
pages must be indexable, shareable (OG/Twitter card), fast on a cold mobile connection, custom-
domain-capable, and never trust the client (server-side eligibility + closing-date enforcement,
§13). Spec it as a **new Next App-Router route group** (server components), e.g.
`app/(campaign)/[brand]/[campaign]/page.tsx`.

Naming note: the brief says "Postia"; the product in this repo is **Postio**. Same product; keep
the codebase name `Postio`.

---

## 3. Reuse audit (what already exists) and the genuinely new build

Grounded in `components/demos/engine` and the ecosystem audited in `POSTIO_BUILD_PLAN.md`.

**Reuse (do not rebuild):**

| Capability | Where it already exists | Type |
|---|---|---|
| Brand Brain (logo, colours, fonts, tone, terminology, claims) | `Brand`/`BrandAsset` (`lib/model/types.ts`), `brandPaint.ts`, `brandTokens.ts` | **reuse** |
| Branded landing / share-card / frame render | `CanvasRenderer` + `brandPaint` + `framedRenderer` | **reuse** |
| Branded frames / overlays / stickers | `BrandAsset` + freeform `GraphicElement` overlays | **reuse** |
| Social asset family (feed / story / reel-cover / square) | Design engine + `platforms/presets.ts` | **reuse** |
| Media upload + serve | Capsiynau presigned R2 (`GET /api/upload/presigned`, `GET /api/media/{fileId}`) | **API/reuse** |
| Auth / DB / storage / RLS backend | social-desk pattern + Supabase (dormant `supabaseSync.ts`) | **reuse pattern** |
| Gated AI, structured JSON out | `app/api/ai/social/route.ts` + `lib/postioGate.ts`, latest Claude | **reuse pattern** |
| Image understanding / tagging / scoring / highlights | Coach analysis layer (`PostAnalysis`, `AnalysisCategoryResult`) | **reuse pattern** |
| Auto social content (carousel/album/reel/recap) + copy | Design engine + video worker (M3/M4) + Coach Voice/Strategy | **reuse** |
| Publishing + performance loop | social-desk (`app/api/social/instagram/*`) | **reuse** |
| Bilingual EN/CY | `lib/i18n/strings.ts` + `I18nProvider` | **reuse** |

**Genuinely new (resource these; they are not wiring):**

1. **Public experience route group** – server-rendered, custom-domain, zero-auth, bot-exposed (§2).
2. **Ask-first campaign brief + proposal/approval flow** – natural language → structured campaign, human-approved before build (§5).
3. **Compliance / terms + privacy engine** – three-layer terms, promoter declaration gate, versioned templates, children's-code mode (§11). *The largest new subsystem; needs external UK promotions + data-protection legal review before commercial launch.*
4. **Winner-selection engine** – CSPRNG draw with immutable draw log, judging, verification, contact + fulfilment tracking (§10).
5. **Mini-game runtime** – sandboxed, versioned game SDK + manifest + server-side score integrity (§9).
6. **Entry + consent system** – configurable fields, encrypted submitted data, consent receipts, duplicate/fraud controls (§7).
7. **Immutable campaign versioning** – each publication snapshots terms/privacy/config; entries stay linked to the version live when they entered (§8).
8. **Signed public upload endpoint** + safe image pipeline (scan, re-encode, strip metadata, private keys) (§7).
9. **Moderation AI call + queue** – one new prompt/schema on the gated route; human override always (§7, §12 of the source brief folded into §7/§12 here).
10. **QR + short-link service** – Postio-controlled redirect, revocable, per-campaign (§14).

The reuse core still carries creation, rendering and distribution. Items 3–7 are the reason this
is a multi-phase build, not a feature.

---

## 4. Campaign types (template architecture)

Template-based, so new mechanics are data + a runtime module, not new products.

**Phase-one templates:** photo competition · branded selfie / image generator · quiz · poll or
vote · simple mini-game (tap, memory, reaction, catch/avoid, runner, spin-to-reveal *without
monetary wager*, timed trivia) · instant personalised result ("which product are you").

**Later templates:** video / audio entry · treasure hunt · location challenge · multi-stage ·
team challenge · leaderboard · live-event activation · product configurator · supported-browser
AR · creator collaboration.

Each template declares its `experienceConfig` shape, its required entry fields, its moderation
defaults and its default terms template (§11.4).

---

## 5. Ask-first creation and the approval gate

The user describes an outcome; Postio infers what it safely can and asks only for what it cannot.

> "Create a Welsh and English photo competition for our summer festival. People upload a picture
> from the event, apply the festival frame and enter to win two VIP tickets."

From the brief Postio identifies: objective, campaign type, audience, brand, languages, prize,
entry requirements, dates, platforms, data collected, moderation needs, and **legal/compliance
risks**. It then collects only the fields it cannot infer (promoter legal name + contact,
open/close dates, territories, minimum age, prize + count, entry + winner method, notification
process, marketing-use intent, required personal data, retention period, moderation method).

**Nothing is built until the user approves a proposal** showing: campaign summary, user journey,
proposed assets, proposed mechanic, information collected, draft terms, privacy implications,
risks / missing information, estimated complexity, recommended URL. This mirrors the house rule
that **a human approves every generated output** and gives the compliance engine its first gate.

---

## 6. Builder + public experience UX

**Builder sections:** Overview · Experience · Social assets · Entries · Moderation · Terms &
privacy · Publishing · Reporting. The experience editor is **outcome-based, not knob-based**
("make the game easier for children", not "obstacle velocity 0.7"); expert controls live behind
an advanced mode. Live preview is available early and covers mobile / tablet / desktop, EN / CY,
and the pre-entry / submitted / closed / winner / error states.

**Public experience requirements (the runtime):**
- **Performance** – core interface visible < 2.5s on a typical mobile connection; responsive
  images; lazy-load non-essential media; small JS bundles; graceful low-bandwidth + interrupted-
  upload recovery; local progress save.
- **Mobile-first** – camera capture + library upload, correct image orientation, large touch
  targets, short forms, readable terms without losing progress, safe-area aware, portrait default.
- **Accessibility – WCAG 2.2 AA** – keyboard nav, screen-reader labels, contrast, video captions,
  non-colour cues, reduced-motion, error summaries + inline errors, accessible game alternatives
  where practical, clear language selection. The engine already carries density/tap-target tokens
  (`--eng-ctl-min`, 44px coarse-pointer floor) and reduced-motion handling – carry them across.

---

## 7. Entry, consent and the upload pipeline

**Configurable entry fields** (collect only what the campaign needs – ICO data-minimisation):
name, email, phone, DOB / age-confirm, postcode, country, social handle, image/video/audio,
free-text, multiple-choice, marketing opt-in, terms acceptance, privacy acknowledgement,
parental confirmation.

**Entry states:** `draft → uploading → submitted → pending_moderation → approved | rejected |
shortlisted | winner | runner_up | withdrawn | deleted | disqualified`.

**Duplicate / fraud controls (assistive, never silently disqualifying):** verified-email link,
rate limiting, privacy-safe device/session signal, CAPTCHA / managed bot protection, duplicate-
media detection, per-verified-email or per-identifier entry limits, suspicious-pattern flags –
each routes to review, none auto-disqualifies alone.

**Upload pipeline (all new, all server-side):** virus scan → MIME validate → re-encode to a safe
format → strip unnecessary metadata → size/dimension check → private storage key → moderation →
generate approved derivatives. **Originals must never be reachable by predictable public URL.**

**Consent is unbundled and receipted.** Terms acceptance and privacy acknowledgement are
required; marketing is optional, off by default, specific, and records the exact wording +
timestamp + campaign source. Entering a competition must never auto-subscribe anyone to marketing.

**Moderation** runs as: automated safety scan → campaign-rule validation → duplicate/fraud →
human review where required → approve/reject → escalation → audit log. The safety scan is **one
new gated AI call** (NSFW, violence, hate, illegal, personal-info-in-image, copyright, brand-
safety, off-topic, AI-manipulation, age concern) producing a structured `ModerationResult`;
**human override is always available and recorded**. Categories and queue reuse the Coach
analysis pattern; the AI pre-sorts, it does not decide irreversibly in ambiguous cases.

---

## 8. Data model (additive, backend-ready)

Follows `lib/model/types.ts` conventions (`ID`/`ISODate` aliases, `brandId` on every record, ISO
timestamps, no derived UI state baked in). Persists via the Repository pattern; the public /
entry side **requires** the Supabase graduation (M0) – anonymous multi-device entries cannot live
in localStorage. Bilingual content is a first-class `LocalisedContent`, not a late translation.

```ts
interface LocalisedContent { en: string; cy: string }

export interface Campaign {
  id: ID;
  organisationId: ID;                // agency / multi-client tenancy
  brandId: ID;                       // inherits Brand Brain
  ownerId: ID;
  promoterId: ID;                    // the legal promoter (§11)
  name: LocalisedContent;
  slug: string;                      // → play.postia.co.uk/{brand}/{slug}
  type: CampaignType;                // photo | selfie | quiz | poll | game | result | …
  status: CampaignStatus;            // §15
  locales: ('en' | 'cy')[];
  startsAt: ISODate; closesAt: ISODate;
  experienceConfig: Record<string, unknown>;   // per-template (frame, questions, game rules…)
  eligibilityConfig: Record<string, unknown>;  // age, territories, exclusions, entry limits
  entryFields: EntryFieldConfig[];
  moderationConfig: Record<string, unknown>;
  winnerConfig: Record<string, unknown>;        // method + criteria (§10)
  retentionConfig: Record<string, unknown>;      // per-record retention (§11)
  domain?: string;                   // white-label host
  publishedVersionId?: ID;           // → immutable CampaignVersion
  createdAt: ISODate; updatedAt: ISODate;
}

export interface CampaignEntry {
  id: ID;
  campaignId: ID;
  campaignVersionId: ID;             // the version live when they entered (§8 immutability)
  participantId?: ID;
  status: EntryStatus;
  locale: 'en' | 'cy';
  submittedDataEncrypted: string;    // PII encrypted at rest, not plain columns
  mediaIds: ID[];                    // private storage keys; derivatives generated on approval
  score?: number;                    // validated server-side for prize games (§9)
  consentReceiptId: ID;
  moderationResultId?: ID;
  submittedAt: ISODate; deletedAt?: ISODate;
}

export interface ConsentReceipt {
  id: ID;
  campaignId: ID; entryId: ID;
  termsVersionId: ID; privacyVersionId: ID;
  requiredTermsAccepted: boolean;
  marketingConsent?: boolean;
  marketingConsentTextVersion?: string;
  acceptedAt: ISODate;
}

export interface ModerationResult {
  verdict: 'safe' | 'needs-review' | 'rejected';
  flags: string[];                   // nsfw | violence | hate | illegal | personal-info | copyright | brand-safety | off-topic | ai-manipulation | duplicate | age
  scores: Record<string, number>;    // 0-1 per flag
  isDuplicateOf?: ID;
  modelUsed: string;
  humanOverride?: { by: ID; verdict: 'approved' | 'rejected'; reason?: string; at: ISODate };
}
```

**Immutable `CampaignVersion`.** Every publication snapshots content, terms, privacy notice,
form structure, eligibility, prize details, winner method, experience config, social-asset
references, language variants and approver details. Existing entries stay linked to their
version, so a post-launch change never rewrites the rules someone entered under (§13).

Supabase tables mirror these with social-desk RLS + grants: `campaigns`, `campaign_versions`,
`campaign_entries`, `consent_receipts`, `moderation_results`, plus `render_jobs` (reused from the
video-worker plan) for generated share cards / winner posts. Existing brands/templates untouched.

---

## 9. Mini-game runtime (new)

Games run as **isolated, sandboxed web modules** inside the public experience: HTML5, Canvas/WebGL
only where needed, a React wrapper, Phaser for suitable 2D games, a **versioned campaign-game
SDK**, signed manifests, **no arbitrary user JavaScript**.

```ts
interface GameManifest {
  gameType: string; version: string; campaignId: string;
  locale: 'en' | 'cy';
  assets: GameAsset[]; rules: GameRules; scoring: ScoringConfig;
  accessibility: AccessibilityConfig; analytics: AnalyticsConfig;
}
interface GameEvent {
  campaignId: string; sessionId: string;
  event: 'game_loaded' | 'game_started' | 'game_paused' | 'game_completed' | 'score_submitted' | 'share_selected';
  timestamp: string; payload?: Record<string, unknown>;
}
```

**Score integrity for prize games** is a hard requirement: never trust a client-submitted score.
Use signed sessions; validate duration and event sequence; detect impossible scores; rate-limit
submissions; keep display names separate from identifying data; keep a score audit record; provide
manual disqualification. This is why prize games depend on the backend, not just the client.

---

## 10. Winner selection (new)

Methods: random draw · highest score · judging panel · public vote · weighted judging · combined
score+judging · manual with recorded justification.

**Random draw must be defensible:** cryptographically secure RNG, eligible entries only, recorded
candidate pool, selection time, algorithm version, an **immutable draw log**, approved reruns only
where the original winner is invalid, and the reason retained for any redraw.

**Judged competitions:** named judges, scoring criteria, hidden scoring, comments, conflict
declarations, aggregate scoring, tie-breaks, final approval.

**Winner management:** contact workflow + attempt log, identity/eligibility verification,
acceptance deadline, prize-fulfilment status, runner-up + redraw, proof-of-delivery, and a
**winner-announcement generator** (reuses the Design engine + Coach copy). ASA expects reasonable
efforts to contact winners and delivery within the stated period, so this is compliance surface,
not nice-to-have.

---

## 11. Compliance: terms, privacy, promoter model (the largest new subsystem)

**Every campaign must have terms.** It cannot publish if terms are missing, unresolved,
incomplete, linked to the wrong promoter, missing significant details, or still an unreviewed
draft.

**Three layers:** (1) **Postio platform terms** (org ↔ Postio: acceptable use, availability,
prohibited campaigns, IP, liability, data-processing, suspension). (2) **Campaign promoter terms**
(participant ↔ brand/promoter). (3) **Campaign privacy notice** (how participant data is
processed). The required promoter-terms fields are enumerated in the source brief (promoter legal
identity + contact, dates, territories, age, exclusions, entry method + limits, purchase
requirement, prize details + restrictions, winner method + criteria + notification + claim period
+ redraw + fulfilment timescale, invalid-entry treatment, content ownership + licence, publicity,
data treatment, cancellation/amendment, governing law, complaint route, platform disclaimer).

**Significant terms surface on the asset, not only in the T&Cs** (ASA): closing date, prize,
material eligibility, and the "not sponsored/endorsed/administered by [platform]" disclaimer where
required must appear in the promotional material itself. The social-asset generator (§reuse) must
be able to place these.

**Default terms are versioned templates, not bespoke legal advice:** jurisdiction-specific,
legally locked at the core, customisable through structured fields, clearly marked as templates,
traceable to the exact version accepted at publication. Postio must never present generated terms
as legal advice, and **the legal templates must be reviewed by a UK promotions + data-protection
solicitor before commercial launch.**

**The publication gate (promoter declaration).** Before going live an authorised user confirms:
promoter info correct, prize accurate, eligibility correct, complies with applicable law + platform
rules, privacy notice reflects actual processing, they have authority to publish, they accept
promoter responsibility. Store user id, org id, timestamp, security identifier, terms version,
campaign version, confirmation-text version.

**Postio disclaimer** on campaign pages: *"This promotion is administered by [Promoter]. Postia
provides the campaign technology and is not the promoter, prize provider or judge unless expressly
stated."*

**Data-protection roles:** default is **brand/promoter = controller, Postio = processor** (with
Postio as independent/joint controller only for platform security, fraud prevention, billing,
legal compliance and separated product analytics). Roles are documented per campaign, not assumed.
Each campaign defines data collected, purpose, lawful basis, retention, recipients, transfers,
participant rights, controller contact, automated-decision flag, publication flag, marketing flag.
**Privacy by design** is part of campaign creation (ICO), and retention is configured per record
type (entry / rejected upload / winner record / consent evidence / security log / analytics /
backup) with automatic deletion, anonymisation, legal hold, subject-access export and deletion.

**Children's-code mode.** Campaigns aimed at children trigger enhanced compliance: age-appropriate
language, data-minimisation defaults, reduced profiling, no behavioural ads in-campaign, parental
workflows, restricted galleries, stronger moderation, location-data off by default, no public full
names, no default marketing opt-in, a DPIA prompt, restricted image reuse, safeguarding escalation.
Publication is blocked until the owner confirms the audience and completes the enhanced review.

---

## 12. Analytics + attribution

Funnel: asset published → impressions (imported where available) → click / QR scan → page load →
interaction start → entry start → entry submit → share → repeat visit. Core metrics reuse the
Coach `PostPerformanceMetrics`/`PerformanceEntry` shapes; social-side numbers come through the
social-desk measurement half. Every generated asset carries an **attribution id**
(`?src=…&placement=…&creative=…&campaign=…`) and **no personal data goes in URLs**. Analytics
distinguishes strictly-necessary events, privacy-preserving aggregate measurement, consented
analytics, and advertising/retargeting (separate review) – cookies assessed under PECR + UK GDPR.

The intelligence layer explains its basis and never presents synthetic scores as fact
("the form loses 31% at the phone-number field, which isn't needed for winner contact because
email is collected – consider removing it").

---

## 13. Post-publication change control

Some details must not change silently once live. **Material changes** (closing date, prize,
eligibility, entry limit, winner method, content licence, data use, promoter identity) require a
recorded reason, authorised approval, a **new campaign version**, assessment of existing entrants,
a public change notice, direct notification where appropriate, and preservation of the original
terms. ASA: closing dates should not change to participants' disadvantage. **Non-material changes**
(typos, alt text, non-substantive visuals, broken-link repair) still version but may skip
notification. Closing-date enforcement is **server-side; never trust the client clock.**

---

## 14. QR, links, and the same-device problem

QR / poster / table / event codes download as **SVG + PNG** and always resolve through a
**Postio-controlled HTTPS redirect**: one campaign each, revocable, destination-updatable,
aggregate-scan-recorded, no personal data embedded, tested before publication. Because a
participant viewing a post on the same phone cannot conveniently scan its QR, **pair every QR with
a short URL, profile link, Story link and advert destination** plus platform-specific instructions.

---

## 15. Status model, security, governance

**Status:** `idea → draft → awaiting_information → generating → internal_review → legal_review →
client_review → approved → scheduled → live → paused → closed → winner_selection →
winner_confirmation → completed → archived | cancelled`.

A campaign cannot become `live` unless the experience passes validation, assets exist, the public
URL resolves, terms + privacy are complete, promoter acceptance is recorded, dates are valid, entry
+ upload scanning work, moderation is configured, required languages are complete, accessibility
checks pass, and the owner approved the final preview.

**Security:** tenant isolation, RBAC, MFA for privileged users, encryption in transit + at rest,
secret management, rate limiting, CSRF, CSP, secure headers, signed + short-lived upload
credentials, file re-encoding, malware + dependency scanning, audit logging, disclosure process.
Public side: bot mitigation, submission throttling, CAPTCHA escalation, duplicate detection, signed
campaign config, server-side eligibility + closing-date enforcement, safe rich-text rendering, no
arbitrary HTML/script, abuse reporting. **Step-up confirmation** for publishing, changing terms
after launch, exporting participant data, selecting a winner, deleting a campaign, changing
retention, enabling public galleries, downloading original uploads.

**Governance:** Postio admins can view risk levels, suspend campaigns, disable submissions, remove
illegal content, review complaints, inspect audit logs, manage template versions, manage a
**prohibited-campaign policy** (illegal promotions, gambling / unlawful lotteries, dangerous
challenges, hate, exploitation, misleading health/financial claims, unlawful child targeting,
excessive sensitive data, rights-infringing content), configure retention, review subprocessors,
run incident workflows, export compliance evidence, disable compromised links. **Failure states**
(link down, upload interrupted, unsupported browser, camera denied, not-started, closed, limit
reached, duplicate, moderation pending, image/score rejected, missing language, terms changed
mid-session, paused, publish failed, queue delay) each explain what happened and what to do next.

---

## 16. Social publishing (reuse, with honest limits)

Use official Meta APIs for eligible professional accounts (image / video / reel / carousel /
story where permitted), via the existing social-desk integration: store tokens securely, handle
expiry, respect account types + limits, log attempts, **provide a manual publishing package as
fallback** where API publishing is unavailable. No scraping, no simulated user activity. Postio
never claims a feed image is tappable where the platform does not support it.

---

## 17. Delivery phases

Mirrors the milestone style of `POSTIO_BUILD_PLAN.md`; each phase leaves the app working and the
stills regression checklist green.

- **Phase 0 – Discovery + legal.** Validate demand with existing clients; review Meta constraints;
  confirm the promoter/processor operating model; obtain **UK promotional-law review**; define
  prohibited categories; audit Postio components for reuse; prototype the end-to-end photo flow.
- **Phase 1 – Internal prototype.** One campaign type (photo competition), Postio-hosted URL,
  manual terms config, photo capture + frame, entry form, internal moderation, basic reporting.
- **Phase 2 – Controlled pilot.** 2–3 trusted brands, real prizes, full audit logging, winner
  workflow, data deletion, support + incident procedures, conversion measurement.
- **Phase 3 – Commercial MVP.** Self-service creation, template terms, Brand Brain integration,
  billing, org roles, bilingual assets, standard reporting.
- **Phase 4 – Interactive expansion.** Quizzes, polls, simple games, personalised results, public
  galleries, judging workflows, custom domains.
- **Phase 5 – Campaign intelligence.** Cross-campaign benchmarking, AI recommendations, automated
  retrospectives, brand-specific optimisation, predictive creative testing.

The prior "Campaign Microsites" MVP (photo upload + frame + manual moderation + random draw + QR +
basic analytics) is Phase 1–3 here; the wider game/quiz/poll platform is Phase 4+.

---

## 18. First slice (build this to validate everything)

A single end-to-end vertical: **"Create a branded photo competition."** The user: selects a Brand
Brain → describes the campaign → confirms prize/dates/eligibility → generates social assets →
generates a bilingual campaign page → adds a branded frame → reviews default terms + privacy →
accepts the promoter declaration → publishes → receives + moderates entries → selects a winner →
records contact + fulfilment → views results → generates the winner-announcement post.

This proves the campaign architecture, the compliance model, the public experience, the entry
system, asset generation and commercial value **before** investing in the mini-game platform.

---

## 19. Success measures + open decisions

**Success:** a non-technical user creates a compliant draft unaided; a brand launches a photo
competition in under one working session; participants enter from a phone with no account; owners
understand who is legally responsible; no campaign goes live without terms + privacy; 99.9% uptime
during live campaigns; no cross-tenant exposure; automated deletion within policy; full traceability
of terms + campaign versions; public experience meets performance targets.

**Open decisions (need a call before Phase 1):**
1. **Backend graduation (M0)** – the public/entry side cannot use localStorage; this requires the
   Supabase graduation already flagged in the build plan (shared with social-desk?).
2. **Domain + white-label provisioning** – confirm the `play.postia.co.uk/{brand}/{slug}` scheme
   and how custom domains are verified (DNS + TLS); drives the middleware host-mapping.
3. **Storage** – reuse Capsiynau's R2 (presigned + secure proxy) for entry media, or a dedicated
   bucket? Recommend reuse (same egress/caps pattern).
4. **Legal ownership** – who owns the terms/privacy templates and their periodic review, and the
   promoter/processor DPA. This is a launch blocker, not a detail.
5. **Code home** – the public route group in this repo vs. the standalone Postio app once the
   backend graduates (build-plan decision F1). The route group is repo-portable either way.

> Bottom line: the reuse core (Brand Brain, canvas renderer, R2, gated AI, Coach analysis,
> social-desk) still carries creation, rendering and distribution. What makes Interactive
> Campaigns a real programme rather than a feature is the **new compliance engine, winner engine,
> game runtime, entry/consent system and immutable versioning** – plus the one public, bot-exposed,
> zero-auth surface. Start Phase 0's legal review in parallel with the M0 backend decision; build
> the §18 photo-competition slice first.

---

## 20. User groups

Five roles the system serves; each is a lens on the requirements above.

- **Brand manager** – creates and manages campaigns for one organisation. Needs quick creation,
  brand consistency, clear approval steps, analytics, safe terms/privacy defaults.
- **Social media manager** – makes assets, schedules posts, monitors performance. Needs correct
  output sizes, platform-specific captions, easy links/codes, clear status, mobile-first management.
- **Agency user** – manages campaigns across multiple client workspaces. Needs client separation,
  approval workflows, reusable templates, white-labelled reports, role-based access. (This is why
  `Campaign.organisationId` exists in §8: agency multi-client tenancy.)
- **Campaign moderator** – reviews entries and handles inappropriate content. Needs moderation
  queues, filters/search, approve/reject controls, audit history, escalation (§7).
- **Campaign participant** – arrives from a social post and completes the interaction. Needs fast
  mobile loading, minimal steps, no mandatory account, clear prize/eligibility info, accessible +
  bilingual interaction, and confidence the campaign is legitimate (the §2 public experience).

---

## 21. API outline

Two trust zones (§2): the authenticated management API and the public, zero-auth experience API.
Public routes are bot-exposed and never trust the client (server-side eligibility + closing-date
enforcement, §15).

**Management** (`api.postia.co.uk`, tenant-scoped):
```
POST   /api/campaigns                 GET  /api/campaigns/:id        PATCH /api/campaigns/:id
POST   /api/campaigns/:id/generate    POST /api/campaigns/:id/validate
POST   /api/campaigns/:id/approve     POST /api/campaigns/:id/publish
POST   /api/campaigns/:id/pause       POST /api/campaigns/:id/close
GET    /api/campaigns/:id/analytics   GET  /api/campaigns/:id/entries
```
**Public** (`play.postia.co.uk`, anonymous, signed uploads only):
```
GET    /public/campaigns/:slug                POST /public/campaigns/:slug/session
POST   /public/campaigns/:slug/uploads        POST /public/campaigns/:slug/entries
POST   /public/campaigns/:slug/scores         GET  /public/campaigns/:slug/results
POST   /public/campaigns/:slug/consent
```
**Moderation** (management, moderator role):
```
GET    /api/campaigns/:id/moderation
POST   /api/entries/:entryId/approve   POST /api/entries/:entryId/reject
POST   /api/entries/:entryId/escalate  POST /api/entries/:entryId/disqualify
```
**Winner** (management, step-up confirmed, §15):
```
POST   /api/campaigns/:id/draw         POST /api/campaigns/:id/judging
POST   /api/campaigns/:id/winners/:entryId/verify
POST   /api/campaigns/:id/winners/:entryId/contact
POST   /api/campaigns/:id/winners/:entryId/confirm
POST   /api/campaigns/:id/redraw
```
In this repo the gated `app/api/ai/social` pattern is the model for the AI-backed routes
(`/generate`, moderation scan); the public routes are new and belong to the §2 public surface.

---

## 22. Risks

- **Platform dependency** – Meta capabilities/permissions/policies change. *Mitigation:* treat
  social platforms as distribution only; keep the experience independently Postio-hosted (§2, §16).
- **Legal exposure** – a poorly configured competition exposes the promoter (and potentially
  Postio) to complaints. *Mitigation:* mandatory terms, structured fields, promoter declaration,
  prohibited categories, external legal review (§11, §15).
- **Data protection** – campaigns gather photos + contact details. *Mitigation:* data
  minimisation, privacy-by-design, encryption, retention automation, processor agreements (§11).
- **Harmful uploads** – participants may submit illegal/inappropriate content. *Mitigation:*
  private-by-default uploads, automated scanning, human moderation, escalation (§7).
- **Fraud** – automated/duplicate entries undermine competitions. *Mitigation:* rate limits,
  verified contact, anomaly detection, audit logs, human review (§7).
- **User misunderstanding of liability** – brands may believe Postio is the promoter.
  *Mitigation:* clear promoter designation throughout setup, publication and terms; the §11
  disclaimer on every campaign page.
- **Same-device QR** – someone viewing a post on their phone cannot scan its QR. *Mitigation:*
  always pair QR with a short URL, profile link, Story link and advert destination (§14).

---

## 23. Brand Brain guardrails and AI image generation

**Brand Brain provides** tone, approved terminology, logo/asset selection, colours/typography,
audience knowledge, bilingual terminology, claims + prohibited phrases, prior performance, approved
CTAs, visual treatments, legal company info. **Brand Brain must NOT invent** prize details,
eligibility conditions, legal identity, regulatory claims, closing dates, consent wording, or rights
over participant content. Generated statements of fact must trace to an approved source or require
human confirmation (spec §26). This constrains the ask-first generator in §5.

**AI image generation** (where enabled): explicit disclosure where appropriate; user confirms they
have rights to the source; prohibited-content filtering; brand-safety rules; human review before any
public gallery inclusion; **no automatic use of participant images to train models**; clear
image-retention rules; separate consent for additional promotional use (spec §13).
