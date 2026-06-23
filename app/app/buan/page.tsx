"use client";

import dynamic from "next/dynamic";

// Marketing landing for Buan (Phase 1). Self-contained bilingual component,
// loaded client-side like the other custom demo routes in /app.
const Buan = dynamic(() => import("@/components/demos/Buan"), {
  ssr: false,
  loading: () => (
    <p className="flex h-screen items-center justify-center text-sm text-stone-400">
      Loading…
    </p>
  ),
});

export default function BuanPage() {
  return <Buan />;
}
