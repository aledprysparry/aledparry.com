// Downscale + compress an uploaded image to a sane data URL before we
// store it, so assets stay small and fast. Non-image files (fonts) are
// read as-is.

export function fileToStoredDataURL(file: File, maxDim = 1400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const src = String(reader.result);
      if (!file.type.startsWith('image/')) return resolve(src); // fonts etc.
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        const ctx = cv.getContext('2d');
        if (!ctx) return resolve(src);
        ctx.drawImage(img, 0, 0, w, h);
        // webp where supported, else the canvas falls back to png.
        resolve(cv.toDataURL('image/webp', quality));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
