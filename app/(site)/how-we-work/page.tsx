import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { HowWeWorkContent } from "./content";

export const metadata: Metadata = {
  title: "How We Work",
  description:
    "How I work with organisations: listen, understand the problem, prototype quickly, test, and scale what works – before deciding what technology, if any, is actually needed.",
  alternates: { canonical: "https://aledparry.com/how-we-work" },
};

export default function HowWeWorkPage() {
  return (
    <section className="py-24">
      <Container>
        <HowWeWorkContent />
      </Container>
    </section>
  );
}
