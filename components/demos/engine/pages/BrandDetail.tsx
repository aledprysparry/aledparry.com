import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Plus, Trash2, ImagePlus, Sparkles, Copy, ExternalLink, ArrowLeft, Wand2,
  Pencil, FolderPlus, Folder as FolderIcon, Search, Inbox, Layers, Film,
  Download, Loader2, ChevronDown, Image as ImageIcon,
} from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { Button, Panel, Badge, TextInput, EmptyState } from '@engine/components/ui';
import { Menu, Tabs, SegmentedControl, useOverlay, type MenuItem } from '@engine/components/primitives';
import { TEMPLATE_KIND_LIST, getKind } from '@engine/lib/templates/registry';
import { PLATFORM_PRESETS } from '@engine/lib/platforms/presets';
import { analyseImages, deriveSuggestions } from '@engine/lib/audit/analyseImages';
import { fileToStoredDataURL } from '@engine/lib/util/imageScale';
import { LAYOUTS, type GenStyle } from '@engine/lib/freeform/layouts';
import { buildTemplateFromImage, type TemplateMode } from '@engine/lib/audit/templateFromImage';
import ElementPreview from '@engine/components/ElementPreview';
import SlideCanvas from '@engine/components/SlideCanvas';
import AnimatedCanvas from '@engine/components/AnimatedCanvas';
import { platformToRatio } from '@engine/lib/templates/registry';
import { effectiveCopy, graphicOverrides } from '@engine/lib/carousel/copy';
import type { StringKey } from '@engine/lib/i18n/strings';
import type { AssetType, SocialAccount, GraphicElement, Template, Brand, Clip, GeneratedGraphic } from '@engine/lib/model/types';
import type { CarouselCopy } from '@engine/lib/carousel/types';

// Three top-level groups: the things you've MADE (Content = graphics + clips),
// your BRAND setup (overview + assets + templates), and analysis (Insights,
// formerly "Social"). Each top tab has its own sub-navigation.
type Tab = 'content' | 'brand' | 'insights';
const TABS: { id: Tab; key: StringKey }[] = [
  { id: 'content', key: 'brand.tab.content' },
  { id: 'brand', key: 'brand.tab.brand' },
  { id: 'insights', key: 'brand.tab.insights' },
];

const ASSET_TYPES: AssetType[] = ['logo', 'background', 'font', 'gif', 'image', 'icon', 'product', 'reference', 'social-post'];
const SOCIAL_PLATFORMS: SocialAccount['platform'][] = ['instagram', 'tiktok', 'facebook', 'linkedin', 'x'];

export default function BrandDetail() {
  const { brandId = '' } = useParams();
  const store = useStore();
  const { t, count } = useI18n();
  const brand = store.getBrand(brandId);
  const [tab, setTab] = useState<Tab>('content');

  if (!brand) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState title={t('brand.notFound')} action={<Link to="/"><Button variant="subtle">{t('brand.backToDashboard')}</Button></Link>} />
      </div>
    );
  }

  const templates = store.templatesByBrand(brandId);
  const graphics = store.graphicsByBrand(brandId);
  const assets = store.assetsByBrand(brandId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Link to="/" className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
        <ArrowLeft size={14} /> {t('nav.dashboard')}
      </Link>

      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-[20px] font-bold text-white" style={{ background: brand.colours[0] || '#7c3aed' }}>
            {brand.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-[22px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[26px]">{brand.name}</h1>
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{count(templates.length, 'template')} · {count(graphics.length, 'graphic')} · {count(assets.length, 'asset')}</p>
          </div>
        </div>
        <NewMenu brandId={brandId} />
      </header>

      {/* tabs (scrollable on mobile) */}
      <div className="mb-6">
        <Tabs tabs={TABS.map((tb) => ({ id: tb.id, label: t(tb.key) }))} value={tab} onChange={setTab} />
      </div>

      {tab === 'content' && <ContentTab brandId={brandId} />}
      {tab === 'brand' && <BrandTab brandId={brandId} />}
      {tab === 'insights' && <SocialTab brandId={brandId} />}
    </div>
  );
}

// One "New" action: collapses the old Start-a-post / Create-graphic / Find-clips
// entry points into a single chooser - still graphic, motion graphic, or clip.
function NewMenu({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('mousedown', onDoc); window.removeEventListener('keydown', onKey); };
  }, [open]);
  const go = (path: string) => { setOpen(false); navigate(path); };
  const opts = [
    { icon: <ImageIcon size={16} />, label: t('brand.new.still'), desc: t('brand.new.stillDesc'), onClick: () => go(`/brands/${brandId}/create?make=still`) },
    { icon: <Sparkles size={16} />, label: t('brand.new.motion'), desc: t('brand.new.motionDesc'), onClick: () => go(`/brands/${brandId}/create?make=motion`) },
    { icon: <Film size={16} />, label: t('brand.new.clip'), desc: t('brand.new.clipDesc'), onClick: () => go(`/brands/${brandId}/pipeline`) },
  ];
  return (
    <div ref={ref} className="relative">
      <Button className="w-full sm:w-auto" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        <Plus size={15} /> {t('brand.new')} <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>
      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-[270px] overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl shadow-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900">
          {opts.map((o) => (
            <button key={o.label} role="menuitem" onClick={o.onClick} className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">{o.icon}</span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{o.label}</span>
                <span className="block text-[12px] leading-snug text-zinc-500 dark:text-zinc-400">{o.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Content = everything the brand has MADE: graphics + clips, switched by a
// sub-segment (the "type filter" for the made library).
function ContentTab({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const [sub, setSub] = useState<'graphics' | 'clips'>('graphics');
  return (
    <div>
      <div className="mb-5">
        <SegmentedControl
          size="sm"
          label={t('brand.tab.content')}
          value={sub}
          onChange={setSub}
          options={[
            { value: 'graphics', label: t('brand.tab.graphics') },
            { value: 'clips', label: t('brand.tab.clips') },
          ]}
        />
      </div>
      {sub === 'graphics' ? <GraphicsTab brandId={brandId} /> : <ClipsTab brandId={brandId} />}
    </div>
  );
}

// Brand = the brand's SETUP + info: overview, brand kit (assets) and templates,
// switched by a sub-segment. (Assets + Overview are both "brand", now together.)
function BrandTab({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const [sub, setSub] = useState<'overview' | 'assets' | 'templates'>('overview');
  return (
    <div>
      <div className="mb-5">
        <SegmentedControl
          size="sm"
          label={t('brand.tab.brand')}
          value={sub}
          onChange={setSub}
          options={[
            { value: 'overview', label: t('brand.tab.overview') },
            { value: 'assets', label: t('brand.tab.assets') },
            { value: 'templates', label: t('brand.tab.templates') },
          ]}
        />
      </div>
      {sub === 'overview' && <OverviewTab brandId={brandId} />}
      {sub === 'assets' && <AssetsTab brandId={brandId} />}
      {sub === 'templates' && <TemplatesTab brandId={brandId} />}
    </div>
  );
}

// ── Overview ──
function OverviewTab({ brandId }: { brandId: string }) {
  const store = useStore();
  const navigate = useNavigate();
  const { t, count } = useI18n();
  const { confirm } = useOverlay();
  const brand = store.getBrand(brandId)!;
  const [newColour, setNewColour] = useState('#7c3aed');

  const deleteBrand = async () => {
    const tn = store.templatesByBrand(brandId).length;
    const gn = store.graphicsByBrand(brandId).length;
    const an = store.assetsByBrand(brandId).length;
    const ok = await confirm({
      title: t('brand.deleteConfirmTitle'),
      body: t('brand.deleteConfirmBody', { name: brand.name, t: count(tn, 'template'), g: count(gn, 'graphic'), a: count(an, 'asset') }),
      confirmLabel: t('common.confirmDelete'),
      danger: true,
    });
    if (ok) { store.deleteBrand(brandId); navigate('/'); }
  };

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Panel className="p-5">
        <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">{t('ov.identity')}</h3>
        <label className="mb-1 block text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('ov.name')}</label>
        <TextInput value={brand.name} onChange={(e) => store.updateBrand(brandId, { name: e.target.value })} />
        <label className="mb-1 mt-4 block text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('ov.fonts')}</label>
        <TextInput value={brand.fonts.join(', ')} onChange={(e) => store.updateBrand(brandId, { fonts: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
        <label className="mb-1 mt-4 block text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('ov.tone')}</label>
        <textarea
          value={brand.toneNotes ?? ''}
          onChange={(e) => store.updateBrand(brandId, { toneNotes: e.target.value })}
          className="h-24 w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />

        <h3 className="mb-2 mt-6 text-[13px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400">{t('ov.dangerZone')}</h3>
        <Button variant="danger" onClick={deleteBrand}><Trash2 size={14} /> {t('brand.deleteBrand')}</Button>
      </Panel>

      <Panel className="p-5">
        <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">{t('ov.colours')}</h3>
        <div className="flex flex-wrap gap-2">
          {brand.colours.map((c, i) => (
            <div key={i} className="group relative">
              <span className="block h-12 w-12 rounded-xl border border-zinc-200 dark:border-zinc-700" style={{ background: c }} />
              <button
                onClick={() => store.updateBrand(brandId, { colours: brand.colours.filter((_, j) => j !== i) })}
                className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 place-items-center rounded-full bg-zinc-900 text-white group-hover:grid dark:bg-zinc-700"
                title={t('common.delete')}
              >
                <Trash2 size={11} />
              </button>
              <span className="mt-1 block text-center text-[9px] text-zinc-400 dark:text-zinc-500">{c}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <input type="color" value={newColour} onChange={(e) => setNewColour(e.target.value)} className="h-10 w-14 rounded bg-transparent" />
          <Button variant="subtle" onClick={() => store.updateBrand(brandId, { colours: [...brand.colours, newColour] })}>
            <Plus size={14} /> {t('ov.addColour')}
          </Button>
        </div>
        <p className="mt-5 text-[12px] text-zinc-500 dark:text-zinc-400">{t('ov.coloursHint')}</p>
        <Button className="mt-3" onClick={() => navigate(`/brands/${brandId}/create`)}><Sparkles size={15} /> {t('ov.createGraphic')}</Button>
      </Panel>
    </div>
  );
}

// ── Template Style Generator ──
// Template AI agent: upload a design -> Claude vision rebuilds it as an
// editable freeform template, then opens it in the editor. Reproduce = match
// the source; Polish = re-lay-out cleanly using the brand palette.
function TemplateFromImage({ brandId }: { brandId: string }) {
  const store = useStore();
  const { t } = useI18n();
  const navigate = useNavigate();
  const brand = store.getBrand(brandId)!;
  const [open, setOpen] = useState(false);
  const [img, setImg] = useState<string | null>(null);
  const [mode, setMode] = useState<TemplateMode>('reproduce');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onUpload = async (file?: File) => {
    if (!file) return;
    setErr(null);
    setImg(await fileToStoredDataURL(file, 1400));
  };

  const build = async () => {
    if (!img) return;
    setBusy(true); setErr(null);
    try {
      const r = await buildTemplateFromImage({ imageUrl: img, brand: { name: brand.name, colours: brand.colours, fonts: brand.fonts }, mode });
      if (r.notConfigured) { setErr(t('tfi.notConfigured')); return; }
      if (r.error || !r.result) { setErr(r.error || t('tfi.failed')); return; }
      const tpl = store.createTemplate(brandId, 'freeform-post', r.result.name, { seedElements: r.result.elements });
      if (!tpl) { setErr(t('tfi.failed')); return; }
      // Open the create step with the new template preselected. (Creating the
      // graphic inline would read a stale store snapshot - the template was
      // just added in the same tick - so route to the fresh create page.)
      navigate(`/brands/${brandId}/create?template=${tpl.id}`);
    } finally { setBusy(false); }
  };

  return (
    <Panel className="mb-4 p-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
        <span className="inline-flex items-center gap-2 text-[14px] font-bold text-zinc-900 dark:text-zinc-50"><Sparkles size={15} className="text-violet-600 dark:text-violet-400" /> {t('tfi.title')}</span>
        <span className="text-[12px] text-zinc-500 dark:text-zinc-400">{open ? t('common.hide') : t('common.open')}</span>
      </button>
      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{t('tfi.hint')}</p>
          <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
            <div>
              <label className="block cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
                {img
                  ? <img src={img} alt="" className="aspect-[4/5] w-full rounded-xl border border-zinc-200 object-cover dark:border-zinc-700" />
                  : <span className="grid aspect-[4/5] w-full place-items-center rounded-xl border border-dashed border-zinc-300 text-zinc-400 dark:border-zinc-700"><span className="flex flex-col items-center gap-2 text-[12px]"><ImagePlus size={20} /> {t('tfi.upload')}</span></span>}
              </label>
              {img && <button onClick={() => setImg(null)} className="mt-2 text-[12px] font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200">{t('tfi.clear')}</button>}
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('tfi.mode')}</p>
                <div className="flex gap-1">
                  {(['reproduce', 'polish'] as const).map((mItem) => (
                    <button key={mItem} onClick={() => setMode(mItem)} className={`flex-1 rounded-lg border px-3 py-2 text-[12px] font-semibold ${mode === mItem ? 'border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-500/15 dark:text-violet-300' : 'border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300'}`}>{t(mItem === 'reproduce' ? 'tfi.mode.reproduce' : 'tfi.mode.polish')}</button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">{t(mode === 'reproduce' ? 'tfi.modeHint.reproduce' : 'tfi.modeHint.polish')}</p>
              </div>
              <Button onClick={build} disabled={!img || busy}>{busy ? <><Loader2 size={14} className="animate-spin" /> {t('tfi.building')}</> : <><Sparkles size={14} /> {t('tfi.build')}</>}</Button>
              {err && <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">{err}</p>}
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}

function StyleGenerator({ brandId }: { brandId: string }) {
  const store = useStore();
  const { t } = useI18n();
  const brand = store.getBrand(brandId)!;
  const refImages = store
    .assetsByBrand(brandId)
    .filter((a) => ['reference', 'social-post', 'product'].includes(a.type) && a.url.startsWith('data:image'))
    .map((a) => a.url);
  const fonts = Array.from(new Set([...(brand.fonts ?? []), 'Inter', 'Bitter']));

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [style, setStyle] = useState<GenStyle | null>(null);
  const [layoutId, setLayoutId] = useState('cover');
  const [name, setName] = useState(t('sg.defaultName'));

  const onRefs = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      const url = await fileToStoredDataURL(f, 1200);
      store.addAsset(brandId, { type: 'reference', name: f.name, url });
    }
  };

  const generate = async () => {
    setBusy(true);
    try {
      const r = await analyseImages(refImages);
      setStyle({
        palette: r.palette.length ? r.palette : brand.colours,
        theme: r.theme,
        heading: brand.fonts[0] || 'Bitter',
        body: brand.fonts[1] || 'Inter',
      });
    } finally {
      setBusy(false);
    }
  };

  const elementsFor = (s: GenStyle, id: string) => (LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0]).build(s);

  const save = (applyToBrand: boolean) => {
    if (!style) return;
    store.addTemplateStyle(brandId, {
      name,
      colours: style.palette,
      typography: { heading: style.heading, body: style.body },
      spacing: {},
      logoRules: {},
      layoutPatterns: { layout: layoutId },
      visualTone: style.theme,
    });
    store.createTemplate(brandId, 'freeform-post', name, { seedElements: elementsFor(style, layoutId) });
    if (applyToBrand) store.updateBrand(brandId, { colours: style.palette });
    setStyle(null);
    setOpen(false);
  };

  return (
    <Panel className="mb-4 p-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
        <span className="inline-flex items-center gap-2 text-[14px] font-bold text-zinc-900 dark:text-zinc-50"><Wand2 size={15} className="text-violet-600 dark:text-violet-400" /> {t('tpl.generateTitle')}</span>
        <span className="text-[12px] text-zinc-500 dark:text-zinc-400">{open ? t('common.hide') : t('common.open')}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/40">
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{t('tpl.refsReady', { n: refImages.length })}</p>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onRefs(e.target.files)} />
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"><ImagePlus size={14} /> {t('tpl.addPosts')}</span>
              </label>
              <Button onClick={generate} disabled={busy || refImages.length === 0}><Wand2 size={14} /> {busy ? t('tpl.analysing') : t('tpl.analyse')}</Button>
            </div>
          </div>

          {style && (
            <div className="grid gap-5 md:grid-cols-[260px_1fr]">
              {/* controls */}
              <div className="space-y-4">
                <div>
                  <p className="mb-1.5 text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('sg.palette')}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {style.palette.map((c, i) => (
                      <span key={i} className="group relative">
                        <input type="color" value={c.startsWith('#') ? c : '#888888'} onChange={(e) => setStyle({ ...style, palette: style.palette.map((x, j) => (j === i ? e.target.value : x)) })} className="h-9 w-9 rounded bg-transparent" />
                      </span>
                    ))}
                    <button onClick={() => setStyle({ ...style, palette: [...style.palette, '#7c3aed'] })} className="grid h-9 w-9 place-items-center rounded border border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"><Plus size={13} /></button>
                  </div>
                </div>
                <label className="block"><span className="mb-1 block text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('sg.theme')}</span>
                  <div className="flex gap-1">
                    {(['dark', 'light'] as const).map((t) => (
                      <button key={t} onClick={() => setStyle({ ...style, theme: t })} className={`flex-1 rounded-lg border px-2 py-2 text-[12px] capitalize ${style.theme === t ? 'border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-500/15 dark:text-violet-300' : 'border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300'}`}>{t}</button>
                    ))}
                  </div>
                </label>
                <label className="block"><span className="mb-1 block text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('sg.headingFont')}</span>
                  <select value={style.heading} onChange={(e) => setStyle({ ...style, heading: e.target.value })} className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-[13px] text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">{fonts.map((f) => <option key={f} value={f}>{f}</option>)}</select>
                </label>
                <label className="block"><span className="mb-1 block text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('sg.bodyFont')}</span>
                  <select value={style.body} onChange={(e) => setStyle({ ...style, body: e.target.value })} className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-[13px] text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">{fonts.map((f) => <option key={f} value={f}>{f}</option>)}</select>
                </label>
                <label className="block"><span className="mb-1 block text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('sg.templateName')}</span>
                  <TextInput value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <div className="flex flex-col gap-2 pt-1">
                  <Button onClick={() => save(false)}><Sparkles size={14} /> {t('sg.saveAsTemplate')}</Button>
                  <Button variant="subtle" onClick={() => save(true)}>{t('sg.saveApplyPalette')}</Button>
                </div>
              </div>

              {/* layout variant previews */}
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('sg.layoutPick')}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {LAYOUTS.map((l) => (
                    <button key={l.id} onClick={() => setLayoutId(l.id)} className={`overflow-hidden rounded-xl border text-left transition-colors ${layoutId === l.id ? 'border-violet-400 ring-1 ring-violet-400/40 dark:border-violet-500' : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'}`}>
                      <ElementPreview elements={elementsFor(style, l.id)} />
                      <div className="px-2 py-1.5 text-[12px] font-semibold text-zinc-800 dark:text-zinc-200">{l.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

// A live thumbnail of a template, rendered with the same canvas the editor
// uses (first slide / default elements / animated frame) + the template's
// master copy and sample data. Crops to a consistent card height.
function TemplateThumb({ template, brand }: { template: Template; brand?: Brand }) {
  const kind = getKind(template.kind);
  if (!kind) return null;
  const copy = effectiveCopy(kind.defaultCopy, template.master?.copy, {}) as unknown as CarouselCopy;
  const ratio = platformToRatio(template.supportedPlatforms?.[0]);
  const els = template.seedElements?.length ? template.seedElements : (kind.defaultElements?.(brand?.colours) ?? []);
  const rows = kind.parse ? kind.parse(kind.sampleData ?? '').rows : [];
  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800" style={{ maxHeight: 220 }}>
      {kind.editor === 'freeform' ? <ElementPreview elements={els} />
        : kind.editor === 'animated' ? <AnimatedCanvas copy={copy as unknown as Record<string, string | undefined>} ratio={ratio} brand={kind.universal && brand ? { name: brand.name, colours: brand.colours, fonts: brand.fonts } : undefined} />
        : kind.slides?.[0] ? <SlideCanvas slide={kind.slides[0]} index={0} rows={rows} copy={copy} slideCount={kind.slides.length} ratio={ratio} brand={brand ? { name: brand.name, colours: brand.colours, fonts: brand.fonts } : undefined} />
        : <div className="grid h-40 place-items-center text-[12px] text-zinc-400 dark:text-zinc-500">{kind.name}</div>}
    </div>
  );
}

// Live preview of a SAVED graphic's first slide - uses the same renderers and
// the same input derivation as the editor, so the card thumbnail matches what
// you open. (Graphic cards were previously text-only with no preview.)
function GraphicThumb({ graphic, brand }: { graphic: GeneratedGraphic; brand?: Brand }) {
  const store = useStore();
  const template = store.getTemplate(graphic.templateId);
  const kind = template && getKind(template.kind);
  const frame = 'mb-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800';
  if (!kind) {
    return <div className={`${frame} grid h-32 place-items-center`}><Layers size={20} className="text-zinc-300 dark:text-zinc-600" /></div>;
  }
  const ratio = platformToRatio(graphic.platformPresetId);
  const carBrand = brand ? { name: brand.name, colours: brand.colours, fonts: brand.fonts } : undefined;

  if (kind.editor === 'freeform') {
    return <div className={frame} style={{ maxHeight: 220 }}><ElementPreview elements={graphic.slides?.[0]?.elements ?? []} /></div>;
  }
  const copy = effectiveCopy(kind.defaultCopy, template!.master?.copy, graphicOverrides(graphic.inputs)) as unknown as CarouselCopy;
  if (kind.editor === 'animated') {
    return <div className={frame} style={{ maxHeight: 220 }}><AnimatedCanvas copy={copy as unknown as Record<string, string | undefined>} ratio={ratio} brand={kind.universal && brand ? carBrand : undefined} /></div>;
  }
  if (kind.slides?.[0]) {
    const rawText = (graphic.inputs?.rawText as string) ?? '';
    const rows = kind.parse ? kind.parse(rawText).rows : [];
    const imageUrls = (graphic.inputs?.images as Record<string, string>) ?? {};
    return <div className={frame} style={{ maxHeight: 220 }}><SlideCanvas slide={kind.slides[0]} index={0} rows={rows} copy={copy} slideCount={kind.slides.length} ratio={ratio} brand={carBrand} imageUrls={imageUrls} /></div>;
  }
  return <div className={`${frame} grid h-32 place-items-center text-[12px] text-zinc-400 dark:text-zinc-500`}>{kind.name}</div>;
}

// ── Templates ──
function TemplatesTab({ brandId }: { brandId: string }) {
  const store = useStore();
  const navigate = useNavigate();
  const { t: tr } = useI18n();
  const { confirm } = useOverlay();
  const brand = store.getBrand(brandId);
  const templates = store.templatesByBrand(brandId);

  const rename = (id: string, current: string) => {
    const name = prompt(tr('common.rename'), current);
    if (name && name.trim()) store.renameTemplate(id, name.trim());
  };
  const remove = async (id: string, name: string) => {
    const ok = await confirm({ title: tr('common.delete'), body: `“${name}”`, confirmLabel: tr('common.confirmDelete'), danger: true });
    if (ok) store.deleteTemplate(id);
  };

  return (
    <div>
      <TemplateFromImage brandId={brandId} />
      <StyleGenerator brandId={brandId} />
      <div className="mb-4 flex flex-wrap gap-2">
        {/* Universal kinds for any brand; brand-specific kinds only if this
            brand already owns one (so a new brand never sees Cwis templates). */}
        {TEMPLATE_KIND_LIST.filter((k) => k.universal || templates.some((t) => t.kind === k.id)).map((k) => (
          <Button key={k.id} variant="subtle" onClick={() => store.createTemplate(brandId, k.id)}>
            <Plus size={14} /> {k.nameKey ? tr(k.nameKey) : k.name}
          </Button>
        ))}
      </div>
      {templates.length === 0 ? (
        <EmptyState title={tr('tpl.empty')} hint={tr('tpl.emptyHint')} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Panel key={t.id} className="flex flex-col p-5">
              <TemplateThumb template={t} brand={brand} />
              <div className="flex items-start justify-between">
                <Badge tone="accent">{t.type}</Badge>
                <Menu
                  label={tr('common.actions')}
                  items={[
                    { label: tr('master.edit'), icon: <Layers size={14} />, onClick: () => navigate(`/templates/${t.id}/master`) },
                    { label: tr('common.rename'), icon: <Pencil size={14} />, onClick: () => rename(t.id, t.name) },
                    { label: tr('common.delete'), icon: <Trash2 size={14} />, danger: true, onClick: () => remove(t.id, t.name) },
                  ]}
                />
              </div>
              <h3 className="mt-3 truncate text-[14px] font-semibold text-zinc-900 dark:text-zinc-50">{t.name}</h3>
              <p className="mt-1 text-[12px] text-zinc-500 dark:text-zinc-400">{getKind(t.kind)?.description ?? t.kind}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {t.supportedPlatforms.slice(0, 4).map((p) => (
                  <span key={p} className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{PLATFORM_PRESETS[p].name}</span>
                ))}
              </div>
              <Button className="mt-4" onClick={() => navigate(`/brands/${brandId}/create?template=${t.id}`)}>
                <Sparkles size={14} /> {tr('tpl.use')}
              </Button>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Graphics ──
type SortKey = 'updated' | 'newest' | 'oldest' | 'name';

function GraphicsTab({ brandId }: { brandId: string }) {
  const store = useStore();
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const { confirm, toast } = useOverlay();

  const allGraphics = store.graphicsByBrand(brandId);
  const folders = store.foldersByBrand(brandId);
  const templates = store.templatesByBrand(brandId);
  const brand = store.getBrand(brandId);

  const [folderSel, setFolderSel] = useState<string>('all'); // 'all' | 'unfiled' | folderId
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('updated');
  const [templateFilter, setTemplateFilter] = useState<string>('all');

  // keep folder selection valid if a folder is deleted
  useEffect(() => {
    if (folderSel !== 'all' && folderSel !== 'unfiled' && !folders.some((f) => f.id === folderSel)) setFolderSel('all');
  }, [folders, folderSel]);

  const view = useMemo(() => {
    let list = allGraphics;
    if (folderSel === 'unfiled') list = list.filter((g) => !g.folderId);
    else if (folderSel !== 'all') list = list.filter((g) => g.folderId === folderSel);
    if (templateFilter !== 'all') list = list.filter((g) => g.templateId === templateFilter);
    if (q.trim()) { const needle = q.toLowerCase(); list = list.filter((g) => g.name.toLowerCase().includes(needle)); }
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'oldest') return a.createdAt.localeCompare(b.createdAt);
      if (sort === 'newest') return b.createdAt.localeCompare(a.createdAt);
      return b.updatedAt.localeCompare(a.updatedAt); // updated
    });
    return sorted;
  }, [allGraphics, folderSel, templateFilter, q, sort]);

  const rename = (id: string, current: string) => {
    const name = prompt(t('common.rename'), current);
    if (name && name.trim()) store.updateGraphic(id, { name: name.trim() });
  };
  const remove = (g: (typeof allGraphics)[number]) => {
    store.deleteGraphic(g.id);
    toast({ message: t('common.deleted', { name: g.name }), actionLabel: t('common.undo'), onAction: () => store.restoreGraphic(g) });
  };
  const newFolder = () => {
    const name = prompt(t('gfx.folderNamePrompt'));
    if (name && name.trim()) { const f = store.createFolder(brandId, name.trim()); setFolderSel(f.id); }
  };
  const renameFolder = (id: string, current: string) => {
    const name = prompt(t('gfx.folderNamePrompt'), current);
    if (name && name.trim()) store.renameFolder(id, name.trim());
  };
  const deleteFolder = async (id: string, name: string) => {
    const ok = await confirm({ title: t('gfx.deleteFolderTitle'), body: t('gfx.deleteFolderBody', { name }), confirmLabel: t('common.confirmDelete'), danger: true });
    if (ok) store.deleteFolder(id);
  };

  // Move actions for a graphic - always offered (incl. "new folder…"), so a
  // graphic can be filed even before any folder exists.
  const moveItems = (g: (typeof allGraphics)[number]): MenuItem[] => {
    const items: MenuItem[] = folders
      .filter((f) => f.id !== g.folderId)
      .map((f) => ({ label: `${t('gfx.moveTo')} ${f.name}`, icon: <FolderIcon size={14} />, onClick: () => store.moveGraphicToFolder(g.id, f.id) }));
    if (g.folderId) items.push({ label: t('gfx.removeFromFolder'), icon: <Inbox size={14} />, onClick: () => store.moveGraphicToFolder(g.id, null) });
    items.push({
      label: t('gfx.moveToNew'),
      icon: <FolderPlus size={14} />,
      onClick: () => {
        const name = prompt(t('gfx.folderNamePrompt'));
        if (name && name.trim()) { const f = store.createFolder(brandId, name.trim()); store.moveGraphicToFolder(g.id, f.id); setFolderSel(f.id); }
      },
    });
    return items;
  };

  if (allGraphics.length === 0)
    return <EmptyState title={t('gfx.empty')} hint={t('gfx.emptyHint')} action={<Button onClick={() => navigate(`/brands/${brandId}/create`)}><Sparkles size={15} /> {t('brand.createGraphic')}</Button>} />;

  const folderTabClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors ${active ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'}`;

  return (
    <div>
      {/* folder rail */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <button onClick={() => setFolderSel('all')} className={folderTabClass(folderSel === 'all')}><Layers size={13} /> {t('gfx.allGraphics')}</button>
        <button onClick={() => setFolderSel('unfiled')} className={folderTabClass(folderSel === 'unfiled')}><Inbox size={13} /> {t('gfx.unfiled')}</button>
        {folders.map((f) => (
          <span key={f.id} className={`group inline-flex items-center rounded-lg ${folderSel === f.id ? 'bg-violet-50 dark:bg-violet-500/15' : ''}`}>
            <button onClick={() => setFolderSel(f.id)} className={folderTabClass(folderSel === f.id)}><FolderIcon size={13} /> {f.name}</button>
            <Menu
              label={t('common.actions')}
              items={[
                { label: t('common.rename'), icon: <Pencil size={14} />, onClick: () => renameFolder(f.id, f.name) },
                { label: t('common.delete'), icon: <Trash2 size={14} />, danger: true, onClick: () => deleteFolder(f.id, f.name) },
              ]}
            />
          </span>
        ))}
        <button onClick={newFolder} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[12px] font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
          <FolderPlus size={13} /> {t('gfx.newFolder')}
        </button>
      </div>

      {/* search + sort + filter */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('gfx.search')} className="w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 py-2 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500" />
        </div>
        <select value={templateFilter} onChange={(e) => setTemplateFilter(e.target.value)} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
          <option value="all">{t('gfx.filterTemplate')}</option>
          {templates.map((tp) => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
          <option value="updated">{t('gfx.sort.updated')}</option>
          <option value="newest">{t('gfx.sort.newest')}</option>
          <option value="oldest">{t('gfx.sort.oldest')}</option>
          <option value="name">{t('gfx.sort.name')}</option>
        </select>
      </div>

      {view.length === 0 ? (
        <EmptyState title={t('gfx.noMatches')} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {view.map((g) => {
            const platform = g.platformPresetId ? PLATFORM_PRESETS[g.platformPresetId] : undefined;
            const items: MenuItem[] = [
              { label: t('common.rename'), icon: <Pencil size={14} />, onClick: () => rename(g.id, g.name) },
              { label: t('common.duplicate'), icon: <Copy size={14} />, onClick: () => store.duplicateGraphic(g.id) },
              ...moveItems(g),
              { label: t('common.delete'), icon: <Trash2 size={14} />, danger: true, onClick: () => remove(g) },
            ];
            return (
              <Panel key={g.id} className="flex flex-col p-5">
                <div className="mb-3 flex items-start justify-between">
                  <Badge>{platform?.name ?? 'Graphic'}</Badge>
                  <Menu label={t('common.actions')} items={items} />
                </div>
                <GraphicThumb graphic={g} brand={brand} />
                <h3 className="truncate text-[14px] font-semibold text-zinc-900 dark:text-zinc-50">{g.name}</h3>
                <p className="mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-400">{t('gfx.updated', { date: new Date(g.updatedAt).toLocaleDateString(lang === 'cy' ? 'cy-GB' : 'en-GB') })}</p>
                <Button className="mt-4" variant="subtle" onClick={() => navigate(`/graphics/${g.id}`)}>{t('gfx.open')}</Button>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Export a saved clip to MP4 via the render worker (P3a) ──
// Calls /api/postio/render with the clip's in/out points + ratio, polls until
// the worker returns a URL, then offers it for download. Degrades gracefully:
// a 503 means the worker isn't configured yet ("being set up"); a clip with no
// sourceUrl can't be rendered (the source reference is required).
type ExportState = { phase: 'idle' | 'rendering' | 'ready' | 'error'; progress: number; url?: string; msg?: string };

function ClipExportButton({ clip }: { clip: Clip }) {
  const { t } = useI18n();
  const [st, setSt] = useState<ExportState>({ phase: 'idle', progress: 0 });
  const hasSource = Boolean(clip.sourceUrl);

  const run = async () => {
    if (!hasSource || st.phase === 'rendering') return;
    setSt({ phase: 'rendering', progress: 0 });
    try {
      const res = await fetch('/api/postio/render', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sourceUrl: clip.sourceUrl,
          startSec: clip.start,
          endSec: clip.end,
          aspectRatio: clip.aspectRatio || '9:16',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 503) { setSt({ phase: 'error', progress: 0, msg: t('clip.exportSetup') }); return; }
      if (!res.ok) { setSt({ phase: 'error', progress: 0, msg: data.message || t('clip.exportFailed') }); return; }
      // Poll status (worker renders in the background).
      for (let i = 0; i < 100; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const pr = await fetch(`/api/postio/render?jobId=${encodeURIComponent(data.jobId)}`);
        const pd = await pr.json().catch(() => ({}));
        if (!pr.ok) { setSt({ phase: 'error', progress: 0, msg: pd.message || t('clip.exportFailed') }); return; }
        if (pd.status === 'complete' && pd.url) { setSt({ phase: 'ready', progress: 100, url: pd.url }); return; }
        if (pd.status === 'failed') { setSt({ phase: 'error', progress: 0, msg: pd.message || t('clip.exportFailed') }); return; }
        setSt({ phase: 'rendering', progress: typeof pd.progress === 'number' ? pd.progress : 0 });
      }
      setSt({ phase: 'error', progress: 0, msg: t('clip.exportFailed') });
    } catch {
      setSt({ phase: 'error', progress: 0, msg: t('clip.exportFailed') });
    }
  };

  const btnCls = 'inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800';

  if (st.phase === 'ready' && st.url) {
    return (
      <a href={st.url} target="_blank" rel="noopener noreferrer" download className={`${btnCls} border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400`}>
        <Download size={13} /> {t('clip.exportReady')}
      </a>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <button onClick={run} disabled={!hasSource || st.phase === 'rendering'} className={btnCls} title={!hasSource ? t('clip.exportNoSource') : undefined}>
        {st.phase === 'rendering'
          ? <><Loader2 size={13} className="animate-spin text-violet-600 dark:text-violet-400" /> {t('clip.exporting')}{st.progress ? ` ${st.progress}%` : '…'}</>
          : <><Film size={13} className="text-violet-600 dark:text-violet-400" /> {t('clip.exportMp4')}</>}
      </button>
      {st.phase === 'error' && st.msg && <span className="text-[11px] text-amber-600 dark:text-amber-400">{st.msg}</span>}
      {!hasSource && st.phase === 'idle' && <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{t('clip.exportNoSource')}</span>}
    </div>
  );
}

// ── Clips (saved short-form clips, same Brand -> Folder structure as graphics) ──
function ClipsTab({ brandId }: { brandId: string }) {
  const store = useStore();
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const { confirm, toast } = useOverlay();

  const allClips = store.clipsByBrand(brandId);
  const folders = store.foldersByBrand(brandId);

  const [folderSel, setFolderSel] = useState<string>('all'); // 'all' | 'unfiled' | folderId
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('updated');

  useEffect(() => {
    if (folderSel !== 'all' && folderSel !== 'unfiled' && !folders.some((f) => f.id === folderSel)) setFolderSel('all');
  }, [folders, folderSel]);

  const view = useMemo(() => {
    let list = allClips;
    if (folderSel === 'unfiled') list = list.filter((c) => !c.folderId);
    else if (folderSel !== 'all') list = list.filter((c) => c.folderId === folderSel);
    if (q.trim()) { const needle = q.toLowerCase(); list = list.filter((c) => (c.name + ' ' + (c.hook || '') + ' ' + (c.caption || '')).toLowerCase().includes(needle)); }
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'oldest') return a.createdAt.localeCompare(b.createdAt);
      if (sort === 'newest') return b.createdAt.localeCompare(a.createdAt);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return sorted;
  }, [allClips, folderSel, q, sort]);

  const rename = (id: string, current: string) => {
    const name = prompt(t('common.rename'), current);
    if (name && name.trim()) store.updateClip(id, { name: name.trim() });
  };
  const remove = (c: (typeof allClips)[number]) => {
    store.deleteClip(c.id);
    toast({ message: t('common.deleted', { name: c.name }), actionLabel: t('common.undo'), onAction: () => store.restoreClip(c) });
  };
  const newFolder = () => {
    const name = prompt(t('gfx.folderNamePrompt'));
    if (name && name.trim()) { const f = store.createFolder(brandId, name.trim()); setFolderSel(f.id); }
  };
  const renameFolder = (id: string, current: string) => {
    const name = prompt(t('gfx.folderNamePrompt'), current);
    if (name && name.trim()) store.renameFolder(id, name.trim());
  };
  const deleteFolder = async (id: string, name: string) => {
    const ok = await confirm({ title: t('gfx.deleteFolderTitle'), body: t('gfx.deleteFolderBody', { name }), confirmLabel: t('common.confirmDelete'), danger: true });
    if (ok) store.deleteFolder(id);
  };

  const moveItems = (c: (typeof allClips)[number]): MenuItem[] => {
    const items: MenuItem[] = folders
      .filter((f) => f.id !== c.folderId)
      .map((f) => ({ label: `${t('gfx.moveTo')} ${f.name}`, icon: <FolderIcon size={14} />, onClick: () => store.moveClipToFolder(c.id, f.id) }));
    if (c.folderId) items.push({ label: t('gfx.removeFromFolder'), icon: <Inbox size={14} />, onClick: () => store.moveClipToFolder(c.id, null) });
    items.push({
      label: t('gfx.moveToNew'),
      icon: <FolderPlus size={14} />,
      onClick: () => {
        const name = prompt(t('gfx.folderNamePrompt'));
        if (name && name.trim()) { const f = store.createFolder(brandId, name.trim()); store.moveClipToFolder(c.id, f.id); setFolderSel(f.id); }
      },
    });
    return items;
  };

  const findCta = <Button onClick={() => navigate(`/brands/${brandId}/pipeline`)}><Film size={15} /> {t('clip.find')}</Button>;

  if (allClips.length === 0)
    return <EmptyState title={t('clipTab.empty')} hint={t('clipTab.emptyHint')} action={findCta} />;

  const folderTabClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold transition-colors ${active ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'}`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <button onClick={() => setFolderSel('all')} className={folderTabClass(folderSel === 'all')}><Layers size={13} /> {t('clipTab.all')}</button>
        <button onClick={() => setFolderSel('unfiled')} className={folderTabClass(folderSel === 'unfiled')}><Inbox size={13} /> {t('gfx.unfiled')}</button>
        {folders.map((f) => (
          <span key={f.id} className={`group inline-flex items-center rounded-lg ${folderSel === f.id ? 'bg-violet-50 dark:bg-violet-500/15' : ''}`}>
            <button onClick={() => setFolderSel(f.id)} className={folderTabClass(folderSel === f.id)}><FolderIcon size={13} /> {f.name}</button>
            <Menu
              label={t('common.actions')}
              items={[
                { label: t('common.rename'), icon: <Pencil size={14} />, onClick: () => renameFolder(f.id, f.name) },
                { label: t('common.delete'), icon: <Trash2 size={14} />, danger: true, onClick: () => deleteFolder(f.id, f.name) },
              ]}
            />
          </span>
        ))}
        <button onClick={newFolder} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[12px] font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
          <FolderPlus size={13} /> {t('gfx.newFolder')}
        </button>
        <span className="ml-auto">{findCta}</span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('clipTab.search')} className="w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 py-2 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500" />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
          <option value="updated">{t('gfx.sort.updated')}</option>
          <option value="newest">{t('gfx.sort.newest')}</option>
          <option value="oldest">{t('gfx.sort.oldest')}</option>
          <option value="name">{t('gfx.sort.name')}</option>
        </select>
      </div>

      {view.length === 0 ? (
        <EmptyState title={t('gfx.noMatches')} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {view.map((c) => {
            const items: MenuItem[] = [
              { label: t('common.rename'), icon: <Pencil size={14} />, onClick: () => rename(c.id, c.name) },
              ...moveItems(c),
              { label: t('common.delete'), icon: <Trash2 size={14} />, danger: true, onClick: () => remove(c) },
            ];
            return (
              <Panel key={c.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <Badge>{c.start}–{c.end}{c.aspectRatio ? ` · ${c.aspectRatio}` : ''}</Badge>
                  <div className="flex items-center gap-1.5">
                    {typeof c.score === 'number' && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{c.score}</span>}
                    <Menu label={t('common.actions')} items={items} />
                  </div>
                </div>
                <h3 className="mt-3 truncate text-[14px] font-semibold text-zinc-900 dark:text-zinc-50">{c.name}</h3>
                {c.hook && <p className="mt-1 line-clamp-2 text-[12px] text-amber-600 dark:text-amber-400">“{c.hook}”</p>}
                {c.caption && <p className="mt-1.5 line-clamp-2 text-[12px] text-zinc-600 dark:text-zinc-300">{c.caption}</p>}
                {Array.isArray(c.platforms) && c.platforms.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.platforms.slice(0, 4).map((p) => <span key={p} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{p}</span>)}
                  </div>
                )}
                <div className="mt-auto pt-3">
                  <ClipExportButton clip={c} />
                </div>
                <p className="pt-2 text-[12px] text-zinc-500 dark:text-zinc-400">{t('gfx.updated', { date: new Date(c.updatedAt).toLocaleDateString(lang === 'cy' ? 'cy-GB' : 'en-GB') })}</p>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Assets ──
function AssetsTab({ brandId }: { brandId: string }) {
  const store = useStore();
  const { t } = useI18n();
  const { confirm } = useOverlay();
  const assets = store.assetsByBrand(brandId);
  const [type, setType] = useState<AssetType>('logo');

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const url = await fileToStoredDataURL(file, type === 'logo' ? 512 : 1400);
    store.addAsset(brandId, { type, name: file.name, url });
  };
  const rename = (id: string, current: string) => {
    const name = prompt(t('common.rename'), current);
    if (name && name.trim()) store.renameAsset(id, name.trim());
  };
  const remove = async (id: string, name: string) => {
    const ok = await confirm({ title: t('common.delete'), body: `“${name}”`, confirmLabel: t('common.confirmDelete'), danger: true });
    if (ok) store.removeAsset(id);
  };

  return (
    <div>
      <Panel className="mb-5 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={type} onChange={(e) => setType(e.target.value as AssetType)} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
            {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <label className="cursor-pointer">
            <input type="file" accept="image/*,.woff,.woff2,.ttf,.otf" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <span className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"><ImagePlus size={15} /> {t('asset.upload', { type })}</span>
          </label>
          <span className="text-[12px] text-zinc-400 dark:text-zinc-500">{t('asset.storedLocally')}</span>
        </div>
      </Panel>

      {assets.length === 0 ? (
        <EmptyState title={t('asset.empty')} hint={t('asset.emptyHint')} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((a) => (
            <Panel key={a.id} className="overflow-hidden">
              <div className="relative h-28 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                {/image|logo|background|icon|product|reference|social-post/.test(a.type) && a.url.startsWith('data:image') ? (
                  <img src={a.url} alt={a.name} className="absolute inset-0 h-full w-full object-contain p-2" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-[11px] text-zinc-500 dark:text-zinc-400">{a.type}</span>
                )}
              </div>
              <div className="flex items-start justify-between gap-1 p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[12px] text-zinc-800 dark:text-zinc-200">{a.name}</p>
                  <Badge tone="muted">{a.type}</Badge>
                </div>
                <Menu
                  label={t('common.actions')}
                  items={[
                    { label: t('common.rename'), icon: <Pencil size={14} />, onClick: () => rename(a.id, a.name) },
                    { label: t('common.delete'), icon: <Trash2 size={14} />, danger: true, onClick: () => remove(a.id, a.name) },
                  ]}
                />
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Social ──
// ── Live Instagram (beta) ── pulls real posts ranked by engagement via
// the Meta Graph API. Dormant until a Meta app is configured (env vars +
// META_SETUP.md); degrades to a clear "needs setup" state otherwise.
interface LivePost { id: string; caption: string; mediaUrl: string; permalink: string; likes: number; comments: number; engagement: number }

function LiveInstagram() {
  const { t } = useI18n();
  const [state, setState] = useState<'idle' | 'loading' | 'connecting' | 'ok' | 'notconf' | 'notconn' | 'err'>('idle');
  const [posts, setPosts] = useState<LivePost[]>([]);
  const [igStatus, setIgStatus] = useState<string | null>(null);

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('ig');
    if (s) setIgStatus(s);
  }, []);

  const pull = async () => {
    setState('loading');
    try {
      const res = await fetch('/api/social/instagram/insights');
      if (res.status === 503) return setState('notconf');
      if (res.status === 401) return setState('notconn');
      if (!res.ok) return setState('err');
      const data = await res.json();
      setPosts(data.posts || []);
      setState('ok');
    } catch {
      setState('err');
    }
  };

  const connectHref = `/api/social/instagram/connect?return=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/app/carousel')}`;

  // Probe before navigating: the connect route 503s until a Meta app is
  // configured (the default). Hard-linking dumped users on a raw JSON error
  // page - instead, only redirect to OAuth when it's actually configured.
  const connect = async () => {
    setState('connecting');
    try {
      const res = await fetch(connectHref, { redirect: 'manual' });
      if (res.status === 503) return setState('notconf');
      window.location.href = connectHref; // configured: start real OAuth
    } catch {
      setState('notconf');
    }
  };

  return (
    <Panel className="mb-5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-[14px] font-bold text-zinc-900 dark:text-zinc-50"><Wand2 size={15} className="text-violet-600 dark:text-violet-400" /> {t('li.title')} <Badge tone="accent">beta</Badge></p>
          <p className="mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-400">{t('li.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={connect} disabled={state === 'connecting'} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">{state === 'connecting' ? t('li.connecting') : t('li.connect')}</button>
          <Button variant="subtle" onClick={pull} disabled={state === 'loading'}>{state === 'loading' ? t('li.pulling') : t('li.pull')}</Button>
        </div>
      </div>

      {state === 'idle' && !igStatus && <p className="mt-3 text-[12px] text-zinc-500 dark:text-zinc-400">{t('li.dormantHint')}</p>}
      {igStatus === 'connected' && <p className="mt-3 text-[12px] text-emerald-600 dark:text-emerald-400">{t('li.connected')}</p>}
      {igStatus && igStatus !== 'connected' && <p className="mt-3 text-[12px] text-red-600 dark:text-red-400">{t('li.connectFailed', { status: igStatus })}</p>}
      {state === 'notconf' && <p className="mt-3 text-[12px] text-zinc-600 dark:text-zinc-300">{t('li.notConfA')}<span className="text-zinc-800 dark:text-zinc-100">META_SETUP.md</span>{t('li.notConfB')}</p>}
      {state === 'notconn' && <p className="mt-3 text-[12px] text-zinc-600 dark:text-zinc-300">{t('li.notConnected')}</p>}
      {state === 'err' && <p className="mt-3 text-[12px] text-red-600 dark:text-red-400">{t('li.pullError')}</p>}

      {state === 'ok' && (
        posts.length === 0 ? (
          <p className="mt-3 text-[12px] text-zinc-500 dark:text-zinc-400">{t('li.noPosts')}</p>
        ) : (
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('li.topPerformers')}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {posts.slice(0, 8).map((p, i) => (
                <a key={p.id} href={p.permalink} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                  <div className="relative aspect-square">
                    {p.mediaUrl && <img src={p.mediaUrl} alt="" className="h-full w-full object-cover" />}
                    {i < 3 && <span className="absolute left-2 top-2 rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold text-white">#{i + 1}</span>}
                  </div>
                  <div className="px-2 py-1.5 text-[11px] text-zinc-600 dark:text-zinc-300">♥ {p.likes.toLocaleString()} · 💬 {p.comments.toLocaleString()}</div>
                </a>
              ))}
            </div>
          </div>
        )
      )}
    </Panel>
  );
}

function SocialTab({ brandId }: { brandId: string }) {
  const store = useStore();
  const { t } = useI18n();
  const socials = store.socialByBrand(brandId);
  const [platform, setPlatform] = useState<SocialAccount['platform']>('instagram');
  const [url, setUrl] = useState('');
  const [auditing, setAuditing] = useState<string | null>(null);

  // The realistic "real audit": analyse the reference posts uploaded for
  // this brand (live-account fetching isn't possible - login walls/ToS).
  const refImages = store
    .assetsByBrand(brandId)
    .filter((a) => ['reference', 'social-post', 'product'].includes(a.type) && a.url.startsWith('data:image'))
    .map((a) => a.url);

  const add = () => {
    if (!url.trim()) return;
    store.addSocialAccount(brandId, { platform, url: url.trim() });
    setUrl('');
  };

  const onPosts = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const url = await fileToStoredDataURL(file, 1200);
      store.addAsset(brandId, { type: 'social-post', name: file.name, url });
    }
  };

  const runAudit = async (id: string) => {
    setAuditing(id);
    store.updateSocialAudit(id, { auditStatus: 'pending' });
    try {
      const result = await analyseImages(refImages);
      store.updateSocialAudit(id, { auditStatus: 'complete', auditResult: result, auditSuggestions: deriveSuggestions(result) });
    } catch {
      store.updateSocialAudit(id, { auditStatus: 'failed' });
    } finally {
      setAuditing(null);
    }
  };

  return (
    <div>
      <LiveInstagram />
      <Panel className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={platform} onChange={(e) => setPlatform(e.target.value as SocialAccount['platform'])} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
            {SOCIAL_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="min-w-0 flex-1 sm:min-w-[220px]"><TextInput placeholder="https://instagram.com/yourbrand" value={url} onChange={(e) => setUrl(e.target.value)} /></div>
          <Button onClick={add}><Plus size={14} /> {t('soc.addAccount')}</Button>
        </div>
      </Panel>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/40">
        <p className="text-[12px] text-zinc-500 dark:text-zinc-400">
          {t('soc.auditsPre')}<span className="text-zinc-700 dark:text-zinc-200">{t('soc.auditsEmph')}</span>{t('soc.auditsPost', { n: refImages.length })}
        </p>
        <label className="cursor-pointer">
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onPosts(e.target.files)} />
          <span className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"><ImagePlus size={14} /> {t('soc.addPostImages')}</span>
        </label>
      </div>

      {socials.length === 0 ? (
        <EmptyState title={t('soc.noAccountsTitle')} hint={t('soc.noAccountsHint')} />
      ) : (
        <div className="space-y-3">
          {socials.map((s) => {
            const busy = auditing === s.id || s.auditStatus === 'pending';
            const r = s.auditResult;
            return (
              <Panel key={s.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <Badge tone="accent">{s.platform}</Badge>
                    <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-1 truncate text-[13px] text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100">
                      <span className="truncate">{s.url}</span> <ExternalLink size={12} className="shrink-0" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="subtle" disabled={busy} onClick={() => runAudit(s.id)}>
                      <Wand2 size={14} /> {busy ? t('tpl.analysing') : s.auditStatus === 'complete' ? t('soc.reaudit') : t('soc.auditPosts')}
                    </Button>
                    <button onClick={() => store.removeSocialAccount(s.id)} className="grid h-9 w-9 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"><Trash2 size={14} /></button>
                  </div>
                </div>

                {s.auditStatus === 'complete' && r && (
                  <div className="mt-3 space-y-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                    {r.count === 0 ? (
                      <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{t('soc.noRefs')}</p>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-4">
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('sg.palette')} ({r.count} {r.count === 1 ? t('soc.post.one') : t('soc.post.other')})</p>
                            <div className="mt-1 flex gap-1.5">
                              {r.palette.map((c, i) => <span key={i} className="h-6 w-6 rounded-md border border-zinc-200 dark:border-zinc-700" style={{ background: c }} title={c} />)}
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('sg.theme')}</p>
                            <p className="mt-1 text-[13px] capitalize text-zinc-800 dark:text-zinc-200">{r.theme}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('soc.formatMix')}</p>
                            <p className="mt-1 text-[13px] text-zinc-800 dark:text-zinc-200">{r.aspects.portrait}P · {r.aspects.square}Sq · {r.aspects.landscape}L</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('soc.suggestions')}</p>
                          {s.auditSuggestions?.map((sug, i) => (
                            <div key={i} className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
                              <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">{sug.title}</p>
                              <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{sug.rationale}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                          <Button onClick={() => store.updateBrand(brandId, { colours: r.palette })}><Sparkles size={14} /> {t('soc.updateBrand')}</Button>
                          <span className="text-[12px] text-zinc-500 dark:text-zinc-400">{t('soc.applyPaletteNote')}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {s.auditStatus === 'failed' && <p className="mt-3 border-t border-zinc-200 pt-3 text-[12px] text-red-600 dark:border-zinc-800 dark:text-red-400">{t('soc.auditFailed')}</p>}
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
