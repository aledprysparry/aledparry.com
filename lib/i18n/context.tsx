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
    if (stored === "en" || stored === "cy") {
      // Explicit, remembered choice always wins.
      setLocaleState(stored);
    } else if (typeof navigator !== "undefined") {
      // First visit with no stored choice: follow the browser locale so the
      // Welsh option is offered proactively (WLC guidance §6 / §6.2). Not
      // persisted — only an explicit toggle is remembered for future sessions.
      const prefs = navigator.languages?.length
        ? navigator.languages
        : [navigator.language];
      if (prefs.some((l) => l?.toLowerCase().startsWith("cy"))) {
        setLocaleState("cy");
      }
    }
    setMounted(true);
  }, []);

  // Keep the document language in sync so assistive tech and search engines
  // read each page in the displayed language (WCAG 3.1.1 / SEO).
  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = locale;
    }
  }, [locale, mounted]);

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
