# Guess the Price — App Technical Guide

> CPS Homes live game show tool. Two estate agents guess property listing prices from A/B/C options.
> Pilot shoot: 2026-03-30. Format: weekly repeatable, 6 rounds per episode.

---

## File Map

| Purpose | Path |
|---------|------|
| **Main component** | `components/demos/GuessThePrice.jsx` (~3500 lines) |
| **Editor page** | `app/app/cpshomes/guessprice/page.tsx` |
| **Live display page** | `app/app/cpshomes/guessprice/live/page.tsx` |
| **Live display layout** | `app/app/cpshomes/guessprice/live/layout.tsx` (viewport meta) |
| **Episode data API** | `app/api/gtp/route.ts` (Vercel Blob, GET/POST) |
| **Live sync API** | `app/api/gtp/live/route.ts` (Edge Runtime, in-memory cache) |
| **Photo upload API** | `app/api/gtp/photo/route.ts` (FormData → Vercel Blob) |
| **Photo proxy API** | `app/api/gtp/img/route.ts` (proxy private blobs) |
| **Brand config** | `content/brands/cpshomes.ts` |
| **Brand guide** | `content/brands/CPSHOMES-BRAND-GUIDE.md` |
| **Demo registry** | `content/demos.config.ts` (clientSlug: "cpshomes", toolSlug: "guessprice") |

## Architecture

### Single Component
Everything lives in `GuessThePrice.jsx` — draw functions, state management, UI, live mode, display mode, exports. The component renders in three modes:

1. **Editor mode** (default) — full admin UI with canvas preview, round editor, export tools
2. **Live mode** (`liveMode` state) — fullscreen presentation overlay on the admin device
3. **Display mode** (`displayMode` prop) — remote display on iPad, polls for state

### Canvas Draw Functions
All share signature: `(ctx, W, H, S, progress)`

| Function | Asset ID | Animated | Description |
|----------|----------|----------|-------------|
| `drawIntro` | `intro` | Yes | Title card with logo, agent headshots, VS badge |
| `drawRoundTitle` | `roundtitle` | Yes | "ROUND X" with elastic number scale-in |
| `drawProperty` | `property` | Yes | Photo gallery with Ken Burns, property bar, specs |
| `drawPropertyGallery` | — | Yes | Simpler photo gallery (live mode swipe only) |
| `drawPrompt` | `prompt` | Yes | "Which one is it?" with vignette and A/B/C pills |
| `drawOptions` | `options` | Yes | A/B/C price pills with staggered slide-up |
| `drawLockIn` | `lockin` | Yes | Agent name + "IS THINKING..." → letter reveal |
| `drawTimer` | `timer` | Yes | Pulsing countdown number |
| `drawReveal` | `reveal` | Yes | Correct price with confetti |
| `drawScoreboard` | `scoreboard` | Yes | Agent scores with cards |

### Live Flow
`intro → roundtitle → property → prompt → options → lockin → timer → reveal → scoreboard`

### Sync Architecture
- **BroadcastChannel** (`gtp-live-sync`): instant same-browser (<10ms)
- **Edge Runtime API** (`/api/gtp/live`): in-memory cache, 200ms polling for cross-device
- Admin `pushToLive()` sends: asset, round, S, scores, agents, agentImages, logoImage, photos, roundData, canvasW, canvasH
- /live renders at admin's canvas dimensions (canvasW × canvasH) for pixel-identical output
- CSS letterboxes to fill screen without distortion

### Data Persistence
- **localStorage**: `gtp_episodes_v1` — immediate save, includes photo URLs
- **Vercel Blob**: 30s debounce server sync, strips base64 (keeps URLs)
- **Snapshots**: named saves via `POST /api/gtp?snapshot=Name`

### Photo Pipeline
1. User selects files → `compressPhoto()` (2400px max, 0.85 JPEG)
2. Upload via FormData to `POST /api/gtp/photo` → Vercel Blob
3. Returns proxy URL: `/api/gtp/img?url=<blobUrl>`
4. Auto-migration: base64 → blob URLs on component mount

## Episode Data Structure

```javascript
{
  id: timestamp,
  show: "Guess the Listing Price",
  brand: "CPS Homes",
  episode: 1,
  agents: ["Sian", "Nathan"],
  agentImages: ["/api/gtp/img?url=...", "..."],
  logoImage: "/api/gtp/img?url=...",
  scores: [0, 0],
  timerDuration: 3,
  photoDuration: 5,
  rounds: [{
    number: 1,
    propertyAgent: "Nathan",
    guesser: "Sian",
    address: "...",
    location: "...",
    beds: 3, type: "Terraced", tenure: "Freehold", addedDate: "27/03/2026",
    optionA: "£285,000", optionB: "£325,000", optionC: "£369,950",
    correctLetter: "B", correctPrice: "325,000",
    photos: ["/api/gtp/img?url=...", ...],
    heroPhotoIndex: 0,
    rightmoveUrl: "https://...",
    notes: "..."
  }, ...]
}
```

## S State Object (canvas params)

```javascript
{
  showTitle, introEpisode,
  propRound, propAddress, optionLocation,
  propBeds, propType, propTenure, propAddedDate,
  optionA, optionB, optionC,
  revealLetter, revealPrice,
  lockAgent, lockLetter,
  score1, score2,
  timerDuration, photoDuration,
}
```

## Export Functions

| Button | Output | Description |
|--------|--------|-------------|
| **Export PNG** | Single PNG | Current asset at p=1 |
| **Export WebM** | Single WebM | Animated recording of current asset |
| **Export Round** | 8 PNGs | Full show sequence for current round |
| **Export All (ZIP)** | ZIP file | Intro + 8 slides per round (numbered for sort order) |
| **iPad PDF** | PDF | Cheat sheet with round details for host |

## Known Patterns & Gotchas

- **Stale closures**: Use `renderRef.current(p)` and `pushToLiveRef.current()` for animation ticks and timeouts
- **Module-level EPISODE**: Shared across draw functions, synced via useEffect. Display mode populates from `roundData`
- **Auto-sync disabled in liveMode**: Score changes and round switches need explicit `pushToLive()` calls
- **Display key**: Prevents polls from restarting animations. Uses `ts` for sequence assets, round-only for property, scores for scoreboard
- **Edge cache never expires**: Serves stale data rather than blanking the display
- **lockLetter starts empty**: Shows "IS THINKING..." until admin selects A/B/C
