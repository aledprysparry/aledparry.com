// ═══════════════════════════════════════════════════════════════
//  Shared Canvas Helpers — easing, shapes, sizing, image cache
//  Used by: GuessThePrice, SocialEditor, future canvas apps
// ═══════════════════════════════════════════════════════════════

// ── Easing functions ──
export function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function easeOutBack(t: number): number {
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}

export function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ── Responsive sizing — use min(W,H) so text stays readable across all ratios ──
export function sz(W: number, H: number, frac: number): number {
  return Math.round(Math.min(W, H) * frac);
}

// ── Detect aspect ratio ──
export function aspect(W: number, H: number): "portrait" | "square" | "landscape" {
  return H > W ? "portrait" : W === H ? "square" : "landscape";
}

// ── Rounded rectangle path ──
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number | { tl: number; tr: number; br: number; bl: number }
) {
  const rad = typeof r === "number" ? { tl: r, tr: r, br: r, bl: r } : r;
  ctx.beginPath();
  ctx.moveTo(x + rad.tl, y);
  ctx.lineTo(x + w - rad.tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad.tr);
  ctx.lineTo(x + w, y + h - rad.br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad.br, y + h);
  ctx.lineTo(x + rad.bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad.bl);
  ctx.lineTo(x, y + rad.tl);
  ctx.quadraticCurveTo(x, y, x + rad.tl, y);
  ctx.closePath();
}

// ── Safe zones for social platforms (portrait 9:16 base) ──
// CPS Homes spec for 9:16 (1080×1920): top 250, bottom 320, left/right 120
export function safeZone(W: number, H: number) {
  const ar = aspect(W, H);
  if (ar === "portrait") {
    const scale = W / 1080;
    const top = Math.round(250 * scale);
    const bottom = Math.round(320 * scale);
    const side = Math.round(120 * scale);
    return {
      top, bottom, left: side, right: side,
      cx: W / 2,
      contentTop: top,
      contentBottom: H - bottom,
    };
  }
  // Landscape / square: no insets
  return { top: 0, bottom: 0, left: 0, right: 0, cx: W / 2, contentTop: 0, contentBottom: H };
}

// ── Image cache with load callback ──
const IMG_CACHE: Record<string, HTMLImageElement> = {};
let _imgLoadCallbacks: Array<() => void> = [];

export function getCachedImage(src: string): HTMLImageElement | null {
  if (!src) return null;
  // Reject bare strings that aren't URLs (e.g. "Adamsdown" location text in photos array)
  if (!src.startsWith("http") && !src.startsWith("/") && !src.startsWith("data:") && !src.startsWith("blob:")) return null;
  if (IMG_CACHE[src]) return IMG_CACHE[src].complete ? IMG_CACHE[src] : null;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => _imgLoadCallbacks.forEach(fn => fn());
  img.src = src;
  IMG_CACHE[src] = img;
  return img.complete ? img : null;
}

// Register a callback for when any cached image loads
export function onImageLoad(fn: () => void): () => void {
  _imgLoadCallbacks.push(fn);
  return () => { _imgLoadCallbacks = _imgLoadCallbacks.filter(f => f !== fn); };
}

// ── Aspect ratios ──
export const RATIOS: Record<string, { W: number; H: number; label: string; hint: string }> = {
  "16:9":     { W: 1920, H: 1080, label: "16:9",     hint: "YouTube / Premiere" },
  "iPad Pro": { W: 2388, H: 1668, label: "iPad Pro",  hint: "iPad Pro 11\u2033 / 13\u2033" },
  "4:3":      { W: 1440, H: 1080, label: "4:3",       hint: "iPad / Presentation" },
  "1:1":      { W: 1080, H: 1080, label: "1:1",       hint: "Instagram Feed" },
  "9:16":     { W: 1080, H: 1920, label: "9:16",      hint: "TikTok / Reels" },
};

// ── Font loader ──
interface FontEntry { name: string; weights: string; ital?: boolean; }

const ALL_FONTS: FontEntry[] = [
  { name: "DM Sans",          weights: "400;500;600;700;800" },
  { name: "Lora",             weights: "400;500;600;700", ital: true },
  { name: "Montserrat",       weights: "400;600;700;800;900" },
  { name: "Oswald",           weights: "400;600;700" },
  { name: "Playfair Display", weights: "400;700" },
  { name: "Raleway",          weights: "400;600;700" },
  { name: "Open Sans",        weights: "400;600;700" },
];

export function loadFont(name: string) {
  if (typeof document === "undefined") return;
  const id = "gf-" + name.replace(/ /g, "-");
  if (document.getElementById(id)) return;
  const entry = ALL_FONTS.find(f => f.name === name) || ALL_FONTS[0];
  const l = document.createElement("link");
  l.id = id;
  l.rel = "stylesheet";
  if (entry.ital) {
    const wArr = entry.weights.split(";");
    const axes = wArr.map(w => `0,${w}`).concat(wArr.map(w => `1,${w}`)).join(";");
    l.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, "+")}:ital,wght@${axes}&display=swap`;
  } else {
    l.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, "+")}:wght@${entry.weights}&display=swap`;
  }
  document.head.appendChild(l);
}
