import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { AboutContent } from "./content";
import { PersonJsonLd } from "@/components/seo/PersonJsonLd";

export const metadata: Metadata = {
  title: "About",
  description:
    "Aled Parry is a BAFTA-winning digital producer and creative director based in Wales. Bilingual in Welsh and English, specialising in broadcast, children's content and interactive formats.",
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
