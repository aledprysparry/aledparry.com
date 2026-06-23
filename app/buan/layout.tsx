import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buan",
  description: "The digital sales layer for physical businesses.",
};

// Buan shell. Phase 0 skeleton - lives under /buan within aledparry.com for
// now; the P2 extraction gate decides whether this moves to its own repo +
// buan.co (see BUAN_P0_NOTES.md).
export default function BuanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-stone-50 text-stone-900">{children}</div>;
}
