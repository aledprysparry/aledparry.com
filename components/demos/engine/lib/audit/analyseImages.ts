// ═══ Real reference-post analysis ═══
// We can't fetch live social accounts (login walls + ToS + CORS), so the
// audit analyses the actual reference-post images uploaded for a brand:
// dominant colours, dark/light theme and format mix - all from real
// pixels - then derives suggestions from those numbers (no canned text).

import type { AuditResult, AuditSuggestion } from '@engine/lib/model/types';

const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
const hex = (r: number, g: number, b: number) => `#${toHex(r)}${toHex(g)}${toHex(b)}`;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

interface Bucket { r: number; g: number; b: number; count: number }

const dist = (a: Bucket, b: Bucket) => Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);

export async function analyseImages(urls: string[]): Promise<AuditResult> {
  const counts = new Map<string, Bucket>();
  const aspects = { portrait: 0, square: 0, landscape: 0 };
  let lumSum = 0;
  let lumN = 0;
  let analysed = 0;

  for (const url of urls) {
    const img = await loadImage(url);
    if (!img || !img.naturalWidth) continue;
    // classify aspect
    const ar = img.naturalWidth / img.naturalHeight;
    if (ar > 1.1) aspects.landscape++;
    else if (ar < 0.91) aspects.portrait++;
    else aspects.square++;

    // sample at a small size
    const w = 80;
    const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w));
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    if (!ctx) continue;
    ctx.drawImage(img, 0, 0, w, h);
    let data: Uint8ClampedArray;
    try { data = ctx.getImageData(0, 0, w, h).data; }
    catch { continue; } // tainted (remote) image — skip
    analysed++;

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 128) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      lumSum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
      lumN++;
      // quantise to 6 levels per channel (~216 buckets)
      const key = `${Math.round(r / 51)}-${Math.round(g / 51)}-${Math.round(b / 51)}`;
      const cur = counts.get(key);
      if (cur) { cur.r += r; cur.g += g; cur.b += b; cur.count++; }
      else counts.set(key, { r, g, b, count: 1 });
    }
  }

  // dominant colours: average each bucket, sort by frequency, drop near-duplicates
  const sorted = Array.from(counts.values())
    .map((b) => ({ r: b.r / b.count, g: b.g / b.count, b: b.b / b.count, count: b.count }))
    .sort((a, b) => b.count - a.count);
  const palette: string[] = [];
  const picked: Bucket[] = [];
  for (const c of sorted) {
    if (picked.some((p) => dist(p, c) < 60)) continue;
    picked.push(c);
    palette.push(hex(c.r, c.g, c.b));
    if (palette.length >= 5) break;
  }

  const theme: 'dark' | 'light' = lumN && lumSum / lumN < 120 ? 'dark' : 'light';
  const dominantAspect = (Object.entries(aspects).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'portrait') as AuditResult['dominantAspect'];

  return { count: analysed, palette, theme, aspects, dominantAspect };
}

export function deriveSuggestions(r: AuditResult): AuditSuggestion[] {
  if (r.count === 0) {
    return [{ title: 'No reference posts yet', rationale: 'Add a few of this account\'s posts as images below (or in the Assets tab) and re-audit - the palette and formats are read straight from those pixels.' }];
  }
  const out: AuditSuggestion[] = [];
  const total = r.aspects.portrait + r.aspects.square + r.aspects.landscape;

  if (r.palette.length >= 2) {
    out.push({
      title: `Lock your ${r.palette.length}-colour palette`,
      rationale: `These dominate ${r.count} reference post${r.count === 1 ? '' : 's'}: ${r.palette.slice(0, 3).join(', ')}. Save them as the brand palette so every template stays on-brand.`,
    });
  }

  out.push({
    title: r.theme === 'dark' ? 'Dark-themed grid' : 'Light-themed grid',
    rationale: r.theme === 'dark'
      ? 'Your posts run dark - white headings on deep backgrounds will match. Default new templates to a dark background.'
      : 'Your posts run light - dark text on pale backgrounds will match the feed.',
  });

  const aspectLabel = { portrait: 'portrait (4:5)', square: 'square (1:1)', landscape: 'landscape (16:9)' }[r.dominantAspect];
  out.push({
    title: `Mostly ${r.dominantAspect}`,
    rationale: `${r.aspects[r.dominantAspect]}/${total} posts are ${aspectLabel}. Default new graphics to that format${r.dominantAspect === 'portrait' ? ', and generate a 9:16 story variant for reach.' : '.'}`,
    templateKind: 'quizbookbiz-leaderboard',
  });

  return out;
}
