// QuizBookBiz / Cwis Bob Dydd - Weekly Top 10 carousel template.
//
// Each slide is a pure draw function over the reused CanvasRenderer
// (from cwis-creator-hub). Both the live preview and the export pass
// call the same draw fn, so what you see is exactly what exports.
// Layout uses CanvasRenderer's fraction coords (0-1); text sizes are a
// fraction of canvas WIDTH. Circles/dots/strokes use the raw 2D context.

import { CanvasRenderer } from '@engine/lib/canvas/CanvasRenderer';
import {
  BRAND_BLUE,
  BRAND_YELLOW,
  BRAND_WHITE,
  DEFAULT_FONT,
  SERIF_FONT,
} from '@engine/lib/canvas/brandTokens';
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
  coverCta: 'Sweipia i weld pwy sydd ar y brig →',
  listTitle: '10 UCHAF',
  scoreUnit: 'pwynt',
  winnerKicker: 'ENILLYDD YR WYTHNOS',
  winnerSubtitle: 'ar frig y sgorfwrdd',
  ctaHeadline: "Ti'n meddwl alli di guro'r 10 uchaf?",
  ctaSub: 'Cwis newydd bob dydd.',
  ctaAction: 'Chwarae nawr',
  ctaLink: '@cwisbobdydd',
  footer: 'Cwis Bob Dydd',
};

// ── raw-context helpers ──────────────────────────────────────────
function fillCircle(r: CanvasRenderer, cxF: number, cyF: number, rF: number, color: string) {
  const ctx = r.context;
  ctx.beginPath();
  ctx.arc(cxF * r.W, cyF * r.H, rF * r.W, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function medalColour(rank: number): string {
  if (rank === 1) return GOLD;
  if (rank === 2) return SILVER;
  if (rank === 3) return BRONZE;
  return 'rgba(255,255,255,0.14)';
}

const fmtScore = (n: number | null) => (n == null ? '-' : n.toLocaleString('en-GB'));

function drawDots(r: CanvasRenderer, count: number, active: number) {
  const gap = 0.03;
  const total = (count - 1) * gap;
  const startX = 0.5 - total / 2;
  for (let i = 0; i < count; i++) {
    const isActive = i === active;
    fillCircle(r, startX + i * gap, 0.955, isActive ? 0.009 : 0.006, isActive ? BRAND_YELLOW : 'rgba(255,255,255,0.35)');
  }
}

function drawFooter(r: CanvasRenderer, copy: CarouselCopy, props: SlideProps) {
  r.drawText(copy.footer, {
    x: 0.06, y: 0.95, size: 0.026, color: MUTED, weight: '700',
    align: 'left', baseline: 'middle', font: DEFAULT_FONT,
  });
  drawDots(r, props.slideCount, props.index);
}

function drawMovement(r: CanvasRenderer, m: LeaderboardRow['movement'], xF: number, yF: number) {
  if (!m) return;
  const colour = m.dir > 0 ? POSITIVE : m.dir < 0 ? NEGATIVE : MUTED;
  const label = m.dir === 0 ? '–' : `${m.dir > 0 ? '▲' : '▼'} ${m.value}`;
  r.drawText(label, {
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
    r.drawBackground(BRAND_BLUE);
    // brand line top
    r.drawText(copy.brandLine, { x: 0.06, y: 0.07, size: 0.03, color: BRAND_YELLOW, weight: '700', baseline: 'middle', font: DEFAULT_FONT });
    fillCircle(r, 0.045, 0.07, 0.008, BRAND_YELLOW);
    // kicker
    r.drawText(copy.coverKicker, { x: 0.06, y: 0.40, size: 0.05, color: BRAND_YELLOW, weight: '700', baseline: 'middle', font: DEFAULT_FONT });
    // big title (wraps + auto-fits)
    r.drawTextWrapped(copy.coverTitle, {
      x: 0.06, y: 0.46, size: 0.108, color: BRAND_WHITE, weight: '800',
      maxWidth: 0.88, lineHeight: 0.115, font: SERIF_FONT,
    });
    // accent rule
    r.drawRect({ x: 0.06, y: 0.70, width: 0.16, height: 0.012, color: BRAND_YELLOW, radius: 0.006 });
    // subtitle
    r.drawText(copy.coverSubtitle, { x: 0.06, y: 0.745, size: 0.034, color: MUTED, weight: '500', baseline: 'middle', font: DEFAULT_FONT });
    // week pill
    r.drawRect({ x: 0.06, y: 0.80, width: 0.6, height: 0.058, color: SURFACE, radius: 0.029 });
    r.drawText(copy.weekLabel, { x: 0.09, y: 0.829, size: 0.03, color: BRAND_YELLOW, weight: '700', baseline: 'middle', font: DEFAULT_FONT, maxWidth: 0.52 });
    // bottom CTA
    r.drawText(copy.coverCta, { x: 0.06, y: 0.90, size: 0.032, color: BRAND_WHITE, weight: '700', baseline: 'middle', font: DEFAULT_FONT, maxWidth: 0.88 });
    drawFooter(r, copy, { rows: [], copy, slideCount, index });
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
      r.drawBackground(BRAND_BLUE);
      r.drawText(copy.listTitle, { x: 0.06, y: 0.085, size: 0.034, color: BRAND_YELLOW, weight: '700', baseline: 'middle', font: DEFAULT_FONT });
      r.drawText(label, { x: 0.06, y: 0.15, size: 0.072, color: BRAND_WHITE, weight: '800', baseline: 'middle', font: SERIF_FONT });
      r.drawRect({ x: 0.06, y: 0.195, width: 0.12, height: 0.01, color: BRAND_YELLOW, radius: 0.005 });

      const scoped = rowsInRange(rows, range);
      const start = 0.255;
      const rowH = 0.118;
      const gap = 0.017;
      scoped.slice(0, 5).forEach((row, i) => {
        const y = start + i * (rowH + gap);
        const cy = y + rowH / 2;
        // card
        r.drawRect({ x: 0.06, y, width: 0.88, height: rowH, color: SURFACE, radius: 0.028 });
        // rank badge
        fillCircle(r, 0.135, cy, 0.046, medalColour(row.rank));
        r.drawText(String(row.rank), { x: 0.135, y: cy, size: 0.046, color: row.rank <= 3 ? BRAND_BLUE : BRAND_WHITE, weight: '800', align: 'center', baseline: 'middle', font: DEFAULT_FONT });
        // name + team
        const hasTeam = !!row.team;
        r.drawText(row.name || '-', { x: 0.215, y: hasTeam ? cy - 0.018 : cy, size: 0.042, color: BRAND_WHITE, weight: '700', baseline: 'middle', font: DEFAULT_FONT, maxWidth: 0.42 });
        if (hasTeam) {
          r.drawText(row.team, { x: 0.215, y: cy + 0.026, size: 0.026, color: MUTED, weight: '500', baseline: 'middle', font: DEFAULT_FONT, maxWidth: 0.42 });
        }
        // movement + score
        drawMovement(r, row.movement, 0.70, cy);
        r.drawText(fmtScore(row.score), { x: 0.91, y: cy - 0.012, size: 0.05, color: BRAND_YELLOW, weight: '800', align: 'right', baseline: 'middle', font: SERIF_FONT });
        r.drawText(copy.scoreUnit, { x: 0.91, y: cy + 0.028, size: 0.022, color: MUTED, weight: '600', align: 'right', baseline: 'middle', font: DEFAULT_FONT });
      });

      if (scoped.length === 0) {
        r.drawText('Dim safleoedd eto', { x: 0.5, y: 0.5, size: 0.04, color: MUTED, align: 'center', baseline: 'middle', font: DEFAULT_FONT });
      }
      drawFooter(r, copy, { rows, copy, slideCount, index });
    },
  };
}

// ═══ WINNER ═══
const winnerSlide: SlideDef = {
  id: 'winner',
  label: 'Enillydd',
  draw(r, { rows, copy, slideCount, index }) {
    const w = rows.find((x) => x.rank === 1) ?? rows[0] ?? { name: '-', score: null, team: '', rank: 1, movement: null };
    r.clear();
    r.drawBackground(BRAND_BLUE);
    r.drawText(copy.winnerKicker, { x: 0.5, y: 0.16, size: 0.04, color: BRAND_YELLOW, weight: '700', align: 'center', baseline: 'middle', font: DEFAULT_FONT });
    r.drawText('🏆', { x: 0.5, y: 0.31, size: 0.17, align: 'center', baseline: 'middle', font: DEFAULT_FONT });
    r.drawText(w.name || '-', { x: 0.5, y: 0.52, size: 0.088, color: BRAND_WHITE, weight: '800', align: 'center', baseline: 'middle', font: SERIF_FONT, maxWidth: 0.86 });
    if (w.team) {
      r.drawText(w.team, { x: 0.5, y: 0.58, size: 0.032, color: MUTED, weight: '500', align: 'center', baseline: 'middle', font: DEFAULT_FONT });
    }
    r.drawText(fmtScore(w.score), { x: 0.5, y: 0.71, size: 0.19, color: BRAND_YELLOW, weight: '800', align: 'center', baseline: 'middle', font: SERIF_FONT });
    r.drawText(`${copy.scoreUnit} ${copy.winnerSubtitle}`, { x: 0.5, y: 0.80, size: 0.034, color: MUTED, weight: '500', align: 'center', baseline: 'middle', font: DEFAULT_FONT, maxWidth: 0.86 });
    // bottom strip
    r.drawRect({ x: 0, y: 0.91, width: 1, height: 0.09, color: BRAND_YELLOW });
    r.drawText(copy.footer, { x: 0.5, y: 0.955, size: 0.04, color: BRAND_BLUE, weight: '800', align: 'center', baseline: 'middle', font: SERIF_FONT });
    void slideCount; void index;
  },
};

// ═══ CTA ═══
const ctaSlide: SlideDef = {
  id: 'cta',
  label: 'Galwad i weithredu',
  draw(r, { copy, slideCount, index }) {
    r.clear();
    r.drawBackground(BRAND_BLUE);
    r.drawTextWrapped(copy.ctaHeadline, {
      x: 0.06, y: 0.30, size: 0.07, color: BRAND_WHITE, weight: '800',
      maxWidth: 0.88, lineHeight: 0.082, font: SERIF_FONT,
    });
    r.drawText(copy.ctaSub, { x: 0.06, y: 0.56, size: 0.036, color: MUTED, weight: '500', baseline: 'middle', font: DEFAULT_FONT, maxWidth: 0.88 });
    // action button
    r.drawRect({ x: 0.06, y: 0.62, width: 0.5, height: 0.085, color: BRAND_YELLOW, radius: 0.042 });
    r.drawText(`${copy.ctaAction} →`, { x: 0.11, y: 0.662, size: 0.04, color: BRAND_BLUE, weight: '800', baseline: 'middle', font: DEFAULT_FONT, maxWidth: 0.4 });
    r.drawText(copy.ctaLink, { x: 0.06, y: 0.76, size: 0.038, color: BRAND_YELLOW, weight: '700', baseline: 'middle', font: DEFAULT_FONT });
    drawFooter(r, copy, { rows: [], copy, slideCount, index });
  },
};

export const SLIDES: SlideDef[] = [
  coverSlide,
  makeListSlide('top5', 'Safleoedd 1–5', [1, 5]),
  makeListSlide('top10', 'Safleoedd 6–10', [6, 10]),
  winnerSlide,
  ctaSlide,
];
