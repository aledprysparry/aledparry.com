/**
 * Capsiynau learning loop — pure engine.
 *
 * No DOM, no DB, no I/O. Drives the loop steps as pure functions over
 * in-memory state. Two consumers in this repo (the React demo and the
 * /api/capsiynau/measure route) both build on top of this. In production
 * Capsiynau, the same functions sit behind a Postgres-backed event log
 * and a curator UI.
 */

import type {
  CorrectionEvent,
  Entity,
  GoldenSpan,
  MeasurementResult,
  Proposal,
  Rule,
} from "./types";

/** Minimum number of corrections before a rule can be proposed. */
export const SUPPORT_THRESHOLD = 2;
/** Minimum number of distinct contributors. Prevents one user's typo
 *  becoming everyone's autocorrect. */
export const MIN_CONTRIBUTORS = 2;

/**
 * Group correction events by canonical entity. Each group carries the
 * supporting event IDs and the set of distinct contributor IDs.
 */
export function clusterEventsByEntity(
  events: CorrectionEvent[],
): Map<string, { eventIds: string[]; contributors: Set<string> }> {
  const clusters = new Map<
    string,
    { eventIds: string[]; contributors: Set<string> }
  >();
  for (const e of events) {
    const existing = clusters.get(e.entityCanonical) ?? {
      eventIds: [],
      contributors: new Set<string>(),
    };
    existing.eventIds.push(e.id);
    existing.contributors.add(e.userId);
    clusters.set(e.entityCanonical, existing);
  }
  return clusters;
}

/**
 * Derive rule proposals from current events, excluding entities that
 * already have an approved rule. Returns one Proposal per qualifying
 * entity. The caller is responsible for surfacing these to a curator.
 */
export function proposeRules({
  events,
  existingRules,
  entities,
}: {
  events: CorrectionEvent[];
  existingRules: Rule[];
  entities: Entity[];
}): Proposal[] {
  const entityByCanonical = new Map(entities.map((e) => [e.canonical, e]));
  const approvedCanonicals = new Set(
    existingRules.map((r) => r.entityCanonical),
  );
  const clusters = clusterEventsByEntity(events);

  const proposals: Proposal[] = [];
  for (const [canonical, cluster] of clusters.entries()) {
    if (approvedCanonicals.has(canonical)) continue;
    if (cluster.eventIds.length < SUPPORT_THRESHOLD) continue;
    if (cluster.contributors.size < MIN_CONTRIBUTORS) continue;
    const entity = entityByCanonical.get(canonical);
    if (!entity) continue;
    proposals.push({
      entityCanonical: canonical,
      pattern: entity.variant,
      replacement: entity.canonical,
      type: entity.type,
      supportingEventIds: cluster.eventIds,
      contributors: Array.from(cluster.contributors).sort(),
    });
  }
  proposals.sort((a, b) => a.entityCanonical.localeCompare(b.entityCanonical));
  return proposals;
}

/**
 * Approve a proposal. The caller supplies the approving curator's ID,
 * an approval timestamp, and a stable rule ID generator. Kept abstract
 * so the same engine works in the browser (Date.now + crypto.randomUUID)
 * and in tests (deterministic injected clock).
 */
export function approveProposal({
  proposal,
  approvedBy,
  approvedAt,
  ruleId,
}: {
  proposal: Proposal;
  approvedBy: string;
  approvedAt: number;
  ruleId: string;
}): Rule {
  return {
    id: ruleId,
    entityCanonical: proposal.entityCanonical,
    pattern: proposal.pattern,
    replacement: proposal.replacement,
    type: proposal.type,
    status: "approved",
    supportingEventIds: proposal.supportingEventIds,
    contributors: [...proposal.contributors, approvedBy].filter(
      (v, i, a) => a.indexOf(v) === i,
    ),
    approvedAt,
  };
}

/**
 * Index approved rules by canonical entity for O(1) lookup at
 * transcription/post-processing time.
 */
export function indexRules(rules: Rule[]): Map<string, Rule> {
  return new Map(rules.map((r) => [r.entityCanonical, r]));
}

/**
 * Mock ASR pass for the demo. Given a list of entities the audio
 * "contains", emit the variant form (the mistake the ASR makes).
 * In production this is replaced by the actual ASR step; the engine
 * does not depend on this function.
 */
export function mockTranscribeEntity(
  canonical: string,
  entities: Entity[],
): string {
  const e = entities.find((x) => x.canonical === canonical);
  if (!e) return canonical;
  return e.variant;
}

/**
 * Post-processing pass equivalent to the glossary-injection step in the
 * real Capsiynau transcription pipeline. Given the model's output for an
 * entity span, applies the approved rule if one exists.
 *
 * Returns `{ text, ruleApplied }` so callers can highlight which spans
 * were corrected from memory.
 */
export function applyRulesToVariant({
  variant,
  rules,
  entities,
}: {
  variant: string;
  rules: Rule[];
  entities: Entity[];
}): { text: string; ruleApplied: Rule | null } {
  const matched = rules.find((r) => r.pattern === variant);
  if (matched) {
    return { text: matched.replacement, ruleApplied: matched };
  }
  // No rule. Return the variant unchanged.
  void entities;
  return { text: variant, ruleApplied: null };
}

/**
 * Score the model's output for one entity span against the canonical
 * reference. Standard NER precision/recall convention: each reference
 * span gets one of three outcomes.
 */
type SpanOutcome = "true_positive" | "false_negative_plus_positive" | "missing";

function classifySpan(
  reference: string,
  modelOutput: string | null,
): SpanOutcome {
  if (modelOutput === null) return "missing";
  if (modelOutput === reference) return "true_positive";
  return "false_negative_plus_positive";
}

/**
 * Run a measurement of the model output against a labelled golden set.
 *
 * The caller supplies a `transcribe` function that returns the model's
 * output for a given golden span (or null if the model emitted nothing
 * at that position). This keeps the engine decoupled from the specific
 * ASR/post-processing pipeline.
 */
export function measureAgainstGoldenSet({
  goldenSet,
  rules,
  entities,
  transcribe,
}: {
  goldenSet: GoldenSpan[];
  rules: Rule[];
  entities: Entity[];
  transcribe: (span: GoldenSpan) => string | null;
}): MeasurementResult {
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  const rulesApplied = new Set<string>();

  for (const span of goldenSet) {
    const variant = transcribe(span);
    if (variant === null) {
      falseNegatives++;
      continue;
    }
    const { text, ruleApplied } = applyRulesToVariant({
      variant,
      rules,
      entities,
    });
    if (ruleApplied) rulesApplied.add(ruleApplied.id);
    const outcome = classifySpan(span.referenceText, text);
    if (outcome === "true_positive") {
      truePositives++;
    } else if (outcome === "false_negative_plus_positive") {
      falsePositives++;
      falseNegatives++;
    } else {
      falseNegatives++;
    }
  }

  const total = goldenSet.length;
  const precision =
    truePositives + falsePositives === 0
      ? 0
      : truePositives / (truePositives + falsePositives);
  const recall =
    truePositives + falseNegatives === 0
      ? 0
      : truePositives / (truePositives + falseNegatives);
  const f1 =
    precision + recall === 0
      ? 0
      : (2 * precision * recall) / (precision + recall);

  return {
    precision,
    recall,
    f1,
    truePositives,
    falsePositives,
    falseNegatives,
    total,
    rulesApplied: Array.from(rulesApplied).sort(),
  };
}

/**
 * Default mock transcriber for demos and the held-out measurement route.
 * Returns the variant for any entity the mock ASR is known to mangle,
 * otherwise returns the canonical (entity is already transcribed
 * correctly).
 */
export function defaultMockTranscribe(
  span: GoldenSpan,
  entities: Entity[],
): string {
  const e = entities.find((x) => x.canonical === span.entityCanonical);
  if (!e) return span.referenceText;
  return e.variant;
}
