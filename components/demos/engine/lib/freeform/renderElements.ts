// Render GraphicElements onto a CanvasRenderer - the export path that
// mirrors the DOM editing stage. One element model, two renderers
// (DOM for editing, canvas for export), so what you see exports exactly.

import { saveAs } from 'file-saver';
import { CanvasRenderer, type RatioKey } from '@engine/lib/canvas/CanvasRenderer';
import { ensureFonts } from '@engine/lib/carousel/fonts';
import type { GraphicElement } from '@engine/lib/model/types';

function loadImage(src?: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((res) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

type Align = 'left' | 'center' | 'right';

export async function drawElements(r: CanvasRenderer, elements: GraphicElement[]): Promise<void> {
  await ensureFonts();
  for (const el of elements) {
    const s = (el.style ?? {}) as Record<string, unknown>;
    if (el.type === 'background') {
      r.drawBackground((s.fill as string) ?? '#0c1322');
      if (el.content) {
        const img = await loadImage(el.content);
        if (img) r.drawImage(img, { x: 0, y: 0, width: 1, height: 1, fit: ((s.fit as 'cover' | 'contain') ?? 'cover') });
      }
    } else if (el.type === 'shape') {
      r.drawRect({
        x: el.position.x, y: el.position.y, width: el.size.width, height: el.size.height,
        color: (s.fill as string) ?? '#6366f1', radius: (s.radius as number) ?? 0,
      });
    } else if (el.type === 'text') {
      const align = ((s.align as Align) ?? 'left');
      const anchorX = align === 'center' ? el.position.x + el.size.width / 2 : align === 'right' ? el.position.x + el.size.width : el.position.x;
      const fontSize = (s.fontSize as number) ?? 0.05;
      r.drawTextWrapped(el.content ?? '', {
        x: anchorX, y: el.position.y, size: fontSize,
        color: (s.color as string) ?? '#ffffff',
        weight: (s.fontWeight as string) ?? '600',
        italic: s.fontStyle === 'italic',
        font: (s.fontFamily as string) ?? 'Inter',
        align, baseline: 'top', maxWidth: el.size.width,
        lineHeight: fontSize * ((s.lineHeight as number) ?? 1.2),
      });
    } else if (el.type === 'image' || el.type === 'logo') {
      const img = await loadImage(el.content);
      if (img) {
        r.drawImage(img, {
          x: el.position.x, y: el.position.y, width: el.size.width, height: el.size.height,
          fit: ((s.fit as 'cover' | 'contain') ?? 'contain'), radius: (s.radius as number) ?? 0,
        });
      }
    }
  }
}

const slug = (s: string) => (s || 'graphic').replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 48).toLowerCase();
const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg' };

export async function exportElements(
  elements: GraphicElement[],
  name: string,
  mime: string,
  ratio: RatioKey,
): Promise<void> {
  const canvas = document.createElement('canvas');
  const r = new CanvasRenderer(canvas, ratio);
  await drawElements(r, elements);
  const blob = await r.exportBlob(mime, mime === 'image/jpeg' ? 0.92 : undefined);
  saveAs(blob, `${slug(name)}.${EXT[mime]}`);
}

// Render elements to a JPEG data URL (no download) - used by the Coach's
// vision analysis so the model judges the actual rendered post, not just text.
export async function renderElementsToDataURL(elements: GraphicElement[], ratio: RatioKey): Promise<string | null> {
  try {
    const canvas = document.createElement('canvas');
    const r = new CanvasRenderer(canvas, ratio);
    await drawElements(r, elements);
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return null;
  }
}
