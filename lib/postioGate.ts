// Server-side gate for the Postio client area.
//
// Background: the /app client area was protected only by AppGate, a CLIENT-side
// password check (hardcoded in the bundle) writing sessionStorage. That gate is
// invisible to the API routes, so anyone could call paid proxy routes
// (/api/postio/transcribe, /api/ai/social) directly and burn Capsiynau /
// Anthropic credit unauthenticated (Codex on PR #72).
//
// This module is the server half: an HttpOnly, HMAC-signed cookie set when the
// visitor proves the password server-side, and verified on every paid route.
// The password itself now lives in an env var, never shipped to the client.

import { createHmac, timingSafeEqual } from 'crypto';
import type { NextRequest } from 'next/server';

const COOKIE = 'postio_gate';
const TTL_SEC = 60 * 60 * 24 * 30; // 30 days

// APP_GATE_PASSWORD: the client-area password (defaults to the previous
// hardcoded value so nothing breaks before the env var is set in Vercel).
// APP_GATE_SECRET: HMAC signing key for the cookie (falls back to the password,
// then a dev constant). Set a distinct random APP_GATE_SECRET in prod.
const passwordOf = () => process.env.APP_GATE_PASSWORD || 'Qwerty123';
const secretOf = () => process.env.APP_GATE_SECRET || process.env.APP_GATE_PASSWORD || 'postio-dev-secret';

/** Constant-time password comparison. */
export function checkPassword(input: string): boolean {
  const a = Buffer.from(String(input ?? ''));
  const b = Buffer.from(passwordOf());
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Sign a `v1.<exp>.<sig>` gate token valid for TTL_SEC. */
export function signGateToken(): string {
  const exp = Math.floor(Date.now() / 1000) + TTL_SEC;
  const payload = `v1.${exp}`;
  const sig = createHmac('sha256', secretOf()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

/** Verify a gate token: shape, signature (constant-time), and expiry. */
export function verifyGateToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [v, exp, sig] = parts;
  const expected = createHmac('sha256', secretOf()).update(`${v}.${exp}`).digest('base64url');
  if (sig.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  return Number(exp) > Math.floor(Date.now() / 1000);
}

/** True if the request carries a valid gate cookie. */
export function requireGate(req: NextRequest): boolean {
  return verifyGateToken(req.cookies.get(COOKIE)?.value);
}

export const GATE_COOKIE = COOKIE;
export const GATE_TTL_SEC = TTL_SEC;
