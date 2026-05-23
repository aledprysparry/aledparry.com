# aledparry.com — Project Guide

## Overview
Personal portfolio site for Aled Parry — bilingual (EN/CY) Next.js 14 app with MDX case studies, interactive demos, and a Pong-powered holding page. Deployed on Vercel.

## Tech Stack
- **Framework**: Next.js 14.2.35 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS 3.4.1 (custom fonts: Playfair Display + Inter)
- **Content**: MDX via next-mdx-remote + gray-matter frontmatter
- **Email**: Resend (contact form)
- **Analytics**: Vercel Analytics
- **Deployment**: Vercel (ESLint disabled in builds — see next.config.mjs)

## Project Structure
```
app/
├── (site)/          # Public pages: home, about, services, contact, work/[slug]
├── app/             # Demo apps: index + [client]/[tool] dynamic routes + custom routes
├── admin/           # Password-protected case study creation form
├── api/             # contact/ + admin/project/ endpoints
├── layout.tsx       # Root layout (fonts, analytics, metadata)
├── robots.ts        # SEO
├── sitemap.ts       # Dynamic sitemap
└── not-found.tsx    # 404

components/
├── layout/          # Header, Footer
├── sections/        # Page sections (heroes, grids, carousels, forms)
├── ui/              # Reusable primitives (Button, Card, Badge, FadeIn, PongBackground)
└── demos/           # Demo app components (SocialEditor, MasteryCompanion, PMA, KeepItLocal)

content/
├── case-studies/    # MDX files with frontmatter (title, client, year, stats, etc.)
├── i18n/            # en.ts, cy.ts, types.ts
└── demos.config.ts  # Central demo registry

lib/
├── mdx/             # get-case-studies.ts, get-case-study.ts, types.ts
├── i18n/            # context.tsx (LanguageProvider + useLanguage hook)
├── hooks/           # use-in-view.ts (Intersection Observer)
└── mdx-components.tsx

scripts/
└── add-demo.mjs     # CLI: npm run add-demo
```

## Key Patterns
- **i18n**: LanguageProvider context at root → `useLanguage()` hook in components
- **Demo loading**: `next/dynamic` with `ssr: false` + central config in `demos.config.ts`
- **Case studies**: MDX files parsed with gray-matter → typed frontmatter → React
- **Route groups**: `(site)` for marketing, `/app` for demos, `/admin` for management
- **Custom demo routes**: `/app/mastery`, `/app/pma`, `/app/keepitlocal` bypass dynamic routing

## Commands
```bash
npm run dev          # Dev server on :3000
npm run build        # Production build (ESLint ignored)
npm run add-demo     # Interactive CLI to register a new demo
```

## Current State (as of May 2026)
- Site is positioned as **Creative Technologist & Founder** portfolio (was: "freelance digital producer")
- Header + Footer render on every (site) route uniformly (no per-page hideNav)
- Homepage hero uses TetrisBackground; primary CTA links to /work, not mailto
- 9 anchor case studies (Capsiynau, Nodiadau, Cwis Bob Dydd, CPS Homes, Lean VFX, Celtic Routes, Plaid Cymru, Cwis-iau, Curiad) lead /work via the `displayOrder` frontmatter field (1-9); remaining ~36 case studies sort by year DESC below
- `/admin` writes case-study edits via the GitHub Contents API when `GITHUB_CONTENTS_TOKEN` is set — each save lands as a commit on `main` and Vercel rebuilds in ~2 min. Falls back to local fs when the env var is absent (`npm run dev` workflow). Reads also use GitHub in token mode so concurrent edits don't get stale.
- `/contact` form opens a `mailto:hello@aledparry.com` composer instead of POSTing — `/api/contact` (Resend) was never configured. The route is still in the tree for a future Resend wire-up.
- Card + HeroImage components render a stone gradient block for any heroImage path containing "placeholder" or that 404s; no broken-image icons.

## Conventions
- Bilingual content: always provide EN + CY translations
- Case study frontmatter: title, client, year, role, type, featured, heroImage, stats[], testimonial, optional `displayOrder` (number; lower = higher in /work grid)
- Demo config: update `content/demos.config.ts` when adding demos
- Components use `"use client"` directive for interactive features
- Tailwind custom colors: accent shades are slate-gray (#64748b, #94a3b8, #475569)
- Em-dashes (`—`) are house-banned in copy + comments. Use en-dash (`–`), hyphen, or rephrase.
- Welsh translations should be naturalised, not literal — see `~/.claude/rules/welsh-language.md` for the standard.

## Env vars (Vercel + .env.local)
- `ADMIN_PASSWORD` — gates `/admin` (also expected as `x-admin-password` header on /api/admin/*)
- `GITHUB_CONTENTS_TOKEN` — when set, admin saves commit to GitHub via Git Data API; reads use Contents API. Token needs `Contents: Read+Write` on this repo (fine-grained PAT) or `repo` scope (classic PAT)
- `RESEND_API_KEY` + `CONTACT_EMAIL` — currently unset. Contact form uses mailto: instead.
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob (used by some demos)
- `ANTHROPIC_API_KEY` — used by /api/ai routes
