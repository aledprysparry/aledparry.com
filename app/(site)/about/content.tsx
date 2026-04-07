"use client";

import { useLanguage } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";

export function AboutContent() {
  const { t } = useLanguage();

  return (
    <>
      <FadeIn>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-8">
          {t.about.heading}
        </h1>
        <p className="text-xl md:text-2xl text-stone-600 leading-relaxed max-w-3xl mb-16">
          {t.about.hero}
        </p>
      </FadeIn>

      {/* Two-column: bio + photo */}
      <FadeIn>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-24">
          <div className="lg:col-span-3 space-y-6">
            {t.about.bio.map((paragraph, i) => (
              <p key={i} className="text-base text-stone-700 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="lg:col-span-2">
            <div className="aspect-[3/4] bg-stone-200 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/aled-parry.jpg"
                alt="Aled Parry"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Content sections */}
      {t.about.sections.map((section, i) => (
        <FadeIn key={i}>
          <div className="mb-16">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6">
              {section.heading}
            </h2>
            {section.intro && (
              <p className="text-base text-stone-700 leading-relaxed mb-4">
                {section.intro}
              </p>
            )}
            {section.items.length > 0 && (
              <ul className="space-y-2 mb-6 pl-1">
                {section.items.map((item, j) => (
                  <li
                    key={j}
                    className="text-base text-stone-700 leading-relaxed flex items-start gap-3"
                  >
                    <span className="text-stone-400 mt-1.5 text-xs">&#9642;</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
            {section.outro && (
              <p className="text-base text-stone-700 leading-relaxed">
                {section.outro}
              </p>
            )}
          </div>
        </FadeIn>
      ))}

      {/* Skills */}
      <FadeIn>
        <div className="mb-24">
          <h2 className="text-2xl font-serif font-bold text-stone-900 mb-8">
            {t.about.skills.heading}
          </h2>
          <div className="flex flex-wrap gap-3">
            {t.about.skills.items.map((skill) => (
              <span
                key={skill}
                className="text-sm font-sans text-stone-600 bg-stone-100 px-4 py-2"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* CTA */}
      <FadeIn>
        <div className="text-center py-16 border-t border-stone-200">
          <h2 className="text-3xl font-serif font-bold text-stone-900 mb-6">
            {t.about.cta.heading}
          </h2>
          <p className="text-base text-stone-500 leading-relaxed mb-8 max-w-md mx-auto">
            If you&apos;ve got a project, format or idea you&apos;d like to explore, feel free to get in touch.
          </p>
          <Button href="/contact">{t.about.cta.button}</Button>
        </div>
      </FadeIn>
    </>
  );
}
