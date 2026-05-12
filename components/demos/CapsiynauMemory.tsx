"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Capsiynau — Series Memory
 *
 * Interactive demo of the self-improving production-intelligence layer.
 * The visitor plays the role of an editor on the Welsh series "Y Sesiwn".
 * They correct mis-spelled contributor names on Episode 1 and watch the
 * system propose rules, accept their approval, then pre-apply those rules
 * to Episode 2 — visibly improving before they touch it.
 *
 * Fully client-side. No backend, no API keys.
 */

type Lang = "en" | "cy";
type Stage = "intro" | "ep1" | "ep2" | "impact";
type EntityType = "person" | "place" | "organisation" | "programme_term";

type Entity = {
  canonical: string;
  variant: string;
  type: EntityType;
  seededByEditorB: boolean; // backstory: another editor caught this earlier
  seedHoursAgo: number;
};

type Segment =
  | { kind: "text"; value: string }
  | { kind: "entity"; entityCanonical: string };

type TranscriptLine = {
  id: string;
  ms: number;
  speaker: string;
  segments: Segment[];
};

type Rule = {
  id: string;
  entityCanonical: string;
  pattern: string;
  replacement: string;
  type: EntityType;
  status: "approved";
  supportingCorrections: number;
  contributors: string[]; // distinct editor ids
  approvedAt: number;
};

type Proposal = {
  entityCanonical: string;
  pattern: string;
  replacement: string;
  type: EntityType;
  supportingCorrections: number;
  contributors: string[];
};

const ENTITIES: Entity[] = [
  { canonical: "Bethan Gwanas",         variant: "Bethan Gwannus",      type: "person",          seededByEditorB: true,  seedHoursAgo: 14 },
  { canonical: "Iwan Bala",             variant: "Iwan Bahla",          type: "person",          seededByEditorB: true,  seedHoursAgo:  9 },
  { canonical: "Catrin Finch",          variant: "Catrin Vinch",        type: "person",          seededByEditorB: true,  seedHoursAgo: 22 },
  { canonical: "Gareth Roberts",        variant: "Gareth Robberts",     type: "person",          seededByEditorB: true,  seedHoursAgo:  5 },
  { canonical: "Cerys Matthews",        variant: "Caris Mathuse",       type: "person",          seededByEditorB: false, seedHoursAgo:  0 },
  { canonical: "Llanfair Pwllgwyngyll", variant: "Llanvair Pulgwingull",type: "place",           seededByEditorB: true,  seedHoursAgo: 31 },
  { canonical: "Caernarfon",            variant: "Caernarvon",          type: "place",           seededByEditorB: true,  seedHoursAgo:  3 },
  { canonical: "Pobol y Cwm",           variant: "Pobol e Coom",        type: "programme_term",  seededByEditorB: true,  seedHoursAgo: 18 },
];

const EP1_LINES: TranscriptLine[] = [
  {
    id: "ep1-l1",
    ms: 4_000,
    speaker: "Cyflwynydd",
    segments: [
      { kind: "text", value: "Croeso i'r Sesiwn. Heddiw mae " },
      { kind: "entity", entityCanonical: "Bethan Gwanas" },
      { kind: "text", value: " yn ymuno â ni o " },
      { kind: "entity", entityCanonical: "Caernarfon" },
      { kind: "text", value: "." },
    ],
  },
  {
    id: "ep1-l2",
    ms: 19_000,
    speaker: "Bethan",
    segments: [
      { kind: "text", value: "Diolch. Mae'n braf bod yma — dwi newydd ddod yn ôl o " },
      { kind: "entity", entityCanonical: "Llanfair Pwllgwyngyll" },
      { kind: "text", value: " bore 'ma." },
    ],
  },
  {
    id: "ep1-l3",
    ms: 38_000,
    speaker: "Cyflwynydd",
    segments: [
      { kind: "text", value: "Yn ymuno hefyd, yr arlunydd " },
      { kind: "entity", entityCanonical: "Iwan Bala" },
      { kind: "text", value: " a'r delynores " },
      { kind: "entity", entityCanonical: "Catrin Finch" },
      { kind: "text", value: "." },
    ],
  },
  {
    id: "ep1-l4",
    ms: 61_000,
    speaker: "Cyflwynydd",
    segments: [
      { kind: "text", value: "Cyn i ni ddechrau, gair byr am bennod nesaf " },
      { kind: "entity", entityCanonical: "Pobol y Cwm" },
      { kind: "text", value: "." },
    ],
  },
  {
    id: "ep1-l5",
    ms: 83_000,
    speaker: "Iwan",
    segments: [
      { kind: "text", value: "Diolch. Mae'r arddangosfa newydd yn " },
      { kind: "entity", entityCanonical: "Caernarfon" },
      { kind: "text", value: " yn agor wythnos nesaf." },
    ],
  },
  {
    id: "ep1-l6",
    ms: 104_000,
    speaker: "Cyflwynydd",
    segments: [
      { kind: "text", value: "A nawr, llais arbennig — " },
      { kind: "entity", entityCanonical: "Gareth Roberts" },
      { kind: "text", value: " yn canu'n fyw." },
    ],
  },
  {
    id: "ep1-l7",
    ms: 132_000,
    speaker: "Cyflwynydd",
    segments: [
      { kind: "text", value: "A'n gwestai olaf heno — " },
      { kind: "entity", entityCanonical: "Cerys Matthews" },
      { kind: "text", value: "." },
    ],
  },
  {
    id: "ep1-l8",
    ms: 156_000,
    speaker: "Cerys",
    segments: [
      { kind: "text", value: "Helo bawb. Dwi'n cofio chwarae yng " },
      { kind: "entity", entityCanonical: "Caernarfon" },
      { kind: "text", value: " gyda " },
      { kind: "entity", entityCanonical: "Catrin Finch" },
      { kind: "text", value: " flynyddoedd yn ôl." },
    ],
  },
];

const EP2_LINES: TranscriptLine[] = [
  {
    id: "ep2-l1",
    ms: 3_500,
    speaker: "Cyflwynydd",
    segments: [
      { kind: "text", value: "Croeso nôl. Mae " },
      { kind: "entity", entityCanonical: "Bethan Gwanas" },
      { kind: "text", value: " gyda ni eto." },
    ],
  },
  {
    id: "ep2-l2",
    ms: 21_000,
    speaker: "Bethan",
    segments: [
      { kind: "text", value: "Diolch. Mae'r tywydd yn " },
      { kind: "entity", entityCanonical: "Llanfair Pwllgwyngyll" },
      { kind: "text", value: " yn well heddiw." },
    ],
  },
  {
    id: "ep2-l3",
    ms: 42_000,
    speaker: "Cyflwynydd",
    segments: [
      { kind: "text", value: "Yn dychwelyd: " },
      { kind: "entity", entityCanonical: "Iwan Bala" },
      { kind: "text", value: " a " },
      { kind: "entity", entityCanonical: "Catrin Finch" },
      { kind: "text", value: "." },
    ],
  },
  {
    id: "ep2-l4",
    ms: 64_000,
    speaker: "Iwan",
    segments: [
      { kind: "text", value: "Sgwrs am yr arddangosfa newydd yn " },
      { kind: "entity", entityCanonical: "Caernarfon" },
      { kind: "text", value: "." },
    ],
  },
  {
    id: "ep2-l5",
    ms: 88_000,
    speaker: "Cyflwynydd",
    segments: [
      { kind: "text", value: "Pennod arbennig o " },
      { kind: "entity", entityCanonical: "Pobol y Cwm" },
      { kind: "text", value: " wythnos nesaf." },
    ],
  },
  {
    id: "ep2-l6",
    ms: 109_000,
    speaker: "Catrin",
    segments: [
      { kind: "text", value: "Roedd y cyngerdd diwetha' yn " },
      { kind: "entity", entityCanonical: "Caernarfon" },
      { kind: "text", value: " yn fendigedig." },
    ],
  },
  {
    id: "ep2-l7",
    ms: 134_000,
    speaker: "Cyflwynydd",
    segments: [
      { kind: "text", value: "A nawr — " },
      { kind: "entity", entityCanonical: "Gareth Roberts" },
      { kind: "text", value: " unwaith eto." },
    ],
  },
  {
    id: "ep2-l8",
    ms: 162_000,
    speaker: "Cyflwynydd",
    segments: [
      { kind: "text", value: "I gloi — " },
      { kind: "entity", entityCanonical: "Cerys Matthews" },
      { kind: "text", value: " a " },
      { kind: "entity", entityCanonical: "Bethan Gwanas" },
      { kind: "text", value: " yn sgwrsio." },
    ],
  },
  {
    id: "ep2-l9",
    ms: 189_000,
    speaker: "Cerys",
    segments: [
      { kind: "text", value: "Pleser eich gweld eto. Anfon cofion at bawb yng " },
      { kind: "entity", entityCanonical: "Caernarfon" },
      { kind: "text", value: "." },
    ],
  },
];

const STRINGS: Record<string, Record<Lang, string>> = {
  title:              { en: "Capsiynau — Series Memory",                       cy: "Capsiynau — Cof y Gyfres" },
  introTagline:       { en: "Welsh production intelligence that learns from your team — and gets better every episode.", cy: "Deallusrwydd cynhyrchu Cymraeg sy'n dysgu o'ch tîm — ac yn gwella bob pennod." },
  introBlurb:         { en: "You're the editor on Y Sesiwn. The AI's first-pass transcript has the usual mis-spellings on Welsh names. Correct them once — and watch Capsiynau remember them on every future episode.", cy: "Chi yw'r golygydd ar Y Sesiwn. Mae trawsgrifiad cyntaf yr AI yn cynnwys camsillafiadau ar enwau Cymraeg. Cywirwch nhw unwaith — a gwyliwch Capsiynau yn eu cofio ar bob pennod yn y dyfodol." },
  start:              { en: "Try the demo",                                    cy: "Profi'r demo" },
  ep1Heading:         { en: "Episode 1 — Y Sesiwn",                            cy: "Pennod 1 — Y Sesiwn" },
  ep1Hint:            { en: "Click the highlighted names to correct them. Capsiynau watches every correction.", cy: "Cliciwch ar yr enwau wedi'u hamlygu i'w cywiro. Mae Capsiynau yn gwylio pob cywiriad." },
  panelTitle:         { en: "Series Memory",                                   cy: "Cof y Gyfres" },
  panelSub:           { en: "Y Sesiwn",                                        cy: "Y Sesiwn" },
  rulesApproved:      { en: "Rules approved",                                  cy: "Rheolau a gymeradwywyd" },
  correctionsSeen:    { en: "Corrections observed",                            cy: "Cywiriadau a welwyd" },
  contributorsCount:  { en: "Contributors",                                    cy: "Cyfranwyr" },
  proposalIntro:      { en: "Proposed rule",                                   cy: "Rheol a gynigir" },
  proposalSubFmt:     { en: "Approve for Y Sesiwn?",                           cy: "Cymeradwyo ar gyfer Y Sesiwn?" },
  proposalEvidence:   { en: "Evidence",                                        cy: "Tystiolaeth" },
  approve:            { en: "Approve",                                         cy: "Cymeradwyo" },
  notYet:             { en: "Not yet",                                         cy: "Ddim eto" },
  approvedRules:      { en: "Approved rules",                                  cy: "Rheolau a gymeradwywyd" },
  noRulesYet:         { en: "Awaiting first correction…",                      cy: "Yn aros am y cywiriad cyntaf…" },
  toEp2:              { en: "Load the next episode →",                         cy: "Llwytho'r bennod nesaf →" },
  ep2Heading:         { en: "Episode 2 — Y Sesiwn",                            cy: "Pennod 2 — Y Sesiwn" },
  ep2BannerFmt:       { en: "Capsiynau pre-applied {rules} memory rules. {hits} names pre-corrected before you saw them.", cy: "Mae Capsiynau wedi cymhwyso {rules} rheol cof ymlaen llaw. {hits} enw wedi'u cywiro cyn i chi eu gweld." },
  ep2Hint:            { en: "Names underlined in green were corrected automatically from Series Memory. Hover to see why.", cy: "Cafodd enwau a danlinellwyd mewn gwyrdd eu cywiro'n awtomatig o Gof y Gyfres. Hofranwch i weld pam." },
  toImpact:           { en: "See the impact →",                                cy: "Gweld yr effaith →" },
  impactHeading:      { en: "What just happened",                              cy: "Beth ddigwyddodd" },
  impactWithout:      { en: "Without Series Memory",                           cy: "Heb Gof y Gyfres" },
  impactWith:         { en: "With Series Memory",                              cy: "Gyda Chof y Gyfres" },
  impactDelta:        { en: "Improvement",                                     cy: "Gwelliant" },
  errorsPerEp:        { en: "name errors / episode",                           cy: "camgymeriad enw / pennod" },
  minutesSaved:       { en: "minutes of correction time saved",                cy: "munud o amser cywiro wedi'i arbed" },
  ongoingNote:        { en: "Series Memory grows every time you use it. By Episode 10, Capsiynau will be catching contributor names, place names, and programme-specific terms that no general-purpose tool can.", cy: "Mae Cof y Gyfres yn tyfu bob tro y byddwch yn ei ddefnyddio. Erbyn Pennod 10, bydd Capsiynau yn dal enwau cyfranwyr, enwau llefydd, a thermau penodol i'r rhaglen na all unrhyw offeryn cyffredinol ei wneud." },
  resetDemo:          { en: "Reset demo",                                      cy: "Ailosod y demo" },
  hoursAgo:           { en: "h ago",                                           cy: " awr yn ôl" },
  byYou:              { en: "you, just now",                                   cy: "chi, nawr" },
  byEditorB:          { en: "editor-b",                                        cy: "golygydd-b" },
  applyCorrection:    { en: "Correct →",                                       cy: "Cywiro →" },
  preCorrectedFmt:    { en: "Pre-corrected from memory: '{from}' → '{to}'. Learned from {n} corrections by {k} editors on Episode 1.", cy: "Cywirwyd ymlaen llaw o'r cof: '{from}' → '{to}'. Dysgwyd o {n} cywiriad gan {k} olygydd ar Bennod 1." },
  livePill:           { en: "Live",                                            cy: "Byw" },
  preCorrected:       { en: "From memory",                                     cy: "O'r cof" },
  needsCorrection:    { en: "Needs review",                                    cy: "Angen adolygu" },
  corrected:          { en: "Corrected",                                       cy: "Wedi'i gywiro" },
  ep1Caption:         { en: "Raw ASR draft — 8 likely mis-spellings detected.", cy: "Drafft ASR amrwd — 8 camsillafiad tebygol wedi'u canfod." },
};

function tFn(lang: Lang) {
  return (k: keyof typeof STRINGS) => STRINGS[k][lang];
}

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

const SUPPORT_THRESHOLD = 2;
const MIN_CONTRIBUTORS = 2;

const STORAGE_KEY = "capsiynau-memory-demo-v1";

type Persisted = {
  stage: Stage;
  lang: Lang;
  rules: Rule[];
  correctedSpansEp1: string[];
};

function loadPersisted(): Persisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Persisted;
  } catch {
    return null;
  }
}

function savePersisted(p: Persisted) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

function entityFor(canonical: string): Entity {
  const e = ENTITIES.find((x) => x.canonical === canonical);
  if (!e) throw new Error(`Unknown entity: ${canonical}`);
  return e;
}

function formatHm(line: TranscriptLine): string {
  const total = Math.floor(line.ms / 1000);
  const m = Math.floor(total / 60).toString().padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function CapsiynauMemory() {
  const [stage, setStage] = useState<Stage>("intro");
  const [lang, setLang] = useState<Lang>("en");
  const [rules, setRules] = useState<Rule[]>([]);
  const [correctedSpansEp1, setCorrectedSpansEp1] = useState<Set<string>>(new Set());
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [justApprovedFlash, setJustApprovedFlash] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const p = loadPersisted();
    if (p) {
      setStage(p.stage);
      setLang(p.lang);
      setRules(p.rules);
      setCorrectedSpansEp1(new Set(p.correctedSpansEp1));
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    savePersisted({
      stage,
      lang,
      rules,
      correctedSpansEp1: Array.from(correctedSpansEp1),
    });
  }, [stage, lang, rules, correctedSpansEp1, hydrated]);

  const t = useMemo(() => tFn(lang), [lang]);

  const ruleByCanonical = useMemo(() => {
    const m = new Map<string, Rule>();
    for (const r of rules) m.set(r.entityCanonical, r);
    return m;
  }, [rules]);

  const correctionsObserved = useMemo(() => {
    let total = 0;
    // pre-seeded by editor-b for those entities
    for (const e of ENTITIES) if (e.seededByEditorB) total += 1;
    // plus user corrections on Ep 1
    total += correctedSpansEp1.size;
    return total;
  }, [correctedSpansEp1]);

  const distinctContributors = useMemo(() => {
    const s = new Set<string>();
    if (correctedSpansEp1.size > 0) s.add("you");
    if (ENTITIES.some((e) => e.seededByEditorB)) s.add("editor-b");
    return s.size;
  }, [correctedSpansEp1.size]);

  const ep1SpansByEntity = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const line of EP1_LINES) {
      let idx = 0;
      for (const seg of line.segments) {
        if (seg.kind === "entity") {
          const arr = m.get(seg.entityCanonical) ?? [];
          arr.push(`${line.id}-${idx}`);
          m.set(seg.entityCanonical, arr);
        }
        idx++;
      }
    }
    return m;
  }, []);

  const handleCorrect = useCallback(
    (entityCanonical: string, spanKey: string) => {
      if (correctedSpansEp1.has(spanKey)) return;
      const e = entityFor(entityCanonical);

      const nextSet = new Set(correctedSpansEp1);
      nextSet.add(spanKey);
      setCorrectedSpansEp1(nextSet);

      // Already approved? Don't re-propose.
      if (ruleByCanonical.has(entityCanonical)) return;

      // Count user corrections for this entity in this session
      const allSpanKeysForEntity = ep1SpansByEntity.get(entityCanonical) ?? [];
      const userCorrectionsForEntity = allSpanKeysForEntity.filter((k) =>
        nextSet.has(k),
      ).length;

      const support =
        userCorrectionsForEntity + (e.seededByEditorB ? 1 : 0);
      const contributors: string[] = [];
      if (userCorrectionsForEntity > 0) contributors.push("you");
      if (e.seededByEditorB) contributors.push("editor-b");

      if (
        support >= SUPPORT_THRESHOLD &&
        contributors.length >= MIN_CONTRIBUTORS
      ) {
        setProposal({
          entityCanonical: e.canonical,
          pattern: e.variant,
          replacement: e.canonical,
          type: e.type,
          supportingCorrections: support,
          contributors,
        });
      }
    },
    [correctedSpansEp1, ep1SpansByEntity, ruleByCanonical],
  );

  const handleApproveProposal = useCallback(() => {
    if (!proposal) return;
    const newRule: Rule = {
      id: `rule-${proposal.entityCanonical.replace(/\s+/g, "-").toLowerCase()}`,
      entityCanonical: proposal.entityCanonical,
      pattern: proposal.pattern,
      replacement: proposal.replacement,
      type: proposal.type,
      status: "approved",
      supportingCorrections: proposal.supportingCorrections,
      contributors: proposal.contributors,
      approvedAt: Date.now(),
    };
    setRules((prev) => [...prev, newRule]);
    setJustApprovedFlash(proposal.entityCanonical);
    setProposal(null);
    window.setTimeout(() => setJustApprovedFlash(null), 1500);
  }, [proposal]);

  const ep2PreCorrectedCount = useMemo(() => {
    let count = 0;
    for (const line of EP2_LINES) {
      for (const seg of line.segments) {
        if (seg.kind === "entity" && ruleByCanonical.has(seg.entityCanonical)) {
          count++;
        }
      }
    }
    return count;
  }, [ruleByCanonical]);

  const ep2TotalEntitySpans = useMemo(() => {
    let count = 0;
    for (const line of EP2_LINES) {
      for (const seg of line.segments) {
        if (seg.kind === "entity") count++;
      }
    }
    return count;
  }, []);

  const ep2RemainingErrors = ep2TotalEntitySpans - ep2PreCorrectedCount;

  const resetDemo = useCallback(() => {
    setStage("intro");
    setRules([]);
    setCorrectedSpansEp1(new Set());
    setProposal(null);
    setJustApprovedFlash(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  if (!hydrated) {
    return (
      <div className="h-full w-full flex items-center justify-center text-stone-400 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-stone-50 text-stone-900">
      <TopBar
        lang={lang}
        setLang={setLang}
        onReset={resetDemo}
        t={t}
        stage={stage}
      />

      {stage === "intro" && (
        <Intro t={t} onStart={() => setStage("ep1")} />
      )}

      {stage === "ep1" && (
        <Ep1View
          t={t}
          lang={lang}
          rules={rules}
          correctedSpansEp1={correctedSpansEp1}
          proposal={proposal}
          correctionsObserved={correctionsObserved}
          distinctContributors={distinctContributors}
          justApprovedFlash={justApprovedFlash}
          onCorrect={handleCorrect}
          onApprove={handleApproveProposal}
          onDismissProposal={() => setProposal(null)}
          onNext={() => setStage("ep2")}
        />
      )}

      {stage === "ep2" && (
        <Ep2View
          t={t}
          lang={lang}
          rules={rules}
          preCorrectedCount={ep2PreCorrectedCount}
          onNext={() => setStage("impact")}
        />
      )}

      {stage === "impact" && (
        <ImpactView
          t={t}
          rulesCount={rules.length}
          preCorrectedCount={ep2PreCorrectedCount}
          remainingErrors={ep2RemainingErrors}
          onReset={resetDemo}
        />
      )}
    </div>
  );
}

function TopBar({
  lang,
  setLang,
  onReset,
  t,
  stage,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  onReset: () => void;
  t: ReturnType<typeof tFn>;
  stage: Stage;
}) {
  return (
    <div className="flex-shrink-0 border-b border-stone-200 bg-white">
      <div className="max-w-content mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-md bg-accent-dark text-white flex items-center justify-center text-xs font-serif">
            C
          </div>
          <div className="font-serif text-lg text-stone-900">{t("title")}</div>
          {stage !== "intro" && (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              {t("livePill")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-stone-100 rounded-md p-0.5 text-xs">
            <button
              onClick={() => setLang("en")}
              className={`px-2 py-1 rounded ${lang === "en" ? "bg-white shadow-sm text-stone-900" : "text-stone-500"}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("cy")}
              className={`px-2 py-1 rounded ${lang === "cy" ? "bg-white shadow-sm text-stone-900" : "text-stone-500"}`}
            >
              CY
            </button>
          </div>
          <button
            onClick={onReset}
            className="text-xs text-stone-500 hover:text-stone-900 px-2 py-1"
          >
            {t("resetDemo")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Intro({
  t,
  onStart,
}: {
  t: ReturnType<typeof tFn>;
  onStart: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <div className="text-xs uppercase tracking-[0.18em] text-accent mb-4">
          Capsiynau
        </div>
        <h1 className="font-serif text-3xl md:text-4xl text-stone-900 mb-5 leading-tight">
          {t("introTagline")}
        </h1>
        <p className="text-stone-600 mb-8 leading-relaxed">
          {t("introBlurb")}
        </p>
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-3 rounded-md text-sm font-medium hover:bg-stone-800 transition-colors"
        >
          {t("start")}
          <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}

function Ep1View({
  t,
  lang,
  rules,
  correctedSpansEp1,
  proposal,
  correctionsObserved,
  distinctContributors,
  justApprovedFlash,
  onCorrect,
  onApprove,
  onDismissProposal,
  onNext,
}: {
  t: ReturnType<typeof tFn>;
  lang: Lang;
  rules: Rule[];
  correctedSpansEp1: Set<string>;
  proposal: Proposal | null;
  correctionsObserved: number;
  distinctContributors: number;
  justApprovedFlash: string | null;
  onCorrect: (canonical: string, spanKey: string) => void;
  onApprove: () => void;
  onDismissProposal: () => void;
  onNext: () => void;
}) {
  const totalEp1Spans = useMemo(() => {
    let n = 0;
    for (const line of EP1_LINES) {
      for (const seg of line.segments) if (seg.kind === "entity") n++;
    }
    return n;
  }, []);

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-0 overflow-hidden">
      <div className="overflow-y-auto bg-stone-50 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-accent">
            Episode 1
          </div>
          <h2 className="font-serif text-2xl text-stone-900 mb-2">
            {t("ep1Heading")}
          </h2>
          <p className="text-sm text-stone-500 mb-1">{t("ep1Caption")}</p>
          <p className="text-sm text-stone-400 mb-6">{t("ep1Hint")}</p>

          <div className="space-y-3">
            {EP1_LINES.map((line) => (
              <Line
                key={line.id}
                line={line}
                lang={lang}
                renderEntity={(seg, spanKey) => {
                  const corrected = correctedSpansEp1.has(spanKey);
                  const e = entityFor(seg.entityCanonical);
                  if (corrected) {
                    return (
                      <span
                        key={spanKey}
                        className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-50 text-green-800 border border-green-200 text-[0.95em]"
                      >
                        {e.canonical}
                      </span>
                    );
                  }
                  return (
                    <button
                      key={spanKey}
                      onClick={() => onCorrect(e.canonical, spanKey)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-colors text-[0.95em] cursor-pointer"
                      title={`${t("needsCorrection")}: ${e.variant} → ${e.canonical}`}
                    >
                      <span className="underline decoration-amber-400 decoration-2 underline-offset-2">
                        {e.variant}
                      </span>
                      <span className="text-[0.7em] text-amber-700 ml-1">
                        {t("applyCorrection")}
                      </span>
                    </button>
                  );
                }}
              />
            ))}
          </div>

          {rules.length >= 5 && (
            <div className="mt-10 flex justify-end">
              <button
                onClick={onNext}
                className="inline-flex items-center gap-2 bg-accent-dark text-white px-5 py-3 rounded-md text-sm font-medium hover:bg-stone-900 transition-colors"
              >
                {t("toEp2")}
              </button>
            </div>
          )}
        </div>
      </div>

      <aside className="border-l border-stone-200 bg-white overflow-y-auto">
        <div className="p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-accent mb-1">
            {t("panelTitle")}
          </div>
          <div className="font-serif text-lg text-stone-900 mb-4">
            {t("panelSub")}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-5">
            <Stat label={t("rulesApproved")} value={rules.length} />
            <Stat label={t("correctionsSeen")} value={correctionsObserved} />
            <Stat label={t("contributorsCount")} value={distinctContributors} />
          </div>

          <div className="text-[0.7rem] text-stone-400 mb-1">
            {correctedSpansEp1.size} / {totalEp1Spans} corrections in this episode
          </div>
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-5">
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{
                width: `${Math.min(100, (correctedSpansEp1.size / totalEp1Spans) * 100)}%`,
              }}
            />
          </div>

          {proposal && (
            <ProposalCard
              proposal={proposal}
              t={t}
              lang={lang}
              onApprove={onApprove}
              onDismiss={onDismissProposal}
            />
          )}

          <div className="mt-2">
            <div className="text-xs uppercase tracking-wider text-stone-400 mb-2">
              {t("approvedRules")}
            </div>
            {rules.length === 0 ? (
              <div className="text-sm text-stone-400 italic">
                {t("noRulesYet")}
              </div>
            ) : (
              <ul className="space-y-2">
                {rules.map((r) => (
                  <li
                    key={r.id}
                    className={`text-sm border rounded-md p-2.5 transition-all ${
                      justApprovedFlash === r.entityCanonical
                        ? "border-green-300 bg-green-50"
                        : "border-stone-200 bg-stone-50/60"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-stone-500 line-through decoration-stone-400 text-xs">
                        {r.pattern}
                      </div>
                      <div className="text-[0.65rem] text-accent uppercase tracking-wide">
                        {r.type === "person"
                          ? "Person"
                          : r.type === "place"
                            ? "Place"
                            : r.type === "organisation"
                              ? "Org"
                              : "Term"}
                      </div>
                    </div>
                    <div className="text-stone-900 font-medium">
                      {r.replacement}
                    </div>
                    <div className="text-[0.7rem] text-stone-400 mt-1">
                      {r.supportingCorrections} corrections · {r.contributors.length} editors
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-stone-200 bg-stone-50/50 p-2 text-center">
      <div className="font-serif text-xl text-stone-900 leading-none">{value}</div>
      <div className="text-[0.6rem] uppercase tracking-wider text-stone-500 mt-1 leading-tight">
        {label}
      </div>
    </div>
  );
}

function ProposalCard({
  proposal,
  t,
  lang,
  onApprove,
  onDismiss,
}: {
  proposal: Proposal;
  t: ReturnType<typeof tFn>;
  lang: Lang;
  onApprove: () => void;
  onDismiss: () => void;
}) {
  const e = entityFor(proposal.entityCanonical);
  return (
    <div className="mb-5 border border-accent/40 bg-gradient-to-br from-accent/5 to-transparent rounded-md p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
        <div className="text-[0.65rem] uppercase tracking-wider text-accent-dark font-medium">
          {t("proposalIntro")}
        </div>
      </div>
      <div className="text-sm text-stone-500 line-through decoration-stone-400">
        {proposal.pattern}
      </div>
      <div className="text-base font-medium text-stone-900 mb-2">
        {proposal.replacement}
      </div>
      <div className="text-[0.7rem] text-stone-500 mb-3 leading-snug">
        {t("proposalEvidence")}:{" "}
        {proposal.contributors.map((c, i) => (
          <span key={c}>
            {i > 0 && ", "}
            {c === "you"
              ? t("byYou")
              : `${t("byEditorB")} · ${e.seedHoursAgo}${t("hoursAgo")}`}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onApprove}
          className="flex-1 bg-accent-dark text-white text-xs font-medium px-3 py-2 rounded hover:bg-stone-900 transition-colors"
        >
          {t("approve")}
        </button>
        <button
          onClick={onDismiss}
          className="text-xs text-stone-500 hover:text-stone-900 px-3 py-2"
        >
          {t("notYet")}
        </button>
      </div>
    </div>
  );
}

function Line({
  line,
  lang,
  renderEntity,
}: {
  line: TranscriptLine;
  lang: Lang;
  renderEntity: (
    seg: Extract<Segment, { kind: "entity" }>,
    spanKey: string,
  ) => React.ReactNode;
}) {
  return (
    <div className="flex gap-4 text-stone-800">
      <div className="flex-shrink-0 w-14 pt-0.5 text-[0.7rem] text-stone-400 font-mono">
        {formatHm(line)}
      </div>
      <div className="flex-1">
        <div className="text-[0.7rem] text-accent uppercase tracking-wider mb-0.5">
          {line.speaker}
        </div>
        <div className="leading-relaxed">
          {line.segments.map((seg, idx) => {
            if (seg.kind === "text") {
              return <span key={idx}>{seg.value}</span>;
            }
            return renderEntity(seg, `${line.id}-${idx}`);
          })}
        </div>
      </div>
    </div>
  );
}

function Ep2View({
  t,
  lang,
  rules,
  preCorrectedCount,
  onNext,
}: {
  t: ReturnType<typeof tFn>;
  lang: Lang;
  rules: Rule[];
  preCorrectedCount: number;
  onNext: () => void;
}) {
  const ruleByCanonical = useMemo(() => {
    const m = new Map<string, Rule>();
    for (const r of rules) m.set(r.entityCanonical, r);
    return m;
  }, [rules]);

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-0 overflow-hidden">
      <div className="overflow-y-auto bg-stone-50 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-green-700">✨</span>
              <div className="text-sm font-medium text-green-900">
                {fmt(t("ep2BannerFmt"), {
                  rules: rules.length,
                  hits: preCorrectedCount,
                })}
              </div>
            </div>
            <div className="text-xs text-green-700/80 ml-6">{t("ep2Hint")}</div>
          </div>

          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-accent">
            Episode 2
          </div>
          <h2 className="font-serif text-2xl text-stone-900 mb-6">
            {t("ep2Heading")}
          </h2>

          <div className="space-y-3">
            {EP2_LINES.map((line) => (
              <Line
                key={line.id}
                line={line}
                lang={lang}
                renderEntity={(seg, spanKey) => {
                  const e = entityFor(seg.entityCanonical);
                  const rule = ruleByCanonical.get(seg.entityCanonical);
                  if (rule) {
                    return (
                      <span
                        key={spanKey}
                        className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-50 text-green-800 border border-green-200 text-[0.95em] cursor-help"
                        title={fmt(t("preCorrectedFmt"), {
                          from: rule.pattern,
                          to: rule.replacement,
                          n: rule.supportingCorrections,
                          k: rule.contributors.length,
                        })}
                      >
                        <span className="underline decoration-green-400 decoration-2 underline-offset-2">
                          {e.canonical}
                        </span>
                      </span>
                    );
                  }
                  return (
                    <span
                      key={spanKey}
                      className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[0.95em]"
                    >
                      <span className="underline decoration-amber-400 decoration-2 underline-offset-2">
                        {e.variant}
                      </span>
                    </span>
                  );
                }}
              />
            ))}
          </div>

          <div className="mt-10 flex justify-end">
            <button
              onClick={onNext}
              className="inline-flex items-center gap-2 bg-accent-dark text-white px-5 py-3 rounded-md text-sm font-medium hover:bg-stone-900 transition-colors"
            >
              {t("toImpact")}
            </button>
          </div>
        </div>
      </div>

      <aside className="border-l border-stone-200 bg-white overflow-y-auto">
        <div className="p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-accent mb-1">
            {t("panelTitle")}
          </div>
          <div className="font-serif text-lg text-stone-900 mb-4">
            {t("panelSub")}
          </div>
          <div className="text-xs uppercase tracking-wider text-stone-400 mb-2">
            {t("approvedRules")} · {rules.length}
          </div>
          <ul className="space-y-2">
            {rules.map((r) => (
              <li
                key={r.id}
                className="text-sm border border-stone-200 bg-stone-50/60 rounded-md p-2.5"
              >
                <div className="text-stone-900 font-medium">{r.replacement}</div>
                <div className="text-[0.7rem] text-stone-400 mt-0.5">
                  {r.supportingCorrections} corrections · {r.contributors.length} editors
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function ImpactView({
  t,
  rulesCount,
  preCorrectedCount,
  remainingErrors,
  onReset,
}: {
  t: ReturnType<typeof tFn>;
  rulesCount: number;
  preCorrectedCount: number;
  remainingErrors: number;
  onReset: () => void;
}) {
  // Assume ~25 seconds of editor time per correction.
  const minutesSavedRaw = (preCorrectedCount * 25) / 60;
  const minutesSaved = Math.round(minutesSavedRaw * 10) / 10;
  const totalEp2 = preCorrectedCount + remainingErrors;
  const withoutErrors = totalEp2; // all variant entities would be wrong without rules
  const withErrors = remainingErrors;
  const improvementPct =
    withoutErrors === 0
      ? 0
      : Math.round(((withoutErrors - withErrors) / withoutErrors) * 100);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="text-xs uppercase tracking-[0.18em] text-accent mb-3">
          {t("impactHeading")}
        </div>
        <h2 className="font-serif text-3xl text-stone-900 mb-8">
          +{improvementPct}% on contributor names
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <ImpactCell
            label={t("impactWithout")}
            value={`${withoutErrors}`}
            sub={t("errorsPerEp")}
            tone="warm"
          />
          <ImpactCell
            label={t("impactWith")}
            value={`${withErrors}`}
            sub={t("errorsPerEp")}
            tone="good"
          />
          <ImpactCell
            label={t("impactDelta")}
            value={`${minutesSaved}`}
            sub={t("minutesSaved")}
            tone="accent"
          />
        </div>

        <div className="border border-stone-200 bg-white rounded-lg p-5 mb-8">
          <div className="text-xs uppercase tracking-wider text-stone-400 mb-2">
            Series Memory · Y Sesiwn
          </div>
          <div className="font-serif text-2xl text-stone-900 mb-2">
            {rulesCount} rules · {preCorrectedCount} pre-corrections
          </div>
          <p className="text-sm text-stone-600 leading-relaxed">
            {t("ongoingNote")}
          </p>
        </div>

        <button
          onClick={onReset}
          className="text-sm text-accent-dark hover:text-stone-900 underline underline-offset-2"
        >
          {t("resetDemo")}
        </button>
      </div>
    </div>
  );
}

function ImpactCell({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "warm" | "good" | "accent";
}) {
  const toneClasses =
    tone === "warm"
      ? "border-amber-200 bg-amber-50"
      : tone === "good"
        ? "border-green-200 bg-green-50"
        : "border-stone-200 bg-white";
  const valueColor =
    tone === "warm"
      ? "text-amber-900"
      : tone === "good"
        ? "text-green-900"
        : "text-stone-900";
  return (
    <div className={`rounded-lg border p-5 ${toneClasses}`}>
      <div className="text-[0.65rem] uppercase tracking-wider text-stone-500 mb-2">
        {label}
      </div>
      <div className={`font-serif text-4xl mb-1 ${valueColor}`}>{value}</div>
      <div className="text-xs text-stone-500">{sub}</div>
    </div>
  );
}
