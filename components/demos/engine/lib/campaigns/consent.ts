// ═══ Postio Interactive Campaigns: consent (spec §7, §11) ═══
//
// Third additive slice of the Interactive Campaigns build (tracker: issue #140,
// Phase 1 #142). Pure logic over the model in ./types.
//
// Consent is unbundled and receipted. Accepting the terms and acknowledging the
// privacy notice are required; marketing consent is optional, off by default,
// specific, and records the exact wording accepted plus a timestamp and the
// campaign source. Entering a competition must never auto-subscribe anyone to
// marketing. This module is a pure function, imported nowhere yet, so it lands
// safely ahead of the M0 backend.

import type { ID, ISODate } from '../model/types';
import type { ConsentReceipt } from './types';

/** The raw consent choices a participant submits with an entry. */
export interface ConsentInput {
  acceptTerms: boolean;
  acknowledgePrivacy: boolean;
  /** Optional and unbundled: never pre-selected, never implied by entry. */
  marketingConsent?: boolean;
  /** Set when the campaign requires an age confirmation. */
  ageConfirmed?: boolean;
}

/** Requirements a campaign places on consent, derived from its config. */
export interface ConsentRequirements {
  /** True when the campaign collects an age confirmation (spec §7, §19). */
  requiresAgeConfirmation: boolean;
}

export type ConsentGap =
  | 'terms-not-accepted'
  | 'privacy-not-acknowledged'
  | 'age-not-confirmed';

export interface ConsentValidation {
  valid: boolean;
  gaps: ConsentGap[];
}

/**
 * Validate submitted consent against a campaign's requirements. Terms and
 * privacy are always required; age confirmation only when the campaign asks for
 * it. Marketing consent is never required and is intentionally not checked here.
 */
export function validateConsent(
  input: ConsentInput,
  requirements: ConsentRequirements,
): ConsentValidation {
  const gaps: ConsentGap[] = [];
  if (!input.acceptTerms) gaps.push('terms-not-accepted');
  if (!input.acknowledgePrivacy) gaps.push('privacy-not-acknowledged');
  if (requirements.requiresAgeConfirmation && !input.ageConfirmed) {
    gaps.push('age-not-confirmed');
  }
  return { valid: gaps.length === 0, gaps };
}

/** Everything needed to mint an auditable receipt, kept explicit so the caller
 *  supplies the id, timestamp and version references (no I/O in this module). */
export interface ConsentReceiptInput {
  id: ID;
  campaignId: ID;
  entryId: ID;
  termsVersionId: ID;
  privacyVersionId: ID;
  acceptedAt: ISODate;
  input: ConsentInput;
  /** The exact marketing wording shown, recorded only when consent was given. */
  marketingConsentTextVersion?: string;
  /** Provenance for the GDPR audit trail. */
  ipHash?: string;
  userAgent?: string;
}

/**
 * Build an auditable ConsentReceipt. Marketing consent is recorded as an
 * explicit boolean (defaulting to false, never implied), and its wording
 * version is only attached when consent was actually given.
 */
export function buildConsentReceipt(args: ConsentReceiptInput): ConsentReceipt {
  const marketingConsent = args.input.marketingConsent === true;
  return {
    id: args.id,
    campaignId: args.campaignId,
    entryId: args.entryId,
    termsVersionId: args.termsVersionId,
    privacyVersionId: args.privacyVersionId,
    requiredTermsAccepted: args.input.acceptTerms === true && args.input.acknowledgePrivacy === true,
    marketingConsent,
    marketingConsentTextVersion: marketingConsent ? args.marketingConsentTextVersion : undefined,
    ageConfirmed: args.input.ageConfirmed,
    acceptedAt: args.acceptedAt,
    ipHash: args.ipHash,
    userAgent: args.userAgent,
  };
}
