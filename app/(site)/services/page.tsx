import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ServicesContent } from "./content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Digital production, creative direction, bilingual Welsh/English content strategy and interactive format development. Available for commission across the UK.",
  alternates: { canonical: "https://aledparry.com/services" },
};

export default function ServicesPage() {
  return (
    <section className="py-24">
      <Container>
        <ServicesContent />
      </Container>
    </section>
  );
}
