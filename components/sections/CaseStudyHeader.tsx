"use client";

import { useLanguage } from "@/lib/i18n/context";
import { Badge } from "@/components/ui/Badge";
import { FadeIn } from "@/components/ui/FadeIn";
import { CaseStudyFrontmatter } from "@/lib/mdx/types";

interface CaseStudyHeaderProps {
  frontmatter: CaseStudyFrontmatter;
}

export function CaseStudyHeader({ frontmatter }: CaseStudyHeaderProps) {
  const { locale, t } = useLanguage();

  const title =
    locale === "cy" && frontmatter.titleCy
      ? frontmatter.titleCy
      : frontmatter.title;
  const role =
    locale === "cy" && frontmatter.roleCy
      ? frontmatter.roleCy
      : frontmatter.role;

  return (
    <div className="mb-12">
      <FadeIn delay={0}>
        <Badge className="mb-4">{t.work.types[frontmatter.type]}</Badge>
      </FadeIn>
      <FadeIn delay={100} variant="blur">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-stone-900 mb-6">
          {title}
        </h1>
      </FadeIn>
      <FadeIn delay={200}>
        <div className="flex flex-wrap gap-6 text-sm text-stone-500 font-sans">
          <span>
            <strong className="text-stone-700">{t.caseStudy.roleLabel}:</strong>{" "}
            {role}
          </span>
          <span>
            <strong className="text-stone-700">Client:</strong>{" "}
            {frontmatter.client}
          </span>
          <span>
            <strong className="text-stone-700">Year:</strong>{" "}
            {frontmatter.year}
          </span>
        </div>
      </FadeIn>
    </div>
  );
}
