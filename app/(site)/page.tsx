import { Metadata } from "next";
import { HomeContent } from "./home-content";
import { PersonJsonLd } from "@/components/seo/PersonJsonLd";

export const metadata: Metadata = {
  description:
    "I help business owners, public sector teams and organisations solve difficult problems – sometimes with AI, sometimes automation, sometimes neither. Twenty years turning ideas into working products.",
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
