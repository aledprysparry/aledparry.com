// ═══ Postio Coach: Performance insights ═══
// Import metrics (manual / CSV / sample) and learn what works. No live APIs.

import { useState } from 'react';
import { Plus, Trash2, Upload, Sparkles, TrendingUp, BarChart3 } from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { useOverlay } from '@engine/components/primitives';
import { Button, Panel, Badge, TextInput, EmptyState } from '@engine/components/ui';
import { callCoach } from '@engine/lib/coach/analysis';
import { SAMPLE_PERFORMANCE, localPerformanceInsights, parsePerformanceCsv } from '@engine/lib/coach/mock';
import type { PerformanceEntry, PerformanceInsight, PostPerformanceMetrics } from '@engine/lib/model/types';
import type { StringKey } from '@engine/lib/i18n/strings';

function engagement(m: PostPerformanceMetrics): number | null {
  if (typeof m.engagementRate === 'number') return m.engagementRate;
  const denom = m.reach ?? m.impressions;
  const inter = (m.likes ?? 0) + (m.comments ?? 0) + (m.shares ?? 0) + (m.saves ?? 0);
  return denom && denom > 0 ? inter / denom : null;
}

export default function PerformancePanel({ brandId }: { brandId: string }) {
  const store = useStore();
  const { t } = useI18n();
  const { confirm, toast } = useOverlay();
  const entries = store.performanceByBrand(brandId);

  const graphics = store.graphicsByBrand(brandId);
  const [label, setLabel] = useState('');
  const [postId, setPostId] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [impressions, setImpressions] = useState('');
  const [likes, setLikes] = useState('');
  const [comments, setComments] = useState('');
  const [saves, setSaves] = useState('');
  const [insights, setInsights] = useState<PerformanceInsight[] | null>(null);
  const [busy, setBusy] = useState(false);

  const numOr = (s: string): number | undefined => { const n = parseFloat(s.replace(/[, ]/g, '')); return Number.isNaN(n) ? undefined : n; };

  const addManual = () => {
    const linked = postId ? store.getGraphic(postId) : undefined;
    const name = label.trim() || linked?.name;
    if (!name) return;
    store.addPerformance(brandId, { label: name, postId: postId || undefined, source: 'manual', metrics: { platform, impressions: numOr(impressions), likes: numOr(likes), comments: numOr(comments), saves: numOr(saves) } });
    setLabel(''); setPostId(''); setImpressions(''); setLikes(''); setComments(''); setSaves(''); setInsights(null);
  };

  // Correlate analysis score with engagement, for linked posts.
  const scoreInsight = (): PerformanceInsight | null => {
    const linked = entries.filter((e) => e.postId).map((e) => {
      const a = store.latestAnalysis(e.postId!);
      const er = engagement(e.metrics);
      return a && er !== null ? { score: a.overallScore, er } : null;
    }).filter(Boolean) as { score: number; er: number }[];
    if (linked.length < 2) return null;
    const hi = linked.filter((x) => x.score >= 70).map((x) => x.er);
    const lo = linked.filter((x) => x.score < 70).map((x) => x.er);
    if (!hi.length || !lo.length) return null;
    const a = hi.reduce((s, x) => s + x, 0) / hi.length;
    const b = lo.reduce((s, x) => s + x, 0) / lo.length;
    if (a <= b) return null;
    return {
      insight: `Higher-scoring posts earn more engagement for you.`,
      evidence: `Posts scoring 70+ average ${(a * 100).toFixed(1)}% engagement vs ${(b * 100).toFixed(1)}% for lower-scoring ones.`,
      recommendation: 'Act on Coach recommendations before posting; lifting the score has tracked with real engagement gains for your account.',
      confidence: linked.length >= 4 ? 'high' : 'medium',
    };
  };

  const importCsv = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const rows = parsePerformanceCsv(text);
    if (!rows.length) { toast({ message: t('coach.csvEmpty') }); return; }
    for (const r of rows) store.addPerformance(brandId, { label: r.label, source: 'csv', metrics: r.metrics });
    setInsights(null);
    toast({ message: t('coach.csvImported', { n: rows.length }) });
  };

  const loadSamples = () => {
    for (const s of SAMPLE_PERFORMANCE) { const { label: l, ...metrics } = s; store.addPerformance(brandId, { label: l, source: 'sample', metrics }); }
    setInsights(null);
    toast({ message: t('coach.samplesLoaded') });
  };

  const generate = async () => {
    setBusy(true);
    const { result } = await callCoach<{ insights?: PerformanceInsight[] }>('coach-performance', {
      entries: entries.map((e) => ({ label: e.label, platform: e.metrics.platform, metrics: e.metrics })),
    });
    const base = result?.insights?.length ? result.insights : localPerformanceInsights(entries);
    const si = scoreInsight();
    setInsights(si ? [si, ...base] : base);
    setBusy(false);
  };

  const remove = async (e: PerformanceEntry) => {
    if (await confirm({ title: t('coach.removeRowTitle'), confirmLabel: t('coach.delete'), cancelLabel: t('coach.cancel'), danger: true })) store.removePerformance(e.id);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[12px] leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-300">{t('coach.perfIntro')}</div>

      <Panel className="p-4">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('coach.addManually')}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="col-span-2 sm:col-span-1"><TextInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t('coach.perfLabel')} /></div>
          {graphics.length > 0 && (
            <select value={postId} onChange={(e) => setPostId(e.target.value)} className="col-span-2 eng-control rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:col-span-1">
              <option value="">{t('coach.linkPostNone')}</option>
              {graphics.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="eng-control rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
            {['instagram', 'tiktok', 'facebook', 'linkedin', 'youtube', 'x'].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <TextInput value={impressions} onChange={(e) => setImpressions(e.target.value)} placeholder={t('coach.perfImpressions')} inputMode="numeric" />
          <TextInput value={likes} onChange={(e) => setLikes(e.target.value)} placeholder={t('coach.perfLikes')} inputMode="numeric" />
          <TextInput value={comments} onChange={(e) => setComments(e.target.value)} placeholder={t('coach.perfComments')} inputMode="numeric" />
          <TextInput value={saves} onChange={(e) => setSaves(e.target.value)} placeholder={t('coach.perfSaves')} inputMode="numeric" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <Button onClick={addManual} disabled={!label.trim()}><Plus size={14} /> {t('coach.addRow')}</Button>
          <label className="cursor-pointer">
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => importCsv(e.target.files?.[0] ?? null)} />
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-zinc-800 ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700"><Upload size={14} /> {t('coach.importCsv')}</span>
          </label>
          {!entries.length && <Button variant="ghost" onClick={loadSamples}><Sparkles size={13} /> {t('coach.loadSampleData')}</Button>}
        </div>
      </Panel>

      {entries.length === 0 ? (
        <EmptyState title={t('coach.noPerfTitle')} hint={t('coach.noPerfHint')} />
      ) : (
        <>
          <Panel className="overflow-hidden">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {entries.map((e) => {
                const er = engagement(e.metrics);
                return (
                  <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-50">{e.label || t('coach.untitledPost')}</span>
                        {e.metrics.platform && <Badge tone="muted">{e.metrics.platform}</Badge>}
                        {e.postId && store.getGraphic(e.postId) && <Badge tone="accent">{t('coach.linked')}</Badge>}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {e.metrics.impressions ? `${fmt(e.metrics.impressions)} ${t('coach.impr')} · ` : ''}{e.metrics.likes ? `${fmt(e.metrics.likes)} ${t('coach.likes')} · ` : ''}{e.metrics.saves ? `${fmt(e.metrics.saves)} ${t('coach.saves')}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {er !== null && <span className="text-[12px] font-bold tabular-nums text-zinc-700 dark:text-zinc-200">{(er * 100).toFixed(1)}%</span>}
                      <button onClick={() => remove(e)} aria-label={t('coach.delete')} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-rose-600 dark:hover:bg-zinc-800"><Trash2 size={13} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <div className="flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"><TrendingUp size={13} /> {t('coach.insights')}</p>
            <Button variant="subtle" onClick={generate} disabled={busy}><Sparkles size={14} /> {busy ? t('coach.analysing') : t('coach.generateInsights')}</Button>
          </div>
          {insights && (
            insights.length ? (
              <div className="space-y-2.5">
                {insights.map((ins, i) => (
                  <div key={i} className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-start justify-between gap-2">
                      <p className="inline-flex items-start gap-1.5 text-[13px] font-semibold text-zinc-900 dark:text-zinc-50"><BarChart3 size={14} className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-400" /> {ins.insight}</p>
                      <Badge tone="muted">{t(`coach.confidence.${ins.confidence}` as StringKey)}</Badge>
                    </div>
                    <p className="mt-1 pl-5 text-[12px] text-zinc-500 dark:text-zinc-400">{ins.evidence}</p>
                    <p className="mt-1.5 pl-5 text-[12.5px] leading-relaxed text-zinc-700 dark:text-zinc-200">{ins.recommendation}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{t('coach.noInsights')}</p>
          )}
        </>
      )}
    </div>
  );
}

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));
