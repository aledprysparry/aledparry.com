// ═══ Asset persistence in IndexedDB ═══
// Brand assets are images (data URLs) that blow localStorage's ~5MB cap,
// so they live in IndexedDB instead (tens of MB, no silent quota fails).
// The rest of the model stays in localStorage (it's small metadata).
// Same swap-for-a-backend story: replace these two functions later.

import type { BrandAsset } from '@engine/lib/model/types';

const DB_NAME = 'cg-assets';
const STORE = 'assets';
const KEY = 'all';

function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

export async function loadAssetsIDB(): Promise<BrandAsset[]> {
  const db = await openDB();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve((req.result as BrandAsset[]) ?? []);
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

export async function saveAssetsIDB(items: BrandAsset[]): Promise<void> {
  const db = await openDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(items, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
