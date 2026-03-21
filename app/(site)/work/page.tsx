import { Metadata } from "next";
import { getCaseStudies } from "@/lib/mdx/get-case-studies";
import { Container } from "@/components/ui/Container";
import { WorkContent } from "./content";

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
        <WorkContent caseStudies={caseStudies} />
      </Container>
    </section>
  );
}
