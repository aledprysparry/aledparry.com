// ═══ Postio R1 — "Animated" output mode for ANY template ═══
// One template, two output modes: the same slides that export as PNG/JPG can
// also export as motion. Each slide is rendered ONCE to an offscreen bitmap
// (via the existing CanvasRenderer + SlideDef.draw — no renderer changes), then
// a reveal envelope (fade + gentle zoom) is animated over each bitmap and the
// whole thing recorded to WebM client-side. No backend; MP4/MOV is the worker
// (R4). This is what makes "still vs animated" one template, not two systems.

import { CanvasRenderer, type RatioKey } from '@engine/lib/canvas/CanvasRenderer';
import { ensureFonts } from './fonts';
import { webmSupported } from './exportAnimated';
import { loadSlideImages } from './slideImages';
import type { SlideDef, LeaderboardRow, CarouselCopy, CarouselBrand } from './types';

function pickMime(): string {
  for (const m of ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m;
  }
  return 'video/webm';
}
const easeOut = (t: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);

export interface SlidesAnimatedOpts {
  slides: SlideDef[];
  rows: LeaderboardRow[];
  copy: CarouselCopy;
  ratio?: RatioKey;
  perSlideMs?: number;
  fps?: number;
  brand?: CarouselBrand;
  imageUrls?: Record<string, string>;
}

export async function renderSlidesAnimatedWebM(opts: SlidesAnimatedOpts): Promise<Blob> {
  if (!webmSupported()) throw new Error('This browser can’t record video (no MediaRecorder/captureStream).');
  const { slides, rows, copy, ratio = 'portrait', perSlideMs = 2600, fps = 30, brand, imageUrls } = opts;
  if (!slides.length) throw new Error('Nothing to animate.');
  await ensureFonts();
  const images = await loadSlideImages(imageUrls);

  // Render each slide once to its own offscreen bitmap (static).
  const bitmaps = slides.map((slide, i) => {
    const c = document.createElement('canvas');
    const r = new CanvasRenderer(c, ratio);
    slide.draw(r, { rows, copy, slideCount: slides.length, index: i, brand, images });
    return c;
  });

  const W = bitmaps[0].width, H = bitmaps[0].height;
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const ctx = out.getContext('2d')!;
  const stream = out.captureStream(fps);
  const rec = new MediaRecorder(stream, { mimeType: pickMime(), videoBitsPerSecond: 8_000_000 });
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };

  // Inter-slide fade colour: the brand background where known, else deep navy.
  const fadeBg = brand?.colours?.[0] ?? '#0b1120';
  // Hold the final asset at the end (no fade out) so the sequence pauses on it.
  const END_HOLD_MS = 1000;
  const total = perSlideMs * slides.length + END_HOLD_MS;
  const stopped = new Promise<void>((resolve) => { rec.onstop = () => resolve(); });

  rec.start();
  const start = performance.now();
  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      const el = now - start;
      if (el >= total) { rec.stop(); resolve(); return; }
      const idx = Math.min(slides.length - 1, Math.floor(el / perSlideMs));
      const local = (el - idx * perSlideMs) / perSlideMs; // 0..1 within this slide
      const reveal = easeOut(local / 0.28);
      const isLast = idx === slides.length - 1;
      // every asset fades out to transition to the next - EXCEPT the last one,
      // which holds (no fade) so the sequence pauses on it.
      const outp = (slides.length > 1 && !isLast) ? easeOut((local - 0.85) / 0.15) : 0;
      const alpha = Math.max(0, reveal * (1 - outp));
      const scale = 0.985 + 0.015 * reveal;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = fadeBg;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(W / 2, H / 2); ctx.scale(scale, scale); ctx.translate(-W / 2, -H / 2);
      ctx.drawImage(bitmaps[idx], 0, 0);
      ctx.restore();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await stopped;
  return new Blob(chunks, { type: 'video/webm' });
}

export async function downloadSlidesAnimatedWebM(filename: string, opts: SlidesAnimatedOpts): Promise<void> {
  const blob = await renderSlidesAnimatedWebM(opts);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.webm') ? filename : `${filename}.webm`;
  a.click();
  URL.revokeObjectURL(url);
}
