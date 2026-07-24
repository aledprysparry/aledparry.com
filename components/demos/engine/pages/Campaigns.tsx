import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { useStore } from '@engine/lib/store/StoreProvider';
import { Panel, Button, TextInput, Badge } from '@engine/components/ui';
import { campaignsEnabled } from '@engine/lib/campaigns/flags';
import { isValidSlug, evaluatePublishGate, type PublishReadiness } from '@engine/lib/campaigns/publishGate';
import { newId, now } from '@engine/lib/store/persist';
import type { Campaign, CampaignType, CampaignStatus } from '@engine/lib/campaigns/types';

// Interactive Campaigns Builder (flag-gated). Create / edit / list campaigns,
// persisted through the Store (localStorage + Supabase when configured).
// Spec: POSTIO_CAMPAIGN_MICROSITES.md; tracker #140, #142.
//
// Copy is local + bilingual while this is early. The `cy` lines are
// machine-draft and MUST have a native Welsh review before the flag ships on.
const COPY = {
  en: {
    back: 'Dashboard', title: 'Interactive Campaigns', status: 'In development',
    heading: 'New campaign', editing: 'Edit campaign', brand: 'Brand', pickBrand: 'Select a brand',
    nameEn: 'Name (English)', nameCy: 'Name (Welsh)', slug: 'URL slug', type: 'Type', statusLabel: 'Status',
    starts: 'Opens', closes: 'Closes', create: 'Create campaign', update: 'Save changes', cancel: 'Cancel',
    slugHint: 'Lowercase letters, numbers and hyphens.',
    none: 'No campaigns yet. Create one above.',
    edit: 'Edit', del: 'Delete', readiness: 'Publish readiness', noBrands: 'Create a brand first, then start a campaign.',
    errFields: 'Fill in a brand, name, valid slug and both dates.',
    errSlug: 'That slug is already used for this brand.',
  },
  cy: {
    back: 'Dangosfwrdd', title: 'Ymgyrchoedd Rhyngweithiol', status: 'Yn cael ei ddatblygu',
    heading: 'Ymgyrch newydd', editing: 'Golygu ymgyrch', brand: 'Brand', pickBrand: 'Dewiswch frand',
    nameEn: 'Enw (Saesneg)', nameCy: 'Enw (Cymraeg)', slug: 'Slug URL', type: 'Math', statusLabel: 'Statws',
    starts: 'Yn agor', closes: 'Yn cau', create: 'Creu ymgyrch', update: 'Cadw newidiadau', cancel: 'Canslo',
    slugHint: 'Llythrennau bach, rhifau a chysylltnodau.',
    none: 'Dim ymgyrchoedd eto. Crëwch un uchod.',
    edit: 'Golygu', del: 'Dileu', readiness: 'Parodrwydd cyhoeddi', noBrands: 'Crëwch frand yn gyntaf, yna dechreuwch ymgyrch.',
    errFields: 'Llenwch frand, enw, slug dilys a’r ddau ddyddiad.',
    errSlug: 'Mae’r slug yna eisoes yn cael ei ddefnyddio ar gyfer y brand hwn.',
  },
} as const;

const TYPES: CampaignType[] = ['photo', 'selfie', 'quiz', 'poll', 'game', 'result'];
const STATUSES: CampaignStatus[] = ['draft', 'scheduled', 'live', 'paused', 'closed', 'completed', 'archived', 'cancelled'];

// The spec §15 go-live checklist, with bilingual labels. Order matches the spec.
// (cy machine-draft, flag for native review before the flag ships on.)
const REQUIREMENTS: { id: string; en: string; cy: string }[] = [
  { id: 'experience-validated', en: 'Experience validated', cy: 'Profiad wedi ei ddilysu' },
  { id: 'social-assets-exist', en: 'Social assets generated', cy: 'Asedau cymdeithasol wedi eu creu' },
  { id: 'public-url-resolves', en: 'Public URL resolves', cy: 'URL cyhoeddus yn gweithio' },
  { id: 'terms-complete', en: 'Terms complete', cy: 'Telerau’n gyflawn' },
  { id: 'privacy-complete', en: 'Privacy notice complete', cy: 'Hysbysiad preifatrwydd yn gyflawn' },
  { id: 'promoter-declaration-recorded', en: 'Promoter declaration recorded', cy: 'Datganiad hyrwyddwr wedi ei gofnodi' },
  { id: 'dates-valid', en: 'Dates valid', cy: 'Dyddiadau dilys' },
  { id: 'entry-method-works', en: 'Entry method works', cy: 'Dull cystadlu’n gweithio' },
  { id: 'upload-scanning-works', en: 'Upload scanning works', cy: 'Sganio lanlwythiadau’n gweithio' },
  { id: 'moderation-configured', en: 'Moderation configured', cy: 'Cymedroli wedi ei osod' },
  { id: 'languages-complete', en: 'Languages complete', cy: 'Ieithoedd yn gyflawn' },
  { id: 'accessibility-passed', en: 'Accessibility checks passed', cy: 'Gwiriadau hygyrchedd wedi pasio' },
  { id: 'owner-approved-preview', en: 'Owner approved preview', cy: 'Perchennog wedi cymeradwyo’r rhagolwg' },
];

// External readiness signals are not tracked yet (they arrive with the entry,
// asset, terms and moderation flows). Passing them all false means the checklist
// honestly shows what still has to be built before a campaign can go live; the
// gate derives dates / moderation / languages from the campaign itself.
const POC_READINESS: PublishReadiness = {
  experienceValidated: false, socialAssetsExist: false, publicUrlResolves: false,
  termsComplete: false, privacyComplete: false, promoterDeclarationRecorded: false,
  entryMethodWorks: false, uploadScanningWorks: false, accessibilityPassed: false, ownerApprovedPreview: false,
};

const SELECT_CLASS =
  'eng-control w-full rounded-lg bg-white border border-zinc-200 px-3 text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100';

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export default function Campaigns() {
  const { lang } = useI18n();
  const store = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openReadiness, setOpenReadiness] = useState<string | null>(null);
  const [brandId, setBrandId] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameCy, setNameCy] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<CampaignType>('photo');
  const [status, setStatus] = useState<CampaignStatus>('draft');
  const [startsAt, setStartsAt] = useState('');
  const [closesAt, setClosesAt] = useState('');
  const [error, setError] = useState('');

  if (!campaignsEnabled()) return <Navigate to="/" replace />;
  const c = COPY[lang] ?? COPY.en;

  const isEditing = editingId !== null;
  const slugOk = slug === '' || isValidSlug(slug);
  const canSave = Boolean(brandId && nameEn.trim() && slug.trim() && isValidSlug(slug) && startsAt && closesAt);

  const resetForm = () => {
    setEditingId(null);
    setBrandId('');
    setNameEn('');
    setNameCy('');
    setSlug('');
    setType('photo');
    setStatus('draft');
    setStartsAt('');
    setClosesAt('');
    setError('');
  };

  const startEdit = (cam: Campaign) => {
    setEditingId(cam.id);
    setBrandId(cam.brandId);
    setNameEn(cam.name.en);
    setNameCy(cam.name.cy);
    setSlug(cam.slug);
    setType(cam.type);
    setStatus(cam.status);
    setStartsAt(cam.startsAt.slice(0, 10));
    setClosesAt(cam.closesAt.slice(0, 10));
    setError('');
  };

  const submit = () => {
    if (!canSave) return setError(c.errFields);
    if (store.campaigns.some((x) => x.brandId === brandId && x.slug === slug.trim() && x.id !== editingId)) {
      return setError(c.errSlug);
    }
    const existing = editingId ? store.getCampaign(editingId) : undefined;
    const campaign: Campaign = {
      id: existing?.id ?? newId('cmp'),
      organisationId: existing?.organisationId ?? brandId, // POC: org == brand until an org model exists
      brandId: existing?.brandId ?? brandId,
      ownerId: existing?.ownerId ?? 'self', // POC placeholder until auth
      promoterId: existing?.promoterId ?? brandId, // POC: promoter defaults to the brand
      name: { en: nameEn.trim(), cy: nameCy.trim() || nameEn.trim() },
      slug: slug.trim(),
      type,
      status: existing ? status : 'draft',
      locales: existing?.locales ?? ['en', 'cy'],
      submissionType: existing?.submissionType ?? 'photo',
      startsAt: new Date(startsAt).toISOString(),
      closesAt: new Date(closesAt).toISOString(),
      experienceConfig: existing?.experienceConfig ?? {},
      eligibilityConfig: existing?.eligibilityConfig ?? {},
      entryFields: existing?.entryFields ?? [],
      moderationConfig: existing?.moderationConfig ?? {},
      winnerConfig: existing?.winnerConfig ?? {},
      retentionConfig: existing?.retentionConfig ?? {},
      captcha: existing?.captcha ?? 'invisible',
      createdAt: existing?.createdAt ?? now(),
      updatedAt: now(),
    };
    store.saveCampaign(campaign);
    resetForm();
  };

  const remove = (id: string) => {
    if (editingId === id) resetForm();
    store.deleteCampaign(id);
  };

  const brandName = (id: string) => store.brands.find((b) => b.id === id)?.name ?? '?';

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Link
        to="/"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft size={14} /> {c.back}
      </Link>

      <div className="flex items-center gap-2">
        <h1 className="text-[22px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[26px]">
          {c.title}
        </h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
          <Sparkles size={12} /> {c.status}
        </span>
      </div>

      {/* Create / edit */}
      <Panel className="mt-6 p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {isEditing ? c.editing : c.heading}
        </h2>
        {store.brands.length === 0 ? (
          <p className="mt-4 text-[13px] text-zinc-500 dark:text-zinc-400">{c.noBrands}</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2 block text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">
              {c.brand}
              <select
                className={`mt-1 ${SELECT_CLASS}`}
                value={brandId}
                disabled={isEditing}
                onChange={(e) => setBrandId(e.target.value)}
              >
                <option value="">{c.pickBrand}</option>
                {store.brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">
              {c.nameEn}
              <TextInput className="mt-1" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
            </label>
            <label className="block text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">
              {c.nameCy}
              <TextInput className="mt-1" value={nameCy} onChange={(e) => setNameCy(e.target.value)} />
            </label>
            <label className="block text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">
              {c.slug}
              <TextInput
                className={`mt-1 ${slugOk ? '' : 'border-red-400 dark:border-red-500'}`}
                value={slug}
                placeholder="summer2027"
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
              />
              <span className="mt-1 block text-[11px] font-normal text-zinc-400">{c.slugHint}</span>
            </label>
            <label className="block text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">
              {c.type}
              <select className={`mt-1 ${SELECT_CLASS}`} value={type} onChange={(e) => setType(e.target.value as CampaignType)}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            {isEditing && (
              <label className="block text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">
                {c.statusLabel}
                <select className={`mt-1 ${SELECT_CLASS}`} value={status} onChange={(e) => setStatus(e.target.value as CampaignStatus)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="block text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">
              {c.starts}
              <TextInput className="mt-1" type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </label>
            <label className="block text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">
              {c.closes}
              <TextInput className="mt-1" type="date" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
            </label>
            <div className="sm:col-span-2 flex items-center gap-3">
              <Button onClick={submit} disabled={!canSave}>
                <Plus size={14} /> {isEditing ? c.update : c.create}
              </Button>
              {isEditing && (
                <Button variant="subtle" onClick={resetForm}>
                  <X size={14} /> {c.cancel}
                </Button>
              )}
              {error && <span className="text-[12px] text-red-500">{error}</span>}
            </div>
          </div>
        )}
      </Panel>

      {/* Existing campaigns */}
      {store.campaigns.length > 0 && (
        <div className="mt-4 space-y-2">
          {store.campaigns.map((cam) => {
            const unmet = new Set(evaluatePublishGate(cam, POC_READINESS).unmet.map((u) => u.id as string));
            const metCount = REQUIREMENTS.length - unmet.size;
            const open = openReadiness === cam.id;
            return (
              <Panel key={cam.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[14px] font-semibold text-zinc-900 dark:text-zinc-50">
                        {cam.name[lang] || cam.name.en}
                      </span>
                      <Badge tone="accent">{cam.type}</Badge>
                      <Badge tone="muted">{cam.status}</Badge>
                    </div>
                    <div className="mt-0.5 truncate text-[12px] text-zinc-500 dark:text-zinc-400">
                      {brandName(cam.brandId)} · /{cam.slug} · {fmtDate(cam.startsAt)}–{fmtDate(cam.closesAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" aria-label={c.edit} onClick={() => startEdit(cam)}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" aria-label={c.del} onClick={() => remove(cam.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setOpenReadiness(open ? null : cam.id)}
                  className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-300"
                >
                  {c.readiness}: {metCount}/{REQUIREMENTS.length}
                  {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {open && (
                  <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                    {REQUIREMENTS.map((r) => {
                      const ok = !unmet.has(r.id);
                      return (
                        <li key={r.id} className="flex items-center gap-2 text-[12px]">
                          {ok ? (
                            <Check size={13} className="shrink-0 text-emerald-500" />
                          ) : (
                            <X size={13} className="shrink-0 text-zinc-300 dark:text-zinc-600" />
                          )}
                          <span className={ok ? 'text-zinc-600 dark:text-zinc-300' : 'text-zinc-400 dark:text-zinc-500'}>
                            {lang === 'cy' ? r.cy : r.en}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
