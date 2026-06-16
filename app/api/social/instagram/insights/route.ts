import { NextRequest, NextResponse } from 'next/server';
import { fetchRankedMedia, metaConfigured, META_COOKIE } from '@/lib/social/meta';

// Returns recent posts ranked by engagement for the connected IG account.
// 503 if unconfigured; 401 if not connected.
export async function GET(req: NextRequest) {
  if (!metaConfigured()) {
    return NextResponse.json({ error: 'not_configured', message: 'See META_SETUP.md.' }, { status: 503 });
  }
  const raw = req.cookies.get(META_COOKIE)?.value;
  if (!raw) return NextResponse.json({ error: 'not_connected' }, { status: 401 });

  try {
    const { igUserId, pageToken } = JSON.parse(raw) as { igUserId: string; pageToken: string };
    const posts = await fetchRankedMedia(igUserId, pageToken);
    return NextResponse.json({ connected: true, count: posts.length, posts });
  } catch {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 502 });
  }
}
