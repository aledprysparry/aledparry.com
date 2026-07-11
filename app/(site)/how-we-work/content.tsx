"use client";

import { useLanguage } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";

export function HowWeWorkContent() {
  const { t } = useLanguage();

  return (
    <>
      <FadeIn>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-8">
          {t.howWeWork.heading}
        </h1>
        <p className="text-xl md:text-2xl text-stone-600 leading-relaxed max-w-3xl mb-16">
          {t.howWeWork.intro}
        </p>
      </FadeIn>

      <div className="max-w-2xl mb-16">
        {t.howWeWork.steps.map((step, i) => (
          <FadeIn key={step.title} delay={i * 80} variant="fade-left">
            <div className="group flex gap-6 py-8 border-b border-stone-200 last:border-b-0">
              <span className="text-sm font-sans font-medium text-stone-300 pt-1 tabular-nums shrink-0 transition-colors duration-300 group-hover:text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">
                  {step.title}
                </h2>
                <p className="text-base text-stone-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      <FadeIn>
        <p className="text-base text-stone-600 leading-relaxed max-w-2xl mb-20">
          {t.howWeWork.outro}
        </p>
      </FadeIn>

      <FadeIn>
        <div className="max-w-2xl mx-auto text-center py-14 border-t border-stone-200">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 mb-4">
            {t.howWeWork.cta.heading}
          </h2>
          <p className="text-base text-stone-500 leading-relaxed mb-8">
            {t.howWeWork.cta.body}
          </p>
          <Button href="/contact">{t.howWeWork.cta.button}</Button>
        </div>
      </FadeIn>
    </>
  );
}
