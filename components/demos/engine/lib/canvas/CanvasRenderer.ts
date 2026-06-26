/**
 * CanvasRenderer - shared canvas engine for Cwis Creator Hub
 *
 * All coordinates and sizes are expressed as fractions of canvas
 * width/height (0–1) so they scale correctly across ratios.
 */

import { DEFAULT_FONT } from './brandTokens';

// ---------------------------------------------------------------------------
// Ratio presets
// ---------------------------------------------------------------------------

export const RATIOS = {
  square:    { width: 1080, height: 1080, label: 'Square (1:1)' },
  portrait:  { width: 1080, height: 1350, label: 'Portrait (4:5)' },
  story:     { width: 1080, height: 1920, label: 'Story (9:16)' },
  landscape: { width: 1920, height: 1080, label: 'Landscape (16:9)' },
  whatsapp:  { width: 800,  height: 800,  label: 'WhatsApp (1:1)' },
} as const;

export type RatioKey = keyof typeof RATIOS;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TextOptions {
  /** X position as fraction 0–1 of canvas width */
  x: number;
  /** Y position as fraction 0–1 of canvas height */
  y: number;
  /** Font size as fraction of canvas width (e.g. 0.05 = 5% of width) */
  size: number;
  color?: string;
  weight?: string;
  /** Italicise the text (canvas font-style prefix). */
  italic?: boolean;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  font?: string;
  maxWidth?: number; // fraction of width - text wraps/scales to fit
  /** Tracking as a fraction of width (negative = tighter). Reset per call. */
  letterSpacing?: number;
}

export interface ImageOptions {
  /** X position as fraction 0–1 */
  x: number;
  /** Y position as fraction 0–1 */
  y: number;
  /** Width as fraction 0–1 */
  width: number;
  /** Height as fraction 0–1 */
  height: number;
  /** How to fit the image: 'cover' crops to fill, 'contain' letterboxes */
  fit?: 'cover' | 'contain';
  /** Optional corner radius as fraction of width */
  radius?: number;
}

export interface RectOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  radius?: number; // fraction of width
}

// ---------------------------------------------------------------------------
// CanvasRenderer class
// ---------------------------------------------------------------------------

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private _ratio: RatioKey;

  constructor(canvas: HTMLCanvasElement, ratio: RatioKey = 'square') {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2d context');
    this.ctx = ctx;
    this._ratio = ratio;
    this.applyRatio();
  }

  /** Current pixel width */
  get W(): number { return this.canvas.width; }
  /** Current pixel height */
  get H(): number { return this.canvas.height; }
  /** Current ratio key */
  get ratio(): RatioKey { return this._ratio; }
  /** Direct context access for advanced drawing */
  get context(): CanvasRenderingContext2D { return this.ctx; }

  // -----------------------------------------------------------------------
  // Ratio
  // -----------------------------------------------------------------------

  setRatio(ratio: RatioKey): void {
    this._ratio = ratio;
    this.applyRatio();
  }

  private applyRatio(): void {
    const { width, height } = RATIOS[this._ratio];
    this.canvas.width = width;
    this.canvas.height = height;
  }

  // -----------------------------------------------------------------------
  // Primitives
  // -----------------------------------------------------------------------

  clear(): void {
    this.ctx.clearRect(0, 0, this.W, this.H);
  }

  drawBackground(color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.W, this.H);
  }

  drawRect(opts: RectOptions): void {
    const x = opts.x * this.W;
    const y = opts.y * this.H;
    const w = opts.width * this.W;
    const h = opts.height * this.H;
    const r = (opts.radius ?? 0) * this.W;

    this.ctx.fillStyle = opts.color;

    if (r > 0) {
      this.ctx.beginPath();
      this.ctx.roundRect(x, y, w, h, r);
      this.ctx.fill();
    } else {
      this.ctx.fillRect(x, y, w, h);
    }
  }

  drawText(text: string, opts: TextOptions): void {
    const x = opts.x * this.W;
    const y = opts.y * this.H;
    const fontSize = opts.size * this.W;
    const font = opts.font ?? DEFAULT_FONT;
    const weight = opts.weight ?? '400';
    const style = opts.italic ? 'italic ' : '';
    const maxPx = opts.maxWidth ? opts.maxWidth * this.W : undefined;

    this.ctx.fillStyle = opts.color ?? '#000000';
    this.ctx.textAlign = opts.align ?? 'left';
    this.ctx.textBaseline = opts.baseline ?? 'top';
    this.ctx.font = `${style}${weight} ${fontSize}px ${font}`;
    this.ctx.letterSpacing = opts.letterSpacing ? `${opts.letterSpacing * this.W}px` : '0px';

    if (maxPx) {
      // Auto-shrink to fit
      let currentSize = fontSize;
      while (this.ctx.measureText(text).width > maxPx && currentSize > 8) {
        currentSize -= 1;
        this.ctx.font = `${style}${weight} ${currentSize}px ${font}`;
      }
    }

    this.ctx.fillText(text, x, y, maxPx);
    this.ctx.letterSpacing = '0px';
  }

  /**
   * Draw multi-line text with automatic word wrapping.
   * Returns the total height used (as a fraction of canvas height).
   */
  drawTextWrapped(
    text: string,
    opts: TextOptions & { lineHeight?: number }
  ): number {
    const x = opts.x * this.W;
    let y = opts.y * this.H;
    const fontSize = opts.size * this.W;
    const font = opts.font ?? DEFAULT_FONT;
    const weight = opts.weight ?? '400';
    const style = opts.italic ? 'italic ' : '';
    const maxPx = (opts.maxWidth ?? 0.9) * this.W;
    const lineHeight = (opts.lineHeight ?? opts.size * 1.4) * this.W;

    this.ctx.fillStyle = opts.color ?? '#000000';
    this.ctx.textAlign = opts.align ?? 'left';
    this.ctx.textBaseline = opts.baseline ?? 'top';
    this.ctx.font = `${style}${weight} ${fontSize}px ${font}`;
    this.ctx.letterSpacing = opts.letterSpacing ? `${opts.letterSpacing * this.W}px` : '0px';

    const startY = y;
    // Honour explicit line breaks (\n) first, then word-wrap within each.
    const paragraphs = text.split('\n');
    for (const para of paragraphs) {
      let line = '';
      for (const word of para.split(' ')) {
        const testLine = line ? `${line} ${word}` : word;
        if (this.ctx.measureText(testLine).width > maxPx && line) {
          this.ctx.fillText(line, x, y);
          line = word;
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      // draw the final (or only) line of this paragraph; '' just adds a blank line
      this.ctx.fillText(line, x, y);
      y += lineHeight;
    }

    this.ctx.letterSpacing = '0px';
    return (y - startY) / this.H;
  }

  drawImage(img: HTMLImageElement, opts: ImageOptions): void {
    // Defensive: a missing, still-loading, or non-image value would make the
    // native ctx.drawImage throw ("not of type HTMLImageElement") and take the
    // whole canvas render down. Skip the draw instead so the rest of the slide
    // (text, fallbacks) still paints.
    if (!img || !(img as HTMLImageElement).naturalWidth) return;
    const dx = opts.x * this.W;
    const dy = opts.y * this.H;
    const dw = opts.width * this.W;
    const dh = opts.height * this.H;
    const r = (opts.radius ?? 0) * this.W;
    const fit = opts.fit ?? 'cover';

    this.ctx.save();

    // Clip with rounded corners if needed
    if (r > 0) {
      this.ctx.beginPath();
      this.ctx.roundRect(dx, dy, dw, dh, r);
      this.ctx.clip();
    }

    if (fit === 'cover') {
      // Scale image to cover the destination rect
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const destRatio = dw / dh;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

      if (imgRatio > destRatio) {
        // Image is wider - crop sides
        sw = img.naturalHeight * destRatio;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        // Image is taller - crop top/bottom
        sh = img.naturalWidth / destRatio;
        sy = (img.naturalHeight - sh) / 2;
      }

      this.ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    } else {
      // Contain - letterbox
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const destRatio = dw / dh;
      let drawW = dw, drawH = dh, drawX = dx, drawY = dy;

      if (imgRatio > destRatio) {
        drawH = dw / imgRatio;
        drawY = dy + (dh - drawH) / 2;
      } else {
        drawW = dh * imgRatio;
        drawX = dx + (dw - drawW) / 2;
      }

      this.ctx.drawImage(img, drawX, drawY, drawW, drawH);
    }

    this.ctx.restore();
  }

  // -----------------------------------------------------------------------
  // Export
  // -----------------------------------------------------------------------

  exportPNG(filename: string = 'graphic'): void {
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }

  async exportBlob(type: string = 'image/png', quality?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob returned null'));
        },
        type,
        quality
      );
    });
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /** Returns the smaller of W/H - useful for responsive sizing */
  get minDim(): number {
    return Math.min(this.W, this.H);
  }

  /** Responsive size: fraction of the smaller dimension */
  sz(frac: number): number {
    return this.minDim * frac;
  }
}
