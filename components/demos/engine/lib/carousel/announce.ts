// ═══ Cwis Bob Dydd - "3 rheswm" FOMO carousel ═══
// A five-slide swipe, not an explainer. Each slide is ONE thought, one huge
// Digitalt word, one emoji marker, and a different background colour so the
// feed gets pattern interruption (cover -> 3 reasons -> CTA). Participation-led,
// curiosity-first: the cover earns the swipe, the slides withhold, the last
// slide converts. Brand-specific Cwis paint (halftone bgs, gold Digitalt).

import type { CanvasRenderer } from '@engine/lib/canvas/CanvasRenderer';
import {
  GOLD, WHITE, INK, PURPLE_BOT, BODY, DISPLAY, setShadow, clearShadow,
} from './brandPaint';
import { brandImage, type BrandImageKey } from './brandAssets';
import type { CopyField } from '@engine/components/CopyEditor';
import type { Lang } from '@engine/lib/i18n/strings';
import type { SlideDef, SlideProps } from './types';

const CYAN = '#36a7e6';

const copyOf = (props: SlideProps) => props.copy as unknown as Record<string, string | undefined>;

// Full-bleed brand background (the halftone art) with a solid colour fallback
// so a slide still reads on-brand before the PNG loads / if it is absent.
function paintBg(r: CanvasRenderer, key: BrandImageKey, solid: string) {
  const bg = brandImage(key);
  if (bg && bg.naturalWidth > 0) r.drawImage(bg, { x: 0, y: 0, width: 1, height: 1, fit: 'cover' });
  else r.drawRect({ x: 0, y: 0, width: 1, height: 1, color: solid });
}

function paintLogoCentred(r: CanvasRenderer, heightFrac: number, topFrac: number, tint: 'gold' | 'ink' = 'gold') {
  const logo = brandImage('logo');
  if (logo && logo.naturalWidth > 0) {
    const aspect = logo.naturalWidth / logo.naturalHeight;
    const widthFrac = heightFrac * (r.H / r.W) * aspect;
    r.drawImage(logo, { x: 0.5 - widthFrac / 2, y: topFrac, width: widthFrac, height: heightFrac, fit: 'contain' });
    return;
  }
  r.drawText('CWIS BOB DYDD', { x: 0.5, y: topFrac + heightFrac / 2, size: heightFrac * 0.4, color: tint === 'gold' ? GOLD : INK, weight: '900', align: 'center', baseline: 'middle', font: DISPLAY });
}

// The huge word that owns each slide - uppercase Digitalt, shadowed for punch.
function bigWord(r: CanvasRenderer, text: string, y: number, size: number, color: string) {
  setShadow(r, 'rgba(22,9,66,0.45)', 0.004, 0.008, 0.0018);
  r.drawTextWrapped(text.toUpperCase(), { x: 0.5, y, size, color, weight: '900', align: 'center', font: DISPLAY, maxWidth: 0.92, lineHeight: size * 0.98, baseline: 'top' });
  clearShadow(r);
}

const line = (r: CanvasRenderer, text: string, y: number, size: number, color: string, weight = '700', maxWidth = 0.84, lineHeight?: number) =>
  r.drawTextWrapped(text, { x: 0.5, y, size, color, weight, align: 'center', font: BODY, maxWidth, lineHeight: lineHeight ?? size * 1.32, baseline: 'top' });

const emoji = (r: CanvasRenderer, char: string, y: number, size: number) =>
  r.drawText(char, { x: 0.5, y, size, color: WHITE, align: 'center', baseline: 'middle', font: BODY });

// ── Slides ──────────────────────────────────────────────────────────

const coverSlide: SlideDef = {
  id: 'cover', label: 'Clawr',
  draw(r, props) {
    const c = copyOf(props);
    r.clear();
    paintBg(r, 'bgPurple', PURPLE_BOT);
    paintLogoCentred(r, 0.08, 0.07);
    bigWord(r, c.coverBig || '3 rheswm', 0.27, 0.155, GOLD);
    line(r, c.coverSub || 'i chwarae Cwis Bob Dydd heddiw', 0.6, 0.05, WHITE, '800', 0.82);
    emoji(r, '👇', 0.82, 0.12);
  },
};

const seroSlide: SlideDef = {
  id: 'sero', label: 'Sero',
  draw(r, props) {
    const c = copyOf(props);
    r.clear();
    paintBg(r, 'bgYellow', GOLD);
    emoji(r, c.seroIcon || '🥇', 0.2, 0.15);
    bigWord(r, c.seroBig || 'Sero.', 0.34, 0.2, INK);
    line(r, c.seroL1 || 'Pawb ar sero.', 0.62, 0.058, INK, '900', 0.86);
    line(r, c.seroL2 || 'Dyma’ch cyfle i gyrraedd brig y sgorfwrdd.', 0.74, 0.038, INK, '700', 0.78);
  },
};

const newyddSlide: SlideDef = {
  id: 'newydd', label: 'Newydd',
  draw(r, props) {
    const c = copyOf(props);
    r.clear();
    paintBg(r, 'bgCyan', CYAN);
    emoji(r, c.newyddIcon || '📰', 0.2, 0.15);
    bigWord(r, c.newyddBig || 'Newydd', 0.34, 0.16, INK);
    line(r, c.newyddL1 || 'Cannoedd o gwestiynau newydd.', 0.6, 0.05, INK, '900', 0.86);
    line(r, c.newyddL2 || 'Newyddion · Chwaraeon · Cymru · Teledu', 0.72, 0.038, INK, '700', 0.82);
  },
};

const dyddSlide: SlideDef = {
  id: 'bobdydd', label: 'Bob dydd',
  draw(r, props) {
    const c = copyOf(props);
    r.clear();
    paintBg(r, 'bgPurple', PURPLE_BOT);
    emoji(r, c.dyddIcon || '📅', 0.2, 0.15);
    bigWord(r, c.dyddBig || 'Bob dydd', 0.34, 0.155, GOLD);
    line(r, c.dyddL1 || 'Dim mwy o seibiannau.', 0.62, 0.05, WHITE, '900', 0.86);
    line(r, c.dyddL2 || 'Mae Cwis Bob Dydd yn fyw bob dydd.', 0.73, 0.038, WHITE, '700', 0.82);
  },
};

const ctaSlide: SlideDef = {
  id: 'cta', label: 'Galwad',
  draw(r, props) {
    const c = copyOf(props);
    const media = props.images?.appShot ?? brandImage('phoneScoreboard');
    r.clear();
    paintBg(r, 'bgPurple', PURPLE_BOT);

    // The app, as proof - the scoreboard phone (swappable in the editor).
    const bw = 0.3, bh = 0.4, bx = 0.5 - bw / 2, by = 0.08;
    if (media && media.naturalWidth > 0) {
      setShadow(r, 'rgba(8,3,34,0.5)', 0.02, 0.014);
      r.drawImage(media, { x: bx, y: by, width: bw, height: bh, fit: 'contain' });
      clearShadow(r);
    } else {
      const frame = brandImage('phonePlaceholder');
      if (frame && frame.naturalWidth > 0) r.drawImage(frame, { x: bx, y: by, width: bw, height: bh, fit: 'contain' });
    }

    line(r, c.ctaTitle || 'Beth am roi cynnig heddiw?', 0.55, 0.05, WHITE, '800', 0.86);
    emoji(r, '⬇️', 0.66, 0.07);

    const pillW = 0.74, pillH = 0.085, pillY = 0.74;
    r.drawRect({ x: 0.5 - pillW / 2, y: pillY, width: pillW, height: pillH, color: GOLD, radius: pillH / 2 });
    r.drawText(c.cta || 'Lawrlwythwch Cwis Bob Dydd', { x: 0.5, y: pillY + pillH / 2, size: 0.038, color: INK, weight: '900', align: 'center', baseline: 'middle', font: BODY, maxWidth: pillW * 0.88 });

    r.drawText(c.handle || '@CwisBobDydd', { x: 0.5, y: 0.9, size: 0.034, color: GOLD, weight: '800', align: 'center', baseline: 'middle', font: BODY });
  },
};

export const ANNOUNCE_SLIDES: SlideDef[] = [coverSlide, seroSlide, newyddSlide, dyddSlide, ctaSlide];

// Welsh is first-language (native, supplied by the brand). English is a parallel
// for non-Welsh brands. Participation-led, one thought per slide.
type Copy = Record<string, string>;
export const ANNOUNCE_COPY: Record<Lang, Copy> = {
  cy: {
    coverBig: '3 rheswm', coverSub: 'i chwarae Cwis Bob Dydd heddiw',
    seroIcon: '🥇', seroBig: 'Sero.', seroL1: 'Pawb ar sero.', seroL2: 'Dyma’ch cyfle i gyrraedd brig y sgorfwrdd.',
    newyddIcon: '📰', newyddBig: 'Newydd', newyddL1: 'Cannoedd o gwestiynau newydd.', newyddL2: 'Newyddion · Chwaraeon · Cymru · Teledu',
    dyddIcon: '📅', dyddBig: 'Bob dydd', dyddL1: 'Dim mwy o seibiannau.', dyddL2: 'Mae Cwis Bob Dydd yn fyw bob dydd.',
    ctaTitle: 'Beth am roi cynnig heddiw?', cta: 'Lawrlwythwch Cwis Bob Dydd', handle: '@CwisBobDydd',
  },
  en: {
    coverBig: '3 reasons', coverSub: 'to play Cwis Bob Dydd today',
    seroIcon: '🥇', seroBig: 'Zero.', seroL1: 'Everyone starts at zero.', seroL2: 'Your best shot at the top of the board.',
    newyddIcon: '📰', newyddBig: 'New', newyddL1: 'Hundreds of new questions.', newyddL2: 'News · Sport · Wales · TV',
    dyddIcon: '📅', dyddBig: 'Every day', dyddL1: 'No more breaks.', dyddL2: 'Cwis Bob Dydd is now live every day.',
    ctaTitle: 'Fancy a go today?', cta: 'Download Cwis Bob Dydd', handle: '@CwisBobDydd',
  },
};

export const ANNOUNCE_FIELDS: CopyField[] = [
  { key: 'coverBig', label: 'Clawr - gair mawr' },
  { key: 'coverSub', label: 'Clawr - is-linell' },
  { key: 'seroIcon', label: 'Slide 1 - emoji' },
  { key: 'seroBig', label: 'Slide 1 - gair mawr' },
  { key: 'seroL1', label: 'Slide 1 - llinell 1' },
  { key: 'seroL2', label: 'Slide 1 - llinell 2', multiline: true },
  { key: 'newyddIcon', label: 'Slide 2 - emoji' },
  { key: 'newyddBig', label: 'Slide 2 - gair mawr' },
  { key: 'newyddL1', label: 'Slide 2 - llinell 1' },
  { key: 'newyddL2', label: 'Slide 2 - llinell 2', multiline: true },
  { key: 'dyddIcon', label: 'Slide 3 - emoji' },
  { key: 'dyddBig', label: 'Slide 3 - gair mawr' },
  { key: 'dyddL1', label: 'Slide 3 - llinell 1' },
  { key: 'dyddL2', label: 'Slide 3 - llinell 2', multiline: true },
  { key: 'ctaTitle', label: 'Galwad - pennawd' },
  { key: 'cta', label: 'Galwad - botwm' },
  { key: 'handle', label: 'Handle' },
];
