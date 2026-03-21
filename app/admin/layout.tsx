import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="fixed top-4 left-4 z-50">
        <Link
          href="/"
          className="text-sm font-sans text-stone-500 hover:text-stone-900 transition-colors"
        >
          &larr; aledparry.com
        </Link>
      </div>
      <div className="pt-16 px-6 max-w-3xl mx-auto pb-24">{children}</div>
    </div>
  );
}
