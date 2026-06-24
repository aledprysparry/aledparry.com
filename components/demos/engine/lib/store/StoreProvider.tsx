// ═══ Store: in-memory reactive state backed by local persistence ═══
// Components read from React state (fast, reactive) and mutate through
// typed actions; every action persists via lib/store/persist. To move
// to Supabase later, reimplement the action bodies against an async
// repository - the component API (useStore) stays identical.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type {
  Brand,
  BrandAsset,
  SocialAccount,
  TemplateStyle,
  Template,
  GeneratedGraphic,
  GraphicElement,
  Clip,
  Folder,
  AssetType,
  PlatformId,
  AspirationalAccount,
  PostAnalysis,
  AIRecommendation,
  PerformanceEntry,
  PostPerformanceMetrics,
  BenchmarkPreset,
  CoachSettings,
  AccountBenchmarkProfile,
  CoachBrief,
  StrategyArtifact,
  StrategyPlayId,
  VoiceProfile,
} from '@engine/lib/model/types';
import { getKind } from '@engine/lib/templates/registry';
import {
  loadCollection,
  saveCollection,
  seededFlag,
  markSeeded,
  newId,
  now,
  loadLang,
  exportSnapshot,
  type CollectionName,
} from './persist';
import { buildSeed } from './seed';
import { loadAssetsIDB, saveAssetsIDB } from './assetStore';
import { supabaseConfigured } from './supabaseClient';
import { loadAllFromSupabase, syncCollectionToSupabase } from './supabaseSync';

interface StoreState {
  brands: Brand[];
  assets: BrandAsset[];
  socialAccounts: SocialAccount[];
  templateStyles: TemplateStyle[];
  templates: Template[];
  graphics: GeneratedGraphic[];
  clips: Clip[];
  folders: Folder[];
  // ── Postio Coach ──
  referenceAccounts: AspirationalAccount[];
  postAnalyses: PostAnalysis[];
  aiRecommendations: AIRecommendation[];
  performance: PerformanceEntry[];
  coachPresets: BenchmarkPreset[];
  coachSettings: CoachSettings[];
  coachBriefs: CoachBrief[];
  strategyArtifacts: StrategyArtifact[];
  voiceProfiles: VoiceProfile[];
}

const MASTER_MIGRATION_KEY = 'cg.v1.masterMigrated';

// One-time migration to the master/instance model: promote each template's
// shared copy to its `master` (from its latest graphic's copy, else the kind
// default), then RE-LINK every graphic to inherit it (clear full copy →
// empty overrides). Runs once per browser.
function migrateMaster(templates: Template[], graphics: GeneratedGraphic[]): { templates: Template[]; graphics: GeneratedGraphic[] } | null {
  if (typeof localStorage === 'undefined' || localStorage.getItem(MASTER_MIGRATION_KEY) === 'true') return null;
  const newTemplates = templates.map((t) => {
    if (t.master?.copy) return t;
    const kind = getKind(t.kind);
    const latest = graphics
      .filter((g) => g.templateId === t.id && g.inputs?.copy)
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))[0];
    const promoted = (latest?.inputs?.copy as Record<string, string>) ?? {};
    return { ...t, master: { copy: { ...(kind?.defaultCopy ?? {}), ...promoted } } };
  });
  const newGraphics = graphics.map((g) => {
    if (!g.inputs?.copy) return g; // freeform or already migrated
    const { copy, ...rest } = g.inputs as Record<string, unknown>;
    void copy;
    return { ...g, inputs: { ...rest, copyOverrides: {} } };
  });
  localStorage.setItem(MASTER_MIGRATION_KEY, 'true');
  saveCollection('templates', newTemplates);
  saveCollection('graphics', newGraphics);
  return { templates: newTemplates, graphics: newGraphics };
}

const ANIMATED_SCOPE_KEY = 'cg.v1.animatedTplScoped';
// Brand-specific (non-universal) branded kinds. A brand that owns one of these
// is a "client" brand that legitimately keeps its animated caption.
const BRANDED_KINDS = new Set(['quizbookbiz-leaderboard', 'cwis-weekly-scoreboard', 'cwis-quiz', 'cwis-top-groups', 'cwis-poll']);

// One-time: add the "Question of the day" (cwis-quiz) template to brands that
// already own a Cwis-painted kind (the leaderboard/scoreboard) - i.e. the Cwis
// brand seeded before this kind existed - AND refresh any existing quiz
// template's capability fields (platforms + dimensions) from the kind, so an
// early-seeded record picks up the later square/aspect support. Fresh installs
// get it correct via buildSeed. (Key bumped to re-run for early adopters.)
const QUIZ_SEED_KEY = 'cg.v1.quizKindSeeded2';
function ensureQuizForCwis(templates: Template[]): Template[] | null {
  if (typeof localStorage === 'undefined' || localStorage.getItem(QUIZ_SEED_KEY) === 'true') return null;
  localStorage.setItem(QUIZ_SEED_KEY, 'true');
  const kind = getKind('cwis-quiz');
  if (!kind) return null;
  let changed = false;
  // Refresh capability fields on existing quiz templates.
  let next = templates.map((t) => {
    if (t.kind !== 'cwis-quiz') return t;
    if (sameArray(t.supportedPlatforms, kind.supportedPlatforms) && t.dimensions.width === kind.dimensions.width && t.dimensions.height === kind.dimensions.height) return t;
    changed = true;
    return { ...t, supportedPlatforms: kind.supportedPlatforms, dimensions: kind.dimensions };
  });
  // Add to Cwis brands that don't own one yet.
  const cwisBrandIds = Array.from(new Set(
    next.filter((t) => t.kind === 'quizbookbiz-leaderboard' || t.kind === 'cwis-weekly-scoreboard').map((t) => t.brandId),
  ));
  const owns = new Set(next.filter((t) => t.kind === 'cwis-quiz').map((t) => t.brandId));
  for (const brandId of cwisBrandIds) {
    if (owns.has(brandId)) continue;
    next = [...next, {
      id: newId('tpl'), brandId, name: kind.name, type: kind.type, kind: kind.id,
      supportedPlatforms: kind.supportedPlatforms, dimensions: kind.dimensions,
      // empty master: cwis-quiz has defaultCopyByLang, so copy follows the language
      master: { copy: {} },
      createdAt: now(),
    }];
    changed = true;
  }
  if (!changed) return null;
  saveCollection('templates', next);
  return next;
}

// One-time: add the "Top Groups" (cwis-top-groups) template to brands that
// already own a Cwis-painted kind - i.e. the Cwis brand seeded before this
// kind existed. Fresh installs get it via buildSeed.
const TOP_GROUPS_SEED_KEY = 'cg.v1.topGroupsKindSeeded';
function ensureTopGroupsForCwis(templates: Template[]): Template[] | null {
  if (typeof localStorage === 'undefined' || localStorage.getItem(TOP_GROUPS_SEED_KEY) === 'true') return null;
  localStorage.setItem(TOP_GROUPS_SEED_KEY, 'true');
  const kind = getKind('cwis-top-groups');
  if (!kind) return null;
  const cwisBrandIds = Array.from(new Set(
    templates.filter((t) => t.kind === 'quizbookbiz-leaderboard' || t.kind === 'cwis-weekly-scoreboard' || t.kind === 'cwis-quiz').map((t) => t.brandId),
  ));
  const owns = new Set(templates.filter((t) => t.kind === 'cwis-top-groups').map((t) => t.brandId));
  let next = templates;
  let changed = false;
  for (const brandId of cwisBrandIds) {
    if (owns.has(brandId)) continue;
    next = [...next, {
      id: newId('tpl'), brandId, name: kind.name, type: kind.type, kind: kind.id,
      supportedPlatforms: kind.supportedPlatforms, dimensions: kind.dimensions,
      // empty master: cwis-top-groups has defaultCopyByLang, so copy follows the language
      master: { copy: {} },
      createdAt: now(),
    }];
    changed = true;
  }
  if (!changed) return null;
  saveCollection('templates', next);
  return next;
}

// Generic one-time seed: add a Cwis-painted kind to brands that already own a
// Cwis kind (the Cwis brand seeded before this kind existed). Fresh installs
// get it via buildSeed. Used for kinds added after the original seed.
function ensureBrandedKindForCwis(templates: Template[], kindId: string, seedKey: string): Template[] | null {
  if (typeof localStorage === 'undefined' || localStorage.getItem(seedKey) === 'true') return null;
  localStorage.setItem(seedKey, 'true');
  const kind = getKind(kindId);
  if (!kind) return null;
  const cwisBrandIds = Array.from(new Set(
    templates.filter((t) => t.kind === 'quizbookbiz-leaderboard' || t.kind === 'cwis-weekly-scoreboard' || t.kind === 'cwis-quiz').map((t) => t.brandId),
  ));
  const owns = new Set(templates.filter((t) => t.kind === kindId).map((t) => t.brandId));
  let next = templates;
  let changed = false;
  for (const brandId of cwisBrandIds) {
    if (owns.has(brandId)) continue;
    next = [...next, {
      id: newId('tpl'), brandId, name: kind.name, type: kind.type, kind: kind.id,
      supportedPlatforms: kind.supportedPlatforms, dimensions: kind.dimensions,
      master: { copy: {} }, // defaultCopyByLang kinds follow the app language
      createdAt: now(),
    }];
    changed = true;
  }
  if (!changed) return null;
  saveCollection('templates', next);
  return next;
}

function sameArray(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

// One-time: language-aware kinds used to BAKE a single language's defaults into
// `master.copy`, which then shadowed the live app language (so the template was
// stuck in whatever language it was created in). Strip any master field that
// merely equals a baked default (en OR cy) so the copy follows the language
// again - while preserving GENUINE master edits (values that match neither).
const MASTER_DELANG_KEY = 'cg.v1.masterDelang';
function delangBakedMaster(templates: Template[]): Template[] | null {
  if (typeof localStorage === 'undefined' || localStorage.getItem(MASTER_DELANG_KEY) === 'true') return null;
  localStorage.setItem(MASTER_DELANG_KEY, 'true');
  let changed = false;
  const next = templates.map((t) => {
    const byLang = getKind(t.kind)?.defaultCopyByLang;
    const master = t.master?.copy;
    if (!byLang || !master) return t;
    const en = byLang.en ?? {};
    const cy = byLang.cy ?? {};
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(master)) {
      if (v === en[k] || v === cy[k]) continue; // a baked default → drop
      cleaned[k] = v;                            // a genuine edit → keep
    }
    if (Object.keys(cleaned).length === Object.keys(master).length) return t;
    changed = true;
    return { ...t, master: { copy: cleaned } };
  });
  if (!changed) return null;
  saveCollection('templates', next);
  return next;
}

// One-time: undo the earlier auto-seed that pushed an "Animated caption"
// template into EVERY brand. Animated caption is now client-only (#74 rule), so
// strip the stray auto-seeded instances from brands that don't own one — but
// keep any that a graphic actually uses (never destroy real work) and keep the
// owner/client brand's. Runs once per browser.
function scopeAnimatedTemplates(templates: Template[], graphics: GeneratedGraphic[]): Template[] | null {
  if (typeof localStorage === 'undefined' || localStorage.getItem(ANIMATED_SCOPE_KEY) === 'true') return null;
  localStorage.setItem(ANIMATED_SCOPE_KEY, 'true');
  const usedTplIds = new Set(graphics.map((g) => g.templateId));
  const ownerBrandIds = new Set(templates.filter((t) => BRANDED_KINDS.has(t.kind)).map((t) => t.brandId));
  const next = templates.filter((t) => {
    if (t.kind !== 'animated-caption') return true;
    if (usedTplIds.has(t.id)) return true;        // a graphic uses it — keep
    if (ownerBrandIds.has(t.brandId)) return true; // the client brand — keep
    return false;                                  // stray auto-seeded — drop
  });
  if (next.length === templates.length) return null;
  saveCollection('templates', next);
  return next;
}

function initialState(): StoreState {
  if (!seededFlag()) {
    const seed = buildSeed();
    const templates = seed.templates.map((t) => {
      if (t.master) return t;
      const k = getKind(t.kind);
      // language-aware kinds keep an empty master (copy follows the app language)
      const copy = k?.defaultCopyByLang ? {} : { ...(k?.defaultCopy ?? {}) };
      return { ...t, master: { copy } };
    });
    saveCollection('brands', seed.brands);
    saveCollection('templates', templates);
    markSeeded();
    if (typeof localStorage !== 'undefined') localStorage.setItem(MASTER_MIGRATION_KEY, 'true');
    return { brands: seed.brands, templates, assets: [], socialAccounts: [], templateStyles: [], graphics: [], clips: [], folders: [], referenceAccounts: [], postAnalyses: [], aiRecommendations: [], performance: [], coachPresets: [], coachSettings: [], coachBriefs: [], strategyArtifacts: [], voiceProfiles: [] };
  }
  let templates = loadCollection<Template>('templates');
  let graphics = loadCollection<GeneratedGraphic>('graphics');
  const migrated = migrateMaster(templates, graphics);
  if (migrated) { templates = migrated.templates; graphics = migrated.graphics; }
  const brands = loadCollection<Brand>('brands');
  const scoped = scopeAnimatedTemplates(templates, graphics);
  if (scoped) templates = scoped;
  const withQuiz = ensureQuizForCwis(templates);
  if (withQuiz) templates = withQuiz;
  const withTopGroups = ensureTopGroupsForCwis(templates);
  if (withTopGroups) templates = withTopGroups;
  const withPoll = ensureBrandedKindForCwis(templates, 'cwis-poll', 'cg.v1.pollKindSeeded');
  if (withPoll) templates = withPoll;
  const delang = delangBakedMaster(templates);
  if (delang) templates = delang;
  return {
    brands,
    assets: [], // hydrated from IndexedDB on mount (see StoreProvider)
    socialAccounts: loadCollection('socialAccounts'),
    templateStyles: loadCollection('templateStyles'),
    templates,
    graphics,
    clips: loadCollection('clips'),
    folders: loadCollection('folders'),
    referenceAccounts: loadCollection('referenceAccounts'),
    postAnalyses: loadCollection('postAnalyses'),
    aiRecommendations: loadCollection('aiRecommendations'),
    performance: loadCollection('performance'),
    coachPresets: loadCollection('coachPresets'),
    coachSettings: loadCollection('coachSettings'),
    coachBriefs: loadCollection('coachBriefs'),
    strategyArtifacts: loadCollection('strategyArtifacts'),
    voiceProfiles: loadCollection('voiceProfiles'),
  };
}

/** Make `base` unique against an existing set of names (appends " (2)", " (3)"...). */
function uniqueName(base: string, existing: string[]): string {
  if (!existing.includes(base)) return base;
  let n = 2;
  while (existing.includes(`${base} (${n})`)) n++;
  return `${base} (${n})`;
}

export interface StoreApi extends StoreState {
  // brands
  createBrand: (name: string) => Brand;
  updateBrand: (id: string, patch: Partial<Brand>) => void;
  deleteBrand: (id: string) => void;
  getBrand: (id: string) => Brand | undefined;
  // assets
  addAsset: (brandId: string, a: { type: AssetType; name: string; url: string }) => BrandAsset;
  renameAsset: (id: string, name: string) => void;
  removeAsset: (id: string) => void;
  assetsByBrand: (brandId: string) => BrandAsset[];
  // social
  addSocialAccount: (brandId: string, s: { platform: SocialAccount['platform']; url: string }) => void;
  removeSocialAccount: (id: string) => void;
  updateSocialAudit: (id: string, patch: Partial<SocialAccount>) => void;
  socialByBrand: (brandId: string) => SocialAccount[];
  // template styles
  addTemplateStyle: (brandId: string, s: Omit<TemplateStyle, 'id' | 'brandId' | 'createdAt'>) => void;
  stylesByBrand: (brandId: string) => TemplateStyle[];
  // templates
  createTemplate: (brandId: string, kindId: string, name?: string, opts?: { styleId?: string; seedElements?: GraphicElement[] }) => Template | undefined;
  renameTemplate: (id: string, name: string) => void;
  updateTemplateMaster: (id: string, copyPatch: Record<string, string>) => void; // edit shared master copy
  deleteTemplate: (id: string) => void;
  templatesByBrand: (brandId: string) => Template[];
  getTemplate: (id: string) => Template | undefined;
  // graphics
  createGraphic: (brandId: string, templateId: string, opts?: { name?: string; platform?: PlatformId; folderId?: string }) => GeneratedGraphic | undefined;
  updateGraphic: (id: string, patch: Partial<GeneratedGraphic>) => void;
  deleteGraphic: (id: string) => void;
  restoreGraphic: (g: GeneratedGraphic) => void; // re-insert after a delete (undo)
  duplicateGraphic: (id: string) => GeneratedGraphic | undefined;
  moveGraphicToFolder: (id: string, folderId: string | null) => void;
  graphicsByBrand: (brandId: string) => GeneratedGraphic[];
  getGraphic: (id: string) => GeneratedGraphic | undefined;
  // clips (saved short-form clip suggestions — brand-scoped like graphics)
  createClip: (brandId: string, clip: Omit<Clip, 'id' | 'brandId' | 'createdAt' | 'updatedAt'>, opts?: { folderId?: string }) => Clip;
  updateClip: (id: string, patch: Partial<Clip>) => void;
  deleteClip: (id: string) => void;
  restoreClip: (c: Clip) => void;
  moveClipToFolder: (id: string, folderId: string | null) => void;
  clipsByBrand: (brandId: string) => Clip[];
  getClip: (id: string) => Clip | undefined;
  // folders
  createFolder: (brandId: string, name: string) => Folder;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void; // graphics inside become Unfiled
  foldersByBrand: (brandId: string) => Folder[];
  // ── Postio Coach ──
  // reference (aspirational) accounts
  addReferenceAccount: (brandId: string, a: Omit<AspirationalAccount, 'id' | 'brandId' | 'createdAt' | 'updatedAt' | 'enabled'> & { enabled?: boolean }) => AspirationalAccount;
  updateReferenceAccount: (id: string, patch: Partial<AspirationalAccount>) => void;
  setReferenceProfile: (id: string, profile: AccountBenchmarkProfile) => void;
  removeReferenceAccount: (id: string) => void;
  referenceAccountsByBrand: (brandId: string) => AspirationalAccount[];
  // post analyses
  saveAnalysis: (a: Omit<PostAnalysis, 'id' | 'createdAt'>) => PostAnalysis;
  deleteAnalysis: (id: string) => void;
  analysesByBrand: (brandId: string) => PostAnalysis[];
  analysesByPost: (postId: string) => PostAnalysis[];
  latestAnalysis: (postId: string) => PostAnalysis | undefined;
  // recommendations
  saveRecommendations: (recs: Omit<AIRecommendation, 'id' | 'createdAt' | 'applied'>[]) => AIRecommendation[];
  setRecommendationApplied: (id: string, applied: boolean) => void;
  deleteRecommendation: (id: string) => void;
  recommendationsByBrand: (brandId: string) => AIRecommendation[];
  recommendationsByPost: (postId: string) => AIRecommendation[];
  // performance
  addPerformance: (brandId: string, entry: { postId?: string; label?: string; metrics: PostPerformanceMetrics; source?: PerformanceEntry['source'] }) => PerformanceEntry;
  removePerformance: (id: string) => void;
  performanceByBrand: (brandId: string) => PerformanceEntry[];
  // benchmark presets
  addPreset: (preset: Omit<BenchmarkPreset, 'id' | 'createdAt'>) => BenchmarkPreset;
  deletePreset: (id: string) => void;
  presetsByBrand: (brandId: string) => BenchmarkPreset[];
  // per-brand coach settings (live benchmark toggles + active preset)
  getCoachSettings: (brandId: string) => CoachSettings | undefined;
  setCoachSettings: (brandId: string, patch: Partial<Omit<CoachSettings, 'id' | 'brandId' | 'updatedAt'>>) => CoachSettings;
  // strategy: business brief + saved play artifacts
  getBrief: (brandId: string) => CoachBrief | undefined;
  setBrief: (brandId: string, patch: Partial<Omit<CoachBrief, 'id' | 'brandId' | 'updatedAt'>>) => CoachBrief;
  saveStrategy: (a: Omit<StrategyArtifact, 'id' | 'createdAt'>) => StrategyArtifact;
  deleteStrategy: (id: string) => void;
  strategiesByBrand: (brandId: string) => StrategyArtifact[];
  latestStrategy: (brandId: string, play: StrategyPlayId) => StrategyArtifact | undefined;
  // brand voice profile (derived from past posts)
  getVoiceProfile: (brandId: string) => VoiceProfile | undefined;
  setVoiceProfile: (brandId: string, profile: Omit<VoiceProfile, 'id' | 'brandId' | 'updatedAt'>) => VoiceProfile;
  // backup
  exportAll: () => string;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(initialState);
  // Mirror of `state` kept in lockstep with every write so action methods read
  // pending writes synchronously: a createGraphic issued right after a
  // createTemplate (in the same tick) sees the new template instead of the
  // stale React snapshot. The reactive spread `...state` below still drives
  // rendering; method bodies read live data via stateRef.current.
  const stateRef = useRef<StoreState>(state);
  // setState that also advances the ref, so a later read in the same tick is
  // consistent regardless of whether the write came from `update` or a hydration.
  const commit = useCallback((next: StoreState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  // When Supabase is configured it is the source of truth (shareable,
  // cross-device): load all collections on mount. Otherwise stay
  // local-first and hydrate assets from IndexedDB.
  useEffect(() => {
    let alive = true;
    if (supabaseConfigured()) {
      loadAllFromSupabase().then((data) => {
        if (alive && data) commit({ ...stateRef.current, ...data } as StoreState);
      });
    } else {
      loadAssetsIDB().then((assets) => {
        if (alive && assets.length && !stateRef.current.assets.length) commit({ ...stateRef.current, assets });
      });
    }
    return () => { alive = false; };
  }, [commit]);

  const update = useCallback(
    <K extends CollectionName>(name: K, updater: (items: StoreState[K]) => StoreState[K]) => {
      // Read the latest committed state from the ref (not the closed-over
      // snapshot) so back-to-back writes in one tick chain correctly.
      const prev = stateRef.current;
      const nextItems = updater(prev[name]);
      // local cache (offline-friendly) ...
      if (name === 'assets') saveAssetsIDB(nextItems as BrandAsset[]);
      else saveCollection(name, nextItems);
      // ... + mirror to Supabase when configured
      if (supabaseConfigured()) syncCollectionToSupabase(name, nextItems as { id: string }[]);
      commit({ ...prev, [name]: nextItems } as StoreState);
    },
    [commit],
  );

  const api = useMemo<StoreApi>(() => {
    return {
      ...state,

      // ── brands ──
      createBrand: (name) => {
        const t = now();
        const brand: Brand = { id: newId('brand'), name: name.trim() || 'Untitled brand', logos: [], colours: ['#111827', '#6366f1', '#ffffff'], fonts: ['Inter'], socialAccounts: [], createdAt: t, updatedAt: t };
        update('brands', (b) => [...b, brand]);
        return brand;
      },
      updateBrand: (id, patch) =>
        update('brands', (b) => b.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: now() } : x))),
      deleteBrand: (id) => {
        update('brands', (b) => b.filter((x) => x.id !== id));
        update('assets', (a) => a.filter((x) => x.brandId !== id));
        update('socialAccounts', (s) => s.filter((x) => x.brandId !== id));
        update('templateStyles', (s) => s.filter((x) => x.brandId !== id));
        update('templates', (tp) => tp.filter((x) => x.brandId !== id));
        update('graphics', (g) => g.filter((x) => x.brandId !== id));
        update('clips', (c) => c.filter((x) => x.brandId !== id));
        update('folders', (f) => f.filter((x) => x.brandId !== id));
        update('referenceAccounts', (r) => r.filter((x) => x.brandId !== id));
        update('postAnalyses', (a) => a.filter((x) => x.brandId !== id));
        update('aiRecommendations', (r) => r.filter((x) => x.brandId !== id));
        update('performance', (p) => p.filter((x) => x.brandId !== id));
        update('coachPresets', (p) => p.filter((x) => x.brandId !== id));
        update('coachSettings', (s) => s.filter((x) => x.brandId !== id));
        update('coachBriefs', (b) => b.filter((x) => x.brandId !== id));
        update('strategyArtifacts', (a) => a.filter((x) => x.brandId !== id));
        update('voiceProfiles', (v) => v.filter((x) => x.brandId !== id));
      },
      getBrand: (id) => stateRef.current.brands.find((b) => b.id === id),

      // ── assets ──
      addAsset: (brandId, a) => {
        const asset: BrandAsset = { id: newId('asset'), brandId, type: a.type, name: a.name, url: a.url, createdAt: now() };
        update('assets', (x) => [...x, asset]);
        if (a.type === 'logo') update('brands', (b) => b.map((br) => (br.id === brandId ? { ...br, logos: [...br.logos, asset.id], updatedAt: now() } : br)));
        return asset;
      },
      renameAsset: (id, name) =>
        update('assets', (x) => x.map((a) => (a.id === id ? { ...a, name: name.trim() || a.name } : a))),
      removeAsset: (id) => {
        update('assets', (x) => x.filter((a) => a.id !== id));
        update('brands', (b) => b.map((br) => ({ ...br, logos: br.logos.filter((l) => l !== id) })));
      },
      assetsByBrand: (brandId) => stateRef.current.assets.filter((a) => a.brandId === brandId),

      // ── social ──
      addSocialAccount: (brandId, s) => {
        const acc: SocialAccount = { id: newId('soc'), brandId, platform: s.platform, url: s.url, auditStatus: 'not-started' };
        update('socialAccounts', (x) => [...x, acc]);
        update('brands', (b) => b.map((br) => (br.id === brandId ? { ...br, socialAccounts: [...br.socialAccounts, acc.id] } : br)));
      },
      removeSocialAccount: (id) => {
        update('socialAccounts', (x) => x.filter((a) => a.id !== id));
        update('brands', (b) => b.map((br) => ({ ...br, socialAccounts: br.socialAccounts.filter((s) => s !== id) })));
      },
      updateSocialAudit: (id, patch) => {
        update('socialAccounts', (x) => x.map((a) => (a.id === id ? { ...a, ...patch } : a)));
      },
      socialByBrand: (brandId) => stateRef.current.socialAccounts.filter((s) => s.brandId === brandId),

      // ── template styles ──
      addTemplateStyle: (brandId, s) => {
        const style: TemplateStyle = { id: newId('style'), brandId, createdAt: now(), ...s };
        update('templateStyles', (x) => [...x, style]);
      },
      stylesByBrand: (brandId) => stateRef.current.templateStyles.filter((s) => s.brandId === brandId),

      // ── templates ──
      createTemplate: (brandId, kindId, name, opts) => {
        const kind = getKind(kindId);
        if (!kind) return undefined;
        // Language-aware kinds keep an EMPTY master so the placeholder copy
        // follows the app language live (effective = kindBaseCopy(lang) ←
        // master ← overrides); others bake their single default set.
        const baseCopy = kind.defaultCopyByLang ? {} : (kind.defaultCopy ?? {});
        const tpl: Template = { id: newId('tpl'), brandId, name: name || kind.name, type: kind.type, kind: kind.id, supportedPlatforms: kind.supportedPlatforms, dimensions: kind.dimensions, styleId: opts?.styleId, seedElements: opts?.seedElements, master: { copy: { ...baseCopy } }, createdAt: now() };
        update('templates', (x) => [...x, tpl]);
        return tpl;
      },
      renameTemplate: (id, name) =>
        update('templates', (x) => x.map((t) => (t.id === id ? { ...t, name: name.trim() || t.name } : t))),
      updateTemplateMaster: (id, copyPatch) =>
        update('templates', (x) => x.map((t) => (t.id === id ? { ...t, master: { ...t.master, copy: { ...t.master?.copy, ...copyPatch } } } : t))),
      deleteTemplate: (id) => update('templates', (x) => x.filter((t) => t.id !== id)),
      templatesByBrand: (brandId) => stateRef.current.templates.filter((t) => t.brandId === brandId),
      getTemplate: (id) => stateRef.current.templates.find((t) => t.id === id),

      // ── graphics ──
      createGraphic: (brandId, templateId, opts) => {
        const tpl = stateRef.current.templates.find((t) => t.id === templateId);
        const kind = tpl && getKind(tpl.kind);
        if (!tpl || !kind) return undefined;
        const brand = stateRef.current.brands.find((b) => b.id === brandId);
        const t = now();
        const defaultName = `${kind.name} - ${new Date().toLocaleDateString('en-GB')}`;
        const existingNames = stateRef.current.graphics.filter((g) => g.brandId === brandId).map((g) => g.name);
        const base = {
          id: newId('gfx'),
          brandId,
          templateId,
          platformPresetId: opts?.platform ?? kind.supportedPlatforms[0] ?? 'instagram-carousel',
          folderId: opts?.folderId,
          name: opts?.name || uniqueName(defaultName, existingNames),
          createdAt: t,
          updatedAt: t,
        };
        // Generated templates bake their starter layout into seedElements;
        // clone with fresh ids so each graphic owns its elements.
        const logoUrl = (stateRef.current.assets.find((a) => a.id === brand?.logos?.[0]) ?? stateRef.current.assets.find((a) => a.type === 'logo' && a.brandId === brandId))?.url;
        const seed = tpl.seedElements?.length
          ? tpl.seedElements.map((el) => ({ ...el, id: newId('el') }))
          : kind.defaultElements?.(brand?.colours, loadLang(), brand?.fonts, logoUrl) ?? [];
        const g: GeneratedGraphic =
          kind.editor === 'freeform'
            ? { ...base, slides: [{ id: newId('slide'), order: 0, elements: seed }] }
            // carousel/still graphics inherit the master's copy; they store only overrides
            : { ...base, inputs: { rawText: kind.sampleData ?? '', copyOverrides: {} } };
        update('graphics', (x) => [g, ...x]);
        return g;
      },
      updateGraphic: (id, patch) =>
        update('graphics', (x) => x.map((g) => (g.id === id ? { ...g, ...patch, updatedAt: now() } : g))),
      deleteGraphic: (id) => update('graphics', (x) => x.filter((g) => g.id !== id)),
      restoreGraphic: (g) => update('graphics', (x) => (x.some((y) => y.id === g.id) ? x : [g, ...x])),
      duplicateGraphic: (id) => {
        const src = stateRef.current.graphics.find((g) => g.id === id);
        if (!src) return undefined;
        const t = now();
        const existingNames = stateRef.current.graphics.filter((g) => g.brandId === src.brandId).map((g) => g.name);
        const copy: GeneratedGraphic = { ...src, id: newId('gfx'), name: uniqueName(`${src.name} (copy)`, existingNames), createdAt: t, updatedAt: t };
        update('graphics', (x) => [copy, ...x]);
        return copy;
      },
      moveGraphicToFolder: (id, folderId) =>
        update('graphics', (x) => x.map((g) => (g.id === id ? { ...g, folderId: folderId ?? undefined, updatedAt: now() } : g))),
      graphicsByBrand: (brandId) => stateRef.current.graphics.filter((g) => g.brandId === brandId),
      getGraphic: (id) => stateRef.current.graphics.find((g) => g.id === id),

      // ── clips (mirror graphics: brand-scoped, folder-organised) ──
      createClip: (brandId, clip, opts) => {
        const t = now();
        const existingNames = stateRef.current.clips.filter((c) => c.brandId === brandId).map((c) => c.name);
        const c: Clip = {
          ...clip,
          id: newId('clip'),
          brandId,
          folderId: opts?.folderId,
          name: uniqueName(clip.name?.trim() || 'Clip', existingNames),
          createdAt: t,
          updatedAt: t,
        };
        update('clips', (x) => [c, ...x]);
        return c;
      },
      updateClip: (id, patch) =>
        update('clips', (x) => x.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: now() } : c))),
      deleteClip: (id) => update('clips', (x) => x.filter((c) => c.id !== id)),
      restoreClip: (c) => update('clips', (x) => (x.some((y) => y.id === c.id) ? x : [c, ...x])),
      moveClipToFolder: (id, folderId) =>
        update('clips', (x) => x.map((c) => (c.id === id ? { ...c, folderId: folderId ?? undefined, updatedAt: now() } : c))),
      clipsByBrand: (brandId) => stateRef.current.clips.filter((c) => c.brandId === brandId),
      getClip: (id) => stateRef.current.clips.find((c) => c.id === id),

      // ── folders ──
      createFolder: (brandId, name) => {
        const existing = stateRef.current.folders.filter((f) => f.brandId === brandId).map((f) => f.name);
        const folder: Folder = { id: newId('folder'), brandId, name: uniqueName(name.trim() || 'New folder', existing), createdAt: now() };
        update('folders', (f) => [...f, folder]);
        return folder;
      },
      renameFolder: (id, name) =>
        update('folders', (f) => f.map((x) => (x.id === id ? { ...x, name: name.trim() || x.name } : x))),
      deleteFolder: (id) => {
        update('folders', (f) => f.filter((x) => x.id !== id));
        update('graphics', (g) => g.map((x) => (x.folderId === id ? { ...x, folderId: undefined } : x)));
        update('clips', (c) => c.map((x) => (x.folderId === id ? { ...x, folderId: undefined } : x)));
      },
      foldersByBrand: (brandId) => stateRef.current.folders.filter((f) => f.brandId === brandId),

      // ── Postio Coach: reference (aspirational) accounts ──
      addReferenceAccount: (brandId, a) => {
        const t = now();
        const acc: AspirationalAccount = {
          id: newId('ref'), brandId, platform: a.platform, handle: a.handle.trim().replace(/^@/, ''),
          displayName: a.displayName, url: a.url, notes: a.notes, profile: a.profile,
          enabled: a.enabled ?? true, createdAt: t, updatedAt: t,
        };
        update('referenceAccounts', (x) => [acc, ...x]);
        return acc;
      },
      updateReferenceAccount: (id, patch) =>
        update('referenceAccounts', (x) => x.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: now() } : r))),
      setReferenceProfile: (id, profile) =>
        update('referenceAccounts', (x) => x.map((r) => (r.id === id ? { ...r, profile, updatedAt: now() } : r))),
      removeReferenceAccount: (id) => update('referenceAccounts', (x) => x.filter((r) => r.id !== id)),
      referenceAccountsByBrand: (brandId) => stateRef.current.referenceAccounts.filter((r) => r.brandId === brandId),

      // ── Postio Coach: post analyses ──
      saveAnalysis: (a) => {
        const analysis: PostAnalysis = { ...a, id: newId('an'), createdAt: now() };
        update('postAnalyses', (x) => [analysis, ...x]);
        return analysis;
      },
      deleteAnalysis: (id) => update('postAnalyses', (x) => x.filter((a) => a.id !== id)),
      analysesByBrand: (brandId) => stateRef.current.postAnalyses.filter((a) => a.brandId === brandId),
      analysesByPost: (postId) => stateRef.current.postAnalyses.filter((a) => a.postId === postId),
      latestAnalysis: (postId) =>
        stateRef.current.postAnalyses
          .filter((a) => a.postId === postId)
          .sort((x, y) => y.createdAt.localeCompare(x.createdAt))[0],

      // ── Postio Coach: recommendations ──
      saveRecommendations: (recs) => {
        const t = now();
        const built: AIRecommendation[] = recs.map((r) => ({ ...r, id: newId('rec'), applied: false, createdAt: t }));
        update('aiRecommendations', (x) => [...built, ...x]);
        return built;
      },
      setRecommendationApplied: (id, applied) =>
        update('aiRecommendations', (x) => x.map((r) => (r.id === id ? { ...r, applied } : r))),
      deleteRecommendation: (id) => update('aiRecommendations', (x) => x.filter((r) => r.id !== id)),
      recommendationsByBrand: (brandId) => stateRef.current.aiRecommendations.filter((r) => r.brandId === brandId),
      recommendationsByPost: (postId) => stateRef.current.aiRecommendations.filter((r) => r.postId === postId),

      // ── Postio Coach: performance ──
      addPerformance: (brandId, entry) => {
        const e: PerformanceEntry = {
          id: newId('perf'), brandId, postId: entry.postId, label: entry.label,
          metrics: entry.metrics, source: entry.source ?? 'manual', createdAt: now(),
        };
        update('performance', (x) => [e, ...x]);
        return e;
      },
      removePerformance: (id) => update('performance', (x) => x.filter((p) => p.id !== id)),
      performanceByBrand: (brandId) => stateRef.current.performance.filter((p) => p.brandId === brandId),

      // ── Postio Coach: benchmark presets ──
      addPreset: (preset) => {
        const p: BenchmarkPreset = { ...preset, id: newId('preset'), createdAt: now() };
        update('coachPresets', (x) => [...x, p]);
        return p;
      },
      deletePreset: (id) => update('coachPresets', (x) => x.filter((p) => p.id !== id)),
      presetsByBrand: (brandId) => stateRef.current.coachPresets.filter((p) => !p.brandId || p.brandId === brandId),

      // ── Postio Coach: per-brand settings ──
      getCoachSettings: (brandId) => stateRef.current.coachSettings.find((s) => s.brandId === brandId),
      setCoachSettings: (brandId, patch) => {
        const existing = stateRef.current.coachSettings.find((s) => s.brandId === brandId);
        const next: CoachSettings = existing
          ? { ...existing, ...patch, updatedAt: now() }
          : { id: brandId, brandId, enabledBenchmarkIds: patch.enabledBenchmarkIds ?? [], activePresetId: patch.activePresetId, updatedAt: now() };
        update('coachSettings', (x) => (existing ? x.map((s) => (s.brandId === brandId ? next : s)) : [...x, next]));
        return next;
      },

      // ── Postio Coach: strategy ──
      getBrief: (brandId) => stateRef.current.coachBriefs.find((b) => b.brandId === brandId),
      setBrief: (brandId, patch) => {
        const existing = stateRef.current.coachBriefs.find((b) => b.brandId === brandId);
        const next: CoachBrief = existing
          ? { ...existing, ...patch, updatedAt: now() }
          : { id: brandId, brandId, niche: '', audience: '', goals: '', businessModel: '', ...patch, updatedAt: now() };
        update('coachBriefs', (x) => (existing ? x.map((b) => (b.brandId === brandId ? next : b)) : [...x, next]));
        return next;
      },
      saveStrategy: (a) => {
        const art: StrategyArtifact = { ...a, id: newId('strat'), createdAt: now() };
        update('strategyArtifacts', (x) => [art, ...x]);
        return art;
      },
      deleteStrategy: (id) => update('strategyArtifacts', (x) => x.filter((a) => a.id !== id)),
      strategiesByBrand: (brandId) => stateRef.current.strategyArtifacts.filter((a) => a.brandId === brandId),
      latestStrategy: (brandId, play) =>
        stateRef.current.strategyArtifacts
          .filter((a) => a.brandId === brandId && a.play === play)
          .sort((x, y) => y.createdAt.localeCompare(x.createdAt))[0],

      // ── Postio Coach: brand voice ──
      getVoiceProfile: (brandId) => stateRef.current.voiceProfiles.find((v) => v.brandId === brandId),
      setVoiceProfile: (brandId, profile) => {
        const existing = stateRef.current.voiceProfiles.find((v) => v.brandId === brandId);
        const next: VoiceProfile = { ...profile, id: brandId, brandId, updatedAt: now() };
        update('voiceProfiles', (x) => (existing ? x.map((v) => (v.brandId === brandId ? next : v)) : [...x, next]));
        return next;
      },

      // ── backup ──
      exportAll: () => exportSnapshot({ assets: stateRef.current.assets }),
    };
  }, [state, update]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
