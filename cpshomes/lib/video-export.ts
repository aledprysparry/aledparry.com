// ═══════════════════════════════════════════════════════════════
//  Shared Video Export Utilities
//  Used by: GuessThePrice, SocialEditor, future canvas apps
//  FFmpeg.wasm for WebM → MOV (Premiere-native with alpha)
// ═══════════════════════════════════════════════════════════════

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

// ── FFmpeg singleton ──
let _ffmpeg: FFmpeg | null = null;

export async function getFFmpeg(): Promise<FFmpeg> {
  if (_ffmpeg && (_ffmpeg as any).loaded) return _ffmpeg;
  _ffmpeg = new FFmpeg();
  await _ffmpeg.load({
    coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",
    wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm",
  });
  return _ffmpeg;
}

// ── WebM → MOV conversion (PNG codec, RGBA — preserves alpha, Premiere-native) ──
export async function webmToMov(
  webmBlob: Blob,
  filename = "output.mov",
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg();
  const inputName = "input.webm";
  const outputName = filename.replace(/\.[^.]+$/, "") + ".mov";
  await ff.writeFile(inputName, await fetchFile(webmBlob));
  if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
  // -c:v png -pix_fmt rgba = lossless with alpha channel
  await ff.exec(["-i", inputName, "-c:v", "png", "-pix_fmt", "rgba", "-an", outputName]);
  const data = await ff.readFile(outputName);
  await ff.deleteFile(inputName);
  await ff.deleteFile(outputName);
  // @ts-ignore — ffmpeg returns Uint8Array, Blob accepts it at runtime
  return new Blob([data], { type: "video/quicktime" });
}

// ── Best supported WebM MIME type ──
export function WEBM_MIME(): string {
  if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
    return "video/webm;codecs=vp9";
  }
  return "video/webm";
}

// ── Record a canvas draw function as WebM ──
// drawFn: (ctx, W, H, S, progress) where progress goes 0→1
export function recordAsset(
  drawFn: (ctx: CanvasRenderingContext2D, W: number, H: number, S: any, p: number) => void,
  W: number,
  H: number,
  S: any,
  durMs: number
): Promise<Blob> {
  return new Promise((resolve) => {
    const cvs = document.createElement("canvas");
    cvs.width = W;
    cvs.height = H;
    const ctx = cvs.getContext("2d")!;
    const stream = cvs.captureStream(0);
    const chunks: Blob[] = [];
    const rec = new MediaRecorder(stream, {
      mimeType: WEBM_MIME(),
      videoBitsPerSecond: 8_000_000,
    });
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    rec.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
    rec.start();
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durMs);
      ctx.clearRect(0, 0, W, H);
      drawFn(ctx, W, H, S, p);
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        // Hold final frame briefly then stop
        setTimeout(() => rec.stop(), 200);
      }
    };
    requestAnimationFrame(tick);
  });
}

// ── Record and convert to MOV in one step ──
export async function recordAssetAsMov(
  drawFn: (ctx: CanvasRenderingContext2D, W: number, H: number, S: any, p: number) => void,
  W: number,
  H: number,
  S: any,
  durMs: number,
  filename = "output.mov",
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const webm = await recordAsset(drawFn, W, H, S, durMs);
  return webmToMov(webm, filename, onProgress);
}
