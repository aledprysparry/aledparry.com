"use client";

import dynamic from "next/dynamic";
import AppGate from "@/components/app/AppGate";

// Optional catch-all: matches /app/carousel and every nested route
// (/app/carousel/brands/:id, /graphics/:id …) so react-router can drive
// the whole engine client-side under the basename.
const EngineApp = dynamic(() => import("@engine/EngineApp"), {
  ssr: false,
  loading: () => (
    <p className="flex h-screen items-center justify-center text-sm text-stone-400">Loading…</p>
  ),
});

export default function CarouselEnginePage() {
  return (
    <AppGate>
      <EngineApp />
    </AppGate>
  );
}
