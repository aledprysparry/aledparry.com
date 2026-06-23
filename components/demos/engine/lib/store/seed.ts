// First-run seed: one ready-to-use brand + the carousel template, so
// the app is never an empty shell.

import type { Brand, Template } from '@engine/lib/model/types';
import { TEMPLATE_KINDS } from '@engine/lib/templates/registry';
import { newId, now } from './persist';

export interface SeedData {
  brands: Brand[];
  templates: Template[];
}

export function buildSeed(): SeedData {
  const t = now();
  const brandId = newId('brand');
  const brand: Brand = {
    id: brandId,
    name: 'Cwis Bob Dydd',
    logos: [],
    colours: ['#002C6A', '#fecf0a', '#ffffff'],
    fonts: ['Bitter', 'Inter'],
    toneNotes: 'Welsh-first, playful, broadcast-friendly.',
    socialAccounts: [],
    createdAt: t,
    updatedAt: t,
  };
  const templateForKind = (kindId: string): Template => {
    const kind = TEMPLATE_KINDS[kindId];
    return {
      id: newId('tpl'),
      brandId,
      name: kind.name,
      type: kind.type,
      kind: kind.id,
      supportedPlatforms: kind.supportedPlatforms,
      dimensions: kind.dimensions,
      createdAt: t,
    };
  };
  return {
    brands: [brand],
    templates: [templateForKind('quizbookbiz-leaderboard'), templateForKind('cwis-quiz'), templateForKind('cwis-top-groups'), templateForKind('animated-caption')],
  };
}
