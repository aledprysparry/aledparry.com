// ═══ FramedRenderer: ratio-robust layout for canvas templates ═══
// The carousel is composed for a 4:5 "design frame". This wraps a
// CanvasRenderer so that composition is drawn into a CENTRED 4:5 frame on
// ANY canvas ratio - the background fills full-bleed, but the content stays
// un-stretched and collision-free in a safe zone. On Feed (4:5) the frame
// equals the canvas, so nothing changes; on Story (9:16), Landscape (16:9),
// Square (1:1) etc. the same composition is centred with background around
// it. Slides keep their existing 4:5 fractions and just draw via `fr.*`.

import type { CanvasRenderer, TextOptions, RectOptions, ImageOptions } from '@engine/lib/canvas/CanvasRenderer';

const DESIGN_ASPECT = 1080 / 1350; // 0.8 (width / height)

export class FramedRenderer {
  readonly base: CanvasRenderer;
  readonly fw: number; // frame width in px
  readonly fh: number; // frame height in px
  readonly ox: number; // frame x-origin in px
  readonly oy: number; // frame y-origin in px

  constructor(base: CanvasRenderer, designAspect = DESIGN_ASPECT) {
    this.base = base;
    const { W, H } = base;
    if (W / H > designAspect) { this.fh = H; this.fw = H * designAspect; } // canvas wider → fit height
    else { this.fw = W; this.fh = W / designAspect; }                      // taller → fit width
    this.ox = (W - this.fw) / 2;
    this.oy = (H - this.fh) / 2;
  }

  /** Raw 2D context (shared with the base canvas). */
  get ctx(): CanvasRenderingContext2D { return this.base.context; }
  /** Frame width/height in px (use like a 1080×1350 canvas). */
  get W(): number { return this.fw; }
  get H(): number { return this.fh; }

  // frame-fraction → absolute canvas px (for raw ctx drawing)
  fx(f: number): number { return this.ox + f * this.fw; }
  fy(f: number): number { return this.oy + f * this.fh; }
  fs(f: number): number { return f * this.fw; } // size: fraction-of-frame-width → px

  // frame-fraction → base-canvas fraction (the base renderer's coordinate space)
  private cx(f: number): number { return this.fx(f) / this.base.W; }
  private cy(f: number): number { return this.fy(f) / this.base.H; }
  private cw(f: number): number { return (f * this.fw) / this.base.W; }
  private chh(f: number): number { return (f * this.fh) / this.base.H; }
  private csw(f: number): number { return (f * this.fw) / this.base.W; } // size/letterSpacing (frac-of-W)

  drawText(text: string, o: TextOptions): void {
    this.base.drawText(text, {
      ...o,
      x: this.cx(o.x), y: this.cy(o.y), size: this.csw(o.size),
      maxWidth: o.maxWidth != null ? this.cw(o.maxWidth) : undefined,
      letterSpacing: o.letterSpacing != null ? this.csw(o.letterSpacing) : undefined,
    });
  }

  drawTextWrapped(text: string, o: TextOptions & { lineHeight?: number }): number {
    return this.base.drawTextWrapped(text, {
      ...o,
      x: this.cx(o.x), y: this.cy(o.y), size: this.csw(o.size),
      maxWidth: o.maxWidth != null ? this.cw(o.maxWidth) : undefined,
      lineHeight: o.lineHeight != null ? this.csw(o.lineHeight) : undefined,
      letterSpacing: o.letterSpacing != null ? this.csw(o.letterSpacing) : undefined,
    });
  }

  drawRect(o: RectOptions): void {
    this.base.drawRect({
      ...o,
      x: this.cx(o.x), y: this.cy(o.y),
      width: this.cw(o.width), height: this.chh(o.height),
      radius: o.radius != null ? this.csw(o.radius) : undefined,
    });
  }

  drawImage(img: HTMLImageElement, o: ImageOptions): void {
    this.base.drawImage(img, {
      ...o,
      x: this.cx(o.x), y: this.cy(o.y),
      width: this.cw(o.width), height: this.chh(o.height),
      radius: o.radius != null ? this.csw(o.radius) : undefined,
    });
  }
}
