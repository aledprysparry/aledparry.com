import { FadeIn } from "@/components/ui/FadeIn";

interface ServiceBlockProps {
  title: string;
  description: string;
  goodFor: string;
}

export function ServiceBlock({ title, description, goodFor }: ServiceBlockProps) {
  return (
    <FadeIn>
      <div className="py-10 border-b border-stone-200 last:border-b-0">
        <h3 className="text-2xl font-serif font-bold text-stone-900 mb-4">
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
