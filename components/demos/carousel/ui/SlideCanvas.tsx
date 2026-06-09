import { useEffect } from 'react';
import { useCanvasRenderer } from '@carousel/hooks/useCanvasRenderer';
import { ensureFonts } from '@carousel/lib/fonts';
import type { CarouselCopy, LeaderboardRow, SlideDef } from '@carousel/lib/types';

interface Props {
  slide: SlideDef;
  index: number;
  rows: LeaderboardRow[];
  copy: CarouselCopy;
  slideCount: number;
}

export default function SlideCanvas({ slide, index, rows, copy, slideCount }: Props) {
  const { canvasRef, redraw } = useCanvasRenderer({
    ratio: 'portrait',
    onDraw: (r) => slide.draw(r, { rows, copy, slideCount, index }),
  });

  // Redraw once fonts are loaded and whenever the data/copy changes.
  useEffect(() => {
    let cancelled = false;
    ensureFonts().then(() => { if (!cancelled) redraw(); });
    return () => { cancelled = true; };
  }, [slide, index, rows, copy, slideCount, redraw]);

  return <canvas ref={canvasRef} className="block w-full h-auto" />;
}
