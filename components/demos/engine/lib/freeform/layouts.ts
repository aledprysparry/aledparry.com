// Layout generators for the Template Style Generator: turn an extracted
// style (palette + theme + fonts) into starter elements for a post.

import type { GraphicElement } from '@engine/lib/model/types';
import { newId } from '@engine/lib/store/persist';

export interface GenStyle {
  palette: string[];
  theme: 'dark' | 'light';
  heading: string;
  body: string;
}

function lum(hex: string): number {
  const h = hex.match(/[0-9a-f]{6}/i)?.[0] ?? '888888';
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function sat(hex: string): number {
  const h = (hex.match(/[0-9a-f]{6}/i)?.[0]) ?? '888888';
  const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function pick(palette: string[], theme: 'dark' | 'light') {
  const list = palette.length ? palette : ['#0c1322', '#6366f1', '#ffffff'];
  const sorted = [...list].sort((a, b) => lum(a) - lum(b));
  const bg = theme === 'dark' ? sorted[0] : sorted[sorted.length - 1];
  const text = theme === 'dark' ? '#ffffff' : '#0c1322';
  // accent: most saturated colour that isn't basically the background
  const accent = [...list].filter((c) => c !== bg).sort((a, b) => sat(b) - sat(a))[0] ?? (theme === 'dark' ? sorted[sorted.length - 1] : sorted[0]);
  const muted = theme === 'dark' ? 'rgba(255,255,255,0.65)' : 'rgba(12,19,34,0.6)';
  return { bg, text, accent, muted };
}

const bgEl = (fill: string): GraphicElement => ({ id: newId('el'), type: 'background', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, style: { fill } });
const text = (content: string, position: GraphicElement['position'], size: GraphicElement['size'], style: Record<string, unknown>): GraphicElement => ({ id: newId('el'), type: 'text', content, position, size, style });
const bar = (fill: string, position: GraphicElement['position'], size: GraphicElement['size'], radius = 0.006): GraphicElement => ({ id: newId('el'), type: 'shape', position, size, style: { fill, radius } });

export function layoutCover(s: GenStyle): GraphicElement[] {
  const c = pick(s.palette, s.theme);
  return [
    bgEl(c.bg),
    bar(c.accent, { x: 0.1, y: 0.13 }, { width: 0.16, height: 0.012 }),
    text('Your headline here', { x: 0.1, y: 0.18 }, { width: 0.8, height: 0.34 }, { color: c.text, fontSize: 0.085, fontWeight: '800', fontFamily: s.heading, align: 'left', lineHeight: 1.1 }),
    text('A supporting line, in your brand voice.', { x: 0.1, y: 0.58 }, { width: 0.8, height: 0.16 }, { color: c.muted, fontSize: 0.038, fontWeight: '500', fontFamily: s.body, align: 'left', lineHeight: 1.3 }),
  ];
}

export function layoutQuote(s: GenStyle): GraphicElement[] {
  const c = pick(s.palette, s.theme);
  return [
    bgEl(c.bg),
    text('“', { x: 0.1, y: 0.12 }, { width: 0.3, height: 0.2 }, { color: c.accent, fontSize: 0.18, fontWeight: '800', fontFamily: s.heading, align: 'left', lineHeight: 1 }),
    text('A short, punchy quote that captures the moment.', { x: 0.1, y: 0.32 }, { width: 0.8, height: 0.4 }, { color: c.text, fontSize: 0.058, fontWeight: '700', fontFamily: s.heading, align: 'left', lineHeight: 1.25 }),
    bar(c.accent, { x: 0.1, y: 0.8 }, { width: 0.1, height: 0.01 }),
    text('Attribution', { x: 0.1, y: 0.83 }, { width: 0.8, height: 0.1 }, { color: c.muted, fontSize: 0.034, fontWeight: '600', fontFamily: s.body, align: 'left', lineHeight: 1.2 }),
  ];
}

export function layoutStat(s: GenStyle): GraphicElement[] {
  const c = pick(s.palette, s.theme);
  return [
    bgEl(c.bg),
    text('Label', { x: 0.1, y: 0.2 }, { width: 0.8, height: 0.1 }, { color: c.accent, fontSize: 0.04, fontWeight: '700', fontFamily: s.body, align: 'center', lineHeight: 1.2 }),
    text('87%', { x: 0.1, y: 0.34 }, { width: 0.8, height: 0.3 }, { color: c.text, fontSize: 0.2, fontWeight: '800', fontFamily: s.heading, align: 'center', lineHeight: 1 }),
    text('What the number means, briefly.', { x: 0.15, y: 0.66 }, { width: 0.7, height: 0.16 }, { color: c.muted, fontSize: 0.036, fontWeight: '500', fontFamily: s.body, align: 'center', lineHeight: 1.3 }),
  ];
}

export const LAYOUTS: { id: string; name: string; build: (s: GenStyle) => GraphicElement[] }[] = [
  { id: 'cover', name: 'Cover', build: layoutCover },
  { id: 'quote', name: 'Quote', build: layoutQuote },
  { id: 'stat', name: 'Stat', build: layoutStat },
];
