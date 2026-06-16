// Sync the engine's collections to Supabase. Each collection is one
// table of (id text pk, data jsonb). The in-memory store stays the
// source of truth for the UI; this mirrors writes server-side so a
// graphic's /graphics/:id URL resolves on any device. Local persistence
// still runs as an offline cache.

import type { CollectionName } from './persist';
import { getClient } from './supabaseClient';

const TABLE: Record<CollectionName, string> = {
  brands: 'cg_brands',
  assets: 'cg_assets',
  socialAccounts: 'cg_social_accounts',
  templateStyles: 'cg_template_styles',
  templates: 'cg_templates',
  graphics: 'cg_graphics',
};

interface HasId { id: string }

export async function loadAllFromSupabase(): Promise<Partial<Record<CollectionName, unknown[]>> | null> {
  const sb = getClient();
  if (!sb) return null;
  const out: Partial<Record<CollectionName, unknown[]>> = {};
  await Promise.all(
    (Object.keys(TABLE) as CollectionName[]).map(async (name) => {
      const { data, error } = await sb.from(TABLE[name]).select('data');
      if (!error && data) out[name] = data.map((r) => (r as { data: unknown }).data);
    }),
  );
  return out;
}

export async function syncCollectionToSupabase(name: CollectionName, items: HasId[]): Promise<void> {
  const sb = getClient();
  if (!sb) return;
  const table = TABLE[name];
  try {
    if (items.length) {
      await sb.from(table).upsert(items.map((it) => ({ id: it.id, data: it })));
      // remove rows that no longer exist locally
      await sb.from(table).delete().not('id', 'in', `(${items.map((i) => i.id).join(',')})`);
    } else {
      await sb.from(table).delete().neq('id', '');
    }
  } catch {
    /* offline / transient - local cache still holds the data */
  }
}
