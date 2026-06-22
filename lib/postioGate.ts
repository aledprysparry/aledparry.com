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

// Constant-time signature compare that can't throw on malformed input: compare
// BYTE lengths (a string with non-ASCII chars has more bytes than chars), so a
// crafted signature segment never reaches timingSafeEqual with mismatched
// buffer lengths and 500s the caller (Codex #94).
function safeSigEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Verify a gate token: shape, signature (constant-time), and expiry. */
export function verifyGateToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [v, exp, sig] = parts;
  const expected = createHmac('sha256', secretOf()).update(`${v}.${exp}`).digest('base64url');
  if (!safeSigEqual(sig, expected)) return false;
  return Number(exp) > Math.floor(Date.now() / 1000);
}

/** True if the request carries a valid gate cookie. */
export function requireGate(req: NextRequest): boolean {
  return verifyGateToken(req.cookies.get(COOKIE)?.value);
}

// ── Postio job tokens ───────────────────────────────────────────────────────
// The transcribe poll echoes back a token that carries the Capsiynau projectId
// to export from. That projectId MUST be tamper-proof: an unsigned token lets a
// caller swap the projectId suffix and export any project the shared API key
// can reach (Codex IDOR on #78). So we HMAC-sign jobId+projectId together.
const JOB_SEP = '::';

// Job tokens must be signed with a secret the client CANNOT know. secretOf()
// falls back to the gate PASSWORD, which every unlocked Postio user types - so
// in the shared-API-key context they could HMAC jobId::otherProjectId and still
// export another project despite the signature. Require a dedicated server-only
// APP_GATE_SECRET and fail CLOSED without it (Codex #94).
const jobSecret = (): string | null => process.env.APP_GATE_SECRET || null;

/** True if secure job-token signing is configured. */
export function jobTokensConfigured(): boolean {
  return !!jobSecret();
}

export function signJobToken(jobId: string, projectId: string): string {
  const secret = jobSecret();
  if (!secret) throw new Error('APP_GATE_SECRET is required to issue secure job tokens.');
  const payload = `${jobId}${JOB_SEP}${projectId}`;
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}${JOB_SEP}${sig}`;
}

/** Verify + unpack a job token. Returns null if missing/tampered/not configured. */
export function verifyJobToken(token: string | undefined | null): { jobId: string; projectId: string } | null {
  const secret = jobSecret();
  if (!secret || !token) return null;
  const cut = token.lastIndexOf(JOB_SEP);
  if (cut === -1) return null;
  const payload = token.slice(0, cut);
  const sig = token.slice(cut + JOB_SEP.length);
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  if (!safeSigEqual(sig, expected)) return null;
  const split = payload.indexOf(JOB_SEP);
  if (split === -1) return null;
  return { jobId: payload.slice(0, split), projectId: payload.slice(split + JOB_SEP.length) };
}

export const GATE_COOKIE = COOKIE;
export const GATE_TTL_SEC = TTL_SEC;
