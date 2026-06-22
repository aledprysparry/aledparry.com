// ═══ Cwis Bob Dydd "Cwestiwn y Dydd" quiz carousel ═══
// The S4C daily-quiz format, three slides: 1) the question, 2) the answer
// reveal, 3) an "download the App" call-to-action. Brand-specific (like the
// leaderboard/scoreboard): painted with the shared Cwis paint - royal-indigo
// halftone, the Cwis logo, gold display caps and a cyan accent for the swipe
// chevrons + URL. Copy-driven (no data paste).

import type { CanvasRenderer } from '@engine/lib/canvas/CanvasRenderer';
import {
  GOLD, WHITE, BODY, DISPLAY, TRACK_TITLE,
  setShadow, clearShadow, paintHalftoneBg,
} from './brandPaint';
import { brandImage } from './brandAssets';
import type { CopyField } from '@engine/components/CopyEditor';
import type { Lang } from '@engine/lib/i18n/strings';
import type { SlideDef, SlideProps } from './types';

// Cyan accent (the swipe chevrons + URL in the brand's posts).
const CYAN = '#36a7e6';

const copyOf = (props: SlideProps) => props.copy as unknown as Record<string, string | undefined>;

// The Cwis logo, centred at the top (paintLogo anchors it right; this format
// wants it centred). Falls back to a gold wordmark if the art isn't present.
function paintLogoCentred(r: CanvasRenderer, heightFrac = 0.14, topFrac = 0.055) {
  const logo = brandImage('logo');
  if (logo && logo.naturalWidth > 0) {
    const aspect = logo.naturalWidth / logo.naturalHeight;
    const widthFrac = heightFrac * (r.H / r.W) * aspect;
    r.drawImage(logo, { x: 0.5 - widthFrac / 2, y: topFrac, width: widthFrac, height: heightFrac, fit: 'contain' });
    return;
  }
  const midY = topFrac + heightFrac / 2;
  r.drawText('CWIS BOB DYDD', { x: 0.5, y: midY, size: heightFrac * 0.4, color: GOLD, weight: '900', align: 'center', baseline: 'middle', font: DISPLAY, letterSpacing: TRACK_TITLE });
}

// A centred horizontal rule.
function rule(r: CanvasRenderer, y: number, width: number, color: string, thickness = 0.004) {
  r.drawRect({ x: 0.5 - width / 2, y, width, height: thickness, color, radius: thickness / 2 });
}

// Three right-pointing chevrons (the "swipe on" affordance), centred at cx.
function drawChevrons(r: CanvasRenderer, cx: number, cy: number, size: number, color: string) {
  const ctx = r.context;
  const s = size * r.W;
  const gap = s * 0.78;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.16;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < 3; i++) {
    const x = cx * r.W + (i - 1) * gap;
    const y = cy * r.H;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.2, y - s * 0.34);
    ctx.lineTo(x + s * 0.22, y);
    ctx.lineTo(x - s * 0.2, y + s * 0.34);
    ctx.stroke();
  }
  ctx.restore();
}

// Gold display heading with the brand's drop shadow.
function goldTitle(r: CanvasRenderer, text: string, y: number, size: number) {
  setShadow(r, 'rgba(22,9,66,0.5)', 0.004, 0.007, 0.0015);
  r.drawText(text, { x: 0.5, y, size, color: GOLD, weight: '900', align: 'center', baseline: 'middle', font: DISPLAY, letterSpacing: TRACK_TITLE, maxWidth: 0.86 });
  clearShadow(r);
}

// ── Slide 1: the question (with an optional uploaded image) ──
const questionSlide: SlideDef = {
  id: 'question', label: 'Question',
  draw(r, props) {
    const c = copyOf(props);
    const media = props.images?.questionMedia;
    r.clear();
    paintHalftoneBg(r);
    paintLogoCentred(r);
    goldTitle(r, (c.questionTitle || 'CWESTIWN Y DYDD').toUpperCase(), media ? 0.25 : 0.31, media ? 0.066 : 0.072);
    rule(r, media ? 0.335 : 0.4, 0.8, WHITE, 0.004);
    setShadow(r, 'rgba(8,3,34,0.4)', 0, 0.005, 0.0012);
    r.drawTextWrapped(c.question || 'Your question goes here?', { x: 0.5, y: media ? 0.41 : 0.49, size: media ? 0.044 : 0.05, color: WHITE, weight: '800', align: 'center', font: BODY, maxWidth: 0.82, lineHeight: media ? 0.058 : 0.066, baseline: 'top' });
    clearShadow(r);

    if (media && media.naturalWidth > 0) {
      // Media panel (the reference shows e.g. a programme logo here).
      const pw = 0.5;
      const ph = pw * (r.W / r.H); // square panel
      const pxF = 0.5 - pw / 2;
      const pyF = 0.56;
      setShadow(r, 'rgba(8,3,34,0.4)', 0.014, 0.01);
      r.drawRect({ x: pxF, y: pyF, width: pw, height: ph, color: 'rgba(255,255,255,0.1)', radius: 0.028 });
      clearShadow(r);
      const inset = 0.08;
      r.drawImage(media, { x: pxF + pw * inset, y: pyF + ph * inset, width: pw * (1 - 2 * inset), height: ph * (1 - 2 * inset), fit: 'contain' });
    }

    drawChevrons(r, 0.5, media ? 0.93 : 0.91, media ? 0.046 : 0.05, CYAN);
  },
};

// Count how many lines `text` wraps to at a given size (honours explicit \n),
// so the answer frame can adapt to short vs longer answers.
function countWrappedLines(r: CanvasRenderer, text: string, sizeFrac: number, font: string, weight: string, maxWidthFrac: number) {
  const ctx = r.context;
  ctx.font = `${weight} ${sizeFrac * r.W}px ${font}`;
  const maxPx = maxWidthFrac * r.W;
  let lines = 0;
  for (const para of text.split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxPx && line) { lines++; line = word; }
      else line = test;
    }
    lines++;
  }
  return Math.max(1, lines);
}

// ── Slide 2: the answer (adapts the frame to short vs longer answers) ──
const answerSlide: SlideDef = {
  id: 'answer', label: 'Answer',
  draw(r, props) {
    const c = copyOf(props);
    r.clear();
    paintHalftoneBg(r);
    paintLogoCentred(r);
    goldTitle(r, (c.answerTitle || 'ATEB').toUpperCase(), 0.33, 0.088);

    // Caps toggle: ON = the chunky Digitalt display face (caps look, great for
    // short answers like "1988"); OFF = the normal body font, as typed (better
    // for a longer mixed-case answer with emoji).
    const caps = (c.answerCaps ?? '1') !== '';
    const ansFont = caps ? DISPLAY : BODY;
    const ansWeight = caps ? '900' : '800';
    const answer = (caps ? (c.answer || 'Your answer').toUpperCase() : (c.answer || 'Your answer'));
    // Shrink slightly once the answer runs to several lines so "more info" fits.
    const size = countWrappedLines(r, answer, 0.075, ansFont, ansWeight, 0.82) > 2 ? 0.05 : 0.075;
    const lh = size * 1.12;
    const lines = countWrappedLines(r, answer, size, ansFont, ansWeight, 0.82);
    const blockH = lines * lh;

    const topRule = 0.43;
    const minBotRule = 0.74; // keeps the original frame for short answers
    // Centre the block in the fixed frame when it fits; otherwise top-anchor it
    // below the rule and push the bottom rule down to hug the text.
    const center = (topRule + minBotRule) / 2;
    let textTop = center - blockH / 2;
    let botRule = minBotRule;
    if (textTop < topRule + 0.05) {
      textTop = topRule + 0.06;
      botRule = textTop + blockH + 0.04;
    }

    rule(r, topRule, 0.82, WHITE, 0.0035);
    setShadow(r, 'rgba(8,3,34,0.4)', 0, 0.006, 0.0015);
    r.drawTextWrapped(answer, { x: 0.5, y: textTop, size, color: WHITE, weight: ansWeight, align: 'center', font: ansFont, maxWidth: 0.82, lineHeight: lh, baseline: 'top' });
    clearShadow(r);
    rule(r, botRule, 0.82, WHITE, 0.0035);
  },
};

// ── Slide 3: download-the-app call to action ──
const ctaSlide: SlideDef = {
  id: 'cta', label: 'App CTA',
  draw(r, props) {
    const c = copyOf(props);
    const ctx = r.context;
    r.clear();
    paintHalftoneBg(r);
    paintLogoCentred(r);

    setShadow(r, 'rgba(8,3,34,0.4)', 0, 0.006, 0.0015);
    r.drawTextWrapped(c.ctaText || 'Download the App for more…', { x: 0.5, y: 0.3, size: 0.054, color: WHITE, weight: '800', align: 'center', font: BODY, maxWidth: 0.82, lineHeight: 0.07, baseline: 'top' });
    clearShadow(r);

    // App-icon tile, centred - the real rounded-square Cwis app icon (drops in
    // via brandImage('appIcon')); falls back to a synthetic purple tile + logo
    // if the art isn't present, so it always reads as "the App".
    const tileW = 0.34;
    const tileH = tileW * (r.W / r.H); // square in pixels
    const tx = 0.5 - tileW / 2;
    const ty = 0.5;
    const px = tx * r.W, py = ty * r.H, pw = tileW * r.W, ph = tileH * r.H;
    const appIcon = brandImage('appIcon');
    if (appIcon && appIcon.naturalWidth > 0) {
      setShadow(r, 'rgba(8,3,34,0.5)', 0.022, 0.014);
      r.drawImage(appIcon, { x: tx, y: ty, width: tileW, height: tileH, fit: 'cover', radius: tileW * 0.22 });
      clearShadow(r);
    } else {
      setShadow(r, 'rgba(8,3,34,0.45)', 0.02, 0.012);
      const grad = ctx.createLinearGradient(0, py, 0, py + ph);
      grad.addColorStop(0, '#5a3fe0');
      grad.addColorStop(1, '#3a22ad');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, pw * 0.2);
      ctx.fill();
      clearShadow(r);
      const logo = brandImage('logo');
      if (logo && logo.naturalWidth > 0) {
        r.drawImage(logo, { x: tx + tileW * 0.13, y: ty + tileH * 0.2, width: tileW * 0.74, height: tileH * 0.6, fit: 'contain' });
      } else {
        r.drawText('?', { x: 0.5, y: ty + tileH / 2, size: tileH * 0.6, color: GOLD, weight: '900', align: 'center', baseline: 'middle', font: DISPLAY });
      }
    }

    const url = c.url || 'www.s4c.cymru/cwis-bob-dydd';
    setShadow(r, 'rgba(22,9,66,0.5)', 0, 0.004, 0.0012);
    r.drawText(url.toUpperCase(), { x: 0.5, y: 0.9, size: 0.042, color: CYAN, weight: '900', align: 'center', baseline: 'middle', font: BODY, maxWidth: 0.86, letterSpacing: 0.001 });
    clearShadow(r);
  },
};

export const QUIZ_SLIDES: SlideDef[] = [questionSlide, answerSlide, ctaSlide];

// Bilingual copy. The Welsh is S4C's own published wording (verified, not a
// machine draft); the English is an equivalent for non-Welsh brands.
type Copy = Record<string, string>;
export const QUIZ_COPY: Record<Lang, Copy> = {
  en: {
    questionTitle: 'QUESTION OF THE DAY',
    question: 'In which year was the series "Sgorio" first broadcast?',
    answerTitle: 'ANSWER',
    answer: '1988',
    answerCaps: '1',
    ctaText: 'For more Welsh trivia, download the App for free…',
    url: 'www.s4c.cymru/cwis-bob-dydd',
  },
  cy: {
    questionTitle: 'CWESTIWN Y DYDD',
    question: 'Ym mha flwyddyn cafodd y gyfres "Sgorio" ei darlledu am y tro cyntaf?',
    answerTitle: 'ATEB',
    answer: '1988',
    answerCaps: '1',
    ctaText: 'Am ragor o drivia Gymraeg lawrlwytha’r Ap am ddim…',
    url: 'www.s4c.cymru/cwis-bob-dydd',
  },
};

export const QUIZ_FIELDS: CopyField[] = [
  { key: 'questionTitle', label: 'Question title', labelKey: 'copy.f.questionTitle' },
  { key: 'question', label: 'Question', labelKey: 'copy.f.question', multiline: true },
  { key: 'answerTitle', label: 'Answer title', labelKey: 'copy.f.answerTitle' },
  { key: 'answer', label: 'Answer', labelKey: 'copy.f.answer', multiline: true },
  { key: 'answerCaps', label: 'Answer in capitals', labelKey: 'copy.f.answerCaps', toggle: true },
  { key: 'ctaText', label: 'App CTA text', labelKey: 'copy.f.ctaText', multiline: true },
  { key: 'url', label: 'Website / URL', labelKey: 'copy.field.url' },
];
