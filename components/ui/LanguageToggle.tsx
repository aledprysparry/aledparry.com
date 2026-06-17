"use client";

import { useLanguage } from "@/lib/i18n/context";

export function LanguageToggle() {
  const { locale, setLocale, t } = useLanguage();
  const target = locale === "en" ? "cy" : "en";

  return (
    <button
      onClick={() => setLocale(target)}
      // Native language name is the visible + accessible label; lang tags it so
      // screen readers pronounce the other-language word correctly (WCAG 3.1.2).
      lang={target}
      className="text-sm font-sans font-medium tracking-wide text-stone-500 hover:text-stone-900 transition-colors px-2 py-1"
    >
      {t.nav.languageToggle}
    </button>
  );
}
