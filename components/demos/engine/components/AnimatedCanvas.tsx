import { useEffect, useRef } from 'react';
import { CanvasRenderer, type RatioKey } from '@engine/lib/canvas/CanvasRenderer';
import { ensureFonts } from '@engine/lib/carousel/fonts';
import { drawAnimatedFrame, ANIMATED_DURATION_MS } from '@engine/lib/carousel/animated';

interface Props {
  copy: Record<string, string | undefined>;
  ratio?: RatioKey;
  durationMs?: number;
}

// Live looping preview of the animated caption, drawn on the shared
// CanvasRenderer (same brand paint as the stills).
export default function AnimatedCanvas({ copy, ratio = 'story', durationMs = ANIMATED_DURATION_MS }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const copyRef = useRef(copy);
  copyRef.current = copy;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = new CanvasRenderer(canvas, ratio);
    let raf = 0;
    let start = 0;
    let alive = true;

    const loop = (t: number) => {
      if (!alive) return;
      if (!start) start = t;
      drawAnimatedFrame(r, copyRef.current, ((t - start) % durationMs) / durationMs);
      raf = requestAnimationFrame(loop);
    };
    ensureFonts().then(() => { if (alive) raf = requestAnimationFrame(loop); });

    return () => { alive = false; cancelAnimationFrame(raf); };
  }, [ratio, durationMs]);

  return <canvas ref={canvasRef} className="block w-full h-auto rounded-xl border border-white/10" />;
}
