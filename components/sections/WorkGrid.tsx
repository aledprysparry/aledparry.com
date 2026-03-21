"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/context";
import { Card } from "@/components/ui/Card";
import { FadeIn } from "@/components/ui/FadeIn";
import { CaseStudyFrontmatter } from "@/lib/mdx/types";
import clsx from "clsx";

interface WorkGridProps {
  caseStudies: Array<{
    slug: string;
    frontmatter: CaseStudyFrontmatter;
  }>;
}

export function WorkGrid({ caseStudies }: WorkGridProps) {
  const { locale, t } = useLanguage();
  const [filter, setFilter] = useState<string>("all");

  const types = Object.keys(t.work.types);
  const filtered =
    filter === "all"
      ? caseStudies
      : caseStudies.filter((cs) => cs.frontmatter.type === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-12">
        <button
          onClick={() => setFilter("all")}
          className={clsx(
            "text-sm font-sans px-4 py-2 transition-colors",
            filter === "all"
              ? "bg-stone-900 text-white"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          )}
        >
          {t.work.filterAll}
        </button>
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={clsx(
              "text-sm font-sans px-4 py-2 transition-colors",
              filter === type
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            )}
          >
            {t.work.types[type]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((cs) => (
          <FadeIn key={cs.slug}>
            <Card
              title={
                locale === "cy" && cs.frontmatter.titleCy
                  ? cs.frontmatter.titleCy
                  : cs.frontmatter.title
              }
              subtitle={cs.frontmatter.client}
              meta={String(cs.frontmatter.year)}
              tag={t.work.types[cs.frontmatter.type]}
              href={`/work/${cs.slug}`}
              image={cs.frontmatter.heroImage}
            />
          </FadeIn>
        ))}
      </div>
    </div>
  );
}
