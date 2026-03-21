"use client";

import { useLanguage } from "@/lib/i18n/context";
import { FadeIn } from "@/components/ui/FadeIn";

interface Stat {
  label: string;
  labelCy?: string;
  value: string;
}

export function StatRow({ stats }: { stats: Stat[] }) {
  const { locale } = useLanguage();

  return (
    <FadeIn>
      <div className="grid grid-cols-3 gap-8 py-12 my-12 border-y border-stone-200">
        {stats.map((stat, i) => (
          <div key={i} className="text-center">
            <p className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-2">
              {stat.value}
            </p>
            <p className="text-sm text-stone-500 font-sans">
              {locale === "cy" && stat.labelCy ? stat.labelCy : stat.label}
            </p>
          </div>
        ))}
      </div>
    </FadeIn>
  );
}
