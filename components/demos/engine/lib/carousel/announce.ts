// ═══ Cwis Bob Dydd "Weekly welcome" - bold editorial layout ═══
// One branded still, asymmetric and bold: a huge left-aligned Digitalt hook,
// stacked sub lines, a warm welcome and a gold CTA pill down the LEFT column,
// with the app screenshot stood up as a phone on the RIGHT. The image slot is
// click-to-replace in the editor (defaults to the scoreboard, blank-phone
// placeholder when empty). Brand-specific Cwis paint (halftone bg, gold
// Digitalt, the Cwis logo).

import type { CanvasRenderer } from '@engine/lib/canvas/CanvasRenderer';
import {
  GOLD, WHITE, INK, PURPLE_BOT, BODY, DISPLAY, setShadow, clearShadow,
} from './brandPaint';
import { brandImage } from './brandAssets';
import type { CopyField } from '@engine/components/CopyEditor';
import type { Lang } from '@engine/lib/i18n/strings';
import type { SlideDef, SlideProps } from './types';

const copyOf = (props: SlideProps) => props.copy as unknown as Record<string, string | undefined>;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
// Back-out overshoot: the element pushes past its mark then settles - a bounce.
const easeOutBack = (x: number) => {
  const c1 = 1.70158, c3 = c1 + 1, u = clamp01(x);
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
};

function paintBg(r: CanvasRenderer) {
  const bg = brandImage('bgPurple');
  if (bg && bg.naturalWidth > 0) r.drawImage(bg, { x: 0, y: 0, width: 1, height: 1, fit: 'cover' });
  else r.drawRect({ x: 0, y: 0, width: 1, height: 1, color: PURPLE_BOT });
}

// Logo, left-aligned at the top of the text column.
function paintLogoLeft(r: CanvasRenderer, x: number, y: number, h: number) {
  const logo = brandImage('logo');
  if (logo && logo.naturalWidth > 0) {
    const aspect = logo.naturalWidth / logo.naturalHeight;
    const w = h * (r.H / r.W) * aspect;
    r.drawImage(logo, { x, y, width: w, height: h, fit: 'contain' });
    return;
  }
  r.drawText('CWIS BOB DYDD', { x, y: y + h / 2, size: h * 0.42, color: GOLD, weight: '900', align: 'left', baseline: 'middle', font: DISPLAY });
}

const announceSlide: SlideDef = {
  id: 'announce', label: 'Post', selfAnimates: true,
  draw(r, props) {
    const c = copyOf(props);
    const media = props.images?.appShot ?? brandImage('phoneScoreboard');
    // Entrance progress (1 = settled, i.e. the still preview / PNG export).
    const t = props.anim?.t ?? 1;
    const ctx = r.context;
    const win = (a: number, b: number) => clamp01((t - a) / (b - a));
    const withA = (a: number, fn: () => void) => {
      const prev = ctx.globalAlpha; ctx.globalAlpha = clamp01(a); fn(); ctx.globalAlpha = prev;
    };
    const L = 0.07; // left margin of the text column

    // Background + logo stay STATIC the whole time - never fade (that flickers).
    r.clear();
    paintBg(r);
    paintLogoLeft(r, L, 0.07, 0.085);

    // Hook - bounces up into place (overshoot), the lead beat.
    const tH = win(0, 0.5);
    withA(easeOut(tH / 0.7), () => {
      setShadow(r, 'rgba(22,9,66,0.5)', 0.005, 0.009, 0.002);
      r.drawTextWrapped(c.hook || 'Barod i chwarae?', { x: L, y: 0.21 - (1 - easeOutBack(tH)) * 0.05, size: 0.115, color: GOLD, weight: '900', align: 'left', font: DISPLAY, maxWidth: 0.5, lineHeight: 0.118, baseline: 'top' });
      clearShadow(r);
    });

    // Stacked sub lines stagger in (the third one gold for a lift).
    setShadow(r, 'rgba(8,3,34,0.4)', 0, 0.005, 0.0012);
    const sub = (txt: string, col: string, wt: '800' | '900', baseY: number, i: number) => {
      const ts = win(0.18 + i * 0.06, 0.5 + i * 0.06);
      withA(ts, () => r.drawText(txt, { x: L, y: baseY - (1 - easeOut(ts)) * 0.03, size: 0.045, color: col, weight: wt, align: 'left', baseline: 'top', font: BODY }));
    };
    sub(c.sub1 || 'Wythnos newydd', WHITE, '800', 0.475, 0);
    sub(c.sub2 || 'Sgorfwrdd gwag', WHITE, '800', 0.535, 1);
    sub(c.sub3 || 'Pob lwc!', GOLD, '900', 0.595, 2);
    clearShadow(r);

    // Warm welcome.
    const tW = win(0.34, 0.72);
    withA(tW, () => r.drawTextWrapped(c.welcome || 'Croeso cynnes i bawb sy’n ymuno am y tro cyntaf yr wythnos hon.', { x: L, y: 0.685 - (1 - easeOut(tW)) * 0.025, size: 0.028, color: 'rgba(255,255,255,0.86)', weight: '600', align: 'left', font: BODY, maxWidth: 0.46, lineHeight: 0.038, baseline: 'top' }));

    // CTA pill pops in last.
    const tC = win(0.5, 0.92);
    const pillW = 0.44, pillH = 0.082, pillY = 0.82 - (1 - easeOutBack(tC)) * 0.04;
    withA(easeOut(tC / 0.8), () => {
      r.drawRect({ x: L, y: pillY, width: pillW, height: pillH, color: GOLD, radius: pillH / 2 });
      r.drawText(c.cta || 'Chwarae nawr →', { x: L + pillW / 2, y: pillY + pillH / 2, size: 0.038, color: INK, weight: '900', align: 'center', baseline: 'middle', font: BODY, maxWidth: pillW * 0.86 });
    });

    // The phone rises up on the RIGHT, a beat after the text (the depth).
    const tP = win(0.15, 0.78);
    const bx = 0.55, bw = 0.44, bh = 0.66, by = 0.17 + (1 - easeOut(tP)) * 0.16;
    withA(easeOut(tP / 0.85), () => {
      if (media && media.naturalWidth > 0) {
        setShadow(r, 'rgba(8,3,34,0.55)', 0.025, 0.018, 0.004);
        r.drawImage(media, { x: bx, y: by, width: bw, height: bh, fit: 'contain' });
        clearShadow(r);
      } else {
        const frame = brandImage('phonePlaceholder');
        if (frame && frame.naturalWidth > 0) {
          r.drawImage(frame, { x: bx, y: by, width: bw, height: bh, fit: 'contain' });
        } else {
          const fw = 0.3, fx = bx + (bw - fw) / 2;
          r.drawRect({ x: fx, y: by, width: fw, height: bh, color: 'rgba(255,255,255,0.08)', radius: 0.04 });
          r.drawText('?', { x: fx + fw / 2, y: by + bh * 0.42, size: 0.1, color: GOLD, weight: '900', align: 'center', baseline: 'middle', font: DISPLAY });
          r.drawText(c.imageHint || 'Cliciwch i ychwanegu llun yr ap', { x: fx + fw / 2, y: by + bh * 0.64, size: 0.02, color: 'rgba(255,255,255,0.66)', weight: '700', align: 'center', baseline: 'middle', font: BODY, maxWidth: fw * 0.84 });
        }
      }
    });
  },
};

export const ANNOUNCE_SLIDES: SlideDef[] = [announceSlide];

// Welsh is first-language (native, brand-supplied). English is a parallel for
// non-Welsh brands.
type Copy = Record<string, string>;
export const ANNOUNCE_COPY: Record<Lang, Copy> = {
  cy: {
    hook: 'Barod i chwarae?',
    sub1: 'Wythnos newydd', sub2: 'Sgorfwrdd gwag', sub3: 'Pob lwc!',
    welcome: 'Croeso cynnes i bawb sy’n ymuno am y tro cyntaf yr wythnos hon.',
    cta: 'Chwarae nawr →',
    imageHint: 'Cliciwch i ychwanegu llun yr ap',
  },
  en: {
    hook: 'Ready to play?',
    sub1: 'New week', sub2: 'Empty scoreboard', sub3: 'Good luck!',
    welcome: 'A warm welcome to everyone joining for the first time this week.',
    cta: 'Play now →',
    imageHint: 'Click to add your app image',
  },
};

export const ANNOUNCE_FIELDS: CopyField[] = [
  { key: 'hook', label: 'Pennawd (bachyn)' },
  { key: 'sub1', label: 'Is-linell 1' },
  { key: 'sub2', label: 'Is-linell 2' },
  { key: 'sub3', label: 'Is-linell 3 (aur)' },
  { key: 'welcome', label: 'Neges groeso', multiline: true },
  { key: 'cta', label: 'Galwad i weithredu' },
];
