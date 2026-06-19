// ═══ Layout review: deterministic preflight + AI vision critique ═══
// Renders each slide to a downscaled JPEG and (a) runs instant rule-based
// checks, (b) sends the images to the vision model for a designer's review.

import { CanvasRenderer, type RatioKey } from '@engine/lib/canvas/CanvasRenderer';
import { ensureFonts } from './fonts';
import type { CarouselCopy, LeaderboardRow, SlideDef } from './types';

export interface ReviewIssue { slide: number; label?: string; ok?: boolean; issues: string[]; }
export interface AiReview { slides: ReviewIssue[]; overall?: string; }

/** Render every slide at its target ratio, downscaled, as JPEG data-URLs. */
export async function renderSlideThumbs(
  slides: SlideDef[], rows: LeaderboardRow[], copy: CarouselCopy, ratio: RatioKey, maxW = 540,
): Promise<string[]> {
  await ensureFonts();
  const out: string[] = [];
  slides.forEach((slide, index) => {
    const full = document.createElement('canvas');
    const r = new CanvasRenderer(full, ratio);
    slide.draw(r, { rows, copy, slideCount: slides.length, index });
    const scale = Math.min(1, maxW / r.W);
    const tc = document.createElement('canvas');
    tc.width = Math.round(r.W * scale);
    tc.height = Math.round(r.H * scale);
    tc.getContext('2d')!.drawImage(full, 0, 0, tc.width, tc.height);
    out.push(tc.toDataURL('image/jpeg', 0.82));
  });
  return out;
}

/** Instant, free rule-based checks on the data feeding the slides. */
export function preflight(rows: LeaderboardRow[]): string[] {
  const issues: string[] = [];
  if (!rows.length) { issues.push('No leaderboard rows yet - paste data or load the sample.'); return issues; }
  if (rows.length < 10) issues.push(`Only ${rows.length} of 10 places filled.`);
  const longest = rows.reduce((m, r) => Math.max(m, (r.name || '').length), 0);
  if (longest > 22) issues.push('Some names are long and will auto-shrink - check they stay legible.');
  if (rows.some((r) => r.score == null)) issues.push('One or more rows have no score.');
  return issues;
}

/** Ask the vision model to review the rendered slides (graceful 503 if no key). */
export async function aiReview(
  images: string[], ratio: string, brand: { name?: string; toneNotes?: string } | undefined, slideLabels: string[],
): Promise<{ review?: AiReview; notConfigured?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/ai/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task: 'review-layout', images, ratio, brand, slideLabels }),
    });
    if (res.status === 503) return { notConfigured: true };
    const data = await res.json();
    if (!res.ok) return { error: data.error || 'AI review failed' };
    return { review: data.result as AiReview };
  } catch {
    return { error: 'Network error' };
  }
}
