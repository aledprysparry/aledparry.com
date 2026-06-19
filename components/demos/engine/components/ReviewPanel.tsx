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
  brand?: { name?: string; toneNotes?: string };
}

// "Review & fit": deterministic preflight (instant) + an AI vision review of
// the rendered slides for the current format.
export default function ReviewPanel({ slides, rows, copy, ratio, brand }: Props) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [pre, setPre] = useState<string[] | null>(null);
  const [ai, setAi] = useState<AiReview | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const run = async () => {
    setBusy(true); setAi(null); setNote(null);
    setPre(preflight(rows));
    try {
      const thumbs = await renderSlideThumbs(slides, rows, copy, ratio);
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
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-white/80">
          <ShieldCheck size={15} className="text-indigo-300" /> {t('review.title')}
        </span>
        <Button variant="subtle" onClick={run} disabled={busy}>
          <Sparkles size={14} /> {busy ? t('review.running') : t('review.button')}
        </Button>
      </div>

      {pre && (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">{t('review.preflight')}</p>
          {pre.length === 0 ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-[#4ade80]"><Check size={13} /> {t('review.allGood')}</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {pre.map((p, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[12px] text-[#fde68a]"><AlertTriangle size={12} className="mt-0.5 shrink-0" /> {p}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {note && <p className="mt-3 text-[12px] text-white/50">{note}</p>}

      {ai && (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">{t('review.aiTitle')}</p>
          {ai.overall && <p className="text-[12px] leading-relaxed text-white/70">{ai.overall}</p>}
          {ai.slides?.map((s, i) => (
            <div key={i} className="rounded-lg bg-white/[0.03] px-3 py-2">
              <p className="text-[12px] font-semibold text-white/85">
                {t('review.slide')} {s.slide}{s.label ? ` · ${s.label}` : ''} {s.ok ? <span className="text-[#4ade80]">✓</span> : ''}
              </p>
              {s.issues?.length > 0 && (
                <ul className="mt-1 space-y-0.5">
                  {s.issues.map((is, j) => <li key={j} className="text-[12px] text-white/50">• {is}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
