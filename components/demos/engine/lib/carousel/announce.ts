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
    // The hero image: the user's uploaded shot wins; otherwise the seeded
    // scoreboard mockup is the default content for this post.
    const media = props.images?.appShot ?? brandImage('phoneScoreboard');
    r.clear();
    paintHalftoneBg(r);
    paintLogoCentred(r, 0.1, 0.045);

    // Hook - the thumb-stopper, gold Digitalt.
    setShadow(r, 'rgba(22,9,66,0.5)', 0.004, 0.007, 0.0015);
    r.drawTextWrapped(c.hook || 'Barod i chwarae?', { x: 0.5, y: 0.155, size: 0.082, color: GOLD, weight: '900', align: 'center', font: DISPLAY, maxWidth: 0.9, lineHeight: 0.086, baseline: 'top' });
    clearShadow(r);

    // Sub line.
    setShadow(r, 'rgba(8,3,34,0.4)', 0, 0.005, 0.0012);
    r.drawText(c.sub || 'Wythnos newydd · Sgorfwrdd gwag · Pob lwc!', { x: 0.5, y: 0.262, size: 0.034, color: WHITE, weight: '800', align: 'center', font: BODY, maxWidth: 0.9 });
    clearShadow(r);

    // Phone hero - the app screenshot in its frame (portrait, contained).
    // No image set yet -> the empty-phone placeholder; no art at all -> a
    // drawn prompt. The slot is click-to-replace in the editor.
    const bx = 0.31, bw = 0.38, by = 0.31, bh = 0.46;
    if (media && media.naturalWidth > 0) {
      setShadow(r, 'rgba(8,3,34,0.5)', 0.02, 0.014);
      r.drawImage(media, { x: bx, y: by, width: bw, height: bh, fit: 'contain' });
      clearShadow(r);
    } else {
      const frame = brandImage('phonePlaceholder');
      if (frame && frame.naturalWidth > 0) {
        r.drawImage(frame, { x: bx, y: by, width: bw, height: bh, fit: 'contain' });
      } else {
        const fw = 0.26, fx = 0.5 - fw / 2;
        r.drawRect({ x: fx, y: by, width: fw, height: bh, color: 'rgba(255,255,255,0.08)', radius: 0.04 });
        r.drawText('?', { x: 0.5, y: by + bh * 0.42, size: 0.1, color: GOLD, weight: '900', align: 'center', baseline: 'middle', font: DISPLAY });
        r.drawText(c.imageHint || 'Cliciwch i ychwanegu llun yr ap', { x: 0.5, y: by + bh * 0.66, size: 0.022, color: 'rgba(255,255,255,0.66)', weight: '700', align: 'center', baseline: 'middle', font: BODY, maxWidth: fw * 0.84 });
      }
    }

    // Welcome line.
    setShadow(r, 'rgba(8,3,34,0.4)', 0, 0.004, 0.001);
    r.drawTextWrapped(c.welcome || 'Croeso cynnes i bawb sy’n ymuno am y tro cyntaf yr wythnos hon.', { x: 0.5, y: 0.795, size: 0.027, color: WHITE, weight: '700', align: 'center', font: BODY, maxWidth: 0.84, lineHeight: 0.036, baseline: 'top' });
    clearShadow(r);

    // CTA pill.
    const pillW = 0.5, pillH = 0.07, pillY = 0.9;
    r.drawRect({ x: 0.5 - pillW / 2, y: pillY, width: pillW, height: pillH, color: GOLD, radius: pillH / 2 });
    r.drawText(c.cta || 'Chwarae nawr →', { x: 0.5, y: pillY + pillH / 2, size: 0.033, color: INK, weight: '900', align: 'center', baseline: 'middle', font: BODY, maxWidth: pillW * 0.86 });
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
