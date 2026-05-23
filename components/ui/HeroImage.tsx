"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

interface HeroImageProps {
  src?: string;
  alt: string;
  className?: string;
}

function looksLikePlaceholder(src?: string): boolean {
  if (!src) return true;
  return src.includes("/placeholder");
}

/**
 * Hero image with a gradient fallback. Used on case-study detail pages where
 * the heroImage path may point at a placeholder or a file that doesn't exist
 * yet. Falls back to a stone gradient block instead of showing a broken-image
 * icon. Mirrors the pattern in [Card.tsx](Card.tsx).
 */
export function HeroImage({ src, alt, className }: HeroImageProps) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const showImage = !looksLikePlaceholder(src) && !failed;

  useEffect(() => {
    if (!showImage) return;
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) {
      setFailed(true);
    }
  }, [src, showImage]);

  return (
    <div
      className={clsx(
        "overflow-hidden relative bg-gradient-to-br from-stone-100 via-stone-200 to-stone-300",
        className
      )}
    >
      {showImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
    </div>
  );
}
