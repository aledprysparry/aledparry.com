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
      <div className="aspect-[16/10] bg-stone-200 overflow-hidden mb-4 rounded-sm">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-stone-400 text-sm font-sans">Image</span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        {tag && <Badge>{tag}</Badge>}
        <h3 className="text-lg font-serif font-semibold text-stone-900 group-hover:text-accent-dark transition-colors duration-300">
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
        className={clsx(
          "group block transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:shadow-stone-200/50 p-2 -m-2 rounded-md",
          className
        )}
      >
        {content}
      </Link>
    );
  }

  return <div className={clsx("group", className)}>{content}</div>;
}
