'use client';

import { useMemo, useRef, useState } from 'react';
import type { Campaign, EntryFieldConfig } from '@engine/lib/campaigns/types';
import { validateEntry, type EntryValues } from '@engine/lib/campaigns/entryValidation';
import { validateConsent } from '@engine/lib/campaigns/consent';

// The public entry experience (spec §6, §7). Mobile-first, minimal steps, no
// account. Photo capture uses <input capture> (opens the camera on mobile) with
// an upload fallback; media is read to a data URL for preview and submit. Server
// re-validates everything (never trusts the client). Bilingual EN/CY; the cy
// copy is machine-draft and needs native review before this ships on.

type Lang = 'en' | 'cy';

const COPY = {
  en: {
    notLive: 'This campaign is not open.',
    notStarted: 'This campaign has not started yet.',
    closed: 'This campaign has closed.',
    enter: 'Enter',
    takePhoto: 'Take or upload a photo',
    retake: 'Retake',
    caption: 'Caption (optional)',
    marketing: 'Send me news and offers.',
    acceptTerms: 'I accept the competition terms.',
    acceptPrivacy: 'I have read the privacy notice.',
    ageConfirm: 'I confirm I meet the minimum age.',
    parental: 'I have parental or guardian permission.',
    submit: 'Submit entry',
    submitting: 'Submitting...',
    thanksTitle: 'Thank you',
    thanksBody: 'Your entry has been received and is awaiting review.',
    errGeneric: 'Something went wrong. Please try again.',
    errRequired: 'Please complete the required fields and consents.',
    photoRequired: 'Please add a photo.',
    langSwitch: 'Cymraeg',
  },
  cy: {
    notLive: 'Nid yw’r ymgyrch hon ar agor.',
    notStarted: 'Nid yw’r ymgyrch hon wedi dechrau eto.',
    closed: 'Mae’r ymgyrch hon wedi cau.',
    enter: 'Cystadlu',
    takePhoto: 'Tynnu neu lanlwytho llun',
    retake: 'Ail-dynnu',
    caption: 'Capsiwn (dewisol)',
    marketing: 'Anfonwch newyddion a chynigion ataf.',
    acceptTerms: 'Rwy’n derbyn telerau’r gystadleuaeth.',
    acceptPrivacy: 'Rwyf wedi darllen yr hysbysiad preifatrwydd.',
    ageConfirm: 'Rwy’n cadarnhau fy mod yn cwrdd â’r oedran isaf.',
    parental: 'Mae gennyf ganiatâd rhiant neu warcheidwad.',
    submit: 'Cyflwyno cais',
    submitting: 'Yn cyflwyno...',
    thanksTitle: 'Diolch',
    thanksBody: 'Mae eich cais wedi ei dderbyn ac yn aros am adolygiad.',
    errGeneric: 'Aeth rhywbeth o’i le. Rhowch gynnig arall arni.',
    errRequired: 'Cwblhewch y meysydd a’r caniatâd gofynnol.',
    photoRequired: 'Ychwanegwch lun.',
    langSwitch: 'English',
  },
} as const;

const DATA_FIELD_TYPES = new Set(['name', 'email', 'phone', 'dob', 'postcode', 'country', 'social-handle', 'free-text']);

interface Props {
  campaign: Campaign;
  brandName: string;
  accent: string | null;
  brandSlug: string;
  lang: Lang;
}

export default function CampaignExperience({ campaign, brandName, accent, brandSlug, lang }: Props) {
  const c = COPY[lang];
  const accentColour = accent || '#6d28d9';

  const [values, setValues] = useState<Record<string, string>>({});
  const [photo, setPhoto] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [parental, setParental] = useState(false);
  const [phase, setPhase] = useState<'form' | 'submitting' | 'done'>('form');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const requiresPhoto = useMemo(
    () =>
      campaign.submissionType === 'photo' ||
      campaign.submissionType === 'photo-caption' ||
      campaign.entryFields.some((f) => f.type === 'image'),
    [campaign],
  );
  const wantsAge = campaign.entryFields.some((f) => f.type === 'age-confirm');
  const wantsParental = campaign.entryFields.some((f) => f.type === 'parental-confirmation');
  const wantsMarketing = campaign.entryFields.some((f) => f.type === 'marketing-opt-in');
  const dataFields = campaign.entryFields.filter((f) => DATA_FIELD_TYPES.has(f.type));

  // Servable window check (server enforces this too).
  const now = Date.now();
  if (campaign.status !== 'live') return <Shell brandName={brandName} accent={accentColour}><Message>{c.notLive}</Message></Shell>;
  if (now < Date.parse(campaign.startsAt)) return <Shell brandName={brandName} accent={accentColour}><Message>{c.notStarted}</Message></Shell>;
  if (now > Date.parse(campaign.closesAt)) return <Shell brandName={brandName} accent={accentColour}><Message>{c.closed}</Message></Shell>;

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const fieldLabel = (f: EntryFieldConfig) => (lang === 'cy' ? f.label.cy : f.label.en) || f.key;

  const submit = async () => {
    setError('');
    // Client-side pre-flight (server re-validates authoritatively).
    if (requiresPhoto && !photo) return setError(c.photoRequired);
    const entryValues: EntryValues = {};
    for (const f of campaign.entryFields) {
      if (f.type === 'image') entryValues[f.key] = photo ? 1 : 0;
      else if (f.type === 'marketing-opt-in') entryValues[f.key] = marketing;
      else if (f.type === 'terms-acceptance') entryValues[f.key] = acceptTerms;
      else if (f.type === 'privacy-acknowledgement') entryValues[f.key] = acceptPrivacy;
      else if (f.type === 'age-confirm') entryValues[f.key] = ageConfirmed;
      else if (f.type === 'parental-confirmation') entryValues[f.key] = parental;
      else entryValues[f.key] = values[f.key] ?? '';
    }
    const entryCheck = validateEntry(campaign.entryFields, entryValues);
    const consentCheck = validateConsent(
      { acceptTerms, acknowledgePrivacy: acceptPrivacy, marketingConsent: marketing, ageConfirmed },
      { requiresAgeConfirmation: wantsAge },
    );
    if (!entryCheck.valid || !consentCheck.valid) return setError(c.errRequired);

    setPhase('submitting');
    try {
      const res = await fetch('/api/campaigns/entry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          brandSlug,
          campaignSlug: campaign.slug,
          lang,
          values,
          caption,
          photo,
          consent: { acceptTerms, acknowledgePrivacy: acceptPrivacy, marketingConsent: marketing, ageConfirmed, parental },
        }),
      });
      const json = (await res.json()) as { ok?: boolean };
      if (!res.ok || !json.ok) {
        setPhase('form');
        return setError(c.errGeneric);
      }
      setPhase('done');
    } catch {
      setPhase('form');
      setError(c.errGeneric);
    }
  };

  if (phase === 'done') {
    return (
      <Shell brandName={brandName} accent={accentColour}>
        <h2 className="text-xl font-bold text-zinc-900">{c.thanksTitle}</h2>
        <p className="mt-2 text-sm text-zinc-600">{c.thanksBody}</p>
      </Shell>
    );
  }

  const title = lang === 'cy' ? campaign.name.cy || campaign.name.en : campaign.name.en;
  const prize = campaign.terms?.prizeDescription;
  const prizeText = prize ? (lang === 'cy' ? prize.cy || prize.en : prize.en) : '';

  return (
    <Shell brandName={brandName} accent={accentColour} lang={lang} campaignSlug={campaign.slug} brandSlug={brandSlug}>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{title}</h1>
      {prizeText && <p className="mt-1 text-sm text-zinc-600">{prizeText}</p>}

      <div className="mt-5 space-y-4">
        {requiresPhoto && (
          <div>
            {photo ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="" className="w-full rounded-xl border border-zinc-200 object-cover" />
                <button type="button" onClick={() => { setPhoto(null); if (fileRef.current) fileRef.current.value = ''; }} className="text-sm font-semibold" style={{ color: accentColour }}>
                  {c.retake}
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 px-4 py-8 text-sm font-semibold text-zinc-600">
                {c.takePhoto}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
              </label>
            )}
          </div>
        )}

        {dataFields.map((f) => (
          <label key={f.key} className="block text-[13px] font-semibold text-zinc-700">
            {fieldLabel(f)}{f.required ? ' *' : ''}
            <input
              type={f.type === 'email' ? 'email' : f.type === 'dob' ? 'date' : f.type === 'phone' ? 'tel' : 'text'}
              value={values[f.key] ?? ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': accentColour } as React.CSSProperties}
            />
          </label>
        ))}

        <label className="block text-[13px] font-semibold text-zinc-700">
          {c.caption}
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': accentColour } as React.CSSProperties}
          />
        </label>

        <div className="space-y-2 border-t border-zinc-100 pt-3">
          <Consent checked={acceptTerms} onChange={setAcceptTerms} label={c.acceptTerms} />
          <Consent checked={acceptPrivacy} onChange={setAcceptPrivacy} label={c.acceptPrivacy} />
          {wantsAge && <Consent checked={ageConfirmed} onChange={setAgeConfirmed} label={c.ageConfirm} />}
          {wantsParental && <Consent checked={parental} onChange={setParental} label={c.parental} />}
          {wantsMarketing && <Consent checked={marketing} onChange={setMarketing} label={c.marketing} />}
        </div>

        {error && <p className="text-[13px] text-red-600">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={phase === 'submitting'}
          className="w-full rounded-full px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
          style={{ backgroundColor: accentColour }}
        >
          {phase === 'submitting' ? c.submitting : c.submit}
        </button>
      </div>
    </Shell>
  );
}

function Shell({
  children, brandName, accent, lang, campaignSlug, brandSlug,
}: {
  children: React.ReactNode; brandName: string; accent: string;
  lang?: Lang; campaignSlug?: string; brandSlug?: string;
}) {
  const other: Lang = lang === 'cy' ? 'en' : 'cy';
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-bold" style={{ color: accent }}>{brandName}</span>
          {lang && campaignSlug && brandSlug && (
            <a href={`/c/${brandSlug}/${campaignSlug}?lang=${other}`} className="text-xs font-semibold text-zinc-500 underline">
              {COPY[lang].langSwitch}
            </a>
          )}
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">{children}</div>
      </div>
    </main>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-zinc-600">{children}</p>;
}

function Consent({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-start gap-2 text-[13px] text-zinc-700">
      <input type="checkbox" className="mt-0.5" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
