"use client";

import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getDemo } from "@/content/demos.config";

function DemoLoading() {
  return (
    <div className="h-screen flex items-center justify-center">
      <p className="text-sm text-stone-400 font-sans">Loading demo...</p>
    </div>
  );
}

// Dynamic import registry — maps componentPath to lazy-loaded component.
// Each entry must be a static import() call for Next.js to bundle correctly.
// @ts-ignore
const SocialEditor = dynamic(() => import("@/components/demos/SocialEditor"), { ssr: false, loading: () => <DemoLoading /> });
// @ts-ignore
const MasteryCompanion = dynamic(() => import("@/components/demos/MasteryCompanion"), { ssr: false, loading: () => <DemoLoading /> });
// @ts-ignore
const PMADemo = dynamic(() => import("@/components/demos/PMA"), { ssr: false, loading: () => <DemoLoading /> });
// @ts-ignore
const KeepItLocal = dynamic(() => import("@/components/demos/KeepItLocal"), { ssr: false, loading: () => <DemoLoading /> });

const componentMap: Record<string, React.ComponentType> = {
  SocialEditor,
  MasteryCompanion,
  PMA: PMADemo,
  KeepItLocal,
};

interface Props {
  params: { client: string; tool: string };
}

export default function DemoPage({ params }: Props) {
  const demo = getDemo(params.client, params.tool);
  if (!demo) notFound();

  const DemoComponent = componentMap[demo.componentPath];
  if (!DemoComponent) notFound();

  return (
    <div className="h-screen pt-12">
      <DemoComponent />
    </div>
  );
}
