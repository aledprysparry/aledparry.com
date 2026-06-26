// ═══ Voice AI persistence ═══
// A thin, parallel localStorage layer under the same `cg.v1.*` namespace as the
// store, but kept OUT of the store reducer so the MVP is fully additive. At M0
// these keys become `socialdesk.cg_*` tables and sync like the rest.
// Swap these functions for a Supabase adapter and nothing else changes.

import type { IntentSession, ApprovalSignal, CreativeProfile } from './types';

const NS = 'cg.v1';
type Key = 'intentSessions' | 'approvalSignals' | 'creativeProfiles';

function load<T>(key: Key): T[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${NS}.${key}`);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function save(key: Key, items: unknown[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`${NS}.${key}`, JSON.stringify(items));
  } catch (e) {
    console.warn(`Could not persist ${key}:`, e);
  }
}

// Sessions are capped so the log cannot grow without bound on a busy machine.
const MAX_SESSIONS = 100;

export function loadSessions(): IntentSession[] {
  return load<IntentSession>('intentSessions');
}

export function upsertSession(session: IntentSession): void {
  const all = loadSessions().filter((s) => s.id !== session.id);
  save('intentSessions', [session, ...all].slice(0, MAX_SESSIONS));
}

export function loadSignals(): ApprovalSignal[] {
  return load<ApprovalSignal>('approvalSignals');
}

export function signalsForBrand(brandId: string): ApprovalSignal[] {
  return loadSignals().filter((s) => s.brandId === brandId);
}

export function addSignal(signal: ApprovalSignal): void {
  save('approvalSignals', [signal, ...loadSignals()].slice(0, 500));
}

// Stage 2: backfill real audience response onto an existing signal once an
// analytics source can map a published post back to its originating graphic.
// Wiring a real source (Meta / IG insights) to this call is the only remaining
// integration for the performance loop; the reasoning + injection are built.
export function recordEngagement(graphicId: string, engagement: ApprovalSignal['engagement']): void {
  const all = loadSignals();
  let touched = false;
  for (const s of all) {
    if (s.graphicId === graphicId) { s.engagement = engagement; touched = true; }
  }
  if (touched) save('approvalSignals', all);
}

// ── learned creative profiles (one per brand) ──

export function loadCreativeProfiles(): CreativeProfile[] {
  return load<CreativeProfile>('creativeProfiles');
}

export function getCreativeProfile(brandId: string): CreativeProfile | undefined {
  return loadCreativeProfiles().find((p) => p.brandId === brandId);
}

export function upsertCreativeProfile(profile: CreativeProfile): void {
  const all = loadCreativeProfiles().filter((p) => p.brandId !== profile.brandId);
  save('creativeProfiles', [profile, ...all]);
}
