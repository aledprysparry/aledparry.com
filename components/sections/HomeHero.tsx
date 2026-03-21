"use client";

import { useLanguage } from "@/lib/i18n/context";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";

export function HomeHero() {
  const { t } = useLanguage();

  return (
    <section className="py-24 md:py-32 lg:py-40 relative overflow-hidden">
      {/* Decorative floating dot */}
      <div className="absolute top-32 right-[15%] w-2 h-2 rounded-full bg-accent/30 animate-float hidden lg:block" />
      <div
        className="absolute top-48 right-[10%] w-1.5 h-1.5 rounded-full bg-accent/20 animate-float hidden lg:block"
        style={{ animationDelay: "1s" }}
      />

      <Container>
        <div className="max-w-3xl">
          <FadeIn delay={0}>
            <p className="text-sm font-sans font-medium tracking-widest uppercase text-accent mb-6">
              {t.home.hero.title}
            </p>
          </FadeIn>

          <FadeIn delay={150} variant="blur">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-stone-900 mb-8 leading-[1.1]">
              {t.home.hero.name}
            </h1>
          </FadeIn>

          <FadeIn delay={300}>
            <p className="text-xl md:text-2xl text-stone-600 leading-relaxed mb-10 max-w-2xl">
              {t.home.hero.valueStatement}
            </p>
          </FadeIn>

          <FadeIn delay={450} variant="scale">
            <Button href="/contact">{t.home.hero.cta}</Button>
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}
