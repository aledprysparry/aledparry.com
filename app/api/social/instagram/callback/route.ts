import { NextRequest, NextResponse } from 'next/server';
import { exchangeCode, resolveInstagram, metaConfigured, META_COOKIE } from '@/lib/social/meta';

// OAuth callback: code -> user token -> IG business account + page token,
// stored in an HTTP-only cookie, then back to the app.
export async function GET(req: NextRequest) {
  const back = decodeURIComponent(req.nextUrl.searchParams.get('state') || '/app/carousel');
  const fail = (reason: string) => NextResponse.redirect(`${req.nextUrl.origin}${back}?ig=${reason}`);

  if (!metaConfigured()) return fail('not_configured');
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return fail('denied');

  try {
    const redirectUri = `${req.nextUrl.origin}/api/social/instagram/callback`;
    const userToken = await exchangeCode(code, redirectUri);
    if (!userToken) return fail('token_failed');
    const ig = await resolveInstagram(userToken);
    if (!ig) return fail('no_business_account');

    const res = NextResponse.redirect(`${req.nextUrl.origin}${back}?ig=connected`);
    res.cookies.set(META_COOKIE, JSON.stringify(ig), {
      httpOnly: true,
      secure: req.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch {
    return fail('error');
  }
}
