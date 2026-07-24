import { NextResponse } from 'next/server';
import { getPublicCampaign, insertEntry } from '@engine/lib/campaigns/serverStore';
import { validateEntry, type EntryValues } from '@engine/lib/campaigns/entryValidation';
import { validateConsent, buildConsentReceipt } from '@engine/lib/campaigns/consent';
import type { CampaignEntry } from '@engine/lib/campaigns/types';

export const dynamic = 'force-dynamic';

interface EntryBody {
  brandSlug: string;
  campaignSlug: string;
  lang: 'en' | 'cy';
  values: Record<string, string>;
  caption?: string;
  photo?: string | null;
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
    ipHash: undefined,
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
