"use client";

import dynamic from "next/dynamic";

const PMA = dynamic(
  () => import("@/components/demos/PMA"),
  { ssr: false, loading: () => <p className="h-screen flex items-center justify-center text-sm text-stone-400">Loading...</p> }
);

export default function PMAPage() {
  return (
    <div className="h-screen pt-12">
      <PMA />
    </div>
  );
}
