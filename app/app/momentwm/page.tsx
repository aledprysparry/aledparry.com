"use client";

import dynamic from "next/dynamic";

const Momentwm = dynamic(() => import("@/components/demos/Momentwm"), {
  ssr: false,
  loading: () => (
    <p className="h-screen flex items-center justify-center text-sm text-stone-400">Loading...</p>
  ),
});

export default function MomentwmPage() {
  return (
    <div className="h-screen">
      <Momentwm />
    </div>
  );
}
