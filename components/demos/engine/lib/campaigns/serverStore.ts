// Server-side Supabase access for the PUBLIC campaign experience (spec §2: the
// public surface reads published campaign config server-side and never trusts
// the client). Uses the anon key, matching the rest of the engine's POC access.
// Returns null when Supabase is not configured, so the public route 404s
// cleanly rather than erroring.
//
// NOTE: this is POC-grade. Before the public experience is live to real
// participants, the entry / consent tables need tightened RLS (insert-only for
// anon, no anon SELECT) per schema.sql, and media belongs in R2, not inline.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Brand } from '../model/types';
import type { Campaign } from './types';
import { slugify } from './slug';

function serverClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  // Cast away the schema-typed generic (mirrors lib/store/supabaseClient.ts);
  // the 'socialdesk' schema client is not assignable to the default 'public' type.
  return createClient(url, key, {
    db: { schema: 'socialdesk' },
    auth: { persistSession: false },
  }) as unknown as SupabaseClient;
}

export interface PublicCampaign {
  campaign: Campaign;
  brand: Brand | null;
  /** Accent colour resolved from the brand, for light branding of the page. */
  accent: string | null;
}

/** Resolve a campaign by (brandSlug, campaignSlug). brandSlug must match the
 *  slugified brand name. Returns null if unconfigured, not found, or mismatched. */
export async function getPublicCampaign(
  brandSlug: string,
  campaignSlug: string,
): Promise<PublicCampaign | null> {
  const sb = serverClient();
  if (!sb) return null;

  const { data, error } = await sb.from('cg_campaigns').select('data');
  if (error || !data) return null;
  const campaigns = data.map((r) => (r as { data: Campaign }).data);
  const campaign = campaigns.find((c) => c.slug === campaignSlug);
  if (!campaign) return null;

  const { data: brandsData } = await sb.from('cg_brands').select('data');
  const brands = (brandsData ?? []).map((r) => (r as { data: Brand }).data);
  const brand = brands.find((b) => b.id === campaign.brandId) ?? null;

  const expectedBrandSlug = brand ? slugify(brand.name) : campaign.brandId;
  if (brandSlug !== expectedBrandSlug) return null;

  const accent = brand && brand.colours && brand.colours.length ? brand.colours[0] : null;
  return { campaign, brand, accent };
}

/** Persist a submitted entry + its consent receipt. Best-effort; returns false
 *  if Supabase is unconfigured or either write fails. */
export async function insertEntry(entry: { id: string }, receipt: { id: string }): Promise<boolean> {
  const sb = serverClient();
  if (!sb) return false;
  const { error: e1 } = await sb.from('cg_campaign_entries').upsert({ id: entry.id, data: entry });
  const { error: e2 } = await sb.from('cg_consent_receipts').upsert({ id: receipt.id, data: receipt });
  return !e1 && !e2;
}
