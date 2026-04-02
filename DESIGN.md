# DESIGN.md — UI Polish & Design System Guide

> You are a senior product designer and frontend engineer specialising in SaaS UX, typography systems, and motion design.
>
> You are reviewing an existing web app that is functionally strong but lacks visual polish, consistency, and refinement in typography and animation.
>
> Your task is to audit and redesign the UI to feel like a high-end, modern SaaS product.

---

## GOALS

- Improve typography hierarchy, spacing, and readability
- Refine animation to feel smooth, intentional, and premium
- Ensure consistency across all components
- Elevate the overall "feel" from functional to polished product

---

## PART 1: TYPOGRAPHY SYSTEM

Audit and redesign the typography system:
- Define a clear type scale (e.g. 12 / 14 / 16 / 20 / 24 / 32)
- Establish hierarchy (headings, subheadings, body, labels, metadata)
- Improve line-height, letter-spacing, and spacing between elements
- Ensure consistency across pages and components
- Recommend font pairings or confirm optimisation of existing fonts

### Current Type Scale (from `lib/design-system.ts`)

| Token | Size | Current Usage |
|-------|------|---------------|
| `fsXs` | 10px | Labels, metadata, muted text |
| `fsSm` | 11px | Button text, secondary content |
| `fsMd` | 13px | Input text, body content |
| `fsLg` | 15px | Emphasis, larger buttons |
| `fsXl` | 20px | Section headings, titles |

### Recommended Type Scale

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| `display` | 32px | 800 | 1.1 | -0.02em | Hero titles, large numbers |
| `h1` | 24px | 700 | 1.2 | -0.01em | Page headings |
| `h2` | 20px | 700 | 1.25 | 0 | Section headings |
| `h3` | 16px | 600 | 1.3 | 0.01em | Card titles, sub-sections |
| `body` | 14px | 400 | 1.5 | 0 | Body text, descriptions |
| `bodySm` | 13px | 400 | 1.4 | 0 | Secondary body text |
| `label` | 11px | 700 | 1.2 | 0.06em | Form labels (uppercase) |
| `caption` | 10px | 500 | 1.3 | 0.04em | Metadata, timestamps |

### Font Pairing

- **Primary (UI)**: DM Sans — geometric, clean, excellent for interfaces
- **Display (Canvas)**: Lora — elegant serif for headings and dramatic text
- **Mono (Code/Data)**: JetBrains Mono or DM Mono — if tabular data is displayed

---

## PART 2: SPACING & LAYOUT RHYTHM

### 4px Base Grid

All spacing should be multiples of 4px for visual consistency:

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight gaps, icon-to-text |
| `sm` | 8px | Related element spacing |
| `md` | 12px | Standard component padding |
| `lg` | 16px | Card padding, section gaps |
| `xl` | 24px | Major section separation |
| `xxl` | 32px | Page-level padding |
| `xxxl` | 48px | Hero sections, modal padding |

### Rules

1. **Component internal padding**: Use `md` (12px) or `lg` (16px)
2. **Between related elements**: Use `sm` (8px)
3. **Between groups**: Use `xl` (24px)
4. **Between sections**: Use `xxl` (32px) or `xxxl` (48px)
5. **Never use arbitrary values** — always map to a token
6. **Vertical rhythm**: Ensure text baselines align to the 4px grid

### Layout Principles

- **Content width**: Max 1200px for main content, 280px sidebar
- **Cards**: Equal padding on all sides (`lg` = 16px)
- **Forms**: Consistent label → input gap (`xs` = 4px), field → field gap (`md` = 12px)
- **Buttons**: Min height 32px (compact), 40px (standard), 48px (prominent)

---

## PART 3: MOTION & ANIMATION SYSTEM

### Duration Scale

| Token | Duration | Usage |
|-------|----------|-------|
| `instant` | 0ms | Immediate state changes (checkbox, radio) |
| `quick` | 120ms | Hover states, button press feedback |
| `normal` | 200ms | Panel open/close, tab switch |
| `slow` | 350ms | Modal entrance, page transitions |
| `dramatic` | 600ms | Hero animations, celebration effects |

### Easing Curves

| Name | CSS | Usage |
|------|-----|-------|
| `ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | General purpose |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving the screen |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering the screen |
| `ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful emphasis (scores, badges) |

### Canvas Animation Easing (from `lib/canvas-helpers.ts`)

| Function | Character | Usage |
|----------|-----------|-------|
| `easeOutExpo` | Fast start, smooth deceleration | Most entrance animations |
| `easeOutBack` | Overshoot + settle | Score reveals, badge pop-ins |
| `easeOutElastic` | Spring bounce | Celebration moments, confetti |
| `easeInOutCubic` | Smooth both ways | Continuous/looping animations |

### When to Use Motion

**DO animate:**
- State changes (hover, active, focus, disabled)
- Content entering/leaving (modals, panels, toasts)
- Data updates (score changes, progress bars)
- Canvas asset transitions (entrance animations)

**DON'T animate:**
- Text content changes (just swap it)
- Colour changes on data-heavy tables
- Anything the user does repeatedly (avoid fatigue)

### Micro-interactions

```css
/* Button hover — subtle lift */
button:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.15); }

/* Button press — slight sink */
button:active { transform: translateY(0); box-shadow: none; }

/* Input focus — glow ring */
input:focus { box-shadow: 0 0 0 2px rgba(42,157,143,0.3); border-color: rgba(42,157,143,0.5); }

/* Card hover — subtle elevation */
.card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
```

---

## PART 4: COMPONENT POLISH

### Buttons

```
Hierarchy:  Primary (CTA) → Secondary → Tertiary → Ghost
Min height: 32px (compact) / 40px (standard) / 48px (hero)
Padding:    8px 16px (compact) / 12px 24px (standard)
Radius:     8px (matches DS.rSm)
Font:       DM Sans 600, 11-13px
States:     default → hover (lift) → active (sink) → disabled (0.4 opacity)
```

### Forms

```
Label:      Uppercase, 10-11px, 700 weight, 0.06em tracking, muted colour
Gap:        4px between label and input
Input:      14px, 500 weight, 10px 13px padding, subtle border
Focus:      Teal ring (2px), brighter border
Error:      Red border + red caption below
Spacing:    12px between fields, 24px between groups
```

### Cards

```
Background: rgba(255,255,255,0.04) with backdrop blur
Border:     1px solid rgba(255,255,255,0.08)
Radius:     12px
Padding:    16px uniform
Shadow:     None at rest, subtle on hover
Spacing:    16px gap between cards
```

### Modals

```
Overlay:    rgba(0,0,0,0.75) with backdrop-filter: blur(8px)
Container:  bgModal (#111827), 16px radius, 24-32px padding
Entrance:   Scale from 0.95 + fade, 350ms ease-out
Exit:       Scale to 0.98 + fade, 200ms ease-in
Max width:  480px (small) / 640px (medium) / 800px (large)
```

### Navigation

```
Header:     Fixed, bgSurface, 1px bottom border, 48px height
Active tab: Accent underline or background highlight
Spacing:    8px gap between nav items
Hover:      Subtle background change (0.06 white overlay)
```

---

## PART 5: DESIGN PRINCIPLES

### 1. Simplicity over decoration
- Remove visual noise — every element should earn its place
- White space is a feature, not wasted space
- If in doubt, remove it

### 2. Consistency over variety
- Same padding everywhere. Same radius everywhere. Same animation everywhere.
- One button style per hierarchy level, not three variations
- Design tokens exist to be used — don't override with magic numbers

### 3. Clarity over cleverness
- Labels should describe, not decorate
- Icons need text labels (or tooltips) — never icon-only for actions
- State changes should be obvious (colour + shape, not just colour)

### Reference Level
Think **Linear**, **Notion**, **Stripe Dashboard** quality:
- Clean dark UI with purposeful colour
- Tight but breathable spacing
- Subtle motion that feels responsive, not flashy
- Typography that guides the eye naturally

---

## PART 6: IMPLEMENTATION

### Design Tokens (from shared libs)

```typescript
// Import shared design system
import { DS, btn, btnCta, btnPositive, inputS, card, label, sectionHead } from "@/cpshomes/lib/design-system";

// Import canvas helpers
import { sz, roundRect, aspect, safeZone, getCachedImage, onImageLoad, loadFont,
         easeOutExpo, easeOutBack, easeOutElastic, RATIOS } from "@/cpshomes/lib/canvas-helpers";

// Import video export
import { recordAsset, webmToMov, recordAssetAsMov } from "@/cpshomes/lib/video-export";

// Import brand
import { CPSHOMES_BRAND } from "@/cpshomes/brands/cpshomes";
```

### CSS Custom Properties (for Tailwind / global styles)

```css
:root {
  --ds-bg-page: #0a0f1a;
  --ds-bg-surface: #131a2a;
  --ds-border-subtle: rgba(255,255,255,0.08);
  --ds-accent: #1a5c5e;
  --ds-text-primary: rgba(255,255,255,0.95);
  --ds-text-muted: rgba(255,255,255,0.35);
  --ds-salmon: #FB8770;
  --ds-teal: #335F6A;
  --ds-radius-sm: 8px;
  --ds-radius-md: 12px;
  --ds-transition-quick: all 0.12s ease;
  --ds-transition-normal: all 0.2s ease;
}
```

### File Structure

```
cpshomes/
├── components/          ← GuessThePrice, SocialEditor
├── lib/
│   ├── design-system.ts ← DS tokens + style factories
│   ├── canvas-helpers.ts← Easing, shapes, sizing, image cache, font loader
│   └── video-export.ts  ← FFmpeg, WebM→MOV, asset recording
└── brands/
    ├── cpshomes.ts      ← CPS Homes brand config
    ├── CPSHOMES-BRAND-GUIDE.md
    └── GUESSPRICE-APP-GUIDE.md
```

---

## AUDIT CHECKLIST — Top 10 Issues to Fix

When auditing any component, check these first:

1. **Inconsistent font sizes** — Are you using DS tokens or magic numbers?
2. **Uneven padding** — Is padding the same on all sides of cards/containers?
3. **Missing hover states** — Does every interactive element respond to hover?
4. **Abrupt transitions** — Are state changes animated with `transQuick`/`transMed`?
5. **Poor label hierarchy** — Can you scan the page and understand the structure?
6. **Misaligned elements** — Are baselines and edges aligned to the 4px grid?
7. **Overcrowded sections** — Is there enough breathing room between groups?
8. **Inconsistent radius** — Are all corners using `rSm`/`rMd`/`rLg`?
9. **Colour overuse** — Is colour used for meaning, not decoration?
10. **Animation jank** — Are canvas animations using the correct easing functions?

---

## IMPORTANT

- Do NOT redesign functionality
- Focus purely on visual polish, UX clarity, and motion refinement
- Keep it minimal, modern, and premium
- Start by auditing the current UI and listing the top 10 issues before proposing improvements
