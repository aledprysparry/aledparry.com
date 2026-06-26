// ═══ Creative learning: profile rendering + trigger logic ═══
// The bridge between the raw approval-signal log and the generator. It turns a
// learned CreativeProfile into an injection-ready prompt block (parallel to the
// Coach voiceSummary), decides WHEN there is enough new feedback to re-learn,
// and packs the signals into the compact shape the `creative-learn` task reads.
//
// Pure + dependency-light so it can run client-side (the orchestrator triggers
// learning) and be unit-reasoned about without a network.

import type { ApprovalSignal, CreativeProfile } from '@engine/lib/voiceai/types';

// Re-learn once this many NEW decisions have landed since the last profile, so
// the brand's rubric keeps pace with feedback without an AI call per approval.
export const LEARN_THRESHOLD = 5;
// Do not even try to learn from fewer than this many total decisions - too thin
// to generalise, and it would just overfit the first few posts.
export const MIN_SIGNALS_TO_LEARN = 4;

// Render a profile into the system-prompt block the generator is conditioned on.
// Returns '' when there is nothing learned yet, so callers can append blindly.
export function creativeProfileSummary(profile: CreativeProfile | undefined): string {
  if (!profile) return '';
  const lines: string[] = [];
  lines.push(`What this brand's audience and approver have rewarded over ${profile.sampleSize} past drafts (learned from ${profile.basis === 'both' ? 'human decisions and real engagement' : profile.basis === 'performance' ? 'real engagement' : 'human approve/edit/reject decisions'}). Lean into this:`);
  if (profile.summary) lines.push(profile.summary);
  if (profile.winningAngles.length) lines.push(`Angles that win here: ${profile.winningAngles.join(', ')}.`);
  if (profile.losingAngles.length) lines.push(`Angles that fall flat here: ${profile.losingAngles.join(', ')}. Avoid or sharpen them.`);
  if (profile.keptHooks.length) lines.push(`Hook patterns the approver keeps as-is: ${profile.keptHooks.map((h) => `"${h}"`).join('; ')}.`);
  if (profile.rewrittenHooks.length) lines.push(`Hook patterns the approver rewrites or kills (do not repeat): ${profile.rewrittenHooks.map((h) => `"${h}"`).join('; ')}.`);
  if (profile.audienceInsights.length) lines.push(`What the real audience responded to: ${profile.audienceInsights.join('; ')}.`);
  if (profile.scoreCalibration.length) {
    const cal = profile.scoreCalibration.map((c) => `${c.dimension}: ${c.note}`).join('; ');
    lines.push(`Score calibration (you have historically drifted from human reality here, so score these stricter): ${cal}.`);
  }
  return lines.join('\n');
}

// Is there enough fresh feedback to re-learn this brand's profile?
export function shouldLearn(signals: ApprovalSignal[], profile: CreativeProfile | undefined): boolean {
  const total = signals.length;
  if (total < MIN_SIGNALS_TO_LEARN) return false;
  const since = total - (profile?.sampleSize ?? 0);
  return since >= LEARN_THRESHOLD || !profile;
}

// The compact, model-friendly view of one signal: decision + the creative
// verdict + the hook the human kept vs shipped + any real engagement. We send
// the hook field (title) before/after rather than every field, to keep the
// learn call cheap while preserving the highest-value diff.
export interface LearnRow {
  decision: ApprovalSignal['decision'];
  angle?: string;
  scores?: Record<string, number>;
  draftHook?: string;
  finalHook?: string;
  platform?: string;
  language?: string;
  engagement?: string;
}

function hookOf(copy: Record<string, string> | undefined): string | undefined {
  if (!copy) return undefined;
  return copy.title || copy.headline || copy.kicker || undefined;
}

// Pack a brand's signals into LearnRows, newest first, capped so the distil call
// stays bounded. Drops nothing meaningful: a signal with neither a creative
// verdict nor a copy diff still carries its decision + angle.
export function packLearnRows(signals: ApprovalSignal[], limit = 60): LearnRow[] {
  return signals.slice(0, limit).map((s) => ({
    decision: s.decision,
    angle: s.creative?.angle || undefined,
    scores: s.creative?.scores as Record<string, number> | undefined,
    draftHook: hookOf(s.draftCopy),
    finalHook: hookOf(s.finalCopy),
    platform: s.platform,
    language: s.language,
    engagement: s.engagement?.summary
      || (s.engagement?.metrics ? Object.entries(s.engagement.metrics).map(([k, v]) => `${k}:${v}`).join(' ') : undefined),
  }));
}

// Does the signal set carry any real engagement? Decides the profile's `basis`.
export function hasPerformance(signals: ApprovalSignal[]): boolean {
  return signals.some((s) => s.engagement && (s.engagement.summary || (s.engagement.metrics && Object.keys(s.engagement.metrics).length > 0)));
}
