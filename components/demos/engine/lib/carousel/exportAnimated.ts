// Client-side WebM export for the animated caption kind. Records the canvas
// (drawn frame-by-frame by drawAnimatedFrame) via MediaRecorder — no backend,
// no FFmpeg. WebM is fine for preview/most platforms; the Phase-2b worker adds
// MP4/burn-in later.

import { CanvasRenderer, type RatioKey } from '@engine/lib/canvas/CanvasRenderer';
import { ensureFonts } from './fonts';
import { drawAnimatedFrame, ANIMATED_DURATION_MS } from './animated';

export function webmSupported(): boolean {
  return typeof MediaRecorder !== 'undefined'
    && typeof HTMLCanvasElement !== 'undefined'
    && typeof HTMLCanvasElement.prototype.captureStream === 'function';
}

function pickMime(): string {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  for (const m of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m;
  }
  return 'video/webm';
}

export interface AnimatedExportOpts {
  copy: Record<string, string | undefined>;
  ratio?: RatioKey;
  durationMs?: number;
  loops?: number;
  fps?: number;
}

/** Render the animated caption to a WebM Blob. */
export async function renderAnimatedWebM(opts: AnimatedExportOpts): Promise<Blob> {
  if (!webmSupported()) throw new Error('This browser can’t record video (no MediaRecorder/captureStream).');
  const { copy, ratio = 'story', durationMs = ANIMATED_DURATION_MS, loops = 2, fps = 30 } = opts;

  await ensureFonts();

  const canvas = document.createElement('canvas');
  const r = new CanvasRenderer(canvas, ratio); // sets canvas pixel dimensions for the ratio
  const stream = canvas.captureStream(fps);
  const rec = new MediaRecorder(stream, { mimeType: pickMime(), videoBitsPerSecond: 8_000_000 });
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };

  const total = durationMs * Math.max(1, loops);
  const stopped = new Promise<void>((resolve) => { rec.onstop = () => resolve(); });

  rec.start();
  const start = performance.now();
  await new Promise<void>((resolve) => {
    const tick = (nowT: number) => {
      const elapsed = nowT - start;
      drawAnimatedFrame(r, copy, (elapsed % durationMs) / durationMs);
      if (elapsed >= total) { rec.stop(); resolve(); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await stopped;
  return new Blob(chunks, { type: 'video/webm' });
}

/** Render + trigger a download. */
export async function downloadAnimatedWebM(filename: string, opts: AnimatedExportOpts): Promise<void> {
  const blob = await renderAnimatedWebM(opts);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.webm') ? filename : `${filename}.webm`;
  a.click();
  URL.revokeObjectURL(url);
}
