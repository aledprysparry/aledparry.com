// QuizBookBiz / Cwis Bob Dydd - Weekly Top 10 carousel template.
//
// Each slide draws its composition into a centred 4:5 design frame (via
// FramedRenderer) while the halftone background fills full-bleed, so the
// SAME layout works un-stretched across every ratio (feed 4:5, story 9:16,
// square 1:1, landscape 16:9, whatsapp 1:1). Positions/sizes are fractions
// of the FRAME; text sizes are a fraction of the frame's width.

import {
  BRAND_BLUE,
  BRAND_YELLOW,
  BRAND_WHITE,
  DEFAULT_FONT,
  SERIF_FONT,
} from '@engine/lib/canvas/brandTokens';
import { paintHalftoneBg, paintLogo, TRACK_TITLE, TRACK_DISPLAY } from './brandPaint';
import { FramedRenderer } from './framedRenderer';
import { rowsInRange } from './parseLeaderboard';
import type { CarouselCopy, LeaderboardRow, SlideDef, SlideProps } from './types';

const MUTED = 'rgba(255,255,255,0.60)';
const SURFACE = 'rgba(255,255,255,0.07)';
const GOLD = BRAND_YELLOW;
const SILVER = '#d6deec';
const BRONZE = '#d98a3d';
const POSITIVE = '#4ade80';
const NEGATIVE = '#f87171';

export const DEFAULT_COPY: CarouselCopy = {
  brandLine: 'CWIS BOB DYDD',
  weekLabel: 'Wythnos 9 Mehefin 2026',
  coverKicker: 'SGORFWRDD',
  coverTitle: '10 UCHAF YR WYTHNOS',
  coverSubtitle: 'Sêr y cwis yr wythnos yma',
  coverCta: 'Pwy sydd ar y brig? →',
  listTitle: '10 UCHAF',
  scoreUnit: 'pwynt',
  winnerKicker: 'ENILLYDD YR WYTHNOS',
  winnerSubtitle: 'ar frig y sgorfwrdd',
  ctaHeadline: "Alli di guro'r 10 uchaf?",
  ctaSub: 'Dy enw di ar y rhestr wythnos nesa?',
  ctaAction: 'Chwarae nawr',
  ctaLink: '@cwisbobdydd',
  footer: 'Cwis Bob Dydd',
};

// ── frame-relative raw-context helpers ──────────────────────────────
function fillCircle(fr: FramedRenderer, cxF: number, cyF: number, rF: number, color: string) {
  const ctx = fr.ctx;
  ctx.beginPath();
  ctx.arc(fr.fx(cxF), fr.fy(cyF), fr.fs(rF), 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function medalColour(rank: number): string {
  if (rank === 1) return GOLD;
  if (rank === 2) return SILVER;
  if (rank === 3) return BRONZE;
  return 'rgba(255,255,255,0.14)';
}

const fmtScore = (n: number | null) =>
  n == null ? '-' : Number.isInteger(n) ? n.toLocaleString('en-GB') : n.toFixed(2);

function drawDots(fr: FramedRenderer, count: number, active: number) {
  const gap = 0.03;
  const total = (count - 1) * gap;
  const startX = 0.5 - total / 2;
  for (let i = 0; i < count; i++) {
    const isActive = i === active;
    fillCircle(fr, startX + i * gap, 0.955, isActive ? 0.009 : 0.006, isActive ? BRAND_YELLOW : 'rgba(255,255,255,0.35)');
  }
}

function drawFooter(fr: FramedRenderer, copy: CarouselCopy, props: SlideProps) {
  fr.drawText(copy.footer, {
    x: 0.06, y: 0.95, size: 0.026, color: MUTED, weight: '700',
    align: 'left', baseline: 'middle', font: DEFAULT_FONT,
  });
  drawDots(fr, props.slideCount, props.index);
}

function drawMovement(fr: FramedRenderer, m: LeaderboardRow['movement'], xF: number, yF: number) {
  if (!m) return;
  const colour = m.dir > 0 ? POSITIVE : m.dir < 0 ? NEGATIVE : MUTED;
  const label = m.dir === 0 ? '–' : `${m.dir > 0 ? '▲' : '▼'} ${m.value}`;
  fr.drawText(label, {
    x: xF, y: yF, size: 0.026, color: colour, weight: '700',
    align: 'right', baseline: 'middle', font: DEFAULT_FONT,
  });
}

// ═══ COVER ═══
const coverSlide: SlideDef = {
  id: 'cover',
  label: 'Cover',
  draw(r, { copy, slideCount, index }) {
    r.clear();
    paintHalftoneBg(r); // full-bleed background
    const fr = new FramedRenderer(r);
    // brand logo top-right - large for instant feed recognition
    paintLogo(fr, { heightFrac: 0.15, topFrac: 0.05, rightFrac: 0.94 });

    // kicker + week, raised to kill dead space at the top
    fr.drawText(copy.coverKicker, { x: 0.06, y: 0.30, size: 0.05, color: BRAND_YELLOW, weight: '900', baseline: 'middle', font: DEFAULT_FONT });
    // big title (wraps + auto-fits) - the hook, dominant
    fr.drawTextWrapped(copy.coverTitle, {
      x: 0.06, y: 0.355, size: 0.118, color: BRAND_WHITE, weight: '900',
      maxWidth: 0.9, lineHeight: 0.112, font: SERIF_FONT,
    });
    // subtitle - directly under the headline (no decorative rule)
    fr.drawText(copy.coverSubtitle, { x: 0.06, y: 0.55, size: 0.034, color: 'rgba(255,255,255,0.82)', weight: '500', baseline: 'middle', font: DEFAULT_FONT, maxWidth: 0.86 });
    // date - a clean muted label (secondary detail recedes; no faint box)
    fr.drawText(copy.weekLabel, { x: 0.06, y: 0.605, size: 0.028, color: 'rgba(255,255,255,0.5)', weight: '700', letterSpacing: 0.002, baseline: 'middle', font: DEFAULT_FONT, maxWidth: 0.8 });

    // bottom CTA - bold gold pill (the swipe / click driver), high contrast
    const ctaY = 0.85, ctaH = 0.072;
    fr.drawRect({ x: 0.06, y: ctaY, width: 0.72, height: ctaH, color: BRAND_YELLOW, radius: ctaH / 2 });
    fr.drawText(copy.coverCta, { x: 0.06 + 0.72 / 2, y: ctaY + ctaH / 2, size: 0.036, color: BRAND_BLUE, weight: '900', align: 'center', baseline: 'middle', font: DEFAULT_FONT, maxWidth: 0.64 });
    drawFooter(fr, copy, { rows: [], copy, slideCount, index });
  },
};

// ═══ RANK LIST ═══
function makeListSlide(id: string, label: string, range: [number, number]): SlideDef {
  return {
    id,
    label,
    range,
    draw(r, { rows, copy, slideCount, index }) {
      r.clear();
      paintHalftoneBg(r);
      const fr = new FramedRenderer(r);
      paintLogo(fr, { heightFrac: 0.11, topFrac: 0.05, rightFrac: 0.94 });
      fr.drawText(copy.listTitle, { x: 0.06, y: 0.085, size: 0.034, color: BRAND_YELLOW, weight: '900', baseline: 'middle', font: DEFAULT_FONT, letterSpacing: TRACK_DISPLAY });
      fr.drawText(label, { x: 0.06, y: 0.15, size: 0.072, color: BRAND_WHITE, weight: '900', baseline: 'middle', font: SERIF_FONT, letterSpacing: TRACK_TITLE });

      const scoped = rowsInRange(rows, range);
      const start = 0.255;
      const rowH = 0.118;
      const gap = 0.017;
      scoped.slice(0, 5).forEach((row, i) => {
        const y = start + i * (rowH + gap);
        const cy = y + rowH / 2;
        // card
        fr.drawRect({ x: 0.06, y, width: 0.88, height: rowH, color: SURFACE, radius: 0.028 });
        // rank badge
        fillCircle(fr, 0.135, cy, 0.046, medalColour(row.rank));
        fr.drawText(String(row.rank), { x: 0.135, y: cy, size: 0.046, color: row.rank <= 3 ? BRAND_BLUE : BRAND_WHITE, weight: '800', align: 'center', baseline: 'middle', font: DEFAULT_FONT });
        // name + sub (location/postcode, falling back to team)
        const sub = row.location || row.team;
        fr.drawText(row.name || '-', { x: 0.215, y: sub ? cy - 0.018 : cy, size: 0.042, color: BRAND_WHITE, weight: '800', baseline: 'middle', font: DEFAULT_FONT, maxWidth: 0.42 });
        if (sub) {
          fr.drawText(sub, { x: 0.215, y: cy + 0.026, size: 0.026, color: MUTED, weight: '600', baseline: 'middle', font: DEFAULT_FONT, maxWidth: 0.42 });
        }
        // movement + score
        drawMovement(fr, row.movement, 0.70, cy);
        fr.drawText(fmtScore(row.score), { x: 0.91, y: cy - 0.012, size: 0.05, color: BRAND_YELLOW, weight: '800', align: 'right', baseline: 'middle', font: SERIF_FONT });
        fr.drawText(copy.scoreUnit, { x: 0.91, y: cy + 0.028, size: 0.022, color: MUTED, weight: '600', align: 'right', baseline: 'middle', font: DEFAULT_FONT });
      });

      if (scoped.length === 0) {
        fr.drawText('Dim safleoedd eto', { x: 0.5, y: 0.5, size: 0.04, color: MUTED, align: 'center', baseline: 'middle', font: DEFAULT_FONT });
      }
      drawFooter(fr, copy, { rows, copy, slideCount, index });
    },
  };
}

// ═══ WINNER ═══
const winnerSlide: SlideDef = {
  id: 'winner',
  label: 'Enillydd',
  draw(r, { rows, copy, slideCount, index }) {
    const w = rows.find((x) => x.rank === 1) ?? rows[0] ?? { name: '-', score: null, team: '', location: '', rank: 1, movement: null };
    r.clear();
    paintHalftoneBg(r);
    const fr = new FramedRenderer(r);
    const ctx = fr.ctx;
    // smaller logo tucked into the corner so it clears the centred kicker
    paintLogo(fr, { heightFrac: 0.085, topFrac: 0.045, rightFrac: 0.94 });

    // kicker (centred)
    fr.drawText(copy.winnerKicker, { x: 0.5, y: 0.115, size: 0.042, color: BRAND_YELLOW, weight: '900', align: 'center', baseline: 'middle', font: DEFAULT_FONT });

    // ── champion spotlight card (contains the whole winner identity) ──
    const cardX = 0.1, cardW = 0.8, cardY = 0.26, cardH = 0.53;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(fr.fx(cardX), fr.fy(cardY), cardW * fr.W, cardH * fr.H, 0.05 * fr.W);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fill();
    ctx.lineWidth = Math.max(2, 0.0018 * fr.W);
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.stroke();
    ctx.restore();

    // gold #1 medal badge straddling the card's top edge (ties to the leaderboard)
    const dcx = fr.fx(0.5), dcy = fr.fy(cardY), dr = 0.088 * fr.W;
    ctx.save();
    ctx.beginPath(); ctx.arc(dcx, dcy, dr * 1.1, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
    const gg = ctx.createLinearGradient(0, dcy - dr, 0, dcy + dr);
    gg.addColorStop(0, '#ffd84a'); gg.addColorStop(1, '#f4a81c');
    ctx.beginPath(); ctx.arc(dcx, dcy, dr, 0, Math.PI * 2); ctx.fillStyle = gg; ctx.fill();
    ctx.restore();
    fr.drawText('1', { x: 0.5, y: cardY, size: 0.092, color: BRAND_BLUE, weight: '900', align: 'center', baseline: 'middle', font: SERIF_FONT });

    // winner name (hero)
    fr.drawText(w.name || '-', { x: 0.5, y: 0.42, size: 0.074, color: BRAND_WHITE, weight: '900', align: 'center', baseline: 'middle', font: SERIF_FONT, maxWidth: 0.7 });
    const wsub = w.location || w.team;
    if (wsub) fr.drawText(wsub, { x: 0.5, y: 0.485, size: 0.032, color: 'rgba(255,255,255,0.6)', weight: '600', align: 'center', baseline: 'middle', font: DEFAULT_FONT });

    // gold divider
    fr.drawRect({ x: 0.42, y: 0.545, width: 0.16, height: 0.007, color: BRAND_YELLOW, radius: 0.004 });

    // score (the achievement) + unit
    fr.drawText(fmtScore(w.score), { x: 0.5, y: 0.65, size: 0.135, color: BRAND_YELLOW, weight: '900', align: 'center', baseline: 'middle', font: SERIF_FONT });
    fr.drawText(`${copy.scoreUnit} ${copy.winnerSubtitle}`, { x: 0.5, y: 0.745, size: 0.032, color: 'rgba(255,255,255,0.6)', weight: '600', align: 'center', baseline: 'middle', font: DEFAULT_FONT, maxWidth: 0.7 });

    // bottom strip (frame-width)
    fr.drawRect({ x: 0, y: 0.9, width: 1, height: 0.1, color: BRAND_YELLOW });
    fr.drawText(copy.footer, { x: 0.5, y: 0.95, size: 0.038, color: BRAND_BLUE, weight: '900', align: 'center', baseline: 'middle', font: SERIF_FONT });
    void slideCount; void index;
  },
};

// ═══ CTA ═══
const ctaSlide: SlideDef = {
  id: 'cta',
  label: 'Galwad i weithredu',
  draw(r, { copy, slideCount, index }) {
    r.clear();
    paintHalftoneBg(r);
    const fr = new FramedRenderer(r);
    paintLogo(fr, { heightFrac: 0.11, topFrac: 0.05, rightFrac: 0.94 });

    // challenge headline - the hook, dominant
    fr.drawTextWrapped(copy.ctaHeadline, {
      x: 0.06, y: 0.24, size: 0.088, color: BRAND_WHITE, weight: '900',
      maxWidth: 0.9, lineHeight: 0.09, font: SERIF_FONT,
    });
    // aspiration tie-back to the leaderboard they just saw
    fr.drawText(copy.ctaSub, { x: 0.06, y: 0.55, size: 0.04, color: 'rgba(255,255,255,0.82)', weight: '600', baseline: 'middle', font: DEFAULT_FONT, maxWidth: 0.88 });

    // hero CTA - big, full-width gold button (the conversion)
    const bY = 0.63, bH = 0.105;
    fr.drawRect({ x: 0.06, y: bY, width: 0.88, height: bH, color: BRAND_YELLOW, radius: bH / 2 });
    fr.drawText(`${copy.ctaAction} →`, { x: 0.5, y: bY + bH / 2, size: 0.05, color: BRAND_BLUE, weight: '900', align: 'center', baseline: 'middle', font: DEFAULT_FONT, maxWidth: 0.8 });

    // handle under the button (no hardcoded copy - every line is a copy field
    // so nothing can duplicate whatever the user puts in ctaSub)
    fr.drawText(copy.ctaLink, { x: 0.06, y: 0.8, size: 0.04, color: BRAND_YELLOW, weight: '800', baseline: 'middle', font: DEFAULT_FONT });
    drawFooter(fr, copy, { rows: [], copy, slideCount, index });
  },
};

export const SLIDES: SlideDef[] = [
  coverSlide,
  makeListSlide('top5', 'Safleoedd 1–5', [1, 5]),
  makeListSlide('top10', 'Safleoedd 6–10', [6, 10]),
  winnerSlide,
  ctaSlide,
];
