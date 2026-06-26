import { useState } from 'react';
import { ShieldCheck, Sparkles, Check, AlertTriangle } from 'lucide-react';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { Button, Panel } from '@engine/components/ui';
import { renderSlideThumbs, preflight, aiReview, type AiReview } from '@engine/lib/carousel/review';
import type { RatioKey } from '@engine/lib/canvas/CanvasRenderer';
import type { CarouselCopy, LeaderboardRow, SlideDef } from '@engine/lib/carousel/types';

interface Props {
  slides: SlideDef[];
  rows: LeaderboardRow[];
  copy: CarouselCopy;
  ratio: RatioKey;
  brand?: { name?: string; toneNotes?: string; colours?: string[]; fonts?: string[] };
  /** Whether this kind uses leaderboard rows. Copy-only kinds (e.g. the weekly
   *  post / quiz / poll) have no rows, so the rows preflight must not fire its
   *  "no leaderboard rows" warning on them. */
  needsRows?: boolean;
}

// "Review & fit": deterministic preflight (instant) + an AI vision review of
// the rendered slides for the current format.
export default function ReviewPanel({ slides, rows, copy, ratio, brand, needsRows = true }: Props) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [pre, setPre] = useState<string[] | null>(null);
  const [ai, setAi] = useState<AiReview | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const run = async () => {
    setBusy(true); setAi(null); setNote(null);
    setPre(needsRows ? preflight(rows) : []);
    try {
      const carBrand = brand?.colours?.length ? { name: brand.name, colours: brand.colours, fonts: brand.fonts } : undefined;
      const thumbs = await renderSlideThumbs(slides, rows, copy, ratio, 540, carBrand);
      const r = await aiReview(thumbs, ratio, brand, slides.map((s) => s.label));
      if (r.notConfigured) setNote(t('review.notConfigured'));
      else if (r.error) setNote(r.error);
      else if (r.review) setAi(r.review);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel className="p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">
          <ShieldCheck size={15} className="text-violet-600 dark:text-violet-400" /> {t('review.title')}
        </span>
        <Button variant="subtle" onClick={run} disabled={busy}>
          <Sparkles size={14} /> {busy ? t('review.running') : t('review.button')}
        </Button>
      </div>

      {pre && (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('review.preflight')}</p>
          {pre.length === 0 ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-emerald-600"><Check size={13} /> {t('review.allGood')}</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {pre.map((p, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[12px] text-amber-600"><AlertTriangle size={12} className="mt-0.5 shrink-0" /> {p}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {note && <p className="mt-3 text-[12px] text-zinc-500 dark:text-zinc-400">{note}</p>}

      {ai && (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('review.aiTitle')}</p>
          {ai.overall && <p className="text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-300">{ai.overall}</p>}
          {ai.slides?.map((s, i) => (
            <div key={i} className="rounded-lg bg-white px-3 py-2 dark:bg-zinc-900">
              <p className="text-[12px] font-semibold text-zinc-900 dark:text-zinc-50">
                {t('review.slide')} {s.slide}{s.label ? ` · ${s.label}` : ''} {s.ok ? <span className="text-emerald-600 dark:text-emerald-400">✓</span> : ''}
              </p>
              {s.issues?.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {s.issues.map((is, j) => <li key={j} className="text-[12px] text-zinc-500 dark:text-zinc-400">• {is}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
