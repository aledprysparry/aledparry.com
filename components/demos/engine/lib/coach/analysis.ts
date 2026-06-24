// ═══ Postio Coach: analysis engine ═══
//
// Two ways to score a post:
//   1. callCoach(...) hits the gated /api/ai/social Coach tasks (real model).
//   2. localAnalysis(...) is a deterministic, offline fallback so the whole
//      feature works with no ANTHROPIC_API_KEY (local dev, demos, rate limits).
//
// Both return the same PostAnalysis shape. The deterministic path follows the
// same rule as the model: every observation states what it noticed, why it
// matters, what to change, and the expected benefit - never a bare "good/bad".

import type {
  Brand,
  GeneratedGraphic,
  AnalysisCategoryResult,
  ActionPlan,
  PostAnalysis,
  AIRecommendation,
  AIRecommendationType,
  AspirationalAccount,
  PerformanceEntry,
  Priority,
} from '@engine/lib/model/types';
import { BENCHMARK_BY_ID } from './benchmarks';
import { localPerformanceInsights } from './mock';

// ── post text extraction ──────────────────────────────────────────────
// A "post" is a GeneratedGraphic. Pull every editable line of text out of it,
// whichever editor produced it (freeform slides or kind inputs).
export function extractPostText(graphic: GeneratedGraphic): { lines: string[]; joined: string } {
  const lines: string[] = [];
  if (graphic.slides?.length) {
    for (const slide of graphic.slides) {
      for (const el of slide.elements) {
        if (el.type === 'text' && el.content?.trim()) lines.push(el.content.trim());
      }
    }
  }
  if (!lines.length && graphic.inputs) {
    const overrides = (graphic.inputs.copyOverrides as Record<string, string>) ?? {};
    for (const v of Object.values(overrides)) if (typeof v === 'string' && v.trim()) lines.push(v.trim());
    const raw = graphic.inputs.rawText;
    if (typeof raw === 'string' && raw.trim()) lines.push(...raw.split('\n').map((s) => s.trim()).filter(Boolean));
  }
  return { lines, joined: lines.join('\n') };
}

// ── feature detection (shared by the deterministic scorer) ─────────────
const CTA_WORDS = [
  'shop', 'buy', 'learn', 'sign up', 'book', 'download', 'join', 'follow',
  'comment', 'save', 'share', 'tap', 'click', 'discover', 'register', 'get',
  // Welsh
  'dysgwch', 'cofrestrwch', 'archebwch', 'dilynwch', 'rhannwch', 'prynwch',
  'ymunwch', 'lawrlwythwch', 'darganfyddwch',
];
// Whole-word match so 'get'/'learn' don't fire on 'getting'/'learning' (Codex
// #96). All CTA words are ASCII, so \b is safe (no `u` flag needed). Built once.
const CTA_RE = new RegExp(`\\b(${CTA_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'i');
// Emoji: BMP symbol ranges + any astral (surrogate-pair) char. Avoids the `u`
// flag so tsc is happy under the default target.
const EMOJI_RE = /[←-⇿⌀-➿⬀-⯿]|[\uD800-\uDBFF][\uDC00-\uDFFF]/;
// Hashtag: latin + accented letters (covers Welsh ŵ ŷ â ê î ô û), digits, _.
const HASHTAG_RE = /#[A-Za-z0-9_À-ɏḀ-ỿ]+/;

export interface PostFeatures {
  lines: string[];
  joined: string;
  words: number;
  lineCount: number;
  longestLine: number;
  hasCTA: boolean;
  hasQuestion: boolean;
  hasEmoji: boolean;
  hasHashtag: boolean;
  isWelsh: boolean;
  brandColours: number;
  brandFonts: number;
  hasReferenceAccounts: boolean;
  hasPerformance: boolean;
  platform: string;
}

const WELSH_HINTS = [' yn ', ' y ', ' a ', ' ein ', ' eich ', ' wedi ', ' am ', 'dd', 'll', 'ŵ', ' â'];

export function postFeatures(
  text: { lines: string[]; joined: string },
  brand: Brand | undefined,
  platform: string,
  ctx: { hasReferenceAccounts: boolean; hasPerformance: boolean },
): PostFeatures {
  const joined = text.joined;
  const low = ` ${joined.toLowerCase()} `;
  return {
    lines: text.lines,
    joined,
    words: joined.split(/\s+/).filter(Boolean).length,
    lineCount: text.lines.length,
    longestLine: text.lines.reduce((m, l) => Math.max(m, l.length), 0),
    hasCTA: CTA_RE.test(joined),
    hasQuestion: joined.includes('?'),
    hasEmoji: EMOJI_RE.test(joined),
    hasHashtag: HASHTAG_RE.test(joined),
    isWelsh: WELSH_HINTS.filter((h) => low.includes(h)).length >= 2,
    brandColours: brand?.colours.length ?? 0,
    brandFonts: brand?.fonts.length ?? 0,
    hasReferenceAccounts: ctx.hasReferenceAccounts,
    hasPerformance: ctx.hasPerformance,
    platform,
  };
}

// Stable per-post pseudo-variance so two different posts don't score identically
// while the same post always scores the same (deterministic, no Math.random).
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
const clamp = (n: number) => Math.max(28, Math.min(98, Math.round(n)));
const priorityFor = (score: number): Priority => (score < 55 ? 'high' : score < 75 ? 'medium' : 'low');

type ModuleScore = { score: number; summary: string; issue?: string; recommendation: string };

// One generator per module: deterministic score + the four-part observation.
// Kept terse but specific; the AI path replaces this with model output.
function scoreModule(id: string, f: PostFeatures): ModuleScore {
  const jitter = (hash(id + f.joined) % 13) - 6; // -6..+6, stable per post+module
  const base = (n: number): number => clamp(n + jitter);
  switch (id) {
    case 'visual_clarity': {
      const tooMuch = f.lineCount > 6 || f.longestLine > 60;
      const score = base(tooMuch ? 58 : 82);
      return { score, summary: tooMuch ? 'Several competing lines fight for attention.' : 'One clear message reads at a glance.',
        issue: tooMuch ? 'Too many text blocks reduce the at-a-glance read.' : undefined,
        recommendation: tooMuch ? 'Cut to one headline plus one supporting line; a single focal point is read in the first second of the scroll, lifting stop-rate.' : 'Keep the single focal point; it is already easy to parse on a small screen.' };
    }
    case 'text_hierarchy': {
      const flat = f.lineCount > 1 && f.longestLine < 18;
      const score = base(f.lineCount <= 1 ? 70 : flat ? 60 : 80);
      return { score, summary: f.lineCount <= 1 ? 'A single line gives little to lead with.' : 'Lines step from a lead to support.',
        issue: flat ? 'Lines are similar in length, so nothing leads.' : undefined,
        recommendation: 'Make the strongest phrase the largest line and step the rest down in size; a clear lead guides the eye and raises comprehension.' };
    }
    case 'hook_strength': {
      const first = f.lines[0] ?? '';
      const weak = first.length > 45 || (!f.hasQuestion && !/\d/.test(first) && first.length > 0 && first.length < 6);
      const score = base(first ? (weak ? 56 : 80) : 50);
      return { score, summary: first ? 'The opening line sets the tone.' : 'There is no opening hook.',
        issue: !first ? 'No first line to stop the scroll.' : weak ? 'The opening is long or generic.' : undefined,
        recommendation: 'Open with a short, specific or surprising line (a number, a question, a bold claim); the first second decides whether the scroll stops.' };
    }
    case 'brand_consistency': {
      const ok = f.brandColours >= 2 && f.brandFonts >= 1;
      const score = base(ok ? 84 : 62);
      return { score, summary: ok ? 'Colours and fonts are defined for the brand.' : 'Brand colours or fonts are thin.',
        issue: ok ? undefined : 'Few brand colours or fonts are set, so output drifts off-brand.',
        recommendation: ok ? 'Keep applying the brand palette and type so every post is recognisably yours, which builds trust over time.' : 'Add at least two brand colours and a heading font in the Brand tab; consistent identity makes a feed instantly recognisable.' };
    }
    case 'platform_fit': {
      const isShort = /tiktok|story|reel/i.test(f.platform);
      const longCaption = f.words > (isShort ? 25 : 60);
      const score = base(longCaption ? 60 : 82);
      return { score, summary: `Tuned for ${f.platform}.`,
        issue: longCaption ? `Copy runs long for ${f.platform}.` : undefined,
        recommendation: longCaption ? `Trim the copy for ${f.platform}, where shorter beats win attention; move detail to the caption or later slides.` : `Length and format suit ${f.platform}; keep it tight.` };
    }
    case 'engagement_potential': {
      const reasons = (f.hasQuestion ? 1 : 0) + (f.hasCTA ? 1 : 0) + (f.hasEmoji ? 1 : 0);
      const score = base(50 + reasons * 12);
      return { score, summary: reasons >= 2 ? 'There are clear reasons to react.' : 'Little prompts a reaction.',
        issue: reasons < 2 ? 'No question, CTA or hook to pull a response.' : undefined,
        recommendation: 'Add one explicit prompt (a question, a "save this", a poll); giving a reason to act reliably lifts comments and saves.' };
    }
    case 'accessibility': {
      const score = base(f.longestLine > 50 ? 58 : 78);
      return { score, summary: 'Legibility and inclusion check.',
        issue: f.longestLine > 50 ? 'Long lines and dense text hurt low-vision readers.' : undefined,
        recommendation: 'Keep text large, lines short, and contrast strong, and add alt text on export; this serves screen readers and small phones alike.' };
    }
    case 'call_to_action': {
      const score = base(f.hasCTA ? 82 : 52);
      return { score, summary: f.hasCTA ? 'A next step is present.' : 'No clear next step.',
        issue: f.hasCTA ? undefined : 'The viewer is not told what to do next.',
        recommendation: f.hasCTA ? 'Keep the single CTA; one clear ask converts better than several.' : 'Add one specific CTA (e.g. "Save for later" or "Book now"); a single clear ask turns attention into action.' };
    }
    case 'readability': {
      const score = base(f.longestLine > 42 ? 60 : 82);
      return { score, summary: 'Reading ease on a phone.',
        issue: f.longestLine > 42 ? 'Some lines are long for mobile.' : undefined,
        recommendation: 'Keep lines under ~40 characters and prefer plain words; easy reading keeps viewers on the post longer.' };
    }
    case 'format_optimisation': {
      const score = base(f.lineCount > 5 ? 64 : 80);
      return { score, summary: 'Format suits the content depth.',
        issue: f.lineCount > 5 ? 'A lot of points sit on one still.' : undefined,
        recommendation: f.lineCount > 5 ? 'Split the points across a carousel; one idea per slide is easier to follow and increases swipe-through.' : 'The single-frame format fits this short message.' };
    }
    case 'emotional_impact': {
      const score = base(f.hasEmoji || f.hasQuestion ? 74 : 62);
      return { score, summary: 'Emotional pull.',
        issue: score < 70 ? 'The message is informational more than felt.' : undefined,
        recommendation: 'Lead with the benefit or feeling, not the feature; emotion is what makes a post memorable and shareable.' };
    }
    case 'shareability': {
      const score = base((f.hasQuestion ? 8 : 0) + (f.hasCTA ? 6 : 0) + 64);
      return { score, summary: 'Reason to pass it on.',
        issue: score < 70 ? 'Nothing obvious makes this worth resharing.' : undefined,
        recommendation: 'Make it useful, funny or relatable enough to send to one specific person; "send to a friend" drives the cheapest reach there is.' };
    }
    case 'trend_alignment': {
      const score = base(70);
      return { score, summary: 'Topical relevance.',
        recommendation: 'Tie the post to a current format or seasonal moment where it fits the brand; timely posts ride existing attention without chasing fads.' };
    }
    case 'caption_quality': {
      const score = base(f.words < 4 ? 58 : 78);
      return { score, summary: f.words < 4 ? 'The caption is very short.' : 'The caption supports the graphic.',
        issue: f.words < 4 ? 'Little caption text to earn the read.' : undefined,
        recommendation: 'Open the caption with the hook, add one line of context, and end with a question or CTA; the caption is where saves and comments are won.' };
    }
    case 'hashtag_relevance': {
      const score = base(f.hasHashtag ? 74 : 60);
      return { score, summary: f.hasHashtag ? 'Hashtags are present.' : 'No hashtags found.',
        issue: f.hasHashtag ? undefined : 'Missing tags limit discovery.',
        recommendation: 'Use 5-10 specific, on-topic tags (mix niche and broad); precise tags reach the right audience without looking spammy.' };
    }
    case 'timing_context': {
      const score = base(f.hasPerformance ? 72 : 60);
      return { score, summary: f.hasPerformance ? 'Timing judged against your history.' : 'No timing data yet.',
        issue: f.hasPerformance ? undefined : 'Import performance to judge posting time.',
        recommendation: f.hasPerformance ? 'Post when your past data shows your audience is most active; right-time posting lifts early reach, which the algorithm rewards.' : 'Import a few posts under Performance to unlock timing advice based on your own audience.' };
    }
    case 'audience_fit': {
      const score = base(70);
      return { score, summary: 'Speaks to the brand audience.',
        recommendation: 'Name the audience and their problem in the copy; speaking directly to "you" makes the right people feel it is for them.' };
    }
    case 'template_effectiveness': {
      const score = base(76);
      return { score, summary: 'The template flatters the content.',
        recommendation: 'Pick a template whose emphasis matches the message (quote, list, stat); the right structure carries the content with less effort.' };
    }
    case 'animation_effectiveness': {
      const score = base(74);
      return { score, summary: 'Motion supports the message.',
        recommendation: 'Use motion only to reveal hierarchy (headline first, then support); purposeful motion adds polish, while constant movement distracts.' };
    }
    case 'aspirational_accounts': {
      const score = base(f.hasReferenceAccounts ? 72 : 55);
      return { score, summary: f.hasReferenceAccounts ? 'Measured against accounts you admire.' : 'No reference accounts added.',
        issue: f.hasReferenceAccounts ? undefined : 'Add reference accounts to benchmark against.',
        recommendation: f.hasReferenceAccounts ? 'Borrow the structure and pacing of your reference accounts (never the content); adapting proven patterns shortens the path to what works.' : 'Add a few accounts you admire under Reference accounts; the Coach will extract patterns to learn from.' };
    }
    case 'best_performing_posts': {
      const score = base(f.hasPerformance ? 73 : 55);
      return { score, summary: f.hasPerformance ? 'Compared with your winners.' : 'No performance data yet.',
        issue: f.hasPerformance ? undefined : 'Import performance to compare with past wins.',
        recommendation: f.hasPerformance ? 'Lean into the topics and formats that already perform for you; repeating proven angles beats starting from scratch.' : 'Import past results under Performance so the Coach can compare new posts with what already works for you.' };
    }
    default: {
      const score = base(70);
      return { score, summary: 'Checked.', recommendation: 'Review this dimension against your goal for the post.' };
    }
  }
}

// Build a full deterministic analysis (no AI). modelUsed = "deterministic".
export function localAnalysis(
  graphic: GeneratedGraphic,
  brand: Brand | undefined,
  platform: string,
  enabledIds: string[],
  ctx: { hasReferenceAccounts: boolean; hasPerformance: boolean },
): Omit<PostAnalysis, 'id' | 'createdAt'> {
  return localAnalysisFromText(extractPostText(graphic), brand, platform, enabledIds, ctx, {
    postId: graphic.id, brandId: graphic.brandId,
  });
}

// Same, but from already-extracted text (used by the in-editor Analyse, which
// has live unsaved text rather than a stored graphic).
export function localAnalysisFromText(
  text: { lines: string[]; joined: string },
  brand: Brand | undefined,
  platform: string,
  enabledIds: string[],
  ctx: { hasReferenceAccounts: boolean; hasPerformance: boolean },
  ids: { postId: string; brandId: string },
): Omit<PostAnalysis, 'id' | 'createdAt'> {
  const f = postFeatures(text, brand, platform, ctx);
  const results: AnalysisCategoryResult[] = enabledIds
    .filter((id) => BENCHMARK_BY_ID[id])
    .map((id) => {
      const m = scoreModule(id, f);
      return {
        id, label: BENCHMARK_BY_ID[id].label, enabled: true,
        score: m.score, summary: m.summary, issue: m.issue,
        recommendation: m.recommendation, priority: priorityFor(m.score),
      };
    });
  const overallScore = results.length
    ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length)
    : 0;

  const sorted = [...results].sort((a, b) => b.score - a.score);
  const strengths = sorted.slice(0, 3).filter((r) => r.score >= 65).map((r) => `${r.label}: ${r.summary}`);
  const issues = [...results].sort((a, b) => a.score - b.score).slice(0, 3)
    .filter((r) => r.issue).map((r) => `${r.label}: ${r.issue}`);

  const lowest = [...results].sort((a, b) => a.score - b.score);
  const actionPlan: ActionPlan = {
    quickWins: lowest.slice(0, 3).map((r) => r.recommendation),
    recommendedEdits: lowest.slice(0, 4).filter((r) => r.priority !== 'low').map((r) => `${r.label}: ${r.recommendation}`),
    experimentalIdeas: [
      'Test a bolder first line against the current hook and keep whichever holds attention longer.',
      f.hasReferenceAccounts ? 'Adapt the pacing of one reference account to this post and compare saves.' : 'Try a carousel version that opens with the payoff, then explains.',
    ],
    risks: [
      overallScore < 55 ? 'Posting as-is risks low reach; address the high-priority items first.' : 'No major risks; ship after the quick wins.',
      f.isWelsh ? 'Welsh copy: have a native speaker confirm mutations and tone before publishing.' : 'Proof the copy once more for tone and typos before export.',
    ],
  };

  const platformNotes = buildPlatformNote(platform, f);

  return {
    postId: ids.postId, brandId: ids.brandId, overallScore,
    benchmarkResults: results, actionPlan, strengths, issues, platformNotes,
    modelUsed: 'deterministic',
  };
}

function buildPlatformNote(platform: string, f: PostFeatures): string {
  if (/tiktok/i.test(platform)) return 'TikTok: hook in the first second, keep on-screen text minimal, 3-5 tags, casual tone.';
  if (/story/i.test(platform)) return 'Story: keep the key message inside the safe area, one idea per frame, add an interactive sticker.';
  if (/linkedin/i.test(platform)) return 'LinkedIn: lead with the insight, professional tone, 0-3 tags, no emoji spam.';
  if (/carousel/i.test(platform)) return 'Carousel: one idea per slide, a strong cover, and a final slide with the CTA.';
  return `Instagram: warm hook, 1-2 emoji, 8-12 specific tags, a save-worthy payoff. (${f.words} words)`;
}

// Derive applyable recommendation drafts from an analysis + the post text.
export function deriveRecommendations(
  analysis: Omit<PostAnalysis, 'id' | 'createdAt'>,
  text: { lines: string[] },
): Omit<AIRecommendation, 'id' | 'createdAt' | 'applied'>[] {
  const recs: Omit<AIRecommendation, 'id' | 'createdAt' | 'applied'>[] = [];
  const byId = Object.fromEntries(analysis.benchmarkResults.map((r) => [r.id, r]));
  // These drafts are instructional guidance ("Open with a short..."), not real
  // values to write onto the canvas, so they're never applyable - Apply must not
  // paste this text into the post (Codex #96). The AI path produces applyable recs.
  const push = (type: AIRecommendation['type'], suggestedValue: string, reason: string, priority: Priority, originalValue?: string) =>
    recs.push({ postId: analysis.postId, brandId: analysis.brandId, type, suggestedValue, reason, priority, originalValue, applyable: false });

  if (byId.hook_strength && byId.hook_strength.score < 75)
    push('headline', 'Open with a short, specific line (a number, a question, or a bold claim).', byId.hook_strength.recommendation, byId.hook_strength.priority, text.lines[0]);
  if (byId.call_to_action && byId.call_to_action.score < 75)
    push('cta', 'Add one clear CTA, e.g. "Save this for later" or "Book your place".', byId.call_to_action.recommendation, byId.call_to_action.priority);
  if (byId.caption_quality && byId.caption_quality.score < 75)
    push('caption', 'Open the caption with the hook, add one line of context, end with a question.', byId.caption_quality.recommendation, byId.caption_quality.priority);
  if (byId.accessibility && byId.accessibility.score < 75)
    push('accessibility', 'Increase text size and contrast, and add alt text on export.', byId.accessibility.recommendation, byId.accessibility.priority);
  if (byId.animation_effectiveness && byId.animation_effectiveness.score < 70)
    push('animation', 'Use motion only to reveal hierarchy (headline first, then support).', byId.animation_effectiveness.recommendation, byId.animation_effectiveness.priority);
  if (byId.platform_fit && byId.platform_fit.score < 75)
    push('platform', 'Trim the copy and confirm the aspect ratio for the target platform.', byId.platform_fit.recommendation, byId.platform_fit.priority);
  if (byId.timing_context)
    push('timing', 'Post when your audience is most active (see Performance).', byId.timing_context.recommendation, 'low');
  return recs;
}

// ── AI client ──────────────────────────────────────────────────────────
export type CoachTask = 'coach-analyse' | 'coach-account' | 'coach-performance' | 'coach-strategy' | 'coach-voice';

// ── cost guardrail ──────────────────────────────────────────────────────
// Every coach call hits a paid model, so cap calls per day and cache identical
// inputs in-session. Both keep the deterministic fallback as the safety net:
// over-cap / cached-miss simply route to offline scoring, never a silent bill.
const COACH_DAILY_CAP = 80;
const USAGE_KEY = 'cg.v1.coachUsage';
const cache = new Map<string, unknown>();

export function coachUsage(): { date: string; count: number; cap: number; remaining: number } {
  const today = new Date().toISOString().slice(0, 10);
  let count = 0;
  if (typeof localStorage !== 'undefined') {
    try { const r = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}'); if (r.date === today) count = r.count || 0; } catch { /* ignore */ }
  }
  return { date: today, count, cap: COACH_DAILY_CAP, remaining: Math.max(0, COACH_DAILY_CAP - count) };
}
function bumpUsage(): void {
  if (typeof localStorage === 'undefined') return;
  const { date, count } = coachUsage();
  try { localStorage.setItem(USAGE_KEY, JSON.stringify({ date, count: count + 1 })); } catch { /* ignore */ }
}

export async function callCoach<T>(task: CoachTask, payload: Record<string, unknown>): Promise<{ result?: T; error?: string }> {
  const key = `${task}:${JSON.stringify(payload)}`;
  if (cache.has(key)) return { result: cache.get(key) as T };
  if (coachUsage().remaining <= 0) return { error: 'rate_limited' };
  try {
    const res = await fetch('/api/ai/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, ...payload }),
    });
    if (res.status === 503) return { error: 'not_configured' };
    if (res.status === 401) return { error: 'unauthorized' };
    if (res.status === 429) return { error: 'rate_limited' };
    const data = await res.json();
    if (!res.ok) return { error: data.error || 'error' };
    bumpUsage();
    cache.set(key, data.result);
    return { result: data.result as T };
  } catch {
    return { error: 'network' };
  }
}

// ── unified runner: AI first, deterministic fallback ────────────────────
// Shared by the Coach Analyse panel and the in-editor Analyse button so both
// behave identically. Always returns a usable analysis; `usedAI` tells the UI
// whether the model answered or the offline path filled in.

interface RawAiAnalysis {
  overallScore?: number;
  results?: { id?: string; score?: number; summary?: string; issue?: string; recommendation?: string; priority?: string }[];
  strengths?: string[];
  issues?: string[];
  actionPlan?: Partial<ActionPlan>;
  platformNotes?: string;
  recommendations?: { type?: string; originalValue?: string; suggestedValue?: string; reason?: string; priority?: string }[];
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];
const asPriority = (p: unknown): Priority => (PRIORITIES.includes(p as Priority) ? (p as Priority) : 'medium');
const REC_TYPES: AIRecommendationType[] = ['headline', 'caption', 'cta', 'visual', 'animation', 'platform', 'accessibility', 'timing'];
const asRecType = (t: unknown): AIRecommendationType => (REC_TYPES.includes(t as AIRecommendationType) ? (t as AIRecommendationType) : 'caption');
const num = (n: unknown, d = 0): number => (typeof n === 'number' && !Number.isNaN(n) ? Math.max(0, Math.min(100, Math.round(n))) : d);

/** Lessons drawn from enabled reference accounts (for the AI prompt + scoring). */
export function referenceLessonsFrom(accounts: AspirationalAccount[]): string[] {
  return accounts
    .filter((a) => a.enabled && a.profile)
    .flatMap((a) => (a.profile?.lessonsForUser ?? []).map((l) => `${a.displayName || a.handle}: ${l}`));
}

/** A short text summary of performance, for the AI prompt. */
export function performanceSummaryFrom(entries: PerformanceEntry[]): string {
  const insights = localPerformanceInsights(entries);
  return insights.map((i) => `${i.insight} (${i.evidence})`).join(' ');
}

export interface RunAnalysisParams {
  text: { lines: string[]; joined: string };
  brand: Brand | undefined;
  platformName: string;
  enabledIds: string[];
  referenceAccounts: AspirationalAccount[];
  performanceEntries: PerformanceEntry[];
  ids: { postId: string; brandId: string };
  templateName?: string;
  /** A rendered JPEG/PNG data URL of the post, for vision-based scoring. */
  image?: string;
  /** The brand's learned voice summary. */
  voice?: string;
}

export interface RunAnalysisResult {
  analysis: Omit<PostAnalysis, 'id' | 'createdAt'>;
  recommendations: Omit<AIRecommendation, 'id' | 'createdAt' | 'applied'>[];
  usedAI: boolean;
  note?: 'not_configured' | 'unauthorized' | 'error';
}

export async function runPostAnalysis(p: RunAnalysisParams): Promise<RunAnalysisResult> {
  const ctx = {
    hasReferenceAccounts: p.referenceAccounts.some((a) => a.enabled),
    hasPerformance: p.performanceEntries.length > 0,
  };
  const enabled = p.enabledIds.filter((id) => BENCHMARK_BY_ID[id]);
  const benchmarks = enabled.map((id) => ({ id, label: BENCHMARK_BY_ID[id].label, desc: BENCHMARK_BY_ID[id].desc }));

  const { result, error } = await callCoach<RawAiAnalysis>('coach-analyse', {
    brand: p.brand ? { name: p.brand.name, toneNotes: p.brand.toneNotes, colours: p.brand.colours, fonts: p.brand.fonts } : undefined,
    platform: p.platformName,
    texts: p.text.lines,
    benchmarks,
    referenceLessons: referenceLessonsFrom(p.referenceAccounts),
    performanceSummary: performanceSummaryFrom(p.performanceEntries),
    templateName: p.templateName,
    images: p.image ? [p.image] : undefined,
    voice: p.voice,
  });

  if (result && Array.isArray(result.results) && result.results.length) {
    const analysis = normaliseAiAnalysis(result, enabled, p.ids);
    const recs = (result.recommendations ?? [])
      .filter((r) => r && r.suggestedValue)
      .map((r) => ({
        postId: p.ids.postId, brandId: p.ids.brandId,
        type: asRecType(r.type), originalValue: r.originalValue,
        suggestedValue: String(r.suggestedValue), reason: r.reason ? String(r.reason) : '',
        priority: asPriority(r.priority),
      })) as Omit<AIRecommendation, 'id' | 'createdAt' | 'applied'>[];
    return { analysis, recommendations: recs.length ? recs : deriveRecommendations(analysis, p.text), usedAI: true };
  }

  // Fallback: deterministic, offline.
  const analysis = localAnalysisFromText(p.text, p.brand, p.platformName, enabled, ctx, p.ids);
  const note = error === 'not_configured' || error === 'unauthorized' ? error : error ? 'error' : undefined;
  return { analysis, recommendations: deriveRecommendations(analysis, p.text), usedAI: false, note };
}

function normaliseAiAnalysis(
  raw: RawAiAnalysis,
  enabled: string[],
  ids: { postId: string; brandId: string },
): Omit<PostAnalysis, 'id' | 'createdAt'> {
  const byId = new Map((raw.results ?? []).filter((r) => r && r.id).map((r) => [r.id as string, r]));
  const results: AnalysisCategoryResult[] = enabled.map((id) => {
    const r = byId.get(id);
    const mod = BENCHMARK_BY_ID[id];
    const score = num(r?.score, 70);
    return {
      id, label: mod.label, enabled: true, score,
      summary: r?.summary ? String(r.summary) : mod.desc,
      issue: r?.issue ? String(r.issue) : undefined,
      recommendation: r?.recommendation ? String(r.recommendation) : mod.desc,
      priority: r?.priority ? asPriority(r.priority) : priorityFor(score),
    };
  });
  const overallScore = num(raw.overallScore, results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0);
  const ap = raw.actionPlan ?? {};
  return {
    postId: ids.postId, brandId: ids.brandId, overallScore,
    benchmarkResults: results,
    actionPlan: {
      quickWins: arr(ap.quickWins), recommendedEdits: arr(ap.recommendedEdits),
      experimentalIdeas: arr(ap.experimentalIdeas), risks: arr(ap.risks),
    },
    strengths: arr(raw.strengths).slice(0, 3),
    issues: arr(raw.issues).slice(0, 3),
    platformNotes: raw.platformNotes ? String(raw.platformNotes) : undefined,
    modelUsed: 'claude',
  };
}

const arr = (x: unknown): string[] => (Array.isArray(x) ? x.filter((v) => typeof v === 'string') : []);
