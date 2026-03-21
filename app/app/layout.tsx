import Link from "next/link";

export default function DemosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="text-sm font-sans text-stone-500 hover:text-stone-900 transition-colors"
        >
          &larr; aledparry.com
        </Link>
      </div>
      {children}
    </div>
  );
}
