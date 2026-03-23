import { Metadata } from "next";
import { HomeContent } from "./home-content";
import { PersonJsonLd } from "@/components/seo/PersonJsonLd";

export const metadata: Metadata = {
  description:
    "Award-winning Welsh/English digital producer and creative director. I lead broadcast, interactive and bilingual content projects for commissioners, agencies and brands across the UK.",
  alternates: {
    canonical: "https://aledparry.com",
  },
};

export default function HoldingPage() {
  return (
    <>
      <PersonJsonLd />
      <HomeContent />
    </>
  );
}
