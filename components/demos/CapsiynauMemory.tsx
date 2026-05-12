"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BACKSTORY_SEEDS,
  ENTITIES,
  EP1,
  EP2,
  buildBackstoryEvents,
} from "@/lib/capsiynau/data";
import {
  approveProposal as engineApproveProposal,
  proposeRules,
} from "@/lib/capsiynau/engine";
import type {
  CorrectionEvent,
  Entity,
  MeasurementResult,
  Proposal,
  Rule,
  Segment,
  TranscriptLine,
} from "@/lib/capsiynau/types";

/**
 * Capsiynau — Series Memory
 *
 * Interactive surface for the self-improving production-intelligence layer.
 * The visitor plays the role of an editor on the Welsh series "Y Sesiwn".
 * They correct mis-spelled contributor names on Episode 1 and watch the
 * system propose rules, accept their approval, then pre-apply those rules
 * to Episode 2 — visibly improving before they touch it.
 *
 * The loop logic lives in `lib/capsiynau/engine.ts` and is shared with the
 * /api/capsiynau/measure route. The Impact screen calls that route to
 * report a measured precision delta on a held-out reference clip.
 */

type Lang = "en" | "cy";
type Stage = "intro" | "ep1" | "ep2" | "impact";

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

function seedInfoFor(canonical: string) {
  return BACKSTORY_SEEDS.find((s) => s.entityCanonical === canonical) ?? null;
}

function buildSessionEvents(
  correctedSpans: Set<string>,
  spanLookup: Map<string, string>,
  now: number,
): CorrectionEvent[] {
  const events: CorrectionEvent[] = [];
  for (const sk of correctedSpans) {
    const canonical = spanLookup.get(sk);
    if (!canonical) continue;
    const e = entityFor(canonical);
    events.push({
      id: `you-${sk}`,
      entityCanonical: canonical,
      spanKey: sk,
      before: e.variant,
      after: e.canonical,
      userId: "you",
      episodeId: EP1.id,
      occurredAt: now,
    });
  }
  return events;
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

  const ep1SpanLookup = useMemo(() => {
    const m = new Map<string, string>();
    for (const line of EP1.lines) {
      let idx = 0;
      for (const seg of line.segments) {
        if (seg.kind === "entity") {
          m.set(`${line.id}-${idx}`, seg.entityCanonical);
        }
        idx++;
      }
    }
    return m;
  }, []);

  const correctionsObserved = useMemo(() => {
    return BACKSTORY_SEEDS.length + correctedSpansEp1.size;
  }, [correctedSpansEp1.size]);

  const distinctContributors = useMemo(() => {
    const s = new Set<string>();
    if (correctedSpansEp1.size > 0) s.add("you");
    for (const seed of BACKSTORY_SEEDS) s.add(seed.userId);
    return s.size;
  }, [correctedSpansEp1.size]);

  const handleCorrect = useCallback(
    (entityCanonical: string, spanKey: string) => {
      if (correctedSpansEp1.has(spanKey)) return;

      const nextSet = new Set(correctedSpansEp1);
      nextSet.add(spanKey);
      setCorrectedSpansEp1(nextSet);

      if (ruleByCanonical.has(entityCanonical)) return;

      // Run the same engine that the production loop would run. The
      // events list is the union of the backstory (other editors' prior
      // corrections on earlier episodes) and this session's corrections.
      const now = Date.now();
      const events = [
        ...buildBackstoryEvents(now),
        ...buildSessionEvents(nextSet, ep1SpanLookup, now),
      ];
      const proposals = proposeRules({
        events,
        existingRules: rules,
        entities: ENTITIES,
      });
      const next = proposals.find((p) => p.entityCanonical === entityCanonical);
      if (next) setProposal(next);
    },
    [correctedSpansEp1, ep1SpanLookup, ruleByCanonical, rules],
  );

  const handleApproveProposal = useCallback(() => {
    if (!proposal) return;
    const ruleId = `rule-${proposal.entityCanonical
      .replace(/\s+/g, "-")
      .toLowerCase()}`;
    const newRule = engineApproveProposal({
      proposal,
      approvedBy: "curator-demo",
      approvedAt: Date.now(),
      ruleId,
    });
    setRules((prev) => [...prev, newRule]);
    setJustApprovedFlash(proposal.entityCanonical);
    setProposal(null);
    window.setTimeout(() => setJustApprovedFlash(null), 1500);
  }, [proposal]);

  const ep2PreCorrectedCount = useMemo(() => {
    let count = 0;
    for (const line of EP2.lines) {
      for (const seg of line.segments) {
        if (seg.kind === "entity" && ruleByCanonical.has(seg.entityCanonical)) {
          count++;
        }
      }
    }
    return count;
  }, [ruleByCanonical]);

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
          rules={rules}
          preCorrectedCount={ep2PreCorrectedCount}
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
    for (const line of EP1.lines) {
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
            {EP1.lines.map((line) => (
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
                      {r.supportingEventIds.length} corrections · {r.contributors.length} editors
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
  const seed = seedInfoFor(proposal.entityCanonical);
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
              : seed
                ? `${t("byEditorB")} · ${seed.hoursAgo}${t("hoursAgo")}`
                : t("byEditorB")}
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
            {EP2.lines.map((line) => (
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
                          n: rule.supportingEventIds.length,
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
                  {r.supportingEventIds.length} corrections · {r.contributors.length} editors
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
  rules,
  preCorrectedCount,
  onReset,
}: {
  t: ReturnType<typeof tFn>;
  rules: Rule[];
  preCorrectedCount: number;
  onReset: () => void;
}) {
  const [baseline, setBaseline] = useState<MeasurementResult | null>(null);
  const [withRules, setWithRules] = useState<MeasurementResult | null>(null);
  const [goldenSetSize, setGoldenSetSize] = useState<number | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const [baselineRes, withRulesRes] = await Promise.all([
          fetch("/api/capsiynau/measure", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rules: [] }),
          }).then((r) => r.json()),
          fetch("/api/capsiynau/measure", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rules }),
          }).then((r) => r.json()),
        ]);
        if (cancelled) return;
        setBaseline(baselineRes.result);
        setWithRules(withRulesRes.result);
        setGoldenSetSize(baselineRes.goldenSetSize);
        setStatus("ready");
      } catch {
        if (cancelled) return;
        setStatus("error");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [rules]);

  const precisionDelta =
    baseline && withRules ? withRules.precision - baseline.precision : 0;
  const improvementPct = Math.round(precisionDelta * 100);
  const minutesSaved =
    Math.round(((preCorrectedCount * 25) / 60) * 10) / 10;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="text-xs uppercase tracking-[0.18em] text-accent mb-3">
          {t("impactHeading")}
        </div>
        <h2 className="font-serif text-3xl text-stone-900 mb-2">
          {status === "loading"
            ? "Measuring against held-out reference…"
            : status === "error"
              ? "Measurement unavailable"
              : `+${improvementPct} precision points on the held-out clip`}
        </h2>
        {status === "ready" && goldenSetSize !== null && (
          <p className="text-sm text-stone-500 mb-8">
            Measured against a hand-labelled, held-out clip with {goldenSetSize}{" "}
            entity spans the system never saw. Same audio, same reference,
            scored before and after your approved rules were applied.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <ImpactCell
            label={t("impactWithout")}
            value={baseline ? formatPct(baseline.precision) : "—"}
            sub={`precision · ${baseline ? baseline.truePositives : "—"} / ${baseline ? baseline.total : "—"}`}
            tone="warm"
          />
          <ImpactCell
            label={t("impactWith")}
            value={withRules ? formatPct(withRules.precision) : "—"}
            sub={`precision · ${withRules ? withRules.truePositives : "—"} / ${withRules ? withRules.total : "—"}`}
            tone="good"
          />
          <ImpactCell
            label={t("impactDelta")}
            value={`${minutesSaved}`}
            sub={t("minutesSaved")}
            tone="accent"
          />
        </div>

        {status === "ready" && baseline && withRules && (
          <div className="border border-stone-200 bg-white rounded-lg p-5 mb-8">
            <div className="text-xs uppercase tracking-wider text-stone-400 mb-3">
              Held-out measurement detail · Y Sesiwn
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm mb-3">
              <MetricRow label="Precision" before={baseline.precision} after={withRules.precision} />
              <MetricRow label="Recall"    before={baseline.recall}    after={withRules.recall} />
              <MetricRow label="F1"        before={baseline.f1}        after={withRules.f1} />
            </div>
            <div className="text-xs text-stone-500 leading-relaxed">
              {withRules.rulesApplied.length} of your {rules.length} approved rules
              fired against the held-out clip. The remaining errors are entities
              the system has never been corrected on — they become the next round
              of proposals.
            </div>
          </div>
        )}

        <div className="border border-stone-200 bg-white rounded-lg p-5 mb-8">
          <div className="text-xs uppercase tracking-wider text-stone-400 mb-2">
            Series Memory · Y Sesiwn
          </div>
          <div className="font-serif text-2xl text-stone-900 mb-2">
            {rules.length} rules · {preCorrectedCount} pre-corrections
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

function MetricRow({
  label,
  before,
  after,
}: {
  label: string;
  before: number;
  after: number;
}) {
  return (
    <div>
      <div className="text-[0.65rem] uppercase tracking-wider text-stone-400 mb-1">
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-stone-400 text-sm line-through decoration-stone-300">
          {formatPct(before)}
        </span>
        <span className="text-stone-900 font-medium">{formatPct(after)}</span>
      </div>
    </div>
  );
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
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
