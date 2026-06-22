// ═══ Postio Coach: Analyse a post ═══
// Pick a post -> run the enabled benchmarks -> structured result -> persist.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Gauge, Clock } from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { useOverlay } from '@engine/components/primitives';
import { Button, Panel, Badge, EmptyState } from '@engine/components/ui';
import { PLATFORM_PRESETS } from '@engine/lib/platforms/presets';
import { extractPostText, runPostAnalysis } from '@engine/lib/coach/analysis';
import type { PlatformId, PostAnalysis } from '@engine/lib/model/types';
import { AnalysisResultView, ScoreBar, useCoachConfig } from './shared';

export default function AnalysePanel({ brandId }: { brandId: string }) {
  const store = useStore();
  const { t } = useI18n();
  const { toast } = useOverlay();
  const { enabledIds } = useCoachConfig(brandId);
  const graphics = store.graphicsByBrand(brandId);
  const brand = store.getBrand(brandId);
  const refs = store.referenceAccountsByBrand(brandId);
  const perf = store.performanceByBrand(brandId);

  const [selectedId, setSelectedId] = useState<string>(graphics[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ analysis: Omit<PostAnalysis, 'id' | 'createdAt'>; usedAI: boolean } | null>(null);

  const selected = graphics.find((g) => g.id === selectedId);
  const latestByPost = useMemo(() => {
    const map = new Map<string, PostAnalysis>();
    for (const a of store.analysesByBrand(brandId)) if (!map.has(a.postId)) map.set(a.postId, a);
    return map;
  }, [store, brandId]);

  const run = async () => {
    if (!selected) return;
    setBusy(true); setResult(null);
    const platformName = PLATFORM_PRESETS[(selected.platformPresetId ?? 'instagram-feed') as PlatformId]?.name ?? 'Instagram';
    const templateName = store.getTemplate(selected.templateId)?.name;
    const r = await runPostAnalysis({
      text: extractPostText(selected), brand, platformName, enabledIds,
      referenceAccounts: refs, performanceEntries: perf,
      ids: { postId: selected.id, brandId }, templateName,
    });
    store.saveAnalysis(r.analysis);
    if (r.recommendations.length) store.saveRecommendations(r.recommendations);
    setResult({ analysis: r.analysis, usedAI: r.usedAI });
    setBusy(false);
    toast({ message: r.usedAI ? t('coach.analysedAI') : t('coach.analysedOffline') });
  };

  if (!graphics.length) {
    return <EmptyState title={t('coach.noPostsTitle')} hint={t('coach.noPostsHint')} action={<Link to={`/brands/${brandId}`}><Button variant="subtle">{t('coach.goToContent')}</Button></Link>} />;
  }

  return (
    <div className="space-y-4">
      <Panel className="p-4">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('coach.choosePost')}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {graphics.map((g) => {
            const a = latestByPost.get(g.id);
            const active = g.id === selectedId;
            return (
              <button key={g.id} onClick={() => { setSelectedId(g.id); setResult(null); }}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${active ? 'border-violet-400 bg-violet-50 dark:border-violet-500/40 dark:bg-violet-500/10' : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'}`}>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">{g.name}</span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{PLATFORM_PRESETS[(g.platformPresetId ?? 'instagram-feed') as PlatformId]?.name}</span>
                </span>
                {a ? <ScoreBar score={a.overallScore} /> : <Badge tone="muted">{t('coach.notAnalysed')}</Badge>}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <Button onClick={run} disabled={busy || !selected}><Sparkles size={14} /> {busy ? t('coach.analysing') : t('coach.runAnalysis')}</Button>
          <span className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400"><Gauge size={13} /> {t('coach.benchmarksActive', { n: enabledIds.length })}</span>
        </div>
      </Panel>

      {busy && <Panel className="p-6"><p className="text-center text-[13px] text-zinc-500 dark:text-zinc-400">{t('coach.analysing')}…</p></Panel>}

      {result && <AnalysisResultView analysis={result.analysis} usedAI={result.usedAI} />}

      {!result && !busy && selected && latestByPost.get(selected.id) && (
        <div className="space-y-3">
          <p className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400"><Clock size={13} /> {t('coach.lastAnalysis')}</p>
          <AnalysisResultView analysis={latestByPost.get(selected.id)!} usedAI={latestByPost.get(selected.id)!.modelUsed !== 'deterministic'} />
        </div>
      )}
    </div>
  );
}
