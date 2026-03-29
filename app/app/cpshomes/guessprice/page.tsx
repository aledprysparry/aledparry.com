"use client";

import dynamic from "next/dynamic";

const GuessThePrice = dynamic(
  () => import("@/components/demos/GuessThePrice"),
  { ssr: false }
);

export default function GuessThePricePage() {
  return (
    <div className="h-screen">
      <GuessThePrice />
    </div>
  );
}
