import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Pencil, Film } from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { Button, Panel } from '@engine/components/ui';
import CopyEditor from '@engine/components/CopyEditor';
import AnimatedCanvas from '@engine/components/AnimatedCanvas';
import { getKind, platformToRatio } from '@engine/lib/templates/registry';
import { effectiveCopy, graphicOverrides } from '@engine/lib/carousel/copy';
import { downloadAnimatedWebM, webmSupported } from '@engine/lib/carousel/exportAnimated';
import { ANIMATED_COPY_FIELDS } from '@engine/lib/carousel/animated';
import type { RatioKey } from '@engine/lib/canvas/CanvasRenderer';
import type { GeneratedGraphic } from '@engine/lib/model/types';

const RATIO_OPTS: { key: RatioKey; label: string }[] = [
  { key: 'story', label: '9:16' },
  { key: 'portrait', label: '4:5' },
  { key: 'square', label: '1:1' },
];

export default function AnimatedEditor({ graphic }: { graphic: GeneratedGraphic }) {
  const store = useStore();
  const { t } = useI18n();
  const template = store.getTemplate(graphic.templateId);
  const kind = template && getKind(template.kind);

  const overrides = graphicOverrides(graphic.inputs);
  const master = (template?.master?.copy as Record<string, string> | undefined);
  const copy = effectiveCopy(kind?.defaultCopy, master, overrides);

  const [ratio, setRatio] = useState<RatioKey>(platformToRatio(graphic.platformPresetId));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!template || !kind) return null;

  const setField = (k: string, v: string) =>
    store.updateGraphic(graphic.id, { inputs: { ...graphic.inputs, copyOverrides: { ...overrides, [k]: v } } });

  const download = async () => {
    setErr(null);
    setBusy(true);
    try {
      await downloadAnimatedWebM(graphic.name, { copy, ratio });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Export failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1100px] px-8 py-8">
      <Link to={`/brands/${graphic.brandId}`} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-white/45 hover:text-white">
        <ArrowLeft size={14} /> {t('editor.backToBrand')}
      </Link>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <label className="group inline-flex items-center gap-2 rounded-lg px-1 -mx-1 hover:bg-white/5">
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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 px-2.5 py-1 text-[11px] font-semibold text-indigo-200"><Film size={12} /> Animated · beta</span>
          <Button onClick={download} disabled={busy || !webmSupported()} title={!webmSupported() ? 'This browser can’t record video' : undefined}>
            <Download size={15} /> {busy ? 'Recording…' : 'Download WebM'}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[360px_1fr]">
        <div className="flex flex-col gap-5">
          <Panel className="p-5"><CopyEditor copy={copy} onChange={setField} fields={ANIMATED_COPY_FIELDS} /></Panel>
          {err && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">{err}</p>}
          <p className="text-[12px] text-white/35">A looping caption clip rendered on the brand canvas, exported as WebM in-browser. MP4 + burnt-in subtitles arrive with the video worker (Phase 2b).</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            {RATIO_OPTS.map((o) => (
              <button key={o.key} onClick={() => setRatio(o.key)} className={`rounded-lg border px-3 py-1.5 text-[12px] font-semibold ${ratio === o.key ? 'border-indigo-400/70 bg-indigo-500/10 text-white' : 'border-white/10 text-white/55 hover:bg-white/5'}`}>{o.label}</button>
            ))}
          </div>
          <div className="mx-auto w-full max-w-[360px]"><AnimatedCanvas copy={copy} ratio={ratio} /></div>
        </div>
      </div>
    </div>
  );
}
