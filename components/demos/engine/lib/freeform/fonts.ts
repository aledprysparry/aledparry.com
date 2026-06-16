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

export async function registerFontAssets(assets: BrandAsset[]): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  await Promise.all(
    assets
      .filter((a) => a.type === 'font' && a.url.startsWith('data:'))
      .map(async (a) => {
        const family = fontFamilyFor(a);
        if (registered.has(a.id)) return;
        try {
          const face = new FontFace(family, `url(${a.url})`);
          await face.load();
          (document.fonts as FontFaceSet).add(face);
          registered.add(a.id);
        } catch {
          /* unsupported font file - ignore */
        }
      }),
  );
}

export function fontAssetFamilies(assets: BrandAsset[]): string[] {
  return assets.filter((a) => a.type === 'font').map(fontFamilyFor);
}
