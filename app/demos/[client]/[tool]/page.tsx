"use client";

import dynamic from "next/dynamic";
import { notFound } from "next/navigation";

const demoRegistry: Record<string, Record<string, React.ComponentType>> = {
  cpshomes: {
    socialeditor: dynamic(
      () => import("@/cpshomes/components/SocialEditor"),
      { ssr: false, loading: () => <DemoLoading /> }
    ),
  },
};

function DemoLoading() {
  return (
    <div className="h-screen flex items-center justify-center">
      <p className="text-sm text-stone-400 font-sans">Loading demo...</p>
    </div>
  );
}

interface Props {
  params: { client: string; tool: string };
}

export default function DemoPage({ params }: Props) {
  const DemoComponent = demoRegistry[params.client]?.[params.tool];

  if (!DemoComponent) {
    notFound();
  }

  return (
    <div className="h-screen pt-12">
      <DemoComponent />
    </div>
  );
}
