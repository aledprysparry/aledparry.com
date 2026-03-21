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
const componentMap: Record<string, React.ComponentType> = {
  SocialEditor: dynamic(
    () => import("@/components/demos/SocialEditor"),
    { ssr: false, loading: () => <DemoLoading /> }
  ),
  MasteryCompanion: dynamic(
    () => import("@/components/demos/MasteryCompanion"),
    { ssr: false, loading: () => <DemoLoading /> }
  ),
  PMA: dynamic(
    () => import("@/components/demos/PMA"),
    { ssr: false, loading: () => <DemoLoading /> }
  ),
  KeepItLocal: dynamic(
    () => import("@/components/demos/KeepItLocal"),
    { ssr: false, loading: () => <DemoLoading /> }
  ),
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
