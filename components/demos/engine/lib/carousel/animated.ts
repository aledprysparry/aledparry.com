// ═══ Postio "Animated caption" kind ═══
// A short looping social motion card — a bold statement that reveals in,
// holds, then reveals out so the loop is seamless. Renders entirely on the
// existing CanvasRenderer + brand paint (a caption is "a still per frame"),
// so the same brand look as the stills carries to motion. No backend: the
// editor records the canvas to WebM client-side (see exportAnimated.ts).

import type { CanvasRenderer } from '@engine/lib/canvas/CanvasRenderer';
import {
  GOLD, WHITE, BODY, DISPLAY, TRACK_TITLE,
  setShadow, clearShadow, paintHalftoneBg, paintLogo,
} from './brandPaint';

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
// easeOutCubic for a calm, premium reveal.
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

/**
 * Draw one frame of the animated caption.
 * @param p loop progress 0..1 (start state === end state for a clean loop).
 */
export function drawAnimatedFrame(r: CanvasRenderer, copy: Record<string, string | undefined>, p: number) {
  const ctx = r.context;
  r.clear();
  paintHalftoneBg(r);
  paintLogo(r, { heightFrac: 0.12, topFrac: 0.06, rightFrac: 0.92 });

  const kicker = copy.kicker || '';
  const caption = copy.caption || 'Your statement here';
  const sub = copy.sub || '';

  // Reveal in over [0,0.30], hold, reveal out over [0.80,1] → seamless loop.
  const reveal = easeOut(p / 0.30);
  const outp = easeOut((p - 0.80) / 0.20);
  const alpha = reveal * (1 - outp);
  const rise = (1 - reveal) * 0.045 + outp * 0.02; // fraction of height it travels

  ctx.save();
  ctx.globalAlpha = alpha;
  const baseY = 0.46 + rise;

  if (kicker) {
    r.drawText(kicker.toUpperCase(), { x: 0.08, y: baseY - 0.10, size: 0.03, color: GOLD, weight: '900', baseline: 'middle', font: BODY, letterSpacing: 0.004 });
  }

  // gold accent bar wipes in with the reveal
  ctx.globalAlpha = alpha;
  r.drawRect({ x: 0.08, y: baseY - 0.055, width: 0.10 * reveal * (1 - outp), height: 0.008, color: GOLD, radius: 0.004 });

  setShadow(r, 'rgba(8,3,34,0.45)', 0, 0.006, 0.0015);
  r.drawTextWrapped(caption, { x: 0.08, y: baseY, size: 0.082, color: WHITE, weight: '900', font: DISPLAY, maxWidth: 0.84, lineHeight: 0.086, baseline: 'top', letterSpacing: TRACK_TITLE });
  clearShadow(r);

  if (sub) {
    r.drawText(sub, { x: 0.08, y: baseY + 0.30, size: 0.034, color: GOLD, weight: '800', baseline: 'middle', font: BODY, maxWidth: 0.84, letterSpacing: -0.001 });
  }
  ctx.restore();
}

export const ANIMATED_COPY: Record<string, string> = {
  kicker: 'Cwis Bob Dydd',
  caption: 'Cwis newydd bob dydd',
  sub: 's4c.cymru/cwis-bob-dydd',
};

export const ANIMATED_COPY_FIELDS = [
  { key: 'kicker', label: 'Kicker' },
  { key: 'caption', label: 'Caption' },
  { key: 'sub', label: 'Sub / URL' },
];

/** Default loop length in milliseconds. */
export const ANIMATED_DURATION_MS = 4000;
