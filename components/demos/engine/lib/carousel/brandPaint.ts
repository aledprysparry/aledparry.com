// ═══ Shared Cwis Bob Dydd brand paint ═══
// Single source of truth for the canvas templates: fonts, palette, the
// royal-indigo halftone background, the logo, and the shadow/tracking
// helpers. Both the Weekly Scoreboard and the Top-10 carousel paint with
// these, so every template stays on-brand and consistent.

import type { CanvasRenderer } from '@engine/lib/canvas/CanvasRenderer';
import { brandImage } from './brandAssets';

// Palette (matched to the brand halftone art).
export const PURPLE_TOP = '#4b2fd6'; // royal indigo
export const PURPLE_BOT = '#2f1aa6';
export const INK = '#1e1556'; // dark indigo text on coloured pills
export const GOLD = '#ffd60a';
export const WHITE = '#ffffff';
export const MUTED_ON_DARK = 'rgba(255,255,255,0.62)';

// Fonts. The canvas falls back per the stack, so Digitalt is used once its
// woff2 is dropped in, with Rubik (self-hosted) as the live default.
export const BODY = 'Rubik, Inter, sans-serif';
export const DISPLAY = 'Digitalt, Rubik, Inter, sans-serif';

// Tracking (fraction of width). Digitalt is already a condensed display face,
// so it wants its NATURAL spacing - negative tracking crashes the caps
// together ("SAFLEOEDD" → merged). Keep these ~0; only the Rubik fallback
// would want tightening, and it's close enough.
export const TRACK_TITLE = 0;
export const TRACK_DISPLAY = 0;

export function setShadow(r: CanvasRenderer, color: string, blur: number, dy: number, dx = 0) {
  const ctx = r.context;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur * r.W;
  ctx.shadowOffsetX = dx * r.W;
  ctx.shadowOffsetY = dy * r.H;
}
export function clearShadow(r: CanvasRenderer) {
  const ctx = r.context;
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
}

/** Royal-indigo halftone background: the brand image if dropped in, else synthetic. */
export function paintHalftoneBg(r: CanvasRenderer) {
  const bg = brandImage('bgPurple');
  if (bg) {
    r.drawImage(bg, { x: 0, y: 0, width: 1, height: 1, fit: 'cover' });
    return;
  }
  const ctx = r.context;
  const g = ctx.createLinearGradient(0, 0, 0, r.H);
  g.addColorStop(0, PURPLE_TOP);
  g.addColorStop(1, PURPLE_BOT);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, r.W, r.H);
  ctx.save();
  ctx.fillStyle = '#ffffff';
  const step = r.W * 0.034;
  const rad = r.W * 0.006;
  for (let y = step / 2; y < r.H; y += step) {
    for (let x = step / 2; x < r.W; x += step) {
      ctx.globalAlpha = 0.045;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** The Cwis Bob Dydd logo anchored top-right (real PNG if present, else gold wordmark). */
export function paintLogo(r: CanvasRenderer, opts: { heightFrac?: number; rightFrac?: number; topFrac?: number } = {}) {
  const heightFrac = opts.heightFrac ?? 0.135;
  const rightFrac = opts.rightFrac ?? 0.9;
  const topFrac = opts.topFrac ?? 0.075;
  const logo = brandImage('logo');
  if (logo && logo.naturalWidth > 0) {
    const aspect = logo.naturalWidth / logo.naturalHeight;
    const widthFrac = heightFrac * (r.H / r.W) * aspect;
    r.drawImage(logo, { x: rightFrac - widthFrac, y: topFrac, width: widthFrac, height: heightFrac, fit: 'contain' });
    return;
  }
  const midY = topFrac + heightFrac / 2;
  r.drawText('CWIS', { x: rightFrac, y: midY - heightFrac * 0.22, size: heightFrac * 0.44, color: GOLD, weight: '900', align: 'right', baseline: 'middle', font: DISPLAY, letterSpacing: TRACK_DISPLAY });
  r.drawText('BOB DYDD', { x: rightFrac, y: midY + heightFrac * 0.18, size: heightFrac * 0.33, color: GOLD, weight: '900', align: 'right', baseline: 'middle', font: DISPLAY, letterSpacing: TRACK_DISPLAY });
  r.drawText('S4C', { x: rightFrac, y: midY + heightFrac * 0.46, size: heightFrac * 0.15, color: 'rgba(255,255,255,0.7)', weight: '700', align: 'right', baseline: 'middle', font: BODY });
}

export function fmtScore(n: number | null): string {
  if (n == null) return '';
  return Number.isInteger(n) ? n.toLocaleString('en-GB') : n.toFixed(2);
}
