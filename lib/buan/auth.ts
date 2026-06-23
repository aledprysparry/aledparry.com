// Buan - auth scaffold (structure only, not a full UI).
//
// Thin wrappers over Supabase Auth so the rest of the app has a stable surface
// to build the staff dashboard / onboarding on later. Env-gated: when Supabase
// is not configured every call resolves to a safe "signed out" result.
//
// Phase 0 deliberately ships only the session helpers + a minimal sign-in;
// full login/onboarding UI and role-aware routing come in P2.

import type { Session, User } from "@supabase/supabase-js";
import { getBuanClient, buanConfigured } from "./supabaseClient";

export { buanConfigured };

export async function getSession(): Promise<Session | null> {
  const sb = getBuanClient();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session ?? null;
}

export async function getUser(): Promise<User | null> {
  const sb = getBuanClient();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
}

/** Email + password sign-in. Returns ok:false (never throws) when unconfigured. */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  const sb = getBuanClient();
  if (!sb) return { ok: false, error: "Buan auth is not configured." };
  const { error } = await sb.auth.signInWithPassword({ email, password });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Passwordless magic-link sign-in (preferred for staff onboarding in P2). */
export async function signInWithMagicLink(
  email: string,
  emailRedirectTo?: string
): Promise<AuthResult> {
  const sb = getBuanClient();
  if (!sb) return { ok: false, error: "Buan auth is not configured." };
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: emailRedirectTo ? { emailRedirectTo } : undefined,
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function signOut(): Promise<void> {
  const sb = getBuanClient();
  if (!sb) return;
  await sb.auth.signOut();
}

/** Subscribe to auth changes. Returns an unsubscribe fn (no-op when unconfigured). */
export function onAuthChange(
  cb: (session: Session | null) => void
): () => void {
  const sb = getBuanClient();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((_event, session) =>
    cb(session ?? null)
  );
  return () => data.subscription.unsubscribe();
}
