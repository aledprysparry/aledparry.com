"use client";

import { FadeIn } from "@/components/ui/FadeIn";

interface ServiceBlockProps {
  title: string;
  description: string;
  goodFor: string;
  index?: number;
}

export function ServiceBlock({ title, description, goodFor, index = 0 }: ServiceBlockProps) {
  return (
    <FadeIn delay={index * 100} variant="fade-left">
      <div className="group py-10 border-b border-stone-200 last:border-b-0 pl-4 relative transition-all duration-300 hover:pl-6 hover:bg-stone-50/80 cursor-default">
        {/* Accent bar */}
        <div className="absolute left-0 top-10 bottom-10 w-0.5 bg-stone-200 transition-all duration-500 group-hover:bg-accent group-hover:top-8 group-hover:bottom-8" />

        <h3 className="text-2xl font-serif font-bold text-stone-900 mb-4 transition-colors duration-300 group-hover:text-accent-dark">
          {title}
        </h3>
        <p className="text-base text-stone-600 leading-relaxed mb-4 max-w-2xl">
          {description}
        </p>
        <p className="text-sm text-stone-400 font-sans">
          <span className="font-medium text-stone-500">Good for:</span> {goodFor}
        </p>
      </div>
    </FadeIn>
  );
}
