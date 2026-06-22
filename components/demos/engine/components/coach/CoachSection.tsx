// ═══ Postio Coach ═══
// The Insights surface: a structured AI content coach. Sub-navigation across
// Overview / Analyse / Benchmarks / Reference accounts / Performance /
// Recommendations / Presets, plus the existing reference-post Audit (passed in
// as a slot so that working feature is untouched).

import { useMemo, useState, type ReactNode } from 'react';
import { Gauge, Sparkles, Sliders, Users, TrendingUp, ListChecks, Layers, ImageDown, Compass } from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { Tabs } from '@engine/components/primitives';
import { Button, Panel, Badge } from '@engine/components/ui';
import type { StringKey } from '@engine/lib/i18n/strings';
import AnalysePanel from './AnalysePanel';
import BenchmarksPanel from './BenchmarksPanel';
import ReferenceAccountsPanel from './ReferenceAccountsPanel';
import PerformancePanel from './PerformancePanel';
import RecommendationsPanel from './RecommendationsPanel';
import PresetsPanel from './PresetsPanel';
import StrategyPanel from './StrategyPanel';
import { ScoreRing, useCoachConfig } from './shared';

type Sub = 'overview' | 'strategy' | 'analyse' | 'benchmarks' | 'accounts' | 'performance' | 'recommendations' | 'presets' | 'audit';

export default function CoachSection({ brandId, auditSlot }: { brandId: string; auditSlot?: ReactNode }) {
  const { t } = useI18n();
  const [sub, setSub] = useState<Sub>('overview');

  const SUBS: { id: Sub; key: StringKey; icon: ReactNode }[] = [
    { id: 'overview', key: 'coach.sub.overview', icon: <Gauge size={14} /> },
    { id: 'strategy', key: 'coach.sub.strategy', icon: <Compass size={14} /> },
    { id: 'analyse', key: 'coach.sub.analyse', icon: <Sparkles size={14} /> },
    { id: 'benchmarks', key: 'coach.sub.benchmarks', icon: <Sliders size={14} /> },
    { id: 'accounts', key: 'coach.sub.accounts', icon: <Users size={14} /> },
    { id: 'performance', key: 'coach.sub.performance', icon: <TrendingUp size={14} /> },
    { id: 'recommendations', key: 'coach.sub.recommendations', icon: <ListChecks size={14} /> },
    { id: 'presets', key: 'coach.sub.presets', icon: <Layers size={14} /> },
    ...(auditSlot ? [{ id: 'audit' as Sub, key: 'coach.sub.audit' as StringKey, icon: <ImageDown size={14} /> }] : []),
  ];

  return (
    <div>
      <div className="mb-5 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"><Sparkles size={17} /></span>
        <div>
          <h2 className="text-[17px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{t('coach.title')}</h2>
          <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{t('coach.tagline')}</p>
        </div>
      </div>

      <div className="mb-5">
        <Tabs<Sub> tabs={SUBS.map((s) => ({ id: s.id, label: <span className="inline-flex items-center gap-1.5">{s.icon}{t(s.key)}</span> }))} value={sub} onChange={setSub} />
      </div>

      {sub === 'overview' && <Overview brandId={brandId} go={setSub} />}
      {sub === 'strategy' && <StrategyPanel brandId={brandId} />}
      {sub === 'analyse' && <AnalysePanel brandId={brandId} />}
      {sub === 'benchmarks' && <BenchmarksPanel brandId={brandId} />}
      {sub === 'accounts' && <ReferenceAccountsPanel brandId={brandId} />}
      {sub === 'performance' && <PerformancePanel brandId={brandId} />}
      {sub === 'recommendations' && <RecommendationsPanel brandId={brandId} />}
      {sub === 'presets' && <PresetsPanel brandId={brandId} />}
      {sub === 'audit' && auditSlot}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Panel className="p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-[22px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{value}</p>
      {hint && <p className="mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-400">{hint}</p>}
    </Panel>
  );
}

function Overview({ brandId, go }: { brandId: string; go: (s: Sub) => void }) {
  const store = useStore();
  const { t } = useI18n();
  const { enabledIds } = useCoachConfig(brandId);

  const graphics = store.graphicsByBrand(brandId);
  const analyses = store.analysesByBrand(brandId);
  const recs = store.recommendationsByBrand(brandId);
  const openRecs = recs.filter((r) => !r.applied);
  const refs = store.referenceAccountsByBrand(brandId);
  const perf = store.performanceByBrand(brandId);

  // Latest analysis per post -> average score + which posts still need a look.
  const latest = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of analyses) if (!m.has(a.postId)) m.set(a.postId, a.overallScore);
    return m;
  }, [analyses]);
  const scored = Array.from(latest.values());
  const avg = scored.length ? Math.round(scored.reduce((s, n) => s + n, 0) / scored.length) : 0;
  const unanalysed = graphics.filter((g) => !latest.has(g.id)).length;

  const topOpen = [...openRecs].sort((a, b) => weight(b.priority) - weight(a.priority)).slice(0, 4);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Panel className="flex items-center gap-4 p-4">
          <ScoreRing score={avg} size={64} />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('coach.avgScore')}</p>
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{t('coach.acrossPosts', { n: scored.length })}</p>
          </div>
        </Panel>
        <Stat label={t('coach.postsToReview')} value={unanalysed} hint={t('coach.ofPosts', { n: graphics.length })} />
        <Stat label={t('coach.openActions')} value={openRecs.length} hint={t('coach.recsTracked', { n: recs.length })} />
        <Stat label={t('coach.activeBenchmarks')} value={enabledIds.length} hint={t('coach.contextLine', { a: refs.length, p: perf.length })} />
      </div>

      <Panel className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-zinc-900 dark:text-zinc-50"><ListChecks size={15} className="text-violet-600 dark:text-violet-400" /> {t('coach.actNext')}</p>
          {openRecs.length > 0 && <Button variant="ghost" onClick={() => go('recommendations')}>{t('coach.viewAll')}</Button>}
        </div>
        {topOpen.length ? (
          <ul className="mt-3 space-y-2">
            {topOpen.map((r) => (
              <li key={r.id} className="flex items-start gap-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
                <Badge tone="accent">{t(`coach.recType.${r.type}` as StringKey)}</Badge>
                <span className="text-[12.5px] leading-relaxed text-zinc-700 dark:text-zinc-200">{r.suggestedValue}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[12.5px] text-zinc-500 dark:text-zinc-400">{t('coach.allClear')}</p>
        )}
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2">
        <CtaCard icon={<Compass size={16} />} title={t('coach.cta.strategy')} body={t('coach.cta.strategyBody')} onClick={() => go('strategy')} />
        <CtaCard icon={<Sparkles size={16} />} title={t('coach.cta.analyse')} body={t('coach.cta.analyseBody')} onClick={() => go('analyse')} />
        <CtaCard icon={<Sliders size={16} />} title={t('coach.cta.benchmarks')} body={t('coach.cta.benchmarksBody')} onClick={() => go('benchmarks')} />
        <CtaCard icon={<Users size={16} />} title={t('coach.cta.accounts')} body={t('coach.cta.accountsBody')} onClick={() => go('accounts')} />
        <CtaCard icon={<TrendingUp size={16} />} title={t('coach.cta.performance')} body={t('coach.cta.performanceBody')} onClick={() => go('performance')} />
      </div>
    </div>
  );
}

function CtaCard({ icon, title, body, onClick }: { icon: ReactNode; title: string; body: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-left transition-all hover:border-violet-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-500/40">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600 transition-colors group-hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-300">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">{title}</span>
        <span className="mt-0.5 block text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">{body}</span>
      </span>
    </button>
  );
}

const weight = (p: string) => (p === 'high' ? 3 : p === 'medium' ? 2 : 1);
