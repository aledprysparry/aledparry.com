# Cwis Bob Dydd brand art

Drop the real brand files here and the **Weekly Scoreboard** template picks
them up automatically (no code change). Until they're present the template
falls back to a synthetic royal-indigo halftone background + a gold text
wordmark, so the build never breaks.

Expected files (exact names matter — they're referenced in
`components/demos/engine/lib/carousel/brandAssets.ts`):

| File | What it is | Notes |
|------|------------|-------|
| `logo.png` | The 3D "CWIS BOB DYDD?" speech-bubble logo | Transparent PNG. Drawn top-right, aspect preserved, ~13% of canvas height. |
| `bg-purple.png` | Royal-indigo halftone background | 1080×1350 (4:5) ideal; cover-fitted so any portrait size works. The scoreboard default. |
| `bg-cyan.png` | Cyan halftone background | Optional alternate brand background. |
| `bg-yellow.png` | Yellow halftone background | Optional alternate brand background. |

PNG (transparent where relevant) or JPG both work for the backgrounds; the
logo should be a transparent PNG.
