// ═══ Settings: UI density + colour theme ═══
// Persisted preferences that drive the look of the whole engine. Density and
// theme are applied to the .postio-engine root as `data-density` and a `dark`
// class; CSS (defined in EngineApp) reads those to switch control sizing and
// the dark palette. Kept separate from the data Store so UI chrome settings
// never touch user content.

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import {
  loadDensity, saveDensity, loadTheme, saveTheme, type Density, type Theme,
} from '@engine/lib/store/persist';

interface SettingsApi {
  density: Density;
  setDensity: (d: Density) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  /** The theme actually rendered (system resolved to light/dark). */
  resolvedTheme: 'light' | 'dark';
}

const SettingsContext = createContext<SettingsApi | null>(null);

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [density, setDensityState] = useState<Density>(() => loadDensity());
  const [theme, setThemeState] = useState<Theme>(() => loadTheme());
  const [systemDark, setSystemDark] = useState<boolean>(() => systemPrefersDark());

  // Track the OS theme so `system` follows it live.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  // Reflect density + theme onto the engine root element so CSS + Tailwind's
  // scoped `dark:` selector (.postio-engine.dark) take effect app-wide.
  useEffect(() => {
    const root = document.querySelector('.postio-engine');
    if (!(root instanceof HTMLElement)) return;
    root.setAttribute('data-density', density);
    root.classList.toggle('dark', resolvedTheme === 'dark');
  }, [density, resolvedTheme]);

  const setDensity = useCallback((d: Density) => { setDensityState(d); saveDensity(d); }, []);
  const setTheme = useCallback((t: Theme) => { setThemeState(t); saveTheme(t); }, []);

  const api = useMemo<SettingsApi>(
    () => ({ density, setDensity, theme, setTheme, resolvedTheme }),
    [density, setDensity, theme, setTheme, resolvedTheme],
  );

  return <SettingsContext.Provider value={api}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsApi {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
