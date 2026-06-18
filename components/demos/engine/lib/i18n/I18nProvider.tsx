// ═══ Engine i18n: language context + t() helper ═══
// Self-contained for the embedded SPA (the parent site has its own
// LanguageProvider, but this app owns its own UI strings + toggle).

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { STRINGS, type Lang, type StringKey } from './strings';
import { loadLang, saveLang } from '@engine/lib/store/persist';

type Vars = Record<string, string | number>;

interface I18nApi {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey, vars?: Vars) => string;
  /** Localised "{n} noun" with the right plural form (Welsh stays singular). */
  count: (n: number, noun: 'brand' | 'template' | 'graphic' | 'asset') => string;
}

const I18nContext = createContext<I18nApi | null>(null);

function interpolate(s: string, vars?: Vars): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => loadLang());

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    saveLang(l);
  }, []);

  const api = useMemo<I18nApi>(() => {
    const dict = STRINGS[lang];
    const t = (key: StringKey, vars?: Vars) =>
      interpolate((dict[key] ?? STRINGS.en[key] ?? key) as string, vars);
    const count = (n: number, noun: 'brand' | 'template' | 'graphic' | 'asset') => {
      const form = n === 1 ? `count.${noun}.one` : `count.${noun}.other`;
      return `${n} ${t(form as StringKey)}`;
    };
    return { lang, setLang, t, count };
  }, [lang, setLang]);

  return <I18nContext.Provider value={api}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nApi {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
