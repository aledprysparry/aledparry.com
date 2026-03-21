import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { AboutContent } from "./content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Aled Parry is a digital producer and creative director based in Wales, specialising in bilingual broadcast and content strategy.",
};

export default function AboutPage() {
  return (
    <section className="py-24">
      <Container>
        <AboutContent />
      </Container>
    </section>
  );
}
