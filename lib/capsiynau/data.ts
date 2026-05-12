/**
 * Capsiynau learning loop — demo data.
 *
 * This file is demo-specific. In production Capsiynau, all of this lives
 * in Postgres:
 *   - ENTITIES becomes the per-series glossary table
 *   - BACKSTORY_SEEDS becomes the events table populated by editors
 *   - EP1 / EP2 lines come from the transcription pipeline
 *   - HELDOUT_GOLDEN_SET is a hand-labelled, version-controlled reference
 *     clip refreshed quarterly per series
 *
 * The engine itself does not import this file. Lift `types.ts` and
 * `engine.ts` into the Capsiynau repo; leave `data.ts` behind.
 */

import type {
  CorrectionEvent,
  Entity,
  Episode,
  GoldenSpan,
} from "./types";

export const SERIES_ID = "series-y-sesiwn";
export const SERIES_TITLE = "Y Sesiwn";
export const TENANT_ID = "tenant-capsiynau-pilot";

/**
 * Entities the ASR is known to mis-spell on this series. The variant is
 * what the ASR emits; the canonical is what gets broadcast. All nine
 * appear in either Episode 1 (so a rule can be learned for them) or
 * only in the held-out reference (so no rule is ever learned and the
 * post-rules score does not hit 1.0).
 */
export const ENTITIES: Entity[] = [
  { canonical: "Bethan Gwanas",         variant: "Bethan Gwannus",       type: "person" },
  { canonical: "Iwan Bala",             variant: "Iwan Bahla",           type: "person" },
  { canonical: "Catrin Finch",          variant: "Catrin Vinch",         type: "person" },
  { canonical: "Gareth Roberts",        variant: "Gareth Robberts",      type: "person" },
  { canonical: "Cerys Matthews",        variant: "Caris Mathuse",        type: "person" },
  { canonical: "Llanfair Pwllgwyngyll", variant: "Llanvair Pulgwingull", type: "place" },
  { canonical: "Caernarfon",            variant: "Caernarvon",           type: "place" },
  { canonical: "Pobol y Cwm",           variant: "Pobol e Coom",         type: "programme_term" },
  // Variant emitter that NEVER appears in Episode 1.
  // No rule is learned. Stays wrong even with rules applied.
  { canonical: "Aberystwyth",           variant: "Abreystwyth",          type: "place" },
];

/**
 * Entities the ASR already gets right. Self-map. Used by the held-out
 * golden set so the baseline measurement isn't zero.
 */
export const CORRECT_ENTITIES: readonly string[] = [
  "BBC",
  "Cymru",
  "Yr Wyddfa",
];

/**
 * Pre-seeded corrections from another editor working on earlier episodes.
 * These exist so the user's first correction of any entity is enough to
 * clear the 2-contributor threshold and trigger a proposal — without
 * forcing the user to switch identity mid-demo.
 *
 * Excludes Aberystwyth because that entity intentionally never reaches
 * threshold.
 */
export const BACKSTORY_SEEDS: ReadonlyArray<{
  entityCanonical: string;
  userId: string;
  hoursAgo: number;
}> = [
  { entityCanonical: "Bethan Gwanas",         userId: "editor-b", hoursAgo: 14 },
  { entityCanonical: "Iwan Bala",             userId: "editor-b", hoursAgo:  9 },
  { entityCanonical: "Catrin Finch",          userId: "editor-b", hoursAgo: 22 },
  { entityCanonical: "Gareth Roberts",        userId: "editor-b", hoursAgo:  5 },
  { entityCanonical: "Llanfair Pwllgwyngyll", userId: "editor-b", hoursAgo: 31 },
  { entityCanonical: "Caernarfon",            userId: "editor-b", hoursAgo:  3 },
  { entityCanonical: "Pobol y Cwm",           userId: "editor-b", hoursAgo: 18 },
];

export function buildBackstoryEvents(now: number): CorrectionEvent[] {
  const entityByCanonical = new Map(ENTITIES.map((e) => [e.canonical, e]));
  return BACKSTORY_SEEDS.map((s, i) => {
    const e = entityByCanonical.get(s.entityCanonical);
    if (!e) throw new Error(`Backstory references unknown entity: ${s.entityCanonical}`);
    return {
      id: `seed-${i}`,
      entityCanonical: s.entityCanonical,
      spanKey: `seed-${s.entityCanonical}`,
      before: e.variant,
      after: e.canonical,
      userId: s.userId,
      episodeId: "historical",
      occurredAt: now - s.hoursAgo * 3_600_000,
    };
  });
}

export const EP1: Episode = {
  id: "ep-001",
  title: "Pennod 1 — Y Sesiwn",
  lines: [
    {
      id: "ep1-l1", ms: 4_000, speaker: "Cyflwynydd",
      segments: [
        { kind: "text", value: "Croeso i'r Sesiwn. Heddiw mae " },
        { kind: "entity", entityCanonical: "Bethan Gwanas" },
        { kind: "text", value: " yn ymuno â ni o " },
        { kind: "entity", entityCanonical: "Caernarfon" },
        { kind: "text", value: "." },
      ],
    },
    {
      id: "ep1-l2", ms: 19_000, speaker: "Bethan",
      segments: [
        { kind: "text", value: "Diolch. Mae'n braf bod yma — dwi newydd ddod yn ôl o " },
        { kind: "entity", entityCanonical: "Llanfair Pwllgwyngyll" },
        { kind: "text", value: " bore 'ma." },
      ],
    },
    {
      id: "ep1-l3", ms: 38_000, speaker: "Cyflwynydd",
      segments: [
        { kind: "text", value: "Yn ymuno hefyd, yr arlunydd " },
        { kind: "entity", entityCanonical: "Iwan Bala" },
        { kind: "text", value: " a'r delynores " },
        { kind: "entity", entityCanonical: "Catrin Finch" },
        { kind: "text", value: "." },
      ],
    },
    {
      id: "ep1-l4", ms: 61_000, speaker: "Cyflwynydd",
      segments: [
        { kind: "text", value: "Cyn i ni ddechrau, gair byr am bennod nesaf " },
        { kind: "entity", entityCanonical: "Pobol y Cwm" },
        { kind: "text", value: "." },
      ],
    },
    {
      id: "ep1-l5", ms: 83_000, speaker: "Iwan",
      segments: [
        { kind: "text", value: "Diolch. Mae'r arddangosfa newydd yn " },
        { kind: "entity", entityCanonical: "Caernarfon" },
        { kind: "text", value: " yn agor wythnos nesaf." },
      ],
    },
    {
      id: "ep1-l6", ms: 104_000, speaker: "Cyflwynydd",
      segments: [
        { kind: "text", value: "A nawr, llais arbennig — " },
        { kind: "entity", entityCanonical: "Gareth Roberts" },
        { kind: "text", value: " yn canu'n fyw." },
      ],
    },
    {
      id: "ep1-l7", ms: 132_000, speaker: "Cyflwynydd",
      segments: [
        { kind: "text", value: "A'n gwestai olaf heno — " },
        { kind: "entity", entityCanonical: "Cerys Matthews" },
        { kind: "text", value: "." },
      ],
    },
    {
      id: "ep1-l8", ms: 156_000, speaker: "Cerys",
      segments: [
        { kind: "text", value: "Helo bawb. Dwi'n cofio chwarae yng " },
        { kind: "entity", entityCanonical: "Caernarfon" },
        { kind: "text", value: " gyda " },
        { kind: "entity", entityCanonical: "Catrin Finch" },
        { kind: "text", value: " flynyddoedd yn ôl." },
      ],
    },
  ],
};

export const EP2: Episode = {
  id: "ep-002",
  title: "Pennod 2 — Y Sesiwn",
  lines: [
    {
      id: "ep2-l1", ms: 3_500, speaker: "Cyflwynydd",
      segments: [
        { kind: "text", value: "Croeso nôl. Mae " },
        { kind: "entity", entityCanonical: "Bethan Gwanas" },
        { kind: "text", value: " gyda ni eto." },
      ],
    },
    {
      id: "ep2-l2", ms: 21_000, speaker: "Bethan",
      segments: [
        { kind: "text", value: "Diolch. Mae'r tywydd yn " },
        { kind: "entity", entityCanonical: "Llanfair Pwllgwyngyll" },
        { kind: "text", value: " yn well heddiw." },
      ],
    },
    {
      id: "ep2-l3", ms: 42_000, speaker: "Cyflwynydd",
      segments: [
        { kind: "text", value: "Yn dychwelyd: " },
        { kind: "entity", entityCanonical: "Iwan Bala" },
        { kind: "text", value: " a " },
        { kind: "entity", entityCanonical: "Catrin Finch" },
        { kind: "text", value: "." },
      ],
    },
    {
      id: "ep2-l4", ms: 64_000, speaker: "Iwan",
      segments: [
        { kind: "text", value: "Sgwrs am yr arddangosfa newydd yn " },
        { kind: "entity", entityCanonical: "Caernarfon" },
        { kind: "text", value: "." },
      ],
    },
    {
      id: "ep2-l5", ms: 88_000, speaker: "Cyflwynydd",
      segments: [
        { kind: "text", value: "Pennod arbennig o " },
        { kind: "entity", entityCanonical: "Pobol y Cwm" },
        { kind: "text", value: " wythnos nesaf." },
      ],
    },
    {
      id: "ep2-l6", ms: 109_000, speaker: "Catrin",
      segments: [
        { kind: "text", value: "Roedd y cyngerdd diwetha' yn " },
        { kind: "entity", entityCanonical: "Caernarfon" },
        { kind: "text", value: " yn fendigedig." },
      ],
    },
    {
      id: "ep2-l7", ms: 134_000, speaker: "Cyflwynydd",
      segments: [
        { kind: "text", value: "A nawr — " },
        { kind: "entity", entityCanonical: "Gareth Roberts" },
        { kind: "text", value: " unwaith eto." },
      ],
    },
    {
      id: "ep2-l8", ms: 162_000, speaker: "Cyflwynydd",
      segments: [
        { kind: "text", value: "I gloi — " },
        { kind: "entity", entityCanonical: "Cerys Matthews" },
        { kind: "text", value: " a " },
        { kind: "entity", entityCanonical: "Bethan Gwanas" },
        { kind: "text", value: " yn sgwrsio." },
      ],
    },
    {
      id: "ep2-l9", ms: 189_000, speaker: "Cerys",
      segments: [
        { kind: "text", value: "Pleser eich gweld eto. Anfon cofion at bawb yng " },
        { kind: "entity", entityCanonical: "Caernarfon" },
        { kind: "text", value: "." },
      ],
    },
  ],
};

/**
 * Held-out reference clip the user never sees. 30 hand-labelled entity
 * spans. Mix:
 *   - 18 occurrences across the 8 learnable entities (rules can correct)
 *   - 3 occurrences of Aberystwyth (variant emitter; no rule ever learned)
 *   - 9 occurrences across 3 correct entities (ASR already right)
 *
 * Baseline precision: 9/30 = 0.30
 * Post-rules ceiling (all 8 rules approved): 27/30 = 0.90
 */
export const HELDOUT_GOLDEN_SET: GoldenSpan[] = [
  // 18 learnable variant occurrences
  { id: "g-001", episodeId: "ep-003", entityCanonical: "Bethan Gwanas",         entityType: "person",         startMs:   3_200, endMs:   4_400, referenceText: "Bethan Gwanas" },
  { id: "g-002", episodeId: "ep-003", entityCanonical: "Bethan Gwanas",         entityType: "person",         startMs:  97_000, endMs:  98_200, referenceText: "Bethan Gwanas" },
  { id: "g-003", episodeId: "ep-003", entityCanonical: "Bethan Gwanas",         entityType: "person",         startMs: 208_400, endMs: 209_600, referenceText: "Bethan Gwanas" },
  { id: "g-004", episodeId: "ep-003", entityCanonical: "Iwan Bala",             entityType: "person",         startMs:  28_500, endMs:  29_400, referenceText: "Iwan Bala" },
  { id: "g-005", episodeId: "ep-003", entityCanonical: "Iwan Bala",             entityType: "person",         startMs: 138_000, endMs: 139_000, referenceText: "Iwan Bala" },
  { id: "g-006", episodeId: "ep-003", entityCanonical: "Catrin Finch",          entityType: "person",         startMs:  55_400, endMs:  56_600, referenceText: "Catrin Finch" },
  { id: "g-007", episodeId: "ep-003", entityCanonical: "Catrin Finch",          entityType: "person",         startMs: 166_400, endMs: 167_600, referenceText: "Catrin Finch" },
  { id: "g-008", episodeId: "ep-003", entityCanonical: "Catrin Finch",          entityType: "person",         startMs: 290_400, endMs: 291_600, referenceText: "Catrin Finch" },
  { id: "g-009", episodeId: "ep-003", entityCanonical: "Gareth Roberts",        entityType: "person",         startMs:  69_000, endMs:  70_200, referenceText: "Gareth Roberts" },
  { id: "g-010", episodeId: "ep-003", entityCanonical: "Gareth Roberts",        entityType: "person",         startMs: 194_500, endMs: 195_700, referenceText: "Gareth Roberts" },
  { id: "g-011", episodeId: "ep-003", entityCanonical: "Cerys Matthews",        entityType: "person",         startMs: 124_000, endMs: 125_200, referenceText: "Cerys Matthews" },
  { id: "g-012", episodeId: "ep-003", entityCanonical: "Cerys Matthews",        entityType: "person",         startMs: 236_000, endMs: 237_200, referenceText: "Cerys Matthews" },
  { id: "g-013", episodeId: "ep-003", entityCanonical: "Llanfair Pwllgwyngyll", entityType: "place",          startMs: 152_000, endMs: 153_800, referenceText: "Llanfair Pwllgwyngyll" },
  { id: "g-014", episodeId: "ep-003", entityCanonical: "Caernarfon",            entityType: "place",          startMs:  15_000, endMs:  15_900, referenceText: "Caernarfon" },
  { id: "g-015", episodeId: "ep-003", entityCanonical: "Caernarfon",            entityType: "place",          startMs: 222_000, endMs: 222_900, referenceText: "Caernarfon" },
  { id: "g-016", episodeId: "ep-003", entityCanonical: "Pobol y Cwm",           entityType: "programme_term", startMs:  83_500, endMs:  84_900, referenceText: "Pobol y Cwm" },
  { id: "g-017", episodeId: "ep-003", entityCanonical: "Pobol y Cwm",           entityType: "programme_term", startMs: 250_000, endMs: 251_400, referenceText: "Pobol y Cwm" },
  { id: "g-018", episodeId: "ep-003", entityCanonical: "Pobol y Cwm",           entityType: "programme_term", startMs: 332_500, endMs: 333_400, referenceText: "Pobol y Cwm" },

  // 3 Aberystwyth occurrences (variant emitter, never learnable)
  { id: "g-019", episodeId: "ep-003", entityCanonical: "Aberystwyth",           entityType: "place",          startMs: 110_500, endMs: 111_500, referenceText: "Aberystwyth" },
  { id: "g-020", episodeId: "ep-003", entityCanonical: "Aberystwyth",           entityType: "place",          startMs: 244_000, endMs: 245_000, referenceText: "Aberystwyth" },
  { id: "g-021", episodeId: "ep-003", entityCanonical: "Aberystwyth",           entityType: "place",          startMs: 272_000, endMs: 273_000, referenceText: "Aberystwyth" },

  // 9 correctly-transcribed occurrences (3 entities × 3)
  { id: "g-022", episodeId: "ep-003", entityCanonical: "BBC",                   entityType: "organisation",   startMs:  22_000, endMs:  22_500, referenceText: "BBC" },
  { id: "g-023", episodeId: "ep-003", entityCanonical: "BBC",                   entityType: "organisation",   startMs: 160_500, endMs: 161_000, referenceText: "BBC" },
  { id: "g-024", episodeId: "ep-003", entityCanonical: "BBC",                   entityType: "organisation",   startMs: 285_000, endMs: 285_500, referenceText: "BBC" },
  { id: "g-025", episodeId: "ep-003", entityCanonical: "Cymru",                 entityType: "place",          startMs:  62_000, endMs:  62_700, referenceText: "Cymru" },
  { id: "g-026", episodeId: "ep-003", entityCanonical: "Cymru",                 entityType: "place",          startMs: 215_500, endMs: 216_200, referenceText: "Cymru" },
  { id: "g-027", episodeId: "ep-003", entityCanonical: "Cymru",                 entityType: "place",          startMs: 305_000, endMs: 305_700, referenceText: "Cymru" },
  { id: "g-028", episodeId: "ep-003", entityCanonical: "Yr Wyddfa",             entityType: "place",          startMs: 131_000, endMs: 132_000, referenceText: "Yr Wyddfa" },
  { id: "g-029", episodeId: "ep-003", entityCanonical: "Yr Wyddfa",             entityType: "place",          startMs: 258_000, endMs: 259_000, referenceText: "Yr Wyddfa" },
  { id: "g-030", episodeId: "ep-003", entityCanonical: "Yr Wyddfa",             entityType: "place",          startMs: 358_000, endMs: 359_000, referenceText: "Yr Wyddfa" },
];

/**
 * Mock ASR for the held-out clip. Used by the measurement API route.
 * Variants emit the wrong form; correct entities pass through unchanged.
 */
export function mockHeldoutTranscribe(canonical: string): string {
  const e = ENTITIES.find((x) => x.canonical === canonical);
  if (e) return e.variant;
  if (CORRECT_ENTITIES.includes(canonical)) return canonical;
  return canonical;
}
