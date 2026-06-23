// ═══ Template kind registry ═══
// A Template (data) names a `kind`; the kind supplies the actual
// renderer + content schema. The carousel POC ships one kind, built on
// the existing, untouched carousel engine (lib/carousel + CanvasRenderer).
// New kinds (still, sequence, story-cover, other data shapes) slot in
// here without touching the brand/template/project plumbing.

import type { PlatformId, TemplateType, GraphicElement } from '@engine/lib/model/types';
import type { RatioKey } from '@engine/lib/canvas/CanvasRenderer';
import type { StringKey, Lang } from '@engine/lib/i18n/strings';
import type { SlideDef } from '@engine/lib/carousel/types';
import { SLIDES, DEFAULT_COPY } from '@engine/lib/carousel/template';
import { parseLeaderboardText, SAMPLE_CSV, type ParseResult } from '@engine/lib/carousel/parseLeaderboard';
import { SCOREBOARD_SLIDES, SCOREBOARD_COPY, SCOREBOARD_SAMPLE } from '@engine/lib/carousel/scoreboard';
import { QUIZ_SLIDES, QUIZ_COPY, QUIZ_FIELDS } from '@engine/lib/carousel/quiz';
import { TOP_GROUPS_SLIDES, TOP_GROUPS_COPY, TOP_GROUPS_FIELDS, TOP_GROUPS_SAMPLE, parseTopGroups } from '@engine/lib/carousel/topGroups';
import { POLL_SLIDES, POLL_COPY, POLL_FIELDS } from '@engine/lib/carousel/poll';
import { ANIMATED_COPY, ANIMATED_COPY_FIELDS, UNIVERSAL_ANIMATED_COPY } from '@engine/lib/carousel/animated';
import { defaultPostElements } from '@engine/lib/freeform/elements';
import { STILL_BUILDERS, applyBrandPaint } from '@engine/lib/freeform/stillTemplates';
import {
  LISTICLE_SLIDES, LISTICLE_COPY, LISTICLE_FIELDS,
  EXPLAINER_SLIDES, EXPLAINER_COPY, EXPLAINER_FIELDS,
  BEFORE_AFTER_SLIDES, BEFORE_AFTER_COPY, BEFORE_AFTER_FIELDS,
} from '@engine/lib/carousel/universal';

export interface TemplateKind {
  id: string;
  name: string;
  /** Bilingual name/description: when set, the UI shows t(nameKey)/t(descKey)
   *  and `name`/`description` are the EN fallback. */
  nameKey?: StringKey;
  descKey?: StringKey;
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
  /** Bilingual default copy for copy-driven kinds; createTemplate bakes the
   *  current language into the master. Falls back to `defaultCopy`. */
  defaultCopyByLang?: Partial<Record<Lang, Record<string, string>>>;
  /** Which copy fields the editor shows (defaults to the carousel set).
   *  labelKey points at an i18n string so the label is bilingual. */
  copyFields?: { key: string; label: string; labelKey?: StringKey; multiline?: boolean; toggle?: boolean }[];
  /** Optional image slots a carousel kind accepts (uploaded per graphic, stored
   *  in graphic.inputs.images[key]). Blank by default; drawn if the user adds one. */
  imageSlots?: { key: string; label: string; labelKey?: StringKey }[];
  sampleData?: string;
  dataHint?: string;
  /** Bilingual override for the data-box format hint (i18n key). When set, the
   *  editor shows t(dataHintKey) instead of the generic leaderboard hint. */
  dataHintKey?: StringKey;
  parse?: (text: string) => ParseResult;
  // freeform kinds. Brand paint: colours + language, plus the brand's fonts
  // (fonts[0] → display) and logo URL (small corner mark) where available.
  defaultElements?: (brandColours?: string[], lang?: Lang, fonts?: string[], logoUrl?: string) => GraphicElement[];
}

// Universal still platforms (every still adapts across these ratios).
const STILL_PLATFORMS: PlatformId[] = [
  'instagram-feed', 'instagram-story', 'instagram-carousel', 'facebook', 'linkedin', 'x', 'tiktok',
];

// Metadata for the universal still library. The renderer is the matching
// builder in STILL_BUILDERS; name/description here are the EN fallback, with
// nameKey/descKey pointing at the bilingual strings (lib/i18n/strings.ts).
const STILL_META: { id: string; name: string; description: string }[] = [
  { id: 'still-quote', name: 'Quote card', description: 'A bold pull-quote set large, with an accent mark and quiet attribution.' },
  { id: 'still-stat', name: 'Big stat', description: 'One oversized number as the thumb-stopper, with a line of context.' },
  { id: 'still-announcement', name: 'Announcement', description: 'A tagged headline post for news, launches and updates, with a call to action.' },
  { id: 'still-event', name: 'Event', description: 'Title plus date, time and place, stacked clearly under an accent rule.' },
  { id: 'still-tip', name: 'Tip / how-to', description: 'A single useful tip, tagged and set big, with a line of context.' },
  { id: 'still-testimonial', name: 'Testimonial', description: 'A five-star review quote with the customer name and role.' },
  { id: 'still-poll', name: 'Question / poll', description: 'A question with two option chips to spark replies and shares.' },
  { id: 'still-live', name: 'Now live / CTA', description: 'A live badge, a punchy headline and a tappable call-to-action chip.' },
  { id: 'still-before-after', name: 'Before & after', description: 'A two-panel before/after split divided by an accent rule.' },
  { id: 'still-milestone', name: 'Milestone / thank-you', description: 'A celebratory milestone number with a warm thank-you line.' },
  { id: 'still-fact', name: 'Did you know?', description: 'A surprising fact, tagged and set big, with a source line.' },
];

const STILL_KINDS: Record<string, TemplateKind> = Object.fromEntries(
  STILL_META.map((m) => [
    m.id,
    {
      id: m.id,
      name: m.name,
      nameKey: `${m.id}.name` as StringKey,
      descKey: `${m.id}.desc` as StringKey,
      type: 'still' as TemplateType,
      editor: 'freeform' as const,
      universal: true,
      description: m.description,
      supportedPlatforms: STILL_PLATFORMS,
      dimensions: { width: 1080, height: 1350 },
      defaultElements: (colours?: string[], lang?: Lang, fonts?: string[], logoUrl?: string) =>
        applyBrandPaint(STILL_BUILDERS[m.id](colours, lang), fonts, logoUrl),
    } satisfies TemplateKind,
  ]),
);

export const TEMPLATE_KINDS: Record<string, TemplateKind> = {
  ...STILL_KINDS,
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
  'cwis-quiz': {
    id: 'cwis-quiz',
    name: 'Question of the day',
    nameKey: 'cwis-quiz.name',
    descKey: 'cwis-quiz.desc',
    type: 'carousel',
    editor: 'carousel',
    // Brand-specific (Cwis paint), like the leaderboard/scoreboard - seeded to
    // the Cwis brand, never auto-offered to other brands.
    description: 'A three-slide quiz: the question, the answer reveal, and an app-download call-to-action.',
    // Square first (the S4C native format); 4:5 + story also offered so the
    // same template adapts across feeds, carousels and Reels/Stories.
    supportedPlatforms: ['instagram-square', 'instagram-carousel', 'instagram-feed', 'facebook', 'instagram-story'],
    dimensions: { width: 1080, height: 1080 },
    slides: QUIZ_SLIDES,
    defaultCopy: QUIZ_COPY.en,
    defaultCopyByLang: QUIZ_COPY,
    copyFields: QUIZ_FIELDS,
    imageSlots: [{ key: 'questionMedia', label: 'Question image', labelKey: 'copy.f.questionImage' }],
  },
  'cwis-top-groups': {
    id: 'cwis-top-groups',
    name: 'Top Groups',
    nameKey: 'cwis-top-groups.name',
    descKey: 'cwis-top-groups.desc',
    type: 'carousel',
    editor: 'carousel',
    // Brand-specific (Cwis paint), seeded to the Cwis brand only - never
    // auto-offered to other brands (see BRANDED_KINDS in StoreProvider).
    description: 'A five-slide group leaderboard: cover, biggest groups, most 10/10 this week, best average score, and an app call-to-action.',
    supportedPlatforms: ['instagram-carousel', 'instagram-feed', 'instagram-square', 'facebook', 'instagram-story'],
    dimensions: { width: 1080, height: 1350 },
    slides: TOP_GROUPS_SLIDES,
    defaultCopy: TOP_GROUPS_COPY.en as Record<string, string>,
    defaultCopyByLang: TOP_GROUPS_COPY,
    copyFields: TOP_GROUPS_FIELDS,
    sampleData: TOP_GROUPS_SAMPLE,
    dataHint: 'Three lists under # headings (biggest, then 10/10, then average): one "group name, number" per line, top 5 each.',
    dataHintKey: 'tg.dataHint',
    parse: parseTopGroups,
  },
  'cwis-poll': {
    id: 'cwis-poll',
    name: 'Poll',
    nameKey: 'cwis-poll.name',
    descKey: 'cwis-poll.desc',
    type: 'still',
    editor: 'carousel',
    // Brand-specific (Cwis paint), seeded to the Cwis brand only.
    description: 'An interactive poll still: a question and three numbered options for a feed or Story poll (vote in the comments).',
    supportedPlatforms: ['instagram-square', 'instagram-feed', 'instagram-carousel', 'facebook', 'instagram-story'],
    dimensions: { width: 1080, height: 1080 },
    slides: POLL_SLIDES,
    defaultCopy: POLL_COPY.en as Record<string, string>,
    defaultCopyByLang: POLL_COPY,
    copyFields: POLL_FIELDS,
  },
  'animated-caption': {
    id: 'animated-caption',
    name: 'Animated caption',
    type: 'sequence',
    editor: 'animated',
    // Brand-specific (NOT universal): only offered to a brand that already owns
    // one, so a new brand never inherits another client's animated caption.
    // Same rule as the Cwis scoreboard/leaderboard (#74).
    description: 'A short looping caption clip – a bold statement that animates in, exported as WebM. Brand-styled motion for Reels, TikTok and Shorts.',
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
  // ── universal carousels (brand-painted via SlideProps.brand; no data paste) ──
  'universal-listicle': {
    id: 'universal-listicle',
    name: 'Listicle',
    nameKey: 'universal-listicle.name',
    descKey: 'universal-listicle.desc',
    type: 'carousel',
    editor: 'carousel',
    universal: true,
    description: 'A cover, three big-number points and a call-to-action - a save-worthy numbered list.',
    supportedPlatforms: ['instagram-carousel', 'instagram-feed', 'facebook', 'linkedin'],
    dimensions: { width: 1080, height: 1350 },
    slides: LISTICLE_SLIDES,
    defaultCopy: LISTICLE_COPY.en,
    defaultCopyByLang: LISTICLE_COPY,
    copyFields: LISTICLE_FIELDS,
  },
  'universal-explainer': {
    id: 'universal-explainer',
    name: 'Mini-explainer',
    nameKey: 'universal-explainer.name',
    descKey: 'universal-explainer.desc',
    type: 'carousel',
    editor: 'carousel',
    universal: true,
    description: 'A cover, three numbered steps with a progress bar and a call-to-action - a how-to in five slides.',
    supportedPlatforms: ['instagram-carousel', 'instagram-feed', 'facebook', 'linkedin'],
    dimensions: { width: 1080, height: 1350 },
    slides: EXPLAINER_SLIDES,
    defaultCopy: EXPLAINER_COPY.en,
    defaultCopyByLang: EXPLAINER_COPY,
    copyFields: EXPLAINER_FIELDS,
  },
  'universal-before-after': {
    id: 'universal-before-after',
    name: 'Before & after carousel',
    nameKey: 'universal-before-after.name',
    descKey: 'universal-before-after.desc',
    type: 'carousel',
    editor: 'carousel',
    universal: true,
    description: 'A cover plus a before slide and an after slide - a three-slide transformation story.',
    supportedPlatforms: ['instagram-carousel', 'instagram-feed', 'facebook', 'linkedin'],
    dimensions: { width: 1080, height: 1350 },
    slides: BEFORE_AFTER_SLIDES,
    defaultCopy: BEFORE_AFTER_COPY.en,
    defaultCopyByLang: BEFORE_AFTER_COPY,
    copyFields: BEFORE_AFTER_FIELDS,
  },
  // ── universal animated caption (brand-painted; Cwis caption stays separate) ──
  'universal-animated': {
    id: 'universal-animated',
    name: 'Animated statement',
    nameKey: 'universal-animated.name',
    descKey: 'universal-animated.desc',
    type: 'sequence',
    editor: 'animated',
    universal: true,
    description: 'A bold statement that animates in on your brand colour - a looping caption for Reels, TikTok and Shorts.',
    supportedPlatforms: ['instagram-story', 'tiktok', 'instagram-feed', 'facebook'],
    dimensions: { width: 1080, height: 1920 },
    defaultCopy: UNIVERSAL_ANIMATED_COPY.en,
    defaultCopyByLang: UNIVERSAL_ANIMATED_COPY,
    copyFields: ANIMATED_COPY_FIELDS,
  },
};

export const TEMPLATE_KIND_LIST = Object.values(TEMPLATE_KINDS);

export function getKind(id: string): TemplateKind | undefined {
  return TEMPLATE_KINDS[id];
}

/** Placeholder copy base for a kind in the CURRENT language. Kinds with
 *  `defaultCopyByLang` switch with the app language live (the master no longer
 *  bakes a single-language snapshot); others fall back to `defaultCopy`. */
export function kindBaseCopy(kind: TemplateKind | undefined, lang: Lang): Record<string, string> {
  if (!kind) return {};
  return kind.defaultCopyByLang?.[lang] ?? kind.defaultCopy ?? {};
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
    case 'instagram-square':
      return 'square';
    default:
      return 'portrait';
  }
}
