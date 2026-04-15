# Social Editor — Safe Zone Specification

> **Source of truth** for content placement across all social media formats.
> Any graphic must keep its content inside these safe areas to avoid being hidden
> by platform UI (captions, usernames, icons, buttons, etc.).

---

## 9:16 — Vertical (1080 × 1920)

**Primary format: TikTok, Instagram Reels, YouTube Shorts**

```
┌─────────────────────────────────────┐
│ ← 120 →                     ← 120 →│
│         ┌─────────────┐             │
│  250    │             │             │  ← top unsafe (username, UI)
│   ↓     │             │             │
│         │             │             │
│         │             │             │
│         │  SAFE AREA  │             │
│         │             │             │
│         │  840 × 1350 │             │
│         │             │             │
│         │             │             │
│         │             │             │
│         └─────────────┘             │
│   ↑                                 │  ← bottom unsafe
│  320    (captions, music, buttons)  │
│                                     │
└─────────────────────────────────────┘
  1080 px wide × 1920 px tall
```

### Zones (px from each edge)

| Variant | Top | Bottom | Left | Right | Notes |
|---------|-----|--------|------|-------|-------|
| **universal** (default) | 250 | 320 | 120 | 120 | Works on all platforms, paid + organic |
| **organic** | 250 | 250 | 120 | 120 | Smaller bottom for feed-only |
| **tiktok** | 250 | 380 | 120 | 120 | TikTok has extra right-side icons |
| **reels** | 250 | 320 | 120 | 120 | Same as universal |

### Safe content area
- **Width:** 840 px (1080 − 120 − 120)
- **Height:** 1350 px (1920 − 250 − 320)
- **Centre X:** 540 px
- **Centre Y:** 925 px

### Rules
1. **All text** (headlines, body, labels, CTAs) must be inside the safe area
2. **Logo/watermark** sits inside the 320 px bottom safe zone at `marginX=120, marginY=350`
3. **Background fills** the full 1080×1920 — only content is constrained
4. **Cards/overlays** must render inside the safe area bounds
5. **Body text minimum font size:** 48 px for readability at social sizes
6. **Headline font size:** 88–130 px for impact

---

## 1:1 — Square (1080 × 1080)

**Instagram feed, LinkedIn, Twitter/X**

### Zones
| Top | Bottom | Left | Right |
|-----|--------|------|-------|
| 60 | 60 | 60 | 60 |

### Safe content area
- **Width:** 960 px
- **Height:** 960 px

### Special rules
- **Endboard (client request):** minimal — show ONLY "Watch the full video now" CTA. No body text, no handles, no URL, no subscribe/notify buttons. CTA font scaled up to 92–110 px since it's the only text.
- Logo at `marginX=60, marginY=90`

---

## 16:9 — Landscape (1920 × 1080)

**YouTube, Twitter/X, desktop video**

### Zones
| Top | Bottom | Left | Right |
|-----|--------|------|-------|
| 60 | 60 | 80 | 80 |

### Safe content area
- **Width:** 1760 px
- **Height:** 960 px

### Rules
- Traditional landscape layouts — safer margins than 9:16
- Logo at `marginX≈54, marginY≈54` (5% of width)
- Headlines 68–110 px, body 30–48 px

---

## Implementation

The safe zones are defined as a constant in `SocialEditor.jsx`:

```js
const SAFE_ZONES = {
  "9:16": {
    universal: { top:250, bottom:320, left:120, right:120 },
    organic:   { top:250, bottom:250, left:120, right:120 },
    tiktok:    { top:250, bottom:380, left:120, right:120 },
    reels:     { top:250, bottom:320, left:120, right:120 },
  },
  "1:1": {
    universal: { top:60, bottom:60, left:60, right:60 },
  },
  "16:9": {
    universal: { top:60, bottom:60, left:80, right:80 },
  },
};
```

Helpers inside `drawGraphic()`:
```js
// Per-template safe area vars
const SAFE = (ratio==="9:16")?{top:250,bottom:320,left:120,right:120}
  :(ratio==="1:1")?{top:60,bottom:60,left:60,right:60}
  :{top:60,bottom:60,left:80,right:80};
const safeX=SAFE.left, safeY=SAFE.top;
const safeW=W-SAFE.left-SAFE.right;
const safeH=H-SAFE.top-SAFE.bottom;
const safeCX=safeX+safeW/2;
const safeCY=safeY+safeH/2;
```

Every template's compact path (`if(isCompact)`) should use `safeX/Y/W/H/CX/CY` for positioning — not raw `H*0.XX` fractions.

### Visual preview (debug)
`drawSafeZoneOverlay(ctx, W, H, ratio)` draws the unsafe areas in red with labels:
- ⚠ UI OVERLAY (top)
- ⚠ CAPTIONS / MUSIC (bottom)
- ⚠ (sides)

Toggle via the Graphics tab's `showSafeZones` state.

---

## Platform Reference

| Platform | Primary ratio | Notes |
|----------|--------------|-------|
| TikTok | 9:16 | Right-side icons (like, comment, share) take extra space — use `tiktok` variant |
| Instagram Reels | 9:16 | Username top-left, engagement right-side |
| Instagram Feed | 1:1 | Minimal UI, most space available |
| Instagram Stories | 9:16 | Similar to Reels but shorter |
| YouTube Shorts | 9:16 | Bottom bar for subscribe/title |
| YouTube (video) | 16:9 | Standard safe margins |
| LinkedIn | 1:1 or 16:9 | Feed minimal overlay |
| Twitter/X | 16:9 or 1:1 | Minimal overlay |

---

**Last updated:** 4 April 2026 — client-approved spec
**Maintained in:** `cpshomes/components/SocialEditor.jsx` (`SAFE_ZONES` constant)
