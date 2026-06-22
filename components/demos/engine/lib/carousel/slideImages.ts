// Carousel slide draws are synchronous, but optional user-uploaded images
// (e.g. a per-question photo/logo) are data URLs that must be decoded first.
// This loads a {slotKey -> url} map into {slotKey -> HTMLImageElement} so the
// preview + export can pass ready images into SlideProps.images.

export function loadSlideImages(urls?: Record<string, string>): Promise<Record<string, HTMLImageElement>> {
  if (!urls || typeof Image === 'undefined') return Promise.resolve({});
  const entries = Object.entries(urls).filter(([, u]) => !!u);
  if (!entries.length) return Promise.resolve({});
  return Promise.all(
    entries.map(([key, url]) => new Promise<[string, HTMLImageElement | null]>((res) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => res([key, img]);
      img.onerror = () => res([key, null]);
      img.src = url;
    })),
  ).then((pairs) => {
    const out: Record<string, HTMLImageElement> = {};
    for (const [key, img] of pairs) if (img) out[key] = img;
    return out;
  });
}
