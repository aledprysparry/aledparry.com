// ═══ Free-form element model helpers ═══
// GraphicElements use fractional coords/sizes (0-1) so a slide renders
// identically in the DOM editor and the canvas exporter, at any size.

import type { GraphicElement } from '@engine/lib/model/types';
import { newId } from '@engine/lib/store/persist';

export interface TextStyle {
  color: string;
  fontSize: number; // fraction of canvas WIDTH
  fontFamily: string;
  fontWeight: string;
  align: 'left' | 'center' | 'right';
  lineHeight: number;
}

export const DEFAULT_TEXT_STYLE: TextStyle = {
  color: '#ffffff',
  fontSize: 0.06,
  fontFamily: 'Inter',
  fontWeight: '700',
  align: 'left',
  lineHeight: 1.2,
};

export function makeText(content: string, partial?: Partial<GraphicElement>): GraphicElement {
  return {
    id: newId('el'),
    type: 'text',
    content,
    position: { x: 0.1, y: 0.1 },
    size: { width: 0.8, height: 0.16 },
    style: { ...DEFAULT_TEXT_STYLE },
    ...partial,
  };
}

export function makeShape(partial?: Partial<GraphicElement>): GraphicElement {
  return {
    id: newId('el'),
    type: 'shape',
    position: { x: 0.1, y: 0.4 },
    size: { width: 0.5, height: 0.2 },
    style: { fill: '#6366f1', radius: 0.03 },
    ...partial,
  };
}

export function makeImage(assetId: string, url: string, type: 'image' | 'logo', partial?: Partial<GraphicElement>): GraphicElement {
  return {
    id: newId('el'),
    type,
    assetId,
    content: url,
    position: { x: 0.1, y: 0.1 },
    size: { width: type === 'logo' ? 0.3 : 0.5, height: type === 'logo' ? 0.12 : 0.4 },
    style: { fit: 'contain', radius: 0 },
    ...partial,
  };
}

// First-run starter layout for a blank post.
export function defaultPostElements(brandColours: string[] = ['#0c1322', '#6366f1', '#ffffff']): GraphicElement[] {
  const [bg = '#0c1322', accent = '#6366f1'] = brandColours;
  return [
    { id: newId('el'), type: 'background', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, style: { fill: bg } },
    { id: newId('el'), type: 'shape', position: { x: 0.1, y: 0.12 }, size: { width: 0.18, height: 0.012 }, style: { fill: accent, radius: 0.006 } },
    makeText('Your headline here', {
      position: { x: 0.1, y: 0.16 }, size: { width: 0.8, height: 0.34 },
      style: { ...DEFAULT_TEXT_STYLE, fontSize: 0.082, fontWeight: '800', fontFamily: 'Bitter' },
    }),
    makeText('Add a supporting line. Double-click any text to edit it in place.', {
      position: { x: 0.1, y: 0.5 }, size: { width: 0.8, height: 0.2 },
      style: { ...DEFAULT_TEXT_STYLE, fontSize: 0.038, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
    }),
  ];
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function moveElement(el: GraphicElement, dx: number, dy: number): GraphicElement {
  return { ...el, position: { x: clamp01(el.position.x + dx), y: clamp01(el.position.y + dy) } };
}

export function resizeElement(el: GraphicElement, dw: number, dh: number): GraphicElement {
  return {
    ...el,
    size: { width: Math.max(0.04, Math.min(1, el.size.width + dw)), height: Math.max(0.03, Math.min(1, el.size.height + dh)) },
  };
}

export function reorder(elements: GraphicElement[], id: string, dir: 1 | -1): GraphicElement[] {
  const i = elements.findIndex((e) => e.id === id);
  if (i < 0) return elements;
  const j = i + dir;
  if (j < 0 || j >= elements.length) return elements;
  const copy = [...elements];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}
