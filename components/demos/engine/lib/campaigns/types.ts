// ═══ Postio Interactive Campaigns: core data model (scaffolding) ═══
//
// First additive slice of the Interactive Campaigns build (spec:
// components/demos/engine/POSTIO_CAMPAIGN_MICROSITES.md §8; tracker: issue
// #140, Phase 1 #142). Types only. Nothing here is wired into the running app
// yet, so this file is safe to land ahead of the M0 Supabase backend and the
// open product/legal decisions in #140.
//
// Conventions match lib/model/types.ts: reuse the ID/ISODate aliases, put
// brandId on every record, use ISO timestamps, and keep no derived UI state in
// the model. The shapes are deliberately backend-ready so they can graduate
// from localStorage (authoring drafts) to Supabase (public/entry side) without
// restructuring.

import type { ID, ISODate } from '../model/types';

/**
 * First-class bilingual content. EN + CY are variants, never a late
 * translation: a campaign is not "bilingual" unless required content exists in
 * both. New cy values are machine-draft and must be flagged for native review.
 */
export interface LocalisedContent {
  en: string;
  cy: string;
}

export type CampaignLocale = 'en' | 'cy';

/** Template-based mechanics. Extend the union as templates are added; the value
 *  selects the experience runtime. Photo is the Phase 1 first slice. */
export type CampaignType =
  | 'photo'
  | 'selfie'
  | 'quiz'
  | 'poll'
  | 'game'
  | 'result';

/** The lifecycle from spec §15. A campaign cannot reach `live` until the
 *  publishing rules pass (terms + privacy complete, promoter declaration
 *  recorded, dates valid, moderation configured, required languages complete,
 *  accessibility checks pass, owner approved the final preview). */
export type CampaignStatus =
  | 'idea'
  | 'draft'
  | 'awaiting_information'
  | 'generating'
  | 'internal_review'
  | 'legal_review'
  | 'client_review'
  | 'approved'
  | 'scheduled'
  | 'live'
  | 'paused'
  | 'closed'
  | 'winner_selection'
  | 'winner_confirmation'
  | 'completed'
  | 'archived'
  | 'cancelled';

/** Submission media type. Future-proof: extend the union for new media. */
export type SubmissionType =
  | 'photo'
  | 'video'
  | 'photo-caption'
  | 'video-caption'
  | 'story'
  | 'testimonial'
  | 'audio';

/** Entry lifecycle from spec §7. */
export type EntryStatus =
  | 'draft'
  | 'uploading'
  | 'submitted'
  | 'pending_moderation'
  | 'approved'
  | 'rejected'
  | 'shortlisted'
  | 'winner'
  | 'runner_up'
  | 'withdrawn'
  | 'deleted'
  | 'disqualified';

/** Configurable entry-form field. Only collect what a campaign needs (ICO data
 *  minimisation). `key` is stable; `label` is bilingual. */
export interface EntryFieldConfig {
  key: string;
  type:
    | 'name'
    | 'email'
    | 'phone'
    | 'dob'
    | 'age-confirm'
    | 'postcode'
    | 'country'
    | 'social-handle'
    | 'image'
    | 'video'
    | 'audio'
    | 'free-text'
    | 'multiple-choice'
    | 'marketing-opt-in'
    | 'terms-acceptance'
    | 'privacy-acknowledgement'
    | 'parental-confirmation';
  label: LocalisedContent;
  required: boolean;
  /** Options for multiple-choice fields. */
  options?: LocalisedContent[];
}

/** Configurable CAPTCHA posture for the public experience (spec §15). */
export type CaptchaMode = 'off' | 'invisible' | 'challenge';

export interface Campaign {
  id: ID;
  organisationId: ID; // agency / multi-client tenancy
  brandId: ID; // inherits Brand Brain (logo/colours/fonts/tone)
  ownerId: ID;
  promoterId: ID; // the legal promoter (spec §11)
  name: LocalisedContent;
  slug: string; // resolves under the public experience host, e.g. /{brand}/{slug}
  type: CampaignType;
  status: CampaignStatus;
  locales: CampaignLocale[];
  submissionType: SubmissionType;
  startsAt: ISODate;
  closesAt: ISODate;
  /** Per-template config (frame, questions, game rules...). Kept opaque here;
   *  each template narrows it. */
  experienceConfig: Record<string, unknown>;
  /** Age, territories, exclusions, entry limits. */
  eligibilityConfig: Record<string, unknown>;
  entryFields: EntryFieldConfig[];
  moderationConfig: Record<string, unknown>;
  /** Winner method + criteria (spec §10). */
  winnerConfig: Record<string, unknown>;
  /** Per-record retention (spec §11). */
  retentionConfig: Record<string, unknown>;
  captcha: CaptchaMode;
  /** White-label host, e.g. campaigns.brand.co.uk. */
  domain?: string;
  /** The immutable version live now (spec §8). */
  publishedVersionId?: ID;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface CampaignEntry {
  id: ID;
  campaignId: ID;
  /** The version live when they entered, so a post-launch change never
   *  rewrites the rules someone entered under (spec §8, §13). */
  campaignVersionId: ID;
  participantId?: ID;
  status: EntryStatus;
  locale: CampaignLocale;
  /** PII encrypted at rest, not plain columns. */
  submittedDataEncrypted: string;
  /** Private storage keys; public derivatives are generated only on approval. */
  mediaIds: ID[];
  /** Validated server-side for prize games (spec §9). */
  score?: number;
  consentReceiptId: ID;
  moderationResultId?: ID;
  submittedAt: ISODate;
  deletedAt?: ISODate;
}

/** Unbundled, receipted consent (spec §7, §11). Terms + privacy are required;
 *  marketing is optional, off by default, and records the exact wording. */
export interface ConsentReceipt {
  id: ID;
  campaignId: ID;
  entryId: ID;
  termsVersionId: ID;
  privacyVersionId: ID;
  requiredTermsAccepted: boolean;
  marketingConsent?: boolean;
  marketingConsentTextVersion?: string;
  ageConfirmed?: boolean;
  acceptedAt: ISODate;
  /** Provenance for the GDPR audit trail. */
  ipHash?: string;
  userAgent?: string;
}

export type ModerationVerdict = 'safe' | 'needs-review' | 'rejected';

export type ModerationFlag =
  | 'nsfw'
  | 'violence'
  | 'hate'
  | 'illegal'
  | 'personal-info'
  | 'copyright'
  | 'brand-safety'
  | 'off-topic'
  | 'ai-manipulation'
  | 'duplicate'
  | 'age';

/** Output of the moderation AI call (spec §7). Human override is always
 *  available and recorded; the AI pre-sorts, it never decides irreversibly in
 *  ambiguous cases. */
export interface ModerationResult {
  verdict: ModerationVerdict;
  flags: ModerationFlag[];
  scores: Partial<Record<ModerationFlag, number>>; // 0-1 per flag
  isDuplicateOf?: ID; // perceptual-hash match within the campaign
  modelUsed: string;
  humanOverride?: {
    by: ID;
    verdict: 'approved' | 'rejected';
    reason?: string;
    at: ISODate;
  };
}

/** Reuses the Coach "structured JSON out" analysis shape for tagging /
 *  understanding of an approved entry (spec §7 curation). */
export interface SubmissionAnalysis {
  objects: string[];
  activities: string[];
  mood: string[];
  colours: string[];
  location?: string;
  weather?: string;
  peopleCount?: number;
  brandVisible?: boolean;
  products?: string[];
  /** Flattened searchable metadata: beach, sunset, dog... */
  tags: string[];
  modelUsed: string;
}

/**
 * An immutable snapshot taken at publication (spec §8). Existing entries stay
 * linked to their version via CampaignEntry.campaignVersionId, so material
 * changes after launch (spec §13) produce a new version rather than rewriting
 * the rules a participant entered under.
 */
export interface CampaignVersion {
  id: ID;
  campaignId: ID;
  /** Monotonic per campaign; 1 for the first publication. */
  revision: number;
  name: LocalisedContent;
  type: CampaignType;
  locales: CampaignLocale[];
  startsAt: ISODate;
  closesAt: ISODate;
  experienceConfig: Record<string, unknown>;
  eligibilityConfig: Record<string, unknown>;
  entryFields: EntryFieldConfig[];
  winnerConfig: Record<string, unknown>;
  /** References to the terms + privacy notice versions accepted at publication. */
  termsVersionId: ID;
  privacyVersionId: ID;
  /** Social-asset references generated for this version. */
  socialAssetIds: ID[];
  /** The recorded promoter declaration (spec §11 publication gate). */
  approvedBy: ID;
  approvedAt: ISODate;
  createdAt: ISODate;
}
