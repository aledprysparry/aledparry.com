"use client";

import { useLanguage } from "@/lib/i18n/context";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { TetrisBackground } from "@/components/ui/TetrisBackground";

export function HomeContent() {
  const { t } = useLanguage();

  return (
    <>
    <TetrisBackground />
    <div className="min-h-screen flex flex-col items-center justify-center px-6 -mt-16 relative z-10 pointer-events-none">
      <div className="text-center max-w-xl pointer-events-auto">
        {/* Hero */}
        <p className="text-sm font-sans font-medium tracking-widest uppercase text-stone-400 mb-6">
          {t.home.hero.title}
        </p>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-stone-900 mb-8 leading-[1.1]">
          {t.home.hero.name}
        </h1>
        <p className="text-lg md:text-xl text-stone-500 leading-relaxed mb-16">
          {t.home.hero.valueStatement}
        </p>

        {/* CTA section */}
        <div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 mb-4">
            {t.home.footerCta.heading}
          </h2>
          <p className="text-base text-stone-500 leading-relaxed mb-8 max-w-md mx-auto">
            {t.home.footerCta.body}
          </p>
          <div className="flex items-center justify-center gap-6">
            <a
              href="mailto:aled@aledparry.com"
              className="bg-stone-900 text-white px-6 py-3 text-sm font-sans font-medium tracking-wide hover:bg-stone-800 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97]"
            >
              {t.home.hero.cta}
            </a>
            <a
              href="/about"
              className="text-sm font-sans text-stone-500 hover:text-stone-900 transition-colors underline underline-offset-4 decoration-stone-300 hover:decoration-stone-500"
            >
              About
            </a>
            <a
              href="https://linkedin.com/in/aledparry"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-sans text-stone-500 hover:text-stone-900 transition-colors underline underline-offset-4 decoration-stone-300 hover:decoration-stone-500"
            >
              LinkedIn
            </a>
          </div>
        </div>

      </div>
    </div>
    {/* Language toggle — fixed bottom left */}
    <div className="fixed bottom-4 left-4 z-10 pointer-events-auto">
      <LanguageToggle />
    </div>
    </>
  );
}
