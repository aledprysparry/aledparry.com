// URL/QR-safe slug from an arbitrary string (e.g. a brand name). Lowercase
// alphanumerics joined by single hyphens; capped at 64 chars. Used to resolve
// the public experience path /c/{brandSlug}/{campaignSlug}.

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
}
