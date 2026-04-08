"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideNav = pathname === "/" || pathname === "/about";

  return (
    <>
      {!hideNav && <Header />}
      <main className={hideNav ? "min-h-screen" : "min-h-screen pt-20"}>
        {children}
      </main>
    </>
  );
}
