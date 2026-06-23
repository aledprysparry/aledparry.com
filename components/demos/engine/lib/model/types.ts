// ═══ Core data model for the multi-brand graphics engine ═══
//
// POC is single-user / no-login, but the shape is account-ready:
// everything hangs off a Brand, and a future `ownerId`/`workspaceId`
// can be added without restructuring. Persistence goes through the
// Repository interface (see lib/store) so localStorage today can become
// Supabase/Postgres later with zero model changes.

export type ID = string;
export type ISODate = string;

export type PlatformId =
  | 'instagram-feed'
  | 'instagram-carousel'
  | 'instagram-square'
  | 'instagram-story'
  | 'tiktok'
  | 'facebook'
  | 'linkedin'
  | 'x';

export type AssetType =
  | 'logo'
  | 'font'
  | 'background'
  | 'icon'
  | 'product'
  | 'reference'
  | 'social-post'
  | 'gif'
  | 'image';

export type TemplateType = 'carousel' | 'still' | 'sequence' | 'story-cover';

export type AuditStatus = 'not-started' | 'pending' | 'complete' | 'failed';

export interface Brand {
  id: ID;
  name: string;
  logos: ID[]; // BrandAsset ids of type 'logo'
  colours: string[]; // hex
  fonts: string[]; // family names
  toneNotes?: string;
  socialAccounts: ID[]; // SocialAccount ids
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface BrandAsset {
  id: ID;
  brandId: ID;
  type: AssetType;
  name: string;
  url: string; // remote URL or data: URL (POC stores small assets inline)
  metadata?: Record<string, unknown>;
  createdAt: ISODate;
}

export interface SocialAccount {
  id: ID;
  brandId: ID;
  platform: 'instagram' | 'tiktok' | 'facebook' | 'linkedin' | 'x';
  url: string;
  auditStatus: AuditStatus;
  auditSuggestions?: AuditSuggestion[];
  auditResult?: AuditResult;
}

/** Real analysis of a brand's uploaded reference posts. */
export interface AuditResult {
  count: number; // reference images analysed
  palette: string[]; // dominant hex colours
  theme: 'dark' | 'light';
  aspects: { portrait: number; square: number; landscape: number };
  dominantAspect: 'portrait' | 'square' | 'landscape';
}

export interface AuditSuggestion {
  title: string;
  rationale: string;
  templateKind?: string;
}

export interface TemplateStyle {
  id: ID;
  brandId: ID;
  name: string;
  colours: string[];
  typography: Record<string, unknown>;
  spacing: Record<string, unknown>;
  logoRules: Record<string, unknown>;
  layoutPatterns: Record<string, unknown>;
  visualTone?: string;
  createdAt: ISODate;
}

/** A user-created grouping of graphics within a brand. */
export interface Folder {
  id: ID;
  brandId: ID;
  name: string;
  createdAt: ISODate;
}

export interface Template {
  id: ID;
  brandId: ID;
  styleId?: ID;
  name: string;
  type: TemplateType;
  /**
   * Which built-in renderer powers this template (see lib/templates/
   * registry). The carousel POC ships the 'quizbookbiz-leaderboard' kind.
   */
  kind: string;
  supportedPlatforms: PlatformId[];
  dimensions: { width: number; height: number };
  /**
   * Master template: shared values graphics INHERIT. Edit the master and
   * every graphic that hasn't overridden a field updates. `copy` holds the
   * shared text (kicker, CTA, footer, score unit, …). Graphics store only
   * their own `inputs.copyOverrides`; effective = kind default ← master ←
   * override.
   */
  master?: { copy?: Record<string, string> };
  layout?: Record<string, unknown>;
  safeAreaRules?: Record<string, unknown>;
  /** Freeform templates generated from a style bake their starter
   * elements here; new graphics clone these instead of the kind default. */
  seedElements?: GraphicElement[];
  createdAt: ISODate;
}

export interface GraphicElement {
  id: ID;
  type: 'text' | 'image' | 'shape' | 'logo' | 'background';
  content?: string;
  assetId?: ID;
  position: { x: number; y: number }; // fractions 0-1
  size: { width: number; height: number }; // fractions 0-1
  style?: Record<string, unknown>;
}

export interface GraphicSlide {
  id: ID;
  order: number;
  elements: GraphicElement[];
}

export interface GeneratedGraphic {
  id: ID;
  brandId: ID;
  templateId: ID;
  platformPresetId?: PlatformId;
  /** Optional folder this graphic belongs to (null/undefined = Unfiled). */
  folderId?: ID;
  name: string;
  /**
   * Template-kind-driven graphics (the carousel POC) store their inputs
   * here (raw data + editable copy); the future free-form element editor
   * populates `slides` instead. Both can coexist per kind.
   */
  inputs?: Record<string, unknown>;
  slides?: GraphicSlide[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

/**
 * A saved short-form clip suggestion. Brand-scoped and folder-organised
 * EXACTLY like GeneratedGraphic (still assets) - so clips live in the same
 * Brand -> Folder structure, with the same rename/delete/move management.
 * Produced by the Clip Finder; persisted when the user saves it to a brand.
 */
export interface Clip {
  id: ID;
  brandId: ID;
  /** Optional folder this clip belongs to (null/undefined = Unfiled). */
  folderId?: ID;
  name: string;
  start: string; // mm:ss
  end: string;
  durationSeconds?: number;
  hook?: string;
  reason?: string;
  caption?: string;
  /** How the clip serves a brief (only set when a brief was provided). */
  fit?: string;
  platforms?: string[];
  aspectRatio?: string;
  score?: number;
  /** Provenance: the media URL + brief the clip was found from, if any. */
  sourceUrl?: string;
  brief?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface PlatformPreset {
  id: PlatformId;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  safeArea: { top: number; right: number; bottom: number; left: number }; // px
  slideCount?: { min: number; max: number };
  notes?: string;
}

// ═══ Postio Coach: structured AI content-coach layer ═══
//
// All Coach entities are brand-scoped and persisted through the same
// Repository pattern as everything else (localStorage today, Supabase later
// via lib/store). The shapes are deliberately backend-ready: stable string
// ids, brandId on every record, ISO timestamps, no derived UI state baked in.
// A "post" in Coach terms is a GeneratedGraphic, so postId === graphic id.

export type Priority = 'low' | 'medium' | 'high';
export type Confidence = 'low' | 'medium' | 'high';

export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'linkedin'
  | 'youtube'
  | 'x';

/** One scored benchmark category in a post analysis (spec #1). */
export interface AnalysisCategoryResult {
  id: string;
  label: string;
  enabled: boolean;
  score: number; // 0-100
  summary: string;
  issue?: string;
  recommendation: string;
  priority: Priority;
}

/** The always-practical next steps for a post (spec #2). */
export interface ActionPlan {
  quickWins: string[];
  recommendedEdits: string[];
  experimentalIdeas: string[];
  risks: string[];
}

/** A toggleable benchmark module the user can enable/disable (spec #3). */
export interface BenchmarkSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

/** A saved set of enabled benchmarks, per brand or shared (spec #3). */
export interface BenchmarkPreset {
  id: ID;
  name: string;
  enabledBenchmarkIds: string[];
  brandId?: ID;
  /** Built-in presets ship with the app and cannot be deleted. */
  builtIn?: boolean;
  createdAt?: ISODate;
}

/** Per-brand persisted Coach configuration (live toggle state + active preset). */
export interface CoachSettings {
  id: ID; // === brandId (one settings record per brand)
  brandId: ID;
  enabledBenchmarkIds: string[];
  activePresetId?: ID;
  updatedAt: ISODate;
}

/** An account the user admires and wants to learn from (spec #4). */
export interface AspirationalAccount {
  id: ID;
  brandId?: ID;
  platform: SocialPlatform;
  handle: string;
  displayName?: string;
  url?: string;
  notes?: string;
  enabled: boolean;
  /** Cached patterns extracted by the Coach (not scraped — manual / model). */
  profile?: AccountBenchmarkProfile;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/** Extracted (never copied) patterns from a reference account (spec #4). */
export interface AccountBenchmarkProfile {
  accountId: string;
  platform: string;
  commonFormats: string[];
  toneOfVoice: string[];
  visualStyle: string[];
  postingPatterns: string[];
  recurringHooks: string[];
  captionPatterns: string[];
  ctaPatterns: string[];
  highPerformingThemes: string[];
  contentPillars: string[];
  lessonsForUser: string[];
}

/** Raw performance numbers for a single post (spec #5). */
export interface PostPerformanceMetrics {
  impressions?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  watchTime?: number;
  completionRate?: number;
  engagementRate?: number;
  postedAt?: string;
  platform?: string;
}

/** A stored performance row: metrics for one (optionally linked) post. */
export interface PerformanceEntry {
  id: ID;
  brandId: ID;
  /** Linked graphic, when the numbers belong to a post made in Postio. */
  postId?: ID;
  /** A human label when the numbers are for an external/manual post. */
  label?: string;
  metrics: PostPerformanceMetrics;
  /** Provenance of the numbers: manual entry, CSV import, or sample data. */
  source: 'manual' | 'csv' | 'sample';
  createdAt: ISODate;
}

/** One learning derived from the user's own performance history (spec #5). */
export interface PerformanceInsight {
  insight: string;
  evidence: string;
  recommendation: string;
  confidence: Confidence;
}

/** A complete structured analysis of one post (spec #9). */
export interface PostAnalysis {
  id: ID;
  postId: ID;
  brandId: ID;
  createdAt: ISODate;
  overallScore: number; // 0-100
  benchmarkResults: AnalysisCategoryResult[];
  actionPlan: ActionPlan;
  /** Top 3 strengths + top 3 issues, for a scannable headline. */
  strengths: string[];
  issues: string[];
  /** Platform-specific notes for the intended platform. */
  platformNotes?: string;
  modelUsed: string;
}

export type AIRecommendationType =
  | 'headline'
  | 'caption'
  | 'cta'
  | 'visual'
  | 'animation'
  | 'platform'
  | 'accessibility'
  | 'timing';

/** A single applicable suggestion produced by an analysis (spec #9). */
export interface AIRecommendation {
  id: ID;
  postId: ID;
  brandId: ID;
  type: AIRecommendationType;
  originalValue?: string;
  suggestedValue: string;
  reason: string;
  priority: Priority;
  applied: boolean;
  /** When set, Apply writes suggestedValue into this text element. */
  targetElementId?: ID;
  createdAt: ISODate;
}

// ═══ Postio Coach: Strategy / Playbook layer ═══
//
// The reactive Coach scores existing posts; the Strategy layer is generative:
// a one-time per-brand business brief feeds a set of "plays" (full strategy,
// audience psychology, positioning, pillars, 30-day plan, scroll-stopping
// post, monetization), each producing a saved, structured artifact. Outputs
// feed the rest of the Coach (pillars -> plan -> draft -> Analyse -> learn).

/** A per-brand business brief, reused by every Strategy play (the `[paste]`). */
export interface CoachBrief {
  id: ID; // === brandId (one brief per brand)
  brandId: ID;
  niche: string;
  audience: string;
  goals: string;
  businessModel: string;
  competitors?: string;
  notes?: string;
  updatedAt: ISODate;
}

export type StrategyPlayId =
  | 'full_strategy'
  | 'audience_psychology'
  | 'authority_positioning'
  | 'content_pillars'
  | 'thirty_day_plan'
  | 'scroll_post'
  | 'monetization';

/** A titled block of advice (bullets and/or prose). */
export interface StrategySection {
  heading: string;
  body?: string;
  bullets?: string[];
}

/** Discriminated artifact payload: each play renders one of these shapes. */
export type StrategyData =
  | { kind: 'sections'; summary?: string; sections: StrategySection[] }
  | { kind: 'pillars'; summary?: string; pillars: { name: string; why: string; topics: string[] }[] }
  | { kind: 'calendar'; summary?: string; days: { day: number; idea: string; format: string; angle: string; goal: string }[] }
  | { kind: 'post'; hook: string; insight: string; cta: string; caption?: string; hashtags?: string[] };

export type StrategyDataKind = StrategyData['kind'];

/** A saved Strategy play output. */
export interface StrategyArtifact {
  id: ID;
  brandId: ID;
  play: StrategyPlayId;
  title: string;
  data: StrategyData;
  modelUsed: string;
  createdAt: ISODate;
}
