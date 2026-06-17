# Digitalt (display font)

Digitalt is the chunky display face used for the Cwis Bob Dydd numerals and
headings (the "7/10", "CWIS BOB DYDD"). It is a **commercial font**
(Mostardesign) — it is not bundled here and can't be fetched automatically
for licensing reasons.

To activate it:

1. Convert/obtain a **web** build of the weight you licensed and name it:

   ```
   public/app/fonts/digitalt/digitalt.woff2
   ```

   (woff2 is what `brandAssets.ts` loads. A heavy/black weight matches the
   brand best.)

2. That's it — `ensureAssets()` registers it via `FontFace` and the Weekly
   Scoreboard uses it for the title, rank numbers and scores.

Until the file is present, display text falls back to **Rubik** at weight 900
(self-hosted under `../rubik/`), which is a close visual match.
