"use client";

import { ReactNode } from "react";
import clsx from "clsx";
import { useInView } from "@/lib/hooks/use-in-view";

export function FadeIn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { ref, isVisible } = useInView();

  return (
    <div
      ref={ref}
      className={clsx(
        "transition-all duration-700 ease-out",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-3",
        className
      )}
    >
      {children}
    </div>
  );
}
