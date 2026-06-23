// Buan auth scaffold (P0) – interface + stub only.
//
// Real auth (business owners / staff logging in to the dashboard) will use
// Supabase Auth. Wiring it properly adds the `@supabase/supabase-js` dependency
// (or GoTrue REST calls) – that's a deliberate decision deferred past P0 so the
// foundation stays dependency-free. For now this exposes the shape the rest of
// the app codes against, returning "signed out" everywhere.

import type { Plan } from "./types";

export interface BuanSession {
  userId: string;
  email: string;
  businessId: string | null;
  plan: Plan;
}

// Stub: always signed out until Supabase Auth is wired (see BUAN_P0_NOTES.md).
export async function getSession(): Promise<BuanSession | null> {
  return null;
}

export function isSignedIn(session: BuanSession | null): session is BuanSession {
  return session != null;
}
