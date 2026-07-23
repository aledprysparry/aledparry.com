// ═══ Postio Interactive Campaigns: feature flag ═══
//
// The campaigns section is OFF by default so it can land in main without
// changing the shipped app. Enable it per environment with
// NEXT_PUBLIC_POSTIO_CAMPAIGNS=on, or per browser during development with
// localStorage['cg.v1.flag.campaigns'] = 'on'. Both are checked; either turns
// it on. SSR-safe (the engine is a client-only SPA, but guard anyway).

const LS_KEY = 'cg.v1.flag.campaigns';

export function campaignsEnabled(): boolean {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_POSTIO_CAMPAIGNS === 'on') {
    return true;
  }
  if (typeof window !== 'undefined') {
    try {
      return window.localStorage.getItem(LS_KEY) === 'on';
    } catch {
      // Private-mode / blocked storage: treat as off.
      return false;
    }
  }
  return false;
}
