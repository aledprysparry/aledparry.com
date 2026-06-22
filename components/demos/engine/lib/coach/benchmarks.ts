// ═══ Postio Coach: benchmark module catalog ═══
//
// One catalog drives three things: the toggles in the Benchmarks panel, the
// modules an analysis scores, and the brief sent to the AI. Each module has a
// stable snake_case id (backend-ready), an English label + description (used by
// the server prompt and as an i18n fallback), and a `default` flag marking the
// ten modules enabled out of the box. UI labels localise via the i18n keys
// `coach.bm.<id>` (label) and `coach.bm.<id>.d` (description); see strings.ts.

export interface BenchmarkModule {
  id: string;
  /** English label - prompt + i18n fallback. */
  label: string;
  /** English one-line description - prompt + i18n fallback. */
  desc: string;
  /** Enabled out of the box (the ten default modules). */
  default: boolean;
  /**
   * Needs extra context to score well: reference accounts (`accounts`) or
   * imported performance (`performance`). The deterministic fallback skips the
   * hard scoring and says so when that context is missing.
   */
  needs?: 'accounts' | 'performance';
}

// The full catalog: the ten defaults from the spec plus the wider category set,
// so the user can opt into deeper checks. "Overall content score" is not a
// module - it is the analysis's headline overallScore.
export const BENCHMARK_MODULES: BenchmarkModule[] = [
  { id: 'visual_clarity', label: 'Visual clarity', desc: 'Is the main message instantly readable at a glance and on a small screen?', default: true },
  { id: 'text_hierarchy', label: 'Text hierarchy', desc: 'Does one line clearly lead, with supporting text stepped below it?', default: false },
  { id: 'hook_strength', label: 'Hook strength', desc: 'Does the opening line stop the scroll in the first second?', default: false },
  { id: 'brand_consistency', label: 'Brand consistency', desc: 'Colours, fonts and tone match the brand identity.', default: true },
  { id: 'platform_fit', label: 'Platform suitability', desc: 'Length, format and ratio suit the intended platform.', default: true },
  { id: 'engagement_potential', label: 'Engagement potential', desc: 'Is there a reason to like, save, comment or share?', default: true },
  { id: 'accessibility', label: 'Accessibility', desc: 'Contrast, text size and alt text serve every reader.', default: true },
  { id: 'call_to_action', label: 'Call to action', desc: 'A clear, single next step for the viewer.', default: false },
  { id: 'readability', label: 'Readability', desc: 'Short, plain lines that are easy to read on a phone.', default: false },
  { id: 'format_optimisation', label: 'Format optimisation', desc: 'Still, carousel, reel or story matched to the message.', default: false },
  { id: 'emotional_impact', label: 'Emotional impact', desc: 'Does it make the viewer feel something worth acting on?', default: false },
  { id: 'shareability', label: 'Shareability', desc: 'Would someone send this to a friend or repost it?', default: false },
  { id: 'trend_alignment', label: 'Trend alignment', desc: 'Rides a current format or topic without chasing fads.', default: true },
  { id: 'caption_quality', label: 'Caption quality', desc: 'The caption earns the read and supports the graphic.', default: true },
  { id: 'hashtag_relevance', label: 'Hashtag relevance', desc: 'Tags are specific, on-topic and not spammy.', default: false },
  { id: 'timing_context', label: 'Timing and posting context', desc: 'Posted when the audience is most likely to see it.', default: false, needs: 'performance' },
  { id: 'audience_fit', label: 'Audience fit', desc: 'Speaks to the people this brand is actually for.', default: false },
  { id: 'template_effectiveness', label: 'Template effectiveness', desc: 'The chosen template flatters this content.', default: false },
  { id: 'animation_effectiveness', label: 'Animation effectiveness', desc: 'Motion adds clarity or delight, never distraction.', default: true },
  { id: 'aspirational_accounts', label: 'Aspirational accounts', desc: 'Measured against the patterns of accounts you admire.', default: true, needs: 'accounts' },
  { id: 'best_performing_posts', label: 'Best-performing posts', desc: 'Compared with what has worked for you before.', default: true, needs: 'performance' },
];

export const BENCHMARK_BY_ID: Record<string, BenchmarkModule> = Object.fromEntries(
  BENCHMARK_MODULES.map((m) => [m.id, m]),
);

/** The ten default-enabled module ids. */
export const DEFAULT_BENCHMARK_IDS: string[] = BENCHMARK_MODULES.filter((m) => m.default).map((m) => m.id);

/** Keep only ids that still exist in the catalog (forward-compatible). */
export function sanitiseBenchmarkIds(ids: string[]): string[] {
  const seen = new Set<string>();
  return ids.filter((id) => BENCHMARK_BY_ID[id] && !seen.has(id) && (seen.add(id), true));
}
