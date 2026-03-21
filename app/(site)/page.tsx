import { getFeaturedCaseStudies } from "@/lib/mdx/get-case-studies";
import { HomeHero } from "@/components/sections/HomeHero";
import { CredibilityStrip } from "@/components/sections/CredibilityStrip";
import { FeaturedWork } from "@/components/sections/FeaturedWork";
import { TestimonialCarousel } from "@/components/sections/TestimonialCarousel";
import { FooterCta } from "@/components/sections/FooterCta";

export default function HomePage() {
  const featured = getFeaturedCaseStudies().map((cs) => ({
    slug: cs.slug,
    frontmatter: cs.frontmatter,
  }));

  return (
    <>
      <HomeHero />
      <CredibilityStrip />
      <FeaturedWork caseStudies={featured} />
      <TestimonialCarousel />
      <FooterCta />
    </>
  );
}
