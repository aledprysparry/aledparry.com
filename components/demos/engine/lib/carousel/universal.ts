// ═══ Universal (brand-agnostic) carousels ═══
//
// Unlike the Cwis-painted leaderboard/scoreboard, these draw entirely from the
// brand passed in SlideProps.brand (resolved to a palette), so they adopt ANY
// brand's colours - dark or light. They are copy-driven (no data paste): one
// clear idea per slide, premium typographic hierarchy, an accent thumb-stopper
// and page dots. Artwork fonts are Inter (body) + Bitter (display).
//
// ⚠️ WELSH: the `cy` placeholder copy is a MACHINE DRAFT and needs a native
// review before any real demo (house rule). Field labels live in
// lib/i18n/strings.ts (copy.f.*).

import type { CanvasRenderer } from '@engine/lib/canvas/CanvasRenderer';
import { paletteFrom, type Palette } from '@engine/lib/canvas/palette';
import type { CopyField } from '@engine/components/CopyEditor';
import type { Lang } from '@engine/lib/i18n/strings';
import type { SlideDef, SlideProps } from './types';

const DISPLAY = 'Bitter';
const BODY = 'Inter';
const M = 0.09; // side margin (fraction of width)

const pal = (props: SlideProps): Palette => paletteFrom(props.brand?.colours);
const copyOf = (props: SlideProps) => props.copy as unknown as Record<string, string | undefined>;
const n2 = (n: number) => String(n).padStart(2, '0');

function fillBg(r: CanvasRenderer, p: Palette) {
  r.drawBackground(p.bg);
}

// Page dots: a quiet position indicator along the bottom.
function pageDots(r: CanvasRenderer, p: Palette, count: number, index: number) {
  if (count <= 1) return;
  const gap = 0.03;
  const startX = 0.5 - ((count - 1) * gap) / 2;
  for (let i = 0; i < count; i++) {
    const active = i === index;
    const s = active ? 0.014 : 0.009;
    r.drawRect({ x: startX + i * gap - s / 2, y: 0.95 - s / 2, width: s, height: s, color: active ? p.accent : p.muted, radius: s / 2 });
  }
}

// Small brand wordmark, top-left (cover only).
function wordmark(r: CanvasRenderer, p: SlideProps['brand']) {
  const palette = paletteFrom(p?.colours);
  if (!p?.name) return;
  r.drawText(p.name.toUpperCase(), { x: M, y: 0.115, size: 0.026, color: palette.muted, weight: '700', baseline: 'middle', font: BODY, maxWidth: 0.6, letterSpacing: 0.002 });
}

// ── shared slide shapes ──
function coverSlide(idLabel: string, opts: { swipeKey?: string } = {}): SlideDef {
  return {
    id: 'cover', label: idLabel,
    draw(r, props) {
      const p = pal(props); const c = copyOf(props);
      fillBg(r, p);
      wordmark(r, props.brand);
      if (c.kicker) r.drawText(c.kicker.toUpperCase(), { x: M, y: 0.24, size: 0.032, color: p.accent, weight: '800', font: BODY, letterSpacing: 0.003 });
      r.drawRect({ x: M, y: 0.3, width: 0.1, height: 0.011, color: p.accent, radius: 0.006 });
      r.drawTextWrapped(c.title || 'Your carousel title', { x: M, y: 0.36, size: 0.092, color: p.ink, weight: '800', font: DISPLAY, maxWidth: 0.84, lineHeight: 0.1, baseline: 'top' });
      if (c.subtitle) r.drawTextWrapped(c.subtitle, { x: M, y: 0.74, size: 0.04, color: p.muted, weight: '500', font: BODY, maxWidth: 0.82, lineHeight: 0.052, baseline: 'top' });
      const swipe = opts.swipeKey ? c[opts.swipeKey] : undefined;
      if (swipe) r.drawText(swipe, { x: M, y: 0.88, size: 0.034, color: p.accent, weight: '700', baseline: 'middle', font: BODY });
      pageDots(r, p, props.slideCount, props.index);
    },
  };
}

function ctaSlide(): SlideDef {
  return {
    id: 'cta', label: 'CTA',
    draw(r, props) {
      const p = pal(props); const c = copyOf(props);
      fillBg(r, p);
      r.drawRect({ x: M, y: 0.26, width: 0.1, height: 0.011, color: p.accent, radius: 0.006 });
      r.drawTextWrapped(c.ctaHeadline || 'Ready to start?', { x: M, y: 0.32, size: 0.082, color: p.ink, weight: '800', font: DISPLAY, maxWidth: 0.84, lineHeight: 0.09, baseline: 'top' });
      if (c.ctaSub) r.drawTextWrapped(c.ctaSub, { x: M, y: 0.62, size: 0.04, color: p.muted, weight: '500', font: BODY, maxWidth: 0.82, lineHeight: 0.052, baseline: 'top' });
      const link = c.ctaLink || c.link;
      if (link) {
        const ctx = r.context; ctx.font = `800 ${0.04 * r.W}px ${BODY}`;
        const w = Math.min(ctx.measureText(link).width / r.W + 0.1, 0.84);
        r.drawRect({ x: M, y: 0.78, width: w, height: 0.092, color: p.accent, radius: 0.046 });
        r.drawText(link, { x: M + w / 2, y: 0.826, size: 0.04, color: p.onAccent, weight: '800', align: 'center', baseline: 'middle', font: BODY, maxWidth: w - 0.04 });
      }
      pageDots(r, p, props.slideCount, props.index);
    },
  };
}

// ── 1. Listicle: cover + 3 big-number points + CTA ──
function pointSlide(num: number): SlideDef {
  return {
    id: `point${num}`, label: `Point ${num}`,
    draw(r, props) {
      const p = pal(props); const c = copyOf(props);
      fillBg(r, p);
      r.drawText(n2(num), { x: M, y: 0.18, size: 0.2, color: p.accent, weight: '800', font: DISPLAY, baseline: 'top' });
      r.drawText(`${num} / 3`, { x: 1 - M, y: 0.2, size: 0.03, color: p.muted, weight: '700', align: 'right', baseline: 'middle', font: BODY });
      r.drawTextWrapped(c[`point${num}`] || `Point number ${num} goes here - keep it to one clear idea.`, { x: M, y: 0.46, size: 0.072, color: p.ink, weight: '800', font: DISPLAY, maxWidth: 0.84, lineHeight: 0.082, baseline: 'top' });
      pageDots(r, p, props.slideCount, props.index);
    },
  };
}

export const LISTICLE_SLIDES: SlideDef[] = [
  coverSlide('Cover', { swipeKey: 'swipe' }), pointSlide(1), pointSlide(2), pointSlide(3), ctaSlide(),
];

// ── 2. Mini-explainer: cover + 3 steps + CTA ──
function stepSlide(num: number): SlideDef {
  return {
    id: `step${num}`, label: `Step ${num}`,
    draw(r, props) {
      const p = pal(props); const c = copyOf(props);
      fillBg(r, p);
      // step pill
      const label = `STEP ${num} / 3`;
      const ctx = r.context; ctx.font = `800 ${0.03 * r.W}px ${BODY}`;
      const w = ctx.measureText(label).width / r.W + 0.07;
      r.drawRect({ x: M, y: 0.18, width: w, height: 0.058, color: p.accent, radius: 0.029 });
      r.drawText(label, { x: M + w / 2, y: 0.209, size: 0.03, color: p.onAccent, weight: '800', align: 'center', baseline: 'middle', font: BODY });
      // progress bar
      r.drawRect({ x: M, y: 0.3, width: 0.82, height: 0.01, color: p.soft, radius: 0.005 });
      r.drawRect({ x: M, y: 0.3, width: 0.82 * (num / 3), height: 0.01, color: p.accent, radius: 0.005 });
      r.drawTextWrapped(c[`step${num}`] || `Describe step ${num} in one clear instruction.`, { x: M, y: 0.42, size: 0.07, color: p.ink, weight: '800', font: DISPLAY, maxWidth: 0.84, lineHeight: 0.08, baseline: 'top' });
      pageDots(r, p, props.slideCount, props.index);
    },
  };
}

export const EXPLAINER_SLIDES: SlideDef[] = [
  coverSlide('Cover', { swipeKey: 'swipe' }), stepSlide(1), stepSlide(2), stepSlide(3), ctaSlide(),
];

// ── 3. Before & after: cover + before + after ──
function baSlide(which: 'before' | 'after'): SlideDef {
  return {
    id: which, label: which === 'before' ? 'Before' : 'After',
    draw(r, props) {
      const p = pal(props); const c = copyOf(props);
      fillBg(r, p);
      const isAfter = which === 'after';
      const label = (isAfter ? c.afterLabel : c.beforeLabel) || (isAfter ? 'AFTER' : 'BEFORE');
      r.drawText(label.toUpperCase(), { x: M, y: 0.2, size: 0.05, color: isAfter ? p.accent : p.muted, weight: '800', font: DISPLAY, baseline: 'top', letterSpacing: 0.002 });
      r.drawRect({ x: M, y: 0.3, width: 0.14, height: 0.011, color: isAfter ? p.accent : p.muted, radius: 0.006 });
      r.drawTextWrapped(c[which] || (isAfter ? 'How it is now - the result.' : 'How it was - the starting point.'), { x: M, y: 0.4, size: 0.068, color: p.ink, weight: isAfter ? '800' : '700', font: DISPLAY, maxWidth: 0.84, lineHeight: 0.08, baseline: 'top' });
      if (isAfter && c.link) r.drawText(c.link, { x: M, y: 0.88, size: 0.036, color: p.accent, weight: '700', baseline: 'middle', font: BODY, maxWidth: 0.84 });
      pageDots(r, p, props.slideCount, props.index);
    },
  };
}

export const BEFORE_AFTER_SLIDES: SlideDef[] = [
  coverSlide('Cover'), baSlide('before'), baSlide('after'),
];

// ════════════════ copy (bilingual; cy = machine draft) + field labels ════════════════
type Copy = Record<string, string>;

export const LISTICLE_COPY: Record<Lang, Copy> = {
  en: { kicker: 'Save this', title: '5 ways to get more from your day', subtitle: 'A quick, useful list worth keeping.', swipe: 'Swipe →', point1: 'Start with the one thing that matters most.', point2: 'Cut the step that adds no value.', point3: 'Finish before you add anything new.', ctaHeadline: 'Want the full guide?', ctaSub: 'Follow for more like this, every week.', ctaLink: 'Follow @yourbrand' },
  cy: { kicker: 'Cadwch hwn', title: '5 ffordd i gael mwy o’ch diwrnod', subtitle: 'Rhestr gyflym, ddefnyddiol gwerth ei chadw.', swipe: 'Sweipiwch →', point1: 'Dechreuwch gyda’r un peth pwysicaf.', point2: 'Torrwch y cam nad yw’n ychwanegu dim.', point3: 'Gorffennwch cyn ychwanegu unrhyw beth newydd.', ctaHeadline: 'Eisiau’r canllaw llawn?', ctaSub: 'Dilynwch am ragor fel hyn, bob wythnos.', ctaLink: 'Dilynwch @eichbrand' },
};

export const EXPLAINER_COPY: Record<Lang, Copy> = {
  en: { kicker: 'How to', title: 'How to do it in three simple steps', subtitle: 'No jargon - just the steps that work.', swipe: 'Swipe to learn how →', step1: 'Set up what you need before you start.', step2: 'Do the core work in one focused pass.', step3: 'Check it, then share it with confidence.', ctaHeadline: 'Try it yourself', ctaSub: 'Save this so you have the steps to hand.', ctaLink: 'More at @yourbrand' },
  cy: { kicker: 'Sut i', title: 'Sut i’w wneud mewn tri cham syml', subtitle: 'Dim jargon - dim ond y camau sy’n gweithio.', swipe: 'Sweipiwch i ddysgu sut →', step1: 'Paratowch beth sydd ei angen cyn dechrau.', step2: 'Gwnewch y gwaith craidd mewn un cam canolbwyntiedig.', step3: 'Gwiriwch o, yna rhannwch yn hyderus.', ctaHeadline: 'Rhowch gynnig arni', ctaSub: 'Cadwch hwn fel bod y camau wrth law.', ctaLink: 'Rhagor yn @eichbrand' },
};

export const BEFORE_AFTER_COPY: Record<Lang, Copy> = {
  en: { kicker: 'The transformation', title: 'See the difference for yourself', beforeLabel: 'Before', before: 'Where things started - the problem, plainly put.', afterLabel: 'After', after: 'Where things landed - the result that speaks for itself.', link: 'See more at @yourbrand' },
  cy: { kicker: 'Y trawsnewid', title: 'Gwelwch y gwahaniaeth drosoch eich hun', beforeLabel: 'Cyn', before: 'Lle dechreuodd pethau - y broblem, yn syml.', afterLabel: 'Wedyn', after: 'Lle glaniodd pethau - y canlyniad sy’n siarad drosto’i hun.', link: 'Gwelwch ragor yn @eichbrand' },
};

export const LISTICLE_FIELDS: CopyField[] = [
  { key: 'kicker', label: 'Kicker', labelKey: 'copy.f.kicker' },
  { key: 'title', label: 'Title', labelKey: 'copy.field.title' },
  { key: 'subtitle', label: 'Subtitle', labelKey: 'copy.f.subtitle' },
  { key: 'point1', label: 'Point 1', labelKey: 'copy.f.point1' },
  { key: 'point2', label: 'Point 2', labelKey: 'copy.f.point2' },
  { key: 'point3', label: 'Point 3', labelKey: 'copy.f.point3' },
  { key: 'ctaHeadline', label: 'CTA headline', labelKey: 'copy.f.ctaHeadline' },
  { key: 'ctaSub', label: 'CTA subtext', labelKey: 'copy.f.ctaSub' },
  { key: 'ctaLink', label: 'Link / handle', labelKey: 'copy.f.link' },
];

export const EXPLAINER_FIELDS: CopyField[] = [
  { key: 'kicker', label: 'Kicker', labelKey: 'copy.f.kicker' },
  { key: 'title', label: 'Title', labelKey: 'copy.field.title' },
  { key: 'subtitle', label: 'Subtitle', labelKey: 'copy.f.subtitle' },
  { key: 'step1', label: 'Step 1', labelKey: 'copy.f.step1' },
  { key: 'step2', label: 'Step 2', labelKey: 'copy.f.step2' },
  { key: 'step3', label: 'Step 3', labelKey: 'copy.f.step3' },
  { key: 'ctaHeadline', label: 'CTA headline', labelKey: 'copy.f.ctaHeadline' },
  { key: 'ctaSub', label: 'CTA subtext', labelKey: 'copy.f.ctaSub' },
  { key: 'ctaLink', label: 'Link / handle', labelKey: 'copy.f.link' },
];

export const BEFORE_AFTER_FIELDS: CopyField[] = [
  { key: 'kicker', label: 'Kicker', labelKey: 'copy.f.kicker' },
  { key: 'title', label: 'Title', labelKey: 'copy.field.title' },
  { key: 'beforeLabel', label: 'Before label', labelKey: 'copy.f.beforeLabel' },
  { key: 'before', label: 'Before', labelKey: 'copy.f.before' },
  { key: 'afterLabel', label: 'After label', labelKey: 'copy.f.afterLabel' },
  { key: 'after', label: 'After', labelKey: 'copy.f.after' },
  { key: 'link', label: 'Link / handle', labelKey: 'copy.f.link' },
];
