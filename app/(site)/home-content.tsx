"use client";

import { useLanguage } from "@/lib/i18n/context";

export function HomeContent() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-xl">
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
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            <a
              href="/how-we-work"
              className="bg-stone-900 text-white px-6 py-3 text-sm font-sans font-medium tracking-wide hover:bg-stone-800 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97]"
            >
              {t.home.hero.cta}
            </a>
            <a
              href="mailto:aled@aledparry.com"
              className="text-sm font-sans text-stone-500 hover:text-stone-900 transition-colors underline underline-offset-4 decoration-stone-300 hover:decoration-stone-500"
            >
              {t.home.footerCta.cta}
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
  );
}
