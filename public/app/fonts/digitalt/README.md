# Digitalt (display font)

Digitalt is the chunky display face used for the Cwis Bob Dydd numerals and
headings (the big scores, the "LAST WEEK'S LEADERBOARD" title).

It is **open source** — by gluk ([glukfonts.pl](https://www.glukfonts.pl/font.php?font=Digitalt)),
released under the **SIL Open Font License 1.1** (see `OFL.txt`). So it's
bundled here directly:

```
digitalt.woff2   ← self-hosted, registered via FontFace in brandAssets.ts
OFL.txt          ← the licence (must accompany the font)
```

`ensureAssets()` loads it, and the templates draw with the stack
`Digitalt, Rubik, …` — so the display text renders in real Digitalt, with
self-hosted Rubik as the fallback if the file is ever missing.

To update it: download the latest from glukfonts.pl, convert the TTF to
woff2 (`fonttools`: `TTFont('Digitalt.ttf').save('digitalt.woff2')` with
`flavor='woff2'`), and replace `digitalt.woff2`.
