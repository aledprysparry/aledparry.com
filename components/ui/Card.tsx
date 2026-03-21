import Link from "next/link";
import clsx from "clsx";
import { Badge } from "./Badge";

interface CardProps {
  title: string;
  subtitle?: string;
  meta?: string;
  tag?: string;
  href?: string;
  image?: string;
  className?: string;
}

export function Card({
  title,
  subtitle,
  meta,
  tag,
  href,
  image,
  className,
}: CardProps) {
  const content = (
    <>
      {image && (
        <div className="aspect-[16/10] bg-stone-200 overflow-hidden mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      {!image && (
        <div className="aspect-[16/10] bg-stone-200 mb-4 flex items-center justify-center">
          <span className="text-stone-400 text-sm font-sans">Image</span>
        </div>
      )}
      <div className="space-y-2">
        {tag && <Badge>{tag}</Badge>}
        <h3 className="text-lg font-serif font-semibold text-stone-900 group-hover:text-accent-dark transition-colors">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-stone-600">{subtitle}</p>
        )}
        {meta && (
          <p className="text-xs text-stone-400 font-sans">{meta}</p>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={clsx("group block", className)}
      >
        {content}
      </Link>
    );
  }

  return <div className={clsx("group", className)}>{content}</div>;
}
