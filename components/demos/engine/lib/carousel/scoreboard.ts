// ═══ Cwis Bob Dydd "Weekly Scoreboard" template ═══
// A single 1080x1350 still: royal-indigo halftone background, the Cwis Bob
// Dydd logo, gold/silver/bronze pills for places 1-3 (with Welsh ordinals
// AF/IL/YDD) and plain rows 4-10. Each row shows rank, name, an optional
// location/postcode, and the score. Shared brand paint (fonts, palette,
// background, logo, shadows) lives in brandPaint so every template matches.

import type { CanvasRenderer } from '@engine/lib/canvas/CanvasRenderer';
import {
  INK, GOLD, WHITE, BODY, DISPLAY, TRACK_TITLE, TRACK_DISPLAY,
  setShadow, clearShadow, paintHalftoneBg, paintLogo, fmtScore,
} from './brandPaint';
import type { LeaderboardRow, SlideDef, SlideProps } from './types';

const PILL = [
  { from: '#ffd84a', to: '#f4a81c' }, // 1 - gold
  { from: '#eef2fb', to: '#cdd7ea' }, // 2 - silver
  { from: '#f1cd99', to: '#e0a766' }, // 3 - bronze
];
const ORDINAL = ['AF', 'IL', 'YDD'];

function rankWithOrdinal(r: CanvasRenderer, x: number, yc: number, rank: number, sizeFrac: number, color: string, pop: boolean) {
  const ctx = r.context;
  const px = x * r.W;
  const py = yc * r.H;
  const fs = sizeFrac * r.W;
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

// Name, with an optional location/postcode set smaller + muted just after it.
function drawNameLoc(r: CanvasRenderer, x: number, yc: number, name: string, location: string, size: number, color: string, weight: string, locColor: string) {
  const nameCap = location ? 0.36 : 0.5;
  r.drawText(name || '-', { x, y: yc, size, color, weight, baseline: 'middle', font: BODY, maxWidth: nameCap, letterSpacing: -0.0015 });
  if (location) {
    const ctx = r.context;
    ctx.font = `${weight} ${size * r.W}px ${BODY}`;
    const nameW = Math.min(ctx.measureText(name || '-').width, nameCap * r.W);
    r.drawText(location, { x: x + nameW / r.W + 0.014, y: yc, size: size * 0.74, color: locColor, weight: '600', baseline: 'middle', font: BODY, maxWidth: 0.16 });
  }
}

const scoreboardSlide: SlideDef = {
  id: 'scoreboard',
  label: 'Weekly Scoreboard',
  draw(r: CanvasRenderer, { rows, copy }: SlideProps) {
    r.clear();
    paintHalftoneBg(r);
    paintLogo(r, { heightFrac: 0.165, topFrac: 0.05, rightFrac: 0.93 });

    const title = (copy.title as string) || "LAST WEEK'S LEADERBOARD";
    const dateRange = (copy.dateRange as string) || '';

    setShadow(r, 'rgba(22,9,66,0.5)', 0.004, 0.007, 0.0015);
    r.drawTextWrapped(title, { x: 0.1, y: 0.115, size: 0.084, color: GOLD, weight: '900', font: DISPLAY, maxWidth: 0.56, lineHeight: 0.082, baseline: 'top', letterSpacing: TRACK_TITLE });
    clearShadow(r);

    if (dateRange) r.drawText(dateRange, { x: 0.1, y: 0.285, size: 0.034, color: WHITE, weight: '800', baseline: 'middle', font: BODY, letterSpacing: -0.001 });

    const list = rows.slice(0, 10);
    const left = 0.1;
    const right = 0.9;
    const startY = 0.335;
    const pillH = 0.052;
    const pillGap = 0.014;
    const rowH = 0.04;

    list.forEach((row: LeaderboardRow, i) => {
      const isPill = i < 3;
      const yc = isPill
        ? startY + pillH / 2 + i * (pillH + pillGap)
        : startY + 3 * (pillH + pillGap) + 0.018 + (i - 3) * rowH + rowH / 2;

      if (isPill) {
        const ctx = r.context;
        const py = (yc - pillH / 2) * r.H;
        const ph = pillH * r.H;
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
      const locColor = isPill ? 'rgba(30,21,86,0.55)' : 'rgba(255,255,255,0.55)';
      rankWithOrdinal(r, left + 0.045, yc, row.rank, isPill ? 0.05 : 0.04, textColor, !isPill);
      drawNameLoc(r, left + 0.11, yc, row.name, row.location, isPill ? 0.043 : 0.038, textColor, isPill ? '800' : '700', locColor);
      r.drawText(fmtScore(row.score), { x: right - 0.03, y: yc, size: isPill ? 0.044 : 0.038, color: textColor, weight: isPill ? '900' : '800', align: 'right', baseline: 'middle', font: DISPLAY });
    });
  },
};

export const SCOREBOARD_SLIDES: SlideDef[] = [scoreboardSlide];

export const SCOREBOARD_COPY: Record<string, string> = {
  title: "LAST WEEK'S LEADERBOARD",
  dateRange: '11.02.24 - 18.02.24',
};

// Real Cwis Bob Dydd shape: position, username (location/postcode), score.
export const SCOREBOARD_SAMPLE = `1: Dylan Llyr (LL55) 529.99
2: GaryP (LL58) 523.50
3: EleanorT (BS9) 522.99
4: iolo77 (CF5) 512.94
5: HuwT (LL77) 501.08
6: melfync (LL30) 488.88
7: EmyrE (LL61) 476.18
8: Siwan Mair (LL54) 471.31
9: Guto E (SA41) 467.02
10: Gwilym Dwyfor (LL54) 466.99`;
