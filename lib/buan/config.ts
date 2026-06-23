// Buan runtime config + slug rules (P0).
// Env-gated: the data layer is live only when both Supabase vars are present,
// so the app builds and renders cleanly before any backend is wired.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const BUAN_LIVE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Slugs that can never be claimed as a business slug (they collide with
// platform routes or are otherwise reserved).
export const RESERVED_SLUGS = new Set<string>([
  "admin", "login", "logout", "signup", "register", "support", "help",
  "api", "app", "dashboard", "account", "settings", "billing", "pricing",
  "about", "contact", "terms", "privacy", "legal", "static", "_next",
  "assets", "public", "buan", "www", "blog", "docs", "status",
]);

export function isReservedSlug(s: string): boolean {
  return RESERVED_SLUGS.has((s || "").toLowerCase());
}

export function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function isValidSlug(s: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,47}$/.test(s) && !isReservedSlug(s);
}

export function money(n: number): string {
  return "£" + (Number(n) || 0).toFixed(2);
}
