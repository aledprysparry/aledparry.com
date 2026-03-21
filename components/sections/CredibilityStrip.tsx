"use client";

import { useLanguage } from "@/lib/i18n/context";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";

const logos = ["S4C", "BBC", "Sesame Workshop", "Tinopolis", "Boom Cymru"];

export function CredibilityStrip() {
  const { t } = useLanguage();

  return (
    <section className="py-16 border-y border-stone-100">
      <Container>
        <FadeIn>
          <p className="text-xs font-sans font-medium tracking-widest uppercase text-stone-400 text-center mb-8">
            {t.home.credibility.heading}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
            {logos.map((name) => (
              <div
                key={name}
                className="text-stone-300 font-sans font-semibold text-lg tracking-wide"
              >
                {name}
              </div>
            ))}
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
