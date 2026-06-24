// ═══ Voice AI orchestrator ═══
// The spine. A client-side state machine that runs the intent->output loop by
// delegating to things that ALREADY exist: the gated AI route (intent-detect /
// intent-plan), the store (createTemplate/createGraphic/updateGraphic) and the
// deterministic exporters. It never calls Anthropic directly and never
// publishes; export (download) is the only terminal, and only a human approve
// action sets the approved state. See POSTIO_VOICE_AI.md.
//
// M-V1 scope: text input -> two universal carousel generators -> review/approve.
// Voice, image, URL, clips, Coach scoring and the applied learning loop are
// later milestones in the roadmap.

import { useCallback, useEffect, useState } from 'react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { getKind, kindBaseCopy, platformToRatio } from '@engine/lib/templates/registry';
import { effectiveCopy, graphicOverrides } from '@engine/lib/carousel/copy';
import { exportZip } from '@engine/lib/carousel/exportCarousel';
import { voiceSummary } from '@engine/lib/coach/voice';
import { newId, now } from '@engine/lib/store/persist';
import { detectIntent, planIntent, AiError } from './client';
import { upsertSession, addSignal } from './persist';
import type {
  IntentSession, IntentResult, IntentCandidate, IntentPlan, IntentState, IntentLang,
} from './types';

// M-V1 routes to the two brand-agnostic universal carousels only (the agreed
// first trio without the Cwis-specific kinds). Widen this list to add formats.
export const MV1_KINDS = ['universal-listicle', 'universal-explainer'];

// Welsh smell test for the offline fallback (true ASR/AI handles real detection).
const CY_TOKENS = /\b(mae|wedi|eich|ein|gyda|sydd|ond|neu|chi|wrth|iawn|am|yn|dim|isio|moyn|dwi)\b/i;
function guessLang(text: string): IntentLang {
  return CY_TOKENS.test(text) ? 'cy' : 'en';
}

function kindSpecs() {
  return MV1_KINDS.map((kind) => {
    const k = getKind(kind);
    return { kind, label: k?.name ?? kind, blurb: k?.description ?? '', outputClass: 'carousel' as const };
  });
}

// Offline fallbacks: keep the slice working without the gate cookie or a key,
// mirroring Coach's deterministic path. Marked usedAI=false so the UI can say so.
function localDetect(text: string): IntentResult {
  const specs = kindSpecs();
  const conf = [72, 64, 56];
  return {
    goal: text.trim().slice(0, 120),
    audience: '',
    language: guessLang(text),
    reasoning: 'Offline draft: showing the formats this brand can make right now.',
    candidates: specs.map((s, i) => ({
      id: `c${i + 1}`,
      format: s.label,
      generatorKind: s.kind,
      outputClass: 'carousel' as const,
      why: s.blurb,
      confidence: conf[i] ?? 50,
    })),
  };
}
function localPlan(text: string, kindId: string, lang: 'en' | 'cy'): IntentPlan {
  const base = { ...kindBaseCopy(getKind(kindId), lang) };
  const title = text.trim().slice(0, 80);
  if (title) base.title = title;
  return { reasoning: 'Offline draft: your words used as the headline, the rest from the template. Edit anything in the editor.', copy: base, options: [], missingInfo: [] };
}

export interface OrchestratorView {
  state: IntentState;
  usedAI: boolean;
  detected?: IntentResult;
  plan?: IntentPlan;
  chosenCandidateId?: string;
  chosenOptionId?: string;
  graphicId?: string;
  notice?: string;     // a soft, human-readable note (e.g. running offline)
  error?: string;
}

export function useOrchestrator(brandId: string) {
  const store = useStore();
  const { lang } = useI18n();
  const [view, setView] = useState<OrchestratorView>({ state: 'idle', usedAI: false });
  const [session, setSession] = useState<IntentSession | null>(null);
  // The store's methods close over the render's state, so a freshly-created
  // template is not visible to createGraphic in the SAME tick. When we have to
  // create the template, we stash the request and finish generation in an
  // effect once the next render's store reflects it.
  const [pendingGen, setPendingGen] = useState<{ templateId: string; name: string; plan: IntentPlan; usedAI: boolean; notice?: string } | null>(null);

  // Persist the session as a pure side-effect of it changing, never inside a
  // state updater (which can run during render).
  useEffect(() => { if (session) upsertSession(session); }, [session]);

  const patchSession = useCallback((patch: Partial<IntentSession>) => {
    setSession((prev) => (prev ? { ...prev, ...patch, updatedAt: now() } : prev));
  }, []);

  const reset = useCallback(() => {
    setView({ state: 'idle', usedAI: false });
    setSession(null);
  }, []);

  // 1. INTENT DETECTION
  const detect = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const brand = store.getBrand(brandId);
    const ctx = brand ? { name: brand.name, toneNotes: brand.toneNotes, colours: brand.colours, fonts: brand.fonts } : undefined;
    const voice = brand ? voiceSummary(store.getVoiceProfile(brandId)) : undefined;
    const s: IntentSession = {
      id: newId('intent'), brandId, createdAt: now(), updatedAt: now(),
      state: 'detecting', input: { modality: 'text', rawText: trimmed, lang: 'auto' },
      producedGraphicIds: [],
    };
    setSession(s); // persisted by the effect above
    setView({ state: 'detecting', usedAI: false });
    let detected: IntentResult; let usedAI = true; let notice: string | undefined;
    try {
      detected = await detectIntent({ text: trimmed, brand: ctx, voice, kindSpecs: kindSpecs() });
      // Only ever offer M-V1 kinds, whatever the model returns.
      detected.candidates = detected.candidates.filter((c) => MV1_KINDS.includes(c.generatorKind)).slice(0, 3);
      if (!detected.candidates.length) detected = localDetect(trimmed);
    } catch (e) {
      detected = localDetect(trimmed); usedAI = false;
      notice = e instanceof AiError && e.reason === 'unauthorized' ? 'offline-locked' : 'offline';
    }
    patchSession({ state: 'awaiting-pick', detected });
    setView({ state: 'awaiting-pick', usedAI, detected, notice });
  }, [brandId, store, patchSession]);

  // 2. PICK A CANDIDATE (approval gate #1) -> 3. PLAN -> 4/5. GENERATE
  const pick = useCallback(async (candidate: IntentCandidate) => {
    const text = session?.input.rawText ?? '';
    const kind = getKind(candidate.generatorKind);
    if (!kind) return;
    const brand = store.getBrand(brandId);
    const ctx = brand ? { name: brand.name, toneNotes: brand.toneNotes, colours: brand.colours, fonts: brand.fonts } : undefined;
    const voice = brand ? voiceSummary(store.getVoiceProfile(brandId)) : undefined;
    const fields = (kind.copyFields ?? []).map((f) => ({ key: f.key, label: f.label }));
    setView((v) => ({ ...v, state: 'planning', chosenCandidateId: candidate.id }));
    patchSession({ state: 'planning', chosenCandidateId: candidate.id });

    let plan: IntentPlan; let usedAI = true; let notice: string | undefined;
    try {
      plan = await planIntent({ text, candidate, copyFields: fields, brand: ctx, voice });
      if (!plan.copy || !Object.keys(plan.copy).length) plan = localPlan(text, candidate.generatorKind, lang);
    } catch (e) {
      plan = localPlan(text, candidate.generatorKind, lang); usedAI = false;
      notice = e instanceof AiError && e.reason === 'unauthorized' ? 'offline-locked' : 'offline';
    }

    // Generate the real asset through the existing store path. Reuse a template
    // of this kind if the brand already owns one (visible in state now); else
    // create it and let the effect below finish once the store reflects it.
    const name = (plan.copy.title || candidate.format || 'Draft').slice(0, 60);
    const existing = store.templatesByBrand(brandId).find((t) => t.kind === candidate.generatorKind);
    if (existing) {
      const g = store.createGraphic(brandId, existing.id, { name });
      if (!g) { setView((v) => ({ ...v, state: 'error', error: 'Could not create graphic.' })); return; }
      store.updateGraphic(g.id, { inputs: { rawText: '', copyOverrides: plan.copy } });
      patchSession({ state: 'reviewing', plan, producedGraphicIds: [g.id] });
      setView((v) => ({ ...v, state: 'reviewing', usedAI, plan, graphicId: g.id, notice }));
      return;
    }
    const tpl = store.createTemplate(brandId, candidate.generatorKind, undefined);
    if (!tpl) { setView((v) => ({ ...v, state: 'error', error: 'Could not create template.' })); return; }
    setView((v) => ({ ...v, state: 'generating', usedAI, plan, notice }));
    setPendingGen({ templateId: tpl.id, name, plan, usedAI, notice });
  }, [brandId, session, store, lang, patchSession]);

  // Finish generation once the just-created template is visible in store state.
  useEffect(() => {
    if (!pendingGen) return;
    if (!store.templates.some((t) => t.id === pendingGen.templateId)) return;
    const g = store.createGraphic(brandId, pendingGen.templateId, { name: pendingGen.name });
    if (!g) { setView((v) => ({ ...v, state: 'error', error: 'Could not create graphic.' })); setPendingGen(null); return; }
    store.updateGraphic(g.id, { inputs: { rawText: '', copyOverrides: pendingGen.plan.copy } });
    patchSession({ state: 'reviewing', plan: pendingGen.plan, producedGraphicIds: [g.id] });
    setView((v) => ({ ...v, state: 'reviewing', usedAI: pendingGen.usedAI, plan: pendingGen.plan, graphicId: g.id, notice: pendingGen.notice }));
    setPendingGen(null);
  }, [pendingGen, store, brandId, patchSession]);

  // Swap the headline/copy to an alternative option (counts as an edit).
  const applyOption = useCallback((optionId: string) => {
    const g = view.graphicId; const plan = view.plan;
    if (!g || !plan) return;
    const opt = plan.options.find((o) => o.id === optionId);
    if (!opt) return;
    const current = (store.getGraphic?.(g)?.inputs?.copyOverrides as Record<string, string>) ?? plan.copy;
    store.updateGraphic(g, { inputs: { rawText: '', copyOverrides: { ...current, ...opt.copy } } });
    setView((v) => ({ ...v, chosenOptionId: optionId }));
  }, [view.graphicId, view.plan, store]);

  // 6/7. APPROVE / REJECT (approval gate #2) -> learning signal
  const finish = useCallback((decision: 'approved' | 'rejected') => {
    const goal = view.detected?.goal ?? '';
    const kind = view.detected?.candidates.find((c) => c.id === view.chosenCandidateId)?.generatorKind ?? '';
    addSignal({
      id: newId('sig'), brandId, sessionId: session?.id ?? '', graphicId: view.graphicId,
      decision: decision === 'approved' && view.chosenOptionId ? 'edited' : decision,
      chosenOptionId: view.chosenOptionId, intentGoal: goal, generatorKind: kind, createdAt: now(),
    });
    patchSession({ state: decision });
    setView((v) => ({ ...v, state: decision }));
  }, [brandId, session, view, patchSession]);

  // Optional direct export, reusing the editor's exact recipe.
  const exportDraft = useCallback(async () => {
    const gid = view.graphicId; if (!gid) return;
    const g = store.getGraphic?.(gid); if (!g) return;
    const tpl = store.getTemplate(g.templateId); const kind = tpl && getKind(tpl.kind);
    if (!tpl || !kind || !kind.slides) return;
    const overrides = graphicOverrides(g.inputs);
    const copy = effectiveCopy(kindBaseCopy(kind, lang), tpl.master?.copy, overrides) as Record<string, string>;
    const brand = store.getBrand(g.brandId);
    const carBrand = brand ? { name: brand.name, colours: brand.colours, fonts: brand.fonts } : undefined;
    const ratio = platformToRatio(g.platformPresetId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await exportZip(kind.slides as any, [], copy as any, 'image/png', g.name, ratio, carBrand as any, {});
  }, [view.graphicId, store, lang]);

  return { view, detect, pick, applyOption, approve: () => finish('approved'), reject: () => finish('rejected'), exportDraft, reset };
}
