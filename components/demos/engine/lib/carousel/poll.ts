// ═══ Cwis Bob Dydd "Poll" template ═══
// A single interactive-poll still: just the question (and an optional prompt) on
// the Cwis halftone background, with clear space below for Instagram's native
// poll sticker - the options live in the sticker, not on the graphic. Reuses the
// shared Cwis paint (halftone background, logo, gold accents).

import type { CanvasRenderer } from '@engine/lib/canvas/CanvasRenderer';
import {
  GOLD, WHITE, BODY, DISPLAY,
  setShadow, clearShadow, paintHalftoneBg, paintLogo,
} from './brandPaint';
import type { SlideDef, SlideProps } from './types';

const pollSlide: SlideDef = {
  id: 'poll',
  label: 'Poll',
  draw(r: CanvasRenderer, { copy }: SlideProps) {
    const c = copy as unknown as Record<string, string | undefined>;
    r.clear();
    paintHalftoneBg(r);
    paintLogo(r, { heightFrac: 0.14, topFrac: 0.06, rightFrac: 0.93 });

    r.drawText(c.kicker || 'POLL', { x: 0.1, y: 0.155, size: 0.042, color: WHITE, weight: '800', baseline: 'middle', font: BODY, letterSpacing: 0.01 });

    // Question is the hero; the lower half stays clear for the poll sticker.
    setShadow(r, 'rgba(22,9,66,0.5)', 0.004, 0.008, 0.0015);
    r.drawTextWrapped(c.question || 'What’s your favourite?', { x: 0.1, y: 0.215, size: 0.088, color: GOLD, weight: '900', font: DISPLAY, maxWidth: 0.84, lineHeight: 0.088, baseline: 'top' });
    clearShadow(r);

    // Optional prompt pointing at the sticker (blank by default).
    const cta = (c.cta || '').trim();
    if (cta) {
      setShadow(r, 'rgba(22,9,66,0.5)', 0, 0.004, 0.0012);
      r.drawText(cta, { x: 0.5, y: 0.9, size: 0.038, color: WHITE, weight: '800', align: 'center', baseline: 'middle', font: BODY, maxWidth: 0.84, letterSpacing: -0.001 });
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
    cta: 'Tap to vote',
  },
  cy: {
    kicker: 'PÔL',
    question: 'Beth yw eich ffefryn?',
    cta: 'Pleidleisiwch isod',
  },
};

export const POLL_FIELDS = [
  { key: 'kicker', label: 'Eyebrow', labelKey: 'poll.f.kicker' as const },
  { key: 'question', label: 'Question', labelKey: 'poll.f.question' as const, multiline: true },
  { key: 'cta', label: 'Call to action', labelKey: 'poll.f.cta' as const },
];
