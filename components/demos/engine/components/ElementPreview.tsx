import { useEffect, useRef } from 'react';
import { CanvasRenderer } from '@engine/lib/canvas/CanvasRenderer';
import { drawElements } from '@engine/lib/freeform/renderElements';
import type { GraphicElement } from '@engine/lib/model/types';

// Renders a set of elements to a portrait canvas (reuses the export
// rasteriser) - used for Style Generator layout thumbnails.
export default function ElementPreview({ elements }: { elements: GraphicElement[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const r = new CanvasRenderer(ref.current, 'portrait');
    drawElements(r, elements).catch(() => {});
  }, [elements]);
  return <canvas ref={ref} className="block w-full h-auto" />;
}
