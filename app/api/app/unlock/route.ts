import { NextRequest, NextResponse } from 'next/server';
import { checkPassword, signGateToken, requireGate, GATE_COOKIE, GATE_TTL_SEC } from '@/lib/postioGate';

// GET: report whether this browser already holds a valid gate cookie, so
// AppGate can render the client area without re-prompting.
export async function GET(req: NextRequest) {
  return NextResponse.json({ unlocked: requireGate(req) });
}

// POST { password }: validate server-side and, on success, set the HttpOnly
// signed gate cookie. The password is never returned and never lives in the
// client bundle.
export async function POST(req: NextRequest) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!checkPassword(password || '')) {
    return NextResponse.json({ error: 'invalid', message: 'Incorrect password.' }, { status: 401 });
  }
  const res = NextResponse.json({ unlocked: true });
  res.cookies.set(GATE_COOKIE, signGateToken(), {
    httpOnly: true,
    secure: req.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: GATE_TTL_SEC,
  });
  return res;
}
