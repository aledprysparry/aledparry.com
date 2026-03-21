"use client";

import { useLanguage } from "@/lib/i18n/context";
import { ServiceBlock } from "@/components/sections/ServiceBlock";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";

export function ServicesContent() {
  const { t } = useLanguage();

  return (
    <>
      <FadeIn>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-4">
          {t.services.heading}
        </h1>
        <p className="text-lg text-stone-600 mb-12 max-w-2xl">
          {t.services.description}
        </p>
      </FadeIn>

      <div className="mb-24">
        {t.services.items.map((item) => (
          <ServiceBlock
            key={item.title}
            title={item.title}
            description={item.description}
            goodFor={item.goodFor}
          />
        ))}
      </div>

      <FadeIn>
        <div className="max-w-2xl mx-auto text-center py-16 border-t border-stone-200">
          <h2 className="text-3xl font-serif font-bold text-stone-900 mb-4">
            {t.services.cta.heading}
          </h2>
          <p className="text-lg text-stone-600 mb-8">{t.services.cta.body}</p>
          <Button href="/contact">{t.services.cta.button}</Button>
        </div>
      </FadeIn>
    </>
  );
}
