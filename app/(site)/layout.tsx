"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <>
      {!isHome && <Header />}
      <main className={isHome ? "min-h-screen" : "min-h-screen pt-20"}>
        {children}
      </main>
      {!isHome && <Footer />}
    </>
  );
}
