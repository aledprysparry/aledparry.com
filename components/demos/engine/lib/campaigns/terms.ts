// ═══ Postio Interactive Campaigns: terms + promoter declaration (spec §11) ═══
//
// Sixth additive slice of the Interactive Campaigns build (tracker: issue #140,
// Phase 1 #142). STRUCTURE ONLY. This module defines the shape of the terms /
// privacy / promoter-declaration layer and validates that the required fields
// are present. It deliberately contains NO legal prose: default template copy
// must be authored and reviewed by a UK promotions + data-protection solicitor
// before commercial launch (open decision #4 in #140). Imported nowhere yet.

import type { ID, ISODate } from '../model/types';
import type { LocalisedContent } from './types';

/**
 * The three-layer terms model (spec §11.2):
 *  1. platform  - the organisation's agreement with Postio
 *  2. promoter  - the participant's agreement with the brand/promoter
 *  3. privacy   - how participant data is processed
 */
export type TermsLayer = 'platform' | 'promoter' | 'privacy';

/**
 * A versioned, jurisdiction-specific template. The legal core is locked; only
 * the structured fields below are filled per campaign (spec §11.4). `bodyRef`
 * points at the reviewed template content in the (future) template registry;
 * this module never inlines legal wording.
 */
export interface TermsTemplate {
  id: ID;
  layer: TermsLayer;
  /** Template version accepted at publication, for traceability (spec §11.4). */
  version: string;
  jurisdiction: string; // e.g. "UK"
  locales: Array<'en' | 'cy'>;
  /** Reference to reviewed template content held in the registry. */
  bodyRef: string;
  /** Marks whether the reviewed legal core has been signed off. */
  reviewed: boolean;
}

/**
 * The promoter-terms fields a campaign fills in (spec §11.3). All are required
 * for a promoter-layer terms document to be considered complete. Kept as data
 * so the compliance engine can check completeness without parsing prose.
 */
export interface PromoterTermsFields {
  promoterLegalName: string;
  promoterContact: string;
  campaignName: LocalisedContent;
  opensAt: ISODate;
  closesAt: ISODate;
  territories: string[];
  minimumAge: number;
  exclusions: string;
  entryMethod: string;
  entryLimits: string;
  purchaseRequired: boolean;
  prizeDescription: LocalisedContent;
  prizeCount: number;
  prizeRestrictions: string;
  winnerSelectionMethod: string;
  judgingCriteria?: string;
  winnerNotificationProcess: string;
  claimPeriod: string;
  redrawRules: string;
  fulfilmentTimescale: string;
  invalidEntryTreatment: string;
  contentOwnership: string;
  contentLicence: string;
  publicityRequirements: string;
  dataTreatment: string;
  cancellationConditions: string;
  governingLaw: string;
  complaintRoute: string;
  platformDisclaimer: string;
}

/** Keys of PromoterTermsFields, used to report which are missing. */
export type PromoterTermsFieldKey = keyof PromoterTermsFields;

const REQUIRED_KEYS: PromoterTermsFieldKey[] = [
  'promoterLegalName', 'promoterContact', 'campaignName', 'opensAt', 'closesAt',
  'territories', 'minimumAge', 'exclusions', 'entryMethod', 'entryLimits',
  'purchaseRequired', 'prizeDescription', 'prizeCount', 'prizeRestrictions',
  'winnerSelectionMethod', 'winnerNotificationProcess', 'claimPeriod',
  'redrawRules', 'fulfilmentTimescale', 'invalidEntryTreatment',
  'contentOwnership', 'contentLicence', 'publicityRequirements', 'dataTreatment',
  'cancellationConditions', 'governingLaw', 'complaintRoute', 'platformDisclaimer',
];

function isFilled(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return true; // an explicit choice counts
  // A list of blanks is not a filled list: `territories: ['']` is what an
  // empty repeater row submits, and counting it would let a campaign through
  // the publish gate with no territories actually declared.
  if (Array.isArray(value)) return value.some((entry) => isFilled(entry));
  if (typeof value === 'object') {
    // LocalisedContent: both languages must be non-empty.
    const c = value as Partial<LocalisedContent>;
    return (c.en ?? '').trim().length > 0 && (c.cy ?? '').trim().length > 0;
  }
  return false;
}

export interface PromoterTermsCompleteness {
  complete: boolean;
  missing: PromoterTermsFieldKey[];
}

/** Report which required promoter-terms fields are still missing (spec §11.3). */
export function checkPromoterTerms(
  fields: Partial<PromoterTermsFields>,
): PromoterTermsCompleteness {
  const missing = REQUIRED_KEYS.filter((key) => !isFilled(fields[key]));
  return { complete: missing.length === 0, missing };
}

/**
 * The promoter declaration recorded at the publication gate (spec §11). Every
 * confirmation must be true, and the identifiers below are stored for the audit
 * trail. This is what `promoterDeclarationRecorded` in the publish gate maps to.
 */
export interface PromoterDeclaration {
  promoterInfoCorrect: boolean;
  prizeAccurate: boolean;
  eligibilityCorrect: boolean;
  compliesWithLawAndPlatform: boolean;
  privacyReflectsProcessing: boolean;
  hasAuthorityToPublish: boolean;
  acceptsPromoterResponsibility: boolean;
  // Audit identifiers.
  userId: ID;
  organisationId: ID;
  termsVersion: string;
  campaignVersion: string;
  confirmationTextVersion: string;
  securityEventId?: string;
  recordedAt: ISODate;
}

/** True only when every confirmation in the declaration is affirmed. */
export function declarationAffirmed(declaration: PromoterDeclaration): boolean {
  return (
    declaration.promoterInfoCorrect &&
    declaration.prizeAccurate &&
    declaration.eligibilityCorrect &&
    declaration.compliesWithLawAndPlatform &&
    declaration.privacyReflectsProcessing &&
    declaration.hasAuthorityToPublish &&
    declaration.acceptsPromoterResponsibility
  );
}
