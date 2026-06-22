// ═══ Postio Coach: sample + deterministic data ═══
//
// No live social scraping exists, so reference-account "analysis" and
// performance insight have an offline path: sample data the user can load
// with one click, plus deterministic generators that work with no API key.
// Everything here is framed as "inspired by patterns from your reference
// accounts" - never "copy this account".

import type {
  AccountBenchmarkProfile,
  PerformanceEntry,
  PerformanceInsight,
  PostPerformanceMetrics,
  SocialPlatform,
} from '@engine/lib/model/types';

// ── sample reference accounts ───────────────────────────────────────────
export interface SampleAccount {
  platform: SocialPlatform;
  handle: string;
  displayName: string;
  notes: string;
}

export const SAMPLE_ACCOUNTS: SampleAccount[] = [
  { platform: 'instagram', handle: 'craftedstudio', displayName: 'Crafted Studio', notes: 'Calm, editorial carousels. One bold idea per slide, lots of white space.' },
  { platform: 'tiktok', handle: 'dailywelshword', displayName: 'Daily Welsh Word', notes: 'Fast hooks, captioned, friendly teacher tone, a single takeaway per clip.' },
  { platform: 'instagram', handle: 'localmakersmarket', displayName: 'Local Makers Market', notes: 'Warm community voice, behind-the-scenes reels, strong save-worthy tips.' },
];

// Deterministic profile so the offline path produces real, varied lessons.
export function sampleAccountProfile(accountId: string, platform: string, handle: string, notes?: string): AccountBenchmarkProfile {
  const warm = /market|maker|community|local/i.test(handle + (notes ?? ''));
  const fast = /tiktok|daily|word|clip/i.test(platform + handle);
  return {
    accountId,
    platform,
    commonFormats: fast ? ['Short captioned clips', 'Single-takeaway reels', 'Talking-head with text'] : ['Editorial carousels', 'Quote stills', 'Behind-the-scenes reels'],
    toneOfVoice: warm ? ['Warm', 'Encouraging', 'Plain-spoken'] : ['Confident', 'Editorial', 'Considered'],
    visualStyle: fast ? ['Big captions', 'High contrast', 'Minimal frame'] : ['Generous white space', 'One focal point', 'Restrained palette'],
    postingPatterns: ['Posts on a steady weekly rhythm', fast ? 'Leans into trends early' : 'Batches around themes'],
    recurringHooks: ['Opens with a number or a question', 'States the payoff before the detail', 'Names the audience directly'],
    captionPatterns: ['Hook on line one', 'One line of context', 'Ends with a question or CTA'],
    ctaPatterns: ['Save this', 'Send to a friend', 'Follow for more'],
    highPerformingThemes: warm ? ['Behind the scenes', 'Customer wins', 'Quick how-tos'] : ['Frameworks', 'Strong opinions', 'Before and after'],
    contentPillars: ['Teach', 'Show', 'Invite'],
    lessonsForUser: [
      'Lead every post with the payoff, then explain - it lifts the first-second stop rate.',
      fast ? 'Caption everything; most viewers watch on mute.' : 'Keep one idea per slide so the carousel is easy to follow.',
      'End with a single clear ask; one CTA converts better than several.',
    ],
  };
}

// ── sample performance ───────────────────────────────────────────────────
type SampleMetric = PostPerformanceMetrics & { label: string };

export const SAMPLE_PERFORMANCE: SampleMetric[] = [
  { label: 'Behind the scenes reel', platform: 'instagram', impressions: 18400, reach: 14200, likes: 1320, comments: 86, shares: 240, saves: 410, engagementRate: 0.14, postedAt: '2026-05-12T18:00:00Z' },
  { label: 'Quote carousel', platform: 'instagram', impressions: 9200, reach: 7600, likes: 540, comments: 22, shares: 60, saves: 320, engagementRate: 0.10, postedAt: '2026-05-19T08:00:00Z' },
  { label: 'Product still', platform: 'instagram', impressions: 6100, reach: 5200, likes: 210, comments: 6, shares: 12, saves: 38, engagementRate: 0.044, postedAt: '2026-05-26T12:00:00Z' },
  { label: 'How-to clip', platform: 'tiktok', impressions: 32100, reach: 28800, likes: 2600, comments: 140, shares: 520, saves: 980, completionRate: 0.41, engagementRate: 0.13, postedAt: '2026-06-02T19:00:00Z' },
];

// Deterministic insights from imported/sample performance (offline path).
export function localPerformanceInsights(entries: PerformanceEntry[]): PerformanceInsight[] {
  if (!entries.length) return [];
  const withEr = entries
    .map((e) => ({ e, er: engagementOf(e.metrics) }))
    .filter((x) => x.er !== null) as { e: PerformanceEntry; er: number }[];
  if (!withEr.length) {
    return [{
      insight: 'Performance numbers are imported but engagement rate cannot be computed.',
      evidence: 'No impressions/reach against likes/comments were found in the rows.',
      recommendation: 'Add impressions or reach plus likes for each post so the Coach can compare engagement; this unlocks topic and format learning.',
      confidence: 'low',
    }];
  }
  withEr.sort((a, b) => b.er - a.er);
  const best = withEr[0];
  const worst = withEr[withEr.length - 1];
  const insights: PerformanceInsight[] = [];

  insights.push({
    insight: `Your strongest post was "${best.e.label ?? 'a post'}" at ${(best.er * 100).toFixed(1)}% engagement.`,
    evidence: `It out-performed the lowest ("${worst.e.label ?? 'a post'}", ${(worst.er * 100).toFixed(1)}%) by ${Math.round((best.er / Math.max(worst.er, 0.001)) * 10) / 10}x.`,
    recommendation: 'Make more in the style of your top post (format, topic, hook); repeating a proven angle is the cheapest way to grow reach.',
    confidence: withEr.length >= 3 ? 'high' : 'medium',
  });

  const saves = entries.filter((e) => (e.metrics.saves ?? 0) > 0);
  if (saves.length) {
    const topSave = saves.sort((a, b) => (b.metrics.saves ?? 0) - (a.metrics.saves ?? 0))[0];
    insights.push({
      insight: `Saves cluster on useful content like "${topSave.label ?? 'your how-to post'}".`,
      evidence: `${topSave.metrics.saves} saves on that post versus far fewer on promotional stills.`,
      recommendation: 'Lead with save-worthy value (tips, how-tos, checklists); saves signal quality to the algorithm and extend reach for days.',
      confidence: 'medium',
    });
  }

  const tiktok = withEr.filter((x) => /tiktok/i.test(x.e.metrics.platform ?? ''));
  const insta = withEr.filter((x) => /instagram/i.test(x.e.metrics.platform ?? ''));
  if (tiktok.length && insta.length) {
    const tAvg = avg(tiktok.map((x) => x.er));
    const iAvg = avg(insta.map((x) => x.er));
    const better = tAvg > iAvg ? 'TikTok' : 'Instagram';
    insights.push({
      insight: `${better} is currently your stronger platform on engagement.`,
      evidence: `Average engagement: TikTok ${(tAvg * 100).toFixed(1)}% vs Instagram ${(iAvg * 100).toFixed(1)}%.`,
      recommendation: `Prioritise ${better} for reach-focused posts while testing repurposed versions on the other; doubling down on what works compounds growth.`,
      confidence: 'medium',
    });
  }
  return insights;
}

function engagementOf(m: PostPerformanceMetrics): number | null {
  if (typeof m.engagementRate === 'number') return m.engagementRate;
  const denom = m.reach ?? m.impressions;
  const inter = (m.likes ?? 0) + (m.comments ?? 0) + (m.shares ?? 0) + (m.saves ?? 0);
  if (!denom || denom <= 0) return null;
  return inter / denom;
}
const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

// ── CSV import (Meta / TikTok exports, or a simple manual CSV) ────────────
// Maps common export headers to our metric fields. Unknown columns are ignored.
const HEADER_MAP: Record<string, keyof PostPerformanceMetrics | 'label'> = {
  label: 'label', name: 'label', title: 'label', post: 'label', caption: 'label',
  platform: 'platform',
  impressions: 'impressions', views: 'impressions', plays: 'impressions',
  reach: 'reach', 'accounts reached': 'reach',
  likes: 'likes', reactions: 'likes',
  comments: 'comments',
  shares: 'shares',
  saves: 'saves', saved: 'saves', bookmarks: 'saves',
  clicks: 'clicks', 'link clicks': 'clicks',
  'watch time': 'watchTime', 'average watch time': 'watchTime',
  'completion rate': 'completionRate', 'completion': 'completionRate',
  'engagement rate': 'engagementRate', engagement: 'engagementRate',
  date: 'postedAt', 'posted at': 'postedAt', 'publish time': 'postedAt',
};

export interface ParsedPerformanceRow { label?: string; metrics: PostPerformanceMetrics }

export function parsePerformanceCsv(text: string): ParsedPerformanceRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const cols = splitCsv(lines[0]).map((c) => c.toLowerCase().trim());
  const rows: ParsedPerformanceRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsv(lines[i]);
    const metrics: PostPerformanceMetrics = {};
    let label: string | undefined;
    cols.forEach((col, idx) => {
      const key = HEADER_MAP[col];
      const raw = (cells[idx] ?? '').trim();
      if (!key || !raw) return;
      if (key === 'label') { label = raw; return; }
      if (key === 'platform' || key === 'postedAt') { (metrics[key] as string) = raw; return; }
      let n = parseFloat(raw.replace(/[,%]/g, ''));
      if (Number.isNaN(n)) return;
      if ((key === 'completionRate' || key === 'engagementRate') && n > 1) n = n / 100; // percent -> fraction
      (metrics[key] as number) = n;
    });
    if (label || Object.keys(metrics).length) rows.push({ label, metrics });
  }
  return rows;
}

function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (ch === ',' && !q) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}
