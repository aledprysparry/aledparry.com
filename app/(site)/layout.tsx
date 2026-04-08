"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";

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
    </>
  );
}
