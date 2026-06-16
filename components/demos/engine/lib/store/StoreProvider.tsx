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
  type CollectionName,
} from './persist';
import { buildSeed } from './seed';
import { loadAssetsIDB, saveAssetsIDB } from './assetStore';

interface StoreState {
  brands: Brand[];
  assets: BrandAsset[];
  socialAccounts: SocialAccount[];
  templateStyles: TemplateStyle[];
  templates: Template[];
  graphics: GeneratedGraphic[];
}

function initialState(): StoreState {
  if (!seededFlag()) {
    const seed = buildSeed();
    saveCollection('brands', seed.brands);
    saveCollection('templates', seed.templates);
    markSeeded();
    return { brands: seed.brands, templates: seed.templates, assets: [], socialAccounts: [], templateStyles: [], graphics: [] };
  }
  return {
    brands: loadCollection('brands'),
    assets: [], // hydrated from IndexedDB on mount (see StoreProvider)
    socialAccounts: loadCollection('socialAccounts'),
    templateStyles: loadCollection('templateStyles'),
    templates: loadCollection('templates'),
    graphics: loadCollection('graphics'),
  };
}

export interface StoreApi extends StoreState {
  // brands
  createBrand: (name: string) => Brand;
  updateBrand: (id: string, patch: Partial<Brand>) => void;
  deleteBrand: (id: string) => void;
  getBrand: (id: string) => Brand | undefined;
  // assets
  addAsset: (brandId: string, a: { type: AssetType; name: string; url: string }) => BrandAsset;
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
  deleteTemplate: (id: string) => void;
  templatesByBrand: (brandId: string) => Template[];
  getTemplate: (id: string) => Template | undefined;
  // graphics
  createGraphic: (brandId: string, templateId: string, opts?: { name?: string; platform?: PlatformId }) => GeneratedGraphic | undefined;
  updateGraphic: (id: string, patch: Partial<GeneratedGraphic>) => void;
  deleteGraphic: (id: string) => void;
  duplicateGraphic: (id: string) => GeneratedGraphic | undefined;
  graphicsByBrand: (brandId: string) => GeneratedGraphic[];
  getGraphic: (id: string) => GeneratedGraphic | undefined;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(initialState);

  // Assets (image data URLs) live in IndexedDB, not localStorage (which
  // caps ~5MB and silently drops uploads). Hydrate them once on mount.
  useEffect(() => {
    let alive = true;
    loadAssetsIDB().then((assets) => {
      if (alive && assets.length) setState((s) => (s.assets.length ? s : { ...s, assets }));
    });
    return () => { alive = false; };
  }, []);

  const update = useCallback(
    <K extends CollectionName>(name: K, updater: (items: StoreState[K]) => StoreState[K]) => {
      setState((prev) => {
        const nextItems = updater(prev[name]);
        if (name === 'assets') saveAssetsIDB(nextItems as BrandAsset[]);
        else saveCollection(name, nextItems);
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
      },
      getBrand: (id) => state.brands.find((b) => b.id === id),

      // ── assets ──
      addAsset: (brandId, a) => {
        const asset: BrandAsset = { id: newId('asset'), brandId, type: a.type, name: a.name, url: a.url, createdAt: now() };
        update('assets', (x) => [...x, asset]);
        if (a.type === 'logo') update('brands', (b) => b.map((br) => (br.id === brandId ? { ...br, logos: [...br.logos, asset.id], updatedAt: now() } : br)));
        return asset;
      },
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
        const tpl: Template = { id: newId('tpl'), brandId, name: name || kind.name, type: kind.type, kind: kind.id, supportedPlatforms: kind.supportedPlatforms, dimensions: kind.dimensions, styleId: opts?.styleId, seedElements: opts?.seedElements, createdAt: now() };
        update('templates', (x) => [...x, tpl]);
        return tpl;
      },
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
        const base = {
          id: newId('gfx'),
          brandId,
          templateId,
          platformPresetId: opts?.platform ?? kind.supportedPlatforms[0] ?? 'instagram-carousel',
          name: opts?.name || `${kind.name} - ${new Date().toLocaleDateString('en-GB')}`,
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
            : { ...base, inputs: { rawText: kind.sampleData ?? '', copy: { ...(kind.defaultCopy ?? {}) } } };
        update('graphics', (x) => [g, ...x]);
        return g;
      },
      updateGraphic: (id, patch) =>
        update('graphics', (x) => x.map((g) => (g.id === id ? { ...g, ...patch, updatedAt: now() } : g))),
      deleteGraphic: (id) => update('graphics', (x) => x.filter((g) => g.id !== id)),
      duplicateGraphic: (id) => {
        const src = state.graphics.find((g) => g.id === id);
        if (!src) return undefined;
        const t = now();
        const copy: GeneratedGraphic = { ...src, id: newId('gfx'), name: `${src.name} (copy)`, createdAt: t, updatedAt: t };
        update('graphics', (x) => [copy, ...x]);
        return copy;
      },
      graphicsByBrand: (brandId) => state.graphics.filter((g) => g.brandId === brandId),
      getGraphic: (id) => state.graphics.find((g) => g.id === id),
    };
  }, [state, update]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
