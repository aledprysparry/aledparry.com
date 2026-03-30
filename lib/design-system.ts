// ═══════════════════════════════════════════════════════════════
//  Shared Design System — tokens + style factories
//  Used by: GuessThePrice, SocialEditor, future canvas apps
// ═══════════════════════════════════════════════════════════════

export const DS = {
  // Backgrounds
  bgPage:    "#0a0f1a",
  bgCard:    "rgba(255,255,255,0.035)",
  bgCardHover: "rgba(255,255,255,0.06)",
  bgCardGlass: "rgba(255,255,255,0.04)",
  bgInput:   "rgba(255,255,255,0.06)",
  bgButton:  "rgba(255,255,255,0.08)",
  bgModal:   "#111827",
  bgOverlay: "rgba(0,0,0,0.75)",
  bgSurface: "#131a2a",

  // Borders
  borderSubtle: "rgba(255,255,255,0.08)",
  borderMedium: "rgba(255,255,255,0.12)",
  borderActive: "rgba(255,255,255,0.22)",
  borderFocus:  "rgba(42,157,143,0.5)",

  // Brand accents
  accent:      "#1a5c5e",
  accentLight: "#2a7d80",
  primary:     "#1D3557",
  green:       "#2A9D8F",
  salmon:      "#FB8770",

  // Semantic
  positive:       "rgba(42,157,143,0.15)",
  positiveBorder: "rgba(42,157,143,0.35)",
  danger:         "rgba(251,135,112,0.12)",
  dangerBorder:   "rgba(251,135,112,0.3)",

  // Text
  textPrimary:   "rgba(255,255,255,0.95)",
  textSecondary: "rgba(255,255,255,0.6)",
  textMuted:     "rgba(255,255,255,0.35)",
  textAccent:    "#2A9D8F",

  // Radius
  rSm: 8, rMd: 12, rLg: 16,

  // Spacing
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,

  // Typography
  font: "'DM Sans',Montserrat,Arial,sans-serif",
  fsXs: 10, fsSm: 11, fsMd: 13, fsLg: 15, fsXl: 20,

  // Transitions
  transQuick: "all 0.12s ease",
  transMed:   "all 0.2s ease",
  transSlow:  "all 0.35s ease",
} as const;

// ── Style factories ──
export const btn = (o?: Record<string, any>) => ({
  background: DS.bgButton, border: `1px solid ${DS.borderSubtle}`,
  color: DS.textPrimary, padding: "7px 14px", borderRadius: DS.rSm,
  cursor: "pointer", fontSize: DS.fsSm, fontFamily: DS.font, fontWeight: 600,
  transition: DS.transQuick, letterSpacing: "0.01em", ...o,
});

export const btnCta = (o?: Record<string, any>) => btn({
  background: DS.accent, border: `1px solid ${DS.accentLight}`,
  color: "#fff", padding: "12px 28px", fontSize: DS.fsLg, fontWeight: 700,
  borderRadius: DS.rMd, letterSpacing: "0.02em", ...o,
});

export const btnPositive = (o?: Record<string, any>) => btn({
  background: DS.positive, border: `1px solid ${DS.positiveBorder}`, ...o,
});

export const inputS = (o?: Record<string, any>) => ({
  width: "100%", background: DS.bgInput, border: `1px solid ${DS.borderSubtle}`,
  borderRadius: DS.rSm, padding: "10px 13px", color: DS.textPrimary,
  fontSize: DS.fsMd, fontFamily: DS.font, boxSizing: "border-box" as const, outline: "none",
  transition: DS.transQuick, ...o,
});

export const card = (o?: Record<string, any>) => ({
  background: DS.bgCardGlass, border: `1px solid ${DS.borderSubtle}`,
  borderRadius: DS.rMd, padding: `${DS.lg}px`, marginBottom: DS.lg,
  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", ...o,
});

export const label = (o?: Record<string, any>) => ({
  display: "block", fontSize: DS.fsXs, fontWeight: 700, color: DS.textSecondary,
  marginBottom: DS.xs, textTransform: "uppercase" as const, letterSpacing: "0.06em", ...o,
});

export const sectionHead = (o?: Record<string, any>) => ({
  fontSize: DS.fsSm, fontWeight: 700, color: DS.textPrimary,
  marginBottom: DS.md, letterSpacing: "0.02em", ...o,
});
