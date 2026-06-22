import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Wand2, Check, Copy, AlertTriangle, Gauge, ArrowUpRight, ArrowRight } from 'lucide-react';
import { Button } from '@engine/components/ui';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { useStore } from '@engine/lib/store/StoreProvider';
import { extractPostText, runPostAnalysis } from '@engine/lib/coach/analysis';
import { ScoreRing, useCoachConfig } from '@engine/components/coach/shared';
import type { Brand, GeneratedGraphic, PostAnalysis } from '@engine/lib/model/types';

type Task = 'improve' | 'autofill' | 'captions' | 'critique';

interface Props {
  brand?: Brand;
  platform: string;
  textElements: { id: string; content: string }[];
  onApply: (id: string, text: string) => void;
  onAddText: (text: string) => void;
  /** When provided, enables the structured Coach "Analyse" entry. */
  graphic?: GeneratedGraphic;
}

async function callAgent(task: Task, payload: Record<string, unknown>): Promise<{ result?: Record<string, unknown>; error?: string }> {
  try {
    const res = await fetch('/api/ai/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, ...payload }),
    });
    if (res.status === 503) return { error: 'not_configured' };
    const data = await res.json();
    if (!res.ok) return { error: data.error || 'error' };
    return { result: data.result };
  } catch {
    return { error: 'network' };
  }
}

export default function AiPanel({ brand, platform, textElements, onApply, onAddText, graphic }: Props) {
  const { t } = useI18n();
  const store = useStore();
  const { enabledIds } = useCoachConfig(brand?.id ?? '');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [improve, setImprove] = useState<{ original: string; suggestion: string }[] | null>(null);
  const [autofill, setAutofill] = useState<{ headline?: string; subheading?: string; cta?: string } | null>(null);
  const [captions, setCaptions] = useState<{ caption?: string; hashtags?: string[] } | null>(null);
  const [critique, setCritique] = useState<{ title: string; detail: string }[] | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState<{ data: Omit<PostAnalysis, 'id' | 'createdAt'>; usedAI: boolean } | null>(null);

  const brandPayload = { name: brand?.name, toneNotes: brand?.toneNotes, colours: brand?.colours, fonts: brand?.fonts };
  const texts = textElements.map((el) => el.content).filter(Boolean);

  // Structured Coach analysis on the live (unsaved) editor text. Persists to
  // the Coach so the result + recommendations also appear under Insights.
  const analyse = async () => {
    if (!graphic || !brand) return;
    setAnalysing(true); setAnalysis(null); setError(null);
    const r = await runPostAnalysis({
      text: { lines: texts, joined: texts.join('\n') },
      brand, platformName: platform, enabledIds,
      referenceAccounts: store.referenceAccountsByBrand(brand.id),
      performanceEntries: store.performanceByBrand(brand.id),
      ids: { postId: graphic.id, brandId: brand.id },
      templateName: store.getTemplate(graphic.templateId)?.name,
    });
    store.saveAnalysis(r.analysis);
    if (r.recommendations.length) store.saveRecommendations(r.recommendations);
    setAnalysis({ data: r.analysis, usedAI: r.usedAI });
    setAnalysing(false);
  };

  const run = async (task: Task, extra: Record<string, unknown> = {}) => {
    setBusy(task); setError(null);
    const { result, error } = await callAgent(task, { brand: brandPayload, platform, texts, ...extra });
    setBusy(null);
    if (error) { setError(error); return; }
    if (task === 'improve') setImprove((result?.items as { original: string; suggestion: string }[]) ?? []);
    if (task === 'autofill') setAutofill(result ?? {});
    if (task === 'captions') setCaptions(result ?? {});
    if (task === 'critique') setCritique((result?.issues as { title: string; detail: string }[]) ?? []);
  };

  const copy = (s: string) => navigator.clipboard?.writeText(s);

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-500/20 dark:bg-violet-500/10">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
        <span className="inline-flex items-center gap-2 text-[14px] font-bold text-zinc-900 dark:text-zinc-50"><Sparkles size={15} className="text-violet-600 dark:text-violet-400" /> {t('ai.title')}</span>
        <span className="text-[12px] text-zinc-500 dark:text-zinc-400">{open ? t('common.hide') : t('common.open')}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {error === 'not_configured' && <p className="text-[12px] text-zinc-600 dark:text-zinc-300">{t('ai.notConfigured')}</p>}
          {error && error !== 'not_configured' && <p className="inline-flex items-center gap-1.5 text-[12px] text-red-600 dark:text-red-400"><AlertTriangle size={13} /> {t('ai.failed', { error })}</p>}

          {/* structured Coach analysis (in-editor entry) */}
          {graphic && brand && (
            <div className="rounded-xl border border-violet-200 bg-white p-3 dark:border-violet-500/20 dark:bg-zinc-900">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-zinc-800 dark:text-zinc-100"><Gauge size={14} className="text-violet-600 dark:text-violet-400" /> {t('ai.analyseTitle')}</span>
                <Button variant="primary" disabled={analysing || texts.length === 0} onClick={analyse}><Sparkles size={13} /> {analysing ? t('coach.analysing') : t('ai.analyse')}</Button>
              </div>
              {!analysis && <p className="mt-1.5 text-[11.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">{t('ai.analyseHint', { n: enabledIds.length })}</p>}
              {analysis && (
                <div className="mt-3 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <ScoreRing score={analysis.data.overallScore} size={56} />
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-50">{t('coach.overallScore')}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{analysis.usedAI ? t('coach.modelAI') : t('coach.modelOffline')}</p>
                    </div>
                  </div>
                  {analysis.data.issues.slice(0, 2).map((s, i) => (
                    <p key={i} className="inline-flex items-start gap-1.5 text-[11.5px] leading-relaxed text-amber-700 dark:text-amber-400"><AlertTriangle size={12} className="mt-0.5 shrink-0" /> {s}</p>
                  ))}
                  {analysis.data.actionPlan.quickWins.slice(0, 2).map((s, i) => (
                    <p key={i} className="inline-flex items-start gap-1.5 text-[11.5px] leading-relaxed text-zinc-600 dark:text-zinc-300"><ArrowUpRight size={12} className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-400" /> {s}</p>
                  ))}
                  <Link to={`/brands/${brand.id}`} className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400">{t('ai.viewInCoach')} <ArrowRight size={12} /></Link>
                </div>
              )}
            </div>
          )}

          {/* auto-fill */}
          <div>
            <div className="flex gap-2">
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={t('ai.topicPlaceholder')} className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-800 focus:border-violet-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
              <Button variant="subtle" disabled={busy !== null || !topic.trim()} onClick={() => run('autofill', { topic })}><Wand2 size={14} /> {busy === 'autofill' ? '…' : t('ai.draft')}</Button>
            </div>
            {autofill && (
              <div className="mt-2 space-y-1.5">
                {(['headline', 'subheading', 'cta'] as const).map((k) => autofill[k] && (
                  <div key={k} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5 dark:bg-zinc-900">
                    <span className="text-[12px] text-zinc-800 dark:text-zinc-200">{autofill[k]}</span>
                    <button onClick={() => onAddText(autofill[k] as string)} className="shrink-0 text-[11px] font-semibold text-violet-600 hover:text-violet-700">{t('ai.add')}</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="subtle" disabled={busy !== null || texts.length === 0} onClick={() => run('improve')}>{busy === 'improve' ? '…' : t('ai.improveCopy')}</Button>
            <Button variant="subtle" disabled={busy !== null || texts.length === 0} onClick={() => run('captions')}>{busy === 'captions' ? '…' : t('ai.captionHashtags')}</Button>
            <Button variant="subtle" disabled={busy !== null || texts.length === 0} onClick={() => run('critique')}>{busy === 'critique' ? '…' : t('ai.critique')}</Button>
          </div>

          {improve && improve.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('ai.improvedCopy')}</p>
              {improve.map((it, i) => (
                <div key={i} className="rounded-lg bg-white px-3 py-2 dark:bg-zinc-900">
                  <p className="text-[12px] text-zinc-800 dark:text-zinc-200">{it.suggestion}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-400 line-through dark:text-zinc-500">{it.original}</p>
                  {textElements[i] && <button onClick={() => onApply(textElements[i].id, it.suggestion)} className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700"><Check size={12} /> {t('ai.apply')}</button>}
                </div>
              ))}
            </div>
          )}

          {captions && (
            <div className="space-y-2">
              <div className="rounded-lg bg-white px-3 py-2 dark:bg-zinc-900">
                <div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('ai.caption')}</span><button onClick={() => copy(captions.caption || '')} className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"><Copy size={12} /></button></div>
                <p className="mt-1 text-[12px] text-zinc-800 dark:text-zinc-200">{captions.caption}</p>
              </div>
              {captions.hashtags && captions.hashtags.length > 0 && (
                <div className="rounded-lg bg-white px-3 py-2 dark:bg-zinc-900">
                  <div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('ai.hashtags')}</span><button onClick={() => copy((captions.hashtags || []).join(' '))} className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"><Copy size={12} /></button></div>
                  <p className="mt-1 text-[12px] text-violet-600 dark:text-violet-400">{captions.hashtags.join(' ')}</p>
                </div>
              )}
            </div>
          )}

          {critique && critique.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('ai.critique')}</p>
              {critique.map((c, i) => (
                <div key={i} className="rounded-lg bg-white px-3 py-2 dark:bg-zinc-900">
                  <p className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-50">{c.title}</p>
                  <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{c.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
