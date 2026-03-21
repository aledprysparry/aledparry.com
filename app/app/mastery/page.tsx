"use client";

import dynamic from "next/dynamic";

const MasteryCompanion = dynamic(
  () => import("@/components/demos/MasteryCompanion"),
  { ssr: false, loading: () => <p className="h-screen flex items-center justify-center text-sm text-stone-400">Loading...</p> }
);

export default function MasteryPage() {
  return (
    <div className="h-screen pt-12">
      <MasteryCompanion />
    </div>
  );
}
