// ═══ Postio Interactive Campaigns: entry validation (spec §7) ═══
//
// Fifth additive slice of the Interactive Campaigns build (tracker: issue #140,
// Phase 1 #142). Pure validation of a submitted entry against a campaign's
// configured entry fields. Only fields the campaign declares are considered
// (ICO data minimisation); required fields must be present and well-formed.
// Imported nowhere yet, so it lands safely ahead of the M0 backend.

import type { EntryFieldConfig, LocalisedContent } from './types';

/** Raw submitted values, keyed by EntryFieldConfig.key. Media fields carry the
 *  count of uploaded media ids; everything else is a string (or boolean for the
 *  acceptance toggles). */
export type EntryValues = Record<string, string | boolean | number | undefined>;

export type FieldErrorCode =
  | 'required'
  | 'invalid-email'
  | 'invalid-phone'
  | 'invalid-postcode'
  | 'not-accepted'
  | 'no-media'
  | 'no-selection'
  | 'invalid-choice'
  | 'invalid-date';

export interface FieldError {
  key: string;
  code: FieldErrorCode;
}

export interface EntryValidation {
  valid: boolean;
  errors: FieldError[];
}

// Deliberately permissive formats: reject the obviously-wrong without blocking
// legitimate international input. Stricter rules belong to the promoter's config.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_SHAPE_RE = /^[+()\d][\d\s()-]{5,}$/;
const UK_POSTCODE_RE = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** E.164 allows up to 15 digits; 7 is the shortest real subscriber number. */
const MIN_PHONE_DIGITS = 7;
const MAX_PHONE_DIGITS = 15;
/** Upper bound on a plausible date of birth. */
const MAX_AGE_YEARS = 120;

/**
 * Shape alone is not enough: `+` followed by five spaces satisfies the
 * permissive shape while containing no number at all. Count the digits too.
 */
export function isValidPhone(text: string): boolean {
  if (!PHONE_SHAPE_RE.test(text)) return false;
  const digits = text.replace(/\D/g, '').length;
  return digits >= MIN_PHONE_DIGITS && digits <= MAX_PHONE_DIGITS;
}

/**
 * A date of birth must be a real calendar day, in the past, and within living
 * memory. The round-trip check is what rejects `2026-02-30`: Date rolls an
 * out-of-range day forward (to 02 March) rather than refusing it, so comparing
 * the parsed parts back against the input is the only reliable test.
 */
export function isValidDob(text: string, now: Date = new Date()): boolean {
  const match = ISO_DATE_RE.exec(text);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return false;
  }
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const earliest = Date.UTC(
    now.getUTCFullYear() - MAX_AGE_YEARS,
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  return parsed.getTime() <= today && parsed.getTime() >= earliest;
}

/** True when the submitted text matches a declared option in either language. */
function isDeclaredOption(text: string, options: LocalisedContent[]): boolean {
  return options.some(
    (option) => option.en.trim() === text || option.cy.trim() === text,
  );
}

/**
 * Blank means "nothing was supplied". A boolean counts as blank here because
 * acceptance toggles and media counts are handled before this point, so the
 * only fields left are text ones, where `false` is not an answer. Without this,
 * a required field submitted as `false` stringifies to "false" and passes.
 */
function isBlank(value: string | boolean | number | undefined): boolean {
  if (value === undefined) return true;
  if (typeof value === 'boolean') return true;
  return typeof value === 'string' && value.trim() === '';
}

/**
 * Validate submitted values against the campaign's entry fields. Returns every
 * error (no short-circuit) so the form can show them all at once. A field's
 * value is only checked when the field is declared on the campaign.
 */
export function validateEntry(
  fields: EntryFieldConfig[],
  values: EntryValues,
): EntryValidation {
  const errors: FieldError[] = [];
  const fail = (key: string, code: FieldErrorCode) => errors.push({ key, code });

  for (const field of fields) {
    const value = values[field.key];
    const blank = isBlank(value);

    // Acceptance toggles must be truthy when required.
    if (
      field.type === 'terms-acceptance' ||
      field.type === 'privacy-acknowledgement' ||
      field.type === 'parental-confirmation' ||
      field.type === 'age-confirm'
    ) {
      if (field.required && value !== true) fail(field.key, 'not-accepted');
      continue;
    }

    // Media fields: required means at least one uploaded item (count > 0).
    if (field.type === 'image' || field.type === 'video' || field.type === 'audio') {
      if (field.required && !(typeof value === 'number' && value > 0)) {
        fail(field.key, 'no-media');
      }
      continue;
    }

    // Marketing opt-in is never required and needs no format check.
    if (field.type === 'marketing-opt-in') continue;

    // Handled before the blank check below: a missing selection is a blank
    // value, so leaving this in the format switch made 'no-selection'
    // unreachable (the switch only runs for non-blank values).
    if (field.type === 'multiple-choice') {
      if (blank) {
        if (field.required) fail(field.key, 'no-selection');
        continue;
      }
      const options = field.options ?? [];
      if (options.length > 0 && !isDeclaredOption(String(value).trim(), options)) {
        fail(field.key, 'invalid-choice');
      }
      continue;
    }

    if (blank) {
      if (field.required) fail(field.key, 'required');
      continue;
    }

    const text = String(value).trim();
    switch (field.type) {
      case 'email':
        if (!EMAIL_RE.test(text)) fail(field.key, 'invalid-email');
        break;
      case 'phone':
        if (!isValidPhone(text)) fail(field.key, 'invalid-phone');
        break;
      case 'postcode':
        if (!UK_POSTCODE_RE.test(text)) fail(field.key, 'invalid-postcode');
        break;
      case 'dob':
        if (!isValidDob(text)) fail(field.key, 'invalid-date');
        break;
      default:
        // name, country, social-handle, free-text: presence is enough here.
        break;
    }
  }

  return { valid: errors.length === 0, errors };
}
