import { useRef, useCallback, useState, useEffect } from 'react';
import { CanvasRenderer, RATIOS, type RatioKey } from '@engine/lib/canvas/CanvasRenderer';

interface UseCanvasRendererOptions {
  /** Initial ratio - defaults to 'square' */
  ratio?: RatioKey;
  /** Called whenever the ratio changes or canvas is ready */
  onDraw?: (renderer: CanvasRenderer) => void;
}

/**
 * React hook wrapper around CanvasRenderer.
 *
 * Usage:
 *   const { canvasRef, renderer, ratio, setRatio } = useCanvasRenderer({
 *     ratio: 'square',
 *     onDraw: (r) => { r.drawBackground('#002C6A'); r.drawText(...); }
 *   });
 *
 *   return <canvas ref={canvasRef} />;
 */
export function useCanvasRenderer(options: UseCanvasRendererOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const [ratio, setRatioState] = useState<RatioKey>(options.ratio ?? 'square');
  const onDrawRef = useRef(options.onDraw);

  // Keep onDraw ref current
  useEffect(() => {
    onDrawRef.current = options.onDraw;
  }, [options.onDraw]);

  // Initialise renderer when canvas mounts
  useEffect(() => {
    if (!canvasRef.current) return;
    const renderer = new CanvasRenderer(canvasRef.current, ratio);
    rendererRef.current = renderer;
    onDrawRef.current?.(renderer);
  }, [ratio]);

  const setRatio = useCallback((newRatio: RatioKey) => {
    setRatioState(newRatio);
    if (rendererRef.current) {
      rendererRef.current.setRatio(newRatio);
      onDrawRef.current?.(rendererRef.current);
    }
  }, []);

  const redraw = useCallback(() => {
    if (rendererRef.current) {
      onDrawRef.current?.(rendererRef.current);
    }
  }, []);

  const exportPNG = useCallback((filename?: string) => {
    rendererRef.current?.exportPNG(filename);
  }, []);

  const exportBlob = useCallback(async () => {
    if (!rendererRef.current) throw new Error('Renderer not initialised');
    return rendererRef.current.exportBlob();
  }, []);

  return {
    canvasRef,
    renderer: rendererRef.current,
    ratio,
    setRatio,
    redraw,
    exportPNG,
    exportBlob,
    RATIOS,
  };
}
