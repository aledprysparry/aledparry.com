// ═══ Postio Interactive Campaigns: publishing gate (spec §15) ═══
//
// Second additive slice of the Interactive Campaigns build (spec:
// components/demos/engine/POSTIO_CAMPAIGN_MICROSITES.md §15; tracker: issue
// #140, Phase 1 #142). Pure logic over the Campaign model from ./types.
//
// A campaign cannot become `live` until every requirement below is met. Some
// requirements are derivable from the Campaign object (valid dates, moderation
// configured, required-language content complete); others are external
// readiness signals the builder collects at publish time (experience passed
// validation, assets exist, the public URL resolves, terms + privacy complete,
// promoter declaration recorded, upload scanning works, owner approved the
// final preview). This module is a pure function, imported nowhere yet, so it
// lands safely ahead of the M0 backend and the open decisions in #140.

import type { Campaign, CampaignLocale, LocalisedContent } from './types';

/** Stable ids for each publishing requirement (spec §15). */
export type PublishRequirementId =
  | 'experience-validated'
  | 'social-assets-exist'
  | 'public-url-resolves'
  | 'terms-complete'
  | 'privacy-complete'
  | 'promoter-declaration-recorded'
  | 'dates-valid'
  | 'entry-method-works'
  | 'upload-scanning-works'
  | 'moderation-configured'
  | 'languages-complete'
  | 'accessibility-passed'
  | 'owner-approved-preview';

/**
 * External readiness signals the builder supplies at publish time (the parts
 * that cannot be derived from the Campaign object alone). Each is a plain
 * boolean so this stays a pure, testable function with no I/O.
 */
export interface PublishReadiness {
  experienceValidated: boolean;
  socialAssetsExist: boolean;
  publicUrlResolves: boolean;
  termsComplete: boolean;
  privacyComplete: boolean;
  promoterDeclarationRecorded: boolean;
  entryMethodWorks: boolean;
  uploadScanningWorks: boolean;
  accessibilityPassed: boolean;
  ownerApprovedPreview: boolean;
}

/** One unmet requirement, for surfacing in the builder's publishing section. */
export interface UnmetRequirement {
  id: PublishRequirementId;
  /** Dev-facing English summary; the builder maps ids to bilingual UI copy. */
  reason: string;
}

export interface PublishGateResult {
  canPublish: boolean;
  unmet: UnmetRequirement[];
}

/** True when a LocalisedContent has non-empty text for every declared locale. */
export function localisedComplete(
  content: LocalisedContent | undefined,
  locales: CampaignLocale[],
): boolean {
  if (!content) return false;
  return locales.every((locale) => (content[locale] ?? '').trim().length > 0);
}

/** Valid when both dates parse, close is after start, and both are present. */
export function datesValid(startsAt: string, closesAt: string): boolean {
  const start = Date.parse(startsAt);
  const close = Date.parse(closesAt);
  if (Number.isNaN(start) || Number.isNaN(close)) return false;
  return close > start;
}

/**
 * Slug rules for the public experience path (/{brand}/{slug}): lowercase
 * alphanumerics and single hyphens, no leading/trailing/double hyphen, 1-64
 * chars. Kept conservative so slugs are URL- and QR-safe.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 64;
}

/**
 * Evaluate whether a campaign may go `live` (spec §15). Returns every unmet
 * requirement rather than short-circuiting, so the builder can show a complete
 * checklist. `canPublish` is true only when `unmet` is empty.
 */
export function evaluatePublishGate(
  campaign: Campaign,
  readiness: PublishReadiness,
): PublishGateResult {
  const unmet: UnmetRequirement[] = [];
  const add = (id: PublishRequirementId, reason: string) => unmet.push({ id, reason });

  if (!readiness.experienceValidated) {
    add('experience-validated', 'Experience build has not passed validation.');
  }
  if (!readiness.socialAssetsExist) {
    add('social-assets-exist', 'No social assets have been generated.');
  }
  if (!readiness.publicUrlResolves) {
    add('public-url-resolves', 'The public campaign URL does not resolve.');
  }
  if (!readiness.termsComplete) {
    add('terms-complete', 'Terms and conditions are missing or incomplete.');
  }
  if (!readiness.privacyComplete) {
    add('privacy-complete', 'The privacy notice is missing or incomplete.');
  }
  if (!readiness.promoterDeclarationRecorded) {
    add('promoter-declaration-recorded', 'The promoter declaration has not been recorded.');
  }
  if (!datesValid(campaign.startsAt, campaign.closesAt)) {
    add('dates-valid', 'Start and closing dates are missing or invalid (close must be after start).');
  }
  if (!readiness.entryMethodWorks) {
    add('entry-method-works', 'The entry method does not work.');
  }
  if (!readiness.uploadScanningWorks) {
    add('upload-scanning-works', 'Upload scanning is not working.');
  }
  if (!campaign.moderationConfig || Object.keys(campaign.moderationConfig).length === 0) {
    add('moderation-configured', 'No moderation policy is configured.');
  }
  if (campaign.locales.length === 0 || !localisedComplete(campaign.name, campaign.locales)) {
    add('languages-complete', 'Required language variants are incomplete.');
  }
  if (!readiness.accessibilityPassed) {
    add('accessibility-passed', 'The campaign has not passed accessibility checks.');
  }
  if (!readiness.ownerApprovedPreview) {
    add('owner-approved-preview', 'The campaign owner has not approved the final preview.');
  }

  return { canPublish: unmet.length === 0, unmet };
}
