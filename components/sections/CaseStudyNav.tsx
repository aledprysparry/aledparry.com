"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";

interface CaseStudyNavProps {
  prev: { slug: string; title: string; titleCy?: string } | null;
  next: { slug: string; title: string; titleCy?: string } | null;
}

export function CaseStudyNav({ prev, next }: CaseStudyNavProps) {
  const { locale, t } = useLanguage();

  return (
    <nav className="border-t border-stone-200 mt-16 pt-8">
      <div className="flex justify-between items-start">
        {prev ? (
          <Link href={`/work/${prev.slug}`} className="group max-w-xs">
            <p className="text-xs font-sans text-stone-400 mb-1">
              {t.caseStudy.prevProject}
            </p>
            <p className="text-base font-serif font-semibold text-stone-700 group-hover:text-stone-900 transition-colors">
              &larr;{" "}
              {locale === "cy" && prev.titleCy ? prev.titleCy : prev.title}
            </p>
          </Link>
        ) : (
          <div />
        )}
        {next ? (
          <Link
            href={`/work/${next.slug}`}
            className="group max-w-xs text-right"
          >
            <p className="text-xs font-sans text-stone-400 mb-1">
              {t.caseStudy.nextProject}
            </p>
            <p className="text-base font-serif font-semibold text-stone-700 group-hover:text-stone-900 transition-colors">
              {locale === "cy" && next.titleCy ? next.titleCy : next.title}{" "}
              &rarr;
            </p>
          </Link>
        ) : (
          <div />
        )}
      </div>
      <div className="mt-8 text-center">
        <Link
          href="/work"
          className="text-sm font-sans text-stone-500 hover:text-stone-900 transition-colors"
        >
          {t.caseStudy.backToWork}
        </Link>
      </div>
    </nav>
  );
}
