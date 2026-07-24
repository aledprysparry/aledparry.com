import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp, ExternalLink, Inbox, Sparkles } from 'lucide-react';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { useStore } from '@engine/lib/store/StoreProvider';
import { Panel, Button, TextInput, Badge } from '@engine/components/ui';
import { campaignsEnabled } from '@engine/lib/campaigns/flags';
import { isValidSlug, evaluatePublishGate, type PublishReadiness } from '@engine/lib/campaigns/publishGate';
import { checkPromoterTerms, type PromoterTermsFields } from '@engine/lib/campaigns/terms';
import { newId, now } from '@engine/lib/store/persist';
import { slugify } from '@engine/lib/campaigns/slug';
import type { Campaign, CampaignType, CampaignStatus, EntryFieldConfig } from '@engine/lib/campaigns/types';

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
    edit: 'Edit', del: 'Delete', readiness: 'Publish readiness',
    moderationLabel: 'Moderation', modeManual: 'Manual review', modeAi: 'AI-assisted',
    entryFieldsLabel: 'Entry fields', required: 'Required', addField: 'Add field', noFields: 'No entry fields yet.',
    termsSection: 'Terms & promoter details', termsHint: 'Opening and closing dates are taken from the campaign dates above.',
    privacySection: 'Privacy notice',
    approvalsLabel: 'Approvals', promoterDeclared: 'I accept promoter responsibility and confirm the details are correct.', ownerPreview: 'The owner has approved the final preview.',
    noBrands: 'Create a brand first, then start a campaign.',
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
    edit: 'Golygu', del: 'Dileu', readiness: 'Parodrwydd cyhoeddi',
    moderationLabel: 'Cymedroli', modeManual: 'Adolygu â llaw', modeAi: 'Gyda chymorth AI',
    entryFieldsLabel: 'Meysydd cystadlu', required: 'Gofynnol', addField: 'Ychwanegu maes', noFields: 'Dim meysydd cystadlu eto.',
    termsSection: 'Telerau a manylion hyrwyddwr', termsHint: 'Cymerir y dyddiadau agor a chau o ddyddiadau’r ymgyrch uchod.',
    privacySection: 'Hysbysiad preifatrwydd',
    approvalsLabel: 'Cymeradwyaethau', promoterDeclared: 'Rwy’n derbyn cyfrifoldeb fel hyrwyddwr ac yn cadarnhau bod y manylion yn gywir.', ownerPreview: 'Mae’r perchennog wedi cymeradwyo’r rhagolwg terfynol.',
    noBrands: 'Crëwch frand yn gyntaf, yna dechreuwch ymgyrch.',
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

// Entry-field types the Builder can add (single fields + consent toggles). Media
// and multiple-choice need their own sub-editors, so they land in a later slice.
// (cy machine-draft, flag for native review before the flag ships on.)
const FIELD_TYPES: { type: EntryFieldConfig['type']; en: string; cy: string }[] = [
  { type: 'name', en: 'Name', cy: 'Enw' },
  { type: 'email', en: 'Email', cy: 'E-bost' },
  { type: 'phone', en: 'Phone', cy: 'Ffôn' },
  { type: 'dob', en: 'Date of birth', cy: 'Dyddiad geni' },
  { type: 'age-confirm', en: 'Age confirmation', cy: 'Cadarnhau oedran' },
  { type: 'postcode', en: 'Postcode', cy: 'Cod post' },
  { type: 'country', en: 'Country', cy: 'Gwlad' },
  { type: 'social-handle', en: 'Social handle', cy: 'Dolen gymdeithasol' },
  { type: 'image', en: 'Image', cy: 'Llun' },
  { type: 'free-text', en: 'Free text', cy: 'Testun rhydd' },
  { type: 'marketing-opt-in', en: 'Marketing opt-in', cy: 'Optio i mewn i farchnata' },
  { type: 'terms-acceptance', en: 'Accept terms', cy: 'Derbyn telerau' },
  { type: 'privacy-acknowledgement', en: 'Privacy acknowledgement', cy: 'Cydnabod preifatrwydd' },
  { type: 'parental-confirmation', en: 'Parental confirmation', cy: 'Cadarnhad rhiant' },
];

function fieldLabel(t: EntryFieldConfig['type']): { en: string; cy: string } {
  const found = FIELD_TYPES.find((x) => x.type === t);
  return found ? { en: found.en, cy: found.cy } : { en: t, cy: t };
}

// Promoter terms fields (spec §11.3). opensAt/closesAt are omitted here and
// auto-filled from the campaign dates on save. (cy machine-draft, flag for review.)
type TermsKind = 'text' | 'number' | 'bool' | 'localised' | 'list';
const TERMS_FIELDS: { key: keyof PromoterTermsFields; kind: TermsKind; en: string; cy: string }[] = [
  { key: 'promoterLegalName', kind: 'text', en: 'Promoter legal name', cy: 'Enw cyfreithiol yr hyrwyddwr' },
  { key: 'promoterContact', kind: 'text', en: 'Promoter contact', cy: 'Cyswllt yr hyrwyddwr' },
  { key: 'campaignName', kind: 'localised', en: 'Campaign name', cy: 'Enw’r ymgyrch' },
  { key: 'territories', kind: 'list', en: 'Territories (comma-separated)', cy: 'Tiriogaethau (gwahanu â choma)' },
  { key: 'minimumAge', kind: 'number', en: 'Minimum age', cy: 'Oedran isaf' },
  { key: 'exclusions', kind: 'text', en: 'Excluded participants', cy: 'Cyfranogwyr wedi eu heithrio' },
  { key: 'entryMethod', kind: 'text', en: 'Entry method', cy: 'Dull cystadlu' },
  { key: 'entryLimits', kind: 'text', en: 'Entry limits', cy: 'Terfynau cystadlu' },
  { key: 'purchaseRequired', kind: 'bool', en: 'Purchase required', cy: 'Angen prynu' },
  { key: 'prizeDescription', kind: 'localised', en: 'Prize description', cy: 'Disgrifiad y wobr' },
  { key: 'prizeCount', kind: 'number', en: 'Number of prizes', cy: 'Nifer y gwobrau' },
  { key: 'prizeRestrictions', kind: 'text', en: 'Prize restrictions', cy: 'Cyfyngiadau’r wobr' },
  { key: 'winnerSelectionMethod', kind: 'text', en: 'Winner selection method', cy: 'Dull dewis enillydd' },
  { key: 'judgingCriteria', kind: 'text', en: 'Judging criteria (optional)', cy: 'Meini prawf beirniadu (dewisol)' },
  { key: 'winnerNotificationProcess', kind: 'text', en: 'Winner notification', cy: 'Hysbysu enillydd' },
  { key: 'claimPeriod', kind: 'text', en: 'Claim period', cy: 'Cyfnod hawlio' },
  { key: 'redrawRules', kind: 'text', en: 'Redraw rules', cy: 'Rheolau ail-dynnu' },
  { key: 'fulfilmentTimescale', kind: 'text', en: 'Fulfilment timescale', cy: 'Amserlen cyflawni' },
  { key: 'invalidEntryTreatment', kind: 'text', en: 'Invalid entries', cy: 'Ceisiadau annilys' },
  { key: 'contentOwnership', kind: 'text', en: 'Content ownership', cy: 'Perchnogaeth cynnwys' },
  { key: 'contentLicence', kind: 'text', en: 'Content licence', cy: 'Trwydded cynnwys' },
  { key: 'publicityRequirements', kind: 'text', en: 'Publicity requirements', cy: 'Gofynion cyhoeddusrwydd' },
  { key: 'dataTreatment', kind: 'text', en: 'Data treatment', cy: 'Trin data' },
  { key: 'cancellationConditions', kind: 'text', en: 'Cancellation conditions', cy: 'Amodau canslo' },
  { key: 'governingLaw', kind: 'text', en: 'Governing law', cy: 'Cyfraith lywodraethol' },
  { key: 'complaintRoute', kind: 'text', en: 'Complaint route', cy: 'Llwybr cwyno' },
  { key: 'platformDisclaimer', kind: 'text', en: 'Platform disclaimer', cy: 'Ymwadiad platfform' },
];

function termsValueFilled(v: unknown): boolean {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v === 'boolean') return true;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') {
    const lc = v as { en?: string; cy?: string };
    return (lc.en ?? '').trim().length > 0 && (lc.cy ?? '').trim().length > 0;
  }
  return false;
}

// Core privacy-notice fields (spec §18.2). Kept to the required text controls;
// automated-decision / publication / marketing flags are a later slice.
// (cy machine-draft, flag for native review before the flag ships on.)
const PRIVACY_FIELDS: { key: string; en: string; cy: string }[] = [
  { key: 'purpose', en: 'Purpose of collection', cy: 'Diben casglu' },
  { key: 'lawfulBasis', en: 'Lawful basis', cy: 'Sail gyfreithlon' },
  { key: 'retentionPeriod', en: 'Retention period', cy: 'Cyfnod cadw' },
  { key: 'dataRecipients', en: 'Data recipients', cy: 'Derbynwyr data' },
  { key: 'controllerContact', en: 'Controller contact', cy: 'Cyswllt rheolydd' },
];

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
  const [entryFields, setEntryFields] = useState<EntryFieldConfig[]>([]);
  const [newFieldType, setNewFieldType] = useState<EntryFieldConfig['type']>('name');
  const [terms, setTerms] = useState<Record<string, unknown>>({});
  const [showTerms, setShowTerms] = useState(false);
  const [privacy, setPrivacy] = useState<Record<string, string>>({});
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [promoterDeclared, setPromoterDeclared] = useState(false);
  const [ownerApprovedPreview, setOwnerApprovedPreview] = useState(false);
  const [moderationMode, setModerationMode] = useState<'manual' | 'ai-assisted'>('manual');
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
    setEntryFields([]);
    setNewFieldType('name');
    setTerms({});
    setShowTerms(false);
    setPrivacy({});
    setShowPrivacy(false);
    setPromoterDeclared(false);
    setOwnerApprovedPreview(false);
    setModerationMode('manual');
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
    setEntryFields(cam.entryFields.map((f) => ({ ...f })));
    setTerms(cam.terms ? { ...cam.terms } : {});
    setPrivacy(cam.privacy ? { ...cam.privacy } : {});
    setPromoterDeclared(cam.approvals?.promoterDeclared === true);
    setOwnerApprovedPreview(cam.approvals?.ownerApprovedPreview === true);
    setModerationMode(cam.moderationConfig?.mode === 'ai-assisted' ? 'ai-assisted' : 'manual');
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
      entryFields,
      moderationConfig: { ...(existing?.moderationConfig ?? {}), mode: moderationMode },
      winnerConfig: existing?.winnerConfig ?? {},
      retentionConfig: existing?.retentionConfig ?? {},
      // opensAt/closesAt mirror the campaign dates so the terms stay consistent.
      terms: { ...terms, opensAt: new Date(startsAt).toISOString(), closesAt: new Date(closesAt).toISOString() } as Partial<PromoterTermsFields>,
      privacy,
      approvals: { promoterDeclared, ownerApprovedPreview },
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

  const addField = () => {
    const meta = fieldLabel(newFieldType);
    let key: string = newFieldType;
    let n = 2;
    while (entryFields.some((f) => f.key === key)) key = `${newFieldType}-${n++}`;
    const required = newFieldType === 'terms-acceptance' || newFieldType === 'privacy-acknowledgement';
    setEntryFields((prev) => [...prev, { key, type: newFieldType, label: { en: meta.en, cy: meta.cy }, required }]);
  };
  const setTermsField = (key: string, value: unknown) => setTerms((prev) => ({ ...prev, [key]: value }));
  const termsFilled = TERMS_FIELDS.filter((f) => termsValueFilled(terms[f.key])).length;
  const setPrivacyField = (key: string, value: string) => setPrivacy((prev) => ({ ...prev, [key]: value }));
  const privacyFilled = PRIVACY_FIELDS.filter((f) => (privacy[f.key] ?? '').trim().length > 0).length;
  const removeField = (key: string) => setEntryFields((prev) => prev.filter((f) => f.key !== key));
  const toggleRequired = (key: string) =>
    setEntryFields((prev) => prev.map((f) => (f.key === key ? { ...f, required: !f.required } : f)));

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
            <label className="block text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">
              {c.moderationLabel}
              <select
                className={`mt-1 ${SELECT_CLASS}`}
                value={moderationMode}
                onChange={(e) => setModerationMode(e.target.value as 'manual' | 'ai-assisted')}
              >
                <option value="manual">{c.modeManual}</option>
                <option value="ai-assisted">{c.modeAi}</option>
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
            <div className="sm:col-span-2">
              <div className="text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">{c.entryFieldsLabel}</div>
              {entryFields.length === 0 ? (
                <p className="mt-1 text-[12px] text-zinc-400 dark:text-zinc-500">{c.noFields}</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {entryFields.map((f) => (
                    <li
                      key={f.key}
                      className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-1.5 dark:border-zinc-700"
                    >
                      <span className="text-[12px] text-zinc-700 dark:text-zinc-200">
                        {lang === 'cy' ? fieldLabel(f.type).cy : fieldLabel(f.type).en}
                      </span>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1 text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                          <input type="checkbox" checked={f.required} onChange={() => toggleRequired(f.key)} /> {c.required}
                        </label>
                        <button
                          type="button"
                          aria-label={c.del}
                          onClick={() => removeField(f.key)}
                          className="text-zinc-400 hover:text-red-500"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2 flex items-center gap-2">
                <select
                  className={SELECT_CLASS}
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as EntryFieldConfig['type'])}
                >
                  {FIELD_TYPES.map((ft) => (
                    <option key={ft.type} value={ft.type}>{lang === 'cy' ? ft.cy : ft.en}</option>
                  ))}
                </select>
                <Button variant="subtle" onClick={addField}>
                  <Plus size={14} /> {c.addField}
                </Button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => setShowTerms((v) => !v)}
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-300"
              >
                {c.termsSection}: {termsFilled}/{TERMS_FIELDS.length}
                {showTerms ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">{c.termsHint}</p>
              {showTerms && (
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {TERMS_FIELDS.map((f) => {
                    const label = lang === 'cy' ? f.cy : f.en;
                    const v = terms[f.key];
                    if (f.kind === 'bool') {
                      return (
                        <label key={f.key} className="flex items-center gap-2 text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">
                          <input type="checkbox" checked={v === true} onChange={(e) => setTermsField(f.key, e.target.checked)} />
                          {label}
                        </label>
                      );
                    }
                    if (f.kind === 'localised') {
                      const lc = (v as { en?: string; cy?: string }) ?? {};
                      return (
                        <div key={f.key} className="sm:col-span-2 grid gap-2 sm:grid-cols-2">
                          <label className="block text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">
                            {label} (EN)
                            <TextInput className="mt-1" value={lc.en ?? ''} onChange={(e) => setTermsField(f.key, { ...lc, en: e.target.value })} />
                          </label>
                          <label className="block text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">
                            {label} (CY)
                            <TextInput className="mt-1" value={lc.cy ?? ''} onChange={(e) => setTermsField(f.key, { ...lc, cy: e.target.value })} />
                          </label>
                        </div>
                      );
                    }
                    if (f.kind === 'list') {
                      const arr = (v as string[]) ?? [];
                      return (
                        <label key={f.key} className="block text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">
                          {label}
                          <TextInput
                            className="mt-1"
                            value={arr.join(', ')}
                            placeholder="UK, IE"
                            onChange={(e) => setTermsField(f.key, e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                          />
                        </label>
                      );
                    }
                    if (f.kind === 'number') {
                      return (
                        <label key={f.key} className="block text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">
                          {label}
                          <TextInput
                            className="mt-1"
                            type="number"
                            value={v === undefined || v === null ? '' : String(v)}
                            onChange={(e) => setTermsField(f.key, e.target.value === '' ? undefined : Number(e.target.value))}
                          />
                        </label>
                      );
                    }
                    return (
                      <label key={f.key} className="block text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">
                        {label}
                        <TextInput className="mt-1" value={(v as string) ?? ''} onChange={(e) => setTermsField(f.key, e.target.value)} />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => setShowPrivacy((v) => !v)}
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-300"
              >
                {c.privacySection}: {privacyFilled}/{PRIVACY_FIELDS.length}
                {showPrivacy ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              {showPrivacy && (
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {PRIVACY_FIELDS.map((f) => (
                    <label key={f.key} className="block text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">
                      {lang === 'cy' ? f.cy : f.en}
                      <TextInput className="mt-1" value={privacy[f.key] ?? ''} onChange={(e) => setPrivacyField(f.key, e.target.value)} />
                    </label>
                  ))}
                </div>
              )}
            </div>

            {isEditing && (
              <div className="sm:col-span-2">
                <div className="text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">{c.approvalsLabel}</div>
                <label className="mt-2 flex items-start gap-2 text-[12px] font-normal text-zinc-600 dark:text-zinc-300">
                  <input type="checkbox" className="mt-0.5" checked={promoterDeclared} onChange={(e) => setPromoterDeclared(e.target.checked)} />
                  {c.promoterDeclared}
                </label>
                <label className="mt-1 flex items-start gap-2 text-[12px] font-normal text-zinc-600 dark:text-zinc-300">
                  <input type="checkbox" className="mt-0.5" checked={ownerApprovedPreview} onChange={(e) => setOwnerApprovedPreview(e.target.checked)} />
                  {c.ownerPreview}
                </label>
              </div>
            )}

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
            const readiness: PublishReadiness = {
              ...POC_READINESS,
              termsComplete: checkPromoterTerms((cam.terms ?? {}) as Partial<PromoterTermsFields>).complete,
              privacyComplete: PRIVACY_FIELDS.every((f) => (cam.privacy?.[f.key] ?? '').trim().length > 0),
              promoterDeclarationRecorded: cam.approvals?.promoterDeclared === true,
              ownerApprovedPreview: cam.approvals?.ownerApprovedPreview === true,
            };
            const unmet = new Set(evaluatePublishGate(cam, readiness).unmet.map((u) => u.id as string));
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
                    <Link
                      to={`/campaigns/${cam.id}/entries`}
                      aria-label="Review entries"
                      className="inline-flex items-center gap-0.5 rounded-full p-2 text-[11px] font-semibold text-zinc-400 hover:text-violet-600 dark:hover:text-violet-300"
                    >
                      <Inbox size={14} />
                      {store.entriesByCampaign(cam.id).length > 0 && store.entriesByCampaign(cam.id).length}
                    </Link>
                    <a
                      href={`/c/${slugify(brandName(cam.brandId))}/${cam.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open public page"
                      className="inline-flex items-center justify-center rounded-full p-2 text-zinc-400 hover:text-violet-600 dark:hover:text-violet-300"
                    >
                      <ExternalLink size={14} />
                    </a>
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
