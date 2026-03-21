"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { Container } from "@/components/ui/Container";

export function Footer() {
  const { t } = useLanguage();

  const year = new Date().getFullYear();
  const copyright = t.footer.copyright.replace("{year}", String(year));

  return (
    <footer className="border-t border-stone-200 py-12 mt-24">
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-base font-serif font-bold text-stone-900"
            >
              Aled Parry
            </Link>
            <nav className="flex gap-6">
              <Link
                href="/work"
                className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
              >
                {t.nav.work}
              </Link>
              <Link
                href="/services"
                className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
              >
                {t.nav.services}
              </Link>
              <Link
                href="/about"
                className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
              >
                {t.nav.about}
              </Link>
              <Link
                href="/contact"
                className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
              >
                {t.nav.contact}
              </Link>
            </nav>
          </div>
          <p className="text-sm text-stone-400 font-sans">{copyright}</p>
        </div>
      </Container>
    </footer>
  );
}
