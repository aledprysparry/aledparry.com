// ═══ Postio Coach: shared UI building blocks ═══
// Structured + scannable, never a chat UI. Light + dark, violet brand.

import { useMemo, type ReactNode } from 'react';
import { AlertTriangle, ArrowUpRight, Check, ChevronRight, Lightbulb, ShieldAlert, Zap } from 'lucide-react';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { useStore } from '@engine/lib/store/StoreProvider';
import type { StringKey } from '@engine/lib/i18n/strings';
import type { AnalysisCategoryResult, ActionPlan, PostAnalysis, Priority } from '@engine/lib/model/types';
import { BENCHMARK_BY_ID, DEFAULT_BENCHMARK_IDS, sanitiseBenchmarkIds } from '@engine/lib/coach/benchmarks';

// ── i18n helpers (localised label/desc with English catalog fallback) ──
export function useBm() {
  const { t } = useI18n();
  const label = (id: string) => t(`coach.bm.${id}` as StringKey) || BENCHMARK_BY_ID[id]?.label || id;
  const desc = (id: string) => t(`coach.bm.${id}.d` as StringKey) || BENCHMARK_BY_ID[id]?.desc || '';
  return { label, desc };
}

// ── per-brand benchmark configuration (live toggles) ──
export function useCoachConfig(brandId: string) {
  const store = useStore();
  const settings = store.getCoachSettings(brandId);
  const enabledIds = useMemo(
    () => sanitiseBenchmarkIds(settings?.enabledBenchmarkIds ?? DEFAULT_BENCHMARK_IDS),
    [settings?.enabledBenchmarkIds],
  );
  const setEnabled = (ids: string[], activePresetId?: string) =>
    store.setCoachSettings(brandId, { enabledBenchmarkIds: sanitiseBenchmarkIds(ids), activePresetId });
  const toggle = (id: string) =>
    setEnabled(enabledIds.includes(id) ? enabledIds.filter((x) => x !== id) : [...enabledIds, id]);
  return { enabledIds, setEnabled, toggle, activePresetId: settings?.activePresetId };
}

// ── score colours ──
export function scoreTone(score: number): { text: string; bg: string; ring: string; stroke: string } {
  if (score >= 75) return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', ring: 'ring-emerald-200 dark:ring-emerald-500/20', stroke: '#10b981' };
  if (score >= 55) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', ring: 'ring-amber-200 dark:ring-amber-500/20', stroke: '#f59e0b' };
  return { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', ring: 'ring-rose-200 dark:ring-rose-500/20', stroke: '#f43f5e' };
}

export function usePriorityLabel() {
  const { t } = useI18n();
  return (p: Priority) => t(`coach.priority.${p}` as StringKey);
}
export function priorityTone(p: Priority): string {
  if (p === 'high') return 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300';
  if (p === 'medium') return 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
  return 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300';
}

// ── score ring (SVG, animated stroke) ──
export function ScoreRing({ score, size = 84 }: { score: number; size?: number }) {
  const tone = scoreTone(score);
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - score / 100);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={6} className="stroke-zinc-200 dark:stroke-zinc-800" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={6} stroke={tone.stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset .7s cubic-bezier(0.22,1,0.36,1)' }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className={`text-[20px] font-bold tracking-tight ${tone.text}`}>{score}</span>
      </div>
    </div>
  );
}

// ── score bar (compact, for per-category rows) ──
export function ScoreBar({ score }: { score: number }) {
  const tone = scoreTone(score);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: tone.stroke, transition: 'width .6s cubic-bezier(0.22,1,0.36,1)' }} />
      </div>
      <span className={`w-7 text-right text-[12px] font-bold tabular-nums ${tone.text}`}>{score}</span>
    </div>
  );
}

// ── one benchmark category result ──
export function CategoryCard({ r }: { r: AnalysisCategoryResult }) {
  const { t } = useI18n();
  const { label } = useBm();
  const priorityLabel = usePriorityLabel();
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">{label(r.id)}</span>
        <ScoreBar score={r.score} />
      </div>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-zinc-600 dark:text-zinc-300">{r.summary}</p>
      {r.issue && (
        <p className="mt-1 inline-flex items-start gap-1.5 text-[12px] text-amber-700 dark:text-amber-400">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {r.issue}
        </p>
      )}
      <div className="mt-2 flex items-start gap-2 rounded-lg bg-violet-50 px-2.5 py-2 dark:bg-violet-500/10">
        <ArrowUpRight size={13} className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-400" />
        <p className="text-[12px] leading-relaxed text-zinc-700 dark:text-zinc-200">{r.recommendation}</p>
      </div>
      <div className="mt-2">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${priorityTone(r.priority)}`}>
          {priorityLabel(r.priority)} {t('coach.priority.suffix')}
        </span>
      </div>
    </div>
  );
}

// ── action plan ──
function PlanList({ icon, title, items, tone }: { icon: ReactNode; title: string; items: string[]; tone: string }) {
  if (!items.length) return null;
  return (
    <div>
      <p className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${tone}`}>{icon} {title}</p>
      <ul className="mt-1.5 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[12.5px] leading-relaxed text-zinc-700 dark:text-zinc-200">
            <ChevronRight size={13} className="mt-0.5 shrink-0 text-zinc-400" /> {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ActionPlanView({ plan }: { plan: ActionPlan }) {
  const { t } = useI18n();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <PlanList icon={<Zap size={12} />} title={t('coach.plan.quickWins')} items={plan.quickWins} tone="text-emerald-600 dark:text-emerald-400" />
      <PlanList icon={<Check size={12} />} title={t('coach.plan.recommendedEdits')} items={plan.recommendedEdits} tone="text-violet-600 dark:text-violet-400" />
      <PlanList icon={<Lightbulb size={12} />} title={t('coach.plan.experimentalIdeas')} items={plan.experimentalIdeas} tone="text-sky-600 dark:text-sky-400" />
      <PlanList icon={<ShieldAlert size={12} />} title={t('coach.plan.risks')} items={plan.risks} tone="text-rose-600 dark:text-rose-400" />
    </div>
  );
}

// ── full structured analysis result ──
export function AnalysisResultView({ analysis, usedAI }: { analysis: Pick<PostAnalysis, 'overallScore' | 'benchmarkResults' | 'actionPlan' | 'strengths' | 'issues' | 'platformNotes' | 'modelUsed'>; usedAI?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="space-y-5">
      {/* headline */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center">
        <ScoreRing score={analysis.overallScore} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('coach.overallScore')}</p>
          <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-50">{t('coach.scoreVerdict.' + (analysis.overallScore >= 75 ? 'strong' : analysis.overallScore >= 55 ? 'ok' : 'weak') as StringKey)}</p>
          {analysis.platformNotes && <p className="mt-1 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">{analysis.platformNotes}</p>}
          <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">{usedAI === false ? t('coach.modelOffline') : t('coach.modelAI')}</p>
        </div>
      </div>

      {/* strengths + issues */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-500/20 dark:bg-emerald-500/[0.07]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">{t('coach.topStrengths')}</p>
          <ul className="mt-1.5 space-y-1">
            {analysis.strengths.length ? analysis.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12.5px] text-zinc-700 dark:text-zinc-200"><Check size={12} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" /> {s}</li>
            )) : <li className="text-[12px] text-zinc-500 dark:text-zinc-400">{t('coach.none')}</li>}
          </ul>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 dark:border-amber-500/20 dark:bg-amber-500/[0.07]">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">{t('coach.topIssues')}</p>
          <ul className="mt-1.5 space-y-1">
            {analysis.issues.length ? analysis.issues.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[12.5px] text-zinc-700 dark:text-zinc-200"><AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" /> {s}</li>
            )) : <li className="text-[12px] text-zinc-500 dark:text-zinc-400">{t('coach.noneIssues')}</li>}
          </ul>
        </div>
      </div>

      {/* action plan */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('coach.actionPlan')}</p>
        <ActionPlanView plan={analysis.actionPlan} />
      </div>

      {/* per-category */}
      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('coach.benchmarkScores')}</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {[...analysis.benchmarkResults].sort((a, b) => a.score - b.score).map((r) => <CategoryCard key={r.id} r={r} />)}
        </div>
      </div>
    </div>
  );
}
