// ═══ Postio Coach: closing the loop ═══
// Turn advice into action: apply a recommendation back into a post, and spawn
// a draft post from a Strategy idea. These bridge analyse -> edit and
// strategy -> create so the Coach is generative, not just advisory.

import type { AIRecommendation, GeneratedGraphic, GraphicElement, Template, PlatformId } from '@engine/lib/model/types';
import { renderElementsToDataURL } from '@engine/lib/freeform/renderElements';
import { platformToRatio } from '@engine/lib/templates/registry';

// Render a freeform graphic's first slide to a data URL for vision analysis.
// Returns null for graphics without freeform slides (e.g. carousel kinds).
export async function renderGraphicImage(g: GeneratedGraphic): Promise<string | null> {
  const els = g.slides?.[0]?.elements;
  if (!els?.length) return null;
  const ratio = platformToRatio((g.platformPresetId ?? 'instagram-feed') as PlatformId);
  return renderElementsToDataURL(els, ratio);
}

// The slice of the store these actions need (avoids importing the provider).
interface StoreLike {
  templatesByBrand: (brandId: string) => Template[];
  createTemplate: (brandId: string, kindId: string, name?: string) => Template | undefined;
  createGraphic: (brandId: string, templateId: string, opts?: { name?: string }) => GeneratedGraphic | undefined;
  updateGraphic: (id: string, patch: Partial<GeneratedGraphic>) => void;
}

// Only these recommendation types map to an on-canvas edit.
export function isApplyable(rec: Pick<AIRecommendation, 'type' | 'suggestedValue'>): boolean {
  if (!rec.suggestedValue.trim()) return false;
  return rec.type === 'headline' || rec.type === 'cta';
}

function firstSlideElements(g: GeneratedGraphic): GraphicElement[] | null {
  return g.slides?.[0]?.elements ? [...g.slides[0].elements] : null;
}
function largestText(els: GraphicElement[]): GraphicElement | undefined {
  return els
    .filter((e) => e.type === 'text')
    .sort((a, b) => ((b.style?.fontSize as number) ?? 0) - ((a.style?.fontSize as number) ?? 0))[0];
}

/**
 * Apply a recommendation to a freeform graphic. headline -> the largest text
 * element (or the targeted one); cta -> append a CTA text element. Returns the
 * new slides patch, or null when it cannot be applied (e.g. carousel graphic).
 */
export function applyRecommendation(g: GeneratedGraphic, rec: AIRecommendation): GeneratedGraphic['slides'] | null {
  const els = firstSlideElements(g);
  if (!els) return null;
  const value = rec.suggestedValue.trim();

  if (rec.type === 'headline') {
    const target = (rec.targetElementId && els.find((e) => e.id === rec.targetElementId)) || largestText(els);
    if (!target) return null;
    const next = els.map((e) => (e.id === target.id ? { ...e, content: value } : e));
    return [{ id: g.slides![0].id, order: 0, elements: next }];
  }

  if (rec.type === 'cta') {
    const cta: GraphicElement = {
      id: `el_${Math.random().toString(36).slice(2)}`,
      type: 'text',
      content: value,
      position: { x: 0.08, y: 0.82 },
      size: { width: 0.84, height: 0.1 },
      style: { color: '#ffffff', fontSize: 0.04, fontWeight: '700', fontFamily: 'Inter', align: 'left' },
    };
    return [{ id: g.slides![0].id, order: 0, elements: [...els, cta] }];
  }
  return null;
}

/**
 * Create a draft freeform post seeded with a headline (and optional supporting
 * line), returning the new graphic id so the caller can open the editor.
 * Reuses or creates a 'freeform-post' template for the brand.
 */
export function createDraftFromIdea(store: StoreLike, brandId: string, headline: string, opts?: { support?: string; name?: string }): string | null {
  const existing = store.templatesByBrand(brandId).find((t) => t.kind === 'freeform-post');
  const tpl = existing ?? store.createTemplate(brandId, 'freeform-post', 'Post');
  if (!tpl) return null;
  const g = store.createGraphic(brandId, tpl.id, { name: opts?.name || headline.slice(0, 48) });
  if (!g) return null;

  const els = g.slides?.[0]?.elements ? [...g.slides[0].elements] : [];
  const texts = els.filter((e) => e.type === 'text').sort((a, b) => ((b.style?.fontSize as number) ?? 0) - ((a.style?.fontSize as number) ?? 0));
  if (texts[0]) texts[0].content = headline;
  if (opts?.support && texts[1]) texts[1].content = opts.support;
  store.updateGraphic(g.id, { slides: [{ id: g.slides?.[0]?.id ?? 'slide_0', order: 0, elements: els }] });
  return g.id;
}
