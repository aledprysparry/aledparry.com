// ═══ Postio Interactive Campaigns: entry validation (spec §7) ═══
//
// Fifth additive slice of the Interactive Campaigns build (tracker: issue #140,
// Phase 1 #142). Pure validation of a submitted entry against a campaign's
// configured entry fields. Only fields the campaign declares are considered
// (ICO data minimisation); required fields must be present and well-formed.
// Imported nowhere yet, so it lands safely ahead of the M0 backend.

import type { EntryFieldConfig } from './types';

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
  | 'no-selection';

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
const PHONE_RE = /^[+()\d][\d\s()-]{5,}$/;
const UK_POSTCODE_RE = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/;

function isBlank(value: string | boolean | number | undefined): boolean {
  return value === undefined || (typeof value === 'string' && value.trim() === '');
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
        if (!PHONE_RE.test(text)) fail(field.key, 'invalid-phone');
        break;
      case 'postcode':
        if (!UK_POSTCODE_RE.test(text)) fail(field.key, 'invalid-postcode');
        break;
      case 'multiple-choice': {
        const allowed = (field.options ?? []).length > 0;
        if (allowed && field.required && isBlank(value)) fail(field.key, 'no-selection');
        break;
      }
      default:
        // name, dob, country, social-handle, free-text: presence is enough here.
        break;
    }
  }

  return { valid: errors.length === 0, errors };
}
