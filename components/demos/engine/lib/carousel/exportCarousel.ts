// Export: render each slide offscreen at full 1080x1350 and save as
// PNG/JPEG, or bundle all slides into a ZIP. Reuses CanvasRenderer's
// exportBlob, plus jszip + file-saver (the deps cwis-creator-hub ships).

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { CanvasRenderer, type RatioKey } from '@engine/lib/canvas/CanvasRenderer';
import { ensureFonts } from './fonts';
import { loadSlideImages } from './slideImages';
import type { CarouselBrand, CarouselCopy, LeaderboardRow, SlideDef } from './types';

const EXT: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg' };

const slug = (s: string) =>
  (s || 'slide').replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 48).toLowerCase();

async function renderSlideBlob(
  slide: SlideDef,
  index: number,
  rows: LeaderboardRow[],
  copy: CarouselCopy,
  slideCount: number,
  mime: string,
  ratio: RatioKey,
  brand?: CarouselBrand,
  images?: Record<string, HTMLImageElement>,
): Promise<Blob> {
  await ensureFonts();
  const canvas = document.createElement('canvas');
  const r = new CanvasRenderer(canvas, ratio);
  slide.draw(r, { rows, copy, slideCount, index, brand, images });
  return r.exportBlob(mime, mime === 'image/jpeg' ? 0.92 : undefined);
}

export async function exportSlide(
  slide: SlideDef,
  index: number,
  rows: LeaderboardRow[],
  copy: CarouselCopy,
  slideCount: number,
  mime: string,
  ratio: RatioKey = 'portrait',
  name = '',
  brand?: CarouselBrand,
  imageUrls?: Record<string, string>,
): Promise<void> {
  const images = await loadSlideImages(imageUrls);
  const blob = await renderSlideBlob(slide, index, rows, copy, slideCount, mime, ratio, brand, images);
  // Number first so files load/sort in swipe order, then the slide label, then
  // the post name (which usually carries the date): 01_question_<name>.png
  const suffix = name ? `_${slug(name)}` : '';
  saveAs(blob, `${String(index + 1).padStart(2, '0')}_${slug(slide.label)}${suffix}.${EXT[mime]}`);
}

export async function exportZip(
  slides: SlideDef[],
  rows: LeaderboardRow[],
  copy: CarouselCopy,
  mime: string,
  zipName: string,
  ratio: RatioKey = 'portrait',
  brand?: CarouselBrand,
  imageUrls?: Record<string, string>,
): Promise<void> {
  const zip = new JSZip();
  const images = await loadSlideImages(imageUrls);
  for (let i = 0; i < slides.length; i++) {
    const blob = await renderSlideBlob(slides[i], i, rows, copy, slides.length, mime, ratio, brand, images);
    zip.file(`${String(i + 1).padStart(2, '0')}_${slug(slides[i].label)}.${EXT[mime]}`, blob);
  }
  const out = await zip.generateAsync({ type: 'blob' });
  saveAs(out, `${slug(zipName)}.zip`);
}
