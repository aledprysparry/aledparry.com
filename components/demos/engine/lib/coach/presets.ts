// ═══ Postio Coach: built-in benchmark presets ═══
//
// A preset is a named set of enabled benchmark ids. Built-ins ship with the
// app (cannot be deleted); users save their own per brand. Names localise via
// `coach.preset.<id>` in strings.ts; the `name` here is the English fallback.

import type { BenchmarkPreset } from '@engine/lib/model/types';
import { DEFAULT_BENCHMARK_IDS } from './benchmarks';

export interface BuiltInPreset extends BenchmarkPreset {
  id: string;
  builtIn: true;
}

export const BUILTIN_PRESETS: BuiltInPreset[] = [
  {
    id: 'preset_default', name: 'Recommended', builtIn: true,
    enabledBenchmarkIds: DEFAULT_BENCHMARK_IDS,
  },
  {
    id: 'preset_engagement', name: 'Engagement focus', builtIn: true,
    enabledBenchmarkIds: ['hook_strength', 'engagement_potential', 'shareability', 'emotional_impact', 'caption_quality', 'call_to_action'],
  },
  {
    id: 'preset_brand_safety', name: 'Brand safety', builtIn: true,
    enabledBenchmarkIds: ['brand_consistency', 'visual_clarity', 'accessibility', 'audience_fit', 'readability'],
  },
  {
    id: 'preset_premium_client', name: 'Premium client review', builtIn: true,
    enabledBenchmarkIds: ['visual_clarity', 'text_hierarchy', 'brand_consistency', 'accessibility', 'caption_quality', 'platform_fit', 'template_effectiveness', 'animation_effectiveness', 'aspirational_accounts'],
  },
  {
    id: 'preset_tiktok_growth', name: 'TikTok growth', builtIn: true,
    enabledBenchmarkIds: ['hook_strength', 'trend_alignment', 'platform_fit', 'shareability', 'animation_effectiveness', 'caption_quality'],
  },
  {
    id: 'preset_welsh_campaign', name: 'Welsh language campaign', builtIn: true,
    enabledBenchmarkIds: ['caption_quality', 'readability', 'audience_fit', 'brand_consistency', 'visual_clarity', 'accessibility'],
  },
  {
    id: 'preset_accessibility', name: 'Accessibility check', builtIn: true,
    enabledBenchmarkIds: ['accessibility', 'visual_clarity', 'readability', 'text_hierarchy'],
  },
  {
    id: 'preset_before_export', name: 'Before export check', builtIn: true,
    enabledBenchmarkIds: ['visual_clarity', 'text_hierarchy', 'brand_consistency', 'platform_fit', 'accessibility', 'call_to_action'],
  },
];

export const BUILTIN_PRESET_IDS = BUILTIN_PRESETS.map((p) => p.id);
