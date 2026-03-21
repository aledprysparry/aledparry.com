"use client";

import clsx from "clsx";

export function SectionHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={clsx(
        "text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-4",
        className
      )}
    >
      {children}
    </h2>
  );
}
