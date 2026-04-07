"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";

export function AboutContent() {
  const { t } = useLanguage();

  return (
    <>
      <div className="mb-10">
        <Link
          href="/"
          className="text-sm font-sans text-stone-400 hover:text-stone-900 transition-colors"
        >
          &larr; Home
        </Link>
      </div>
      <FadeIn>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-8">
          {t.about.heading}
        </h1>
        <p className="text-xl md:text-2xl text-stone-600 leading-relaxed max-w-3xl mb-12">
          {t.about.hero}
        </p>
      </FadeIn>

      {/* Bio + photo (text wraps around floated image) */}
      <FadeIn>
        <div className="mb-8 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/aled-parry.jpg"
            alt="Aled Parry"
            className="float-right ml-8 mb-6 w-[200px] md:w-[240px] aspect-square object-cover bg-stone-100"
          />
          {t.about.bio.map((paragraph, i) => (
            <p key={i} className="text-base text-stone-600 leading-relaxed mb-5">
              {paragraph}
            </p>
          ))}
        </div>
      </FadeIn>

      {/* Content sections */}
      <div className="max-w-2xl">
        {t.about.sections.map((section, i) => (
          <FadeIn key={i}>
            <div className="mb-14">
              <h2 className="text-xl font-serif font-bold text-stone-900 mb-4">
                {section.heading}
              </h2>
              {section.intro && (
                <p className="text-base text-stone-600 leading-relaxed mb-4">
                  {section.intro}
                </p>
              )}
              {section.items.length > 0 && (
                <ul className="space-y-2 mb-4 pl-1">
                  {section.items.map((item, j) => (
                    <li
                      key={j}
                      className="text-base text-stone-600 leading-relaxed flex items-start gap-3"
                    >
                      <span className="text-stone-300 mt-1.5 text-xs">&#9642;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {section.outro && (
                <p className="text-base text-stone-600 leading-relaxed">
                  {section.outro}
                </p>
              )}
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Skills */}
      <FadeIn>
        <div className="mb-20">
          <h2 className="text-xl font-serif font-bold text-stone-900 mb-6">
            {t.about.skills.heading}
          </h2>
          <div className="flex flex-wrap gap-2">
            {t.about.skills.items.map((skill) => (
              <span
                key={skill}
                className="text-sm font-sans text-stone-500 bg-stone-100 px-3 py-1.5"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* CTA */}
      <FadeIn>
        <div className="text-center py-14 border-t border-stone-200">
          <h2 className="text-2xl font-serif font-bold text-stone-900 mb-4">
            {t.about.cta.heading}
          </h2>
          <Button href="/contact">{t.about.cta.button}</Button>
        </div>
      </FadeIn>
    </>
  );
}
