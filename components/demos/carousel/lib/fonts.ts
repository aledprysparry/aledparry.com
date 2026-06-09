// Canvas draws with whatever font is loaded at draw time. Web fonts
// load lazily on first use, so we explicitly load the weights the
// templates use and only then draw - otherwise the first paint (and a
// too-early export) falls back to a system font.

let ready: Promise<void> | null = null;

export function ensureFonts(): Promise<void> {
  if (ready) return ready;
  ready = (async () => {
    if (!('fonts' in document)) return;
    const specs = [
      '400 40px Inter', '500 40px Inter', '600 40px Inter', '700 40px Inter', '800 40px Inter', '900 40px Inter',
      '700 40px Bitter', '800 40px Bitter',
    ];
    await Promise.all(specs.map((s) => document.fonts.load(s).catch(() => undefined)));
    await document.fonts.ready;
  })();
  return ready;
}
