// ═══ Locked template -> fully editable freeform ═══
//
// A locked brand template (a carousel "kind" like cwis-announce "Weekly
// welcome") renders a fixed, on-brand, animated layout the user can only edit
// by copy field - elements cannot move or resize. This module rebuilds that
// same look as freeform GraphicElement[] (the fractional element model the
// blank canvas + Stage use), so an "Unlock / Customise" action can spin off a
// FULLY editable copy (drag, resize, retype every element) without touching the
// original, which stays locked + animated. "Keep both."
//
// Each converter here is the freeform twin of one locked layout. It reads the
// graphic's EFFECTIVE copy + uploaded images and emits elements positioned to
// match the locked render as closely as the freeform style vocabulary allows
// (colour, font family/weight/size, align, line-height for text; fill + corner
// radius for shapes; a single background fill or image). New converters slot in
// under FREEFORM_FROM_TEMPLATE keyed by kind id; a kind opts in via its
// optional registry `toFreeform`.

import type { GraphicElement } from '@engine/lib/model/types';
import { newId } from '@engine/lib/store/persist';
import type { Lang } from '@engine/lib/i18n/strings';

// Copy passed in is the effective (kind base <- master <- override) map, so any
// field may be missing; we fall back to the same Welsh-first defaults the
// locked layout uses.
export type FreeformCopy = Record<string, string | undefined>;
export type FreeformImages = Record<string, string>;

// Cwis brand paint, matched to lib/carousel/brandPaint + the locked
// cwis-announce render. Asset paths mirror the carousel IMAGE_MANIFEST
// (/public/app/cwis/...); same-origin so they load on canvas export too.
const GOLD = '#ffd60a';
const WHITE = '#ffffff';
const INK = '#1e1556'; // dark indigo text on the gold pill
const PURPLE_BOT = '#2f1aa6'; // bg fallback fill when the halftone is absent
const BG_PURPLE = '/app/cwis/bg-purple.png';
const LOGO = '/app/cwis/logo.png';
const PHONE_DEFAULT = '/app/cwis/phone-scoreboard.png';

// Digitalt is the Cwis display face (commercial webfont, registered by
// brandAssets.ensureAssets, which the locked editor + the freeform export both
// trigger). Falls back to sans-serif when its woff2 is absent.
const DISPLAY = 'Digitalt';
const BODY = 'Inter';

interface TextOpts {
  color: string;
  size: number; // fraction of canvas WIDTH (matches Stage cqi + canvas export)
  weight?: string;
  align?: 'left' | 'center' | 'right';
  font?: string;
  lh?: number;
}

function bgImage(content: string): GraphicElement {
  return { id: newId('el'), type: 'background', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, content, style: { fit: 'cover', fill: PURPLE_BOT } };
}
function image(content: string, x: number, y: number, w: number, h: number, type: 'image' | 'logo' = 'image'): GraphicElement {
  return { id: newId('el'), type, content, position: { x, y }, size: { width: w, height: h }, style: { fit: 'contain', radius: 0 } };
}
function rect(x: number, y: number, w: number, h: number, fill: string, radius = 0): GraphicElement {
  return { id: newId('el'), type: 'shape', position: { x, y }, size: { width: w, height: h }, style: { fill, radius } };
}
function text(content: string, x: number, y: number, w: number, h: number, o: TextOpts): GraphicElement {
  return {
    id: newId('el'), type: 'text', content, position: { x, y }, size: { width: w, height: h },
    style: { color: o.color, fontFamily: o.font ?? BODY, fontWeight: o.weight ?? '700', fontSize: o.size, align: o.align ?? 'left', lineHeight: o.lh ?? 1.15 },
  };
}

// Welsh-first defaults, mirroring ANNOUNCE_COPY so an unlocked copy is never
// blank even if a field was cleared on the locked original.
const ANNOUNCE_FALLBACK: Record<Lang, Record<string, string>> = {
  cy: { hook: 'Barod i chwarae?', sub1: 'Wythnos newydd', sub2: 'Sgorfwrdd gwag', sub3: 'Pob lwc!', welcome: 'Croeso cynnes i bawb sy’n ymuno am y tro cyntaf yr wythnos hon.', cta: 'Chwarae nawr →' },
  en: { hook: 'Ready to play?', sub1: 'New week', sub2: 'Empty scoreboard', sub3: 'Good luck!', welcome: 'A warm welcome to everyone joining for the first time this week.', cta: 'Play now →' },
};

/**
 * Rebuild the bold cwis-announce "Weekly welcome" still as freeform elements:
 * halftone bg, top-left logo, a huge gold Digitalt hook, three stacked sub
 * lines, a warm welcome, a gold CTA pill, and the app screenshot stood up as a
 * phone on the right. Positions mirror the locked layout (square 1080x1080).
 */
export function announceToFreeform(copy: FreeformCopy, images: FreeformImages, lang: Lang): GraphicElement[] {
  const fb = ANNOUNCE_FALLBACK[lang] ?? ANNOUNCE_FALLBACK.en;
  const c = (k: string) => (copy[k]?.trim() ? (copy[k] as string) : fb[k] ?? '');
  const L = 0.07; // left margin of the text column

  const phone = images.appShot ?? PHONE_DEFAULT;
  const pillW = 0.44, pillH = 0.082, pillY = 0.82;

  return [
    bgImage(BG_PURPLE),
    // The phone on the right (app as proof). Default scoreboard, or the upload.
    image(phone, 0.55, 0.17, 0.44, 0.66),
    // Logo, top-left of the text column.
    image(LOGO, 0.06, 0.06, 0.3, 0.115, 'logo'),
    // Hook - huge, bold, gold Digitalt. The whole point.
    text(c('hook'), L, 0.23, 0.5, 0.22, { color: GOLD, size: 0.092, weight: '900', font: DISPLAY, lh: 1.05 }),
    // Stacked sub lines (the third gold for a lift).
    text(c('sub1'), L, 0.47, 0.46, 0.06, { color: WHITE, size: 0.045, weight: '800' }),
    text(c('sub2'), L, 0.53, 0.46, 0.06, { color: WHITE, size: 0.045, weight: '800' }),
    text(c('sub3'), L, 0.59, 0.46, 0.06, { color: GOLD, size: 0.045, weight: '900' }),
    // Warm welcome, smaller, left column.
    text(c('welcome'), L, 0.685, 0.46, 0.1, { color: 'rgba(255,255,255,0.86)', size: 0.028, weight: '600', lh: 1.35 }),
    // CTA pill + its label (shape first so the text renders on top).
    rect(L, pillY, pillW, pillH, GOLD, pillH / 2),
    text(c('cta'), L, pillY + (pillH - 0.038) / 2, pillW, pillH, { color: INK, size: 0.038, weight: '900', align: 'center', lh: 1.0 }),
  ];
}

/** Registry of locked-kind -> freeform converters, keyed by template kind id.
 *  A kind opts in by delegating its registry `toFreeform` here. */
export const FREEFORM_FROM_TEMPLATE: Record<string, (copy: FreeformCopy, images: FreeformImages, lang: Lang) => GraphicElement[]> = {
  'cwis-announce': announceToFreeform,
};
