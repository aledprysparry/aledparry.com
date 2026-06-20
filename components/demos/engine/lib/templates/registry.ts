// ═══ Template kind registry ═══
// A Template (data) names a `kind`; the kind supplies the actual
// renderer + content schema. The carousel POC ships one kind, built on
// the existing, untouched carousel engine (lib/carousel + CanvasRenderer).
// New kinds (still, sequence, story-cover, other data shapes) slot in
// here without touching the brand/template/project plumbing.

import type { PlatformId, TemplateType, GraphicElement } from '@engine/lib/model/types';
import type { RatioKey } from '@engine/lib/canvas/CanvasRenderer';
import type { StringKey } from '@engine/lib/i18n/strings';
import type { SlideDef } from '@engine/lib/carousel/types';
import { SLIDES, DEFAULT_COPY } from '@engine/lib/carousel/template';
import { parseLeaderboardText, SAMPLE_CSV, type ParseResult } from '@engine/lib/carousel/parseLeaderboard';
import { SCOREBOARD_SLIDES, SCOREBOARD_COPY, SCOREBOARD_SAMPLE } from '@engine/lib/carousel/scoreboard';
import { ANIMATED_COPY, ANIMATED_COPY_FIELDS } from '@engine/lib/carousel/animated';
import { defaultPostElements } from '@engine/lib/freeform/elements';

export interface TemplateKind {
  id: string;
  name: string;
  type: TemplateType;
  description: string;
  supportedPlatforms: PlatformId[];
  dimensions: { width: number; height: number };
  /** Which editor + content model this kind uses. */
  editor: 'carousel' | 'freeform' | 'animated';
  /** Universal kinds (blank canvas, animated caption) can be added to any
   *  brand. Brand-specific kinds (e.g. the Cwis-painted scoreboard/leaderboard)
   *  are only offered to a brand that already owns one (seeded), so a new
   *  brand never sees another brand's templates. */
  universal?: boolean;
  // carousel kinds:
  slides?: SlideDef[];
  defaultCopy?: Record<string, string>;
  /** Which copy fields the editor shows (defaults to the carousel set).
   *  labelKey points at an i18n string so the label is bilingual. */
  copyFields?: { key: string; label: string; labelKey?: StringKey }[];
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
  'cwis-weekly-scoreboard': {
    id: 'cwis-weekly-scoreboard',
    name: 'Weekly Scoreboard',
    type: 'still',
    editor: 'carousel',
    description:
      'Branded "Last week\'s leaderboard" still: gold/silver/bronze top 3 (Welsh ordinals) + places 4-10, from pasted/CSV/XLSX data.',
    supportedPlatforms: ['instagram-feed', 'instagram-carousel', 'facebook', 'linkedin'],
    dimensions: { width: 1080, height: 1350 },
    slides: SCOREBOARD_SLIDES,
    defaultCopy: SCOREBOARD_COPY,
    copyFields: [
      { key: 'title', label: 'Title', labelKey: 'copy.field.title' },
      { key: 'dateRange', label: 'Date range', labelKey: 'copy.field.dateRange' },
      { key: 'url', label: 'Website / URL', labelKey: 'copy.field.url' },
    ],
    sampleData: SCOREBOARD_SAMPLE,
    dataHint: 'rank, name, score (decimals ok, e.g. 61.33)',
    parse: parseLeaderboardText,
  },
  'animated-caption': {
    id: 'animated-caption',
    name: 'Animated caption',
    type: 'sequence',
    editor: 'animated',
    universal: true,
    description: 'A short looping caption clip — a bold statement that animates in, exported as WebM. Brand-styled motion for Reels, TikTok and Shorts.',
    supportedPlatforms: ['instagram-story', 'tiktok', 'instagram-feed', 'facebook'],
    dimensions: { width: 1080, height: 1920 },
    defaultCopy: ANIMATED_COPY,
    copyFields: ANIMATED_COPY_FIELDS,
  },
  'freeform-post': {
    id: 'freeform-post',
    name: 'Blank canvas',
    type: 'still',
    editor: 'freeform',
    universal: true,
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
