// ═══ Postio Coach: Recommendations (applyable suggestions) ═══

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Trash2, Copy, Type, MessageSquare, MousePointerClick, Image, Sparkles, Smartphone, Eye, Clock, ArrowRight, Wand2 } from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { useOverlay } from '@engine/components/primitives';
import { Button, Badge, EmptyState } from '@engine/components/ui';
import type { AIRecommendation, AIRecommendationType } from '@engine/lib/model/types';
import type { StringKey } from '@engine/lib/i18n/strings';
import { applyRecommendation, isApplyable } from '@engine/lib/coach/actions';
import { priorityTone, usePriorityLabel } from './shared';

const TYPE_ICON: Record<AIRecommendationType, JSX.Element> = {
  headline: <Type size={13} />, caption: <MessageSquare size={13} />, cta: <MousePointerClick size={13} />,
  visual: <Image size={13} />, animation: <Sparkles size={13} />, platform: <Smartphone size={13} />,
  accessibility: <Eye size={13} />, timing: <Clock size={13} />,
};

export default function RecommendationsPanel({ brandId }: { brandId: string }) {
  const store = useStore();
  const { t } = useI18n();
  const { confirm, toast } = useOverlay();
  const priorityLabel = usePriorityLabel();
  const all = store.recommendationsByBrand(brandId);
  const [showApplied, setShowApplied] = useState(false);

  const graphicName = (postId: string) => store.getGraphic(postId)?.name ?? t('coach.untitledPost');
  const recs = useMemo(() => (showApplied ? all : all.filter((r) => !r.applied)), [all, showApplied]);

  const byPost = useMemo(() => {
    const m = new Map<string, AIRecommendation[]>();
    for (const r of recs) { const list = m.get(r.postId) ?? []; list.push(r); m.set(r.postId, list); }
    return Array.from(m.entries());
  }, [recs]);

  const copy = (s: string) => { navigator.clipboard?.writeText(s); toast({ message: t('coach.copied') }); };
  const apply = (r: AIRecommendation) => {
    const g = store.getGraphic(r.postId);
    if (!g) return;
    const slides = applyRecommendation(g, r);
    if (!slides) { toast({ message: t('coach.applyNotPossible') }); return; }
    store.updateGraphic(g.id, { slides });
    store.setRecommendationApplied(r.id, true);
    toast({ message: t('coach.appliedToPost') });
  };
  const canApply = (r: AIRecommendation) => isApplyable(r) && !!store.getGraphic(r.postId)?.slides?.length;
  const remove = async (id: string) => {
    if (await confirm({ title: t('coach.removeRecTitle'), confirmLabel: t('coach.delete'), cancelLabel: t('coach.cancel'), danger: true })) store.deleteRecommendation(id);
  };

  if (!all.length) {
    return <EmptyState title={t('coach.noRecsTitle')} hint={t('coach.noRecsHint')} />;
  }

  // Skip recs whose graphic was deleted (orphan rows linked to a NotFound
  // editor and can't be applied). Base the empty state on what's actually
  // visible so an all-orphan brand sees guidance, not a dead tab (Codex #96/#101).
  const visiblePosts = byPost.filter(([postId]) => store.getGraphic(postId));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400">{t('coach.recsIntro')}</p>
        <Button variant="ghost" onClick={() => setShowApplied((s) => !s)}>{showApplied ? t('coach.hideApplied') : t('coach.showApplied')}</Button>
      </div>

      {visiblePosts.length === 0 && <EmptyState title={t('coach.noRecsTitle')} hint={t('coach.noRecsHint')} />}
      {visiblePosts.map(([postId, list]) => (
        <div key={postId}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <Link to={`/graphics/${postId}`} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-zinc-700 hover:text-violet-700 dark:text-zinc-200 dark:hover:text-violet-300">
              {graphicName(postId)} <ArrowRight size={12} />
            </Link>
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{t('coach.recCount', { n: list.length })}</span>
          </div>
          <div className="space-y-2">
            {list.map((r) => (
              <div key={r.id} className={`rounded-xl border p-3.5 ${r.applied ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/[0.06]' : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">{TYPE_ICON[r.type]} {t(`coach.recType.${r.type}` as StringKey)}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide ${priorityTone(r.priority)}`}>{priorityLabel(r.priority)}</span>
                </div>
                {r.originalValue && <p className="mt-1.5 text-[12px] text-zinc-400 line-through dark:text-zinc-500">{r.originalValue}</p>}
                <p className="mt-1 text-[13px] font-medium leading-relaxed text-zinc-900 dark:text-zinc-50">{r.suggestedValue}</p>
                {r.reason && <p className="mt-1 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">{r.reason}</p>}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {canApply(r) && !r.applied && (
                    <Button variant="primary" onClick={() => apply(r)}><Wand2 size={13} /> {t('coach.applyToPost')}</Button>
                  )}
                  <Button variant={r.applied ? 'subtle' : canApply(r) ? 'ghost' : 'primary'} onClick={() => store.setRecommendationApplied(r.id, !r.applied)}>
                    <Check size={13} /> {r.applied ? t('coach.markedDone') : t('coach.markDone')}
                  </Button>
                  <Button variant="ghost" onClick={() => copy(r.suggestedValue)}><Copy size={13} /> {t('coach.copy')}</Button>
                  <button onClick={() => remove(r.id)} aria-label={t('coach.delete')} className="grid h-9 w-9 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-rose-600 dark:hover:bg-zinc-800"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
