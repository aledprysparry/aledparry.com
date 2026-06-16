import { NextRequest, NextResponse } from 'next/server';
import { metaConfigured, oauthUrl } from '@/lib/social/meta';

// Kicks off Meta OAuth. Until a Meta app is configured (env vars), this
// returns a clear 503 instead of a broken redirect.
export function GET(req: NextRequest) {
  if (!metaConfigured()) {
    return NextResponse.json(
      { error: 'not_configured', message: 'Instagram live pull needs a Meta app. See META_SETUP.md.' },
      { status: 503 },
    );
  }
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/social/instagram/callback`;
  const back = req.nextUrl.searchParams.get('return') || '/app/carousel';
  return NextResponse.redirect(oauthUrl(redirectUri, encodeURIComponent(back)));
}
