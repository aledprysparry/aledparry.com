import { Metadata } from "next";
import { HomeContent } from "./home-content";
import { PersonJsonLd } from "@/components/seo/PersonJsonLd";

export const metadata: Metadata = {
  description:
    "I'm a creative technologist who helps people and organisations figure out what's actually broken – sometimes the fix is AI, sometimes it isn't. Twenty years turning ideas into things that work.",
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
