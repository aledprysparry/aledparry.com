// Canvas draws with whatever font is loaded at draw time. Web fonts
// load lazily on first use, so we explicitly preload the families the
// templates use (and the brand images) before drawing - otherwise the
// first paint (and a too-early export) falls back to a system font.
//
// The actual loading lives in brandAssets.ensureAssets (fonts + images);
// ensureFonts stays as the name both the preview canvas and the export
// pipeline already call.
import { ensureAssets } from './brandAssets';

export function ensureFonts(): Promise<void> {
  return ensureAssets();
}
