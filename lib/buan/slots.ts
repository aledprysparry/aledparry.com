// Buan collection slots + queue smoothing (P6).
//
// Prep estimate is a parallel-kitchen heuristic (max item prep + a small base,
// capped), not additive – PLACEHOLDER, tweak freely. Slots are staggered in
// 10-minute windows from when the order would be ready. "Busy" is a deterministic
// capacity simulation here; wire it to live order counts per slot when the DB is
// connected, and the same nudge logic drives the real queue smoothing.

export interface Slot {
  iso: string;
  label: string; // HH:MM
  busy: boolean;
}

const SLOT_MIN = 10;
const BASE_MIN = 2;
const CAP_MIN = 30;

export function prepMinutesFrom(prepVals: number[]): number {
  if (!prepVals.length) return 0;
  return Math.min(Math.max(...prepVals) + BASE_MIN, CAP_MIN);
}

function hhmm(d: Date): string {
  return d.toTimeString().slice(0, 5);
}

export function collectionSlots(prepMins: number, count = 5, fromMs = Date.now()): Slot[] {
  const ready = new Date(fromMs + prepMins * 60000);
  ready.setSeconds(0, 0);
  ready.setMinutes(Math.ceil(ready.getMinutes() / SLOT_MIN) * SLOT_MIN);
  const out: Slot[] = [];
  for (let i = 0; i < count; i++) {
    const t = new Date(ready.getTime() + i * SLOT_MIN * 60000);
    // Deterministic capacity sim: ~1 in 3 windows is "busy". Replace with a real
    // count of orders already collecting in this window once the DB is live.
    const busy = Math.floor(t.getTime() / (SLOT_MIN * 60000)) % 3 === 0;
    out.push({ iso: t.toISOString(), label: hhmm(t), busy });
  }
  return out;
}

// The soonest non-busy slot (the one to nudge customers toward).
export function quietest(slots: Slot[]): Slot | null {
  return slots.find((s) => !s.busy) ?? slots[0] ?? null;
}

export function labelFor(iso: string, slots: Slot[]): string {
  return slots.find((s) => s.iso === iso)?.label ?? "";
}
