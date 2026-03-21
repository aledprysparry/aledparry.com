"use client";

import { useLanguage } from "@/lib/i18n/context";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "cy" : "en")}
      className="text-sm font-sans font-medium tracking-wider text-stone-500 hover:text-stone-900 transition-colors px-2 py-1"
      aria-label={`Switch to ${locale === "en" ? "Welsh" : "English"}`}
    >
      {t.nav.languageToggle}
    </button>
  );
}
