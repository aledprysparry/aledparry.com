"use client";

import dynamic from "next/dynamic";

const KeepItLocal = dynamic(
  () => import("@/components/demos/KeepItLocal"),
  { ssr: false, loading: () => <p className="h-screen flex items-center justify-center text-sm text-stone-400">Loading...</p> }
);

export default function KeepItLocalPage() {
  return (
    <div className="h-screen pt-12">
      <KeepItLocal />
    </div>
  );
}
