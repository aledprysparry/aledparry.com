// ═══ Template AI agent: build an editable Postio template from a design ═══
// Sends one uploaded design image to the vision model (via /api/ai/social,
// task 'template-from-image') and turns the returned layout into sanitised,
// editable GraphicElements - the same model the freeform editor + export use,
// so the result is a normal, reusable template the user can refine.
//
// AI output is UNTRUSTED, so sanitiseElements clamps every value to the
// element model's safe ranges (types, 0..1 coords, font bounds, colours) and
// guarantees exactly one background. A malformed element is dropped, never
// trusted.

import type { GraphicElement } from '@engine/lib/model/types';
import { newId } from '@engine/lib/store/persist';
import { paletteFrom } from '@engine/lib/canvas/palette';

export type TemplateMode = 'reproduce' | 'polish';

interface BrandLike { name?: string; colours?: string[]; fonts?: string[] }

export interface TemplateFromImageResult {
  name: string;
  elements: GraphicElement[];
}

const ALLOWED_TYPES = new Set(['background', 'text', 'shape', 'image', 'logo']);
const ALLOWED_WEIGHTS = new Set(['400', '500', '600', '700', '800', '900']);
const ALLOWED_ALIGN = new Set(['left', 'center', 'right']);
const ALLOWED_FIT = new Set(['contain', 'cover']);

const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const isColour = (s: unknown): s is string =>
  typeof s === 'string' && (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s.trim()) || /^rgba?\([\d.,\s%]+\)$/i.test(s.trim()));

/** Clamp untrusted AI elements into the safe element model. */
export function sanitiseElements(raw: unknown, brand: BrandLike): GraphicElement[] {
  const pal = paletteFrom(brand.colours);
  const fonts = new Set([...(brand.fonts ?? []), 'Inter', 'Bitter'].map((f) => f.toLowerCase()));
  const fontFor = (v: unknown): string => {
    if (typeof v === 'string' && fonts.has(v.trim().toLowerCase())) return v.trim();
    return 'Inter';
  };
  const list = Array.isArray(raw) ? raw : [];

  const out: GraphicElement[] = [];
  let bgFill = pal.bg;

  for (const item of list.slice(0, 24)) {
    if (!item || typeof item !== 'object') continue;
    const el = item as Record<string, unknown>;
    const type = String(el.type);
    if (!ALLOWED_TYPES.has(type)) continue;
    const s = (el.style && typeof el.style === 'object' ? el.style : {}) as Record<string, unknown>;

    if (type === 'background') {
      bgFill = isColour(s.fill) ? (s.fill as string) : bgFill;
      continue; // a single background is prepended below
    }

    const pos = (el.position && typeof el.position === 'object' ? el.position : {}) as Record<string, unknown>;
    const size = (el.size && typeof el.size === 'object' ? el.size : {}) as Record<string, unknown>;
    const position = { x: clamp(num(pos.x, 0.1), 0, 0.99), y: clamp(num(pos.y, 0.1), 0, 0.99) };
    const dim = { width: clamp(num(size.width, 0.5), 0.04, 1), height: clamp(num(size.height, 0.2), 0.02, 1) };

    if (type === 'text') {
      const content = typeof el.content === 'string' ? el.content : '';
      if (!content.trim()) continue;
      out.push({
        id: newId('el'), type: 'text', content, position, size: dim,
        style: {
          color: isColour(s.color) ? (s.color as string) : pal.ink,
          fontFamily: fontFor(s.fontFamily),
          fontWeight: ALLOWED_WEIGHTS.has(String(s.fontWeight)) ? String(s.fontWeight) : '700',
          fontSize: clamp(num(s.fontSize, 0.05), 0.02, 0.34),
          align: ALLOWED_ALIGN.has(String(s.align)) ? String(s.align) : 'left',
          lineHeight: clamp(num(s.lineHeight, 1.2), 1, 1.6),
        },
      });
    } else if (type === 'shape') {
      out.push({
        id: newId('el'), type: 'shape', position, size: dim,
        style: { fill: isColour(s.fill) ? (s.fill as string) : pal.accent, radius: clamp(num(s.radius, 0), 0, 0.5) },
      });
    } else {
      // image / logo placeholder (user fills it later)
      out.push({
        id: newId('el'), type: type as 'image' | 'logo', position, size: dim,
        style: { fit: ALLOWED_FIT.has(String(s.fit)) ? String(s.fit) : 'contain', radius: clamp(num(s.radius, 0), 0, 0.5) },
      });
    }
  }

  const background: GraphicElement = {
    id: newId('el'), type: 'background', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, style: { fill: bgFill },
  };
  return [background, ...out];
}

/** Call the agent + sanitise. Returns notConfigured when the AI key is unset. */
export async function buildTemplateFromImage(opts: {
  imageUrl: string; brand: BrandLike; mode: TemplateMode; ratio?: string;
}): Promise<{ result?: TemplateFromImageResult; notConfigured?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/ai/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'template-from-image',
        image: opts.imageUrl,
        brand: { name: opts.brand.name, colours: opts.brand.colours, fonts: opts.brand.fonts },
        mode: opts.mode,
        ratio: opts.ratio ?? 'portrait',
      }),
    });
    if (res.status === 503) return { notConfigured: true };
    const data = await res.json();
    if (!res.ok) return { error: data.error || 'Template build failed' };
    const r = (data.result ?? {}) as { name?: unknown; elements?: unknown };
    const elements = sanitiseElements(r.elements, opts.brand);
    if (elements.length <= 1) return { error: 'The AI could not read a layout from that image. Try a clearer design.' };
    const name = typeof r.name === 'string' && r.name.trim() ? r.name.trim().slice(0, 48) : 'AI template';
    return { result: { name, elements } };
  } catch {
    return { error: 'Network error' };
  }
}
