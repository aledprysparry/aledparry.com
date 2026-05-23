"use client";

import { useState, useEffect, useRef } from "react";
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

function looksLikePlaceholder(image?: string): boolean {
  if (!image) return true;
  return image.includes("/placeholder");
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
  const [imageFailed, setImageFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const showImage = !looksLikePlaceholder(image) && !imageFailed;

  // The image may have already 404'd by the time React hydrates, in which case
  // onError never fires. Catch that case post-mount by checking naturalWidth.
  useEffect(() => {
    if (!showImage) return;
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) {
      setImageFailed(true);
    }
  }, [image, showImage]);

  const content = (
    <>
      <div className="aspect-[16/10] overflow-hidden mb-4 rounded-sm relative bg-gradient-to-br from-stone-100 via-stone-200 to-stone-300">
        {showImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={image}
            alt={title}
            onError={() => setImageFailed(true)}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
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
