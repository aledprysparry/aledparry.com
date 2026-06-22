import { useEffect, useRef } from 'react';
import { useCanvasRenderer } from '@engine/hooks/useCanvasRenderer';
import { ensureFonts } from '@engine/lib/carousel/fonts';
import { loadSlideImages } from '@engine/lib/carousel/slideImages';
import type { RatioKey } from '@engine/lib/canvas/CanvasRenderer';
import type { CarouselBrand, CarouselCopy, LeaderboardRow, SlideDef } from '@engine/lib/carousel/types';

interface Props {
  slide: SlideDef;
  index: number;
  rows: LeaderboardRow[];
  copy: CarouselCopy;
  slideCount: number;
  ratio?: RatioKey;
  brand?: CarouselBrand;
  /** Optional {slotKey -> data URL} for kinds that accept uploaded images. */
  imageUrls?: Record<string, string>;
}

export default function SlideCanvas({ slide, index, rows, copy, slideCount, ratio = 'portrait', brand, imageUrls }: Props) {
  const imagesRef = useRef<Record<string, HTMLImageElement>>({});
  const { canvasRef, redraw, setRatio } = useCanvasRenderer({
    ratio,
    onDraw: (r) => slide.draw(r, { rows, copy, slideCount, index, brand, images: imagesRef.current }),
  });

  useEffect(() => {
    setRatio(ratio);
  }, [ratio, setRatio]);

  // Decode uploaded images ONLY when the url map changes. Data-URL decode is
  // expensive; folding it into the redraw effect re-decoded the image on every
  // copy keystroke (a fresh image element per slide per render), which could
  // pile up enough to freeze the tab on an image-bearing graphic.
  useEffect(() => {
    let cancelled = false;
    loadSlideImages(imageUrls).then((imgs) => {
      if (cancelled) return;
      imagesRef.current = imgs;
      redraw();
    });
    return () => { cancelled = true; };
  }, [imageUrls, redraw]);

  // Redraw on content/layout change, reusing the already-decoded images.
  useEffect(() => {
    let cancelled = false;
    ensureFonts().then(() => { if (!cancelled) redraw(); });
    return () => { cancelled = true; };
  }, [slide, index, rows, copy, slideCount, ratio, brand, redraw]);

  return <canvas ref={canvasRef} className="block w-full h-auto" />;
}
