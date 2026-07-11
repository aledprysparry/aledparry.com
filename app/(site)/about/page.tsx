import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { AboutContent } from "./content";
import { PersonJsonLd } from "@/components/seo/PersonJsonLd";

export const metadata: Metadata = {
  title: "About",
  description:
    "Aled Parry is a creative technologist, founder and consultant who helps organisations solve difficult problems with technology, design and process – not just AI. BAFTA winner, bilingual in Welsh and English.",
  alternates: { canonical: "https://aledparry.com/about" },
};

export default function AboutPage() {
  return (
    <>
      <PersonJsonLd />
      <section className="py-24">
        <Container>
          <AboutContent />
        </Container>
      </section>
    </>
  );
}
