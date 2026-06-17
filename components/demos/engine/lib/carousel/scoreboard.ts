// ═══ Cwis Bob Dydd "Weekly Scoreboard" template ═══
// A single 1080x1350 still that reproduces the branded leaderboard
// asset: royal-indigo halftone background, the Cwis Bob Dydd logo,
// gold/silver/bronze pills for places 1-3 (with Welsh ordinals
// AF/IL/YDD) and plain rows 4-10. Driven by the same parsed leaderboard
// rows as the carousel.
//
// Real brand art (logo + halftone backgrounds) and the Digitalt display
// face load from /public/app/cwis + /public/app/fonts when present; until
// they are dropped in, the renderer falls back to a synthetic halftone
// background, a gold text wordmark, and Rubik's heaviest weight. Rubik is
// tracked tight (negative letter-spacing) to approximate Digitalt's
// condensed, chunky display proportions.

import type { CanvasRenderer } from '@engine/lib/canvas/CanvasRenderer';
import { brandImage } from './brandAssets';
import type { LeaderboardRow, SlideDef, SlideProps } from './types';

const PURPLE_TOP = '#4b2fd6'; // royal indigo, matched to the brand halftone art
const PURPLE_BOT = '#2f1aa6';
const INK = '#1e1556'; // dark indigo text on the coloured pills
const GOLD = '#ffd60a'; // bright title/number yellow
const WHITE = '#ffffff';
const PILL = [
  { from: '#ffd84a', to: '#f4a81c' }, // 1 - gold
  { from: '#eef2fb', to: '#cdd7ea' }, // 2 - silver
  { from: '#f1cd99', to: '#e0a766' }, // 3 - bronze
];
const ORDINAL = ['AF', 'IL', 'YDD'];

const BODY = 'Rubik, Inter, sans-serif';
// Display stack: the canvas falls back per the font list, so Digitalt is
// used once its woff2 is dropped in, and Rubik (heaviest weight) until then.
const DISPLAY = 'Digitalt, Rubik, Inter, sans-serif';
// Tracking (fraction of width). Digitalt is condensed; tighten Rubik to suit.
const TRACK_TITLE = -0.006;
const TRACK_DISPLAY = -0.003;

function fmtScore(n: number | null): string {
  if (n == null) return '';
  return Number.isInteger(n) ? n.toLocaleString('en-GB') : n.toFixed(2);
}

function setShadow(r: CanvasRenderer, color: string, blur: number, dy: number, dx = 0) {
  const ctx = r.context;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur * r.W;
  ctx.shadowOffsetX = dx * r.W;
  ctx.shadowOffsetY = dy * r.H;
}
function clearShadow(r: CanvasRenderer) {
  const ctx = r.context;
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
}

function background(r: CanvasRenderer) {
  const bg = brandImage('bgPurple');
  if (bg) {
    r.drawImage(bg, { x: 0, y: 0, width: 1, height: 1, fit: 'cover' });
    return;
  }
  // Synthetic fallback: royal-indigo gradient + faint halftone dots.
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

// Anchor the logo by its top-right corner, preserving pixel aspect.
function brandLogo(r: CanvasRenderer) {
  const logo = brandImage('logo');
  if (logo && logo.naturalWidth > 0) {
    const heightFrac = 0.135;
    const rightFrac = 0.9;
    const topFrac = 0.075;
    const aspect = logo.naturalWidth / logo.naturalHeight;
    const widthFrac = heightFrac * (r.H / r.W) * aspect;
    r.drawImage(logo, {
      x: rightFrac - widthFrac,
      y: topFrac,
      width: widthFrac,
      height: heightFrac,
      fit: 'contain',
    });
    return;
  }
  // Text stand-in for the logo until the real PNG is dropped in.
  r.drawText('CWIS', { x: 0.9, y: 0.105, size: 0.06, color: GOLD, weight: '900', align: 'right', baseline: 'middle', font: DISPLAY, letterSpacing: TRACK_DISPLAY });
  r.drawText('BOB DYDD', { x: 0.9, y: 0.155, size: 0.044, color: GOLD, weight: '900', align: 'right', baseline: 'middle', font: DISPLAY, letterSpacing: TRACK_DISPLAY });
  r.drawText('S4C', { x: 0.9, y: 0.19, size: 0.02, color: 'rgba(255,255,255,0.7)', weight: '700', align: 'right', baseline: 'middle', font: BODY });
}

function rankWithOrdinal(r: CanvasRenderer, x: number, yc: number, rank: number, sizeFrac: number, color: string, pop: boolean) {
  const ctx = r.context;
  const px = x * r.W;
  const py = yc * r.H;
  const fs = sizeFrac * r.W;
  // White row numbers get a dark edge for the brand's "sticker" pop.
  if (pop) setShadow(r, 'rgba(20,8,60,0.55)', 0, 0.004);
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = `${TRACK_DISPLAY * r.W}px`;
  ctx.font = `900 ${fs}px ${DISPLAY}`;
  const numStr = String(rank);
  ctx.fillText(numStr, px, py);
  const ord = ORDINAL[rank - 1];
  if (ord) {
    const w = ctx.measureText(numStr).width;
    ctx.font = `800 ${fs * 0.4}px ${DISPLAY}`;
    ctx.fillText(ord, px + w + fs * 0.04, py - fs * 0.28);
  }
  ctx.letterSpacing = '0px';
  if (pop) clearShadow(r);
}

const scoreboardSlide: SlideDef = {
  id: 'scoreboard',
  label: 'Weekly Scoreboard',
  draw(r: CanvasRenderer, { rows, copy }: SlideProps) {
    r.clear();
    background(r);
    brandLogo(r);

    const title = (copy.title as string) || "LAST WEEK'S LEADERBOARD";
    const dateRange = (copy.dateRange as string) || '';

    // Title: big, heavy, tightly tracked, with a dark drop shadow for depth.
    setShadow(r, 'rgba(22,9,66,0.5)', 0.004, 0.007, 0.0015);
    r.drawTextWrapped(title, { x: 0.1, y: 0.115, size: 0.084, color: GOLD, weight: '900', font: DISPLAY, maxWidth: 0.56, lineHeight: 0.082, baseline: 'top', letterSpacing: TRACK_TITLE });
    clearShadow(r);

    if (dateRange) r.drawText(dateRange, { x: 0.1, y: 0.285, size: 0.034, color: WHITE, weight: '800', baseline: 'middle', font: BODY, letterSpacing: -0.001 });

    const list = rows.slice(0, 10);
    const left = 0.1;
    const right = 0.9;
    const startY = 0.366; // top of pill 1
    const pillH = 0.056;
    const pillGap = 0.015;
    const rowH = 0.042;

    list.forEach((row: LeaderboardRow, i) => {
      const isPill = i < 3;
      const yc = isPill
        ? startY + pillH / 2 + i * (pillH + pillGap)
        : startY + 3 * (pillH + pillGap) + 0.018 + (i - 3) * rowH + rowH / 2;

      if (isPill) {
        const ctx = r.context;
        const py = (yc - pillH / 2) * r.H;
        const ph = pillH * r.H;
        // Soft drop shadow under the pill.
        setShadow(r, 'rgba(8,3,34,0.38)', 0.014, 0.006);
        const grad = ctx.createLinearGradient(0, py, 0, py + ph);
        grad.addColorStop(0, PILL[i].from);
        grad.addColorStop(1, PILL[i].to);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(left * r.W, py, (right - left) * r.W, ph, ph / 2);
        ctx.fill();
        clearShadow(r);
      }

      const textColor = isPill ? INK : WHITE;
      rankWithOrdinal(r, left + 0.045, yc, row.rank, isPill ? 0.05 : 0.04, textColor, !isPill);
      r.drawText(row.name || '-', { x: left + 0.135, y: yc, size: isPill ? 0.043 : 0.038, color: textColor, weight: isPill ? '800' : '700', baseline: 'middle', font: BODY, maxWidth: 0.5, letterSpacing: -0.0015 });
      // No negative tracking on scores - it crushes the decimal point.
      r.drawText(fmtScore(row.score), { x: right - 0.03, y: yc, size: isPill ? 0.044 : 0.038, color: textColor, weight: isPill ? '900' : '800', align: 'right', baseline: 'middle', font: DISPLAY });
    });
  },
};

export const SCOREBOARD_SLIDES: SlideDef[] = [scoreboardSlide];

export const SCOREBOARD_COPY: Record<string, string> = {
  title: "LAST WEEK'S LEADERBOARD",
  dateRange: '11.02.24 - 18.02.24',
};

export const SCOREBOARD_SAMPLE = `safle,enw,sgor
1,Côrdydd,61.33
2,Y GYM GYM,56.73
3,Cochion De Cymru / S W Reds,55.07
4,Newid fi,54.10
5,Newid fi,52.88
6,Newid fi,51.40
7,Newid fi,49.95
8,Newid fi,48.20
9,Newid fi,46.71
10,Newid fi,45.03`;
