// ═══ Brand palette resolver (shared) ═══
// Turns a brand's raw colour list into a small, legible palette that works on
// ANY brand - dark or light background - by switching ink/muted to keep
// contrast, and choosing the most vivid colour as the accent (the
// thumb-stopper). Used by both the still templates (freeform) and the
// universal carousels so brand paint is consistent across kinds.

function hexToRgb(hex: string): [number, number, number] | null {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return null;
  const n = Number.parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export const isLight = (hex: string) => luminance(hex) > 0.52;
export const readableInk = (bg: string) => (isLight(bg) ? '#10131a' : '#ffffff');
export const mutedOn = (bg: string) => (isLight(bg) ? 'rgba(16,19,26,0.60)' : 'rgba(255,255,255,0.66)');
const colourfulness = (hex: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  return (Math.max(...rgb) - Math.min(...rgb)) / 255;
};

export interface Palette {
  bg: string;
  accent: string;
  ink: string;
  muted: string;
  onAccent: string;
  soft: string; // low-contrast fill for secondary panels/chips
}

/** Resolve a brand's colour list into a usable, legible palette. The accent is
 *  the most vivid colour that differs from the background (so the thumb-stopper
 *  pops), falling back to the brand's second colour. */
export function paletteFrom(colours?: string[]): Palette {
  const list = colours && colours.length ? colours : ['#0c1322', '#6366f1', '#ffffff'];
  const bg = list[0] ?? '#0c1322';
  const others = list.filter((c) => c && c.toLowerCase() !== bg.toLowerCase());
  let accent = list[1] ?? '#6366f1';
  let best = -1;
  for (const c of others) {
    const score = colourfulness(c);
    if (score > best) { best = score; accent = c; }
  }
  // All-grey brand: keep a usable accent rather than a grey one.
  if (best < 0.08) accent = others[0] ?? (isLight(bg) ? '#10131a' : '#6366f1');
  return {
    bg,
    accent,
    ink: readableInk(bg),
    muted: mutedOn(bg),
    onAccent: readableInk(accent),
    soft: isLight(bg) ? 'rgba(16,19,26,0.06)' : 'rgba(255,255,255,0.10)',
  };
}
