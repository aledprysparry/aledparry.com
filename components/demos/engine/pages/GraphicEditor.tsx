import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, ShieldCheck, Pencil } from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { Button, Panel, EmptyState } from '@engine/components/ui';
import DataInput from '@engine/components/DataInput';
import CopyEditor from '@engine/components/CopyEditor';
import SlideCanvas from '@engine/components/SlideCanvas';
import FreeformEditor from '@engine/components/FreeformEditor';
import { getKind, platformToRatio } from '@engine/lib/templates/registry';
import { PLATFORM_PRESETS } from '@engine/lib/platforms/presets';
import { exportSlide, exportZip } from '@engine/lib/carousel/exportCarousel';
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
  const [busy, setBusy] = useState<number | 'zip' | null>(null);
  const [showSafe, setShowSafe] = useState(false);

  const rawText = (graphic?.inputs?.rawText as string) ?? '';
  const copy = (graphic?.inputs?.copy as CarouselCopy) ?? ({} as CarouselCopy);
  const { rows, warnings, error } = useMemo(
    () => (kind?.parse ? kind.parse(rawText) : { rows: [], warnings: [], error: null }),
    [kind, rawText],
  );

  if (!graphic || !template || !kind) {
    return <div className="mx-auto max-w-3xl px-8 py-10"><EmptyState title={t('editor.notFound')} action={<Link to="/"><Button variant="subtle">{t('nav.dashboard')}</Button></Link>} /></div>;
  }

  // Free-form kinds use the in-place canvas editor instead of the carousel pipeline.
  if (kind.editor === 'freeform') return <FreeformEditor graphic={graphic} />;

  const platform = (graphic.platformPresetId ?? 'instagram-carousel') as PlatformId;
  const preset = PLATFORM_PRESETS[platform];
  const ratio = platformToRatio(platform);
  const slides = kind.slides ?? [];

  const setInputs = (patch: Record<string, unknown>) =>
    store.updateGraphic(graphic.id, { inputs: { ...graphic.inputs, ...patch } });
  const setCopyField = (k: string, v: string) =>
    setInputs({ copy: { ...copy, [k]: v } });

  const downloadSlide = async (i: number) => {
    setBusy(i);
    try { await exportSlide(slides[i], i, rows, copy, slides.length, format, ratio); }
    finally { setBusy(null); }
  };
  const downloadZip = async () => {
    setBusy('zip');
    try { await exportZip(slides, rows, copy, format, `${graphic.name}`, ratio); }
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
    <div className="mx-auto max-w-[1320px] px-8 py-8">
      <Link to={`/brands/${graphic.brandId}`} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-white/45 hover:text-white">
        <ArrowLeft size={14} /> {t('editor.backToBrand')}
      </Link>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <label className="group inline-flex items-center gap-2 rounded-lg px-1 -mx-1 hover:bg-white/5 focus-within:bg-white/5" title={t('editor.renameHint')}>
          <input
            value={graphic.name}
            onChange={(e) => store.updateGraphic(graphic.id, { name: e.target.value })}
            aria-label={t('common.rename')}
            className="bg-transparent text-[22px] font-extrabold tracking-tight focus:outline-none"
            style={{ fontFamily: 'Bitter, serif' }}
          />
          <Pencil size={15} className="text-white/30 transition-colors group-hover:text-white/60" />
        </label>
        <div className="flex items-center gap-3">
          <select
            value={platform}
            onChange={(e) => store.updateGraphic(graphic.id, { platformPresetId: e.target.value as PlatformId })}
            className="rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-[13px] text-white/90 focus:outline-none"
          >
            {template.supportedPlatforms.map((p) => <option key={p} value={p}>{PLATFORM_PRESETS[p].name}</option>)}
          </select>
          <div className="inline-flex overflow-hidden rounded-lg border border-white/10">
            {['image/png', 'image/jpeg'].map((m) => (
              <button key={m} onClick={() => setFormat(m)} className={`px-3 py-1.5 text-[13px] font-semibold ${format === m ? 'bg-indigo-500 text-white' : 'text-white/60 hover:bg-white/5'}`}>{m === 'image/png' ? 'PNG' : 'JPEG'}</button>
            ))}
          </div>
          <Button onClick={downloadZip} disabled={busy != null || !!error}><Download size={15} /> {busy === 'zip' ? t('editor.building') : t('editor.export')}</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-7">
        <div className="flex flex-col gap-5">
          <Panel className="p-5">
            <DataInput value={rawText} onChange={(t) => setInputs({ rawText: t })} warnings={warnings} error={error} rowCount={rows.length} onLoadSample={() => setInputs({ rawText: kind.sampleData })} />
          </Panel>
          <Panel className="p-5"><CopyEditor copy={copy as unknown as Record<string, string | undefined>} onChange={setCopyField} fields={kind.copyFields} /></Panel>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-white/40">{preset.name} · {preset.width}×{preset.height}{preset.notes ? ` · ${preset.notes}` : ''}</p>
            <button onClick={() => setShowSafe((s) => !s)} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold ${showSafe ? 'bg-indigo-500/20 text-indigo-200' : 'text-white/50 hover:bg-white/5'}`}>
              <ShieldCheck size={14} /> {t('editor.safeAreas')}
            </button>
          </div>
          <Panel className="p-5">
            <div className="flex gap-5 overflow-x-auto pb-3 snap-x">
              {slides.map((slide, i) => (
                <div key={slide.id} className="shrink-0 snap-start" style={{ width: ratio === 'story' ? 220 : ratio === 'landscape' ? 380 : 280 }}>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/45">{i + 1}. {slide.label}</div>
                  <div className="relative overflow-hidden rounded-xl border border-white/10 shadow-xl shadow-black/40">
                    <SlideCanvas slide={slide} index={i} rows={rows} copy={copy} slideCount={slides.length} ratio={ratio} />
                    {showSafe && (
                      <div className="pointer-events-none absolute border border-dashed border-emerald-400/70" style={{ top: safe.top, bottom: safe.bottom, left: safe.left, right: safe.right }} />
                    )}
                  </div>
                  <button onClick={() => downloadSlide(i)} disabled={busy != null} className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 py-2 text-[12px] font-semibold text-white/80 hover:bg-white/10 disabled:opacity-50">
                    {busy === i ? t('editor.exporting') : t('editor.download')}
                  </button>
                </div>
              ))}
            </div>
          </Panel>
          <p className="text-[12px] text-white/35">In-place click-to-edit on the canvas lands in the next phase. For now, edit content and copy on the left - the preview and export update live.</p>
        </div>
      </div>
    </div>
  );
}
