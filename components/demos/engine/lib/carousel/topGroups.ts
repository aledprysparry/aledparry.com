// ═══ Cwis Bob Dydd "Top Groups" carousel ═══
// A five-slide group leaderboard for the weekly group rankings:
//   1. Cover  – branded "Top groups this week" intro
//   2. Biggest groups        (by member count)
//   3. Most 10/10 this week   (by count of perfect scores)
//   4. Best average score     (by average)
//   5. CTA    – download-the-app call to action
//
// The three ranking slides each take their OWN pre-ordered list. The editor
// has a single data box; the lists are pasted as three sections under `#`
// headings (biggest, then 10/10, then average). parseTopGroups tags each row
// with its section via the `team` field, and each ranking slide filters to
// its own tag. Reuses the shared Cwis paint (halftone background, logo,
// gold/silver/bronze podium with Welsh ordinals) so it matches the individual
// weekly scoreboard.

import type { CanvasRenderer } from '@engine/lib/canvas/CanvasRenderer';
import {
  INK, GOLD, WHITE, MUTED_ON_DARK, BODY, DISPLAY, TRACK_TITLE,
  setShadow, clearShadow, paintHalftoneBg, paintLogo, fmtScore,
} from './brandPaint';
import type { LeaderboardRow, SlideDef, SlideProps } from './types';
import type { ParseResult } from './parseLeaderboard';

// Section order is positional: 1st `#` heading → biggest, 2nd → tens, 3rd → average.
const SECTION_KEYS = ['biggest', 'tens', 'average'] as const;
type SectionKey = (typeof SECTION_KEYS)[number];
const TOP_N = 5;

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
  ctx.font = `900 ${fs}px ${DISPLAY}`;
  const numStr = String(rank);
  ctx.fillText(numStr, px, py);
  const ord = ORDINAL[rank - 1];
  if (ord) {
    const w = ctx.measureText(numStr).width;
    ctx.font = `800 ${fs * 0.4}px ${DISPLAY}`;
    ctx.fillText(ord, px + w + fs * 0.04, py - fs * 0.28);
  }
  if (pop) clearShadow(r);
}

// ── Slide painters ──

function header(r: CanvasRenderer, title: string) {
  r.clear();
  paintHalftoneBg(r);
  paintLogo(r, { heightFrac: 0.13, topFrac: 0.05, rightFrac: 0.93 });
  setShadow(r, 'rgba(22,9,66,0.5)', 0.004, 0.007, 0.0015);
  r.drawTextWrapped(title, { x: 0.1, y: 0.125, size: 0.078, color: GOLD, weight: '900', font: DISPLAY, maxWidth: 0.62, lineHeight: 0.078, baseline: 'top', letterSpacing: TRACK_TITLE });
  clearShadow(r);
}

function drawRanking(r: CanvasRenderer, list: LeaderboardRow[]) {
  const left = 0.1;
  const right = 0.9;
  const startY = 0.34;
  const pillH = 0.09;
  const pillGap = 0.022;
  const rowH = 0.076;

  list.slice(0, TOP_N).forEach((row, i) => {
    const isPill = i < 3;
    const yc = isPill
      ? startY + pillH / 2 + i * (pillH + pillGap)
      : startY + 3 * (pillH + pillGap) + 0.022 + (i - 3) * rowH + rowH / 2;

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
    rankWithOrdinal(r, left + 0.05, yc, i + 1, isPill ? 0.056 : 0.045, textColor, !isPill);
    r.drawText(row.name || '-', { x: left + 0.14, y: yc, size: isPill ? 0.048 : 0.043, color: textColor, weight: isPill ? '800' : '700', baseline: 'middle', font: BODY, maxWidth: 0.5, letterSpacing: -0.0015 });
    r.drawText(fmtScore(row.score), { x: right - 0.03, y: yc, size: isPill ? 0.05 : 0.045, color: textColor, weight: isPill ? '900' : '800', align: 'right', baseline: 'middle', font: DISPLAY });
  });
}

function rankingSlide(team: SectionKey, titleField: string, fallback: string): SlideDef {
  return {
    id: `groups-${team}`,
    label: fallback,
    draw(r: CanvasRenderer, { rows, copy }: SlideProps) {
      const c = copy as unknown as Record<string, string | undefined>;
      header(r, c[titleField] || fallback);
      drawRanking(r, rows.filter((row) => row.team === team));
    },
  };
}

const coverSlide: SlideDef = {
  id: 'cover',
  label: 'Cover',
  draw(r: CanvasRenderer, { copy }: SlideProps) {
    const c = copy as unknown as Record<string, string | undefined>;
    r.clear();
    paintHalftoneBg(r);
    paintLogo(r, { heightFrac: 0.16, topFrac: 0.08, rightFrac: 0.92 });
    r.drawText(c.coverKicker || 'CWIS BOB DYDD', { x: 0.1, y: 0.42, size: 0.04, color: WHITE, weight: '800', baseline: 'middle', font: BODY, letterSpacing: 0.008 });
    setShadow(r, 'rgba(22,9,66,0.5)', 0.004, 0.008, 0.0015);
    r.drawTextWrapped(c.coverTitle || 'Top groups this week', { x: 0.1, y: 0.47, size: 0.112, color: GOLD, weight: '900', font: DISPLAY, maxWidth: 0.82, lineHeight: 0.108, baseline: 'top' });
    clearShadow(r);
    if (c.dateRange) r.drawText(c.dateRange, { x: 0.1, y: 0.76, size: 0.038, color: MUTED_ON_DARK, weight: '700', baseline: 'middle', font: BODY });
  },
};

const ctaSlide: SlideDef = {
  id: 'cta',
  label: 'Call to action',
  draw(r: CanvasRenderer, { copy }: SlideProps) {
    const c = copy as unknown as Record<string, string | undefined>;
    r.clear();
    paintHalftoneBg(r);
    paintLogo(r, { heightFrac: 0.16, topFrac: 0.08, rightFrac: 0.92 });
    setShadow(r, 'rgba(22,9,66,0.5)', 0.004, 0.008, 0.0015);
    r.drawTextWrapped(c.ctaHeadline || 'Play with your group', { x: 0.1, y: 0.37, size: 0.098, color: GOLD, weight: '900', font: DISPLAY, maxWidth: 0.82, lineHeight: 0.096, baseline: 'top' });
    clearShadow(r);
    r.drawTextWrapped(c.ctaSub || 'Download Cwis Bob Dydd and start your daily quiz.', { x: 0.1, y: 0.58, size: 0.044, color: WHITE, weight: '600', font: BODY, maxWidth: 0.78, lineHeight: 0.058, baseline: 'top' });
    const url = (c.url || '').trim();
    if (url) {
      setShadow(r, 'rgba(22,9,66,0.5)', 0, 0.004, 0.0012);
      r.drawText(url, { x: 0.5, y: 0.89, size: 0.034, color: GOLD, weight: '800', align: 'center', baseline: 'middle', font: BODY, maxWidth: 0.84, letterSpacing: -0.001 });
      clearShadow(r);
    }
  },
};

export const TOP_GROUPS_SLIDES: SlideDef[] = [
  coverSlide,
  rankingSlide('biggest', 'titleBiggest', 'Biggest groups'),
  rankingSlide('tens', 'titleTens', 'Most 10/10 this week'),
  rankingSlide('average', 'titleAverage', 'Best average score'),
  ctaSlide,
];

// ── Copy (bilingual; CY is first-draft, flagged for native review) ──

export const TOP_GROUPS_COPY: Partial<Record<'en' | 'cy', Record<string, string>>> = {
  en: {
    coverKicker: 'CWIS BOB DYDD',
    coverTitle: 'Top groups this week',
    dateRange: '11.02.24 – 18.02.24',
    titleBiggest: 'Biggest groups',
    titleTens: 'Most 10/10 this week',
    titleAverage: 'Best average score',
    ctaHeadline: 'Play with your group',
    ctaSub: 'Download Cwis Bob Dydd and start your daily quiz together.',
    url: 's4c.cymru/cwis-bob-dydd',
  },
  cy: {
    coverKicker: 'CWIS BOB DYDD',
    coverTitle: 'Grwpiau gorau’r wythnos',
    dateRange: '11.02.24 – 18.02.24',
    titleBiggest: 'Y grwpiau mwyaf',
    titleTens: 'Mwyaf o 10/10 yr wythnos',
    titleAverage: 'Y sgôr gyfartalog orau',
    ctaHeadline: 'Chwaraewch gyda’ch grŵp',
    ctaSub: 'Lawrlwythwch Cwis Bob Dydd a dechreuwch eich cwis dyddiol gyda’ch gilydd.',
    url: 's4c.cymru/cwis-bob-dydd',
  },
};

export const TOP_GROUPS_FIELDS = [
  { key: 'coverTitle', label: 'Cover title', labelKey: 'tg.f.coverTitle' as const },
  { key: 'dateRange', label: 'Date range', labelKey: 'tg.f.dateRange' as const },
  { key: 'titleBiggest', label: 'Title: biggest groups', labelKey: 'tg.f.titleBiggest' as const },
  { key: 'titleTens', label: 'Title: most 10/10', labelKey: 'tg.f.titleTens' as const },
  { key: 'titleAverage', label: 'Title: best average', labelKey: 'tg.f.titleAverage' as const },
  { key: 'ctaHeadline', label: 'CTA headline', labelKey: 'tg.f.ctaHeadline' as const },
  { key: 'ctaSub', label: 'CTA subtitle', labelKey: 'tg.f.ctaSub' as const, multiline: true },
  { key: 'url', label: 'Website / URL', labelKey: 'tg.f.url' as const },
];

export const TOP_GROUPS_SAMPLE = `# Biggest groups
Côr Caerdydd, 142
Clwb Pêl-droed Bangor, 128
Ysgol Glan Clwyd, 117
Merched y Wawr Wrecsam, 103
Tîm Tafwyl, 96
# Most 10/10 this week
Ysgol Glan Clwyd, 38
Côr Caerdydd, 33
Clwb Rygbi Pwllheli, 29
CFfI Eryri, 24
Tîm Tafwyl, 21
# Best average score
Merched y Wawr Wrecsam, 9.6
CFfI Eryri, 9.4
Côr Caerdydd, 9.1
Ysgol Glan Clwyd, 8.8
Clwb Rygbi Pwllheli, 8.5`;

// ── Parse: three pre-ordered lists under `#` headings → tagged rows ──

// One line of a group list: optional rank prefix, group name, trailing number.
// "Côr Caerdydd, 142" / "Côr Caerdydd 142" / "1. Côr Caerdydd 9.6"
function parseGroupLine(line: string): { name: string; value: number | null } | null {
  const m = line.match(/^\s*(?:\d+\s*[:.)\-]\s+)?(.+?)[\s,]+([£$]?\d[\d.,]*)\s*$/);
  if (!m) return null;
  const name = m[1].replace(/[,\s]+$/, '').trim();
  const num = parseFloat(m[2].replace(/[^\d.-]/g, ''));
  return { name, value: Number.isFinite(num) ? num : null };
}

export function parseTopGroups(text: string): ParseResult {
  if (!text || !text.trim()) {
    return { rows: [], warnings: [], error: 'No data – paste three lists, each under a # heading (biggest, 10/10, average).' };
  }
  // Split into positional sections at each `#` heading.
  const sectionLines: string[][] = [];
  let cur: string[] | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) { cur = []; sectionLines.push(cur); continue; }
    if (!cur) { cur = []; sectionLines.push(cur); } // data before any heading → first section
    cur.push(line);
  }

  const rows: LeaderboardRow[] = [];
  const warnings: string[] = [];
  SECTION_KEYS.forEach((key, si) => {
    const lines = sectionLines[si] ?? [];
    let rank = 0;
    for (const l of lines) {
      const g = parseGroupLine(l);
      if (!g || (!g.name && g.value == null)) continue;
      rank++;
      if (rank > TOP_N) break;
      rows.push({ rank, name: g.name, score: g.value, team: key, location: '', movement: null });
    }
    if (rank === 0) warnings.push(`No groups read for the "${key}" list.`);
  });

  if (rows.length === 0) {
    return { rows: [], warnings, error: 'Couldn’t read any groups. Use one "group name, number" per line under each # heading.' };
  }
  return { rows, warnings, error: null };
}
