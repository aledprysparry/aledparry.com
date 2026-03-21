"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Locale, SiteContent } from "@/content/i18n/types";
import { en } from "@/content/i18n/en";
import { cy } from "@/content/i18n/cy";

const translations: Record<Locale, SiteContent> = { en, cy };

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: SiteContent;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
  t: en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("lang") as Locale | null;
    if (stored && (stored === "en" || stored === "cy")) {
      setLocaleState(stored);
    }
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("lang", newLocale);
  };

  // Prevent hydration mismatch by rendering with default locale until mounted
  const t = translations[mounted ? locale : "en"];

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
