/**
 * Capsiynau learning loop — headless CLI.
 *
 * Runs the same engine the React demo runs, against the same held-out
 * golden set, with all 9 candidate rules approved. Prints a measured
 * precision/recall delta to stdout. Use this to sanity-check the engine
 * outside the browser.
 *
 *   npx tsx scripts/capsiynau-loop-cli.ts
 *   npx tsx scripts/capsiynau-loop-cli.ts --rules 5    # approve only 5
 */

import {
  BACKSTORY_SEEDS,
  ENTITIES,
  EP1,
  HELDOUT_GOLDEN_SET,
  buildBackstoryEvents,
  mockHeldoutTranscribe,
} from "../lib/capsiynau/data";
import {
  approveProposal,
  measureAgainstGoldenSet,
  proposeRules,
} from "../lib/capsiynau/engine";
import type { CorrectionEvent, Rule } from "../lib/capsiynau/types";

function parseRuleLimit(): number {
  const flagIdx = process.argv.indexOf("--rules");
  if (flagIdx === -1) return Infinity;
  const n = Number(process.argv[flagIdx + 1]);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("--rules expects a non-negative number");
  }
  return n;
}

/**
 * Simulate every editor correction on Episode 1, then approve up to
 * `limit` proposals in alphabetical order. Returns the rules.
 */
function runLoop(limit: number): { rules: Rule[]; events: CorrectionEvent[] } {
  const now = Date.now();
  const backstory = buildBackstoryEvents(now);

  const sessionEvents: CorrectionEvent[] = [];
  for (const line of EP1.lines) {
    let idx = 0;
    for (const seg of line.segments) {
      if (seg.kind === "entity") {
        const e = ENTITIES.find((x) => x.canonical === seg.entityCanonical);
        if (e) {
          sessionEvents.push({
            id: `you-${line.id}-${idx}`,
            entityCanonical: e.canonical,
            spanKey: `${line.id}-${idx}`,
            before: e.variant,
            after: e.canonical,
            userId: "you",
            episodeId: EP1.id,
            occurredAt: now,
          });
        }
      }
      idx++;
    }
  }

  const allEvents = [...backstory, ...sessionEvents];
  const proposals = proposeRules({
    events: allEvents,
    existingRules: [],
    entities: ENTITIES,
  });

  const rules: Rule[] = [];
  for (const p of proposals) {
    if (rules.length >= limit) break;
    rules.push(
      approveProposal({
        proposal: p,
        approvedBy: "curator-cli",
        approvedAt: now,
        ruleId: `rule-${p.entityCanonical.replace(/\s+/g, "-").toLowerCase()}`,
      }),
    );
  }

  return { rules, events: allEvents };
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1).padStart(5)}%`;
}

function main(): void {
  const limit = parseRuleLimit();
  const { rules, events } = runLoop(limit);

  const baseline = measureAgainstGoldenSet({
    goldenSet: HELDOUT_GOLDEN_SET,
    rules: [],
    entities: ENTITIES,
    transcribe: (span) => mockHeldoutTranscribe(span.entityCanonical),
  });

  const withRules = measureAgainstGoldenSet({
    goldenSet: HELDOUT_GOLDEN_SET,
    rules,
    entities: ENTITIES,
    transcribe: (span) => mockHeldoutTranscribe(span.entityCanonical),
  });

  const lines = [
    "Capsiynau learning loop — held-out measurement",
    "===============================================",
    `Series           : Y Sesiwn`,
    `Tenant           : tenant-capsiynau-pilot`,
    `Events ingested  : ${events.length} (${BACKSTORY_SEEDS.length} backstory + ${events.length - BACKSTORY_SEEDS.length} session)`,
    `Rules approved   : ${rules.length} / ${rules.length === Infinity ? "—" : rules.length}`,
    `Golden set spans : ${HELDOUT_GOLDEN_SET.length}`,
    "",
    "                  precision   recall      f1     TP / FP / FN",
    `Baseline       :   ${pct(baseline.precision)}    ${pct(baseline.recall)}    ${pct(baseline.f1)}    ${baseline.truePositives} / ${baseline.falsePositives} / ${baseline.falseNegatives}`,
    `With rules     :   ${pct(withRules.precision)}    ${pct(withRules.recall)}    ${pct(withRules.f1)}    ${withRules.truePositives} / ${withRules.falsePositives} / ${withRules.falseNegatives}`,
    `Delta          :   ${pct(withRules.precision - baseline.precision)}    ${pct(withRules.recall - baseline.recall)}    ${pct(withRules.f1 - baseline.f1)}`,
    "",
    `Rules that fired against the held-out set: ${withRules.rulesApplied.length}`,
    ...withRules.rulesApplied.map((id) => `  - ${id}`),
  ];
  process.stdout.write(lines.join("\n") + "\n");
}

main();
