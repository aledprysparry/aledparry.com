# ANIMATION.md — Motion Design System

> You are a senior UI motion designer and frontend engineer.
>
> I have an existing web app that works well, but the animation and transitions feel basic, unrefined, and slightly amateur. Your job is to redesign the motion system so the app feels polished, modern, premium, and intentional.
>
> You are not redesigning the product's functionality. You are only improving how the interface moves, responds, and feels.

---

## GOAL

Create a cohesive motion design system for the app that feels smooth, subtle, elegant, and high-end — like a modern SaaS platform.

---

## MOTION PRINCIPLES

- Motion should clarify, not distract
- Every animation must have a purpose
- Avoid flashy, bouncy, game-like transitions unless explicitly justified
- Prioritise subtlety, responsiveness, and polish
- Make the interface feel faster and more refined

---

## TASK 1: AUDIT THE CURRENT ANIMATIONS

Review the app and identify:
- Abrupt transitions
- Inconsistent durations
- Overused or unnecessary animations
- Missing feedback states
- Places where animation makes the UI feel clunky or cheap

**Output the top animation issues first.**

### Current Animation Inventory

| Location | Animation | Issue |
|----------|-----------|-------|
| Canvas asset transitions | Cross-fade (400ms) | Good — keep |
| Button hover | None | Missing — needs subtle lift |
| Input focus | None | Missing — needs ring animation |
| Sidebar panel open | Instant | Abrupt — needs slide |
| Episode panel toggle | Instant | Abrupt — needs expand |
| Modal open/close | Instant | Jarring — needs scale+fade |
| Photo manager open | Instant | Needs slide-up |
| Canvas entrance animations | Various (easeOutExpo, easeOutBack) | Good for canvas — keep |
| Live mode enter/exit | Instant | Needs transition |
| Score +1 update | Instant | Needs pulse feedback |

---

## TASK 2: MOTION SYSTEM

### Duration Scale

| Token | Value | Usage | CSS Variable |
|-------|-------|-------|-------------|
| `instant` | 0ms | Checkbox, radio, toggle snap | `--motion-instant` |
| `micro` | 80ms | Colour changes, opacity on hover | `--motion-micro` |
| `fast` | 120ms | Button press, focus ring, active state | `--motion-fast` |
| `standard` | 200ms | Panel open, tab switch, tooltip show | `--motion-standard` |
| `moderate` | 300ms | Drawer slide, dropdown expand | `--motion-moderate` |
| `slow` | 400ms | Modal entrance, page transition | `--motion-slow` |
| `dramatic` | 600ms | Canvas entrance animation, celebration | `--motion-dramatic` |

**Rule**: If you can't decide, use `standard` (200ms). It's almost always right.

### Easing Curves

| Name | Value | Usage |
|------|-------|-------|
| `ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default for everything |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving (exit) |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering (entrance) |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Score pop, badge bounce |
| `ease-smooth` | `cubic-bezier(0.65, 0, 0.35, 1)` | Continuous/looping motion |

**Rule**: Use `ease-out` for entrances, `ease-in` for exits, `ease-default` for hover/focus. Never use `linear` for UI elements.

### Canvas Easing (JavaScript)

```javascript
// From lib/canvas-helpers.ts
easeOutExpo(t)    // Fast deceleration — most entrance animations
easeOutBack(t)    // Overshoot + settle — score reveals, badges
easeOutElastic(t) // Spring bounce — celebration, confetti
easeInOutCubic(t) // Smooth both ways — looping animations
```

**Rule**: Canvas animations at 60fps use these JS easing functions. UI animations use CSS easing curves. Never mix them.

---

### Hover Animations

```css
/* Standard interactive element */
.interactive {
  transition: all 120ms cubic-bezier(0.4, 0, 0.2, 1);
}
.interactive:hover {
  background: rgba(255, 255, 255, 0.06);
}

/* Button — subtle lift */
button {
  transition: transform 120ms ease-out, box-shadow 120ms ease-out, background 80ms ease;
}
button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
button:active {
  transform: translateY(0);
  box-shadow: none;
  transition-duration: 60ms;
}

/* Card — gentle elevation */
.card {
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
```

### Press/Click States

```css
/* Immediate feedback — faster than hover */
button:active {
  transform: scale(0.98);
  transition-duration: 60ms;
}

/* Toggle press */
.toggle:active {
  transform: scale(0.95);
}
```

### Page Transitions

```css
/* Content area fade on route change */
.page-enter {
  opacity: 0;
  transform: translateY(4px);
}
.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}
```

### Modal / Dialog

```css
/* Overlay */
.modal-overlay {
  opacity: 0;
  backdrop-filter: blur(0px);
  transition: opacity 300ms ease-out, backdrop-filter 300ms ease-out;
}
.modal-overlay.open {
  opacity: 1;
  backdrop-filter: blur(8px);
}

/* Container — scale up from 97% */
.modal-container {
  opacity: 0;
  transform: scale(0.97) translateY(8px);
  transition: opacity 300ms ease-out, transform 300ms ease-out;
}
.modal-container.open {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* Exit — faster than entrance */
.modal-container.closing {
  opacity: 0;
  transform: scale(0.98);
  transition-duration: 150ms;
  transition-timing-function: ease-in;
}
```

### Dropdown / Tooltip

```css
/* Dropdown — scale from top */
.dropdown {
  opacity: 0;
  transform: scaleY(0.96) translateY(-4px);
  transform-origin: top center;
  transition: opacity 150ms ease-out, transform 150ms ease-out;
}
.dropdown.open {
  opacity: 1;
  transform: scaleY(1) translateY(0);
}

/* Tooltip — fade + slight rise */
.tooltip {
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 120ms ease-out, transform 120ms ease-out;
}
.tooltip.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Accordion / Expand-Collapse

```css
.accordion-content {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 300ms cubic-bezier(0.4, 0, 0.2, 1),
              opacity 200ms ease-out;
}
.accordion-content.expanded {
  max-height: 500px; /* or measured height */
  opacity: 1;
}
```

### Loading / Skeleton States

```css
/* Skeleton pulse */
.skeleton {
  background: linear-gradient(90deg,
    rgba(255,255,255,0.04) 25%,
    rgba(255,255,255,0.08) 50%,
    rgba(255,255,255,0.04) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}
@keyframes skeleton-pulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Spinner — smooth rotation */
.spinner {
  animation: spin 600ms linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### Toast / Notification

```css
/* Enter from top-right */
.toast {
  transform: translateX(100%);
  opacity: 0;
  transition: transform 300ms ease-out, opacity 300ms ease-out;
}
.toast.visible {
  transform: translateX(0);
  opacity: 1;
}
/* Exit */
.toast.exiting {
  transform: translateX(100%);
  opacity: 0;
  transition-duration: 200ms;
  transition-timing-function: ease-in;
}
```

### Tab Switching

```css
/* Active indicator slides */
.tab-indicator {
  transition: left 200ms cubic-bezier(0.4, 0, 0.2, 1),
              width 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Tab content — cross-fade */
.tab-content {
  opacity: 0;
  transition: opacity 150ms ease-out;
}
.tab-content.active {
  opacity: 1;
}
```

### Side Panel / Drawer

```css
/* Slide from right */
.drawer {
  transform: translateX(100%);
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer.open {
  transform: translateX(0);
}

/* Overlay */
.drawer-overlay {
  opacity: 0;
  transition: opacity 300ms ease-out;
}
.drawer-overlay.open {
  opacity: 1;
}
```

---

## TASK 3: MICRO-INTERACTIONS

### Buttons

```css
/* Lift on hover, sink on press, glow on focus */
button {
  transition: transform 120ms ease-out, box-shadow 120ms ease-out, background 80ms ease;
}
button:hover { transform: translateY(-1px); }
button:active { transform: translateY(0) scale(0.98); transition-duration: 60ms; }
button:focus-visible { box-shadow: 0 0 0 2px rgba(42,157,143,0.4); }
```

### Inputs

```css
/* Glow ring on focus */
input {
  transition: border-color 120ms ease, box-shadow 120ms ease;
}
input:focus {
  border-color: rgba(42,157,143,0.5);
  box-shadow: 0 0 0 2px rgba(42,157,143,0.15);
}
```

### Toggles

```css
/* Smooth slide with colour change */
.toggle-track {
  transition: background 200ms ease;
}
.toggle-thumb {
  transition: transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toggle-thumb.active {
  transform: translateX(20px);
}
```

### Cards

```css
/* Subtle elevation on hover */
.card {
  transition: transform 200ms ease-out, box-shadow 200ms ease-out, border-color 200ms ease;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  border-color: rgba(255,255,255,0.12);
}
```

### Navigation Items

```css
/* Background highlight on hover */
.nav-item {
  transition: background 80ms ease, color 80ms ease;
}
.nav-item:hover {
  background: rgba(255,255,255,0.06);
}
.nav-item.active {
  background: rgba(42,157,143,0.12);
  color: #2A9D8F;
}
```

### Focus States

```css
/* Universal focus ring */
*:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(42,157,143,0.4);
  border-radius: inherit;
}
```

### Inline Success / Error Feedback

```css
/* Success — green flash then fade */
.field-success {
  animation: success-flash 400ms ease-out;
}
@keyframes success-flash {
  0% { box-shadow: 0 0 0 2px rgba(131,163,129,0.5); }
  100% { box-shadow: 0 0 0 2px rgba(131,163,129,0); }
}

/* Error — red shake */
.field-error {
  animation: error-shake 300ms ease-out;
}
@keyframes error-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
```

### Score +1 Feedback

```javascript
// Canvas: score number scales up then back
const scoreScale = easeOutBack(Math.min(1, scoreAnimT / 0.3));
const scoreSz = baseSz * (1 + 0.2 * (1 - scoreScale)); // 20% overshoot
```

---

## TASK 4: CONSISTENCY RULES

### Timing Consistency

| Action Type | Duration | Easing |
|-------------|----------|--------|
| Hover in | 120ms | ease-out |
| Hover out | 80ms | ease-default |
| Press | 60ms | ease-in |
| Release | 120ms | ease-out |
| Panel open | 200ms | ease-out |
| Panel close | 150ms | ease-in |
| Modal open | 300ms | ease-out |
| Modal close | 150ms | ease-in |
| Content swap | 200ms | ease-default |
| Canvas entrance | 3000ms | easeOutExpo |
| Canvas celebration | 600ms | easeOutBack |

### Scale Changes

- Button press: `scale(0.98)` — barely visible, just feels right
- Card hover: `translateY(-2px)` — subtle lift, not a jump
- Modal entrance: `scale(0.97)` → `scale(1)` — grows into place
- Score pop: `scale(0) → scale(1.15) → scale(1)` — via easeOutBack
- **Never scale above 1.2** — anything larger feels amateur

### Opacity

- Fade in: 0 → 1
- Fade out: 1 → 0
- Hover overlay: 0 → 0.06 (barely there)
- Disabled state: opacity 0.4
- Muted text: opacity 0.35
- **Never animate opacity on text** — just swap the value

### Movement Distance

- Tooltip/dropdown: **4px** translateY
- Modal: **8px** translateY
- Drawer: full width slide (translateX 100%)
- Page content: **4px** translateY on enter
- **Never exceed 16px** for subtle UI motion — larger feels sloppy

---

## TASK 5: IMPLEMENTATION

### Shared Motion Tokens (CSS)

```css
:root {
  /* Durations */
  --motion-micro: 80ms;
  --motion-fast: 120ms;
  --motion-standard: 200ms;
  --motion-moderate: 300ms;
  --motion-slow: 400ms;
  --motion-dramatic: 600ms;

  /* Easing */
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.65, 0, 0.35, 1);
}
```

### Shared Motion Tokens (JavaScript / TypeScript)

```typescript
// From lib/design-system.ts
export const MOTION = {
  micro: "80ms",
  fast: "120ms",
  standard: "200ms",
  moderate: "300ms",
  slow: "400ms",
  dramatic: "600ms",
  easeDefault: "cubic-bezier(0.4, 0, 0.2, 1)",
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  easeOut: "cubic-bezier(0, 0, 0.2, 1)",
  easeSpring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;

// Usage in inline styles:
style={{ transition: `all ${MOTION.fast} ${MOTION.easeDefault}` }}
```

### Canvas Animation Tokens

```typescript
// From lib/canvas-helpers.ts
import { easeOutExpo, easeOutBack, easeOutElastic, easeInOutCubic } from "@/lib/canvas-helpers";

// Standard canvas durations (ms)
const CANVAS_DURATION = {
  entrance: 3000,    // Asset entrance animation
  intro: 6000,       // Intro title card
  timer: 3000,       // Default countdown
  transition: 400,   // Cross-fade between assets
  celebration: 600,  // Score pop, confetti
};
```

---

## TASK 6: PERFORMANCE + UX RULES

### Performance

- Only animate `transform` and `opacity` — these are GPU-composited
- Avoid animating `width`, `height`, `padding`, `margin` — causes layout thrashing
- Use `will-change: transform` sparingly (only on elements that actually animate)
- Canvas animations: use `requestAnimationFrame`, never `setInterval`
- Keep animation frame work under 8ms (half a 60fps frame budget)

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```javascript
// JavaScript check for canvas animations
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const animDuration = prefersReducedMotion ? 0 : 3000;
```

### UX Rules

1. **Entrance animations should not block interaction** — user can click during animation
2. **Exit animations must be faster than entrance** (150ms exit vs 300ms entrance)
3. **Never delay content visibility** — show content immediately, animate decoration
4. **Stagger delays max 150ms between items** — longer feels sluggish
5. **No animation on scroll** unless explicitly requested (parallax, reveal)
6. **Touch devices**: reduce hover animations, increase tap target feedback

---

## STYLE REFERENCE

Aim for the quality level of:
- **Linear** — calm, deliberate transitions, everything feels connected
- **Notion** — instant-feeling interactions with subtle polish
- **Arc** — playful but controlled, spring easing where appropriate
- **Stripe Dashboard** — data-dense but never overwhelming, smooth state changes

The result should feel **calm, deliberate, and highly polished**.

---

## IMPORTANT

- Be opinionated — choose the best approach and implement it
- Do not give multiple stylistic options
- Keep motion minimal, premium, and purposeful
- Avoid anything that feels gimmicky
- Start by listing the top 10 animation problems in the current app, then define the motion system, then show the code changes needed
