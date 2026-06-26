// ═══ Cwis Bob Dydd weekly "new week / come and play" announcement ═══
// A single branded still: a scroll-stopping hook, a sub line, a warm welcome,
// a call to action, and an image slot (the app screenshot) the user clicks to
// replace in the editor. Brand-specific Cwis paint - royal-indigo halftone,
// the Cwis logo, gold Digitalt display - same family as the quiz/scoreboard.
// When no image is uploaded the slot renders a click-to-replace placeholder.

import type { CanvasRenderer } from '@engine/lib/canvas/CanvasRenderer';
import {
  GOLD, WHITE, INK, BODY, DISPLAY, TRACK_TITLE, setShadow, clearShadow, paintHalftoneBg,
} from './brandPaint';
import { brandImage } from './brandAssets';
import type { CopyField } from '@engine/components/CopyEditor';
import type { Lang } from '@engine/lib/i18n/strings';
import type { SlideDef, SlideProps } from './types';

const copyOf = (props: SlideProps) => props.copy as unknown as Record<string, string | undefined>;

// The Cwis logo, centred at the top (falls back to a gold wordmark).
function paintLogoCentred(r: CanvasRenderer, heightFrac = 0.12, topFrac = 0.05) {
  const logo = brandImage('logo');
  if (logo && logo.naturalWidth > 0) {
    const aspect = logo.naturalWidth / logo.naturalHeight;
    const widthFrac = heightFrac * (r.H / r.W) * aspect;
    r.drawImage(logo, { x: 0.5 - widthFrac / 2, y: topFrac, width: widthFrac, height: heightFrac, fit: 'contain' });
    return;
  }
  r.drawText('CWIS BOB DYDD', { x: 0.5, y: topFrac + heightFrac / 2, size: heightFrac * 0.4, color: GOLD, weight: '900', align: 'center', baseline: 'middle', font: DISPLAY, letterSpacing: TRACK_TITLE });
}

const announceSlide: SlideDef = {
  id: 'announce', label: 'Post',
  draw(r, props) {
    const c = copyOf(props);
    const media = props.images?.appShot;
    r.clear();
    paintHalftoneBg(r);
    paintLogoCentred(r);

    // Hook - the thumb-stopper, gold Digitalt.
    setShadow(r, 'rgba(22,9,66,0.5)', 0.004, 0.007, 0.0015);
    r.drawTextWrapped(c.hook || 'Barod i chwarae?', { x: 0.5, y: 0.2, size: 0.092, color: GOLD, weight: '900', align: 'center', font: DISPLAY, maxWidth: 0.88, lineHeight: 0.096, baseline: 'top' });
    clearShadow(r);

    // Sub line.
    setShadow(r, 'rgba(8,3,34,0.4)', 0, 0.005, 0.0012);
    r.drawTextWrapped(c.sub || 'Wythnos newydd · Sgorfwrdd gwag · Pob lwc!', { x: 0.5, y: 0.345, size: 0.04, color: WHITE, weight: '800', align: 'center', font: BODY, maxWidth: 0.86, lineHeight: 0.052, baseline: 'top' });
    clearShadow(r);

    // Image hero (the app screenshot) - or a click-to-replace placeholder.
    const pw = 0.6, ph = 0.34, px = 0.5 - pw / 2, py = 0.42;
    if (media && media.naturalWidth > 0) {
      setShadow(r, 'rgba(8,3,34,0.45)', 0.018, 0.012);
      r.drawImage(media, { x: px, y: py, width: pw, height: ph, fit: 'cover', radius: 0.03 });
      clearShadow(r);
    } else {
      r.drawRect({ x: px, y: py, width: pw, height: ph, color: 'rgba(255,255,255,0.08)', radius: 0.03 });
      r.drawText('?', { x: 0.5, y: py + ph * 0.4, size: 0.1, color: GOLD, weight: '900', align: 'center', baseline: 'middle', font: DISPLAY });
      r.drawText(c.imageHint || 'Cliciwch i ychwanegu llun yr ap', { x: 0.5, y: py + ph * 0.72, size: 0.026, color: 'rgba(255,255,255,0.66)', weight: '700', align: 'center', baseline: 'middle', font: BODY, maxWidth: pw * 0.86 });
    }

    // Welcome line.
    setShadow(r, 'rgba(8,3,34,0.4)', 0, 0.004, 0.001);
    r.drawTextWrapped(c.welcome || 'Croeso cynnes i bawb sy’n ymuno am y tro cyntaf yr wythnos hon.', { x: 0.5, y: 0.81, size: 0.03, color: WHITE, weight: '700', align: 'center', font: BODY, maxWidth: 0.84, lineHeight: 0.04, baseline: 'top' });
    clearShadow(r);

    // CTA pill.
    const pillW = 0.5, pillH = 0.072, pillY = 0.9;
    r.drawRect({ x: 0.5 - pillW / 2, y: pillY, width: pillW, height: pillH, color: GOLD, radius: pillH / 2 });
    r.drawText(c.cta || 'Chwarae nawr →', { x: 0.5, y: pillY + pillH / 2, size: 0.034, color: INK, weight: '900', align: 'center', baseline: 'middle', font: BODY, maxWidth: pillW * 0.86 });
  },
};

export const ANNOUNCE_SLIDES: SlideDef[] = [announceSlide];

// Seeded with the brand's own example. Welsh is first-language; English is an
// equivalent for non-Welsh brands.
type Copy = Record<string, string>;
export const ANNOUNCE_COPY: Record<Lang, Copy> = {
  cy: {
    hook: 'Barod i chwarae?',
    sub: 'Wythnos newydd · Sgorfwrdd gwag · Pob lwc!',
    welcome: 'Croeso cynnes i bawb sy’n ymuno am y tro cyntaf yr wythnos hon.',
    cta: 'Chwarae nawr →',
    imageHint: 'Cliciwch i ychwanegu llun yr ap',
  },
  en: {
    hook: 'Ready to play?',
    sub: 'New week · Empty scoreboard · Good luck!',
    welcome: 'A warm welcome to everyone joining for the first time this week.',
    cta: 'Play now →',
    imageHint: 'Click to add your app image',
  },
};

export const ANNOUNCE_FIELDS: CopyField[] = [
  { key: 'hook', label: 'Pennawd (bachyn)' },
  { key: 'sub', label: 'Is-linell' },
  { key: 'welcome', label: 'Neges groeso', multiline: true },
  { key: 'cta', label: 'Galwad i weithredu' },
];
