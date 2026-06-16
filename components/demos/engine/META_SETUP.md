# Live Instagram (beta) - setup checklist

The graphics engine can pull a connected Instagram account's recent
posts, ranked by engagement ("what performed well"). It is **dormant**
until a Meta app is configured - the rest of the engine (uploads, audit,
style generator) works without any of this.

## What it does once enabled
- "Connect Instagram" -> Meta OAuth -> stores a token in an HTTP-only cookie.
- "Pull recent posts" -> fetches recent media + like/comment counts, ranks them, shows top performers.

## Hard requirements (yours to set up)
1. **Meta app** - create one at developers.facebook.com (type: Business).
2. **Products** - add *Facebook Login* and *Instagram Graph API*.
3. **Account type** - the Instagram account must be **Business or Creator** and connected to a Facebook Page (like/comment counts + insights need this).
4. **Valid OAuth redirect URI** - add `https://www.aledparry.com/api/social/instagram/callback` (and a localhost variant for dev).
5. **Scopes** - `instagram_basic`, `instagram_manage_insights`, `pages_show_list`, `business_management`.
6. **App Review** - in **Development mode** you (the app owner) and added test users can use it immediately. For anyone else / public use, Meta requires **App Review + Business Verification** - this is the slow, gated part, and is Meta's process, not something code can bypass.

## Env vars (set on Vercel)
```
META_APP_ID=...
META_APP_SECRET=...
```
That's it - the redirect URI is derived from the request origin.

## Limits / honesty
- **No third-party scraping.** This uses the official API only.
- **TikTok / X / Facebook feeds** are not wired - each needs its own app + review (TikTok Display API, X API tier, etc.). Instagram is scaffolded first.
- **Colour analysis of live images** isn't wired yet: IG CDN images are cross-origin, so reading their pixels in-browser is blocked. Turning live posts into templates currently goes via download/upload into the style generator; a server-side image proxy is the clean fix (next step).
- Tokens live in an HTTP-only cookie (single-user POC). Multi-user needs real auth + per-user token storage.

## Routes
- `GET /api/social/instagram/connect` - starts OAuth (503 if unconfigured)
- `GET /api/social/instagram/callback` - exchanges code, sets cookie
- `GET /api/social/instagram/insights` - ranked recent posts (503 unconfigured / 401 not connected)
