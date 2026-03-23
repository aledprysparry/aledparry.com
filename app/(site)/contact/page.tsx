import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ContactContent } from "./content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Aled Parry to discuss your next broadcast, digital or bilingual content project.",
  alternates: { canonical: "https://aledparry.com/contact" },
};

export default function ContactPage() {
  return (
    <section className="py-24">
      <Container>
        <ContactContent />
      </Container>
    </section>
  );
}
