"use client";

import { useLanguage } from "@/lib/i18n/context";
import { useInView } from "@/lib/hooks/use-in-view";
import clsx from "clsx";

interface Stat {
  label: string;
  labelCy?: string;
  value: string;
}

export function StatRow({ stats }: { stats: Stat[] }) {
  const { locale } = useLanguage();
  const { ref, isVisible } = useInView();

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 py-12 my-12 border-y border-stone-200"
    >
      {stats.map((stat, i) => (
        <div
          key={i}
          className={clsx(
            "text-center",
            isVisible && "animate-stat-pop"
          )}
          style={{ animationDelay: isVisible ? `${i * 150}ms` : "0ms" }}
        >
          <p className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-2">
            {stat.value}
          </p>
          <p className="text-sm text-stone-500 font-sans">
            {locale === "cy" && stat.labelCy ? stat.labelCy : stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
