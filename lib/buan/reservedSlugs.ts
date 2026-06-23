// Buan - reserved slug blocking.
//
// buan.co/<business> shares its namespace with product routes (login, admin,
// api, ...). A business must never be allowed to claim one of those slugs, both
// so the routes keep working and so a tenant can't impersonate a system page.
// This list is the single source of truth: the slug-routing skeleton checks it
// to 404 a reserved <business>, and onboarding (P2) must reject it at sign-up.

export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  // product / system routes
  "admin",
  "api",
  "app",
  "login",
  "logout",
  "signin",
  "signup",
  "register",
  "auth",
  "account",
  "accounts",
  "dashboard",
  "settings",
  "billing",
  "subscribe",
  "subscription",
  "support",
  "help",
  "docs",
  "status",
  "about",
  "contact",
  "pricing",
  "terms",
  "privacy",
  "legal",
  "onboarding",
  "welcome",
  "new",
  "demo",
  // infra / hostnames
  "www",
  "static",
  "assets",
  "cdn",
  "public",
  "img",
  "images",
  "fonts",
  "favicon",
  "robots",
  "sitemap",
  "_next",
  "mail",
  "email",
  "smtp",
  "ftp",
  "ns",
  "mx",
  // brand
  "buan",
  "tanio",
]);

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.trim().toLowerCase());
}

/** A slug is usable as a <business> only if it is well-formed and not reserved. */
export function isValidBusinessSlug(slug: string): boolean {
  const s = (slug || "").trim().toLowerCase();
  return SLUG_RE.test(s) && !isReservedSlug(s);
}
