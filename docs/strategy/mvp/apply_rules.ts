/**
 * Capsiynau learning loop — MVP rule application.
 *
 * Reference implementation. Lift into the Capsiynau repo and wire to your
 * existing transcription pipeline. The shape is what matters; the imports
 * and DB client should match your stack.
 *
 * The glossary block is the same across every call for a given series, so
 * the system prompt is structured to be prompt-cacheable: stable prefix
 * (base prompt + glossary) followed by the per-call dynamic content.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { Pool } from "pg";
import { createHash } from "node:crypto";

type Rule = {
  ruleId: string;
  pattern: string;
  replacement: string;
  contextHint: string | null;
};

export async function loadApprovedRules(
  db: Pool,
  tenantId: string,
  seriesId: string,
): Promise<Rule[]> {
  const { rows } = await db.query<{
    rule_id: string;
    pattern: string;
    replacement: string;
    context_hint: string | null;
  }>(
    `select rule_id, pattern, replacement, context_hint
       from learned_rules
      where tenant_id = $1
        and (series_id = $2 or series_id is null)
        and status = 'approved'
      order by approved_at asc`,
    [tenantId, seriesId],
  );

  return rows.map((r) => ({
    ruleId: r.rule_id,
    pattern: r.pattern,
    replacement: r.replacement,
    contextHint: r.context_hint,
  }));
}

export function buildGlossaryBlock(rules: Rule[]): string {
  if (rules.length === 0) return "";
  const lines = rules.map((r) => {
    const hint = r.contextHint ? ` — ${r.contextHint}` : "";
    return `- ${r.replacement}${hint}`;
  });
  return [
    "<series_glossary>",
    "Use these exact spellings for names, places, and programme-specific terms.",
    "Prefer the form on the right over any phonetically similar variant.",
    ...lines,
    "</series_glossary>",
  ].join("\n");
}

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

type TranscribeArgs = {
  client: Anthropic;
  db: Pool;
  tenantId: string;
  seriesId: string;
  episodeId: string;
  audioTranscriptDraft: string; // first-pass output from your ASR step
  basePrompt: string;
};

/**
 * Post-processing pass: take a draft transcript from the ASR step and have
 * Claude normalise names/terms using the approved glossary. The base prompt
 * + glossary is marked for prompt caching since it is reused across every
 * call in the same series.
 *
 * Returns the corrected transcript and the source_prompt_hash to log against
 * any subsequent correction events.
 */
export async function normaliseWithRules(args: TranscribeArgs): Promise<{
  corrected: string;
  sourceModel: string;
  sourcePromptHash: string;
  rulesApplied: string[];
}> {
  const rules = await loadApprovedRules(args.db, args.tenantId, args.seriesId);
  const glossary = buildGlossaryBlock(rules);
  const cachedSystem = glossary
    ? `${args.basePrompt}\n\n${glossary}`
    : args.basePrompt;

  const model = "claude-opus-4-7";
  const response = await args.client.messages.create({
    model,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: cachedSystem,
        // Stable for the whole series — cache it so repeat calls are cheap.
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Normalise the following draft transcript. Apply the glossary " +
              "above where the draft contains a phonetic variant of a listed " +
              "term. Do not change anything else. Return the corrected " +
              "transcript only.\n\n" +
              args.audioTranscriptDraft,
          },
        ],
      },
    ],
  });

  const corrected = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return {
    corrected,
    sourceModel: model,
    sourcePromptHash: sha256(cachedSystem),
    rulesApplied: rules.map((r) => r.ruleId),
  };
}

/**
 * Reversibility test. Call this against the same audio/draft with rules
 * disabled to confirm you return to baseline behaviour. If you don't, the
 * base prompt has drifted and your measurement comparison is invalid.
 */
export async function normaliseWithoutRules(
  args: Omit<TranscribeArgs, "db"> & { db?: never },
): Promise<{
  corrected: string;
  sourceModel: string;
  sourcePromptHash: string;
}> {
  const model = "claude-opus-4-7";
  const response = await args.client.messages.create({
    model,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: args.basePrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: args.audioTranscriptDraft }],
      },
    ],
  });

  const corrected = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return {
    corrected,
    sourceModel: model,
    sourcePromptHash: sha256(args.basePrompt),
  };
}
