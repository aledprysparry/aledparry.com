// ═══ Template kind registry ═══
// A Template (data) names a `kind`; the kind supplies the actual
// renderer + content schema. The carousel POC ships one kind, built on
// the existing, untouched carousel engine (lib/carousel + CanvasRenderer).
// New kinds (still, sequence, story-cover, other data shapes) slot in
// here without touching the brand/template/project plumbing.

import type { PlatformId, TemplateType, GraphicElement } from '@engine/lib/model/types';
import type { RatioKey } from '@engine/lib/canvas/CanvasRenderer';
import type { SlideDef } from '@engine/lib/carousel/types';
import { SLIDES, DEFAULT_COPY } from '@engine/lib/carousel/template';
import { parseLeaderboardText, SAMPLE_CSV, type ParseResult } from '@engine/lib/carousel/parseLeaderboard';
import { defaultPostElements } from '@engine/lib/freeform/elements';

export interface TemplateKind {
  id: string;
  name: string;
  type: TemplateType;
  description: string;
  supportedPlatforms: PlatformId[];
  dimensions: { width: number; height: number };
  /** Which editor + content model this kind uses. */
  editor: 'carousel' | 'freeform';
  // carousel kinds:
  slides?: SlideDef[];
  defaultCopy?: Record<string, string>;
  sampleData?: string;
  dataHint?: string;
  parse?: (text: string) => ParseResult;
  // freeform kinds:
  defaultElements?: (brandColours?: string[]) => GraphicElement[];
}

export const TEMPLATE_KINDS: Record<string, TemplateKind> = {
  'quizbookbiz-leaderboard': {
    id: 'quizbookbiz-leaderboard',
    name: 'Weekly Top 10 Leaderboard',
    type: 'carousel',
    editor: 'carousel',
    description:
      'Cover, places 1-5, 6-10, winner spotlight and a call-to-action, from a pasted/CSV/XLSX leaderboard.',
    supportedPlatforms: ['instagram-carousel', 'instagram-feed', 'instagram-story', 'facebook'],
    dimensions: { width: 1080, height: 1350 },
    slides: SLIDES,
    defaultCopy: DEFAULT_COPY as unknown as Record<string, string>,
    sampleData: SAMPLE_CSV,
    dataHint: 'rank, name, score (optional: team, movement like +2 / -1 / 0)',
    parse: parseLeaderboardText,
  },
  'freeform-post': {
    id: 'freeform-post',
    name: 'Blank canvas',
    type: 'still',
    editor: 'freeform',
    description: 'A blank, editable canvas - add text, shapes, logos and images, and edit everything in place.',
    supportedPlatforms: ['instagram-feed', 'instagram-story', 'instagram-carousel', 'facebook', 'linkedin', 'x', 'tiktok'],
    dimensions: { width: 1080, height: 1350 },
    defaultElements: (colours) => defaultPostElements(colours),
  },
};

export const TEMPLATE_KIND_LIST = Object.values(TEMPLATE_KINDS);

export function getKind(id: string): TemplateKind | undefined {
  return TEMPLATE_KINDS[id];
}

// Map a platform to the CanvasRenderer ratio its preset implies, so the
// same template adapts across feed / story / landscape on export.
export function platformToRatio(platform?: PlatformId): RatioKey {
  switch (platform) {
    case 'instagram-story':
    case 'tiktok':
      return 'story';
    case 'x':
      return 'landscape';
    default:
      return 'portrait';
  }
}
