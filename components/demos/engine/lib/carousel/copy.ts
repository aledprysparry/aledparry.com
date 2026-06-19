// Effective copy for a graphic = kind default ← master ← this graphic's
// overrides. This is what makes "edit the master, instances update" work:
// graphics store only the fields they changed (overrides), so a master edit
// flows through to every field a graphic hasn't deliberately overridden.

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
