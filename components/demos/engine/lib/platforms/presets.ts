// ═══ Platform presets: dimensions + safe areas ═══
// Safe-area insets (px, relative to the canvas size) keep key content
// clear of platform chrome: captions, profile rows, action buttons.

import type { PlatformPreset, PlatformId } from '@engine/lib/model/types';

export const PLATFORM_PRESETS: Record<PlatformId, PlatformPreset> = {
  'instagram-feed': {
    id: 'instagram-feed',
    name: 'Instagram Feed',
    width: 1080,
    height: 1350,
    aspectRatio: '4:5',
    safeArea: { top: 60, right: 60, bottom: 120, left: 60 },
    notes: 'Portrait 4:5 maximises feed real-estate. Keep CTAs above the caption fold.',
  },
  'instagram-carousel': {
    id: 'instagram-carousel',
    name: 'Instagram Carousel',
    width: 1080,
    height: 1350,
    aspectRatio: '4:5',
    safeArea: { top: 60, right: 90, bottom: 120, left: 60 },
    slideCount: { min: 2, max: 10 },
    notes: 'Swipe dots sit bottom-centre; the page indicator overlaps the lower edge.',
  },
  'instagram-square': {
    id: 'instagram-square',
    name: 'Instagram Square',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    safeArea: { top: 60, right: 60, bottom: 90, left: 60 },
    slideCount: { min: 2, max: 10 },
    notes: 'Classic 1:1 square - the format S4C uses for the daily-quiz posts.',
  },
  'instagram-story': {
    id: 'instagram-story',
    name: 'Instagram Story / Reel',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    safeArea: { top: 250, right: 80, bottom: 320, left: 80 },
    notes: 'Top ~14% holds the profile row; bottom ~17% holds reply/share UI.',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    safeArea: { top: 130, right: 180, bottom: 420, left: 60 },
    notes: 'Right rail (like/comment/share) + bottom caption block eat a lot of space.',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook Feed',
    width: 1080,
    height: 1350,
    aspectRatio: '4:5',
    safeArea: { top: 60, right: 60, bottom: 100, left: 60 },
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    width: 1200,
    height: 1500,
    aspectRatio: '4:5',
    safeArea: { top: 60, right: 60, bottom: 100, left: 60 },
    notes: 'Professional tone; portrait 4:5 performs well in-feed.',
  },
  x: {
    id: 'x',
    name: 'X / Twitter',
    width: 1600,
    height: 900,
    aspectRatio: '16:9',
    safeArea: { top: 40, right: 60, bottom: 60, left: 60 },
    notes: 'Landscape 16:9 avoids in-timeline cropping.',
  },
};

export const PLATFORM_LIST: PlatformPreset[] = Object.values(PLATFORM_PRESETS);

export function getPreset(id?: PlatformId): PlatformPreset {
  return (id && PLATFORM_PRESETS[id]) || PLATFORM_PRESETS['instagram-carousel'];
}
