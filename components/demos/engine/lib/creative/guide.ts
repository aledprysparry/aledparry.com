// ═══ Postio creative-judgement layer - the Social Creative Guide ═══
// Postio's AI generator used to DESIGN FIRST and WRITE SECOND: it produced
// explainer / feature-list posts ("Here are 3 reasons to play..."). This module
// makes it behave like a SOCIAL PRODUCER FIRST, DESIGNER SECOND: hook first,
// design after. Every generated post must pass a creative test BEFORE it is
// rendered - "Would someone stop, swipe, react, comment, share or download?".
//
// This file is pure data + tiny helpers (no React, no server deps) so it can be
// imported by the gated AI route AND by client code. The judge loop that USES
// this guide lives in ./judge.ts.

// The five scored dimensions. Faithful to the guide's final check:
// Hook /10, Clarity /10, Shareability /10, Welsh tone /10, CTA strength /10.
// `welshTone` is scored as: how natural and native the Welsh reads for Welsh
// posts; for English posts, how natural, confident and un-corporate the tone is
// in its own language. So bilingual brands are never penalised for language.
export const SCORE_KEYS = ['hook', 'clarity', 'shareability', 'welshTone', 'cta'] as const;
export type ScoreKey = (typeof SCORE_KEYS)[number];
export type CreativeScores = Record<ScoreKey, number>;

// Every dimension must clear this before a post is presented to the user.
export const PASS_THRESHOLD = 8;

// How many times the loop may rewrite the CONCEPT before it gives up and hands
// back its best attempt with the honest scorecard. 2 revisions = up to 3 drafts,
// which bounds latency + token spend on the paid Anthropic proxy.
export const MAX_REVISIONS = 2;

// Human labels for the scorecard (used in prompts + as a UI fallback; the panel
// prefers its own i18n keys).
export const SCORE_LABELS: Record<ScoreKey, string> = {
  hook: 'Hook',
  clarity: 'Clarity',
  shareability: 'Shareability',
  welshTone: 'Welsh tone',
  cta: 'CTA strength',
};

// The eight hook-first questions every post must answer BEFORE it is designed.
export const HOOK_QUESTIONS = [
  "What's the hook?",
  'Why would someone stop scrolling?',
  'What emotion does it create?',
  'Is there one idea per slide?',
  'Is it understandable in under 2 seconds?',
  'Is there a reason to swipe?',
  'Is there a reason to share?',
  'Is there a clear call to action?',
];

// The angle bank - try these BEFORE settling on a flat, descriptive opener. The
// examples are Welsh (Cwis Bob Dydd flavour) but the angle applies to any brand.
export const ANGLE_BANK: { id: string; name: string; example: string }[] = [
  { id: 'fomo', name: 'FOMO', example: 'Pawb arall yn chwarae - wyt ti?' },
  { id: 'reset', name: 'Reset', example: 'Pawb ar sero heddiw.' },
  { id: 'challenge', name: 'Challenge', example: 'Faint fedri di sgorio?' },
  { id: 'community', name: 'Community', example: "Mae miloedd ar draws Cymru yn chwarae." },
  { id: 'habit', name: 'Habit', example: 'Un cwis. Bob dydd.' },
  { id: 'comeback', name: 'Comeback', example: "Heb chwarae ers tro? Dyma'r wythnos i ddod nol." },
  { id: 'competition', name: 'Competition', example: "Mae'r sgorfwrdd yn agored." },
  { id: 'curiosity', name: 'Curiosity', example: 'Mae rhywbeth newydd yn y cwis heddiw...' },
];

// The system prompt. This IS the Social Creative Guide, encoded as the
// generator's standing instruction. Note: no em-dashes anywhere (house rule).
export const CREATIVE_SYSTEM = `You are Postio's social producer. You create content designed to STOP THE SCROLL, earn attention, and drive likes, shares, comments and downloads. Good-looking is not enough.

THE KEY INSTRUCTION: design comes AFTER the hook. Be a social producer first, a designer second. Never explain features first. Create curiosity, emotion, urgency or FOMO first.
Bad: "Here are three reasons to play Cwis Bob Dydd."
Better: "Os nad ydych wedi chwarae ers tro... mae hyn wedi newid." or "Mae pawb ar sero heddiw. Dyma'ch cyfle chi."

Before any post, answer: 1) What's the hook? 2) Why stop scrolling? 3) What emotion? 4) One idea per slide? 5) Understandable in under 2 seconds? 6) Reason to swipe? 7) Reason to share? 8) Clear CTA? If any answer is weak, rewrite the CONCEPT before designing.

Principles: fewer words; one idea per slide; first slide provocative not descriptive; big punchy language; no long explanations; no corporate wording; no feature-list thinking; make the audience feel involved; natural, confident, spoken social Welsh when writing Welsh.

Angles to try first: FOMO ("Pawb arall yn chwarae - wyt ti?"), Reset ("Pawb ar sero heddiw."), Challenge ("Faint fedri di sgorio?"), Community ("Mae miloedd ar draws Cymru yn chwarae."), Habit ("Un cwis. Bob dydd."), Comeback ("Heb chwarae ers tro? Dyma'r wythnos i ddod nol."), Competition ("Mae'r sgorfwrdd yn agored."), Curiosity ("Mae rhywbeth newydd yn y cwis heddiw...").

Carousel: slide 1 earns the swipe; the middle slides each land ONE point; the final slide is one clear action; short lines, rhythm, no paragraphs.
Visual intent: design supports the hook; large statement words (SERO / NEWYDD / BOB DYDD / CHWARAEA); readable at phone size in under 2 seconds or it failed.

REJECT anything that feels like: a PowerPoint slide, a product manual, a corporate announcement, a feature list, a generic Canva post, or nice-but-no-reason-to-share. AIM FOR: scroll-stopping, confident, playful, Welsh, competitive, community-led, clear.

Match the language of the input (write in Welsh if the input is in Welsh, and keep it natural spoken Welsh, never literal machine Welsh). Never use em-dashes (the "—" character); use a hyphen, a comma, or rephrase. Respond with ONLY valid JSON, no markdown fences, no commentary.`;

// A compact reminder of the hook-first checklist + angle bank, to inline into a
// user prompt right before asking for copy. Keeps the model honest per-call.
export function hookFirstBlock(): string {
  const qs = HOOK_QUESTIONS.map((q, i) => `${i + 1}) ${q}`).join(' ');
  const angles = ANGLE_BANK.map((a) => `${a.name} ("${a.example}")`).join(', ');
  return `Before you write, work hook-first. Answer these, then write only if the answers are strong: ${qs}\nTry these angles before any flat, descriptive opener: ${angles}.`;
}

// The exact JSON the model must add to its output so we can score + gate it.
// Asks the model to score ITS OWN draft honestly and harshly.
export function scorecardShape(): string {
  return `"concept":"the single creative idea in one line (the hook, not a description of the topic)","angle":"which angle you used (FOMO/Reset/Challenge/Community/Habit/Comeback/Competition/Curiosity/other)","scores":{"hook":0-10,"clarity":0-10,"shareability":0-10,"welshTone":0-10,"cta":0-10}`;
}

// Scoring rubric line shared by draft + revise prompts. Honest + harsh so the
// gate means something (a self-scorer left unchecked just rubber-stamps itself).
export const SCORE_RUBRIC = `Score your own draft honestly and harshly on a 0-10 scale for: hook (does the first line genuinely stop the scroll, or is it descriptive?), clarity (one idea, understandable in under 2 seconds?), shareability (a real reason to share, save or comment?), welshTone (for Welsh: natural native spoken Welsh, never literal machine Welsh; for English: natural, confident, un-corporate tone), cta (one clear, tappable action?). An 8 means genuinely scroll-stopping, not merely fine. A feature list, a corporate announcement or a flat description scores 4 or below on hook and shareability.`;

// ── helpers (pure) ──

const KEY_SET = new Set<string>(SCORE_KEYS);

// Coerce whatever the model returned into a clean, fully-populated score object,
// clamped to 0..10. Missing or junk values default low (1) so a malformed
// scorecard fails the gate rather than silently passing.
export function normaliseScores(raw: unknown): CreativeScores {
  const out = { hook: 1, clarity: 1, shareability: 1, welshTone: 1, cta: 1 } as CreativeScores;
  if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (!KEY_SET.has(k)) continue;
      const n = typeof v === 'number' ? v : Number(v);
      if (Number.isFinite(n)) out[k as ScoreKey] = Math.max(0, Math.min(10, Math.round(n)));
    }
  }
  return out;
}

// Which dimensions are below the pass threshold (the ones a revision must fix).
export function weakDimensions(scores: CreativeScores): ScoreKey[] {
  return SCORE_KEYS.filter((k) => scores[k] < PASS_THRESHOLD);
}

export function allPass(scores: CreativeScores): boolean {
  return weakDimensions(scores).length === 0;
}

// Lowest single dimension - handy for "best attempt" selection when no draft
// fully passes after the revision budget is spent.
export function minScore(scores: CreativeScores): number {
  return Math.min(...SCORE_KEYS.map((k) => scores[k]));
}
