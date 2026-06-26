// ═══ Postio Voice AI - intent-to-output types ═══
// The reframe: the user describes the OUTCOME they want; the AI infers intent,
// proposes formats, plans the copy, and hands a draft to a human-approval
// review surface. Nothing publishes by itself. See POSTIO_VOICE_AI.md.
//
// These shapes are deliberately backend-ready: every record is brand-scoped and
// flat, so the M0 Supabase mirror (one id/jsonb/updated_at table each) drops in
// with no reshaping. Persisted via lib/voiceai/persist.ts (parallel to the
// store's persist.ts) so the thin MVP does not touch the main store reducer.

export type IntentModality = 'voice' | 'text' | 'image' | 'video' | 'document' | 'url';
export type IntentOutputClass = 'still' | 'carousel' | 'animated' | 'clip';
export type IntentLang = 'en' | 'cy' | 'bilingual';

export type IntentState =
  | 'idle'
  | 'detecting'
  | 'awaiting-pick'
  | 'planning'
  | 'awaiting-info'
  | 'generating'
  | 'reviewing'
  | 'approved'
  | 'rejected'
  | 'error';

export interface IntentCandidate {
  id: string;            // 'c1' | 'c2' | 'c3'
  format: string;        // human label e.g. "Numbered listicle carousel"
  generatorKind: string; // a real TemplateKind id, e.g. 'universal-listicle'
  outputClass: IntentOutputClass;
  why: string;           // one line: why this fits the goal
  confidence: number;    // 0..100
}

export interface IntentResult {
  goal: string;
  audience?: string;
  language: IntentLang;
  reasoning: string;
  candidates: IntentCandidate[];
}

export interface MissingInfo {
  id: string;
  question: string;
  blocking: boolean;
  options?: string[];
}

export interface PlanOption {
  id: string;            // 'B' | 'C'
  label: string;         // "Punchier hook"
  copy: Record<string, string>;
}

// The creative-judgement verdict attached to a judged plan: the self-scores per
// dimension, the one-line concept/hook the draft was built around, the angle
// used, whether every dimension cleared the bar, and how many concept rewrites
// it took. Optional so offline drafts (no AI) and older sessions stay valid.
export interface CreativeReport {
  scores: { hook: number; clarity: number; shareability: number; welshTone: number; cta: number };
  concept: string;
  angle: string;
  passed: boolean;
  revisions: number;
}

export interface IntentPlan {
  reasoning: string;
  copy: Record<string, string>;     // keyed by the generator's real copyField keys
  options: PlanOption[];
  missingInfo: MissingInfo[];
  creative?: CreativeReport;
}

export interface IntentSession {
  id: string;
  brandId: string;
  createdAt: string;
  updatedAt: string;
  state: IntentState;
  input: {
    modality: IntentModality;
    rawText?: string;
    lang: 'en' | 'cy' | 'auto';
  };
  detected?: IntentResult;
  chosenCandidateId?: string;
  plan?: IntentPlan;
  producedGraphicIds: string[];
  reviewId?: string;
  error?: string;
}

export interface ApprovalSignal {
  id: string;
  brandId: string;
  sessionId: string;
  graphicId?: string;
  decision: 'approved' | 'edited' | 'rejected';
  chosenOptionId?: string;          // which alternative the human picked, if any
  intentGoal: string;
  generatorKind: string;
  createdAt: string;
}
