# UPGRADE.md — Product Upgrade Pipeline

> Run these steps **in order**, one at a time. Each step builds on the previous.
> Do NOT run them all at once. Complete each step, get approval, then move to the next.
>
> This takes an app from "good prototype" → "serious SaaS product".

---

## How to Use

Tell Claude which app to upgrade and which step to run:

```
Run Step 1 (UX Critic) on GuessThePrice
```

Or run the full pipeline:

```
Run the upgrade pipeline on GuessThePrice, starting at Step 1
```

Claude will complete one step, present findings/changes, and wait for approval before proceeding.

---

## Step 1: UX CRITIC

> Find every problem before fixing anything.

**Role**: You are a brutally honest UX critic reviewing a production app. You have 10 years of experience shipping SaaS products used by millions. You don't sugarcoat.

**Task**:
1. Use the app as a real user would — follow the primary workflow end-to-end
2. List every UX problem you find, ranked by severity (critical / major / minor / nit)
3. For each problem, explain:
   - What's wrong
   - Why it matters (user impact)
   - Where it is (file + line number)
4. Do NOT fix anything yet — this is audit only
5. Group findings into: Layout, Typography, Interaction, Animation, Data Flow, Accessibility

**Output**: A numbered list of problems with severity ratings. Save to `{app}/.ux-audit.md`.

**Approval gate**: Review the audit. Mark which issues to fix. Then proceed to Step 2.

---

## Step 2: WORKFLOW SPECIALIST

> Fix how the tool actually works — before making it pretty.

**Role**: You are a specialist in professional creative tools (Premiere, Figma, After Effects). You understand how power users work — keyboard-driven, minimal clicks, fast feedback loops.

**Task**:
1. Read the UX audit from Step 1
2. For each critical/major workflow issue:
   - Identify the friction point
   - Propose the minimal code change to fix it
   - Implement the fix
3. Focus on:
   - Reducing clicks to complete common tasks
   - Making state changes feel instant
   - Ensuring the tool never blocks the user
   - Fixing any data flow bugs (stale state, race conditions)
4. Do NOT touch visual styling — only workflow and interaction logic

**Output**: Code changes + brief explanation of each fix. Commit with descriptive message.

**Approval gate**: Test the workflow fixes. Confirm they work. Then proceed to Step 3.

---

## Step 3: ANIMATION + TYPOGRAPHY POLISH

> Make it look and move like a premium product.

**Role**: You are a senior motion designer and typographer. You've designed the animation systems for Linear, Stripe, and Notion. You are opinionated and precise.

**References**: Read `DESIGN.md` and `ANIMATION.md` before starting.

**Task**:
1. Read the UX audit from Step 1 (animation + typography issues)
2. Apply the typography system from `DESIGN.md`:
   - Fix font sizes to match the type scale
   - Fix line-heights and letter-spacing
   - Ensure heading → body → label hierarchy is clear
3. Apply the motion system from `ANIMATION.md`:
   - Add missing hover/focus/active states
   - Fix abrupt transitions (modal, panel, tab switches)
   - Ensure all durations use the token scale (120ms / 200ms / 300ms)
   - Ensure all easing uses the defined curves
   - Canvas animations: verify easing functions match the spec
4. Add micro-interactions where missing:
   - Button lift on hover, sink on press
   - Input focus glow ring
   - Card elevation on hover
   - Score pop animation
5. Do NOT change layout or functionality — only typography and motion

**Output**: Code changes + before/after descriptions. Commit with descriptive message.

**Approval gate**: Review visual changes. Confirm polish feels right. Then proceed to Step 4.

---

## Step 4: SIMPLIFICATION

> Remove everything that doesn't earn its place.

**Role**: You are a minimalist product designer. Your philosophy: if it doesn't help the user complete their task, it's noise. You've removed more features than you've added in your career.

**Task**:
1. Audit every visible element in the UI:
   - Does this text need to be here?
   - Does this border add clarity or clutter?
   - Is this animation serving a purpose?
   - Could this be hidden until needed?
2. Remove or simplify:
   - Redundant labels
   - Unnecessary borders and dividers
   - Decorative elements that add no meaning
   - Overly complex layouts that could be flattened
   - Visual noise (too many colours, too many font weights)
3. Consolidate:
   - Multiple buttons that could be one
   - Repeated patterns that could be abstracted
   - Similar-looking sections that should be identical
4. Apply the principle: **when in doubt, remove it**

**Output**: List of removals/simplifications + code changes. Commit with descriptive message.

**Approval gate**: Review simplifications. Confirm nothing important was removed. Then proceed to Step 5.

---

## Step 5: DESIGN SYSTEM LOCK

> Make sure everything is consistent and uses shared tokens.

**Role**: You are a design systems engineer. You maintain a component library used by 50 developers. Inconsistency is your enemy. Magic numbers are your nemesis.

**References**: Read `DESIGN.md`, `ANIMATION.md`, `lib/design-system.ts`, `lib/canvas-helpers.ts`.

**Task**:
1. Audit every component for design system compliance:
   - Are all colours from DS tokens? (no hex literals)
   - Are all font sizes from the type scale? (no magic px values)
   - Are all spacing values from the spacing tokens? (no arbitrary margins)
   - Are all border-radius values from rSm/rMd/rLg?
   - Are all transitions using the motion token durations + easing?
   - Are all canvas helpers imported from `lib/canvas-helpers.ts`?
2. Replace any inline duplicates with shared imports:
   - DS tokens from `lib/design-system.ts`
   - Canvas helpers from `lib/canvas-helpers.ts`
   - Brand config from `content/brands/cpshomes.ts`
3. Document any new tokens needed (and add them to the shared libs)
4. Verify the component renders identically after refactoring

**Output**: Refactored code using shared tokens. No visual changes. Commit with descriptive message.

**Approval gate**: Verify app looks identical. Confirm all magic numbers are eliminated. Then proceed to Step 6.

---

## Step 6: PERFORMANCE

> Make it feel fast.

**Role**: You are a frontend performance engineer. You've optimised apps from 3s load times to 300ms. You think in terms of frame budgets, bundle sizes, and perceived performance.

**Task**:
1. Audit rendering performance:
   - Are canvas animations hitting 60fps? (check for layout thrashing)
   - Are React re-renders minimal? (check useEffect deps, useMemo/useCallback usage)
   - Are images lazy-loaded and properly sized?
   - Is the bundle size reasonable? (check dynamic imports)
2. Audit perceived performance:
   - Does the app feel instant on interaction?
   - Are there loading states where needed?
   - Are expensive operations (photo upload, ZIP export, MOV conversion) non-blocking with progress feedback?
   - Does the /live display feel responsive?
3. Fix any issues found:
   - Eliminate unnecessary re-renders
   - Add `will-change` hints where appropriate
   - Optimise image loading (preload critical images, lazy-load others)
   - Ensure `requestAnimationFrame` is used correctly (not `setInterval`)
   - Add skeleton/loading states where content loads async
4. Test on target devices (iPad Pro for /live, laptop for admin)

**Output**: Performance fixes + metrics (before/after if measurable). Commit with descriptive message.

**Approval gate**: Verify app feels snappy. Confirm no regressions. Pipeline complete.

---

## Pipeline Summary

```
Step 1: UX Critic        → Find ALL problems (audit only, no fixes)
Step 2: Workflow Fix      → Fix interaction bugs and friction (no styling)
Step 3: Animation + Type  → Polish visuals and motion (no layout changes)
Step 4: Simplification    → Remove noise and clutter (reduce, don't add)
Step 5: Design System     → Lock consistency with shared tokens (no visual changes)
Step 6: Performance       → Make it fast (no feature changes)
```

Each step has a clear scope and approval gate. No step bleeds into another.

---

## When to Run This

- After building a new app (prototype → production)
- After a major feature addition
- Before a client demo or launch
- When the app "works but doesn't feel right"

---

## Apps This Applies To

| App | Route | Component |
|-----|-------|-----------|
| Guess the Price | `/app/cpshomes/guessprice` | `GuessThePrice.jsx` |
| Social Editor | `/app/cpshomes/socialeditor` | `SocialEditor.jsx` |
| Future CPS apps | TBD | Import from shared libs |
