# Welsh review - Postio template library (machine draft)

All `cy` strings below were machine-drafted for the new universal template
library (built 22.06.2026). They follow the house naturalised-Welsh standard as
a first pass only and **must be reviewed by a native Welsh editor before any
real demo or client share** (house rule). Apply corrections to the source files
listed against each group.

House copy rules apply: no em-dashes (use hyphen / rephrase), dates dd.mm.yyyy.

---

## 1. Template names + descriptions - `lib/i18n/strings.ts` (cy block)

| key | EN | CY (draft) |
|---|---|---|
| still-quote.name | Quote card | Cerdyn dyfyniad |
| still-quote.desc | A bold pull-quote set large... | Dyfyniad cryf wedi'i osod yn fawr, gyda marc acen a chydnabyddiaeth dawel. |
| still-stat.name | Big stat | Ffigwr mawr |
| still-stat.desc | One oversized number... | Un rhif anferth fel y prif beth, gydag un llinell o gyd-destun. |
| still-announcement.name | Announcement | Cyhoeddiad |
| still-announcement.desc | A tagged headline post... | Post pennawd a thag ar gyfer newyddion a lansiadau, gydag galwad i weithredu. |
| still-event.name | Event | Digwyddiad |
| still-event.desc | Title plus date, time and place... | Teitl ynghyd a dyddiad, amser a lleoliad, wedi'u gosod yn glir. |
| still-tip.name | Tip / how-to | Awgrym |
| still-tip.desc | A single useful tip... | Un awgrym defnyddiol, a thag ac wedi'i osod yn fawr, gydag ychydig o gyd-destun. |
| still-testimonial.name | Testimonial | Adolygiad |
| still-testimonial.desc | A five-star review quote... | Dyfyniad pum seren gydag enw a rol y cwsmer. |
| still-poll.name | Question / poll | Cwestiwn / pol |
| still-poll.desc | A question with two option chips... | Cwestiwn gyda dau opsiwn i ennyn ymateb a rhannu. |
| still-live.name | Now live / CTA | Yn fyw nawr |
| still-live.desc | A live badge... | Bathodyn byw, pennawd cryf a botwm galw-i-weithredu y gellir ei dapio. |
| still-before-after.name | Before & after | Cyn ac wedyn |
| still-before-after.desc | A two-panel before/after split... | Hollt cyn-ac-wedyn dau banel wedi'i rannu gan reol acen. |
| still-milestone.name | Milestone / thank-you | Carreg filltir / diolch |
| still-milestone.desc | A celebratory milestone number... | Rhif carreg filltir i ddathlu, gyda llinell ddiolch gynnes. |
| still-fact.name | Did you know? | A wyddoch chi? |
| still-fact.desc | A surprising fact... | Ffaith annisgwyl, a thag ac wedi'i gosod yn fawr, gyda llinell ffynhonnell. |
| universal-listicle.name | Listicle | Rhestr |
| universal-listicle.desc | A cover, three big-number points... | Clawr, tri phwynt a rhifau mawr a galwad i weithredu - rhestr rifol gwerth ei chadw. |
| universal-explainer.name | Mini-explainer | Eglurhad byr |
| universal-explainer.desc | A cover, three numbered steps... | Clawr, tri cham wedi'u rhifo gyda bar cynnydd a galwad i weithredu. |
| universal-before-after.name | Before & after carousel | Carwsel cyn ac wedyn |
| universal-before-after.desc | A cover plus a before slide... | Clawr ynghyd a sleid cyn a sleid wedyn - stori drawsnewid. |
| universal-animated.name | Animated statement | Datganiad animeiddiedig |
| universal-animated.desc | A bold statement that animates in... | Datganiad cryf sy'n animeiddio i mewn ar liw eich brand - capsiwn dolennog ar gyfer Reels, TikTok a Shorts. |

## 2. Copy-field labels - `lib/i18n/strings.ts` (cy block, `copy.f.*`)

kicker=Tag · subtitle=Is-deitl · point1/2/3=Pwynt 1/2/3 · step1/2/3=Cam 1/2/3 ·
ctaHeadline=Pennawd galw-i-weithredu · ctaSub=Is-destun galw-i-weithredu ·
link=Dolen / enw · beforeLabel=Label cyn · before=Cyn · afterLabel=Label wedyn ·
after=Wedyn · caption=Capsiwn · sub=Is-destun / URL.
(`kicker` reuses the existing `copy.f.kicker`; `title` reuses `copy.field.title`=Teitl.)

## 3. Still placeholder copy - `lib/freeform/stillTemplates.ts` (`COPY` table, `cy`)

Each still seeds editable placeholder text. Review the `cy` half of the `COPY`
object - quote, stat, announcement, event, tip, testimonial, poll, live,
beforeAfter, milestone, fact. Note: `still-event` dates are illustrative
(`Sadwrn 12 Gorffennaf`) and the user edits them per post.

## 4. Carousel placeholder copy - `lib/carousel/universal.ts`

`LISTICLE_COPY.cy`, `EXPLAINER_COPY.cy`, `BEFORE_AFTER_COPY.cy` - cover titles,
points/steps, before/after lines and CTAs. Handles use `@eichbrand` as a
placeholder.

## 5. Animated placeholder copy - `lib/carousel/animated.ts`

`UNIVERSAL_ANIMATED_COPY.cy` - kicker `Eich brand`, caption `Dwedwch un peth
cryf.`, sub `eichbrand.com`.

---

### Known points to check
- `still-testimonial` named **Adolygiad** (review) rather than *Tystiolaeth* -
  confirm which reads best for a social context.
- `copy.f.kicker` = **Tag** (loanword) - confirm or replace with a Welsh term.
- Verb forms / mutations in the imperative placeholder lines (e.g.
  *Dechreuwch*, *Sweipiwch*, *Cadwch*) - confirm register (informal vs formal).
