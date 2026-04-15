// ═══════════════════════════════════════════════════════════════
//  Shared Video Export Utilities
//  Used by: GuessThePrice, SocialEditor, future canvas apps
//
//  Transparent MOV export via PNG sequence:
//    recordAsset → captures canvas frames as PNGs (alpha preserved)
//    webmToMov   → FFmpeg assembles PNG sequence into PNG-codec MOV
//
//  Chrome's MediaRecorder does NOT reliably preserve canvas alpha
//  (VP8 or VP9 — long-standing Chromium limitation). PNG-per-frame
//  is the only bulletproof path to alpha-preserving MOV export.
// ═══════════════════════════════════════════════════════════════

import { FFmpeg } from "@ffmpeg/ffmpeg";

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

// ── PNG sequence handle passed between recordAsset and webmToMov ──
export interface PngSequence {
  __pngSequence: true;
  frames: Uint8Array[];
  fps: number;
}

// ── Record a canvas draw function as a PNG sequence ──
// drawFn: (ctx, W, H, S, progress) where progress goes 0→1
//
// Captures exact discrete frames at a fixed framerate — every frame is
// a PNG with preserved alpha. No MediaRecorder, no WebM, no codec fuss.
export async function recordAsset(
  drawFn: (ctx: CanvasRenderingContext2D, W: number, H: number, S: any, p: number) => void,
  W: number,
  H: number,
  S: any,
  durMs: number
): Promise<PngSequence> {
  const fps = 25;
  const numFrames = Math.max(1, Math.round((durMs / 1000) * fps));

  const cvs = document.createElement("canvas");
  cvs.width = W;
  cvs.height = H;
  const ctx = cvs.getContext("2d", { alpha: true })!;

  const frames: Uint8Array[] = [];
  for (let i = 0; i < numFrames; i++) {
    const p = numFrames <= 1 ? 1 : i / (numFrames - 1);
    ctx.clearRect(0, 0, W, H);
    drawFn(ctx, W, H, S, p);

    // toBlob with image/png preserves alpha; convert to Uint8Array for FFmpeg
    const blob: Blob = await new Promise((resolve) => {
      cvs.toBlob((b) => resolve(b!), "image/png");
    });
    const buf = new Uint8Array(await blob.arrayBuffer());
    frames.push(buf);

    // Yield to event loop every 10 frames so UI stays responsive
    if (i % 10 === 9) await new Promise((r) => setTimeout(r, 0));
  }

  return { __pngSequence: true, frames, fps };
}

// ── Assemble a PNG sequence into an alpha-preserving MOV ──
// Accepts either the new PngSequence (preferred) or a legacy WebM Blob.
// Uses FFmpeg image2 demuxer with PNG codec + RGBA pix_fmt — Premiere reads
// this as a true alpha clip.
export async function webmToMov(
  input: PngSequence | Blob,
  filename = "output.mov",
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ff = await getFFmpeg();
  const outputName = filename.replace(/\.[^.]+$/, "") + ".mov";

  // Legacy WebM path — preserved in case anyone still feeds a Blob in.
  if (input instanceof Blob) {
    const inputName = "input.webm";
    await ff.writeFile(inputName, new Uint8Array(await input.arrayBuffer()));
    if (onProgress) ff.on("progress", ({ progress }) => onProgress(progress));
    await ff.exec([
      "-r", "25",
      "-i", inputName,
      "-c:v", "png",
      "-pix_fmt", "rgba",
      "-r", "25",
      "-an",
      outputName,
    ]);
    const data = await ff.readFile(outputName);
    await ff.deleteFile(inputName);
    await ff.deleteFile(outputName);
    // @ts-ignore — ffmpeg returns Uint8Array, Blob accepts it at runtime
    return new Blob([data], { type: "video/quicktime" });
  }

  // PNG sequence path (alpha-preserving, the normal case)
  const { frames, fps } = input;
  const pad = (n: number) => String(n).padStart(5, "0");
  const frameName = (i: number) => `frame_${pad(i)}.png`;

  for (let i = 0; i < frames.length; i++) {
    // @ts-ignore — writeFile accepts Uint8Array
    await ff.writeFile(frameName(i), frames[i]);
    if (onProgress) onProgress((i / frames.length) * 0.5);
  }

  if (onProgress) ff.on("progress", ({ progress }) => onProgress(0.5 + progress * 0.5));

  // image2 demuxer reads frame_00000.png, frame_00001.png, ...
  // -c:v png + -pix_fmt rgba = lossless with alpha, Premiere-native
  await ff.exec([
    "-framerate", String(fps),
    "-i", "frame_%05d.png",
    "-c:v", "png",
    "-pix_fmt", "rgba",
    "-r", String(fps),
    "-an",
    outputName,
  ]);

  const data = await ff.readFile(outputName);

  // Clean up frames from FFmpeg FS to free memory
  for (let i = 0; i < frames.length; i++) {
    try { await ff.deleteFile(frameName(i)); } catch { /* noop */ }
  }
  try { await ff.deleteFile(outputName); } catch { /* noop */ }

  if (onProgress) onProgress(1);
  // @ts-ignore — ffmpeg returns Uint8Array, Blob accepts it at runtime
  return new Blob([data], { type: "video/quicktime" });
}

// ── Legacy MIME helper — kept so any remaining import sites still compile.
// Not used by the PNG-sequence pipeline.
export function WEBM_MIME(): string {
  if (typeof MediaRecorder !== "undefined") {
    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) return "video/webm;codecs=vp8";
    if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) return "video/webm;codecs=vp9";
  }
  return "video/webm";
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
  const seq = await recordAsset(drawFn, W, H, S, durMs);
  return webmToMov(seq, filename, onProgress);
}

// ── Hold a single static canvas as a looping MOV ──
//
// For STATIC content (posters, title cards held at progress=1, stills)
// recording N identical frames through recordAsset is wasteful — a 3s
// 1920×1080 hold at 25fps would push 75 ~8MB PNGs through the FFmpeg
// filesystem for no reason.
//
// Instead, this helper writes ONE PNG and uses FFmpeg's `-loop 1 -t`
// flag to stretch that single frame for the requested duration. The
// resulting MOV is still a real N-frame video (so platforms accept it
// as a video upload) but the encoder only had to compress one unique
// image — the rest is free.
//
// Static images loop perfectly at any duration (frame 1 === frame N),
// so `durSec` is a free choice. 3s is a good default for social feed
// posts: it reads as a pause, meets the ≥1s minimum most platforms
// require for video uploads, and stays under file-size thresholds.
export async function holdImageAsMov(
  source: HTMLCanvasElement | Blob,
  durSec = 3,
  filename = "hold.mov"
): Promise<Blob> {
  const ff = await getFFmpeg();
  const outputName = filename.replace(/\.[^.]+$/, "") + ".mov";

  // Get a PNG Blob from whatever source we were given.
  let pngBlob: Blob;
  if (source instanceof Blob) {
    pngBlob = source;
  } else {
    pngBlob = await new Promise<Blob>((resolve) => {
      source.toBlob((b) => resolve(b!), "image/png");
    });
  }
  const buf = new Uint8Array(await pngBlob.arrayBuffer());

  const inputName = "hold_input.png";
  // @ts-ignore — writeFile accepts Uint8Array
  await ff.writeFile(inputName, buf);

  // -loop 1  → read the single input as an infinite loop
  // -framerate 25 → on input, interpret the single frame as 25fps stream
  // -t durSec → cap the output duration
  // -c:v png -pix_fmt rgba → lossless with alpha, Premiere-native
  await ff.exec([
    "-loop", "1",
    "-framerate", "25",
    "-i", inputName,
    "-c:v", "png",
    "-pix_fmt", "rgba",
    "-t", String(durSec),
    "-r", "25",
    "-an",
    outputName,
  ]);

  const data = await ff.readFile(outputName);
  try { await ff.deleteFile(inputName); } catch { /* noop */ }
  try { await ff.deleteFile(outputName); } catch { /* noop */ }
  // @ts-ignore — ffmpeg returns Uint8Array, Blob accepts it at runtime
  return new Blob([data], { type: "video/quicktime" });
}
