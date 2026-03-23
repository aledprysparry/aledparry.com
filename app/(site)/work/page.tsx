import { Metadata } from "next";
import { getCaseStudies } from "@/lib/mdx/get-case-studies";
import { Container } from "@/components/ui/Container";
import { WorkContent } from "./content";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Portfolio of broadcast, digital and interactive projects by Aled Parry — including BAFTA-winning formats, children's content and bilingual Welsh/English productions.",
  alternates: { canonical: "https://aledparry.com/work" },
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
