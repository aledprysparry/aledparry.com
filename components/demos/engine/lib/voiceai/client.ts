// ═══ Voice AI API client ═══
// Thin wrappers over the gated /api/ai/social route (requireGate + ANTHROPIC_API_KEY).
// Reuses the exact request/response envelope of every other engine AI call:
// POST { task, ... } -> { task, result } | { error }. On any non-ok response we
// throw a typed AiError so the orchestrator can fall back to a local heuristic
// (the same offline-resilience pattern Coach uses), keeping the slice demoable
// without the client-area cookie or an API key set.

import type { IntentResult, IntentPlan, IntentCandidate } from './types';

export class AiError extends Error {
  constructor(public reason: 'unauthorized' | 'not_configured' | 'parse_failed' | 'network', message?: string) {
    super(message || reason);
    this.name = 'AiError';
  }
}

interface BrandCtx { name?: string; toneNotes?: string; colours?: string[]; fonts?: string[] }

async function call<T>(body: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch('/api/ai/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new AiError('network', e instanceof Error ? e.message : 'network');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) throw new AiError('unauthorized', 'Unlock the client area to use AI.');
    if (res.status === 503) throw new AiError('not_configured', 'AI is not configured here.');
    throw new AiError('parse_failed', (data as { error?: string }).error || 'AI error');
  }
  const result = (data as { result?: T }).result;
  if (!result) throw new AiError('parse_failed', 'Empty AI result.');
  return result;
}

export function detectIntent(input: {
  text: string;
  brand?: BrandCtx;
  voice?: string;
  kindSpecs: { kind: string; label: string; blurb: string; outputClass: string }[];
}): Promise<IntentResult> {
  return call<IntentResult>({
    task: 'intent-detect',
    topic: input.text,
    brand: input.brand,
    voice: input.voice,
    kindSpecs: input.kindSpecs,
  });
}

export function planIntent(input: {
  text: string;
  candidate: IntentCandidate;
  copyFields: { key: string; label: string }[];
  brand?: BrandCtx;
  voice?: string;
}): Promise<IntentPlan> {
  return call<IntentPlan>({
    task: 'intent-plan',
    topic: input.text,
    candidate: { generatorKind: input.candidate.generatorKind, format: input.candidate.format, outputClass: input.candidate.outputClass },
    copyFields: input.copyFields,
    brand: input.brand,
    voice: input.voice,
  });
}
