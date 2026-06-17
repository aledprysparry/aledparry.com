// ═══ Cwis Bob Dydd "Weekly Scoreboard" template ═══
// A single 1080x1350 still that reproduces the branded leaderboard
// asset: purple halftone background, wordmark, gold/silver/bronze pills
// for places 1-3 (with Welsh ordinals af/il/ydd) and plain rows 4-10.
// Driven by the same parsed leaderboard rows as the carousel.

import type { CanvasRenderer } from '@engine/lib/canvas/CanvasRenderer';
import type { LeaderboardRow, SlideDef, SlideProps } from './types';

const PURPLE_TOP = '#3f2aa3';
const PURPLE_BOT = '#2a1a6e';
const INK = '#241564'; // text on the coloured pills
const GOLD = '#f6c21d';
const WHITE = '#ffffff';
const PILL = [
  { from: '#ffd23a', to: '#f2a81c' }, // 1 - gold
  { from: '#dde4f1', to: '#c2cce1' }, // 2 - silver
  { from: '#edc18c', to: '#dca35f' }, // 3 - bronze
];
const ORDINAL = ['af', 'il', 'ydd'];
const FONT = 'Inter, sans-serif';

function fmtScore(n: number | null): string {
  if (n == null) return '';
  return Number.isInteger(n) ? n.toLocaleString('en-GB') : n.toFixed(2);
}

function background(r: CanvasRenderer) {
  const ctx = r.context;
  const g = ctx.createLinearGradient(0, 0, 0, r.H);
  g.addColorStop(0, PURPLE_TOP);
  g.addColorStop(1, PURPLE_BOT);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, r.W, r.H);
  // halftone dots
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

function wordmark(r: CanvasRenderer) {
  // text stand-in for the logo (swap a real logo asset in later)
  r.drawText('CWIS', { x: 0.9, y: 0.085, size: 0.058, color: GOLD, weight: '900', align: 'right', baseline: 'middle', font: FONT });
  r.drawText('BOB DYDD', { x: 0.9, y: 0.135, size: 0.044, color: GOLD, weight: '900', align: 'right', baseline: 'middle', font: FONT });
  r.drawText('S4C', { x: 0.9, y: 0.17, size: 0.02, color: 'rgba(255,255,255,0.7)', weight: '700', align: 'right', baseline: 'middle', font: FONT });
}

function rankWithOrdinal(r: CanvasRenderer, x: number, yc: number, rank: number, sizeFrac: number, color: string) {
  const ctx = r.context;
  const px = x * r.W;
  const py = yc * r.H;
  const fs = sizeFrac * r.W;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${fs}px ${FONT}`;
  const numStr = String(rank);
  ctx.fillText(numStr, px, py);
  const ord = ORDINAL[rank - 1];
  if (ord) {
    const w = ctx.measureText(numStr).width;
    ctx.font = `800 ${fs * 0.42}px ${FONT}`;
    ctx.fillText(ord, px + w + fs * 0.03, py - fs * 0.26);
  }
}

const scoreboardSlide: SlideDef = {
  id: 'scoreboard',
  label: 'Weekly Scoreboard',
  draw(r: CanvasRenderer, { rows, copy }: SlideProps) {
    r.clear();
    background(r);
    wordmark(r);

    const title = (copy.title as string) || "LAST WEEK'S LEADERBOARD";
    const dateRange = (copy.dateRange as string) || '';
    r.drawTextWrapped(title, { x: 0.1, y: 0.12, size: 0.072, color: GOLD, weight: '900', font: FONT, maxWidth: 0.52, lineHeight: 0.074, baseline: 'top' });
    if (dateRange) r.drawText(dateRange, { x: 0.1, y: 0.28, size: 0.03, color: WHITE, weight: '800', baseline: 'middle', font: FONT });

    const list = rows.slice(0, 10);
    const left = 0.1;
    const right = 0.9;
    const startY = 0.345;
    const pillH = 0.055;
    const pillGap = 0.016;
    const rowH = 0.05;

    list.forEach((row: LeaderboardRow, i) => {
      const isPill = i < 3;
      const yc = isPill
        ? startY + pillH / 2 + i * (pillH + pillGap)
        : startY + 3 * (pillH + pillGap) + 0.006 + (i - 3) * rowH + rowH / 2;

      if (isPill) {
        const ctx = r.context;
        const py = (yc - pillH / 2) * r.H;
        const ph = pillH * r.H;
        const grad = ctx.createLinearGradient(0, py, 0, py + ph);
        grad.addColorStop(0, PILL[i].from);
        grad.addColorStop(1, PILL[i].to);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(left * r.W, py, (right - left) * r.W, ph, ph / 2);
        ctx.fill();
      }

      const textColor = isPill ? INK : WHITE;
      rankWithOrdinal(r, left + 0.045, yc, row.rank, isPill ? 0.044 : 0.036, textColor);
      r.drawText(row.name || '-', { x: left + 0.135, y: yc, size: isPill ? 0.04 : 0.034, color: textColor, weight: isPill ? '800' : '700', baseline: 'middle', font: FONT, maxWidth: 0.5 });
      r.drawText(fmtScore(row.score), { x: right - 0.03, y: yc, size: isPill ? 0.042 : 0.036, color: textColor, weight: '900', align: 'right', baseline: 'middle', font: FONT });
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
