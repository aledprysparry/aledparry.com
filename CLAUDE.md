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

## Current State (as of March 2026)
- Homepage is a **holding page** with interactive Pong background game
- Full site pages (about, services, work, contact) exist but homepage routes to holding page
- 3 new case studies untracked: bbc-digital-campaign, cyw, sesame-street-cymru
- Old `/demos/` route directory is untracked (superseded by `/app/`)
- SocialEditor.tsx placeholder exists alongside full .jsx implementation

## Conventions
- Bilingual content: always provide EN + CY translations
- Case study frontmatter: title, client, year, role, type, featured, heroImage, stats[], testimonial
- Demo config: update `content/demos.config.ts` when adding demos
- Components use `"use client"` directive for interactive features
- Tailwind custom colors: accent shades are slate-gray (#64748b, #94a3b8, #475569)
