// Supabase client for engine persistence. Env-gated: if the public env
// vars aren't set, the engine stays local-first (localStorage + IndexedDB)
// and none of this runs. See SUPABASE_SETUP.md.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null | undefined;

export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  if (!supabaseConfigured()) { cached = null; return null; }
  cached = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string);
  return cached;
}
