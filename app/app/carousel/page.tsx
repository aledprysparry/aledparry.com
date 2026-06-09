"use client";

import dynamic from "next/dynamic";
import AppGate from "@/components/app/AppGate";

const CarouselApp = dynamic(() => import("@carousel/CarouselApp"), {
  ssr: false,
  loading: () => (
    <p className="h-screen flex items-center justify-center text-sm text-stone-400">Loading...</p>
  ),
});

export default function CarouselPage() {
  return (
    <AppGate>
      <div className="min-h-screen">
        <CarouselApp />
      </div>
    </AppGate>
  );
}
