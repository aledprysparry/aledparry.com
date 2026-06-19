# Design principles — Graphics Engine templates

**This is the design law for every canvas template in this engine** (the
Cwis Bob Dydd scoreboard + carousel, and anything added later). Treat it as
binding, not aspirational. If a slide could be mistaken for a Canva
template, it is **not finished**.

Benchmark quality: Apple, Airbnb, Spotify, Nike, premium SaaS. The work must
look like a top-tier agency made it and would confidently show a paying
client.

## The one non-negotiable rule

**Every design must have a "thumb-stopping element"** — a visual device,
statistic, contrast, image treatment, layout choice, or typography treatment
that creates curiosity and makes someone pause mid-scroll. No thumb-stopper =
not done.

In this engine that is usually: the oversized condensed headline, the gold
medal/pill against royal indigo, a big number (score), or a curiosity-gap
hook ("Pwy sydd ar y brig?").

## Principles (apply to every slide)

- **Premium, intentional, never template-driven.** Every element earns its
  place. No decorative filler.
- **Instant comprehension (1–2s):** what is this · why care · what to do.
- **Hierarchy, ranked:** 1) primary message 2) supporting info 3) branding
  4) secondary detail. Size, weight, colour and position must reflect that
  order — secondary detail (dates, handles) recedes; it never competes.
- **Whitespace is a tool,** not a gap to fill. Do not invent decorative
  dividers/rules/boxes to occupy empty space — confident spacing reads
  premium; arbitrary dashes read amateur.
- **Mobile-first + thumbnail-legible:** must work at small size and while
  scrolling. Keep content off the edges (use the frame/safe-area).
- **Colour is strategic:** one clear focal point; gold accents only on the
  thing you want tapped/read; never decoratively.
- **Typography does the work:** strong contrast between heading / sub /
  label; never use effects to compensate for weak hierarchy.

## Banned (these read cheap / template-like)

- Floating decorative rules or dashes with no function.
- Faint, barely-visible boxes/pills (low-contrast chips that look like a
  smudge). A chip must be either clearly defined or dropped for a clean label.
- Two elements competing for the same focal weight.
- Text crammed to the canvas edge.
- Duplicated copy (every on-canvas line is a distinct field).

## QC checklist (run before shipping any template change)

- [ ] One clear focal point / thumb-stopper.
- [ ] Message understood in 1–2 seconds.
- [ ] Feels premium — agency-presentable.
- [ ] Nothing decorative-only; nothing competing; nothing crammed.
- [ ] Hierarchy correct (secondary detail recedes).
- [ ] Works at thumbnail size and on all five ratios (FramedRenderer).
- [ ] Could not be mistaken for a stock Canva template.

## How it's enforced in code

- Shared brand system: `lib/carousel/brandPaint.ts` (palette, fonts,
  background, logo). Don't hand-roll brand styling per slide.
- Ratio-robust layout: `lib/carousel/framedRenderer.ts` (centred 4:5 design
  frame; background full-bleed) — keeps every ratio composed, not stretched.
- In-app check: the editor **Review** panel (deterministic preflight + AI
  vision critique) reviews slides against these principles per format.
