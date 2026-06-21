// ═══ Store: in-memory reactive state backed by local persistence ═══
// Components read from React state (fast, reactive) and mutate through
// typed actions; every action persists via lib/store/persist. To move
// to Supabase later, reimplement the action bodies against an async
// repository - the component API (useStore) stays identical.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  Brand,
  BrandAsset,
  SocialAccount,
  TemplateStyle,
  Template,
  GeneratedGraphic,
  GraphicElement,
  Folder,
  AssetType,
  PlatformId,
} from '@engine/lib/model/types';
import { getKind } from '@engine/lib/templates/registry';
import {
  loadCollection,
  saveCollection,
  seededFlag,
  markSeeded,
  newId,
  now,
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
  folders: Folder[];
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
const BRANDED_KINDS = new Set(['quizbookbiz-leaderboard', 'cwis-weekly-scoreboard']);

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
    const templates = seed.templates.map((t) => (t.master ? t : { ...t, master: { copy: { ...(getKind(t.kind)?.defaultCopy ?? {}) } } }));
    saveCollection('brands', seed.brands);
    saveCollection('templates', templates);
    markSeeded();
    if (typeof localStorage !== 'undefined') localStorage.setItem(MASTER_MIGRATION_KEY, 'true');
    return { brands: seed.brands, templates, assets: [], socialAccounts: [], templateStyles: [], graphics: [], folders: [] };
  }
  let templates = loadCollection<Template>('templates');
  let graphics = loadCollection<GeneratedGraphic>('graphics');
  const migrated = migrateMaster(templates, graphics);
  if (migrated) { templates = migrated.templates; graphics = migrated.graphics; }
  const brands = loadCollection<Brand>('brands');
  const scoped = scopeAnimatedTemplates(templates, graphics);
  if (scoped) templates = scoped;
  return {
    brands,
    assets: [], // hydrated from IndexedDB on mount (see StoreProvider)
    socialAccounts: loadCollection('socialAccounts'),
    templateStyles: loadCollection('templateStyles'),
    templates,
    graphics,
    folders: loadCollection('folders'),
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
  // folders
  createFolder: (brandId: string, name: string) => Folder;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void; // graphics inside become Unfiled
  foldersByBrand: (brandId: string) => Folder[];
  // backup
  exportAll: () => string;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(initialState);

  // When Supabase is configured it is the source of truth (shareable,
  // cross-device): load all collections on mount. Otherwise stay
  // local-first and hydrate assets from IndexedDB.
  useEffect(() => {
    let alive = true;
    if (supabaseConfigured()) {
      loadAllFromSupabase().then((data) => {
        if (alive && data) setState((s) => ({ ...s, ...data } as StoreState));
      });
    } else {
      loadAssetsIDB().then((assets) => {
        if (alive && assets.length) setState((s) => (s.assets.length ? s : { ...s, assets }));
      });
    }
    return () => { alive = false; };
  }, []);

  const update = useCallback(
    <K extends CollectionName>(name: K, updater: (items: StoreState[K]) => StoreState[K]) => {
      setState((prev) => {
        const nextItems = updater(prev[name]);
        // local cache (offline-friendly) ...
        if (name === 'assets') saveAssetsIDB(nextItems as BrandAsset[]);
        else saveCollection(name, nextItems);
        // ... + mirror to Supabase when configured
        if (supabaseConfigured()) syncCollectionToSupabase(name, nextItems as { id: string }[]);
        return { ...prev, [name]: nextItems } as StoreState;
      });
    },
    [],
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
        update('folders', (f) => f.filter((x) => x.brandId !== id));
      },
      getBrand: (id) => state.brands.find((b) => b.id === id),

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
      assetsByBrand: (brandId) => state.assets.filter((a) => a.brandId === brandId),

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
      socialByBrand: (brandId) => state.socialAccounts.filter((s) => s.brandId === brandId),

      // ── template styles ──
      addTemplateStyle: (brandId, s) => {
        const style: TemplateStyle = { id: newId('style'), brandId, createdAt: now(), ...s };
        update('templateStyles', (x) => [...x, style]);
      },
      stylesByBrand: (brandId) => state.templateStyles.filter((s) => s.brandId === brandId),

      // ── templates ──
      createTemplate: (brandId, kindId, name, opts) => {
        const kind = getKind(kindId);
        if (!kind) return undefined;
        const tpl: Template = { id: newId('tpl'), brandId, name: name || kind.name, type: kind.type, kind: kind.id, supportedPlatforms: kind.supportedPlatforms, dimensions: kind.dimensions, styleId: opts?.styleId, seedElements: opts?.seedElements, master: { copy: { ...(kind.defaultCopy ?? {}) } }, createdAt: now() };
        update('templates', (x) => [...x, tpl]);
        return tpl;
      },
      renameTemplate: (id, name) =>
        update('templates', (x) => x.map((t) => (t.id === id ? { ...t, name: name.trim() || t.name } : t))),
      updateTemplateMaster: (id, copyPatch) =>
        update('templates', (x) => x.map((t) => (t.id === id ? { ...t, master: { ...t.master, copy: { ...t.master?.copy, ...copyPatch } } } : t))),
      deleteTemplate: (id) => update('templates', (x) => x.filter((t) => t.id !== id)),
      templatesByBrand: (brandId) => state.templates.filter((t) => t.brandId === brandId),
      getTemplate: (id) => state.templates.find((t) => t.id === id),

      // ── graphics ──
      createGraphic: (brandId, templateId, opts) => {
        const tpl = state.templates.find((t) => t.id === templateId);
        const kind = tpl && getKind(tpl.kind);
        if (!tpl || !kind) return undefined;
        const brand = state.brands.find((b) => b.id === brandId);
        const t = now();
        const defaultName = `${kind.name} - ${new Date().toLocaleDateString('en-GB')}`;
        const existingNames = state.graphics.filter((g) => g.brandId === brandId).map((g) => g.name);
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
        const seed = tpl.seedElements?.length
          ? tpl.seedElements.map((el) => ({ ...el, id: newId('el') }))
          : kind.defaultElements?.(brand?.colours) ?? [];
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
        const src = state.graphics.find((g) => g.id === id);
        if (!src) return undefined;
        const t = now();
        const existingNames = state.graphics.filter((g) => g.brandId === src.brandId).map((g) => g.name);
        const copy: GeneratedGraphic = { ...src, id: newId('gfx'), name: uniqueName(`${src.name} (copy)`, existingNames), createdAt: t, updatedAt: t };
        update('graphics', (x) => [copy, ...x]);
        return copy;
      },
      moveGraphicToFolder: (id, folderId) =>
        update('graphics', (x) => x.map((g) => (g.id === id ? { ...g, folderId: folderId ?? undefined, updatedAt: now() } : g))),
      graphicsByBrand: (brandId) => state.graphics.filter((g) => g.brandId === brandId),
      getGraphic: (id) => state.graphics.find((g) => g.id === id),

      // ── folders ──
      createFolder: (brandId, name) => {
        const existing = state.folders.filter((f) => f.brandId === brandId).map((f) => f.name);
        const folder: Folder = { id: newId('folder'), brandId, name: uniqueName(name.trim() || 'New folder', existing), createdAt: now() };
        update('folders', (f) => [...f, folder]);
        return folder;
      },
      renameFolder: (id, name) =>
        update('folders', (f) => f.map((x) => (x.id === id ? { ...x, name: name.trim() || x.name } : x))),
      deleteFolder: (id) => {
        update('folders', (f) => f.filter((x) => x.id !== id));
        update('graphics', (g) => g.map((x) => (x.folderId === id ? { ...x, folderId: undefined } : x)));
      },
      foldersByBrand: (brandId) => state.folders.filter((f) => f.brandId === brandId),

      // ── backup ──
      exportAll: () => exportSnapshot({ assets: state.assets }),
    };
  }, [state, update]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
