// ═══ Postio "Animated caption" kind ═══
// A short looping social motion card — a bold statement that reveals in,
// holds, then reveals out so the loop is seamless. Renders entirely on the
// existing CanvasRenderer + brand paint (a caption is "a still per frame"),
// so the same brand look as the stills carries to motion. No backend: the
// editor records the canvas to WebM client-side (see exportAnimated.ts).

import type { CanvasRenderer } from '@engine/lib/canvas/CanvasRenderer';
import { paletteFrom } from '@engine/lib/canvas/palette';
import {
  GOLD, WHITE, BODY, DISPLAY, TRACK_TITLE,
  setShadow, clearShadow, paintHalftoneBg, paintLogo,
} from './brandPaint';
import type { CarouselBrand } from './types';
import type { Lang } from '@engine/lib/i18n/strings';
import type { CopyField } from '@engine/components/CopyEditor';

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
// easeOutCubic for a calm, premium reveal.
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

/**
 * Draw one frame of the animated caption.
 * @param p loop progress 0..1 (start state === end state for a clean loop).
 * @param brand when set, the caption paints on the brand's own colour (the
 *   universal kind); when omitted it keeps the Cwis halftone + logo paint.
 */
export function drawAnimatedFrame(r: CanvasRenderer, copy: Record<string, string | undefined>, p: number, brand?: CarouselBrand) {
  const ctx = r.context;
  r.clear();
  const pal = brand ? paletteFrom(brand.colours) : null;

  if (pal) {
    // Universal: solid brand background.
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, r.W, r.H);
    if (brand?.name) r.drawText(brand.name.toUpperCase(), { x: 0.92, y: 0.08, size: 0.024, color: pal.muted, weight: '700', align: 'right', baseline: 'middle', font: BODY, maxWidth: 0.6, letterSpacing: 0.002 });
  } else {
    // Cwis: brand halftone (default) or a solid deep-indigo, with the logo.
    if ((copy.bg || 'halftone') === 'solid') {
      ctx.fillStyle = '#241168';
      ctx.fillRect(0, 0, r.W, r.H);
    } else {
      paintHalftoneBg(r);
    }
    paintLogo(r, { heightFrac: 0.12, topFrac: 0.06, rightFrac: 0.92 });
  }

  // Palette-aware accents (brand accent/ink, else Cwis gold/white).
  const KICK = pal ? pal.accent : GOLD;
  const CAP = pal ? pal.ink : WHITE;
  const SUB = pal ? pal.accent : GOLD;
  const BAR = pal ? pal.accent : GOLD;

  const kicker = copy.kicker || '';
  const caption = copy.caption || 'Your statement here';
  const sub = copy.sub || '';
  const style = copy.style || 'rise';

  // Reveal in over [0,0.30], hold, reveal out over [0.80,1] → seamless loop.
  const reveal = easeOut(p / 0.30);
  const outp = easeOut((p - 0.80) / 0.20);
  const alpha = reveal * (1 - outp);
  // prog: 1 = hidden (start/end), 0 = fully revealed — drives the motion offset.
  const prog = (1 - reveal) + outp * 0.4;
  const yOff = style === 'rise' ? prog * 0.045 : 0;
  const xOff = style === 'slide' ? prog * -0.06 : 0;

  ctx.save();
  ctx.globalAlpha = alpha;
  const baseY = 0.46 + yOff;
  const x = 0.08 + xOff;

  if (kicker) {
    r.drawText(kicker.toUpperCase(), { x, y: baseY - 0.10, size: 0.03, color: KICK, weight: '900', baseline: 'middle', font: BODY, letterSpacing: 0.004 });
  }

  // accent bar wipes in with the reveal
  ctx.globalAlpha = alpha;
  r.drawRect({ x, y: baseY - 0.055, width: 0.10 * reveal * (1 - outp), height: 0.008, color: BAR, radius: 0.004 });

  setShadow(r, 'rgba(8,3,34,0.45)', 0, 0.006, 0.0015);
  r.drawTextWrapped(caption, { x, y: baseY, size: 0.082, color: CAP, weight: '900', font: DISPLAY, maxWidth: 0.84, lineHeight: 0.086, baseline: 'top', letterSpacing: TRACK_TITLE });
  clearShadow(r);

  if (sub) {
    r.drawText(sub, { x, y: baseY + 0.30, size: 0.034, color: SUB, weight: '800', baseline: 'middle', font: BODY, maxWidth: 0.84, letterSpacing: -0.001 });
  }
  ctx.restore();
}

// Selectable presets (stored on the graphic's copyOverrides as style/bg).
export const ANIMATED_STYLES = [
  { key: 'rise', label: 'Rise' },
  { key: 'slide', label: 'Slide' },
  { key: 'fade', label: 'Fade' },
];
export const ANIMATED_BGS = [
  { key: 'halftone', label: 'Halftone' },
  { key: 'solid', label: 'Solid' },
];

export const ANIMATED_COPY: Record<string, string> = {
  kicker: 'Cwis Bob Dydd',
  caption: 'Cwis newydd bob dydd',
  sub: 's4c.cymru/cwis-bob-dydd',
};

export const ANIMATED_COPY_FIELDS: CopyField[] = [
  { key: 'kicker', label: 'Kicker', labelKey: 'copy.f.kicker' },
  { key: 'caption', label: 'Caption', labelKey: 'copy.f.caption' },
  { key: 'sub', label: 'Sub / URL', labelKey: 'copy.f.sub' },
];

// Universal (brand-agnostic) animated caption placeholder copy.
// cy reviewed 22.06.2026 (house standard: naturalised, not literal).
export const UNIVERSAL_ANIMATED_COPY: Record<Lang, Record<string, string>> = {
  en: { kicker: 'Your brand', caption: 'Say one bold thing.', sub: 'yourbrand.com' },
  cy: { kicker: 'Eich brand', caption: 'Dwedwch un peth cryf.', sub: 'eichbrand.com' },
};

/** Default loop length in milliseconds. */
export const ANIMATED_DURATION_MS = 4000;
