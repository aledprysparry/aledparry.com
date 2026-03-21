"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { Container } from "@/components/ui/Container";
import clsx from "clsx";

export function Header() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const links = [
    { href: "/work", label: t.nav.work },
    { href: "/services", label: t.nav.services },
    { href: "/about", label: t.nav.about },
    { href: "/contact", label: t.nav.contact },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header
        className={clsx(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-stone-50/95 backdrop-blur-md shadow-sm border-b border-stone-100"
            : "bg-stone-50/90 backdrop-blur-sm border-b border-transparent"
        )}
      >
        <Container>
          <nav
            className={clsx(
              "flex items-center justify-between transition-all duration-300",
              scrolled ? "h-14" : "h-16"
            )}
          >
            <Link
              href="/"
              className="text-lg font-serif font-bold text-stone-900 hover:text-accent-dark transition-colors"
            >
              Aled Parry
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "text-sm font-sans transition-colors relative py-1",
                    isActive(link.href)
                      ? "text-stone-900 font-medium"
                      : "text-stone-500 hover:text-stone-900"
                  )}
                >
                  {link.label}
                  {isActive(link.href) && (
                    <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-accent" />
                  )}
                </Link>
              ))}
              <LanguageToggle />
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-stone-700 relative z-50"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-5 relative flex flex-col justify-between">
                <span
                  className={clsx(
                    "block h-[1.5px] w-full bg-current transition-all duration-300 origin-center",
                    menuOpen && "rotate-45 translate-y-[7px]"
                  )}
                />
                <span
                  className={clsx(
                    "block h-[1.5px] w-full bg-current transition-all duration-200",
                    menuOpen && "opacity-0 scale-x-0"
                  )}
                />
                <span
                  className={clsx(
                    "block h-[1.5px] w-full bg-current transition-all duration-300 origin-center",
                    menuOpen && "-rotate-45 -translate-y-[7px]"
                  )}
                />
              </div>
            </button>
          </nav>
        </Container>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={clsx(
          "fixed inset-0 z-40 bg-stone-50 md:hidden transition-all duration-500",
          menuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {links.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "text-3xl font-serif font-bold transition-all duration-500",
                menuOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4",
                isActive(link.href)
                  ? "text-stone-900"
                  : "text-stone-400 hover:text-stone-900"
              )}
              style={{ transitionDelay: menuOpen ? `${i * 80 + 100}ms` : "0ms" }}
            >
              {link.label}
            </Link>
          ))}
          <div
            className={clsx(
              "transition-all duration-500 mt-4",
              menuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
            style={{ transitionDelay: menuOpen ? "420ms" : "0ms" }}
          >
            <LanguageToggle />
          </div>
        </div>
      </div>
    </>
  );
}
