# Golden Set Labelling Guide

A short, opinionated guide for the producer/linguist hand-labelling the first golden set. The goal is **not** a fully verified transcript. It is a list of every named entity in 30 minutes of broadcast-quality content, with the canonical form a human would accept on delivery.

## What you're labelling

For the MVP, only four entity types:

| Type | Examples |
|---|---|
| `person` | Contributor names, presenters, talent, interviewees |
| `place` | Locations mentioned on-screen or in voiceover |
| `organisation` | Companies, broadcasters, public bodies |
| `programme_term` | Recurring titles, segment names, in-show jargon |

Anything else — general vocabulary, mutations, register — is out of scope for this round.

## How to pick the 30 minutes

- One episode from the pilot series. Not a highlights reel.
- Avoid the first or last episode of a run (atypical content).
- Prefer an episode with high contributor turnover (more name entities = more signal).

## The labelling pass

For each entity instance in the audio:

1. Find the moment in the timeline.
2. Note the start and end milliseconds (rough is fine — within a second).
3. Write the **canonical** form the broadcaster would publish. Not what the model emitted, not a phonetic spelling — what a producer would sign off.
4. Add an `entity_type`.
5. If the same person/place appears multiple times, label each occurrence separately. Repetition matters for recall calculation.

Insert one row into `golden_set` per entity instance. Two people working in parallel on the same episode and reconciling disagreements gives noticeably better results than one person working alone — budget for it if you can.

## Edge cases — decide once, document

Write the answer in the `notes` field on the affected rows so the next labeller is consistent:

- **Nicknames vs. full names.** Use the on-screen credit form. If there is no credit, use the form the contributor uses for themselves.
- **Welsh/English variants of place names.** Use the form spoken in the audio. If both are spoken, record two rows.
- **Mid-word mutations.** Reference text uses the unmutated lemma unless the mutated form is canonical (e.g. a person's surname that is conventionally mutated).
- **Acronyms.** Use the form the broadcaster's style guide uses — written-out or initialism — not what the speaker says.

If a case is genuinely ambiguous, exclude it. Coverage is less important than consistency.

## Measuring

Once the golden set exists, every measurement run is the same procedure:

1. Take the same audio. Run it through the transcription pipeline.
2. For each `golden_set` row, search the output transcript in a ±5-second window around the labelled timestamp.
3. Classify the result:
   - **True positive** — the canonical form appears in the window.
   - **False negative** — no acceptable form of the entity appears.
   - **False positive** — an entity-shaped string appears in the window but doesn't match the reference (a different name, a misspelling, a hallucinated entity).
4. Compute precision = TP / (TP + FP), recall = TP / (TP + FN), F1 = 2·P·R / (P + R).
5. Insert one row into `measurement_runs` with the scores, the rules applied, and the source model + prompt hash.

The number you report is the precision delta between the no-rules run and the rules-applied run on **the same audio and the same golden set**. Any other comparison is noise.

## What a good first result looks like

After two weeks, on the first series:

- 80–200 labelled spans in `golden_set` (30 minutes of dense content)
- 5–20 approved rules
- Baseline precision in the 0.70–0.85 range
- Post-rules precision lifted by 0.05–0.15
- Recall roughly unchanged (rules shouldn't drop entities, only fix spelling)
- Zero net new false positives on entities that were already correct at baseline

If you see a precision lift **and** an increase in false positives on previously-correct entities, the rules are overreaching — likely the glossary block is being applied too aggressively. Tighten the post-processing prompt before promoting more rules.

If recall drops, stop. Something is wrong with rule application, not with the rules themselves.

## What you do **not** do in this round

- Don't label mutations, register, or segmentation. Different event types, different rounds.
- Don't try to label a whole episode end-to-end. Entity-only is the contract for the MVP.
- Don't auto-extract entities from the existing transcript and "verify" them — that biases the reference to whatever the model already does. Label from audio.
- Don't reuse this golden set after the model or prompt changes materially. Refresh it.
