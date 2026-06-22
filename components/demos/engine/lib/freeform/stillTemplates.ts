// ═══ Universal still templates (freeform kinds) ═══
//
// Each builder returns GraphicElement[] - the same fractional element model
// the blank canvas uses, so every template renders identically in the DOM
// editing stage and the canvas export, edits in place, and works on any
// brand. Brand paint = the brand's own colours (resolved into a small
// palette below); the artwork fonts are Inter (body) + Bitter (display).
//
// The freeform style vocabulary is deliberately small (colour, font family /
// weight / size, align, line-height for text; fill + corner radius for
// shapes; a single background fill). Premium look therefore comes from
// typographic hierarchy, oversized numbers/quotes, accent bars and rounded
// chips - never gradients or effects. See DESIGN_PRINCIPLES.md.
//
// WELSH: the `cy` placeholder copy below had a native Welsh review pass on
// 22.06.2026 (house standard: naturalised, not literal). It is co-located
// with each layout so a reviewer can read copy + context together; the
// template *names/descriptions* live in lib/i18n/strings.ts (UI lookups).

import type { GraphicElement } from '@engine/lib/model/types';
import { newId } from '@engine/lib/store/persist';
import type { Lang } from '@engine/lib/i18n/strings';
import { paletteFrom } from '@engine/lib/canvas/palette';

// Design reference ratio (portrait 4:5). Fractions adapt to every ratio.
const W = 1080;
const H = 1350;

// ── element builders ──
const DISPLAY = 'Bitter';
const BODY = 'Inter';

function bgEl(fill: string): GraphicElement {
  return { id: newId('el'), type: 'background', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, style: { fill } };
}
function rect(x: number, y: number, w: number, h: number, fill: string, radius = 0): GraphicElement {
  return { id: newId('el'), type: 'shape', position: { x, y }, size: { width: w, height: h }, style: { fill, radius } };
}
interface TextOpts { color: string; size: number; weight?: string; align?: 'left' | 'center' | 'right'; font?: string; lh?: number; }
function text(content: string, x: number, y: number, w: number, h: number, o: TextOpts): GraphicElement {
  return {
    id: newId('el'), type: 'text', content, position: { x, y }, size: { width: w, height: h },
    style: { color: o.color, fontFamily: o.font ?? BODY, fontWeight: o.weight ?? '700', fontSize: o.size, align: o.align ?? 'left', lineHeight: o.lh ?? 1.15 },
  };
}
/** A rounded pill with vertically-centred label (returns [shape, text]). */
function chip(x: number, y: number, w: number, h: number, fill: string, label: string, labelColor: string, fs: number, font = BODY): GraphicElement[] {
  const radius = (h * H) / (2 * W); // pill: corner = half the pill height, in width-fractions
  const textTop = y + ((h * H - fs * W) / 2) / H;
  return [
    rect(x, y, w, h, fill, radius),
    text(label, x, textTop, w, h, { color: labelColor, weight: '800', size: fs, align: 'center', font }),
  ];
}

// ── bilingual placeholder copy (CY reviewed 22.06.2026) ──
type Copy = Record<string, string>;
const COPY: Record<string, { en: Copy; cy: Copy }> = {
  quote: {
    en: { quote: 'Add the line that stops the scroll - one sharp idea, in your own words.', who: 'First name, role' },
    cy: { quote: 'Rhowch y frawddeg sy’n dal y llygad - un syniad cryf, yn eich geiriau chi.', who: 'Enw, rôl' },
  },
  stat: {
    en: { kicker: 'BY THE NUMBERS', number: '73%', context: 'Say what the number means in one strong line.', sub: 'Add the source or a short note.' },
    cy: { kicker: 'YN Y FFIGURAU', number: '73%', context: 'Dwedwch beth mae’r ffigur yn ei olygu mewn un llinell gref.', sub: 'Ychwanegwch y ffynhonnell neu nodyn byr.' },
  },
  announcement: {
    en: { tag: 'ANNOUNCEMENT', headline: 'Something new is here. Say it big.', sub: 'One supporting line with the detail that matters.', cta: 'Find out more →' },
    cy: { tag: 'CYHOEDDIAD', headline: 'Mae rhywbeth newydd yma. Dwedwch o’n fawr.', sub: 'Un llinell ategol, gyda’r manylyn sy’n cyfri.', cta: 'Rhagor o wybodaeth →' },
  },
  event: {
    en: { kicker: 'YOU’RE INVITED', title: 'Event name goes here', date: 'Sadwrn 12 Gorffennaf', time: '7:00pm', place: 'Venue, town', cta: 'Tickets in bio' },
    cy: { kicker: 'GWAHODDIAD I CHI', title: 'Enw’r digwyddiad yma', date: 'Sadwrn 12 Gorffennaf', time: '7:00yh', place: 'Lleoliad, tref', cta: 'Tocynnau yn y bio' },
  },
  tip: {
    en: { tag: 'TIP', headline: 'The one thing worth knowing, said plainly.', sub: 'A sentence of context so it actually helps.' },
    cy: { tag: 'AWGRYM', headline: 'Yr un peth sy’n werth ei wybod, yn syml.', sub: 'Brawddeg o gyd-destun fel ei fod o gymorth go iawn.' },
  },
  testimonial: {
    en: { stars: '★★★★★', quote: '“Something genuine a real customer said about you.”', who: 'Customer name', role: 'What they do' },
    cy: { stars: '★★★★★', quote: '“Rhywbeth dilys a ddwedodd cwsmer go iawn amdanoch chi.”', who: 'Enw’r cwsmer', role: 'Beth maen nhw’n ei wneud' },
  },
  poll: {
    en: { kicker: 'QUICK QUESTION', question: 'Ask the question people will want to answer.', a: 'This one', b: 'Or this one' },
    cy: { kicker: 'CWESTIWN SYDYN', question: 'Gofynnwch y cwestiwn y bydd pobl eisiau ei ateb.', a: 'Hwn', b: 'Neu hwn' },
  },
  live: {
    en: { tag: '● LIVE', headline: 'We’re live. Come and join in.', sub: 'Say where, and why it’s worth their time.', cta: 'Watch now →' },
    cy: { tag: '● YN FYW', headline: 'Rydyn ni’n fyw. Dewch i ymuno.', sub: 'Dwedwch ble, a pham mae’n werth eu hamser.', cta: 'Gwyliwch nawr →' },
  },
  beforeAfter: {
    en: { beforeTag: 'BEFORE', before: 'How it was - the starting point.', afterTag: 'AFTER', after: 'How it is now - the result.' },
    cy: { beforeTag: 'CYN', before: 'Sut roedd hi - y man cychwyn.', afterTag: 'WEDYN', after: 'Sut mae hi nawr - y canlyniad.' },
  },
  milestone: {
    en: { kicker: 'THANK YOU', big: '10,000', label: 'followers and counting', sub: 'A warm line back to the people who got you here.' },
    cy: { kicker: 'DIOLCH', big: '10,000', label: 'o ddilynwyr a mwy', sub: 'Llinell gynnes yn ôl at y bobl a’ch helpodd chi i gyrraedd yma.' },
  },
  fact: {
    en: { tag: 'DID YOU KNOW?', fact: 'Drop a surprising fact that earns a second look.', source: 'Source or short note' },
    cy: { tag: 'A WYDDOCH CHI?', fact: 'Rhannwch ffaith annisgwyl sy’n haeddu ail olwg.', source: 'Ffynhonnell neu nodyn byr' },
  },
};
const pick = (id: string, lang: Lang): Copy => COPY[id][lang] ?? COPY[id].en;

// ════════════════════════ template builders ════════════════════════

function quote(colours?: string[], lang: Lang = 'en'): GraphicElement[] {
  const p = paletteFrom(colours);
  const c = pick('quote', lang);
  return [
    bgEl(p.bg),
    text('“', 0.075, 0.085, 0.4, 0.2, { color: p.accent, size: 0.26, weight: '800', font: DISPLAY }),
    text(c.quote, 0.08, 0.30, 0.84, 0.42, { color: p.ink, size: 0.064, weight: '800', font: DISPLAY, lh: 1.24 }),
    rect(0.08, 0.745, 0.1, 0.011, p.accent, 0.006),
    text(c.who, 0.08, 0.785, 0.84, 0.08, { color: p.muted, size: 0.034, weight: '600' }),
  ];
}

function stat(colours?: string[], lang: Lang = 'en'): GraphicElement[] {
  const p = paletteFrom(colours);
  const c = pick('stat', lang);
  return [
    bgEl(p.bg),
    text(c.kicker, 0.08, 0.205, 0.84, 0.06, { color: p.accent, size: 0.032, weight: '800' }),
    text(c.number, 0.075, 0.255, 0.85, 0.34, { color: p.ink, size: 0.30, weight: '800', font: DISPLAY }),
    text(c.context, 0.08, 0.625, 0.84, 0.14, { color: p.ink, size: 0.046, weight: '700', lh: 1.2 }),
    text(c.sub, 0.08, 0.78, 0.84, 0.1, { color: p.muted, size: 0.036, weight: '500', lh: 1.3 }),
  ];
}

function announcement(colours?: string[], lang: Lang = 'en'): GraphicElement[] {
  const p = paletteFrom(colours);
  const c = pick('announcement', lang);
  return [
    bgEl(p.bg),
    ...chip(0.08, 0.155, 0.42, 0.058, p.accent, c.tag, p.onAccent, 0.03),
    text(c.headline, 0.08, 0.3, 0.84, 0.34, { color: p.ink, size: 0.078, weight: '800', font: DISPLAY, lh: 1.14 }),
    text(c.sub, 0.08, 0.685, 0.84, 0.12, { color: p.muted, size: 0.04, weight: '500', lh: 1.32 }),
    text(c.cta, 0.08, 0.82, 0.84, 0.07, { color: p.accent, size: 0.038, weight: '700' }),
  ];
}

function event(colours?: string[], lang: Lang = 'en'): GraphicElement[] {
  const p = paletteFrom(colours);
  const c = pick('event', lang);
  return [
    bgEl(p.bg),
    text(c.kicker, 0.08, 0.15, 0.84, 0.05, { color: p.accent, size: 0.032, weight: '800' }),
    text(c.title, 0.08, 0.21, 0.84, 0.22, { color: p.ink, size: 0.07, weight: '800', font: DISPLAY, lh: 1.12 }),
    rect(0.08, 0.5, 0.1, 0.011, p.accent, 0.006),
    text(c.date, 0.08, 0.56, 0.84, 0.07, { color: p.ink, size: 0.046, weight: '700' }),
    text(c.time, 0.08, 0.64, 0.84, 0.07, { color: p.ink, size: 0.046, weight: '700' }),
    text(c.place, 0.08, 0.72, 0.84, 0.07, { color: p.ink, size: 0.046, weight: '700' }),
    text(c.cta, 0.08, 0.84, 0.84, 0.06, { color: p.muted, size: 0.036, weight: '600' }),
  ];
}

function tip(colours?: string[], lang: Lang = 'en'): GraphicElement[] {
  const p = paletteFrom(colours);
  const c = pick('tip', lang);
  return [
    bgEl(p.bg),
    ...chip(0.08, 0.155, 0.17, 0.058, p.accent, c.tag, p.onAccent, 0.03),
    text(c.headline, 0.08, 0.3, 0.84, 0.36, { color: p.ink, size: 0.072, weight: '800', font: DISPLAY, lh: 1.16 }),
    text(c.sub, 0.08, 0.7, 0.84, 0.14, { color: p.muted, size: 0.04, weight: '500', lh: 1.32 }),
  ];
}

function testimonial(colours?: string[], lang: Lang = 'en'): GraphicElement[] {
  const p = paletteFrom(colours);
  const c = pick('testimonial', lang);
  return [
    bgEl(p.bg),
    text(c.stars, 0.08, 0.16, 0.84, 0.08, { color: p.accent, size: 0.062, weight: '400' }),
    text(c.quote, 0.08, 0.3, 0.84, 0.4, { color: p.ink, size: 0.058, weight: '800', font: DISPLAY, lh: 1.26 }),
    rect(0.08, 0.74, 0.1, 0.011, p.accent, 0.006),
    text(c.who, 0.08, 0.78, 0.84, 0.06, { color: p.ink, size: 0.038, weight: '700' }),
    text(c.role, 0.08, 0.835, 0.84, 0.06, { color: p.muted, size: 0.032, weight: '500' }),
  ];
}

function poll(colours?: string[], lang: Lang = 'en'): GraphicElement[] {
  const p = paletteFrom(colours);
  const c = pick('poll', lang);
  return [
    bgEl(p.bg),
    text(c.kicker, 0.08, 0.14, 0.84, 0.05, { color: p.accent, size: 0.032, weight: '800' }),
    text(c.question, 0.08, 0.21, 0.84, 0.3, { color: p.ink, size: 0.068, weight: '800', font: DISPLAY, lh: 1.16 }),
    ...chip(0.08, 0.6, 0.84, 0.1, p.accent, c.a, p.onAccent, 0.042),
    ...chip(0.08, 0.725, 0.84, 0.1, p.soft, c.b, p.ink, 0.042),
  ];
}

function live(colours?: string[], lang: Lang = 'en'): GraphicElement[] {
  const p = paletteFrom(colours);
  const c = pick('live', lang);
  return [
    bgEl(p.bg),
    ...chip(0.08, 0.155, 0.24, 0.058, p.accent, c.tag, p.onAccent, 0.03),
    text(c.headline, 0.08, 0.3, 0.84, 0.3, { color: p.ink, size: 0.078, weight: '800', font: DISPLAY, lh: 1.14 }),
    text(c.sub, 0.08, 0.625, 0.84, 0.12, { color: p.muted, size: 0.04, weight: '500', lh: 1.32 }),
    ...chip(0.08, 0.785, 0.52, 0.092, p.accent, c.cta, p.onAccent, 0.04),
  ];
}

function beforeAfter(colours?: string[], lang: Lang = 'en'): GraphicElement[] {
  const p = paletteFrom(colours);
  const c = pick('beforeAfter', lang);
  return [
    bgEl(p.bg),
    text(c.beforeTag, 0.08, 0.13, 0.84, 0.05, { color: p.muted, size: 0.032, weight: '800' }),
    text(c.before, 0.08, 0.19, 0.84, 0.22, { color: p.ink, size: 0.052, weight: '700', lh: 1.22 }),
    rect(0.08, 0.485, 0.84, 0.008, p.accent, 0.004),
    text(c.afterTag, 0.08, 0.53, 0.84, 0.05, { color: p.accent, size: 0.032, weight: '800' }),
    text(c.after, 0.08, 0.59, 0.84, 0.24, { color: p.ink, size: 0.058, weight: '800', font: DISPLAY, lh: 1.2 }),
  ];
}

function milestone(colours?: string[], lang: Lang = 'en'): GraphicElement[] {
  const p = paletteFrom(colours);
  const c = pick('milestone', lang);
  return [
    bgEl(p.bg),
    text(c.kicker, 0.08, 0.18, 0.84, 0.05, { color: p.accent, size: 0.034, weight: '800' }),
    text(c.big, 0.075, 0.245, 0.85, 0.24, { color: p.ink, size: 0.21, weight: '800', font: DISPLAY }),
    text(c.label, 0.08, 0.55, 0.84, 0.08, { color: p.ink, size: 0.05, weight: '800', lh: 1.16 }),
    text(c.sub, 0.08, 0.66, 0.84, 0.14, { color: p.muted, size: 0.038, weight: '500', lh: 1.34 }),
  ];
}

function fact(colours?: string[], lang: Lang = 'en'): GraphicElement[] {
  const p = paletteFrom(colours);
  const c = pick('fact', lang);
  return [
    bgEl(p.bg),
    ...chip(0.08, 0.155, 0.46, 0.058, p.accent, c.tag, p.onAccent, 0.03),
    text(c.fact, 0.08, 0.3, 0.84, 0.4, { color: p.ink, size: 0.066, weight: '800', font: DISPLAY, lh: 1.22 }),
    text(c.source, 0.08, 0.8, 0.84, 0.06, { color: p.muted, size: 0.034, weight: '600' }),
  ];
}

/** Make a built still on-brand: swap the display font (Bitter) for the brand's
 *  first font where it has one, and add a small corner logo when the brand has
 *  a logo asset. Keeps everything within the freeform style vocabulary. */
export function applyBrandPaint(els: GraphicElement[], fonts?: string[], logoUrl?: string): GraphicElement[] {
  const display = fonts?.[0];
  const out = els.map((el) =>
    display && display !== DISPLAY && el.type === 'text' && (el.style?.fontFamily === DISPLAY)
      ? { ...el, style: { ...el.style, fontFamily: display } }
      : el,
  );
  if (logoUrl) {
    // top-right corner; recedes (branding = hierarchy level 3). The user can
    // move or remove it in the editor.
    out.push({ id: newId('el'), type: 'logo', content: logoUrl, position: { x: 0.74, y: 0.07 }, size: { width: 0.18, height: 0.075 }, style: { fit: 'contain' } });
  }
  return out;
}

export type StillBuilder = (colours?: string[], lang?: Lang) => GraphicElement[];

/** Registry of universal still builders, keyed by the kind id suffix. */
export const STILL_BUILDERS: Record<string, StillBuilder> = {
  'still-quote': quote,
  'still-stat': stat,
  'still-announcement': announcement,
  'still-event': event,
  'still-tip': tip,
  'still-testimonial': testimonial,
  'still-poll': poll,
  'still-live': live,
  'still-before-after': beforeAfter,
  'still-milestone': milestone,
  'still-fact': fact,
};
