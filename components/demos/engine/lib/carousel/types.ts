import type { CanvasRenderer } from '@engine/lib/canvas/CanvasRenderer';

export interface Movement {
  dir: 1 | 0 | -1;
  value: number;
}

export interface LeaderboardRow {
  rank: number;
  name: string;
  score: number | null;
  team: string;
  /** Optional location / postcode shown beside the name (e.g. "LL55"). */
  location: string;
  movement: Movement | null;
}

export interface CarouselCopy {
  brandLine: string;
  weekLabel: string;
  coverKicker: string;
  coverTitle: string;
  coverSubtitle: string;
  coverCta: string;
  listTitle: string;
  scoreUnit: string;
  winnerKicker: string;
  winnerSubtitle: string;
  ctaHeadline: string;
  ctaSub: string;
  ctaAction: string;
  ctaLink: string;
  footer: string;
  // Weekly Scoreboard kind:
  title?: string;
  dateRange?: string;
  url?: string;
}

/** Brand paint for universal (brand-agnostic) carousels. The Cwis-specific
 *  kinds ignore this and keep their own paint; the universal kinds resolve it
 *  into a palette so they adopt whatever brand is applied. */
export interface CarouselBrand {
  name?: string;
  colours: string[];
  fonts?: string[];
  logoUrl?: string;
}

export interface SlideProps {
  rows: LeaderboardRow[];
  copy: CarouselCopy;
  slideCount: number;
  index: number;
  /** Present for universal kinds; undefined for the Cwis-painted kinds. */
  brand?: CarouselBrand;
  /** Optional, decoded user-uploaded images keyed by the kind's imageSlot key. */
  images?: Record<string, HTMLImageElement>;
  /** Entrance progress 0..1 for self-animating slides (1 = settled). Absent
   *  (-> treat as 1) for the still preview/export. Lets a slide animate its
   *  own elements per frame instead of the export fading the whole image. */
  anim?: { t: number };
}

export interface SlideDef {
  id: string;
  label: string;
  /** Inclusive [from,to] rank window for list slides. */
  range?: [number, number];
  /** When true, the animated export renders this slide LIVE each frame (passing
   *  props.anim) so it can animate its own elements over a static background,
   *  instead of fading a pre-rendered bitmap (which flickers the background). */
  selfAnimates?: boolean;
  draw: (r: CanvasRenderer, props: SlideProps) => void;
}
