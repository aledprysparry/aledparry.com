/**
 * Capsiynau learning loop — shared type definitions.
 *
 * Pure types, no runtime imports. Safe to import from server, client, or
 * a standalone Node script. When this module is lifted into the Capsiynau
 * production repo, only this file plus `engine.ts` need to come with it.
 */

export type EntityType =
  | "person"
  | "place"
  | "organisation"
  | "programme_term";

export interface Entity {
  /** Canonical, broadcaster-approved spelling. The form a producer would sign off. */
  canonical: string;
  /** The mis-spelling the ASR tends to emit. */
  variant: string;
  type: EntityType;
}

export type Segment =
  | { kind: "text"; value: string }
  | { kind: "entity"; entityCanonical: string };

export interface TranscriptLine {
  id: string;
  ms: number;
  speaker: string;
  segments: Segment[];
}

export interface Episode {
  id: string;
  title: string;
  lines: TranscriptLine[];
}

export interface CorrectionEvent {
  id: string;
  entityCanonical: string;
  spanKey: string;
  before: string;
  after: string;
  userId: string;
  episodeId: string;
  occurredAt: number;
}

export interface Rule {
  id: string;
  entityCanonical: string;
  pattern: string;
  replacement: string;
  type: EntityType;
  status: "approved";
  supportingEventIds: string[];
  contributors: string[];
  approvedAt: number;
}

export interface Proposal {
  entityCanonical: string;
  pattern: string;
  replacement: string;
  type: EntityType;
  supportingEventIds: string[];
  contributors: string[];
}

export interface GoldenSpan {
  id: string;
  episodeId: string;
  entityCanonical: string;
  entityType: EntityType;
  startMs: number;
  endMs: number;
  /** The canonical reference text — what a producer would sign off. */
  referenceText: string;
}

export interface MeasurementResult {
  precision: number;
  recall: number;
  f1: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  total: number;
  /** IDs of rules that fired against this golden set. */
  rulesApplied: string[];
}
