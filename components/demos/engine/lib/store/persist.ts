// ═══ Local-first persistence primitives ═══
// Thin wrapper over localStorage, namespaced + versioned. The rest of
// the app never touches localStorage directly - swap these two
// functions (and make them async) for a Supabase/Postgres adapter and
// nothing else changes.

const NS = 'cg.v1';

export const COLLECTIONS = [
  'brands',
  'assets',
  'socialAccounts',
  'templateStyles',
  'templates',
  'graphics',
  'clips',
  'folders',
] as const;

export type CollectionName = (typeof COLLECTIONS)[number];

export function loadCollection<T>(name: CollectionName): T[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${NS}.${name}`);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export function saveCollection(name: CollectionName, items: unknown[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`${NS}.${name}`, JSON.stringify(items));
  } catch (e) {
    // localStorage quota (large inline assets) - surfaced, not fatal.
    console.warn(`Could not persist ${name}:`, e);
  }
}

export function seededFlag(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(`${NS}.seeded`) === 'true';
}
export function markSeeded(): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(`${NS}.seeded`, 'true');
}

export function newId(prefix = 'id'): string {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `${prefix}_${uuid}`;
}

export function now(): string {
  return new Date().toISOString();
}

/** UI language choice, persisted so it survives reloads. */
export function loadLang(): 'en' | 'cy' {
  if (typeof localStorage === 'undefined') return 'en';
  return localStorage.getItem(`${NS}.lang`) === 'cy' ? 'cy' : 'en';
}
export function saveLang(lang: 'en' | 'cy'): void {
  if (typeof localStorage !== 'undefined') localStorage.setItem(`${NS}.lang`, lang);
}

/**
 * Snapshot every collection for a "back up / export" download. Assets live
 * in IndexedDB (not localStorage), so the caller passes them in.
 */
export function exportSnapshot(extra: Record<string, unknown[]> = {}): string {
  const data: Record<string, unknown> = { version: NS, exportedAt: now() };
  for (const name of COLLECTIONS) {
    data[name] = name in extra ? extra[name] : loadCollection(name);
  }
  return JSON.stringify(data, null, 2);
}
