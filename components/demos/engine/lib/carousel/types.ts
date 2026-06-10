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
}

export interface SlideProps {
  rows: LeaderboardRow[];
  copy: CarouselCopy;
  slideCount: number;
  index: number;
}

export interface SlideDef {
  id: string;
  label: string;
  /** Inclusive [from,to] rank window for list slides. */
  range?: [number, number];
  draw: (r: CanvasRenderer, props: SlideProps) => void;
}
