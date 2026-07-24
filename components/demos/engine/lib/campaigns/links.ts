// ═══ Postio Interactive Campaigns: links, QR + attribution (spec §12, §14) ═══
//
// Fourth additive slice of the Interactive Campaigns build (tracker: issue #140,
// Phase 1 #142). Pure string helpers for the public experience URL, the
// Postio-controlled QR redirect, and campaign attribution. No PII is ever
// placed in a URL (spec §12). Imported nowhere yet, so it lands safely ahead of
// the domain/white-label decision in #140.

import { isValidSlug } from './publishGate';

/** Where the public experience is served (spec §2 domain separation). Defaults
 *  to the recommended play host; white-label campaigns pass their own host. */
export interface PublicHost {
  /** e.g. "play.postia.co.uk" or a white-label "campaigns.brand.co.uk". */
  host: string;
  /** Defaults to https; only relaxed for local development. */
  protocol?: 'https' | 'http';
}

const DEFAULT_HOST: PublicHost = { host: 'play.postia.co.uk', protocol: 'https' };

/** Build the canonical public campaign URL: {protocol}://{host}/{brand}/{slug}.
 *  Brand and campaign slugs must be URL/QR-safe (see isValidSlug). */
export function campaignUrl(
  brandSlug: string,
  campaignSlug: string,
  host: PublicHost = DEFAULT_HOST,
): string {
  if (!isValidSlug(brandSlug)) {
    throw new Error(`Invalid brand slug: ${brandSlug}`);
  }
  if (!isValidSlug(campaignSlug)) {
    throw new Error(`Invalid campaign slug: ${campaignSlug}`);
  }
  const protocol = host.protocol ?? 'https';
  return `${protocol}://${host.host}/${brandSlug}/${campaignSlug}`;
}

/** Attribution tags for a generated asset. No personal data (spec §12). */
export interface Attribution {
  /** Source platform, e.g. "instagram", "facebook", "qr", "poster". */
  src?: string;
  /** Placement, e.g. "story", "feed", "bio", "table". */
  placement?: string;
  /** Creative variant id, e.g. "summer-frame-02". */
  creative?: string;
  /** The campaign id or slug the link belongs to. */
  campaign?: string;
}

/** The only keys that may reach a public URL (spec §12). An allowlist, not a
 *  denylist: attribution links get printed on posters and encoded into QR
 *  codes, so an unrecognised key is refused rather than guessed at. A denylist
 *  only catches the spellings someone thought of, and misses `firstName`,
 *  `emailAddress`, `mobile`, `entrantId` and every other variant. */
const ALLOWED_ATTRIBUTION_KEYS = new Set(['src', 'placement', 'creative', 'campaign']);

/** An @-shaped value or a run of 7+ digits is treated as personal data
 *  (an address or a phone number) regardless of which key carries it. */
const EMAIL_SHAPED = /[^\s@]@[^\s@]+\.[^\s@]/;
const PHONE_SHAPED = /\d{7,}/;

/** Append attribution query params to a URL. Only the four attribution keys are
 *  permitted, and their values are checked for personal data, since attribution
 *  links are shared publicly and cannot be recalled once printed or scanned. */
export function withAttribution(url: string, attribution: Attribution): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(attribution)) {
    if (value === undefined || value === '') continue;
    if (!ALLOWED_ATTRIBUTION_KEYS.has(key)) {
      throw new Error(`Refusing to put an unrecognised key in a public URL: ${key}`);
    }
    const text = String(value);
    if (EMAIL_SHAPED.test(text) || PHONE_SHAPED.test(text)) {
      throw new Error(`Refusing to put personal data in a URL: ${key}`);
    }
    params.set(key, text);
  }
  const query = params.toString();
  if (!query) return url;
  return url.includes('?') ? `${url}&${query}` : `${url}?${query}`;
}

/**
 * The Postio-controlled QR redirect (spec §14). A QR encodes a short,
 * revocable redirect on the Postio host rather than the destination directly,
 * so the destination can be updated or revoked and scans can be counted. One
 * token maps to one campaign.
 */
export function qrRedirectUrl(
  token: string,
  host: PublicHost = DEFAULT_HOST,
): string {
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(token)) {
    throw new Error(`Invalid QR token: ${token}`);
  }
  const protocol = host.protocol ?? 'https';
  return `${protocol}://${host.host}/q/${token}`;
}
