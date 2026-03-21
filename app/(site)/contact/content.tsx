"use client";

import { useLanguage } from "@/lib/i18n/context";
import { ContactForm } from "@/components/sections/ContactForm";
import { FadeIn } from "@/components/ui/FadeIn";

export function ContactContent() {
  const { t } = useLanguage();

  return (
    <>
      <FadeIn>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-4">
          {t.contact.heading}
        </h1>
        <p className="text-lg text-stone-600 mb-12 max-w-2xl">
          {t.contact.description}
        </p>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2">
          <FadeIn>
            <ContactForm />
          </FadeIn>
        </div>
        <div>
          <FadeIn>
            <div className="space-y-6">
              <h2 className="text-lg font-serif font-semibold text-stone-900">
                {t.contact.directContact}
              </h2>
              <div>
                <p className="text-sm font-medium text-stone-500 mb-1">
                  {t.contact.emailLabel}
                </p>
                <a
                  href="mailto:hello@aledparry.com"
                  className="text-base text-stone-900 hover:text-accent-dark transition-colors"
                >
                  hello@aledparry.com
                </a>
              </div>
              <div>
                <p className="text-sm font-medium text-stone-500 mb-1">
                  {t.contact.linkedinLabel}
                </p>
                <a
                  href="https://linkedin.com/in/aledparry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base text-stone-900 hover:text-accent-dark transition-colors"
                >
                  linkedin.com/in/aledparry
                </a>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </>
  );
}
