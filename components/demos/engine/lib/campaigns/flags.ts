// ═══ Postio Interactive Campaigns: feature flag ═══
//
// The campaigns section is OFF by default so it can land in main without
// changing the shipped app. Enable it per environment with
// NEXT_PUBLIC_POSTIO_CAMPAIGNS=on, or per browser during development with
// localStorage['cg.v1.flag.campaigns'] = 'on'. Both are checked; either turns
// it on. SSR-safe (the engine is a client-only SPA, but guard anyway).

const LS_KEY = 'cg.v1.flag.campaigns';

export function campaignsEnabled(): boolean {
  // STATIC access, deliberately. Next only inlines NEXT_PUBLIC_* into the browser
  // bundle for a literal `process.env.NEXT_PUBLIC_X` read. The previous
  // `typeof process !== 'undefined' && process.env?.X` form left a RUNTIME
  // process.env lookup, which is undefined in the browser - so a build with
  // NEXT_PUBLIC_POSTIO_CAMPAIGNS=on still returned false and the documented
  // env rollout path silently did nothing. Do not reintroduce the optional
  // chain or the typeof guard here: after inlining this is a literal string
  // compare, so it is SSR-safe without them.
  if (process.env.NEXT_PUBLIC_POSTIO_CAMPAIGNS === 'on') {
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
