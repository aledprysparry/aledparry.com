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
