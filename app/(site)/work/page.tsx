import { Metadata } from "next";
import { getCaseStudies } from "@/lib/mdx/get-case-studies";
import { Container } from "@/components/ui/Container";
import { WorkGrid } from "@/components/sections/WorkGrid";

export const metadata: Metadata = {
  title: "Work",
  description:
    "A selection of projects spanning broadcast, digital, and content strategy by Aled Parry.",
};

export default function WorkPage() {
  const caseStudies = getCaseStudies().map((cs) => ({
    slug: cs.slug,
    frontmatter: cs.frontmatter,
  }));

  return (
    <section className="py-24">
      <Container>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-stone-900 mb-4">
          Work
        </h1>
        <p className="text-lg text-stone-600 mb-12 max-w-2xl">
          A selection of projects spanning broadcast, digital, and content
          strategy.
        </p>
        <WorkGrid caseStudies={caseStudies} />
      </Container>
    </section>
  );
}
