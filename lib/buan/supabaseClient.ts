// Buan - Supabase client (env-gated, multi-tenant).
//
// Mirrors the engine's pattern (components/demos/engine/lib/store/
// supabaseClient.ts): if the public env vars are not set, every Buan module
// becomes a graceful no-op so the site build and the live Tanio demo are
// unaffected. Buan lives in its own isolated `buan` schema.
//
// Public/anon key only - safe in the browser bundle. RLS does the enforcement.
// The service-role key never appears in client code (see migrations/README.md).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

export function buanConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getBuanClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  if (!buanConfigured()) {
    cached = null;
    return null;
  }
  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    { db: { schema: "buan" } }
  ) as unknown as SupabaseClient;
  return cached;
}
