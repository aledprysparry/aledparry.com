"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import { Container } from "@/components/ui/Container";

export function Footer() {
  const { t } = useLanguage();

  const year = new Date().getFullYear();
  const copyright = t.footer.copyright.replace("{year}", String(year));

  const links = [
    { href: "/work", label: t.nav.work },
    { href: "/services", label: t.nav.services },
    { href: "/about", label: t.nav.about },
    { href: "/contact", label: t.nav.contact },
  ];

  return (
    <footer className="border-t border-stone-200 py-12 mt-24">
      <Container>
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-8">
            <Link
              href="/"
              className="text-base font-serif font-bold text-stone-900"
            >
              Aled Parry
            </Link>
            <nav className="flex gap-4 md:gap-6">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <p className="text-sm text-stone-400 font-sans">{copyright}</p>
        </div>
      </Container>
    </footer>
  );
}
