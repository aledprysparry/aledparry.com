// Effective copy for a graphic = kind default ← master ← this graphic's
// overrides. This is what makes "edit the master, instances update" work:
// graphics store only the fields they changed (overrides), so a master edit
// flows through to every field a graphic hasn't deliberately overridden.

import type { GeneratedGraphic, Template } from '@engine/lib/model/types';
import type { Lang } from '@engine/lib/i18n/strings';
import { getKind, kindBaseCopy } from '@engine/lib/templates/registry';

export type CopyMap = Record<string, string>;

export function effectiveCopy(
  kindDefault: CopyMap | undefined,
  master: CopyMap | undefined,
  overrides: CopyMap | undefined,
): CopyMap {
  return { ...(kindDefault ?? {}), ...(master ?? {}), ...(overrides ?? {}) };
}

/** Read a graphic's overrides, tolerating pre-master graphics that stored full `copy`. */
export function graphicOverrides(inputs: Record<string, unknown> | undefined): CopyMap {
  if (!inputs) return {};
  return (inputs.copyOverrides as CopyMap) ?? (inputs.copy as CopyMap) ?? {};
}

/**
 * Resolved copy a graphic actually renders: language-aware kind base
 * ← template master ← this graphic's overrides. This is the same merge the
 * editors run (see GraphicEditor / AnimatedEditor), exposed so non-editor
 * callers (e.g. Coach analysis) can score the text the post truly shows
 * rather than only the per-graphic overrides.
 */
export function effectiveCopyForGraphic(
  graphic: GeneratedGraphic,
  template: Template | undefined,
  lang: Lang,
): CopyMap {
  const kind = template ? getKind(template.kind) : undefined;
  return effectiveCopy(kindBaseCopy(kind, lang), template?.master?.copy, graphicOverrides(graphic.inputs));
}
