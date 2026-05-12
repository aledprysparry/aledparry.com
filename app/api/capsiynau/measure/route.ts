import { NextRequest, NextResponse } from "next/server";

import {
  ENTITIES,
  HELDOUT_GOLDEN_SET,
  mockHeldoutTranscribe,
} from "@/lib/capsiynau/data";
import { measureAgainstGoldenSet } from "@/lib/capsiynau/engine";
import type { Rule } from "@/lib/capsiynau/types";

/**
 * POST /api/capsiynau/measure
 *
 * Runs the engine's measurement step against a held-out, hand-labelled
 * reference clip the demo UI never shows the user. Accepts the user's
 * current set of approved rules in the request body; returns precision,
 * recall, F1, and the rules that fired.
 *
 * The request is intentionally stateless — the UI persists its own rules
 * in localStorage. In production Capsiynau the rules come from the
 * `learned_rules` table for the relevant tenant and series.
 */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { rules?: Rule[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body must be JSON: { rules: Rule[] }" },
      { status: 400 },
    );
  }

  const rules = Array.isArray(body.rules) ? body.rules : [];

  const result = measureAgainstGoldenSet({
    goldenSet: HELDOUT_GOLDEN_SET,
    rules,
    entities: ENTITIES,
    transcribe: (span) => mockHeldoutTranscribe(span.entityCanonical),
  });

  return NextResponse.json({
    series: "Y Sesiwn",
    goldenSetSize: HELDOUT_GOLDEN_SET.length,
    result,
  });
}
