"use client";

import dynamic from "next/dynamic";

const GuessThePrice = dynamic(
  () => import("@/cpshomes/components/GuessThePrice"),
  { ssr: false }
);

export default function GuessThePricePage() {
  return (
    <div className="h-screen">
      <GuessThePrice />
    </div>
  );
}
