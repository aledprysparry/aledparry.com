"use client";

import { useLanguage } from "@/lib/i18n/context";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";

const logos = ["S4C", "BBC", "ITV", "Channel 4", "Sesame Street", "Microsoft", "CBBC", "DHX Media", "BAFTA"];

export function CredibilityStrip() {
  const { t } = useLanguage();

  return (
    <section className="py-12 border-y border-stone-100">
      <FadeIn>
        <Container>
          <p className="text-xs font-sans font-medium tracking-widest uppercase text-stone-400 text-center mb-6">
            {t.home.credibility.heading}
          </p>
        </Container>
        <div className="marquee-container">
          <div className="flex animate-marquee w-max">
            {/* Duplicate for seamless loop */}
            {[...logos, ...logos].map((name, i) => (
              <div
                key={`${name}-${i}`}
                className="text-stone-300 hover:text-stone-500 font-sans font-semibold text-lg tracking-wide px-8 md:px-12 transition-colors duration-300 whitespace-nowrap select-none"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
