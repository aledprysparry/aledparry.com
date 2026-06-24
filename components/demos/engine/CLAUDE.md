# Postio — engine working agreement (READ BEFORE EDITING)

This is the Postio app (the "engine" SPA), mounted at `/app/postio`. Multiple
AI sessions work on Postio in parallel. To stop them clobbering each other (it
has happened repeatedly: same-file edits, entangled commits, surprise prod
deploys), every session MUST follow the protocol below. No exceptions.

## Parallel-session protocol (the important bit)

1. **Work in your OWN git worktree on your OWN branch.** Never edit the shared
   root checkout. Create one:
   `git worktree add ../aledparry-<topic> -b postio/<topic>`
   The root checkout (`~/Documents/GitHub/aledparry.com`) belongs to the
   INTEGRATOR and stays on a clean `main` - it is not a place to do feature work.

2. **Never push to `main`. Never commit on `main`.** Branch -> open a PR ->
   the integrator reviews + merges. (Vercel auto-deploys on push to `main`, so a
   stray push ships everyone's half-finished work. PRs do not deploy; the merge
   does, and that is gated.)

3. **One integrator owns merges.** A single session (currently the managing
   Postio session) rebases each branch onto `main`, resolves conflicts once, and
   merges via PR. Individual sessions do not self-merge to `main`.

4. **Scope is partitioned - do not edit another session's area.** Ownership:
   - `components/coach/*`, `lib/coach/*` -> Postio Coach
   - `components/Stage.tsx`, `FreeformEditor.tsx`, `lib/canvas/*`, `lib/freeform/*` -> editor/text session
   - `lib/templates/registry.ts`, `lib/freeform/stillTemplates.ts` -> templates session
   - Voice AI / intent layer -> Voice AI session
   If two pieces of work need the SAME file, serialise them (finish + merge one
   before starting the next). Do not run two sessions editing the same file at once.

5. **Shared files are high-contention - rebase first, keep commits surgical.**
   `lib/i18n/strings.ts`, `pages/BrandDetail.tsx`, `EngineApp.tsx`,
   `components/ui.tsx`, `components/AppShell.tsx`, `app/api/ai/social/route.ts`.
   Rebase on latest `main` before touching them; one small, single-purpose commit.

## House rules (all Postio work)

- Bilingual EN + CY in `lib/i18n/strings.ts`. Welsh is machine-draft -> flag new
  `cy` keys for native review; never invent confident Welsh.
- No em-dashes anywhere, including comments. Dates dd.mm.yyyy.
- AI goes through the gated `app/api/ai/social/route.ts` pattern (`requireGate`
  from `lib/postioGate.ts`, `ANTHROPIC_API_KEY`), structured JSON out. Latest
  Claude models. Never auto-publish / auto-post - human approves every output.
- Data persists to localStorage (`cg.v1.*`) today; Supabase backend (M0) is
  pending. Shape new data models backend-ready.
- TypeScript must compile (`npx tsc --noEmit`); `npm run build` stays green.
  NEVER run `npm run build` while a `next dev` preview is live (it corrupts
  `.next`: stop the preview, `rm -rf .next`, restart).
- Design system: light + dark, brand = Tailwind `violet`, neutrals = `zinc`,
  Geist font. Tokens in `LIGHT_THEME_SPEC.md`; quality bar in
  `DESIGN_PRINCIPLES.md`. Verify in light + dark, EN + CY.

## Verify + hand back

Build green + tsc clean + a preview sweep, then open a PR and hand back to the
integrator. Do not merge your own branch to `main`.
