// ═══ Voice AI persistence ═══
// A thin, parallel localStorage layer under the same `cg.v1.*` namespace as the
// store, but kept OUT of the store reducer so the MVP is fully additive. At M0
// these three keys become `socialdesk.cg_*` tables and sync like the rest.
// Swap these two functions for a Supabase adapter and nothing else changes.

import type { IntentSession, ApprovalSignal } from './types';

const NS = 'cg.v1';
type Key = 'intentSessions' | 'approvalSignals';

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

export function addSignal(signal: ApprovalSignal): void {
  save('approvalSignals', [signal, ...loadSignals()].slice(0, 500));
}
