// ═══ Cwis Bob Dydd "Poll" template ═══
// A single interactive-poll still: a question and three numbered option bars
// for a feed / Story poll (vote in the comments). Reuses the shared Cwis paint
// (halftone background, logo, gold accents) so it matches the quiz/scoreboard.

import type { CanvasRenderer } from '@engine/lib/canvas/CanvasRenderer';
import {
  INK, GOLD, WHITE, BODY, DISPLAY,
  setShadow, clearShadow, paintHalftoneBg, paintLogo,
} from './brandPaint';
import type { SlideDef, SlideProps } from './types';

const BAR_INK = '#3a2f63'; // option text on the ivory bar

// One option bar: ivory rounded bar, gold numbered circle, option text.
function optionBar(r: CanvasRenderer, yc: number, n: number, text: string) {
  const ctx = r.context;
  const left = 0.1, right = 0.9, h = 0.11;
  const py = (yc - h / 2) * r.H;
  const ph = h * r.H;

  setShadow(r, 'rgba(8,3,34,0.32)', 0.014, 0.006);
  ctx.fillStyle = '#eae0cd';
  ctx.beginPath();
  ctx.roundRect(left * r.W, py, (right - left) * r.W, ph, ph * 0.34);
  ctx.fill();
  clearShadow(r);

  // numbered circle
  const cx = left + 0.065;
  const cr = h * 0.34;
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(cx * r.W, yc * r.H, cr * r.W, 0, Math.PI * 2);
  ctx.fill();
  r.drawText(String(n), { x: cx, y: yc, size: h * 0.42, color: INK, weight: '900', align: 'center', baseline: 'middle', font: DISPLAY });

  // option text
  r.drawText(text || '-', { x: left + 0.135, y: yc, size: h * 0.33, color: BAR_INK, weight: '700', baseline: 'middle', font: BODY, maxWidth: 0.65, letterSpacing: -0.0015 });
}

const pollSlide: SlideDef = {
  id: 'poll',
  label: 'Poll',
  draw(r: CanvasRenderer, { copy }: SlideProps) {
    const c = copy as unknown as Record<string, string | undefined>;
    r.clear();
    paintHalftoneBg(r);
    paintLogo(r, { heightFrac: 0.13, topFrac: 0.06, rightFrac: 0.93 });

    r.drawText(c.kicker || 'POLL', { x: 0.1, y: 0.135, size: 0.04, color: WHITE, weight: '800', baseline: 'middle', font: BODY, letterSpacing: 0.01 });

    setShadow(r, 'rgba(22,9,66,0.5)', 0.004, 0.007, 0.0015);
    r.drawTextWrapped(c.question || 'What’s your favourite?', { x: 0.1, y: 0.18, size: 0.072, color: GOLD, weight: '900', font: DISPLAY, maxWidth: 0.82, lineHeight: 0.072, baseline: 'top' });
    clearShadow(r);

    const opts = [c.option1, c.option2, c.option3];
    const startY = 0.45;
    const gap = 0.15;
    opts.forEach((t, i) => optionBar(r, startY + i * gap, i + 1, t || ''));

    const cta = (c.cta || '').trim();
    if (cta) {
      setShadow(r, 'rgba(22,9,66,0.5)', 0, 0.004, 0.0012);
      r.drawText(cta, { x: 0.5, y: 0.92, size: 0.036, color: WHITE, weight: '800', align: 'center', baseline: 'middle', font: BODY, maxWidth: 0.84, letterSpacing: -0.001 });
      clearShadow(r);
    }
  },
};

export const POLL_SLIDES: SlideDef[] = [pollSlide];

// Bilingual copy (CY first-draft, flagged for native review).
export const POLL_COPY: Partial<Record<'en' | 'cy', Record<string, string>>> = {
  en: {
    kicker: 'POLL',
    question: 'What’s your favourite?',
    option1: 'Option one',
    option2: 'Option two',
    option3: 'Option three',
    cta: 'Vote in the comments',
  },
  cy: {
    kicker: 'PÔL',
    question: 'Beth yw eich ffefryn?',
    option1: 'Opsiwn un',
    option2: 'Opsiwn dau',
    option3: 'Opsiwn tri',
    cta: 'Pleidleisiwch yn y sylwadau',
  },
};

export const POLL_FIELDS = [
  { key: 'kicker', label: 'Eyebrow', labelKey: 'poll.f.kicker' as const },
  { key: 'question', label: 'Question', labelKey: 'poll.f.question' as const, multiline: true },
  { key: 'option1', label: 'Option 1', labelKey: 'poll.f.option1' as const },
  { key: 'option2', label: 'Option 2', labelKey: 'poll.f.option2' as const },
  { key: 'option3', label: 'Option 3', labelKey: 'poll.f.option3' as const },
  { key: 'cta', label: 'Call to action', labelKey: 'poll.f.cta' as const },
];
