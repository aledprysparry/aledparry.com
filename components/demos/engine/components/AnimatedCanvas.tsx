import { useEffect, useRef } from 'react';
import { CanvasRenderer, type RatioKey } from '@engine/lib/canvas/CanvasRenderer';
import { ensureFonts } from '@engine/lib/carousel/fonts';
import { drawAnimatedFrame, ANIMATED_DURATION_MS } from '@engine/lib/carousel/animated';
import type { CarouselBrand } from '@engine/lib/carousel/types';

interface Props {
  copy: Record<string, string | undefined>;
  ratio?: RatioKey;
  durationMs?: number;
  brand?: CarouselBrand;
  // Grid thumbnails set this: draw ONE settled frame and stop. Without it
  // every animated card mounts a perpetual 60fps rAF loop — a grid of them
  // pegs the CPU and kills the tab. Only the editor wants the live loop.
  poster?: boolean;
}

// Progress at which the caption is fully revealed and settled — a good still.
const POSTER_PROGRESS = 0.6;

// Live looping preview of the animated caption, drawn on the shared
// CanvasRenderer (Cwis paint, or brand paint when `brand` is set).
export default function AnimatedCanvas({ copy, ratio = 'story', durationMs = ANIMATED_DURATION_MS, brand, poster = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const copyRef = useRef(copy);
  copyRef.current = copy;
  const brandRef = useRef(brand);
  brandRef.current = brand;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = new CanvasRenderer(canvas, ratio);
    let raf = 0;
    let start = 0;
    let alive = true;

    // Poster mode: one settled frame, no loop. Keeps the thumbnail grid cheap.
    if (poster) {
      ensureFonts().then(() => { if (alive) drawAnimatedFrame(r, copyRef.current, POSTER_PROGRESS, brandRef.current); });
      return () => { alive = false; };
    }

    const loop = (t: number) => {
      if (!alive) return;
      if (!start) start = t;
      drawAnimatedFrame(r, copyRef.current, ((t - start) % durationMs) / durationMs, brandRef.current);
      raf = requestAnimationFrame(loop);
    };
    ensureFonts().then(() => { if (alive) raf = requestAnimationFrame(loop); });

    return () => { alive = false; cancelAnimationFrame(raf); };
  }, [ratio, durationMs, poster]);

  return <canvas ref={canvasRef} className="block w-full h-auto rounded-xl border border-white/10" />;
}
