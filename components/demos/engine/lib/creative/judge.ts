// ═══ Postio creative-judgement loop ═══
// The reusable engine that makes the generator a SOCIAL PRODUCER FIRST: it
// drafts a post hook-first, asks the model to self-score it on the five
// creative dimensions, and AUTO-REVISES the concept until every score clears
// the pass threshold (or the revision budget runs out, when it hands back its
// best attempt with an honest scorecard so the UI can flag it).
//
// This is framework-agnostic on purpose: it takes a `complete()` closure (the
// caller wires it to the gated Anthropic proxy with the right model + key) and
// two prompt builders. The gated AI route uses it for intent-plan and autofill;
// any future generator can reuse the exact same loop. See ./guide.ts for the
// system prompt + the scoring spec.

import {
  CREATIVE_SYSTEM, MAX_REVISIONS, normaliseScores, weakDimensions, allPass,
  minScore, SCORE_LABELS, SCORE_RUBRIC, type CreativeScores, type ScoreKey,
} from './guide';

// A single Anthropic round-trip, already parsed from JSON. Returns null when the
// model produced nothing parseable (the loop treats that as a failed attempt).
export type CompleteFn = (opts: { system: string; user: string; maxTokens: number }) => Promise<Record<string, unknown> | null>;

export interface JudgeConfig {
  complete: CompleteFn;
  // The user prompt for the first draft. MUST ask for the copy AND the scorecard
  // (concept/angle/scores) - use guide.hookFirstBlock() + guide.scorecardShape().
  buildDraftUser: () => string;
  // The user prompt for a revision: given the previous full result and the list
  // of dimensions that fell short, ask the model to REWRITE THE CONCEPT (hook
  // first) and re-score. The standard builder below covers the common case.
  buildReviseUser: (prev: Record<string, unknown>, weak: ScoreKey[]) => string;
  maxTokens: number;
  // Extra system text appended to the standing creative guide (brand context,
  // the specific output contract, etc).
  systemSuffix?: string;
  maxRevisions?: number;
}

export interface JudgeResult {
  // The final model output (copy + reasoning + scores + concept + angle + any
  // extra keys the caller asked for). The caller shapes this into its response.
  result: Record<string, unknown>;
  scores: CreativeScores;
  concept: string;
  angle: string;
  passed: boolean;     // did every dimension clear the threshold?
  revisions: number;   // how many revision passes were spent (0 = first draft passed)
}

function strOf(result: Record<string, unknown>, key: string): string {
  const v = result[key];
  return typeof v === 'string' ? v : '';
}

// The default revision prompt: feed back the weak scores + the prior copy and
// demand a CONCEPT rewrite, not a tidy-up. Hook first, design after.
export function defaultRevisePrompt(prev: Record<string, unknown>, weak: ScoreKey[]): string {
  const weakList = weak.map((k) => SCORE_LABELS[k]).join(', ');
  const prevConcept = strOf(prev, 'concept');
  return `Your previous draft was not strong enough. These dimensions fell below the bar: ${weakList}.
Previous concept: "${prevConcept || '(none given)'}".
Do NOT polish the same idea. REWRITE THE CONCEPT from the hook. If the draft read like a feature list, a description or a corporate line, throw it out and start from a sharper angle (try a different angle from the bank). ${SCORE_RUBRIC}
Return the SAME JSON shape as before, with the rewritten copy and a fresh, honest scorecard.`;
}

// Run the draft -> self-score -> auto-revise loop. Returns the best attempt, or
// null if even the very first draft was unparseable (the caller then falls back
// to its own offline path, exactly as today).
export async function runCreativeJudgement(cfg: JudgeConfig): Promise<JudgeResult | null> {
  const system = cfg.systemSuffix ? `${CREATIVE_SYSTEM}\n\n${cfg.systemSuffix}` : CREATIVE_SYSTEM;
  const budget = cfg.maxRevisions ?? MAX_REVISIONS;

  let current = await cfg.complete({ system, user: cfg.buildDraftUser(), maxTokens: cfg.maxTokens });
  if (!current) return null; // first draft failed to parse -> caller falls back

  let best: { result: Record<string, unknown>; scores: CreativeScores } | null = null;
  let revisions = 0;

  for (let attempt = 0; ; attempt++) {
    const scores = normaliseScores(current?.scores);
    // Track the strongest attempt by its weakest dimension, so a spent budget
    // still surfaces the best of what we have.
    if (!best || minScore(scores) > minScore(best.scores)) best = { result: current!, scores };

    if (allPass(scores)) {
      return {
        result: current!, scores,
        concept: strOf(current!, 'concept'), angle: strOf(current!, 'angle'),
        passed: true, revisions: attempt,
      };
    }
    if (attempt >= budget) break;

    const next = await cfg.complete({
      system,
      user: cfg.buildReviseUser(current!, weakDimensions(scores)),
      maxTokens: cfg.maxTokens,
    });
    revisions = attempt + 1;
    if (!next) break; // a revision failed to parse -> keep the best so far
    current = next;
  }

  const final = best!;
  return {
    result: final.result, scores: final.scores,
    concept: strOf(final.result, 'concept'), angle: strOf(final.result, 'angle'),
    passed: allPass(final.scores), revisions,
  };
}
