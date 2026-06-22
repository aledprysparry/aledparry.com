import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Pencil, Film } from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { Button, Panel } from '@engine/components/ui';
import { Tabs } from '@engine/components/primitives';
import CopyEditor from '@engine/components/CopyEditor';
import AnimatedCanvas from '@engine/components/AnimatedCanvas';
import { getKind, platformToRatio } from '@engine/lib/templates/registry';
import { effectiveCopy, graphicOverrides } from '@engine/lib/carousel/copy';
import { downloadAnimatedWebM, webmSupported } from '@engine/lib/carousel/exportAnimated';
import { ANIMATED_COPY_FIELDS, ANIMATED_STYLES, ANIMATED_BGS } from '@engine/lib/carousel/animated';
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
  // Same three-tab shell as the still/carousel editor (one product, Issue 1).
  const [tab, setTab] = useState<'design' | 'animation' | 'export'>('design');

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
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Link to={`/brands/${graphic.brandId}`} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
        <ArrowLeft size={14} /> {t('editor.backToBrand')}
      </Link>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <label className="group -mx-1 inline-flex min-w-0 items-center gap-2 rounded-lg px-1 hover:bg-zinc-100 focus-within:bg-zinc-100 dark:hover:bg-zinc-800 dark:focus-within:bg-zinc-800">
          <input
            value={graphic.name}
            onChange={(e) => store.updateGraphic(graphic.id, { name: e.target.value })}
            aria-label={t('common.rename')}
            className="min-w-0 bg-transparent text-[20px] font-bold tracking-tight text-zinc-900 focus:outline-none dark:text-zinc-50 sm:text-[22px]"
          />
          <Pencil size={15} className="shrink-0 text-zinc-400 transition-colors group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
        </label>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"><Film size={12} /> Animated · beta</span>
          <Button onClick={() => setTab('export')}><Download size={15} /> {t('editor.exportImage')}</Button>
        </div>
      </header>

      {/* Same Design, Animation, Export shell as the still editor. */}
      <div className="mb-6">
        <Tabs value={tab} onChange={setTab} tabs={(['design', 'animation', 'export'] as const).map((tb) => ({ id: tb, label: t(`editor.tab.${tb}` as const) }))} />
      </div>

      {tab === 'design' && (
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[360px_1fr]">
          <Panel className="h-fit p-5"><CopyEditor copy={copy} onChange={setField} fields={ANIMATED_COPY_FIELDS} /></Panel>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              {RATIO_OPTS.map((o) => (
                <button key={o.key} onClick={() => setRatio(o.key)} className={`rounded-lg border px-3 py-2 text-[12px] font-semibold ${ratio === o.key ? 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-500/15 dark:text-violet-300' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'}`}>{o.label}</button>
              ))}
            </div>
            <div className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800/40 sm:p-6"><div className="mx-auto w-full max-w-[360px]"><AnimatedCanvas copy={copy} ratio={ratio} /></div></div>
          </div>
        </div>
      )}

      {tab === 'animation' && (
        <div className="mx-auto max-w-2xl">
          <Panel className="space-y-4 p-5 sm:p-6">
            <div>
              <p className="mb-1.5 text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">{t('editor.anim.motion')}</p>
              <div className="flex flex-wrap gap-2">
                {ANIMATED_STYLES.map((s) => (
                  <button key={s.key} onClick={() => setField('style', s.key)} className={`rounded-lg border px-3 py-2 text-[12px] font-semibold ${(copy.style || 'rise') === s.key ? 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-500/15 dark:text-violet-300' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'}`}>{s.label}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[12px] font-semibold text-zinc-600 dark:text-zinc-300">{t('editor.anim.background')}</p>
              <div className="flex flex-wrap gap-2">
                {ANIMATED_BGS.map((b) => (
                  <button key={b.key} onClick={() => setField('bg', b.key)} className={`rounded-lg border px-3 py-2 text-[12px] font-semibold ${(copy.bg || 'halftone') === b.key ? 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-500/15 dark:text-violet-300' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'}`}>{b.label}</button>
                ))}
              </div>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'export' && (
        <div className="mx-auto max-w-2xl">
          <Panel className="p-5 sm:p-6">
            <h3 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50">{t('editor.export.animatedTitle')}</h3>
            <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">{t('editor.animatedHint')}</p>
            <div className="mt-5">
              <Button onClick={download} disabled={busy || !webmSupported()} title={!webmSupported() ? 'This browser can’t record video' : undefined}>
                <Download size={15} /> {busy ? t('editor.building') : t('editor.animated')}
              </Button>
            </div>
            {err && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">{err}</p>}
            <p className="mt-4 text-[12px] text-zinc-400 dark:text-zinc-500">{t('editor.export.mp4Soon')}</p>
          </Panel>
        </div>
      )}
    </div>
  );
}
