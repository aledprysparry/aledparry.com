"use client";

import { useLanguage } from "@/lib/i18n/context";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";

export function FooterCta() {
  const { t } = useLanguage();

  return (
    <section className="py-24 md:py-32">
      <Container>
        <FadeIn>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-6">
              {t.home.footerCta.heading}
            </h2>
            <p className="text-lg text-stone-600 mb-10">
              {t.home.footerCta.body}
            </p>
            <Button href="/contact">{t.home.footerCta.cta}</Button>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
