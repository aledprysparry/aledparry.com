import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { getPublicCampaign, insertEntry } from '@engine/lib/campaigns/serverStore';
import { validateEntry, type EntryValues } from '@engine/lib/campaigns/entryValidation';
import { validateConsent, buildConsentReceipt } from '@engine/lib/campaigns/consent';
import type { CampaignEntry } from '@engine/lib/campaigns/types';

export const dynamic = 'force-dynamic';

// Abuse limits. The photo is inlined as a data URL for the POC (R2 is the
// production path), so it dominates the payload; cap it so a single POST cannot
// be used to exhaust the request body or the row size.
const MAX_PHOTO_CHARS = 8_000_000; // ~6MB image as base64
const MAX_TEXT_CHARS = 2000;
const MAX_FIELDS = 40;

/** Privacy-preserving provenance: a salted hash of the client IP, never the IP
 *  itself. Salt from env so hashes are not portable across deployments. */
function hashIp(req: Request): string | undefined {
  const fwd = req.headers.get('x-forwarded-for');
  const ip = fwd ? fwd.split(',')[0].trim() : '';
  if (!ip) return undefined;
  const salt = process.env.CAMPAIGN_IP_SALT ?? 'postio-campaigns';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

interface EntryBody {
  brandSlug: string;
  campaignSlug: string;
  lang: 'en' | 'cy';
  values: Record<string, string>;
  caption?: string;
  photo?: string | null;
  /** Honeypot: a hidden field no human fills. Non-empty means a bot. */
  hp?: string;
  consent: {
    acceptTerms: boolean;
    acknowledgePrivacy: boolean;
    marketingConsent?: boolean;
    ageConfirmed?: boolean;
    parental?: boolean;
  };
}

// Public entry submission (spec §7). Server-authoritative: it re-fetches the
// campaign config, re-runs validateEntry + validateConsent, and never trusts
// the client for eligibility or the closing date.
//
// POC shortcuts (documented for the hardening pass): submittedData is stored
// as plain JSON (NOT encrypted), the photo is inlined as a data URL rather than
// pushed to R2, and there is no bot/rate-limit/virus-scan layer yet.
export async function POST(req: Request) {
  let body: EntryBody;
  try {
    body = (await req.json()) as EntryBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'bad-request' }, { status: 400 });
  }

  // Honeypot: a bot that fills the hidden field gets a success response but no
  // entry is stored (never tip off the bot that it was caught).
  if (typeof body.hp === 'string' && body.hp.trim() !== '') {
    return NextResponse.json({ ok: true });
  }

  // Payload caps.
  if (body.photo) {
    if (!body.photo.startsWith('data:image/') || body.photo.length > MAX_PHOTO_CHARS) {
      return NextResponse.json({ ok: false, error: 'photo-too-large' }, { status: 413 });
    }
  }
  const values = body.values ?? {};
  if (Object.keys(values).length > MAX_FIELDS) {
    return NextResponse.json({ ok: false, error: 'too-many-fields' }, { status: 413 });
  }
  const tooLong =
    (body.caption ?? '').length > MAX_TEXT_CHARS ||
    Object.values(values).some((v) => typeof v === 'string' && v.length > MAX_TEXT_CHARS);
  if (tooLong) {
    return NextResponse.json({ ok: false, error: 'field-too-long' }, { status: 413 });
  }

  const res = await getPublicCampaign(body.brandSlug, body.campaignSlug);
  if (!res) return NextResponse.json({ ok: false, error: 'not-found' }, { status: 404 });
  const { campaign } = res;

  // Server-side eligibility + closing-date enforcement (never trust the client clock).
  const now = Date.now();
  if (campaign.status !== 'live' || now < Date.parse(campaign.startsAt) || now > Date.parse(campaign.closesAt)) {
    return NextResponse.json({ ok: false, error: 'not-open' }, { status: 409 });
  }

  const consent = body.consent ?? { acceptTerms: false, acknowledgePrivacy: false };
  const wantsAge = campaign.entryFields.some((f) => f.type === 'age-confirm');

  const entryValues: EntryValues = {};
  for (const f of campaign.entryFields) {
    if (f.type === 'image') entryValues[f.key] = body.photo ? 1 : 0;
    else if (f.type === 'marketing-opt-in') entryValues[f.key] = consent.marketingConsent === true;
    else if (f.type === 'terms-acceptance') entryValues[f.key] = consent.acceptTerms === true;
    else if (f.type === 'privacy-acknowledgement') entryValues[f.key] = consent.acknowledgePrivacy === true;
    else if (f.type === 'age-confirm') entryValues[f.key] = consent.ageConfirmed === true;
    else if (f.type === 'parental-confirmation') entryValues[f.key] = consent.parental === true;
    else entryValues[f.key] = body.values?.[f.key] ?? '';
  }

  const entryCheck = validateEntry(campaign.entryFields, entryValues);
  const consentCheck = validateConsent(
    {
      acceptTerms: consent.acceptTerms,
      acknowledgePrivacy: consent.acknowledgePrivacy,
      marketingConsent: consent.marketingConsent,
      ageConfirmed: consent.ageConfirmed,
    },
    { requiresAgeConfirmation: wantsAge },
  );
  if (!entryCheck.valid || !consentCheck.valid) {
    return NextResponse.json({ ok: false, error: 'invalid', entryErrors: entryCheck.errors, consentGaps: consentCheck.gaps }, { status: 422 });
  }

  const id = crypto.randomUUID();
  const receiptId = crypto.randomUUID();
  const at = new Date().toISOString();
  const locale: 'en' | 'cy' = body.lang === 'cy' ? 'cy' : 'en';

  const receipt = buildConsentReceipt({
    id: receiptId,
    campaignId: campaign.id,
    entryId: id,
    termsVersionId: `${campaign.id}:terms`,
    privacyVersionId: `${campaign.id}:privacy`,
    acceptedAt: at,
    input: {
      acceptTerms: consent.acceptTerms,
      acknowledgePrivacy: consent.acknowledgePrivacy,
      marketingConsent: consent.marketingConsent,
      ageConfirmed: consent.ageConfirmed,
    },
    marketingConsentTextVersion: consent.marketingConsent ? `${campaign.id}:marketing` : undefined,
    ipHash: hashIp(req),
    userAgent: req.headers.get('user-agent') ?? undefined,
  });

  const entry: CampaignEntry = {
    id,
    campaignId: campaign.id,
    campaignVersionId: campaign.publishedVersionId ?? campaign.id,
    status: 'pending_moderation',
    locale,
    // POC: plain JSON, not encrypted; photo inlined. See file header.
    submittedDataEncrypted: JSON.stringify({ values: body.values ?? {}, caption: body.caption ?? '', photo: body.photo ?? null }),
    mediaIds: [],
    consentReceiptId: receiptId,
    submittedAt: at,
  };

  const ok = await insertEntry(entry, receipt);
  if (!ok) return NextResponse.json({ ok: false, error: 'store' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
