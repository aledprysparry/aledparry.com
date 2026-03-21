"use client";

import { useLanguage } from "@/lib/i18n/context";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";
import { CaseStudyFrontmatter } from "@/lib/mdx/types";

interface FeaturedWorkProps {
  caseStudies: Array<{
    slug: string;
    frontmatter: CaseStudyFrontmatter;
  }>;
}

export function FeaturedWork({ caseStudies }: FeaturedWorkProps) {
  const { locale, t } = useLanguage();

  return (
    <section className="py-24">
      <Container>
        <FadeIn>
          <SectionHeading>{t.home.featuredWork.heading}</SectionHeading>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mt-12">
          {caseStudies.map((cs, i) => (
            <FadeIn key={cs.slug} delay={i * 150}>
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
        <FadeIn delay={500}>
          <div className="mt-12 text-center">
            <Button href="/work" variant="secondary">
              {t.home.featuredWork.viewAll}
            </Button>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
