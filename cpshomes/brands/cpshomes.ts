// ═══════════════════════════════════════════════════════════════
//  CPS HOMES — Shared Brand Configuration
//  Used by: GuessThePrice, SocialEditor, and future CPS apps
//  Source: /Users/user/Downloads/CPS Homes - Client files/fonts and colours.pdf
// ═══════════════════════════════════════════════════════════════

export const CPSHOMES_BRAND = {
  // ── Identity ──
  name: "CPS Homes",
  slug: "cpshomes",

  // ── Colours (from official brand guide) ──
  colorPrimary:  "#335F6A",   // deep teal — primary brand colour
  colorAccent:   "#FB8770",   // salmon/coral — highlight, CTA, energy
  colorPositive: "#83A381",   // sage green — success, positive, trust
  colorText:     "#FFFFFF",   // white — overlay text on dark backgrounds
  colorWarm:     "#F2E6D8",   // warm cream — backgrounds, softness
  colorForest:   "#445A46",   // dark forest green — landlord/premium content
  colorOlive:    "#A7A740",   // olive — insight/education posts
  colorNavy:     "#0a1628",   // deep navy — dark UI backgrounds

  // ── Typography ──
  // Official: Nantes (headings) + Matter (body) — both proprietary
  // Google Fonts fallbacks:
  fontFamily: "DM Sans",      // closest to Matter (geometric sans, clean)
  fontSerif:  "Lora",         // closest to Nantes (elegant serif with character)
  fontWeights: "400;500;600;700",
  fontSerifWeights: "400;500;600;700",
  lineHeight: 1.15,           // brand guide specifies 0.92 — 1.15 is readable on canvas

  // ── Logos ──
  logoUrl:      "/demos/cpshomes-logo-teal.png",   // 800×256, teal on transparent
  logoUrlLight: "/demos/cpshomes-logo-white.png",   // 800×256, white on transparent
  logoOpacity: 0.90,
  logoSize:    0.14,           // fraction of canvas width

  // ── Layout ──
  cornerRadius: 20,           // consistent rounded corners across all apps
};

// ── Fonts to load from Google Fonts ──
export const CPSHOMES_FONTS = [
  { name: "DM Sans", weights: "400;500;600;700" },
  { name: "Lora",    weights: "400;500;600;700", ital: true },
];

// ── Aspect Ratios (shared across all CPS tools) ──
export const RATIOS = {
  "16:9":     { W: 1920, H: 1080, label: "16:9",     hint: "YouTube / Premiere" },
  "iPad Pro": { W: 2388, H: 1668, label: "iPad Pro",  hint: "iPad Pro 11\u2033 / 13\u2033" },
  "4:3":      { W: 1440, H: 1080, label: "4:3",       hint: "iPad / Presentation" },
  "1:1":      { W: 1080, H: 1080, label: "1:1",       hint: "Instagram Feed" },
  "9:16":     { W: 1080, H: 1920, label: "9:16",      hint: "TikTok / Reels" },
};

// ── Safe Zones per platform ──
export const SAFE_ZONES = {
  // TikTok/Reels worst-case paid ad margins
  portrait: { top: 220, bottom: 420 },
  // YouTube shorts
  square:   { top: 100, bottom: 100 },
  // Standard broadcast
  landscape: { top: 0, bottom: 0 },
};

// ── Font loader (shared utility) ──
export function loadFont(name: string) {
  if (typeof document === "undefined") return;
  const id = "gf-" + name.replace(/ /g, "-");
  if (document.getElementById(id)) return;
  const all = [...CPSHOMES_FONTS];
  const entry = all.find(f => f.name === name) || all[0];
  const l = document.createElement("link");
  l.id = id;
  l.rel = "stylesheet";
  if (entry.ital) {
    const wArr = entry.weights.split(";");
    const axes = wArr.map((w: string) => `0,${w}`).concat(wArr.map((w: string) => `1,${w}`)).join(";");
    l.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, "+")}:ital,wght@${axes}&display=swap`;
  } else {
    l.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g, "+")}:wght@${entry.weights}&display=swap`;
  }
  document.head.appendChild(l);
}
