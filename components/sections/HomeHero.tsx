"use client";

import { useLanguage } from "@/lib/i18n/context";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";

export function HomeHero() {
  const { t } = useLanguage();

  return (
    <section className="py-24 md:py-32 lg:py-40">
      <Container>
        <FadeIn>
          <div className="max-w-3xl">
            <p className="text-sm font-sans font-medium tracking-widest uppercase text-accent mb-6">
              {t.home.hero.title}
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-stone-900 mb-8 leading-[1.1]">
              {t.home.hero.name}
            </h1>
            <p className="text-xl md:text-2xl text-stone-600 leading-relaxed mb-10 max-w-2xl">
              {t.home.hero.valueStatement}
            </p>
            <Button href="/contact">{t.home.hero.cta}</Button>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
