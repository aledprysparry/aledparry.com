// Register uploaded font assets with the browser so text elements can
// use them in the editor AND in canvas export (FontFace -> document.fonts;
// drawElements awaits document.fonts.ready).

import type { BrandAsset } from '@engine/lib/model/types';

const registered = new Set<string>();

/** Stable CSS family name for a font asset (derived from its filename). */
export function fontFamilyFor(asset: BrandAsset): string {
  const base = asset.name.replace(/\.(woff2?|ttf|otf)$/i, '').replace(/[^a-z0-9]+/gi, ' ').trim();
  return base || `Font ${asset.id.slice(-4)}`;
}

// Returns true only if at least one NEW font was registered this call, so the
// caller can repaint exactly once - and crucially NOT re-render when there is
// nothing new to load (which otherwise feeds an infinite re-render loop).
export async function registerFontAssets(assets: BrandAsset[]): Promise<boolean> {
  if (typeof document === 'undefined' || !('fonts' in document)) return false;
  let added = false;
  await Promise.all(
    assets
      .filter((a) => a.type === 'font' && a.url.startsWith('data:'))
      .map(async (a) => {
        if (registered.has(a.id)) return;
        const family = fontFamilyFor(a);
        try {
          const face = new FontFace(family, `url(${a.url})`);
          await face.load();
          (document.fonts as FontFaceSet).add(face);
          registered.add(a.id);
          added = true;
        } catch {
          /* unsupported font file - ignore */
        }
      }),
  );
  return added;
}

export function fontAssetFamilies(assets: BrandAsset[]): string[] {
  return assets.filter((a) => a.type === 'font').map(fontFamilyFor);
}
