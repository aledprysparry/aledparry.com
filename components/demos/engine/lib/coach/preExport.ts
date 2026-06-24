// ═══ Postio Coach: pre-export check ═══
// A deterministic final gate. Inspects the post's elements + text and flags
// the things that break a post on publish: tiny text, out-of-safe-area
// elements, low contrast, weak CTA, too much text, off-brand colour, poor
// mobile legibility, plus caption / alt-text / platform reminders. No AI, so
// it runs instantly and offline.

import type { Brand, GeneratedGraphic, GraphicElement } from '@engine/lib/model/types';
import { extractPostText } from './analysis';

export type CheckSeverity = 'error' | 'warn' | 'info';
export interface CheckItem {
  id: string;
  severity: CheckSeverity;
  /** i18n key (resolved by the component) + optional interpolation vars. */
  key: string;
  vars?: Record<string, string | number>;
}

const CTA_WORDS = ['shop', 'buy', 'learn', 'sign up', 'book', 'download', 'join', 'follow', 'comment', 'save', 'share', 'tap', 'click', 'discover', 'register', 'get', 'dysgwch', 'cofrestrwch', 'archebwch', 'dilynwch', 'rhannwch', 'prynwch', 'ymunwch'];
// Whole-word match (like analysis.ts) so a CTA word is found wherever it sits -
// start of a line, after a newline, or mid-sentence - not only when preceded by
// a literal space. All CTA words are ASCII, so \b is safe (no `u` flag needed).
const CTA_RE = new RegExp(`\\b(${CTA_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'i');

// ── colour parsing + WCAG contrast ──
function parseColour(c: string | undefined): [number, number, number] | null {
  if (!c) return null;
  const s = c.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const rgb = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(s);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return null;
}
function luminance([r, g, b]: [number, number, number]): number {
  const ch = [r, g, b].map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]; // WCAG blue coefficient (was 0.4116; Codex #96)
}
function contrast(a: [number, number, number], b: [number, number, number]): number {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
function near(a: [number, number, number], b: [number, number, number], tol = 28): boolean {
  return Math.abs(a[0] - b[0]) <= tol && Math.abs(a[1] - b[1]) <= tol && Math.abs(a[2] - b[2]) <= tol;
}

function allElements(graphic: GeneratedGraphic): GraphicElement[] {
  return graphic.slides?.flatMap((s) => s.elements) ?? [];
}

// `resolvedCopy` (effectiveCopyForGraphic) lets the text checks see inherited
// template copy on kind/inputs graphics, not just per-graphic overrides.
export function preExportCheck(graphic: GeneratedGraphic, brand: Brand | undefined, platformName: string, resolvedCopy?: Record<string, string>): CheckItem[] {
  const items: CheckItem[] = [];
  const els = allElements(graphic);
  const texts = els.filter((e) => e.type === 'text');
  const bg = els.find((e) => e.type === 'background');
  const bgColour = parseColour(bg?.style?.fill as string | undefined);
  const text = extractPostText(graphic, resolvedCopy);

  // text too small (fontSize is a fraction of canvas width)
  const tiny = texts.filter((e) => typeof e.style?.fontSize === 'number' && (e.style.fontSize as number) < 0.028).length;
  if (tiny) items.push({ id: 'textSmall', severity: 'warn', key: 'review.chk.textSmall', vars: { n: tiny } });

  // outside the safe area (within 4% of any edge)
  const M = 0.04;
  const outside = texts.filter((e) => e.position.x < M || e.position.y < M || e.position.x + e.size.width > 1 - M || e.position.y + e.size.height > 1 - M).length;
  if (outside) items.push({ id: 'safeArea', severity: 'warn', key: 'review.chk.safeArea', vars: { n: outside } });

  // low contrast against the background
  if (bgColour) {
    const lowC = texts.filter((e) => { const c = parseColour(e.style?.color as string | undefined); return c && contrast(c, bgColour) < 3; }).length;
    if (lowC) items.push({ id: 'contrast', severity: 'error', key: 'review.chk.contrast', vars: { n: lowC } });
  }

  // weak / missing CTA
  if (text.joined && !CTA_RE.test(text.joined)) items.push({ id: 'weakCta', severity: 'warn', key: 'review.chk.weakCta' });

  // too much text
  const totalChars = text.joined.replace(/\s/g, '').length;
  if (text.lines.length > 7 || totalChars > 240) items.push({ id: 'tooMuchText', severity: 'warn', key: 'review.chk.tooMuchText', vars: { n: text.lines.length } });

  // off-brand text colour
  if (brand?.colours.length) {
    const palette = brand.colours.map(parseColour).filter(Boolean) as [number, number, number][];
    const offBrand = texts.filter((e) => { const c = parseColour(e.style?.color as string | undefined); if (!c) return false; const white = near(c, [255, 255, 255], 12); const blackish = near(c, [0, 0, 0], 24); return !white && !blackish && !palette.some((p) => near(c, p)); }).length;
    if (offBrand) items.push({ id: 'brandInconsistent', severity: 'info', key: 'review.chk.brandInconsistent', vars: { n: offBrand } });
  }

  // poor mobile legibility: long line on a small font
  const hardToRead = texts.some((e) => (e.content?.length ?? 0) > 42 && typeof e.style?.fontSize === 'number' && (e.style.fontSize as number) < 0.04);
  if (hardToRead) items.push({ id: 'mobileLegibility', severity: 'warn', key: 'review.chk.mobileLegibility' });

  // distracting animation reminder (many moving parts)
  if (texts.length > 5) items.push({ id: 'distractingAnimation', severity: 'info', key: 'review.chk.distractingAnimation' });

  // reminders the editor cannot verify itself
  items.push({ id: 'caption', severity: 'info', key: 'review.chk.caption' });
  items.push({ id: 'altText', severity: 'info', key: 'review.chk.altText' });
  items.push({ id: 'platform', severity: 'info', key: 'review.chk.platform', vars: { platform: platformName } });

  return items;
}

export function severityRank(s: CheckSeverity): number {
  return s === 'error' ? 0 : s === 'warn' ? 1 : 2;
}
