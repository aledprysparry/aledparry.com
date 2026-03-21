"use client";

import { useLanguage } from "@/lib/i18n/context";
import { WorkGrid } from "@/components/sections/WorkGrid";
import { FadeIn } from "@/components/ui/FadeIn";
import { CaseStudyFrontmatter } from "@/lib/mdx/types";

interface WorkContentProps {
  caseStudies: Array<{
    slug: string;
    frontmatter: CaseStudyFrontmatter;
  }>;
}

export function WorkContent({ caseStudies }: WorkContentProps) {
  const { t } = useLanguage();

  return (
    <>
      <FadeIn>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-4">
          {t.work.heading}
        </h1>
        <p className="text-lg text-stone-600 mb-12 max-w-2xl">
          {t.work.description}
        </p>
      </FadeIn>
      <WorkGrid caseStudies={caseStudies} />
    </>
  );
}
