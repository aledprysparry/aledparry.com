"use client";

import { useLanguage } from "@/lib/i18n/context";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FadeIn } from "@/components/ui/FadeIn";

export function TestimonialCarousel() {
  const { t } = useLanguage();

  return (
    <section className="py-24 bg-stone-100/50">
      <Container>
        <FadeIn>
          <SectionHeading>{t.home.testimonials.heading}</SectionHeading>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {t.home.testimonials.items.map((item, i) => (
            <FadeIn key={i}>
              <blockquote className="bg-white p-8 h-full flex flex-col">
                <p className="text-base text-stone-700 leading-relaxed italic flex-1">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <div className="mt-6 pt-6 border-t border-stone-100">
                  <p className="text-sm font-semibold text-stone-900">
                    {item.author}
                  </p>
                  <p className="text-sm text-stone-500">{item.role}</p>
                </div>
              </blockquote>
            </FadeIn>
          ))}
        </div>
      </Container>
    </section>
  );
}
