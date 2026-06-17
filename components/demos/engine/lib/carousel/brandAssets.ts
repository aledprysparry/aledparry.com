// ═══ Brand assets for the canvas templates (fonts + images) ═══
// The slide `draw()` calls are synchronous, but fonts and images load
// async. So we preload everything once (ensureAssets) and expose a
// synchronous cache the renderers read at draw time. Anything missing
// (a brand image not dropped in yet, a commercial font not installed)
// degrades gracefully — the templates fall back to synthetic art.

export interface BrandImage {
  /** Loaded image, or null until/unless it resolves. */
  img: HTMLImageElement | null;
  /** True once a load attempt finished successfully. */
  ready: boolean;
}

// Cwis Bob Dydd brand art. Drop the real files into /public/app/cwis/
// (see that folder's README) and they light up automatically.
const IMAGE_MANIFEST = {
  logo: '/app/cwis/logo.png',
  bgPurple: '/app/cwis/bg-purple.png',
  bgCyan: '/app/cwis/bg-cyan.png',
  bgYellow: '/app/cwis/bg-yellow.png',
} as const;

export type BrandImageKey = keyof typeof IMAGE_MANIFEST;

const images: Record<BrandImageKey, BrandImage> = {
  logo: { img: null, ready: false },
  bgPurple: { img: null, ready: false },
  bgCyan: { img: null, ready: false },
  bgYellow: { img: null, ready: false },
};

/** Synchronous accessor for use inside a slide's draw(). */
export function brandImage(key: BrandImageKey): HTMLImageElement | null {
  const slot = images[key];
  return slot.ready && slot.img ? slot.img : null;
}

function loadImage(key: BrandImageKey, url: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') return resolve();
    const img = new Image();
    img.onload = () => { images[key] = { img, ready: true }; resolve(); };
    img.onerror = () => { images[key] = { img: null, ready: false }; resolve(); };
    img.src = url;
  });
}

// ── Fonts ──────────────────────────────────────────────────────────
// Rubik is self-hosted (SIL OFL, see /public/app/fonts/rubik). Digitalt
// is a commercial display face — if its woff2 is present we register it,
// otherwise display text falls back to Rubik's heaviest weight.
const FONT_FACES: { family: string; url: string; weight?: string }[] = [
  { family: 'Rubik', url: '/app/fonts/rubik/rubik-latin.woff2', weight: '300 900' },
  { family: 'Rubik', url: '/app/fonts/rubik/rubik-latin-ext.woff2', weight: '300 900' },
  { family: 'Digitalt', url: '/app/fonts/digitalt/digitalt.woff2' },
];

let assetsReady: Promise<void> | null = null;

export function ensureAssets(): Promise<void> {
  if (assetsReady) return assetsReady;
  assetsReady = (async () => {
    if (typeof document === 'undefined') return;

    // Register web fonts (each is best-effort; a missing/failed file is fine).
    if ('fonts' in document) {
      await Promise.all(
        FONT_FACES.map(async (f) => {
          try {
            const face = new FontFace(f.family, `url(${f.url})`, f.weight ? { weight: f.weight } : undefined);
            await face.load();
            (document.fonts as FontFaceSet).add(face);
          } catch {
            /* font not present / unsupported — ignore, fall back */
          }
        }),
      );
      // Also warm the weights/families the carousel templates draw with.
      const warm = [
        '400 40px Rubik', '500 40px Rubik', '700 40px Rubik', '900 40px Rubik',
        '900 40px Digitalt',
        '700 40px Inter', '800 40px Inter', '900 40px Inter', '800 40px Bitter',
      ];
      await Promise.all(warm.map((s) => document.fonts.load(s).catch(() => undefined)));
      await document.fonts.ready;
    }

    // Preload brand images (never rejects).
    await Promise.all(
      (Object.keys(IMAGE_MANIFEST) as BrandImageKey[]).map((k) => loadImage(k, IMAGE_MANIFEST[k])),
    );
  })();
  return assetsReady;
}
