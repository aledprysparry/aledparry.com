# Social Editor — Project Specification

> AI-powered social media graphics editor that generates branded templates from video transcripts.
> Built as a single-page React app within a Next.js 14 site.

---

## 1. What It Does

1. User uploads an **SRT subtitle file** (or video for auto-transcription)
2. AI (Claude) analyses the transcript and suggests **20-30 graphic moments**
3. User reviews, edits, reorders, adds, or removes graphics
4. System renders branded graphics on **HTML5 Canvas** in 3 aspect ratios
5. User exports as **PNG stills**, **PNG sequences**, **animated WebM**, **Premiere XML**, or **composite video**

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router), React 18, TypeScript |
| Rendering | HTML5 Canvas 2D (no WebGL) |
| AI | Claude Sonnet via `/api/ai` proxy |
| Fonts | Google Fonts (DM Sans + Lora) loaded via `<link>` |
| Export | JSZip, file-saver, docx (Word cue sheets) |
| Conversion | @ffmpeg/ffmpeg (wasm, not yet wired) |
| State | localStorage (brands + projects), no database |
| Deployment | Vercel |

---

## 3. File Structure

```
components/demos/SocialEditor.jsx    # ~4000 lines, the entire app
public/demos/
  cpshomes-logo-teal.png             # Logo for light backgrounds
  cpshomes-logo-white.png            # Logo for dark backgrounds
  cpshomes-logo-teal-sm.png          # Optimised versions
  cpshomes-logo-white-sm.png
app/api/ai/route.ts                  # Claude API proxy
app/api/transcribe/route.ts          # Whisper transcription proxy
app/api/studio/route.ts              # Project sync (disabled)
```

---

## 4. Templates (16)

### Fullscreen (replace video entirely)

| Template | Purpose | Key Fields |
|----------|---------|------------|
| `myth` | False statement with X icon | `body` |
| `reality` | Correction with check icon | `body` |
| `title` | Episode title card | `headline, subheadline, body, number` |
| `rule_number` | Numbered rule | `number, body` |
| `key_point` | Key statement on forest green | `headline, body, number, strikeNumber` |
| `endboard` | End card with CTA | `headline, body, handle` |

### Overlay (transparent, sits over video)

| Template | Purpose | Key Fields |
|----------|---------|------------|
| `fact_box` | Label + detail | `headline, body` |
| `speech_bubble` | Question bubble | `text` |
| `stat` | Large stat value | `stat, label` |
| `timeline` | Timeline with markers | `label, markers[]` |
| `landlord_ask` | Landlord perspective (right side) | `text` |
| `tenant_ask` | Tenant perspective (left side) | `text` |
| `subscribe` | Subscribe CTA | `text, handle` |
| `lower_third` | News-style name strap | `name, title, company` |
| `advice` | Advice card with lightbulb | `text` |

### Special
| Template | Purpose |
|----------|---------|
| Title Card | From Brand Assets panel, per-project override |

---

## 5. Brand System

### Brand Model (40+ fields)

```javascript
{
  // Identity
  name: "CPS Homes",

  // Colours
  colorPrimary: "#1a5c5e",     // Teal
  colorAccent: "#FB8770",       // Salmon
  colorPositive: "#83A381",     // Sage green
  colorWarm: "#f0e1d3",         // Cream background
  colorForest: "#4a6741",       // Forest green (key_point bg)
  colorText: "#ffffff",

  // Typography
  fontFamily: "DM Sans",        // Body/UI
  fontSerif: "Lora",            // Headlines (substitute for Nantes)
  typeScale: 1.0,
  lineHeight: 1.15,
  headingWeight: "700",

  // Logo
  logoDataUrl: "/demos/cpshomes-logo-teal.png",
  logoDataUrlLight: "/demos/cpshomes-logo-white.png",
  logoSize: 0.10,
  logoPosition: "br",           // bottom-right

  // Title Card
  titleCardStyle: "split",      // bar | centred | split
  titleCardSeriesName: "",
  titleCardTitle: "EPISODE TITLE",
  titleCardSubtitle: "",

  // Endboard
  endboardCTA: "Like and subscribe for more",
  endboardHandles: "@cpshomes",
  endboardWebsite: "cpshomes.co.uk",
  endboardStyle: "logo",        // logo | grid | minimal

  // Captions
  captionFontSize: 64,
  captionBgOpacity: 0.85,
  captionPosition: "bottom",
  captionStyle: "tiktok",       // karaoke | popin | tiktok | fade
}
```

### Version System
- `BRAND_VERSION` constant in code (currently v8)
- On load, compares stored version vs code version
- If mismatch, reseeds from `BRAND_PRESETS`
- Prevents stale localStorage from overriding code updates

### Dual Logo
- Light backgrounds: teal logo (`logoDataUrl`)
- Dark backgrounds: white logo (`logoDataUrlLight`)
- `stamp()` function auto-selects based on `isDark` parameter

---

## 6. Canvas Rendering

### Core Function: `drawGraphic(canvas, graphic, brand, ratio, progress)`

- **canvas**: HTMLCanvasElement
- **graphic**: `{template, content, type, ...}`
- **brand**: brand object
- **ratio**: "16:9" | "1:1" | "9:16"
- **progress**: 0-1 (entrance animation), >1 (ambient/wave drift)

### Key Helpers

| Function | Purpose |
|----------|---------|
| `DT(text, x, y, maxW, maxH, fontSize, weight, align, color, maxLines, fontFamily)` | Draw multi-line text with auto-sizing and balanced line-breaking |
| `stamp(ctx, brand, W, H, isDark)` | Draw logo watermark |
| `rrPath(ctx, x, y, w, h, radii)` | Rounded rectangle path |
| `drawIcon(ctx, type, x, y, size, color, innerColor)` | Draw icon (check, cross, info, lightbulb, etc.) |
| `drawWaves(...)` | Animated sine waves (inline in each template) |

### Responsive Scaling

```javascript
const sc = Math.min(W, H) / 1080;  // Scale factor
const isCompact = W <= H;           // true for 1:1 and 9:16
const isPortrait = H > W;           // true for 9:16 only
```

### Text Rendering

- `textBaseline: "top"` for predictable Y positioning
- Balanced line-breaking: prefers splits before conjunctions (but, and, or, for, with)
- Auto font-sizing: shrinks to fit `maxH` constraint
- `document.fonts.ready` awaited before all renders
- Manual line breaks: `\n` in content text forces line breaks

### Animation System

- **Entrance** (0→1): Elements fade/slide in with easeBack easing
- **Cascading**: headline → icon → rule → body (staggered by 0.15)
- **Ambient** (>1): Wavy lines keep drifting at 0.04x speed
- **Endboard pulse**: CTA text gently pulses (amplitude ramps in over 2s)
- **Strikethrough**: Ghost number gets salmon line drawn across, then fades to new number

---

## 7. Export Pipeline

### Formats

| Format | Description | Use Case |
|--------|-------------|----------|
| PNG stills | One image per graphic | Quick review, print |
| PNG sequences | 25fps numbered frames in zip | Premiere import |
| WebM | 4s animated video per graphic | Premiere overlay |
| Composite WebM | Single video with all graphics timed | Quick rough cut |
| Premiere XML | Pre-built sequence with timecodes | Professional workflow |
| Word cue sheet | Table with timecodes + content | Editor reference |

### Recording: `recordGraphic(graphic, brand, ratio)`

```javascript
// Wall-clock timing for accurate duration
const startT = performance.now();
const durMs = Math.max(4000, (g.duration || 4) * 1000);
const rec = new MediaRecorder(cvs.captureStream(0), {...});
// requestAnimationFrame loop until elapsed >= durMs
```

### Multi-Ratio Export
- User selects any combination of 16:9, 1:1, 9:16
- Each ratio exports separately with ratio prefix in filenames
- Folder structure: `{ratio}/{index}_{label}/frame_0000.png`

---

## 8. AI Integration

### Transcript Analysis

```
System prompt (GFX_PROMPT):
"Generate 20-30 graphic suggestions from this transcript.
Return JSON array with timestamp, duration, template, content fields.
Be generous — better to suggest too many than too few."
```

### Per-Graphic Regeneration

```
System prompt (SEGMENT_PROMPT):
"Generate exactly ONE graphic for this moment.
Template hint: {template}
Context: {nearby transcript lines}"
```

### Model
- Claude Sonnet via `/api/ai` proxy
- Max tokens: 4000 (batch) / 1000 (single)

---

## 9. State Management

### localStorage Keys

| Key | Contents |
|-----|----------|
| `infostudio_brands_v1` | Array of brand objects |
| `infostudio_projects_v1` | Array of project objects |
| `infostudio_bv` | Brand version number |

### Project Structure

```javascript
{
  id: "timestamp-based-id",
  brandId: "brand-ref",
  name: "Rent Increases 2026",
  srt: "raw SRT text",
  subtitles: [{index, start, end, startSec, endSec, text}],
  graphics: [{id, timestamp, duration, type, template, content, label}],
  selected: [0, 1, 2, ...],  // selected graphic indices
  previews: {},                // ephemeral preview dataURLs
  titleCardOverride: null,     // per-project title card edits
  videoUrl: null,              // blob URL if video attached
}
```

### Auto-Sort
Graphics always sorted by timecode on every update (setGraphics).

---

## 10. UI Architecture

### Tabs
1. **Graphics** — AI analysis, preview list, edit panel, video preview
2. **Export** — format selection, ratio selection, progress, download

### Design System (DS object)
- Dark theme: `#0a0f1a` page background
- Glassmorphic cards with `backdrop-filter: blur(12px)`
- Gradient header with brand accent
- DM Sans as UI font throughout
- Button hierarchy: primary (teal fill), positive (green), danger (red), ghost

### Key Components

| Component | Purpose |
|-----------|---------|
| `App` | Root: brand/project management, URL hash routing |
| `ProjectView` | Single project: tabs, SRT upload, graphics |
| `GraphicsTab` | AI analysis, graphics list, edit panel |
| `ExportTab` | Export options, progress, download |
| `AddGraphicModal` | Manual graphic creation form |
| `SegmentEditPanel` | Per-graphic editor (template, content, AI prompt) |
| `GraphicAnimPreview` | Animated canvas preview loop |
| `BrandEditor` | Brand settings editor |

---

## 11. How to Duplicate for a New Client

### Step 1: Add Brand Preset
In `BRAND_PRESETS` object, add a new entry:
```javascript
"New Client": {
  colorPrimary: "#...",
  colorAccent: "#...",
  fontFamily: "...",
  fontSerif: "...",
  // ... all brand fields
}
```

### Step 2: Add Logo Files
Place in `/public/demos/`:
- `newclient-logo-dark.png` (for light backgrounds)
- `newclient-logo-light.png` (for dark backgrounds)

### Step 3: Add Route
In `app/(site)/app/[client]/[tool]/page.tsx`, the dynamic route already handles any client slug. Just navigate to:
```
/app/newclient/socialeditor
```

### Step 4: Update Client Seed Buttons (optional)
Add a "+ Client v1" button with pre-loaded graphics specific to their content.

### Step 5: Bump BRAND_VERSION
Increment `BRAND_VERSION` to force fresh preset seeding.

---

## 12. Known Issues

| Issue | Status |
|-------|--------|
| MOV conversion (ffmpeg.wasm) | Installed, not wired up |
| Add Graphic modal may crash | Needs investigation |
| Title card edits via Brand Assets get wiped | Use EPISODE OVERRIDE instead |
| Server sync (/api/studio) | Disabled — was overriding brands |
| Preview thumbnails slightly soft | Rendering at display size, not export size |

---

## 13. Dependencies

```json
{
  "docx": "Word document generation",
  "file-saver": "Client-side file downloads",
  "jszip": "ZIP file creation",
  "@ffmpeg/ffmpeg": "Browser-side video conversion (wasm)",
  "@ffmpeg/util": "FFmpeg utilities",
  "next-mdx-remote": "MDX rendering (site-wide)",
  "gray-matter": "Frontmatter parsing (site-wide)"
}
```

---

## 14. API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai` | POST | Proxy to Claude API |
| `/api/transcribe` | POST | Proxy to OpenAI Whisper |
| `/api/studio` | GET/POST | Project sync (disabled) |

---

*Last updated: March 2026*
*Built by Aled Parry with Claude*
