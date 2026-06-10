import { useEffect } from 'react';
import { useCanvasRenderer } from '@engine/hooks/useCanvasRenderer';
import { ensureFonts } from '@engine/lib/carousel/fonts';
import type { RatioKey } from '@engine/lib/canvas/CanvasRenderer';
import type { CarouselCopy, LeaderboardRow, SlideDef } from '@engine/lib/carousel/types';

interface Props {
  slide: SlideDef;
  index: number;
  rows: LeaderboardRow[];
  copy: CarouselCopy;
  slideCount: number;
  ratio?: RatioKey;
}

export default function SlideCanvas({ slide, index, rows, copy, slideCount, ratio = 'portrait' }: Props) {
  const { canvasRef, redraw, setRatio } = useCanvasRenderer({
    ratio,
    onDraw: (r) => slide.draw(r, { rows, copy, slideCount, index }),
  });

  useEffect(() => {
    setRatio(ratio);
  }, [ratio, setRatio]);

  // Redraw once fonts are loaded and whenever the data/copy/ratio changes.
  useEffect(() => {
    let cancelled = false;
    ensureFonts().then(() => { if (!cancelled) redraw(); });
    return () => { cancelled = true; };
  }, [slide, index, rows, copy, slideCount, ratio, redraw]);

  return <canvas ref={canvasRef} className="block w-full h-auto" />;
}
