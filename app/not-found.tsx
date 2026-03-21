"use client";

import { useLanguage } from "@/lib/i18n/context";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen flex items-center">
      <Container>
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-4xl font-serif font-bold text-stone-900 mb-4">
            {t.notFound.heading}
          </h1>
          <p className="text-lg text-stone-600 mb-8">{t.notFound.body}</p>
          <Button href="/">{t.notFound.cta}</Button>
        </div>
      </Container>
    </main>
  );
}
