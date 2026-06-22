# Welsh review - Postio template library

Status: **reviewed 22.06.2026** (Welsh-linguist pass against the house
naturalised-Welsh standard; no em-dashes, dates dd.mm.yyyy). The machine-draft
`cy` strings for the universal template library (built 22.06.2026) have been
corrected in source. A final read by a human native editor before a high-stakes
client share is still welcome, but the strings below are no longer machine
drafts.

Corrections applied to:
- `lib/i18n/strings.ts` (template names/descriptions, `copy.f.kicker`)
- `lib/freeform/stillTemplates.ts` (`COPY` table, `cy`)
- `lib/carousel/universal.ts` (`EXPLAINER_COPY.cy`)
- `lib/carousel/animated.ts` (`UNIVERSAL_ANIMATED_COPY.cy` - read clean, no change)

## Decisions on the flagged points

- **Testimonial name** kept as **Adolygiad** (review), not *Tystiolaeth*.
  *Adolygiad* reads as a customer review in a social context; *tystiolaeth*
  carries a legal/religious "testimony" weight that is wrong here.
- **`copy.f.kicker`** changed from the loanword **Tag** to **Pennyn** (the Welsh
  term for a heading/strapline). Avoids the loanword and does not collide with
  the before/after fields, which already use *Label cyn* / *Label wedyn*.
- **Imperative register** confirmed as polite-plural (*chi*) throughout
  (*Dechreuwch, Sweipiwch, Cadwch, Gwnewch*), consistent with the rest of the
  Postio UI. No change.

## Substantive copy changes (beyond mutation/idiom tidy-ups)

- `still-quote.desc`: "marc acen … dawel" → "acen liw … gynnil" (the design's
  accent is a colour mark, and the attribution is understated, not silent).
- `still-stat.name`: *Ffigwr* → *Ffigur* (numeric-figure sense).
- `still-stat.desc`: "fel y prif beth" → "i ddal y llygad" (idiomatic
  thumb-stopper).
- `still-announcement.desc`: restored the dropped "updates" (*diweddariadau*)
  and fixed *gydag galwad* → *gyda galwad*.
- `still-live.desc`: "pennawd cryf" → "pennawd bachog" (punchy), and
  "y gellir ei dapio" → "i'w dapio".
- `still-before-after.desc`: reworded to "Dau banel cyn-ac-wedyn wedi'u gwahanu
  gan linell liw" (clearer word order; *reol acen* → *llinell liw*).
- `still-poll.desc`: *dau opsiwn* → *dau ddewis* (native term).
- `stillTemplates.ts`: announcement sub, event kicker (*GWAHODDIAD I CHI*), tip
  sub, testimonial quote, poll question, milestone sub, fact line - all
  naturalised; *ffigwr* → *ffigur*.
- `universal.ts` explainer step2: "un cam canolbwyntiedig" → "un eisteddiad".

## Protected (not touched)

- `lib/carousel/quiz.ts` `QUIZ_COPY.cy` - S4C's own published "Cwestiwn y Dydd"
  wording. Do not change.

## Still outstanding (separate from this pack)

- New brand-detail keys in `strings.ts` (`brand.tab.content/brand/insights`,
  `brand.new.*`) are first-draft Welsh from a separate workstream and still
  carry a "flag for native review" note in source. Not part of this template
  library review.
