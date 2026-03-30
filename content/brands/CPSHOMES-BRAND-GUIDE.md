# CPS Homes — Brand & Technical Guide

> Shared knowledge for all CPS Homes apps (GuessThePrice, SocialEditor, future tools).
> Source: `/Users/user/Downloads/CPS Homes - Client files/fonts and colours.pdf`

---

## Brand Colours

| Colour | Hex | Usage |
|--------|-----|-------|
| **Primary Teal** | `#335F6A` | Main brand colour, headers, buttons, backgrounds |
| **Accent Salmon** | `#FB8770` | Highlights, CTAs, energy, game accents |
| **Sage Green** | `#83A381` | Success states, positive indicators, trust |
| **White** | `#FFFFFF` | Text on dark backgrounds, overlays |
| **Warm Cream** | `#F2E6D8` | Soft backgrounds, warmth |
| **Forest Green** | `#445A46` | Premium/landlord content, dark accents |
| **Olive** | `#A7A740` | Education/insight content |
| **Navy** | `#0a1628` | Dark UI backgrounds (app chrome) |

## Typography

| Role | Official Font | Google Fonts Fallback | Weights |
|------|---------------|----------------------|---------|
| **Headings** | Nantes (proprietary) | **Lora** (serif, italic supported) | 400, 500, 600, 700 |
| **Body** | Matter (proprietary) | **DM Sans** (geometric sans) | 400, 500, 600, 700 |

- Line height: **1.15** on canvas (brand guide specifies 0.92, but that's too tight for screen rendering)
- Heading weight: **700** (bold)
- Body weight: **500** (medium) for readability

## Logos

| File | Path | Size | Usage |
|------|------|------|-------|
| Teal on transparent | `/demos/cpshomes-logo-teal.png` | 800×256 | Light backgrounds |
| White on transparent | `/demos/cpshomes-logo-white.png` | 800×256 | Dark backgrounds |

- Logo opacity: **0.90**
- Logo size: **14%** of canvas width
- Corner radius: **20px** (consistent across all apps)

## Aspect Ratios

| Key | Dimensions | Use Case |
|-----|-----------|----------|
| 16:9 | 1920×1080 | YouTube, Premiere, broadcast |
| iPad Pro | 2388×1668 | iPad Pro 11" / 13" live display |
| 4:3 | 1440×1080 | Standard iPad, presentations |
| 1:1 | 1080×1080 | Instagram feed |
| 9:16 | 1080×1920 | TikTok, Reels, Shorts |

## Safe Zones (social platforms)

Portrait (9:16): **220px top, 420px bottom** — TikTok/Reels paid ad margins
Square (1:1): **100px top/bottom**
Landscape (16:9): No safe zone insets

## Canvas Rendering Conventions

- Use `sz(W, H, frac)` → `Math.min(W, H) * frac` for responsive sizing
- All draw functions: `(ctx, W, H, S, progress)` signature
- `progress` 0→1 for entrance animations, optional (defaults to 1 = complete)
- Images via `getCachedImage(src)` — returns `HTMLImageElement` from cache, triggers `_imgLoadCallback` on load
- Always check `img.complete && img.naturalWidth > 0` before drawing

## Photo Upload

- Compress to **2400px max width**, **0.85 JPEG quality** (covers iPad Pro 2388px)
- Upload via **FormData (binary)** to `/api/gtp/photo` → Vercel Blob
- Store the proxy URL `/api/gtp/img?url=<blobUrl>` — not base64
- Never store base64 in localStorage (5MB limit)

## Live Display Architecture

- **BroadcastChannel** (`gtp-live-sync`) for same-browser sync (<10ms)
- **Edge Runtime API** (`/api/gtp/live`) with in-memory cache for cross-device (~200ms)
- Display renders at **admin's canvas dimensions** (sent as `canvasW`/`canvasH`)
- CSS letterboxes to fill screen without distortion
- All assets play entrance animation, property loops photos
- Tap to pause, swipe to step through photos

## Shared Config File

`content/brands/cpshomes.ts` — TypeScript config with all brand values, font loader, ratios, and safe zones. Import from here for new projects:

```typescript
import { CPSHOMES_BRAND, CPSHOMES_FONTS, RATIOS, loadFont } from "@/content/brands/cpshomes";
```

## Existing Apps

| App | Route | Component | Description |
|-----|-------|-----------|-------------|
| **Guess the Price** | `/app/cpshomes/guessprice` | `GuessThePrice.jsx` | Live game show — property price guessing with A/B/C options |
| **Social Editor** | `/app/cpshomes/socialeditor` | `SocialEditor.jsx` | Graphics generator — social media templates, captions, exports |

## New App Checklist

When creating a new CPS Homes app:

1. Import brand from `content/brands/cpshomes.ts`
2. Register in `content/demos.config.ts` with `clientSlug: "cpshomes"`
3. Use `loadFont("DM Sans")` + `loadFont("Lora")` on mount
4. Use `getCachedImage()` for all image loading (with `_imgLoadCallback` for re-render)
5. Follow `(ctx, W, H, S, progress)` signature for draw functions
6. Use `sz(W, H, frac)` for all sizing (responsive across ratios)
7. Respect safe zones for portrait/square exports
8. Use Vercel Blob for image storage (not base64 in localStorage)
