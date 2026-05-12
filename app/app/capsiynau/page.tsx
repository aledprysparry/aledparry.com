"use client";

import dynamic from "next/dynamic";

const CapsiynauMemory = dynamic(
  () => import("@/components/demos/CapsiynauMemory"),
  {
    ssr: false,
    loading: () => (
      <p className="h-screen flex items-center justify-center text-sm text-stone-400">
        Loading…
      </p>
    ),
  },
);

export default function CapsiynauPage() {
  return (
    <div className="h-screen pt-12">
      <CapsiynauMemory />
    </div>
  );
}
