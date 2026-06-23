"use client";

import dynamic from "next/dynamic";

// Self-contained bilingual landing, loaded client-side (it uses localStorage
// for the language toggle), matching the repo's other custom demo routes.
const Buan = dynamic(() => import("@/components/demos/Buan"), {
  ssr: false,
  loading: () => (
    <p className="flex h-screen items-center justify-center text-sm text-stone-400">
      Loading…
    </p>
  ),
});

export default function BuanLoader() {
  return <Buan />;
}
