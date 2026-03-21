"use client";

import { ReactNode } from "react";
import clsx from "clsx";
import { useInView } from "@/lib/hooks/use-in-view";

type Variant = "fade-up" | "fade-left" | "fade-right" | "scale" | "blur";

const variantMap: Record<Variant, { hidden: string; visible: string }> = {
  "fade-up": {
    hidden: "opacity-0 translate-y-6",
    visible: "opacity-100 translate-y-0",
  },
  "fade-left": {
    hidden: "opacity-0 -translate-x-6",
    visible: "opacity-100 translate-x-0",
  },
  "fade-right": {
    hidden: "opacity-0 translate-x-6",
    visible: "opacity-100 translate-x-0",
  },
  scale: {
    hidden: "opacity-0 scale-95",
    visible: "opacity-100 scale-100",
  },
  blur: {
    hidden: "opacity-0 blur-sm",
    visible: "opacity-100 blur-0",
  },
};

export function FadeIn({
  children,
  className,
  variant = "fade-up",
  delay = 0,
  duration = 700,
}: {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  delay?: number;
  duration?: number;
}) {
  const { ref, isVisible } = useInView();
  const v = variantMap[variant];

  return (
    <div
      ref={ref}
      className={clsx(isVisible ? v.visible : v.hidden, className)}
      style={{
        transitionProperty: "opacity, transform, filter",
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {children}
    </div>
  );
}
