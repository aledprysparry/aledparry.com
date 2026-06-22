import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, ShieldCheck, Pencil, Film } from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { Button, Panel, EmptyState } from '@engine/components/ui';
import { Tabs } from '@engine/components/primitives';
import DataInput from '@engine/components/DataInput';
import CopyEditor from '@engine/components/CopyEditor';
import SlideCanvas from '@engine/components/SlideCanvas';
import FreeformEditor from '@engine/components/FreeformEditor';
import AnimatedEditor from '@engine/pages/AnimatedEditor';
import ReviewPanel from '@engine/components/ReviewPanel';
import { getKind, platformToRatio } from '@engine/lib/templates/registry';
import { PLATFORM_PRESETS } from '@engine/lib/platforms/presets';
import { exportSlide, exportZip } from '@engine/lib/carousel/exportCarousel';
import { downloadSlidesAnimatedWebM } from '@engine/lib/carousel/exportSlidesAnimated';
import { effectiveCopy, graphicOverrides } from '@engine/lib/carousel/copy';
import type { CarouselCopy } from '@engine/lib/carousel/types';
import type { PlatformId } from '@engine/lib/model/types';

export default function GraphicEditor() {
  const { graphicId = '' } = useParams();
  const store = useStore();
  const { t } = useI18n();
  const graphic = store.getGraphic(graphicId);
  const template = graphic && store.getTemplate(graphic.templateId);
  const kind = template && getKind(template.kind);

  const [format, setFormat] = useState('image/png');
  const [busy, setBusy] = useState<number | 'zip' | 'anim' | null>(null);
  const [showSafe, setShowSafe] = useState(false);
  // One editor, three tabs (Issue 1: still + animated are the same template).
  const [tab, setTab] = useState<'design' | 'animation' | 'export'>('design');
  const [animSpeed, setAnimSpeed] = useState<'fast' | 'standard' | 'slow'>('standard');
  const ANIM_MS = { fast: 1800, standard: 2600, slow: 3400 } as const;

  const rawText = (graphic?.inputs?.rawText as string) ?? '';
  // effective copy = kind default ← template master ← this graphic's overrides
  const overrides = graphicOverrides(graphic?.inputs);
  const copy = effectiveCopy(kind?.defaultCopy, template?.master?.copy, overrides) as unknown as CarouselCopy;
  const { rows, warnings, error } = useMemo(
    () => (kind?.parse ? kind.parse(rawText) : { rows: [], warnings: [], error: null }),
    [kind, rawText],
  );

  if (!graphic || !template || !kind) {
    return <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8"><EmptyState title={t('editor.notFound')} action={<Link to="/"><Button variant="subtle">{t('nav.dashboard')}</Button></Link>} /></div>;
  }

  // Free-form kinds use the in-place canvas editor instead of the carousel pipeline.
  if (kind.editor === 'freeform') return <FreeformEditor graphic={graphic} />;
  // Animated kinds render a looping caption clip + WebM export.
  if (kind.editor === 'animated') return <AnimatedEditor graphic={graphic} />;

  const platform = (graphic.platformPresetId ?? 'instagram-carousel') as PlatformId;
  const preset = PLATFORM_PRESETS[platform];
  const ratio = platformToRatio(platform);
  const slides = kind.slides ?? [];

  const setInputs = (patch: Record<string, unknown>) =>
    store.updateGraphic(graphic.id, { inputs: { ...graphic.inputs, ...patch } });
  // editing a field writes an OVERRIDE (so master edits still flow through to untouched fields)
  const setCopyField = (k: string, v: string) =>
    setInputs({ copyOverrides: { ...overrides, [k]: v } });
  const resetToMaster = () => setInputs({ copyOverrides: {} });
  const overrideCount = Object.keys(overrides).length;

  const downloadSlide = async (i: number) => {
    setBusy(i);
    try { await exportSlide(slides[i], i, rows, copy, slides.length, format, ratio, graphic.name); }
    finally { setBusy(null); }
  };
  const downloadZip = async () => {
    setBusy('zip');
    try { await exportZip(slides, rows, copy, format, `${graphic.name}`, ratio); }
    finally { setBusy(null); }
  };
  // Animated output mode - same slides, exported as motion (WebM).
  const downloadAnimated = async () => {
    setBusy('anim');
    try { await downloadSlidesAnimatedWebM(graphic.name, { slides, rows, copy, ratio, perSlideMs: ANIM_MS[animSpeed] }); }
    finally { setBusy(null); }
  };

  // safe-area inset as % of the preset canvas (visual guide only)
  const safe = {
    top: `${(preset.safeArea.top / preset.height) * 100}%`,
    bottom: `${(preset.safeArea.bottom / preset.height) * 100}%`,
    left: `${(preset.safeArea.left / preset.width) * 100}%`,
    right: `${(preset.safeArea.right / preset.width) * 100}%`,
  };

  return (
    <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Link to={`/brands/${graphic.brandId}`} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
        <ArrowLeft size={14} /> {t('editor.backToBrand')}
      </Link>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <label className="group -mx-1 inline-flex min-w-0 items-center gap-2 rounded-lg px-1 hover:bg-zinc-100 focus-within:bg-zinc-100 dark:hover:bg-zinc-800 dark:focus-within:bg-zinc-800" title={t('editor.renameHint')}>
          <input
            value={graphic.name}
            onChange={(e) => store.updateGraphic(graphic.id, { name: e.target.value })}
            aria-label={t('common.rename')}
            className="min-w-0 bg-transparent text-[20px] font-bold tracking-tight text-zinc-900 focus:outline-none dark:text-zinc-50 sm:text-[22px]"
          />
          <Pencil size={15} className="shrink-0 text-zinc-400 transition-colors group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
        </label>
        <div className="flex items-center gap-3">
          <select
            value={platform}
            onChange={(e) => store.updateGraphic(graphic.id, { platformPresetId: e.target.value as PlatformId })}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-800 focus:border-violet-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {template.supportedPlatforms.map((p) => <option key={p} value={p}>{PLATFORM_PRESETS[p].name}</option>)}
          </select>
          <Button onClick={() => setTab('export')} disabled={!!error}><Download size={15} /> {t('editor.exportImage')}</Button>
        </div>
      </header>

      {/* One template, output modes - Design, Animation, Export (Issue 1). */}
      <div className="mb-6">
        <Tabs value={tab} onChange={setTab} tabs={(['design', 'animation', 'export'] as const).map((tb) => ({ id: tb, label: t(`editor.tab.${tb}` as const) }))} />
      </div>

      {tab === 'design' && (
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[360px_1fr]">
        <div className="flex flex-col gap-5">
          <Panel className="p-5">
            <DataInput value={rawText} onChange={(t) => setInputs({ rawText: t })} warnings={warnings} error={error} rowCount={rows.length} onLoadSample={() => setInputs({ rawText: kind.sampleData })} />
          </Panel>
          <Panel className="p-5">
            <CopyEditor copy={copy as unknown as Record<string, string | undefined>} onChange={setCopyField} fields={kind.copyFields} />
            <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3 text-[12px] dark:border-zinc-800">
              <span className="text-zinc-500 dark:text-zinc-400">{overrideCount ? t('master.overridden', { n: overrideCount }) : t('master.inheriting')}</span>
              <div className="flex items-center gap-3">
                {overrideCount > 0 && <button onClick={resetToMaster} className="font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300">{t('master.reset')}</button>}
                <Link to={`/templates/${template.id}/master`} className="font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300">{t('master.edit')}</Link>
              </div>
            </div>
          </Panel>
          <ReviewPanel slides={slides} rows={rows} copy={copy} ratio={ratio} brand={store.getBrand(graphic.brandId)} />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-[12px] text-zinc-500 dark:text-zinc-400">{preset.name} · {preset.width}×{preset.height}{preset.notes ? ` · ${preset.notes}` : ''}</p>
            <button onClick={() => setShowSafe((s) => !s)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-semibold ${showSafe ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}>
              <ShieldCheck size={14} /> {t('editor.safeAreas')}
            </button>
          </div>
          <Panel className="bg-zinc-100 p-4 dark:bg-zinc-800/40 sm:p-5">
            <div className="flex snap-x gap-5 overflow-x-auto pb-3">
              {slides.map((slide, i) => (
                <div key={slide.id} className="shrink-0 snap-start" style={{ width: ratio === 'story' ? 200 : ratio === 'landscape' ? 320 : 260 }}>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{i + 1}. {slide.label}</div>
                  <div className="relative overflow-hidden rounded-xl border border-zinc-200 shadow-sm shadow-zinc-900/[0.04] dark:border-zinc-700">
                    <SlideCanvas slide={slide} index={i} rows={rows} copy={copy} slideCount={slides.length} ratio={ratio} />
                    {showSafe && (
                      <div className="pointer-events-none absolute border border-dashed border-emerald-400/70" style={{ top: safe.top, bottom: safe.bottom, left: safe.left, right: safe.right }} />
                    )}
                  </div>
                  <button onClick={() => downloadSlide(i)} disabled={busy != null} className="mt-2 w-full rounded-lg border border-zinc-200 bg-white py-2 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
                    {busy === i ? t('editor.exporting') : t('editor.download')}
                  </button>
                </div>
              ))}
            </div>
          </Panel>
          <p className="text-[12px] text-zinc-400 dark:text-zinc-500">In-place click-to-edit on the canvas lands in the next phase. For now, edit content and copy on the left - the preview and export update live.</p>
        </div>
      </div>
      )}

      {tab === 'animation' && (
        <div className="mx-auto max-w-2xl">
          <Panel className="p-5 sm:p-6">
            <h3 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50">{t('editor.anim.title')}</h3>
            <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">{t('editor.anim.appliesNote')}</p>
            <label className="mb-1 mt-5 block text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('editor.anim.speed')}</label>
            <div className="inline-flex overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
              {(['fast', 'standard', 'slow'] as const).map((s) => (
                <button key={s} onClick={() => setAnimSpeed(s)} className={`px-4 py-2 text-[13px] font-semibold ${animSpeed === s ? 'bg-violet-600 text-white' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'}`}>{t(`editor.anim.${s}` as const)}</button>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <Button variant="subtle" onClick={downloadAnimated} disabled={busy != null || !!error} title={t('editor.animatedHint')}><Film size={15} /> {busy === 'anim' ? t('editor.building') : t('editor.animated')}</Button>
              <span className="text-[12px] text-zinc-500 dark:text-zinc-400">{t('editor.anim.note')}</span>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'export' && (
        <div className="grid gap-5 md:grid-cols-2">
          <Panel className="p-5 sm:p-6">
            <h3 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50">{t('editor.export.stillTitle')}</h3>
            <label className="mb-1 mt-4 block text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('editor.export.format')}</label>
            <div className="inline-flex overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
              {['image/png', 'image/jpeg'].map((m) => (
                <button key={m} onClick={() => setFormat(m)} className={`px-4 py-2 text-[13px] font-semibold ${format === m ? 'bg-violet-600 text-white' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'}`}>{m === 'image/png' ? 'PNG' : 'JPEG'}</button>
              ))}
            </div>
            <div className="mt-5 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <Button onClick={downloadZip} disabled={busy != null || !!error}><Download size={15} /> {busy === 'zip' ? t('editor.building') : t('editor.export')}</Button>
            </div>
            <label className="mb-2 mt-5 block text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('editor.export.perSlide')}</label>
            <div className="grid grid-cols-2 gap-2">
              {slides.map((slide, i) => (
                <button key={slide.id} onClick={() => downloadSlide(i)} disabled={busy != null} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-[12px] font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
                  {busy === i ? t('editor.exporting') : `${i + 1}. ${slide.label}`}
                </button>
              ))}
            </div>
          </Panel>
          <Panel className="p-5 sm:p-6">
            <h3 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50">{t('editor.export.animatedTitle')}</h3>
            <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">{t('editor.animatedHint')}</p>
            <div className="mt-5">
              <Button variant="subtle" onClick={downloadAnimated} disabled={busy != null || !!error}><Film size={15} /> {busy === 'anim' ? t('editor.building') : t('editor.animated')}</Button>
            </div>
            <p className="mt-4 text-[12px] text-zinc-400 dark:text-zinc-500">{t('editor.export.mp4Soon')}</p>
          </Panel>
        </div>
      )}
    </div>
  );
}
