import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ServicesContent } from "./content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Digital production, creative direction, bilingual content strategy, and format development services from Aled Parry.",
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
