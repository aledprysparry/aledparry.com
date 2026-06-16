// ═══ Meta Graph API helpers (server-only) ═══
// Live Instagram pull for the graphics engine's social audit. Dormant
// until META_APP_ID + META_APP_SECRET are set (see META_SETUP.md), at
// which point Connect -> OAuth -> pull recent posts ranked by
// engagement ("what performed well"). Mirrors the "degrade gracefully
// while unconfigured" pattern used for billing.

export const META_VERSION = 'v21.0';
export const META_SCOPES = ['instagram_basic', 'instagram_manage_insights', 'pages_show_list', 'business_management'];
export const META_COOKIE = 'eng_ig';

export function metaConfigured(): boolean {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export function oauthUrl(redirectUri: string, state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.META_APP_ID ?? '',
    redirect_uri: redirectUri,
    scope: META_SCOPES.join(','),
    response_type: 'code',
    state,
  });
  return `https://www.facebook.com/${META_VERSION}/dialog/oauth?${p}`;
}

interface TokenResp { access_token?: string; error?: { message: string } }

export async function exchangeCode(code: string, redirectUri: string): Promise<string | null> {
  const p = new URLSearchParams({
    client_id: process.env.META_APP_ID ?? '',
    client_secret: process.env.META_APP_SECRET ?? '',
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(`https://graph.facebook.com/${META_VERSION}/oauth/access_token?${p}`);
  const data = (await res.json()) as TokenResp;
  return data.access_token ?? null;
}

/** Resolve the IG Business account id + a page token from a user token. */
export async function resolveInstagram(userToken: string): Promise<{ igUserId: string; pageToken: string } | null> {
  const res = await fetch(`https://graph.facebook.com/${META_VERSION}/me/accounts?fields=access_token,instagram_business_account&access_token=${userToken}`);
  const data = await res.json();
  const page = (data?.data ?? []).find((p: { instagram_business_account?: { id: string } }) => p.instagram_business_account?.id);
  if (!page) return null;
  return { igUserId: page.instagram_business_account.id, pageToken: page.access_token };
}

export interface LivePost {
  id: string;
  caption: string;
  mediaType: string;
  mediaUrl: string;
  permalink: string;
  timestamp: string;
  likes: number;
  comments: number;
  engagement: number;
}

/** Recent media, ranked by engagement (likes + comments). */
export async function fetchRankedMedia(igUserId: string, token: string, limit = 24): Promise<LivePost[]> {
  const fields = 'id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count';
  const res = await fetch(`https://graph.facebook.com/${META_VERSION}/${igUserId}/media?fields=${fields}&limit=${limit}&access_token=${token}`);
  const data = await res.json();
  const posts: LivePost[] = (data?.data ?? []).map((m: Record<string, unknown>) => {
    const likes = Number(m.like_count ?? 0);
    const comments = Number(m.comments_count ?? 0);
    return {
      id: String(m.id),
      caption: String(m.caption ?? ''),
      mediaType: String(m.media_type ?? ''),
      mediaUrl: String(m.media_url ?? ''),
      permalink: String(m.permalink ?? ''),
      timestamp: String(m.timestamp ?? ''),
      likes,
      comments,
      engagement: likes + comments,
    };
  });
  return posts.sort((a, b) => b.engagement - a.engagement);
}
