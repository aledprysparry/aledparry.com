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

  // Redraw once fonts + any uploaded images are ready, and whenever the
  // data/copy/ratio/brand/images change.
  useEffect(() => {
    let cancelled = false;
    Promise.all([ensureFonts(), loadSlideImages(imageUrls)]).then(([, imgs]) => {
      if (cancelled) return;
      imagesRef.current = imgs;
      redraw();
    });
    return () => { cancelled = true; };
  }, [slide, index, rows, copy, slideCount, ratio, brand, imageUrls, redraw]);

  return <canvas ref={canvasRef} className="block w-full h-auto" />;
}
