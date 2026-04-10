"use client";

import { useState, useRef, useEffect, useCallback } from "react";
// Dynamic import — FFmpeg.wasm (~31MB) only loaded when user exports MOV
const loadVideoExport = () => import("@/cpshomes/lib/video-export");

// ═══════════════════════════════════════════════════════════════
//  DESIGN SYSTEM — shared tokens (mirrors Social Editor)
// ═══════════════════════════════════════════════════════════════
const DS = {
  bgPage:    "#0a0f1a",
  bgCard:    "rgba(255,255,255,0.035)",
  bgCardHover: "rgba(255,255,255,0.06)",
  bgCardGlass: "rgba(255,255,255,0.04)",
  bgInput:   "rgba(255,255,255,0.05)",
  bgButton:  "rgba(255,255,255,0.07)",
  bgModal:   "#111827",
  bgOverlay: "rgba(0,0,0,0.75)",
  bgSurface: "#131a2a",
  borderSubtle: "rgba(255,255,255,0.08)",
  borderMedium: "rgba(255,255,255,0.12)",
  borderActive: "rgba(255,255,255,0.22)",
  borderFocus: "rgba(42,157,143,0.5)",
  accent:    "#1a5c5e",
  accentLight: "#2a7d80",
  primary:   "#1D3557",
  green:     "#2A9D8F",
  salmon:    "#FB8770",
  positive:       "rgba(42,157,143,0.15)",
  positiveBorder: "rgba(42,157,143,0.35)",
  danger:         "rgba(251,135,112,0.12)",
  dangerBorder:   "rgba(251,135,112,0.3)",
  textPrimary: "rgba(255,255,255,0.95)",
  textSecondary: "rgba(255,255,255,0.6)",
  textMuted:   "rgba(255,255,255,0.35)",
  textAccent:  "#2A9D8F",
  rSm: 8, rMd: 12, rLg: 16,
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
  font: "'DM Sans',Montserrat,Arial,sans-serif",
  fsXs: 10, fsSm: 11, fsMd: 13, fsLg: 15, fsXl: 20,
  transQuick: "all 0.12s ease",
  transMed: "all 0.2s ease",
  transSlow: "all 0.35s ease",
};

// ── Style factories ──────────────────────────────────────────
const btn = (o) => ({
  background: DS.bgButton, border: `1px solid ${DS.borderSubtle}`,
  color: DS.textPrimary, padding: "7px 14px", borderRadius: DS.rSm,
  cursor: "pointer", fontSize: DS.fsSm, fontFamily: DS.font, fontWeight: 600,
  transition: DS.transQuick, letterSpacing: "0.01em", ...o,
});
const btnCta = (o) => btn({
  background: DS.accent, border: `1px solid ${DS.accentLight}`,
  color: "#fff", padding: "12px 28px", fontSize: DS.fsLg, fontWeight: 700,
  borderRadius: DS.rMd, letterSpacing: "0.02em", ...o,
});
const btnPositive = (o) => btn({ background: DS.positive, border: `1px solid ${DS.positiveBorder}`, ...o });
const inputS = (o) => ({
  width: "100%", background: DS.bgInput, border: `1px solid ${DS.borderSubtle}`,
  borderRadius: DS.rSm, padding: "10px 13px", color: DS.textPrimary,
  fontSize: DS.fsMd, fontFamily: DS.font, boxSizing: "border-box", outline: "none",
  transition: DS.transQuick, ...o,
});
const card = (o) => ({
  background: DS.bgCardGlass, border: "none",
  borderRadius: DS.rMd, padding: `${DS.lg}px`, marginBottom: DS.lg, ...o,
});
const label = (o) => ({
  display: "block", fontSize: DS.fsXs, fontWeight: 600, color: DS.textSecondary,
  letterSpacing: "0.02em", marginBottom: DS.xs, ...o,
});
const sectionHead = (o) => ({
  fontWeight: 700, fontSize: DS.fsXs, color: DS.textMuted,
  letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: DS.md, ...o,
});

// ═══════════════════════════════════════════════════════════════
//  FONTS
// ═══════════════════════════════════════════════════════════════
const FONTS = [
  { name:"DM Sans",    weights:"400;500;600;700" },
  { name:"Lora",       weights:"400;500;600;700", ital:true },
];

function loadFont(name) {
  const id = "gf-" + name.replace(/ /g, "-");
  if (document.getElementById(id)) return;
  const entry = FONTS.find(f=>f.name===name)||FONTS[0];
  const l = document.createElement("link");
  l.id = id; l.rel = "stylesheet";
  if (entry.ital) {
    const wArr = entry.weights.split(";");
    const axes = wArr.map(w=>`0,${w}`).concat(wArr.map(w=>`1,${w}`)).join(";");
    l.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g,"+")}:ital,wght@${axes}&display=swap`;
  } else {
    l.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g,"+")}:wght@${entry.weights}&display=swap`;
  }
  document.head.appendChild(l);
}

// ═══════════════════════════════════════════════════════════════
//  ASPECT RATIOS
// ═══════════════════════════════════════════════════════════════
const RATIOS = {
  "16:9":    { W:1920, H:1080, label:"16:9",     hint:"YouTube / Premiere" },
  "iPad Pro":{ W:2388, H:1668, label:"iPad Pro",  hint:"iPad Pro 11\u2033 / 13\u2033" },
  "4:3":     { W:1440, H:1080, label:"4:3",       hint:"iPad / Presentation" },
  "1:1":     { W:1080, H:1080, label:"1:1",       hint:"Instagram Feed"     },
  "9:16":    { W:1080, H:1920, label:"9:16",      hint:"TikTok / Reels"     },
};

// ═══════════════════════════════════════════════════════════════
//  CPS HOMES BRAND
// ═══════════════════════════════════════════════════════════════
const BRAND = {
  colorPrimary:  "#335F6A",
  colorAccent:   "#FB8770",
  colorPositive: "#83A381",
  colorText:     "#FFFFFF",
  colorWarm:     "#F2E6D8",
  colorForest:   "#445A46",
  colorOlive:    "#A7A740",
  fontFamily:    "DM Sans",
  fontSerif:     "Lora",
  channelName:   "CPS Homes",
  cornerRadius:  20,
  logoUrl:       "/demos/cpshomes-logo-teal.png",
  logoUrlLight:  "/demos/cpshomes-logo-white.png",
  logoOpacity:   0.90,
  logoSize:      0.14,
};

// Game-specific palette — derived from CPS Homes brand
const GAME = {
  gold:      "#FB8770",   // salmon — primary accent (was generic gold)
  goldDark:  "#D96B58",   // darker salmon
  goldLight: "#F2E6D8",   // warm cream — secondary accent
  navy:      "#1E3A40",   // dark teal (deeper than brand primary)
  navyMid:   "#2A4F57",   // mid teal
  optionA:   "#FB8770",   // salmon
  optionB:   "#335F6A",   // deep teal
  optionC:   "#83A381",   // sage green
};

// ═══════════════════════════════════════════════════════════════
//  IMAGE CACHE
// ═══════════════════════════════════════════════════════════════
const IMG_CACHE = {};
let _imgLoadCallback = null; // set by component to trigger re-render on image load
function getCachedImage(src) {
  if (!src) return null;
  if (IMG_CACHE[src]) return IMG_CACHE[src].complete ? IMG_CACHE[src] : null;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => { if (_imgLoadCallback) _imgLoadCallback(); };
  img.src = src;
  IMG_CACHE[src] = img;
  return img.complete ? img : null;
}

// ═══════════════════════════════════════════════════════════════
//  EPISODE DATA — persistence layer
// ═══════════════════════════════════════════════════════════════
const LS_KEY = "gtp_episodes_v1";

function emptyRound(n, propertyAgent, guesser) {
  return {
    number: n, propertyAgent, guesser,
    address: "", location: "",
    rightmoveUrl: "",
    beds: 0, type: "", tenure: "", addedDate: "",
    optionA: "", optionB: "", optionC: "",
    correctLetter: "A", correctPrice: "",
    photos: [],        // base64 dataURL strings (compressed, up to 20)
    heroPhotoIndex: 0, // which photo is the main graphic
    notes: "",
  };
}

// Compress uploaded photo — high res for iPad Pro display (2388×1668)
function compressPhoto(file, existingCount = 0) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 2400; // covers iPad Pro width
        const quality = 0.85;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const cx = canvas.getContext("2d");
        cx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function createDefaultEpisode(episodeNum = 1) {
  return {
    id: Date.now(),
    show: "Guess the Listing Price",
    brand: "CPS Homes",
    episode: episodeNum,
    agents: ["Sian", "Nathan"],
    agentImages: ["", ""],
    logoImage: "",  // URL or base64 of custom show logo PNG
    scores: [0, 0],
    createdAt: new Date().toISOString(),
    rounds: [
      {
        number: 1, propertyAgent: "Nathan", guesser: "Sian",
        address: "Arabella Street, Roath, Cardiff, CF24", location: "Roath, Cardiff",
        rightmoveUrl: "https://www.rightmove.co.uk/properties/173783180",
        beds: 3, type: "Terraced", tenure: "Freehold", addedDate: "27/03/2026",
        optionA: "\u00a3285,000", optionB: "\u00a3325,000", optionC: "\u00a3369,950",
        correctLetter: "B", correctPrice: "325,000",
        photos: [], heroPhotoIndex: 0, notes: "",
      },
      {
        number: 2, propertyAgent: "Nathan", guesser: "Sian",
        address: "Pen-Y-Lan Terrace, Penylan, Cardiff, CF23", location: "Penylan, Cardiff",
        rightmoveUrl: "https://www.rightmove.co.uk/properties/173735222",
        beds: 3, type: "End of terrace", tenure: "Freehold", addedDate: "26/03/2026",
        optionA: "\u00a3375,000", optionB: "\u00a3425,000", optionC: "\u00a3450,000",
        correctLetter: "C", correctPrice: "450,000",
        photos: [], heroPhotoIndex: 0, notes: "",
      },
      {
        number: 3, propertyAgent: "Nathan", guesser: "Sian",
        address: "Rhigos Gardens, Cathays, Cardiff, CF24", location: "Cathays, Cardiff",
        rightmoveUrl: "https://www.rightmove.co.uk/properties/173648561",
        beds: 4, type: "Terraced", tenure: "Freehold", addedDate: "24/03/2026",
        optionA: "\u00a3450,000", optionB: "\u00a3375,000", optionC: "\u00a3299,950",
        correctLetter: "A", correctPrice: "450,000",
        photos: [], heroPhotoIndex: 0, notes: "4 bed 2 bath \u2014 Cathays at \u00a3450k will surprise Sian.",
      },
      {
        number: 4, propertyAgent: "Sian", guesser: "Nathan",
        address: "Machen Street, Penarth, CF64", location: "Penarth",
        rightmoveUrl: "https://www.rightmove.co.uk/properties/173540561",
        beds: 2, type: "Terraced", tenure: "Freehold", addedDate: "20/03/2026",
        optionA: "\u00a3289,950", optionB: "\u00a3359,950", optionC: "\u00a3325,000",
        correctLetter: "C", correctPrice: "325,000",
        photos: [], heroPhotoIndex: 0, notes: "Guide price \u00a3325,000",
      },
      {
        number: 5, propertyAgent: "Sian", guesser: "Nathan",
        address: "Jubilee Street, Cardiff, CF11", location: "Canton, Cardiff",
        rightmoveUrl: "https://www.rightmove.co.uk/properties/173743049",
        beds: 3, type: "Terraced", tenure: "Freehold", addedDate: "26/03/2026",
        optionA: "\u00a3260,000", optionB: "\u00a3295,000", optionC: "\u00a3225,000",
        correctLetter: "A", correctPrice: "260,000",
        photos: [], heroPhotoIndex: 0, notes: "",
      },
      {
        number: 6, propertyAgent: "Sian", guesser: "Nathan",
        address: "Venice House, Judkin Court, Century Wharf, Cardiff, CF10", location: "Century Wharf, Cardiff",
        rightmoveUrl: "https://www.rightmove.co.uk/properties/161943674",
        beds: 2, type: "Flat", tenure: "Leasehold", addedDate: "28/03/2026",
        optionA: "\u00a3235,000", optionB: "\u00a3270,000", optionC: "\u00a3310,000",
        correctLetter: "B", correctPrice: "270,000",
        photos: [], heroPhotoIndex: 0, notes: "Offers in excess of \u00a3270,000 \u2014 reduced. 2 bed 2 bath flat, 1,247 sq ft.",
      },
    ],
  };
}

function loadEpisodes() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

let _saveWarning = null; // surfaced via setSaveStatus if set
function saveEpisodes(episodes, activeId) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ episodes, activeEpisodeId: activeId }));
    _saveWarning = null;
  } catch {
    _saveWarning = "Storage full — remove some photos";
  }
}

// EPISODE is kept as a module-level ref so draw functions can read it without props
let EPISODE = createDefaultEpisode();

// BroadcastChannel for instant same-browser sync between editor and /live
const GTP_CHANNEL_NAME = "gtp-live-sync";

// ═══════════════════════════════════════════════════════════════
//  ASSET TYPES
// ═══════════════════════════════════════════════════════════════
const ASSETS = [
  { id: "intro",      label: "Intro Title",    icon: "\u25b6", animated: true },
  { id: "roundtitle", label: "Round Title",     icon: "#", animated: true },
  { id: "property",   label: "Property Frame",  icon: "\ud83c\udfe0", animated: true },
  { id: "prompt",    label: "Audience Prompt", icon: "\u2753", animated: true },
  { id: "options",   label: "A/B/C Options",   icon: "\ud83c\udfaf", animated: true },
  { id: "lockin",    label: "Lock-In",         icon: "\ud83d\udd12", animated: true },
  { id: "timer",     label: "Countdown",       icon: "\u23f1", animated: true },
  { id: "reveal",    label: "Price Reveal",    icon: "\ud83c\udf89", animated: true },
  { id: "scoreboard",label: "Scoreboard",      icon: "\ud83c\udfc6", animated: true },
];

// ═══════════════════════════════════════════════════════════════
//  LIVE MODE — flow + touch detection
// ═══════════════════════════════════════════════════════════════
const LIVE_FLOW = ["roundtitle", "property", "prompt", "options", "lockin", "timer", "reveal", "scoreboard"];

let _touchStart = null;
function detectGesture(sx, sy, ex, ey, elapsed) {
  const dx = ex - sx, dy = ey - sy;
  if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return "tap";
  if (elapsed > 500) return null;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50)
    return dx > 0 ? "swipe-right" : "swipe-left";
  return null;
}

// ═══════════════════════════════════════════════════════════════
//  CANVAS HELPERS
// ═══════════════════════════════════════════════════════════════
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawStamp(ctx, W, H) {
  const logo = getCachedImage(BRAND.logoUrlLight);
  if (!logo || !logo.complete || !logo.naturalWidth) return;
  const ar = H > W ? "portrait" : W === H ? "square" : "landscape";
  const logoScale = ar === "portrait" ? 0.20 : ar === "square" ? 0.18 : BRAND.logoSize;
  const logoW = W * logoScale;
  const logoH = logoW * (logo.naturalHeight / logo.naturalWidth);
  const pad = W * 0.05; // 5% from edges — comfortable breathing room
  const bottomPad = ar === "portrait" ? Math.round(420 * (W / 1080)) + pad : H * 0.05;
  ctx.save();
  ctx.globalAlpha = BRAND.logoOpacity;
  ctx.drawImage(logo, W - logoW - pad, H - logoH - bottomPad, logoW, logoH);
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  DRAW HELPERS — social-media optimised
// ═══════════════════════════════════════════════════════════════

// Detect aspect: "portrait" (9:16), "square" (1:1), "landscape" (16:9)
function aspect(W, H) { return H > W ? "portrait" : W === H ? "square" : "landscape"; }

// Responsive size — use min(W,H) so text stays readable across all ratios
function sz(W, H, frac) { return Math.round(Math.min(W, H) * frac); }

// ── Social media safe zones (9:16 = 1080x1920) ──────────────
// These are the worst-case (paid ad) margins that work across TikTok + Reels.
// Returns pixel values scaled to the actual canvas size.
function safeZone(W, H) {
  if (H <= W) return { top: 0, bottom: 0, left: 0, right: 0, cx: W / 2, contentTop: 0, contentBottom: H };
  // Portrait: scale from 1080x1920 reference
  const scale = W / 1080;
  return {
    top:    Math.round(220 * scale),   // paid-safe: 220px on 1080w
    bottom: Math.round(420 * scale),   // caption/music/username
    left:   Math.round(60 * scale),    // left margin
    right:  Math.round(120 * scale),   // right margin (TikTok action buttons)
    cx: W / 2,                         // center x
    contentTop:    Math.round(220 * scale),
    contentBottom: H - Math.round(420 * scale),
  };
}

// Background with subtle radial glow
function drawBg(ctx, W, H) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, GAME.navy);
  grad.addColorStop(0.5, GAME.navyMid);
  grad.addColorStop(1, GAME.navy);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  // Radial glow from center
  const glow = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.max(W, H) * 0.6);
  glow.addColorStop(0, "rgba(51,95,106,0.25)");
  glow.addColorStop(1, "rgba(51,95,106,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
}

// Accent bars — top and bottom salmon strips
function drawAccentBars(ctx, W, H) {
  const barH = Math.max(4, H * 0.005);
  ctx.fillStyle = GAME.gold;
  ctx.fillRect(0, 0, W, barH);
  ctx.fillRect(0, H - barH, W, barH);
}

// Easing: elastic out for punchy entrances
function easeOutBack(t) { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

// ═══════════════════════════════════════════════════════════════
//  DRAW FUNCTIONS — social-first, ratio-adaptive
// ═══════════════════════════════════════════════════════════════

function drawIntro(ctx, W, H, S, progress) {
  const p = progress ?? 1;
  drawBg(ctx, W, H);
  drawAccentBars(ctx, W, H);
  const ar = aspect(W, H);
  const safe = safeZone(W, H);
  const unit = sz(W, H, 1);

  // ── Animated question marks — drift, rotate, pulse ──
  const qMarks = [
    { x: 0.12, y: 0.22, size: 0.30, rot: -0.15, drift: -0.04 },
    { x: 0.88, y: 0.72, size: 0.28, rot: 0.12, drift: -0.03 },
    { x: 0.50, y: 0.46, size: 0.50, rot: 0.08, drift: -0.05 },
    { x: 0.30, y: 0.65, size: 0.18, rot: -0.2, drift: -0.02 },
    { x: 0.75, y: 0.30, size: 0.22, rot: 0.18, drift: -0.035 },
  ];
  for (const q of qMarks) {
    ctx.save();
    const qAlpha = 0.02 + 0.02 * Math.sin(p * Math.PI * 2 + q.x * 10);
    ctx.globalAlpha = qAlpha;
    const yOff = q.drift * p * H;
    ctx.translate(W * q.x, H * q.y + yOff);
    ctx.rotate(q.rot + p * 0.3 * q.rot);
    ctx.font = `800 ${Math.round(unit * q.size)}px 'Lora', serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", 0, 0);
    ctx.restore();
  }

  // ── Diagonal energy stripe ──
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = GAME.gold;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.55);
  ctx.lineTo(W, H * 0.35);
  ctx.lineTo(W, H * 0.42);
  ctx.lineTo(0, H * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const safeH = ar === "portrait" ? safe.contentBottom - safe.contentTop : H;
  const safeTop = ar === "portrait" ? safe.contentTop : 0;

  // ── Logo / Title ──
  const logoSrc = EPISODE.logoImage;
  const logoImg = logoSrc ? getCachedImage(logoSrc) : null;
  const titleAreaTop = ar === "portrait" ? safeTop + safeH * 0.02 : H * 0.06;
  const titleAreaH = ar === "portrait" ? safeH * 0.35 : H * 0.38;

  // Entrance timing: logo 0-0.4, headshots 0.3-0.7, VS 0.5-0.8
  const logoP = Math.min(1, p / 0.4);
  const headshotP = Math.min(1, Math.max(0, (p - 0.3) / 0.4));
  const vsP = Math.min(1, Math.max(0, (p - 0.5) / 0.3));

  if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
    // ── Custom logo PNG — contain-fit in title area ──
    const maxLogoW = W * 0.65;
    const maxLogoH = titleAreaH;
    const iw = logoImg.naturalWidth, ih = logoImg.naturalHeight;
    const eLogoP = easeOutExpo(logoP);
    const logoScale = Math.min(maxLogoW / iw, maxLogoH / ih) * (0.85 + 0.15 * eLogoP);
    const dw = iw * logoScale, dh = ih * logoScale;
    ctx.save();
    ctx.globalAlpha = eLogoP;
    ctx.drawImage(logoImg, (W - dw) / 2, titleAreaTop + (titleAreaH - dh) / 2, dw, dh);
    ctx.restore();
  } else {
    // ── Fallback: canvas-drawn title ──
    const eLogoP = easeOutExpo(logoP);
    const guessY = ar === "portrait" ? safeTop + safeH * 0.08 : H * 0.18;
    const guessS = sz(W, H, ar === "portrait" ? 0.045 : 0.038);
    ctx.save();
    ctx.globalAlpha = eLogoP;
    ctx.font = `800 ${guessS}px 'DM Sans', sans-serif`;
    ctx.fillStyle = GAME.gold;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.letterSpacing = `${Math.round(guessS * 0.35)}px`;
    ctx.fillText("GUESS THE", W / 2, guessY);
    ctx.restore();

    const priceY = ar === "portrait" ? safeTop + safeH * 0.20 : H * 0.34;
    const priceS = sz(W, H, ar === "portrait" ? 0.16 : 0.14);
    ctx.save();
    ctx.font = `900 ${priceS}px 'Lora', serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = priceS * 0.08;
    ctx.shadowOffsetY = priceS * 0.03;
    ctx.fillStyle = BRAND.colorWarm;
    ctx.fillText("PRICE", W / 2, priceY);
    ctx.shadowColor = "transparent";
    ctx.restore();

    const lineY = priceY + priceS * 0.45;
    const lineW = W * 0.25;
    ctx.fillStyle = GAME.gold;
    roundRect(ctx, W / 2 - lineW / 2, lineY, lineW, Math.max(3, H * 0.004), 2);
    ctx.fill();
  }

  // ── VS section — DRAMATIC, big headshots, tight layout ──
  const vsY = ar === "portrait" ? safeTop + safeH * 0.55 : H * 0.62;
  const headR = sz(W, H, ar === "portrait" ? 0.13 : 0.10); // MUCH bigger headshots
  const spread = ar === "portrait" ? W * 0.24 : W * 0.18;

  const leftX = W / 2 - spread;
  const rightX = W / 2 + spread;

  // Get current round to determine roles
  const introRound = EPISODE.rounds ? EPISODE.rounds[(S.propRound || 1) - 1] : null;

  // Draw headshot with glow ring, shadow, name, and role icon
  const drawHeadshot = (x, y, imgUrl, name, idx) => {
    const isGuesser = introRound && introRound.guesser === name;
    const isPropertyAgent = introRound && introRound.propertyAgent === name;
    const img = imgUrl ? getCachedImage(imgUrl) : null;
    const imgReady = img && img.complete && img.naturalWidth > 0;

    // Only show headshot elements when image is loaded (or no image URL set)
    const showCircle = imgReady || !imgUrl;

    if (showCircle) {
      // Dramatic shadow behind circle
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = headR * 0.5;
      ctx.shadowOffsetY = headR * 0.1;
      ctx.beginPath();
      ctx.arc(x, y, headR, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.01)";
      ctx.fill();
      ctx.restore();

      // Thick outer glow ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, headR + headR * 0.08, 0, Math.PI * 2);
      ctx.strokeStyle = GAME.gold;
      ctx.lineWidth = headR * 0.08;
      ctx.shadowColor = GAME.gold;
      ctx.shadowBlur = headR * 0.3;
      ctx.stroke();
      ctx.restore();

      // Image or initial letter
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, headR, 0, Math.PI * 2);
      ctx.closePath();
      if (imgReady) {
        ctx.clip();
        const iw = img.naturalWidth, ih = img.naturalHeight;
        const scale = Math.max(headR * 2 / iw, headR * 2 / ih);
        const dw = iw * scale, dh = ih * scale;
        ctx.drawImage(img, x - dw / 2, y - dh / 2, dw, dh);
      } else {
        const pg = ctx.createRadialGradient(x, y, 0, x, y, headR);
        pg.addColorStop(0, idx === 0 ? BRAND.colorAccent : BRAND.colorPositive);
        pg.addColorStop(1, idx === 0 ? "#c2564a" : "#5a7a58");
        ctx.fillStyle = pg;
        ctx.fill();
        ctx.font = `800 ${headR * 0.8}px 'DM Sans', sans-serif`;
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(name.charAt(0).toUpperCase(), x, y);
      }
      ctx.restore();
    }

    // Name — BIG and bold
    const nameS = sz(W, H, ar === "portrait" ? 0.05 : 0.042);
    const nameY = y + headR + headR * 0.2;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 8;
    ctx.font = `800 ${nameS}px 'DM Sans', sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(name.toUpperCase(), x, nameY);
    ctx.restore();

    // Role badge — pill with label
    const badgeY = nameY + nameS * 1.8;
    const badgeS = sz(W, H, 0.015);
    const badgeText = isGuesser ? "GUESSING" : isPropertyAgent ? "PROPERTY CHOICE" : "";
    if (badgeText) {
      ctx.save();
      ctx.font = `700 ${badgeS}px 'DM Sans', sans-serif`;
      const tw = ctx.measureText(badgeText).width;
      const pillW = tw + badgeS * 2;
      const pillH = badgeS * 2;
      // Pill background
      ctx.fillStyle = isGuesser ? GAME.gold : "rgba(255,255,255,0.15)";
      roundRect(ctx, x - pillW / 2, badgeY - pillH / 2, pillW, pillH, pillH / 2);
      ctx.fill();
      // Text
      ctx.fillStyle = isGuesser ? "#000" : "rgba(255,255,255,0.7)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(badgeText, x, badgeY);
      ctx.restore();
    }
  };

  const eHP = easeOutExpo(headshotP);
  const slideOffset = W * 0.2 * (1 - eHP);
  ctx.save();
  ctx.globalAlpha = eHP;
  drawHeadshot(leftX - slideOffset, vsY, EPISODE.agentImages?.[0], EPISODE.agents[0], 0);
  drawHeadshot(rightX + slideOffset, vsY, EPISODE.agentImages?.[1], EPISODE.agents[1], 1);
  ctx.restore();

  // ── "VS" badge — BIGGER, more dramatic ──
  const eVP = easeOutBack(vsP);
  const vsR = sz(W, H, ar === "portrait" ? 0.06 : 0.05) * eVP;
  if (vsP > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, vsP * 2);
    // Glow behind VS
    ctx.shadowColor = GAME.gold;
    ctx.shadowBlur = vsR * 0.8;
    ctx.beginPath();
    ctx.arc(W / 2, vsY, vsR, 0, Math.PI * 2);
    ctx.fillStyle = GAME.navy;
    ctx.fill();
    ctx.strokeStyle = GAME.gold;
    ctx.lineWidth = vsR * 0.1;
    ctx.stroke();
    ctx.shadowColor = "transparent";
    ctx.font = `900 ${vsR * 0.9}px 'DM Sans', sans-serif`;
    ctx.fillStyle = GAME.gold;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("VS", W / 2, vsY);
    ctx.restore();
  }

  drawStamp(ctx, W, H);
}

function drawProperty(ctx, W, H, S, progress) {
  const p = progress ?? 1;
  ctx.clearRect(0, 0, W, H);
  if (!S.propAddress) return;
  const ar = aspect(W, H);

  const safe = safeZone(W, H);

  // Draw photos — cycles through all photos with crossfade
  const rd = EPISODE.rounds ? EPISODE.rounds[S.propRound - 1] : null;
  const photos = rd?.photos || [];
  const numPhotos = Math.max(1, photos.length);

  // Helper: draw a single photo cover-fit with Ken Burns zoom
  const drawPhoto = (src, localP, alpha, photoI) => {
    const img = src ? getCachedImage(src) : null;
    if (!img || !img.complete || !img.naturalWidth) return;
    const iw = img.naturalWidth, ih = img.naturalHeight;

    const isFloorplan = photoI === (rd?.floorplanIndex ?? -1);

    ctx.save();
    ctx.globalAlpha = alpha;

    if (isFloorplan) {
      // White background with generous padding
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
      const pad = W * 0.15;
      const fitScale = Math.min((W - pad * 2) / iw, (H - pad * 2) / ih);
      const dw = iw * fitScale, dh = ih * fitScale;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
      // Normal cover-fit with Ken Burns zoom
      const zoomScale = 1.0 + 0.04 * localP;
      const scale = Math.max(W / iw, H / ih) * zoomScale;
      const dw = iw * scale, dh = ih * scale;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    }
    ctx.restore();
  };

  // Calculate which photo we're on and crossfade progress
  const rawIdx = p * numPhotos;
  const photoIdx = Math.min(numPhotos - 1, Math.floor(rawIdx));
  const photoLocalP = rawIdx - photoIdx; // 0-1 within this photo's time
  const crossfadeDuration = 0.15; // 15% of each photo's slot = smooth crossfade

  if (numPhotos <= 1) {
    drawPhoto(photos[0] || photos[rd?.heroPhotoIndex || 0], p, 1, 0);
  } else {
    if (photoIdx > 0 && photoLocalP < crossfadeDuration) {
      const fadeOut = 1 - easeOutExpo(photoLocalP / crossfadeDuration);
      drawPhoto(photos[photoIdx - 1], 1, fadeOut, photoIdx - 1);
    }
    const fadeIn = photoIdx === 0 ? 1 : (photoLocalP < crossfadeDuration ? easeOutExpo(photoLocalP / crossfadeDuration) : 1);
    drawPhoto(photos[photoIdx], photoLocalP, fadeIn, photoIdx);
  }
  // Darken bottom for readability
  const grad = ctx.createLinearGradient(0, H * 0.4, 0, H);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.6, "rgba(0,0,0,0.4)");
  grad.addColorStop(1, "rgba(0,0,0,0.75)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  // Bar appears when the second photo starts (first photo is clean full-screen)
  const barStart = numPhotos > 1 ? 1 / numPhotos : 0;
  const barP = easeOutExpo(Math.min(1, Math.max(0, (p - barStart) / 0.02)));

  const barSlide = H * 0.03 * (1 - barP);
  ctx.save();
  ctx.globalAlpha = barP;
  ctx.translate(0, barSlide);

  // Get property specs from round data (reuse rd from hero photo section above)
  const specParts = [];
  if (rd?.beds) specParts.push(`${rd.beds} bed`);
  if (rd?.type) specParts.push(rd.type);
  if (rd?.tenure) specParts.push(rd.tenure);
  if (rd?.addedDate) specParts.push(`Added ${rd.addedDate}`);
  const specText = specParts.join("  \u00b7  ");

  if (ar === "portrait") {
    const cardH = H * 0.10;
    const pad = Math.max(W * 0.05, safe.left);
    const cardY = safe.contentBottom - cardH - W * 0.03;

    ctx.fillStyle = "rgba(30, 58, 64, 0.92)";
    roundRect(ctx, pad, cardY, W - pad * 2, cardH, BRAND.cornerRadius);
    ctx.fill();

    // Round badge
    const bSize = W * 0.09;
    const bx = W / 2;
    const by = cardY - bSize * 0.6;
    ctx.fillStyle = GAME.gold;
    ctx.beginPath();
    ctx.arc(bx, by, bSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `700 ${Math.round(bSize * 0.45)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`R${S.propRound || 1}`, bx, by);

    // Address
    ctx.font = `700 ${sz(W, H, 0.028)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = BRAND.colorText;
    ctx.textAlign = "center";
    ctx.fillText(S.propAddress.split(",")[0], W / 2, cardY + cardH * 0.30);

    // Location
    ctx.font = `500 ${sz(W, H, 0.020)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = GAME.goldLight;
    ctx.fillText(S.optionLocation || "", W / 2, cardY + cardH * 0.55);

    // Specs
    if (specText) {
      ctx.font = `500 ${sz(W, H, 0.016)}px 'DM Sans', sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText(specText, W / 2, cardY + cardH * 0.78);
    }
  } else {
    // Landscape/square: compact bottom bar with show logo
    const barH = H * 0.08;
    const pad = W * 0.03;
    const barY = H - barH - pad;

    ctx.fillStyle = "rgba(30, 58, 64, 0.92)";
    roundRect(ctx, pad, barY, W - pad * 2, barH, BRAND.cornerRadius);
    ctx.fill();

    // Round badge
    const bSize = Math.min(W, H) * 0.04;
    const bx = pad + bSize + pad * 0.3;
    const by = barY + barH / 2;
    ctx.fillStyle = GAME.gold;
    ctx.beginPath();
    ctx.arc(bx, by, bSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `700 ${Math.round(bSize * 0.5)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`R${S.propRound || 1}`, bx, by);

    // Address + specs — single line, compact
    const ax = bx + bSize;
    ctx.font = `700 ${sz(W, H, 0.020)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = BRAND.colorText;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const addrShort = S.propAddress ? S.propAddress.split(",")[0] : "";
    const fullInfo = [addrShort, S.optionLocation, specText].filter(Boolean).join("  \u00b7  ");
    ctx.fillText(fullInfo, ax, by);

    // Show logo on right side (if uploaded)
    const showLogoSrc = EPISODE.logoImage;
    const showLogoImg = showLogoSrc ? getCachedImage(showLogoSrc) : null;
    if (showLogoImg && showLogoImg.complete && showLogoImg.naturalWidth > 0) {
      const maxLH = barH * 0.7;
      const lScale = maxLH / showLogoImg.naturalHeight;
      const lw = showLogoImg.naturalWidth * lScale;
      const lh = showLogoImg.naturalHeight * lScale;
      ctx.drawImage(showLogoImg, W - pad - lw - pad * 0.5, barY + (barH - lh) / 2, lw, lh);
    }
  }
  ctx.restore(); // barP animation
}

// ── Live mode: Photo gallery with Ken Burns entrance ──
function drawPropertyGallery(ctx, W, H, S, photoSrc, animT, photoIdx, totalPhotos) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  const ar = aspect(W, H);
  const safe = safeZone(W, H);
  const heroImg = photoSrc ? getCachedImage(photoSrc) : null;

  if (heroImg && heroImg.complete && heroImg.naturalWidth > 0) {
    const iw = heroImg.naturalWidth, ih = heroImg.naturalHeight;
    // Ken Burns: subtle zoom + horizontal pan
    const zoomScale = 1.0 + 0.08 * animT;
    const panX = (animT - 0.5) * W * 0.02;
    const baseScale = Math.max(W / iw, H / ih) * zoomScale;
    const dw = iw * baseScale, dh = ih * baseScale;
    ctx.drawImage(heroImg, (W - dw) / 2 + panX, (H - dh) / 2, dw, dh);
  } else {
    // No photo placeholder
    drawBg(ctx, W, H);
    ctx.font = `600 ${sz(W, H, 0.03)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("No photo", W / 2, H / 2);
  }

  // Bottom gradient overlay
  const grad = ctx.createLinearGradient(0, H * 0.45, 0, H);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.5, "rgba(0,0,0,0.35)");
  grad.addColorStop(1, "rgba(0,0,0,0.8)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Build spec text from S fields
  const specParts = [];
  if (S.propBeds) specParts.push(`${S.propBeds} bed`);
  if (S.propType) specParts.push(S.propType);
  if (S.propTenure) specParts.push(S.propTenure);
  if (S.propAddedDate) specParts.push(`Added ${S.propAddedDate}`);
  const specText = specParts.join("  \u00b7  ");

  const pad = W * 0.03;

  if (ar === "portrait") {
    // Portrait: card-style bar
    const cardH = H * 0.10;
    const cardY = safe.contentBottom - cardH - W * 0.03;

    ctx.fillStyle = "rgba(30, 58, 64, 0.92)";
    roundRect(ctx, pad, cardY, W - pad * 2, cardH, BRAND.cornerRadius);
    ctx.fill();

    const bSize = W * 0.09;
    const bx = W / 2;
    const by = cardY - bSize * 0.6;
    ctx.fillStyle = GAME.gold;
    ctx.beginPath();
    ctx.arc(bx, by, bSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `700 ${Math.round(bSize * 0.45)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`R${S.propRound || 1}`, bx, by);

    ctx.font = `700 ${sz(W, H, 0.028)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = BRAND.colorText;
    ctx.fillText(S.propAddress || "", W / 2, cardY + cardH * 0.32);
    ctx.font = `500 ${sz(W, H, 0.020)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = GAME.goldLight;
    ctx.fillText(S.optionLocation || "", W / 2, cardY + cardH * 0.58);
    if (specText) {
      ctx.font = `500 ${sz(W, H, 0.016)}px 'DM Sans', sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText(specText, W / 2, cardY + cardH * 0.78);
    }
  } else {
    // Landscape/square: compact bar with logo
    const barH = H * 0.08;
    const barY = H - barH - pad;

    ctx.fillStyle = "rgba(30, 58, 64, 0.92)";
    roundRect(ctx, pad, barY, W - pad * 2, barH, BRAND.cornerRadius);
    ctx.fill();

    const bSize = Math.min(W, H) * 0.04;
    const bx = pad + bSize + pad * 0.3;
    const by = barY + barH / 2;
    ctx.fillStyle = GAME.gold;
    ctx.beginPath();
    ctx.arc(bx, by, bSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `700 ${Math.round(bSize * 0.5)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`R${S.propRound || 1}`, bx, by);

    const ax = bx + bSize;
    ctx.font = `700 ${sz(W, H, 0.020)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = BRAND.colorText;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const addrShort = S.propAddress ? S.propAddress.split(",")[0] : "";
    const fullInfo = [addrShort, S.optionLocation, specText].filter(Boolean).join("  \u00b7  ");
    ctx.fillText(fullInfo, ax, by);

    // Show logo on right side
    const showLogoImg = EPISODE.logoImage ? getCachedImage(EPISODE.logoImage) : null;
    if (showLogoImg && showLogoImg.complete && showLogoImg.naturalWidth > 0) {
      const maxLH = barH * 0.7;
      const lScale = maxLH / showLogoImg.naturalHeight;
      const lw = showLogoImg.naturalWidth * lScale;
      const lh = showLogoImg.naturalHeight * lScale;
      ctx.drawImage(showLogoImg, W - pad - lw - pad * 0.5, barY + (barH - lh) / 2, lw, lh);
    }
  }

  // Photo counter pill — top right
  if (totalPhotos > 1) {
    const pillText = `${photoIdx + 1} / ${totalPhotos}`;
    ctx.font = `600 ${sz(W, H, 0.018)}px 'DM Sans', sans-serif`;
    const tw = ctx.measureText(pillText).width;
    const px = W - pad - tw - 20;
    const py = pad + 12;
    roundRect(ctx, px, py - 10, tw + 20, 24, 12);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pillText, px + (tw + 20) / 2, py + 2);
  }
}

function drawPrompt(ctx, W, H, _S, progress) {
  const p = progress ?? 1;
  // Transparent background — this is an overlay for the video edit
  ctx.clearRect(0, 0, W, H);
  const ar = aspect(W, H);
  const safe = safeZone(W, H);
  const safeH = ar === "portrait" ? safe.contentBottom - safe.contentTop : H;
  const safeTop = ar === "portrait" ? safe.contentTop : 0;

  // Subtle dark vignette for readability over footage
  const vig = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
  vig.addColorStop(0, "rgba(0,0,0,0.2)");
  vig.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Animated "?" — scales up and fades, with glow
  const qMarkP = easeOutExpo(Math.min(1, p / 0.6));
  ctx.save();
  ctx.globalAlpha = 0.12 * qMarkP;
  ctx.translate(W / 2, H * 0.42);
  ctx.rotate((1 - qMarkP) * -0.2);
  const qMarkSz = sz(W, H, 0.8) * (0.6 + 0.4 * qMarkP);
  ctx.font = `800 ${Math.round(qMarkSz)}px 'Lora', serif`;
  ctx.fillStyle = GAME.gold;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("?", 0, 0);
  ctx.restore();

  // Main question — HUGE — fades + scales in
  const textP = easeOutExpo(Math.min(1, p / 0.5));
  ctx.save();
  ctx.globalAlpha = textP;
  const qY = ar === "portrait" ? safeTop + safeH * 0.25 : H * 0.32;
  const qs = sz(W, H, ar === "portrait" ? 0.11 : 0.095);
  ctx.font = `700 ${qs}px 'Lora', serif`;
  ctx.fillStyle = BRAND.colorWarm;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Text shadow for readability over footage
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = qs * 0.15;
  if (ar === "portrait") {
    ctx.fillText("Which one", W / 2, qY - qs * 0.55);
    ctx.fillText("is it?", W / 2, qY + qs * 0.55);
  } else {
    ctx.fillText("Which one is it?", W / 2, qY);
  }
  ctx.shadowColor = "transparent";

  // Subtitle
  ctx.font = `500 ${sz(W, H, 0.028)}px 'DM Sans', sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("Choose A, B, or C", W / 2, ar === "portrait" ? safeTop + safeH * 0.40 : H * 0.47);
  ctx.restore();

  // Option pills — larger, with more presence
  const isVert = ar === "portrait";
  const letters = ["A", "B", "C"];
  const colors = [GAME.optionA, GAME.optionB, GAME.optionC];
  if (isVert) {
    // Stack vertically — within safe zone
    const pw = W * 0.55, ph = W * 0.12, gap2 = W * 0.04;
    const startY = safeTop + safeH * 0.52;
    for (let i = 0; i < 3; i++) {
      const py = startY + i * (ph + gap2);
      ctx.fillStyle = colors[i];
      roundRect(ctx, W / 2 - pw / 2, py, pw, ph, ph / 2);
      ctx.fill();
      ctx.font = `800 ${Math.round(ph * 0.5)}px 'DM Sans', sans-serif`;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(letters[i], W / 2, py + ph / 2);
    }
  } else {
    // Horizontal row
    const pw = W * 0.1, ph = H * 0.08, gap2 = W * 0.025;
    const sx = W / 2 - (pw * 3 + gap2 * 2) / 2;
    const py = H * 0.64;
    for (let i = 0; i < 3; i++) {
      const px = sx + i * (pw + gap2);
      ctx.fillStyle = colors[i];
      roundRect(ctx, px, py, pw, ph, ph / 2);
      ctx.fill();
      ctx.font = `800 ${Math.round(ph * 0.5)}px 'DM Sans', sans-serif`;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(letters[i], px + pw / 2, py + ph / 2);
    }
  }
  drawStamp(ctx, W, H);
}

function drawOptions(ctx, W, H, S, progress) {
  const p = progress ?? 1;
  ctx.clearRect(0, 0, W, H);
  const ar = aspect(W, H);
  const safe = safeZone(W, H);
  const safeH = ar === "portrait" ? safe.contentBottom - safe.contentTop : H;
  const safeTop = ar === "portrait" ? safe.contentTop : 0;
  const pad = ar === "portrait" ? Math.max(W * 0.06, safe.left) : W * 0.04;

  drawBg(ctx, W, H);

  // "WHICH ONE IS IT?" — dramatic entrance, fades in first
  const headerY = ar === "portrait" ? safeTop + safeH * 0.04 : H * 0.06;
  const titleP = easeOutExpo(Math.min(1, p / 0.3));
  ctx.save();
  ctx.globalAlpha = titleP;
  ctx.shadowColor = GAME.gold;
  ctx.shadowBlur = 25;
  ctx.font = `800 ${sz(W, H, 0.025)}px 'DM Sans', sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`ROUND ${S.propRound || 1}  \u00b7  ${S.propAddress || ""}`, W / 2, headerY);
  ctx.restore();

  const questionP = easeOutExpo(Math.min(1, Math.max(0, (p - 0.05) / 0.3)));
  ctx.save();
  ctx.globalAlpha = questionP;
  ctx.shadowColor = GAME.gold;
  ctx.shadowBlur = 30;
  const qScale = 0.8 + 0.2 * easeOutBack(questionP);
  ctx.font = `800 ${sz(W, H, 0.05) * qScale}px 'Lora', serif`;
  ctx.fillStyle = GAME.gold;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Which one is it?", W / 2, headerY + sz(W, H, 0.06));
  ctx.restore();

  // Option pills — staggered scale-up from center with bounce
  const opts = [
    { letter: "A", price: S.optionA, color: GAME.optionA },
    { letter: "B", price: S.optionB, color: GAME.optionB },
    { letter: "C", price: S.optionC, color: GAME.optionC },
  ];

  const ow = W - pad * 2;
  const oh = ar === "portrait" ? safeH * 0.13 : H * 0.16;
  const og = ar === "portrait" ? safeH * 0.03 : H * 0.04;
  const totalPillH = 3 * oh + 2 * og;
  const availTop = ar === "portrait" ? safeTop + safeH * 0.18 : H * 0.18;
  const availBottom = ar === "portrait" ? safe.contentBottom - safeH * 0.08 : H * 0.82;
  const startY = availTop + ((availBottom - availTop) - totalPillH) / 2;

  for (let i = 0; i < 3; i++) {
    const o = opts[i];
    // Staggered slide-up with fade
    const pillDelay = 0.20 + i * 0.15;
    const rawP = easeOutExpo(Math.min(1, Math.max(0, (p - pillDelay) / 0.4)));
    const slideY = H * 0.06 * (1 - rawP);
    const oy = startY + i * (oh + og) + slideY;

    ctx.save();
    ctx.globalAlpha = rawP;

    // Pill with deep shadow
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = oh * 0.4;
    ctx.shadowOffsetY = oh * 0.1;
    ctx.fillStyle = o.color;
    roundRect(ctx, pad, oy, ow, oh, oh / 2);
    ctx.fill();
    ctx.restore();

    // Glossy highlight
    const glossGrad = ctx.createLinearGradient(0, oy, 0, oy + oh * 0.45);
    glossGrad.addColorStop(0, "rgba(255,255,255,0.22)");
    glossGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glossGrad;
    roundRect(ctx, pad, oy, ow, oh, oh / 2);
    ctx.fill();

    // Letter badge — left
    const br = oh * 0.40;
    const bx2 = pad + oh / 2;
    const by2 = oy + oh / 2;
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.arc(bx2, by2, br, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `800 ${Math.round(br * 1.3)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(o.letter, bx2, by2);

    // Price — BOLD, centered
    const priceX = pad + oh + (ow - oh) / 2;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 8;
    ctx.font = `800 ${Math.round(oh * 0.52)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(o.price || "---", priceX, by2);
    ctx.restore();

    ctx.restore();
  }

  // Disclaimer
  ctx.font = `400 ${sz(W, H, 0.013)}px 'DM Sans', sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("* Listing price at time of recording", W / 2, H - sz(W, H, 0.02));

  drawStamp(ctx, W, H);
}

function drawLockIn(ctx, W, H, S, progress) {
  const p = progress ?? 1;
  drawBg(ctx, W, H);
  drawAccentBars(ctx, W, H);
  const ar = aspect(W, H);
  const safe = safeZone(W, H);
  const letter = S.lockLetter || "";
  const hasAnswer = letter !== "";
  const colors = { A: GAME.optionA, B: GAME.optionB, C: GAME.optionC };
  const letterColor = hasAnswer ? (colors[letter] || GAME.gold) : GAME.gold;
  const centerY = ar === "portrait" ? safe.contentTop + (safe.contentBottom - safe.contentTop) * 0.42 : H * 0.45;

  // Large DRAMATIC glow behind letter
  ctx.save();
  ctx.globalAlpha = 0.25;
  const glow = ctx.createRadialGradient(W / 2, centerY, 0, W / 2, centerY, sz(W, H, 0.45));
  glow.addColorStop(0, GAME.gold);
  glow.addColorStop(0.5, letterColor);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Agent name — BIG, bold, fades in
  const nameP = easeOutExpo(Math.min(1, p / 0.3));
  ctx.save();
  ctx.globalAlpha = nameP;
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 10;
  ctx.font = `800 ${sz(W, H, 0.05)}px 'DM Sans', sans-serif`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText((S.lockAgent || "Agent").toUpperCase(), W / 2, centerY - sz(W, H, 0.20));

  // Label — changes based on whether answer is selected
  ctx.shadowColor = GAME.gold;
  ctx.shadowBlur = 12;
  ctx.font = `700 ${sz(W, H, 0.03)}px 'DM Sans', sans-serif`;
  ctx.fillStyle = GAME.gold;
  ctx.fillText(hasAnswer ? "LOCKS IN" : "IS THINKING\u2026", W / 2, centerY - sz(W, H, 0.13));
  ctx.restore();

  if (hasAnswer) {
    // Giant letter — WHITE with coloured glow, scale in with elastic
    const letterLP = Math.min(1, Math.max(0, (p - 0.25) / 0.5));
    const letterScale = easeOutBack(letterLP);
    const letterSz = sz(W, H, ar === "portrait" ? 0.38 : 0.30) * letterScale;
    if (letterLP > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, letterLP * 2);
      ctx.shadowColor = letterColor;
      ctx.shadowBlur = sz(W, H, 0.08);
      ctx.font = `800 ${Math.round(letterSz)}px 'DM Sans', sans-serif`;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(letter, W / 2, centerY + sz(W, H, 0.05));
      ctx.restore();
    }
  } else {
    // "?" placeholder — subtle, waiting for answer
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.font = `800 ${sz(W, H, ar === "portrait" ? 0.30 : 0.22)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = GAME.gold;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", W / 2, centerY + sz(W, H, 0.05));
    ctx.restore();
  }

  // Salmon underline
  const ulW = W * 0.15;
  ctx.fillStyle = GAME.gold;
  roundRect(ctx, W / 2 - ulW / 2, centerY + sz(W, H, 0.18), ulW, 5, 3);
  ctx.fill();

  drawStamp(ctx, W, H);
}

function drawTimer(ctx, W, H, S, progress) {
  drawBg(ctx, W, H);
  const ar = aspect(W, H);
  const safe = safeZone(W, H);
  const totalSec = S.timerDuration || 3;
  const elapsed = progress * totalSec;
  const centerY = ar === "portrait" ? safe.contentTop + (safe.contentBottom - safe.contentTop) * 0.40 : H * 0.47;
  const ringR = sz(W, H, 0.22);

  if (elapsed < totalSec) {
    const displayNum = Math.ceil(totalSec - elapsed);
    const inPhase = elapsed % 1;

    // Background glow pulse
    ctx.save();
    ctx.globalAlpha = 0.08 + Math.sin(inPhase * Math.PI) * 0.06;
    const tGlow = ctx.createRadialGradient(W / 2, centerY, 0, W / 2, centerY, ringR * 2);
    tGlow.addColorStop(0, GAME.gold);
    tGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = tGlow;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Outer ring — thicker
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = sz(W, H, 0.02);
    ctx.beginPath();
    ctx.arc(W / 2, centerY, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Progress ring — salmon with glow, fills clockwise
    ctx.save();
    ctx.shadowColor = GAME.gold;
    ctx.shadowBlur = sz(W, H, 0.03);
    ctx.strokeStyle = GAME.gold;
    ctx.lineWidth = sz(W, H, 0.02);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(W / 2, centerY, ringR, -Math.PI / 2, -Math.PI / 2 + inPhase * Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Number — elastic scale on each beat, BIGGER
    const beatScale = 1 + Math.max(0, 0.4 * Math.pow(1 - inPhase * 2.5, 3));
    const numSz = sz(W, H, 0.22) * Math.max(1, beatScale);
    ctx.save();
    ctx.shadowColor = GAME.gold;
    ctx.shadowBlur = sz(W, H, 0.03);
    ctx.font = `800 ${Math.round(numSz)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = BRAND.colorWarm;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(displayNum), W / 2, centerY + numSz * 0.05);
    ctx.restore();
  } else {
    // REVEAL — punchy
    ctx.save();
    ctx.shadowColor = GAME.gold;
    ctx.shadowBlur = sz(W, H, 0.06);
    const revSz = sz(W, H, 0.12);
    ctx.font = `800 ${revSz}px 'DM Sans', sans-serif`;
    ctx.fillStyle = GAME.gold;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("REVEAL!", W / 2, centerY + revSz * 0.03);
    ctx.restore();
  }
  drawStamp(ctx, W, H);
}

function drawReveal(ctx, W, H, S, progress) {
  drawBg(ctx, W, H);
  // Property hero photo as subtle background
  const revRd = EPISODE.rounds ? EPISODE.rounds[(S.propRound || 1) - 1] : null;
  const heroSrc = revRd?.photos?.[revRd.heroPhotoIndex || 0];
  const heroImg = heroSrc ? getCachedImage(heroSrc) : null;
  if (heroImg && heroImg.complete && heroImg.naturalWidth > 0) {
    const iw = heroImg.naturalWidth, ih = heroImg.naturalHeight;
    const scale = Math.max(W / iw, H / ih);
    const dw = iw * scale, dh = ih * scale;
    ctx.save();
    ctx.globalAlpha = 0.20;
    ctx.drawImage(heroImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.restore();
    // Darken overlay to keep text readable
    ctx.fillStyle = "rgba(10,22,40,0.6)";
    ctx.fillRect(0, 0, W, H);
  }
  const ar = aspect(W, H);
  const safe = safeZone(W, H);
  const cl = S.revealLetter || "B";
  const cp = S.revealPrice || "---";
  const colors = { A: GAME.optionA, B: GAME.optionB, C: GAME.optionC };
  const cc = colors[cl] || GAME.gold;
  const centerY = ar === "portrait" ? safe.contentTop + (safe.contentBottom - safe.contentTop) * 0.38 : H * 0.42;

  // Phase 1 (0–0.35): tension — "THE LISTING PRICE IS..."
  // Phase 2 (0.35–1): reveal with glow
  if (progress < 0.35) {
    const tp = progress / 0.35;
    // Pulsing glow
    const pulseAlpha = 0.15 + Math.sin(tp * Math.PI * 4) * 0.08;
    const glow = ctx.createRadialGradient(W / 2, centerY, 0, W / 2, centerY, sz(W, H, 0.3));
    glow.addColorStop(0, `rgba(251,135,112,${pulseAlpha})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.font = `600 ${sz(W, H, 0.05)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = `rgba(255,255,255,${0.5 + tp * 0.3})`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("THE LISTING PRICE IS...", W / 2, centerY);

    // Animated dots
    const dots = Math.max(0, Math.floor(tp * 4) % 4);
    if (dots > 0) ctx.fillText(".".repeat(dots), W / 2, centerY + sz(W, H, 0.06));
  } else {
    const rp = (progress - 0.35) / 0.65;

    // Background glow in letter colour
    const glowAlpha = Math.min(0.3, rp * 0.5);
    ctx.save();
    ctx.globalAlpha = glowAlpha;
    const glow = ctx.createRadialGradient(W / 2, centerY, 0, W / 2, centerY, sz(W, H, 0.5));
    glow.addColorStop(0, cc);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // Letter — scale in with elastic, WHITE with coloured glow
    if (rp > 0.05) {
      const letterP = Math.min(1, (rp - 0.05) / 0.3);
      const scale = easeOutBack(letterP);
      const letterSz = sz(W, H, ar === "portrait" ? 0.30 : 0.22) * scale;
      ctx.save();
      ctx.shadowColor = cc;
      ctx.shadowBlur = sz(W, H, 0.08) * Math.min(1, rp * 2);
      ctx.font = `800 ${Math.round(letterSz)}px 'DM Sans', sans-serif`;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cl, W / 2, centerY - sz(W, H, 0.04));
      ctx.restore();
    }

    // Price — fade up, BIGGER
    if (rp > 0.45) {
      const priceP = Math.min(1, (rp - 0.45) / 0.25);
      const a = easeOutExpo(priceP);
      const priceSz = sz(W, H, ar === "portrait" ? 0.12 : 0.09);
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = priceSz * 0.1;
      ctx.font = `800 ${priceSz}px 'DM Sans', sans-serif`;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const priceY = centerY + sz(W, H, ar === "portrait" ? 0.18 : 0.14);
      ctx.fillText(`\u00a3${cp}`, W / 2, priceY + (1 - a) * sz(W, H, 0.02));
      ctx.restore();
    }

    // "CORRECT PRICE" label
    if (rp > 0.6) {
      const lblP = Math.min(1, (rp - 0.6) / 0.2);
      ctx.font = `600 ${sz(W, H, 0.022)}px 'DM Sans', sans-serif`;
      ctx.fillStyle = `rgba(251,135,112,${lblP})`;
      ctx.textAlign = "center";
      ctx.fillText("CORRECT PRICE", W / 2, centerY + sz(W, H, ar === "portrait" ? 0.26 : 0.23));
    }

    // Result indicator — did they get it right?
    if (rp > 0.75 && S.lockLetter) {
      const resP = easeOutExpo(Math.min(1, (rp - 0.75) / 0.2));
      const gotItRight = S.lockLetter === cl;
      const resY = centerY + sz(W, H, ar === "portrait" ? 0.32 : 0.30);
      const resSz = sz(W, H, 0.035) * (0.8 + 0.2 * easeOutBack(resP));
      ctx.save();
      ctx.globalAlpha = resP;
      ctx.font = `800 ${Math.round(resSz)}px 'DM Sans', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (gotItRight) {
        ctx.shadowColor = BRAND.colorPositive;
        ctx.shadowBlur = 15;
        ctx.fillStyle = BRAND.colorPositive;
        ctx.fillText(`${S.lockAgent || "Agent"} GOT IT RIGHT! ✓`, W / 2, resY);
      } else {
        ctx.shadowColor = GAME.gold;
        ctx.shadowBlur = 10;
        ctx.fillStyle = GAME.gold;
        ctx.fillText(`${S.lockAgent || "Agent"} said ${S.lockLetter} — WRONG!`, W / 2, resY);
      }
      ctx.restore();
    }
  }

  // Disclaimer
  ctx.font = `400 ${sz(W, H, 0.014)}px 'DM Sans', sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("* Price subject to change. April 2026", W / 2, H - sz(W, H, 0.025));

  drawAccentBars(ctx, W, H);
  drawStamp(ctx, W, H);
}

function drawRoundTitle(ctx, W, H, S, progress) {
  const p = progress ?? 1;
  drawBg(ctx, W, H);
  drawAccentBars(ctx, W, H);
  const ar = aspect(W, H);
  const safe = safeZone(W, H);
  const centerY = ar === "portrait" ? safe.contentTop + (safe.contentBottom - safe.contentTop) * 0.48 : H * 0.50;

  // "ROUND" label — fades in with glow
  const labelP = easeOutExpo(Math.min(1, p / 0.4));
  ctx.save();
  ctx.globalAlpha = labelP;
  ctx.shadowColor = GAME.gold;
  ctx.shadowBlur = 20;
  ctx.font = `700 ${sz(W, H, 0.04)}px 'DM Sans', sans-serif`;
  ctx.fillStyle = GAME.goldLight;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("ROUND", W / 2, centerY - sz(W, H, 0.14));
  ctx.restore();

  // Giant round number — scales in with elastic
  const numP = Math.min(1, Math.max(0, (p - 0.15) / 0.5));
  const numScale = easeOutBack(numP);
  const numSz = sz(W, H, ar === "portrait" ? 0.35 : 0.28) * numScale;
  if (numP > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, numP * 2);
    ctx.shadowColor = GAME.gold;
    ctx.shadowBlur = sz(W, H, 0.06);
    ctx.font = `800 ${Math.round(numSz)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = GAME.gold;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(S.propRound || 1), W / 2, centerY + sz(W, H, 0.05));
    ctx.restore();
  }

  // Underline
  const ulW = W * 0.12;
  ctx.fillStyle = GAME.gold;
  roundRect(ctx, W / 2 - ulW / 2, centerY + sz(W, H, 0.18), ulW, 4, 2);
  ctx.fill();

  drawStamp(ctx, W, H);
}

function drawScoreboard(ctx, W, H, S, progress) {
  const p = progress ?? 1;
  drawBg(ctx, W, H);
  drawAccentBars(ctx, W, H);
  const ar = aspect(W, H);
  const safe = safeZone(W, H);
  const safeH = ar === "portrait" ? safe.contentBottom - safe.contentTop : H;
  const safeTop = ar === "portrait" ? safe.contentTop : 0;
  const a1 = EPISODE.agents[0], a2 = EPISODE.agents[1];
  const s1 = S.score1 ?? 0, s2 = S.score2 ?? 0;

  // Title — fades in with glow
  const titleP = easeOutExpo(Math.min(1, p / 0.3));
  ctx.save();
  ctx.globalAlpha = titleP;
  ctx.shadowColor = GAME.gold;
  ctx.shadowBlur = 15;
  ctx.font = `800 ${sz(W, H, 0.04)}px 'DM Sans', sans-serif`;
  ctx.fillStyle = GAME.gold;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SCOREBOARD", W / 2, ar === "portrait" ? safeTop + safeH * 0.06 : H * 0.12);
  ctx.restore();

  // Staggered animation: card1 at 0.15, VS at 0.35, card2 at 0.45, scores pop at 0.6
  const card1P = easeOutExpo(Math.min(1, Math.max(0, (p - 0.15) / 0.3)));
  const vsAnimP = easeOutExpo(Math.min(1, Math.max(0, (p - 0.35) / 0.2)));
  const card2P = easeOutExpo(Math.min(1, Math.max(0, (p - 0.45) / 0.3)));
  const score1P = easeOutBack(Math.min(1, Math.max(0, (p - 0.55) / 0.3)));
  const score2P = easeOutBack(Math.min(1, Math.max(0, (p - 0.65) / 0.3)));
  const labelP = easeOutExpo(Math.min(1, Math.max(0, (p - 0.8) / 0.2)));

  // Helper: draw a score card
  const drawCard = (cx, cy, cw, ch, name, score, cardAnim, scoreAnim) => {
    const slideY = ch * 0.15 * (1 - cardAnim);
    ctx.save();
    ctx.globalAlpha = cardAnim;
    ctx.translate(0, slideY);
    // Card background
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundRect(ctx, cx, cy, cw, ch, BRAND.cornerRadius);
    ctx.fill();
    ctx.strokeStyle = GAME.gold;
    ctx.lineWidth = 2;
    roundRect(ctx, cx, cy, cw, ch, BRAND.cornerRadius);
    ctx.stroke();
    // Agent name
    ctx.font = `700 ${sz(W, H, ar === "portrait" ? 0.035 : 0.032)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = BRAND.colorText;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, cx + cw / 2, cy + ch * 0.30);
    ctx.restore();
    // Score number — scales up with bounce
    if (scoreAnim > 0) {
      const scoreSz = sz(W, H, ar === "portrait" ? 0.09 : 0.10) * scoreAnim;
      ctx.save();
      ctx.globalAlpha = Math.min(1, scoreAnim * 1.5);
      ctx.shadowColor = GAME.gold;
      ctx.shadowBlur = scoreSz * 0.2;
      ctx.font = `800 ${Math.round(scoreSz)}px 'DM Sans', sans-serif`;
      ctx.fillStyle = GAME.gold;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(score), cx + cw / 2, cy + slideY + ch * 0.68);
      ctx.restore();
    }
  };

  if (ar === "portrait") {
    const cardW2 = W * 0.7, cardH2 = safeH * 0.22, gap = safeH * 0.04;
    const centerX = W / 2 - cardW2 / 2;
    const y1 = safeTop + safeH * 0.15;
    drawCard(centerX, y1, cardW2, cardH2, a1, s1, card1P, score1P);

    // VS
    ctx.save();
    ctx.globalAlpha = vsAnimP;
    const vsScale = easeOutBack(vsAnimP);
    ctx.font = `600 ${sz(W, H, 0.03) * vsScale}px 'Lora', serif`;
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("vs", W / 2, y1 + cardH2 + gap / 2);
    ctx.restore();

    const y2 = y1 + cardH2 + gap;
    drawCard(centerX, y2, cardW2, cardH2, a2, s2, card2P, score2P);

    // Round label
    ctx.save();
    ctx.globalAlpha = labelP;
    ctx.font = `500 ${sz(W, H, 0.022)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`After Round ${S.propRound || 1} of 6`, W / 2, y2 + cardH2 + safeH * 0.05);
    ctx.restore();
  } else {
    const cw2 = W * 0.3, ch2 = H * 0.4, gap = W * 0.05;
    const cy2 = H * 0.28;
    const x1 = W / 2 - gap / 2 - cw2;
    drawCard(x1, cy2, cw2, ch2, a1, s1, card1P, score1P);

    // VS
    ctx.save();
    ctx.globalAlpha = vsAnimP;
    const vsScale = easeOutBack(vsAnimP);
    ctx.font = `600 ${sz(W, H, 0.03) * vsScale}px 'Lora', serif`;
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("vs", W / 2, cy2 + ch2 / 2);
    ctx.restore();

    const x2 = W / 2 + gap / 2;
    drawCard(x2, cy2, cw2, ch2, a2, s2, card2P, score2P);

    // Round label
    ctx.save();
    ctx.globalAlpha = labelP;
    ctx.font = `500 ${sz(W, H, 0.02)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`After Round ${S.propRound || 1} of 6`, W / 2, cy2 + ch2 + H * 0.06);
    ctx.restore();
  }

  drawStamp(ctx, W, H);
}

const DRAW_FNS = {
  intro: drawIntro,
  roundtitle: drawRoundTitle,
  property: drawProperty,
  prompt: drawPrompt,
  options: drawOptions,
  lockin: drawLockIn,
  timer: drawTimer,
  reveal: drawReveal,
  scoreboard: drawScoreboard,
};

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function GuessThePrice({ displayMode = false }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const animProgressRef = useRef(0);
  const saveTimerRef = useRef(null);
  const [ratio, setRatio] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gtp_ratio");
      if (saved && RATIOS[saved]) return saved;
    }
    return "16:9";
  });
  useEffect(() => { localStorage.setItem("gtp_ratio", ratio); }, [ratio]);
  const [activeAsset, setActiveAsset] = useState("intro");
  const [currentRound, setCurrentRound] = useState(0);
  const [scores, setScores] = useState([0, 0]);
  const [animProgress, setAnimProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const [exportProgress, setExportProgress] = useState(0); // 0-1 for progress bar
  const exportCancelRef = useRef(false);

  // ── Episode state ──
  const [episodes, setEpisodes] = useState([]);
  const [activeEpisodeId, setActiveEpisodeId] = useState(null);
  const [showEpisodePanel, setShowEpisodePanel] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [dirty, setDirty] = useState(false);

  // ── Live mode state ──
  const [liveMode, setLiveMode] = useState(false);
  const [liveStep, setLiveStep] = useState(-1); // -1 = intro, 0+ = LIVE_FLOW index
  const [livePhotoIndex, setLivePhotoIndex] = useState(0);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [photoAnimProgress, setPhotoAnimProgress] = useState(1);
  const photoAnimRef = useRef(null);
  const transitionRef = useRef(null);
  const offscreenA = useRef(null);
  const offscreenB = useRef(null);

  // Get current episode object
  const episode = episodes.find(e => e.id === activeEpisodeId) || EPISODE;

  // Sync module-level EPISODE ref whenever active episode changes
  useEffect(() => {
    EPISODE = episode;
  }, [episode]);

  const [S, setS] = useState({
    showTitle: EPISODE.show,
    introEpisode: EPISODE.episode,
    propRound: 1,
    propAddress: EPISODE.rounds[0].address,
    optionLocation: EPISODE.rounds[0].location,
    optionA: EPISODE.rounds[0].optionA,
    optionB: EPISODE.rounds[0].optionB,
    optionC: EPISODE.rounds[0].optionC,
    revealLetter: EPISODE.rounds[0].correctLetter,
    revealPrice: EPISODE.rounds[0].correctPrice,
    lockAgent: EPISODE.rounds[0].guesser,
    lockLetter: "",
    score1: 0,
    score2: 0,
    timerDuration: 3,
    photoDuration: 5,  // seconds per photo
    _editorMode: !displayMode,
  });

  // ── Image load trigger — forces re-render when cached images finish loading ──
  const [, setImgTick] = useState(0);
  useEffect(() => {
    _imgLoadCallback = () => setImgTick(t => t + 1);
    return () => { _imgLoadCallback = null; };
  }, []);

  // ── Font + image preloading ──
  const [fontsReady, setFontsReady] = useState(false);

  // ── Load from localStorage on mount ──
  useEffect(() => {
    loadFont("DM Sans");
    loadFont("Lora");
    getCachedImage(BRAND.logoUrl);
    getCachedImage(BRAND.logoUrlLight);
    // Wait for fonts before first render
    document.fonts?.ready?.then(() => setFontsReady(true))
      .catch(() => setFontsReady(true)); // fallback if fonts API unavailable
    setTimeout(() => setFontsReady(true), 2000); // max wait 2s

    const saved = loadEpisodes();
    if (saved && saved.episodes && saved.episodes.length > 0) {
      setEpisodes(saved.episodes);
      const activeId = saved.activeEpisodeId || saved.episodes[0].id;
      setActiveEpisodeId(activeId);
      const ep = saved.episodes.find(e => e.id === activeId) || saved.episodes[0];
      EPISODE = ep;
      setScores(ep.scores || [0, 0]);
      syncSFromRound(ep.rounds[0], ep, [ep.scores?.[0] || 0, ep.scores?.[1] || 0]);
    } else {
      const def = createDefaultEpisode();
      setEpisodes([def]);
      setActiveEpisodeId(def.id);
      EPISODE = def;
    }

    // Delay first render until fonts are ready
    document.fonts?.ready?.then(() => render()).catch(() => render());
    const t = setTimeout(() => render(), 2000); // max wait fallback
    return () => clearTimeout(t);
  }, []);

  // ── Migrate any base64 images to blob URLs on mount ──
  const migratedRef = useRef(false);
  useEffect(() => {
    if (migratedRef.current || displayMode || episodes.length === 0) return;
    migratedRef.current = true;
    const isBase64 = (s) => s && typeof s === "string" && s.startsWith("data:");
    const needsMigration = episodes.some(ep =>
      isBase64(ep.logoImage) ||
      (ep.agentImages || []).some(isBase64) ||
      ep.rounds.some(r => (r.photos || []).some(isBase64))
    );
    if (!needsMigration) return;
    (async () => {
      setSaveStatus("Migrating images…");
      let changed = false;
      const updated = await Promise.all(episodes.map(async (ep) => {
        let logo = ep.logoImage;
        if (isBase64(logo)) {
          try { logo = await uploadPhotoToBlob(logo, "logo", 0); changed = true; } catch {}
        }
        const agentImgs = await Promise.all((ep.agentImages || []).map(async (img, i) => {
          if (isBase64(img)) { try { const u = await uploadPhotoToBlob(img, "agent", i); changed = true; return u; } catch {} }
          return img;
        }));
        const rounds = await Promise.all(ep.rounds.map(async (r, ri) => {
          const photos = await Promise.all((r.photos || []).map(async (p, pi) => {
            if (isBase64(p)) { try { const u = await uploadPhotoToBlob(p, ri, pi); changed = true; return u; } catch {} }
            return p;
          }));
          return { ...r, photos };
        }));
        return { ...ep, logoImage: logo, agentImages: agentImgs, rounds };
      }));
      if (changed) {
        setEpisodes(updated);
        setDirty(true);
        setSaveStatus("Images migrated ✓");
      } else {
        setSaveStatus("");
      }
      setTimeout(() => setSaveStatus(""), 3000);
    })();
  }, [episodes, displayMode]);

  // ── Auto-save to localStorage when episodes change ──
  useEffect(() => {
    if (episodes.length > 0 && activeEpisodeId) {
      saveEpisodes(episodes, activeEpisodeId);
    }
  }, [episodes, activeEpisodeId]);

  // ── Debounced server sync (30s after last change) ──
  useEffect(() => {
    if (!dirty || episodes.length === 0) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      syncToServer();
    }, 30000);
    return () => clearTimeout(saveTimerRef.current);
  }, [dirty, episodes]);

  // Strip large base64 data but keep blob URLs (which are small strings)
  const stripPhotosForServer = (eps) => eps.map(ep => ({
    ...ep,
    logoImage: ep.logoImage?.startsWith("http") ? ep.logoImage : undefined,
    agentImages: ep.agentImages?.map(img => img?.startsWith("http") ? img : undefined),
    rounds: ep.rounds.map(r => ({
      ...r,
      photos: (r.photos || []).filter(p => p?.startsWith("http")),
    })),
  }));

  const syncToServer = async () => {
    try {
      setSaveStatus("Syncing…");
      await fetch("/api/gtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodes: stripPhotosForServer(episodes), activeEpisodeId }),
      });
      setSaveStatus("Saved ✓");
      setDirty(false);
      setTimeout(() => setSaveStatus(""), 3000);
    } catch {
      setSaveStatus("Sync failed");
      setTimeout(() => setSaveStatus(""), 5000);
    }
  };

  const saveSnapshot = async (name) => {
    try {
      setSaveStatus("Saving snapshot…");
      await fetch(`/api/gtp?snapshot=${encodeURIComponent(name)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodes: stripPhotosForServer(episodes), activeEpisodeId }),
      });
      setSaveStatus(`Snapshot "${name}" saved ✓`);
      setDirty(false);
      setTimeout(() => setSaveStatus(""), 3000);
    } catch {
      setSaveStatus("Snapshot failed");
      setTimeout(() => setSaveStatus(""), 5000);
    }
  };

  // ── Push current state to live display ──
  const [liveConnected, setLiveConnected] = useState(false);
  const [lastPushOk, setLastPushOk] = useState(null); // null = never, true = ok, false = error
  const [lastPushTs, setLastPushTs] = useState(0);
  const livePushRef = useRef(null);
  const pushToLiveRef = useRef(null);
  const pushToLive = async (overrideAsset, overrideS) => {
    try {
      const rd = episode.rounds[currentRound] || {};
      const livePhotos = (rd.photos || []).filter(p => p?.startsWith("/api") || p?.startsWith("http"));
      const r = RATIOS[ratio];
      const state = {
        asset: overrideAsset || activeAsset,
        round: currentRound + 1,
        S: { ...(overrideS || S), score1: scores[0], score2: scores[1] },
        scores,
        agents: episode.agents,
        agentImages: (episode.agentImages || []).filter(u => u?.startsWith("/api") || u?.startsWith("http")),
        logoImage: (episode.logoImage?.startsWith("/api") || episode.logoImage?.startsWith("http")) ? episode.logoImage : "",
        photos: livePhotos,
        heroPhotoIndex: rd.heroPhotoIndex || 0,
        roundData: { ...rd, photos: livePhotos },
        canvasW: r.W,
        canvasH: r.H,
        ts: Date.now(),
      };

      // Instant same-browser delivery via BroadcastChannel
      try { const bc = new BroadcastChannel(GTP_CHANNEL_NAME); bc.postMessage(state); bc.close(); } catch {}

      // Persist to server for cross-device
      fetch("/api/gtp/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      }).then(() => {
        setLiveConnected(true);
        setLastPushOk(true);
        setLastPushTs(Date.now());
      }).catch(() => {
        // Don't disconnect — just show error on status dot, auto-sync keeps trying
        setLastPushOk(false);
        setLastPushTs(Date.now());
      });
      if (!liveConnected) setLiveConnected(true);
    } catch {
      // Don't disconnect on error
      setLastPushOk(false);
      setLastPushTs(Date.now());
    }
  };

  // Fade status dot to idle after 5s of no pushes
  useEffect(() => {
    if (lastPushOk !== true) return;
    const t = setTimeout(() => setLastPushOk(null), 5000);
    return () => clearTimeout(t);
  }, [lastPushTs]);

  pushToLiveRef.current = pushToLive;

  // Auto-sync to /live when admin state changes (debounced)
  useEffect(() => {
    if (!liveConnected || displayMode || liveMode) return;
    clearTimeout(livePushRef.current);
    livePushRef.current = setTimeout(() => pushToLive(), 50);
    return () => clearTimeout(livePushRef.current);
  }, [activeAsset, currentRound, S, scores]);

  // ── Helper: sync S state from a round ──
  const syncSFromRound = (round, ep, sc) => {
    if (!round || !ep) return;
    setS(prev => ({
      ...prev,
      showTitle: ep.show,
      introEpisode: ep.episode,
      propRound: round.number,
      propAddress: round.address,
      optionLocation: round.location,
      propBeds: round.beds || 0,
      propType: round.type || "",
      propTenure: round.tenure || "",
      propAddedDate: round.addedDate || "",
      optionA: round.optionA,
      optionB: round.optionB,
      optionC: round.optionC,
      revealLetter: round.correctLetter,
      revealPrice: round.correctPrice,
      lockAgent: round.guesser,
      lockLetter: "",
      score1: sc ? sc[0] : 0,
      score2: sc ? sc[1] : 0,
      timerDuration: ep.timerDuration ?? prev.timerDuration ?? 3,
      photoDuration: ep.photoDuration ?? prev.photoDuration ?? 5,
    }));
  };

  // ── Update current episode's round data when S changes ──
  const updateEpisodeFromS = useCallback((newS) => {
    if (!activeEpisodeId) return;
    setEpisodes(prev => prev.map(ep => {
      if (ep.id !== activeEpisodeId) return ep;
      const rounds = [...ep.rounds];
      const idx = currentRound;
      if (rounds[idx]) {
        rounds[idx] = {
          ...rounds[idx],
          address: newS.propAddress,
          location: newS.optionLocation,
          optionA: newS.optionA,
          optionB: newS.optionB,
          optionC: newS.optionC,
          correctLetter: newS.revealLetter,
          correctPrice: newS.revealPrice,
        };
      }
      return { ...ep, show: newS.showTitle, episode: newS.introEpisode, rounds, scores, timerDuration: newS.timerDuration, photoDuration: newS.photoDuration };
    }));
    setDirty(true);
  }, [activeEpisodeId, currentRound, scores]);

  // ── Episode management ──
  const createNewEpisode = () => {
    const num = episodes.length + 1;
    const ep = createDefaultEpisode(num);
    // Carry over agent names, headshots, and logo from current episode
    ep.agents = episode.agents ? [...episode.agents] : ["Agent 1", "Agent 2"];
    ep.agentImages = episode.agentImages ? [...episode.agentImages] : ["", ""];
    ep.logoImage = episode.logoImage || "";
    ep.timerDuration = episode.timerDuration || 3;
    ep.photoDuration = episode.photoDuration || 5;
    ep.rounds = Array.from({ length: 6 }, (_, i) => emptyRound(i + 1, ep.agents[i % 2 === 0 ? 0 : 1], ep.agents[i % 2 === 0 ? 1 : 0]));
    setEpisodes(prev => [...prev, ep]);
    setDirty(true);
    switchToEpisode(ep);
  };

  const switchToEpisode = (ep) => {
    if (dirty && !window.confirm("You have unsaved changes. Switch episode anyway?")) return;
    setActiveEpisodeId(ep.id);
    EPISODE = ep;
    setCurrentRound(0);
    setScores(ep.scores || [0, 0]);
    syncSFromRound(ep.rounds[0], ep, ep.scores || [0, 0]);
    setAnimProgress(0);
    setIsPlaying(false);
    setShowEpisodePanel(false);
  };

  const duplicateEpisode = (ep) => {
    const dup = { ...JSON.parse(JSON.stringify(ep)), id: Date.now(), episode: episodes.length + 1, createdAt: new Date().toISOString() };
    setEpisodes(prev => [...prev, dup]);
    setDirty(true);
  };

  const updateAgentName = (idx, name) => {
    setEpisodes(prev => prev.map(ep => {
      if (ep.id !== activeEpisodeId) return ep;
      const agents = [...ep.agents];
      agents[idx] = name;
      const rounds = ep.rounds.map(r => ({
        ...r,
        propertyAgent: r.propertyAgent === ep.agents[idx] ? name : r.propertyAgent,
        guesser: r.guesser === ep.agents[idx] ? name : r.guesser,
      }));
      return { ...ep, agents, rounds };
    }));
    setDirty(true);
  };

  // Update a field on the current round directly (for property details)
  const updateRoundField = (field, value) => {
    setEpisodes(prev => prev.map(ep => {
      if (ep.id !== activeEpisodeId) return ep;
      const rounds = [...ep.rounds];
      if (rounds[currentRound]) {
        rounds[currentRound] = { ...rounds[currentRound], [field]: value };
      }
      return { ...ep, rounds };
    }));
    setDirty(true);
  };

  // Upload a base64 photo to Vercel Blob, returns proxy URL
  const uploadPhotoToBlob = async (base64, roundIdx, photoIdx) => {
    // Convert base64 to binary blob for upload (avoids 33% base64 inflation + 413 errors)
    const resp = await fetch(base64);
    const blob = await resp.blob();
    const form = new FormData();
    form.append("photo", blob, blob.type === "image/png" ? "photo.png" : "photo.jpg");
    form.append("episodeId", String(activeEpisodeId));
    form.append("round", String(roundIdx));
    form.append("index", String(photoIdx));
    const res = await fetch("/api/gtp/photo", { method: "POST", body: form });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    const data = await res.json();
    if (!data.url) throw new Error("No URL returned");
    return data.url;
  };

  // Handle photo upload — compress each, upload to blob one at a time, add to round as each completes
  const handlePhotoUpload = async (files) => {
    const rd = episode.rounds[currentRound];
    if (!rd) return;
    const roundIdx = currentRound;
    const toProcess = Array.from(files);
    const total = toProcess.length;
    let uploaded = 0;
    let failed = 0;
    setSaveStatus(`Uploading 0/${total}…`);
    for (const file of toProcess) {
      try {
        const b64 = await compressPhoto(file, uploaded);
        const url = await uploadPhotoToBlob(b64, roundIdx, Date.now());
        // Add each photo to the round immediately as it uploads
        setEpisodes(prev => prev.map(ep => {
          if (ep.id !== activeEpisodeId) return ep;
          const rounds = [...ep.rounds];
          if (rounds[roundIdx]) {
            rounds[roundIdx] = { ...rounds[roundIdx], photos: [...(rounds[roundIdx].photos || []), url] };
          }
          return { ...ep, rounds };
        }));
        setDirty(true);
        getCachedImage(url);
        uploaded++;
      } catch {
        failed++;
      }
      setSaveStatus(`Uploading ${uploaded + failed}/${total}…`);
    }
    const msg = failed > 0 ? `${uploaded} added, ${failed} failed` : `${uploaded} photo${uploaded > 1 ? "s" : ""} added`;
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(""), 4000);
  };

  const removePhoto = (idx) => {
    const rd = episode.rounds[currentRound];
    if (!rd) return;
    const photos = [...(rd.photos || [])];
    photos.splice(idx, 1);
    updateRoundField("photos", photos);
    let hero = rd.heroPhotoIndex || 0;
    if (idx < hero) hero--; // photo before hero deleted — shift hero left
    if (hero >= photos.length) hero = Math.max(0, photos.length - 1); // hero at end
    if (hero !== (rd.heroPhotoIndex || 0)) updateRoundField("heroPhotoIndex", hero);
  };

  const [dragPhotoIdx, setDragPhotoIdx] = useState(null);
  const [photoModalIdx, setPhotoModalIdx] = useState(null); // null = closed, number = which photo
  const [photoManagerOpen, setPhotoManagerOpen] = useState(false);
  const reorderPhotos = (from, to) => {
    if (from === to) return;
    const rd = episode.rounds[currentRound];
    if (!rd) return;
    const photos = [...(rd.photos || [])];
    const [moved] = photos.splice(from, 1);
    photos.splice(to, 0, moved);
    let hero = rd.heroPhotoIndex || 0;
    if (from === hero) hero = to;
    else if (from < hero && to >= hero) hero--;
    else if (from > hero && to <= hero) hero++;
    updateRoundField("photos", photos);
    updateRoundField("heroPhotoIndex", hero);
  };

  const [dragRoundIdx, setDragRoundIdx] = useState(null);
  const reorderRounds = (from, to) => {
    if (from === to) return;
    setEpisodes(prev => prev.map(ep => {
      if (ep.id !== activeEpisodeId) return ep;
      const rounds = [...ep.rounds];
      const [moved] = rounds.splice(from, 1);
      rounds.splice(to, 0, moved);
      // Renumber
      rounds.forEach((r, i) => { r.number = i + 1; });
      return { ...ep, rounds };
    }));
    // Keep current round following the moved item
    if (currentRound === from) setCurrentRound(to);
    else if (from < currentRound && to >= currentRound) setCurrentRound(currentRound - 1);
    else if (from > currentRound && to <= currentRound) setCurrentRound(currentRound + 1);
    setDirty(true);
  };

  const loadRound = useCallback((n) => {
    const idx = n - 1;
    const round = episode.rounds[idx];
    if (!round) return;
    setCurrentRound(idx);
    setS(prev => ({
      ...prev,
      propRound: round.number,
      propAddress: round.address,
      optionLocation: round.location,
      propBeds: round.beds || 0,
      propType: round.type || "",
      propTenure: round.tenure || "",
      propAddedDate: round.addedDate || "",
      optionA: round.optionA,
      optionB: round.optionB,
      optionC: round.optionC,
      revealLetter: round.correctLetter,
      revealPrice: round.correctPrice,
      lockAgent: round.guesser,
      lockLetter: "",
      score1: scores[0],
      score2: scores[1],
    }));
    setAnimProgress(0);
    setIsPlaying(false);
    setActiveAsset("intro");
  }, [scores, episode]);

  // Keep ref in sync for flicker-free animation reads
  useEffect(() => { animProgressRef.current = animProgress; }, [animProgress]);

  const render = useCallback((progress) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = RATIOS[ratio];
    canvas.width = r.W;
    canvas.height = r.H;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, r.W, r.H);
    const drawFn = DRAW_FNS[activeAsset];
    if (!drawFn) return;
    const asset = ASSETS.find(a => a.id === activeAsset);
    if (asset?.animated) {
      drawFn(ctx, r.W, r.H, S, progress ?? animProgressRef.current);
    } else {
      drawFn(ctx, r.W, r.H, S);
    }
  }, [ratio, activeAsset, S]);

  const renderRef = useRef(render);
  useEffect(() => { renderRef.current = render; }, [render]);

  useEffect(() => { render(); }, [render]);

  // Stop running animation when ratio changes so canvas redraws at new size
  useEffect(() => {
    if (isPlaying) {
      cancelAnimationFrame(animRef.current);
      setIsPlaying(false);
    }
  }, [ratio]);

  // Auto-score when scoreboard is shown (any mode — editor, live, or sequence)
  const lastScoredRoundRef = useRef(-1);
  useEffect(() => {
    if (activeAsset !== "scoreboard") return;
    // Only score once per round (prevent double-scoring on re-renders)
    if (lastScoredRoundRef.current === currentRound) return;
    const rd = episode.rounds[currentRound];
    if (rd && S.lockLetter && rd.correctLetter && S.lockLetter === rd.correctLetter) {
      const guesserIdx = episode.agents.indexOf(rd.guesser);
      if (guesserIdx >= 0) { addScore(guesserIdx); lastScoredRoundRef.current = currentRound; }
    } else if (rd && S.lockLetter) {
      lastScoredRoundRef.current = currentRound; // wrong answer — mark as scored so we don't retry
    }
  }, [activeAsset, currentRound]);

  // Auto-play entrance animations for ALL assets — matches /live behaviour
  const [sequenceMode, setSequenceMode] = useState(true);
  const sequenceRef = useRef(null);
  useEffect(() => {
    if (displayMode || liveMode) return;
    const asset = ASSETS.find(a => a.id === activeAsset);
    if (asset?.animated && !isPlaying) {
      animProgressRef.current = 0;
      const t = setTimeout(() => playAnimation(), 100);
      return () => clearTimeout(t);
    }
  }, [activeAsset, currentRound]);

  const playAnimation = useCallback(() => {
    if (isPlaying) {
      cancelAnimationFrame(animRef.current);
      setIsPlaying(false);
      return;
    }
    // Reset to start if animation already finished
    if (animProgress >= 0.99) {
      setAnimProgress(0);
      renderRef.current(0);
    }
    setIsPlaying(true);
    const duration = (activeAsset === "timer" ? (S.timerDuration || 3) : activeAsset === "property" ? (S.photoDuration || 5) * Math.max(1, (episode.rounds[currentRound]?.photos?.length || 1)) : activeAsset === "intro" ? 6 : 3) * 1000;
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const p = Math.min(1, elapsed / duration);
      setAnimProgress(p);
      renderRef.current(p);
      if (p < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setIsPlaying(false);
      }
    };
    animRef.current = requestAnimationFrame(tick);
  }, [isPlaying, activeAsset, S]);

  // Play full sequence: Lock-In → Countdown → Reveal
  const playSequence = useCallback(() => {
    clearTimeout(sequenceRef.current);
    cancelAnimationFrame(animRef.current);
    setActiveAsset("lockin");
    setAnimProgress(0);
    setIsPlaying(true);
    const lockDur = 3000;
    const timerDur = (S.timerDuration || 3) * 1000;
    const revealDur = 3000;
    const r = RATIOS[ratio];

    // Direct draw helper — avoids stale render closure
    const drawDirect = (assetId, progress) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (canvas.width !== r.W || canvas.height !== r.H) {
        canvas.width = r.W; canvas.height = r.H;
      }
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, r.W, r.H);
      const fn = DRAW_FNS[assetId];
      if (fn) fn(ctx, r.W, r.H, S, progress);
    };

    // Phase 1: Lock-In
    const start1 = performance.now();
    const tick1 = (now) => {
      const p = Math.min(1, (now - start1) / lockDur);
      setAnimProgress(p);
      drawDirect("lockin", p);
      if (p < 1) { animRef.current = requestAnimationFrame(tick1); }
      else {
        // Phase 2: Countdown
        sequenceRef.current = setTimeout(() => {
          setActiveAsset("timer");
          setAnimProgress(0);
          const start2 = performance.now();
          const tick2 = (now2) => {
            const p2 = Math.min(1, (now2 - start2) / timerDur);
            setAnimProgress(p2);
            drawDirect("timer", p2);
            if (p2 < 1) { animRef.current = requestAnimationFrame(tick2); }
            else {
              // Phase 3: Reveal
              sequenceRef.current = setTimeout(() => {
                setActiveAsset("reveal");
                setAnimProgress(0);
                const start3 = performance.now();
                const tick3 = (now3) => {
                  const p3 = Math.min(1, (now3 - start3) / revealDur);
                  setAnimProgress(p3);
                  drawDirect("reveal", p3);
                  if (p3 < 1) { animRef.current = requestAnimationFrame(tick3); }
                  else {
                    setIsPlaying(false);
                    // Show scoreboard after reveal (auto-score handled by useEffect)
                    sequenceRef.current = setTimeout(() => {
                      setActiveAsset("scoreboard");
                      setAnimProgress(1);
                      // Draw scoreboard directly — renderRef still has stale activeAsset
                      const canvas = canvasRef.current;
                      if (canvas) {
                        const rat = RATIOS[ratio];
                        if (canvas.width !== rat.W || canvas.height !== rat.H) { canvas.width = rat.W; canvas.height = rat.H; }
                        const cx = canvas.getContext("2d");
                        cx.clearRect(0, 0, rat.W, rat.H);
                        DRAW_FNS.scoreboard(cx, rat.W, rat.H, S, 1);
                      }
                    }, 1500);
                  }
                };
                animRef.current = requestAnimationFrame(tick3);
              }, 300);
            }
          };
          animRef.current = requestAnimationFrame(tick2);
        }, 300);
      }
    };
    animRef.current = requestAnimationFrame(tick1);
  }, [S, ratio, playAnimation]);

  const addScore = (idx) => {
    setScores(prev => {
      const n = [...prev]; n[idx]++;
      setEpisodes(eps => eps.map(ep => ep.id === activeEpisodeId ? { ...ep, scores: n } : ep));
      setDirty(true);
      return n;
    });
  };

  // Push score changes to /live even in liveMode (auto-sync is disabled in liveMode)
  const prevScoresRef = useRef(scores);
  useEffect(() => {
    if (prevScoresRef.current[0] !== scores[0] || prevScoresRef.current[1] !== scores[1]) {
      prevScoresRef.current = scores;
      if (liveConnected) pushToLive();
    }
  }, [scores]);
  const resetScores = () => {
    setScores([0, 0]);
    setEpisodes(prev => prev.map(ep => ep.id === activeEpisodeId ? { ...ep, scores: [0, 0] } : ep));
    setDirty(true);
  };

  useEffect(() => {
    setS(prev => ({ ...prev, score1: scores[0], score2: scores[1] }));
  }, [scores]);

  const updateS = (key, val) => {
    setS(prev => {
      const newS = { ...prev, [key]: val };
      // Debounce episode persistence to avoid excessive updates
      updateEpisodeFromS(newS);
      return newS;
    });
  };

  // ── Export PNG ──
  const exportPNG = useCallback((filename) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const asset = ASSETS.find(a => a.id === activeAsset);
    if (asset?.animated) render(1);
    canvas.toBlob(blob => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename || `gtp_${activeAsset}_r${S.propRound}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  }, [activeAsset, S, render]);

  // ── Export MOV (animated, Premiere-native with alpha) ──
  const exportMOV = useCallback(async () => {
    const asset = ASSETS.find(a => a.id === activeAsset);
    if (!asset?.animated) { exportPNG(); return; }
    const r = RATIOS[ratio];
    const drawFn = DRAW_FNS[activeAsset];
    if (!drawFn) return;
    const duration = (activeAsset === "timer" ? (S.timerDuration || 3) : activeAsset === "property" ? (S.photoDuration || 5) * Math.max(1, (episode.rounds[currentRound]?.photos?.length || 1)) : activeAsset === "intro" ? 6 : 3) * 1000;
    setExportStatus("Recording…");
    const { recordAsset, webmToMov } = await loadVideoExport();
    const webm = await recordAsset(drawFn, r.W, r.H, S, duration);
    setExportStatus("Converting to MOV…");
    const mov = await webmToMov(webm, `gtp_${activeAsset}_r${S.propRound}.mov`);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(mov);
    a.download = `gtp_${activeAsset}_r${S.propRound}.mov`;
    a.click();
    URL.revokeObjectURL(a.href);
    setExportStatus("Done \u2713");
    setTimeout(() => setExportStatus(""), 2000);
  }, [activeAsset, S, ratio, exportPNG]);

  // ── Batch export round ──
  const exportRound = useCallback(async () => {
    const rn = S.propRound;
    const toExport = [
      { asset: "roundtitle", name: `r${rn}_01_round_title.png` },
      { asset: "property",   name: `r${rn}_02_property.png` },
      { asset: "prompt",     name: `r${rn}_03_prompt.png` },
      { asset: "options",    name: `r${rn}_04_options.png` },
      { asset: "lockin",     name: `r${rn}_05_lockin.png` },
      { asset: "timer",      name: `r${rn}_06_timer.png` },
      { asset: "reveal",     name: `r${rn}_07_reveal.png` },
      { asset: "scoreboard", name: `r${rn}_08_scoreboard.png` },
    ];
    for (let i = 0; i < toExport.length; i++) {
      setExportStatus(`Exporting ${i + 1}/${toExport.length}\u2026`);
      const { asset, name } = toExport[i];
      const canvas = canvasRef.current;
      if (!canvas) continue;
      const rat = RATIOS[ratio];
      canvas.width = rat.W;
      canvas.height = rat.H;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, rat.W, rat.H);
      const drawFn = DRAW_FNS[asset];
      if (drawFn) drawFn(ctx, rat.W, rat.H, S, 1);
      await new Promise(resolve => {
        canvas.toBlob(blob => {
          if (blob) {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = name;
            a.click();
            URL.revokeObjectURL(a.href);
          }
          resolve();
        }, "image/png");
      });
      await new Promise(r => setTimeout(r, 400));
    }
    setExportStatus("Done \u2713");
    render();
    setTimeout(() => setExportStatus(""), 2000);
  }, [S, ratio, render]);

  // ── Export all rounds as ZIP ──
  const exportAllZIP = useCallback(async () => {
    exportCancelRef.current = false;
    setExportProgress(0);
    setExportStatus("Loading ZIP library…");
    if (!window.JSZip) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      document.head.appendChild(script);
      await new Promise((res, rej) => { script.onload = res; script.onerror = rej; });
    }
    const zip = new window.JSZip();
    const rat = RATIOS[ratio];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rounds = episode.rounds || [];
    EPISODE = episode;
    let fileCount = 0;
    // Count total files for progress tracking
    const activeRounds = rounds.filter(r => r.address || r.optionA);
    const totalPhotos = activeRounds.reduce((sum, r) => sum + Math.max(1, (r.photos || []).length), 0);
    const totalFiles = 1 + activeRounds.length * 15 + totalPhotos; // intro + stills + MOVs + photos
    const tick = () => { fileCount++; setExportProgress(fileCount / totalFiles); };

    // Export intro slide
    tick();
    setExportStatus("Exporting intro…");
    canvas.width = rat.W;
    canvas.height = rat.H;
    const introCtx = canvas.getContext("2d");
    introCtx.clearRect(0, 0, rat.W, rat.H);
    DRAW_FNS.intro(introCtx, rat.W, rat.H, S, 1);
    const introBlob = await new Promise(res => canvas.toBlob(res, "image/png"));
    if (introBlob) zip.file("00_intro.png", introBlob);
    fileCount++;
    await new Promise(r => setTimeout(r, 50));

    for (let ri = 0; ri < rounds.length; ri++) {
      const round = rounds[ri];
      if (!round.address && !round.optionA) continue;
      const roundS = {
        ...S,
        propRound: round.number,
        propAddress: round.address,
        optionLocation: round.location,
        propBeds: round.beds || 0,
        propType: round.type || "",
        propTenure: round.tenure || "",
        propAddedDate: round.addedDate || "",
        optionA: round.optionA,
        optionB: round.optionB,
        optionC: round.optionC,
        revealLetter: round.correctLetter,
        revealPrice: round.correctPrice,
        lockAgent: round.guesser,
        lockLetter: round.correctLetter,
      };
      const rn = ri + 1;
      const photos = round.photos || [];
      const numPhotos = Math.max(1, photos.length);

      // Helper: render an asset to PNG still and add to ZIP
      const exportStill = async (assetId, filename, overrideS) => {
        if (exportCancelRef.current) return;
        tick();
        setExportStatus(`R${rn} ${assetId} (still)…`);
        canvas.width = rat.W;
        canvas.height = rat.H;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, rat.W, rat.H);
        const fn = DRAW_FNS[assetId];
        if (fn) fn(ctx, rat.W, rat.H, overrideS || roundS, 1);
        const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
        if (blob) zip.file(filename, blob);
        await new Promise(r => setTimeout(r, 30));
      };

      // Helper: record an animated asset as MOV and add to ZIP
      const exportAnimated = async (assetId, filename, durMs, overrideS) => {
        if (exportCancelRef.current) return;
        tick();
        setExportStatus(`R${rn} ${assetId} (recording)…`);
        const fn = DRAW_FNS[assetId];
        if (!fn) return;
        const ve = await loadVideoExport();
        const webm = await ve.recordAsset(fn, rat.W, rat.H, overrideS || roundS, durMs);
        if (exportCancelRef.current) return;
        setExportStatus(`R${rn} ${assetId} (MOV)…`);
        const mov = await ve.webmToMov(webm, filename);
        zip.file(filename, mov);
      };

      // Full show sequence per round — stills + animated MOVs:
      // 1. Round title (still + animated)
      await exportStill("roundtitle", `R${rn}_01_round_title.png`);
      await exportAnimated("roundtitle", `R${rn}_01_round_title.mov`, 3000);

      // 2. Each property photo as a still slide
      for (let pi = 0; pi < numPhotos; pi++) {
        if (exportCancelRef.current) break;
        tick();
        setExportStatus(`R${rn} photo ${pi + 1}/${numPhotos}…`);
        canvas.width = rat.W;
        canvas.height = rat.H;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, rat.W, rat.H);
        const progress = numPhotos > 1 ? (pi + 0.5) / numPhotos : 1;
        DRAW_FNS.property(ctx, rat.W, rat.H, roundS, progress);
        const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
        if (blob) zip.file(`R${rn}_02_photo_${pi + 1}.png`, blob);
        await new Promise(r => setTimeout(r, 50));
      }

      // 3. Prompt (still + animated)
      await exportStill("prompt", `R${rn}_03_prompt.png`);
      await exportAnimated("prompt", `R${rn}_03_prompt.mov`, 3000);

      // 4. A/B/C Options (still + animated)
      await exportStill("options", `R${rn}_04_options.png`);
      await exportAnimated("options", `R${rn}_04_options.mov`, 3000);

      // 5. Lock-in (still + animated)
      await exportStill("lockin", `R${rn}_05_lockin.png`);
      await exportAnimated("lockin", `R${rn}_05_lockin.mov`, 3000);

      // 6. Timer (still + animated)
      await exportStill("timer", `R${rn}_06_timer.png`);
      await exportAnimated("timer", `R${rn}_06_timer.mov`, (roundS.timerDuration || 3) * 1000);

      // 7. Price Reveal (still + animated)
      await exportStill("reveal", `R${rn}_07_reveal.png`);
      await exportAnimated("reveal", `R${rn}_07_reveal.mov`, 3000);

      // 8. Scoreboard (still only — no entrance animation needed)
      await exportStill("scoreboard", `R${rn}_08_scoreboard.png`);
    }

    if (exportCancelRef.current) {
      setExportStatus("Cancelled");
      setExportProgress(0);
      render();
      setTimeout(() => setExportStatus(""), 2000);
      return;
    }

    setExportStatus("Building ZIP…");
    setExportProgress(0.95);
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(zipBlob);
    a.download = `gtp_ep${episode.episode || 1}_all_rounds.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
    setExportStatus("Done ✓");
    setExportProgress(1);
    render();
    setTimeout(() => { setExportStatus(""); setExportProgress(0); }, 3000);
  }, [S, ratio, render, episode, currentRound]);

  // ── Export iPad PDF cheat sheet ──
  const exportPDF = useCallback(async () => {
    const rd = episode.rounds[currentRound];
    if (!rd) return;
    setExportStatus("Generating PDF…");

    // Dynamically load jsPDF
    if (!window.jspdf) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      document.head.appendChild(script);
      await new Promise((resolve) => { script.onload = resolve; });
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const PW = 210, pad = 12;

    // Dark background
    doc.setFillColor(13, 17, 23);
    doc.rect(0, 0, 210, 297, "F");

    // Gold accent bar
    doc.setFillColor(251, 135, 112);
    doc.rect(0, 0, 210, 2, "F");

    let y = 12;
    doc.setFontSize(9);
    doc.setTextColor(251, 135, 112);
    doc.setFont("helvetica", "bold");
    doc.text("CPS HOMES \u00b7 GUESS THE PRICE", pad, y);
    y += 6;
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(`ROUND ${rd.number} OF 6  \u00b7  ${rd.propertyAgent.toUpperCase()}'S PROPERTY  \u00b7  ${rd.guesser.toUpperCase()} GUESSES`, pad, y);
    y += 8;

    // Hero photo
    if (rd.photos && rd.photos[rd.heroPhotoIndex || 0]) {
      const imgData = rd.photos[rd.heroPhotoIndex || 0];
      const fmt = imgData.includes("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(imgData, fmt, 0, y, PW, 75);
      y += 78;
    } else {
      doc.setFillColor(26, 34, 53);
      doc.rect(0, y, PW, 60, "F");
      doc.setTextColor(80, 90, 110);
      doc.setFontSize(10);
      doc.text("No photo uploaded", PW / 2, y + 30, { align: "center" });
      y += 63;
    }

    // Address + Specs columns
    const colW = (PW - pad * 3) / 2;
    doc.setFillColor(20, 26, 40);
    doc.rect(pad, y, colW, 28, "F");
    doc.setFontSize(7);
    doc.setTextColor(251, 135, 112);
    doc.setFont("helvetica", "bold");
    doc.text("ADDRESS", pad + 4, y + 6);
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    const addrLines = doc.splitTextToSize(rd.address, colW - 8);
    doc.text(addrLines, pad + 4, y + 13);

    const col2x = pad * 2 + colW;
    doc.setFillColor(20, 26, 40);
    doc.rect(col2x, y, colW, 28, "F");
    doc.setFontSize(7);
    doc.setTextColor(251, 135, 112);
    doc.setFont("helvetica", "bold");
    doc.text("PROPERTY", col2x + 4, y + 6);
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.text(`${rd.beds || "?"} bed \u00b7 ${rd.type || "TBC"}`, col2x + 4, y + 13);
    doc.text(rd.tenure || "TBC", col2x + 4, y + 19);
    doc.setFontSize(8);
    doc.setTextColor(150, 160, 175);
    doc.text(`Added ${rd.addedDate || "TBC"}`, col2x + 4, y + 25);
    y += 32;

    // Price options
    doc.setFontSize(9);
    doc.setTextColor(251, 135, 112);
    doc.setFont("helvetica", "bold");
    doc.text("PRICE OPTIONS", pad, y);
    y += 6;

    [{ letter: "A", price: rd.optionA }, { letter: "B", price: rd.optionB }, { letter: "C", price: rd.optionC }].forEach(opt => {
      const isCorrect = opt.letter === rd.correctLetter;
      const rowH = 12;
      if (isCorrect) {
        doc.setFillColor(251, 135, 112);
        doc.rect(pad, y, PW - pad * 2, rowH, "F");
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
      } else {
        doc.setFillColor(26, 34, 53);
        doc.rect(pad, y, PW - pad * 2, rowH, "F");
        doc.setTextColor(220, 225, 235);
        doc.setFont("helvetica", "normal");
      }
      doc.setFontSize(13);
      doc.text(opt.letter, pad + 8, y + 8);
      doc.setFontSize(14);
      doc.text(opt.price || "TBC", pad + 22, y + 8);
      if (isCorrect) { doc.setFontSize(9); doc.text("\u2713 CORRECT", PW - pad - 35, y + 8); }
      y += rowH + 2;
    });
    y += 6;

    // Round structure
    doc.setFillColor(16, 20, 32);
    doc.rect(pad, y, PW - pad * 2, 48, "F");
    doc.setFontSize(7);
    doc.setTextColor(251, 135, 112);
    doc.setFont("helvetica", "bold");
    doc.text("ROUND STRUCTURE", pad + 4, y + 6);
    doc.setTextColor(170, 180, 195);
    doc.setFont("helvetica", "normal");
    ["1.  Show property photos", "2.  \"Which one is it?\" audience prompt", "3.  Show A / B / C price options", "4.  15-second countdown timer", `5.  ${rd.guesser} locks in their answer`, "6.  Reveal correct price", "7.  Capture reaction  \u00b7  Update scoreboard"]
      .forEach((step, i) => { doc.text(step, pad + 4, y + 13 + i * 5); });
    y += 52;

    // Notes
    if (rd.notes) {
      doc.setFillColor(30, 25, 10);
      doc.setDrawColor(251, 135, 112);
      doc.setLineWidth(0.5);
      doc.rect(pad, y, PW - pad * 2, 20, "FD");
      doc.setFontSize(7);
      doc.setTextColor(251, 135, 112);
      doc.setFont("helvetica", "bold");
      doc.text("NOTES", pad + 4, y + 6);
      doc.setFontSize(9);
      doc.setTextColor(220, 225, 235);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(rd.notes, PW - pad * 2 - 8), pad + 4, y + 13);
    }

    // Bottom bar
    doc.setFillColor(251, 135, 112);
    doc.rect(0, 295, 210, 2, "F");

    const safeName = rd.address.replace(/[^a-z0-9]/gi, "_").toLowerCase().slice(0, 30);
    doc.save(`gtp_r${rd.number}_${safeName}.pdf`);
    setExportStatus("PDF exported \u2713");
    setTimeout(() => setExportStatus(""), 3000);
  }, [episode, currentRound]);

  // ═══════════════════════════════════════════════════════════
  //  LIVE MODE
  // ═══════════════════════════════════════════════════════════
  const enterLiveMode = () => {
    setLiveMode(true);
    setS(prev => ({ ...prev, _editorMode: false }));
    setLiveStep(0);
    setLivePhotoIndex(0);
    setOverlayVisible(true);
    setPhotoAnimProgress(1);
    setRatio("16:9");
    setActiveAsset("property");
    loadRound(currentRound + 1);
    // Request fullscreen (iPad Safari uses webkit prefix)
    const el = document.documentElement;
    if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen();
  };

  const exitLiveMode = () => {
    setLiveMode(false);
    setS(prev => ({ ...prev, _editorMode: true }));
    cancelAnimationFrame(photoAnimRef.current);
    cancelAnimationFrame(transitionRef.current);
    if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.exitFullscreen) document.exitFullscreen();
  };

  // Listen for fullscreen exit via system gesture
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        setLiveMode(false);
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  // Prevent page scroll in live mode
  useEffect(() => {
    if (!liveMode) return;
    const prevent = (e) => e.preventDefault();
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => document.removeEventListener("touchmove", prevent);
  }, [liveMode]);

  // Photo entrance animation
  useEffect(() => {
    if (!liveMode || LIVE_FLOW[liveStep] !== "property") return;
    cancelAnimationFrame(photoAnimRef.current);
    setPhotoAnimProgress(0);
    const start = performance.now();
    const dur = 2000;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = easeOutExpo(t);
      setPhotoAnimProgress(eased);
      if (t < 1) photoAnimRef.current = requestAnimationFrame(tick);
    };
    photoAnimRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(photoAnimRef.current);
  }, [liveMode, liveStep, livePhotoIndex]);

  // Asset cross-fade transition
  const transitionToAsset = (newAsset) => {
    const canvas = canvasRef.current;
    if (!canvas) { setActiveAsset(newAsset); return; }
    const r2 = RATIOS[ratio];

    // Capture current frame
    if (!offscreenA.current) offscreenA.current = document.createElement("canvas");
    offscreenA.current.width = r2.W;
    offscreenA.current.height = r2.H;
    offscreenA.current.getContext("2d").drawImage(canvas, 0, 0);

    // Render new asset to offscreen B
    if (!offscreenB.current) offscreenB.current = document.createElement("canvas");
    offscreenB.current.width = r2.W;
    offscreenB.current.height = r2.H;
    const ctxB = offscreenB.current.getContext("2d");
    ctxB.clearRect(0, 0, r2.W, r2.H);
    const drawFn = DRAW_FNS[newAsset];
    if (drawFn) {
      const asset = ASSETS.find(a => a.id === newAsset);
      if (asset?.animated) drawFn(ctxB, r2.W, r2.H, S, 0);
      else drawFn(ctxB, r2.W, r2.H, S);
    }

    setActiveAsset(newAsset);

    // Cross-fade 400ms
    cancelAnimationFrame(transitionRef.current);
    const start = performance.now();
    const dur = 400;
    const ctx = canvas.getContext("2d");
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      ctx.clearRect(0, 0, r2.W, r2.H);
      ctx.globalAlpha = 1 - t;
      ctx.drawImage(offscreenA.current, 0, 0);
      ctx.globalAlpha = t;
      ctx.drawImage(offscreenB.current, 0, 0);
      ctx.globalAlpha = 1;
      if (t < 1) transitionRef.current = requestAnimationFrame(tick);
      else if (liveConnected) pushToLiveRef.current?.(newAsset); // sync to /live after transition (uses ref for latest state)
    };
    transitionRef.current = requestAnimationFrame(tick);
  };

  // Live step navigation
  const liveProceed = () => {
    // liveStep -1 = intro (not in LIVE_FLOW), 0+ = LIVE_FLOW index
    const next = liveStep + 1;
    if (next >= LIVE_FLOW.length) return;
    setLiveStep(next);
    const newAsset = LIVE_FLOW[next];
    transitionToAsset(newAsset);
    if (newAsset === "timer" || newAsset === "reveal") {
      setTimeout(() => playAnimation(), 450);
    }
  };

  const liveGoBack = () => {
    const prev = liveStep - 1;
    if (prev < -1) return;
    setLiveStep(prev);
    setLivePhotoIndex(0);
    const newAsset = prev < 0 ? "intro" : LIVE_FLOW[prev];
    transitionToAsset(newAsset);
    cancelAnimationFrame(animRef.current);
    setIsPlaying(false);
  };

  const liveLoadRound = (roundNum) => {
    loadRound(roundNum);
    setLiveStep(0);
    setLivePhotoIndex(0);
    transitionToAsset("roundtitle");
  };

  // Touch handlers for canvas in live mode
  const handleTouchStart = (e) => {
    if (!liveMode) return;
    const t = e.touches[0];
    _touchStart = { x: t.clientX, y: t.clientY, time: Date.now() };
  };

  const handleTouchEnd = (e) => {
    if (!liveMode || !_touchStart) return;
    const t = e.changedTouches[0];
    const gesture = detectGesture(_touchStart.x, _touchStart.y, t.clientX, t.clientY, Date.now() - _touchStart.time);
    _touchStart = null;
    if (!gesture) return;

    if (gesture === "tap") {
      setOverlayVisible(v => !v);
      return;
    }

    if (LIVE_FLOW[liveStep] === "property") {
      const rd = episode.rounds[currentRound];
      const photos = rd?.photos || [];
      if (gesture === "swipe-left" && photos.length > 0) {
        setLivePhotoIndex(i => Math.min(i + 1, photos.length - 1));
      } else if (gesture === "swipe-right" && photos.length > 0) {
        setLivePhotoIndex(i => Math.max(i - 1, 0));
      }
    } else {
      if (gesture === "swipe-left") liveProceed();
      else if (gesture === "swipe-right") liveGoBack();
    }
  };

  // Modified render for live mode photo gallery
  const liveRender = useCallback(() => {
    if (!liveMode || LIVE_FLOW[liveStep] !== "property") return false;
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const r2 = RATIOS[ratio];
    if (canvas.width !== r2.W || canvas.height !== r2.H) {
      canvas.width = r2.W;
      canvas.height = r2.H;
    }
    const ctx = canvas.getContext("2d");
    const rd = episode.rounds[currentRound];
    const photos = rd?.photos || [];
    const src = photos[livePhotoIndex] || null;
    drawPropertyGallery(ctx, r2.W, r2.H, S, src, photoAnimProgress, livePhotoIndex, photos.length);
    return true;
  }, [liveMode, liveStep, ratio, currentRound, livePhotoIndex, photoAnimProgress, S, episode]);

  // Trigger live render when photo anim progresses
  useEffect(() => { liveRender(); }, [liveRender]);

  // ═══════════════════════════════════════════════════════════
  //  CONTROLS
  // ═══════════════════════════════════════════════════════════
  const renderControls = () => {
    switch (activeAsset) {
      case "intro":
        return (<>
          <div style={{ ...sectionHead(), fontSize: DS.fsXs, color: GAME.gold }}>SHOW LOGO</div>
          <div style={label()}>Logo Image (PNG)</div>
          <input style={inputS()} placeholder="Paste image URL…" value={episode.logoImage || ""}
            onChange={e => { setEpisodes(prev => prev.map(ep => ep.id === activeEpisodeId ? { ...ep, logoImage: e.target.value } : ep)); setDirty(true); getCachedImage(e.target.value); }} />
          <div
            style={{ marginTop: DS.xs, padding: DS.md, border: `2px dashed ${DS.borderSubtle}`, borderRadius: DS.rSm, textAlign: "center", cursor: "pointer", background: "rgba(255,255,255,0.02)" }}
            onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/png,image/webp"; inp.onchange = async (ev) => { const f = ev.target.files[0]; if (!f) return; const reader = new FileReader(); reader.onload = async (re) => { const b64 = re.target.result; const url = await uploadPhotoToBlob(b64, "logo", 0); setEpisodes(prev => prev.map(ep => ep.id === activeEpisodeId ? { ...ep, logoImage: url } : ep)); setDirty(true); getCachedImage(url); }; reader.readAsDataURL(f); }; inp.click(); }}
          >
            <div style={{ fontSize: DS.fsXs, color: DS.textMuted }}>or click to upload PNG</div>
          </div>
          {episode.logoImage && <img src={episode.logoImage} style={{ maxWidth: "100%", maxHeight: 80, objectFit: "contain", marginTop: DS.sm, borderRadius: 4, background: "rgba(0,0,0,0.3)", padding: 8 }} alt="Logo preview" />}
          {episode.logoImage && <button onClick={() => { setEpisodes(prev => prev.map(ep => ep.id === activeEpisodeId ? { ...ep, logoImage: "" } : ep)); setDirty(true); }} style={btn({ padding: "3px 8px", fontSize: DS.fsXs, color: DS.textMuted, marginTop: DS.xs })}>Remove logo</button>}

          <div style={{ ...sectionHead(), marginTop: DS.xl, fontSize: DS.fsXs, color: GAME.gold }}>FALLBACK TITLE</div>
          <div style={label()}>Show Title</div>
          <input style={inputS()} value={S.showTitle} onChange={e => updateS("showTitle", e.target.value)} />
          {[0, 1].map(idx => (
            <div key={idx} style={{ marginTop: DS.lg }}>
              <div style={label()}>{episode.agents[idx]} Headshot</div>
              <div style={{ display: "flex", gap: DS.xs, alignItems: "center" }}>
                <input style={inputS({ flex: 1 })} placeholder="Paste URL…" value={episode.agentImages?.[idx] || ""}
                  onChange={e => { const imgs = [...(episode.agentImages || ["", ""])]; imgs[idx] = e.target.value; setEpisodes(prev => prev.map(ep => ep.id === activeEpisodeId ? { ...ep, agentImages: imgs } : ep)); setDirty(true); getCachedImage(e.target.value); }} />
                <button onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.onchange = async (ev) => { const f = ev.target.files[0]; if (!f) return; const b64 = await compressPhoto(f, 0); const url = await uploadPhotoToBlob(b64, "agent", idx); const imgs = [...(episode.agentImages || ["", ""])]; imgs[idx] = url; setEpisodes(prev => prev.map(ep => ep.id === activeEpisodeId ? { ...ep, agentImages: imgs } : ep)); setDirty(true); getCachedImage(url); }; inp.click(); }}
                  style={btn({ padding: "6px 10px", fontSize: DS.fsXs })}>Upload</button>
              </div>
              {episode.agentImages?.[idx] && <img src={episode.agentImages[idx]} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", marginTop: DS.xs, border: `2px solid ${GAME.gold}` }} alt="" />}
            </div>
          ))}
        </>);
      case "property": {
        const rd = episode.rounds[currentRound] || {};
        return (<>
          <div style={label()}>Address</div>
          <input style={inputS()} value={S.propAddress} onChange={e => { updateS("propAddress", e.target.value); updateRoundField("address", e.target.value); }} />
          <div style={{ ...label(), marginTop: DS.md }}>Location Label</div>
          <input style={inputS()} value={S.optionLocation} onChange={e => { updateS("optionLocation", e.target.value); updateRoundField("location", e.target.value); }} />

          <div style={{ ...sectionHead(), marginTop: DS.xl, fontSize: DS.fsXs, color: GAME.gold }}>PROPERTY DETAILS</div>
          <div style={{ display: "flex", gap: DS.sm, marginTop: DS.sm }}>
            <div style={{ flex: 1 }}>
              <div style={label()}>Beds</div>
              <input style={inputS({ width: "100%" })} type="number" min={0} value={rd.beds || 0} onChange={e => updateRoundField("beds", +e.target.value)} />
            </div>
            <div style={{ flex: 2 }}>
              <div style={label()}>Type</div>
              <select style={inputS({ width: "100%" })} value={rd.type || ""} onChange={e => updateRoundField("type", e.target.value)}>
                <option value="">Select…</option>
                <option>Terraced</option>
                <option>Semi-detached</option>
                <option>Detached</option>
                <option>End of terrace</option>
                <option>Flat</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: DS.sm, marginTop: DS.sm }}>
            <div style={{ flex: 1 }}>
              <div style={label()}>Tenure</div>
              <select style={inputS({ width: "100%" })} value={rd.tenure || ""} onChange={e => updateRoundField("tenure", e.target.value)}>
                <option value="">Select…</option>
                <option>Freehold</option>
                <option>Leasehold</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <div style={label()}>Added Date</div>
              <input style={inputS({ width: "100%" })} value={rd.addedDate || ""} placeholder="DD/MM/YYYY" onChange={e => updateRoundField("addedDate", e.target.value)} />
            </div>
          </div>
          <div style={{ ...label(), marginTop: DS.sm }}>Property URL</div>
          <div style={{ display: "flex", gap: DS.xs }}>
            <input style={inputS({ flex: 1 })} value={rd.rightmoveUrl || ""} placeholder="Rightmove, Zoopla, OnTheMarket or PrimeLocation…" onChange={e => updateRoundField("rightmoveUrl", e.target.value)} />
            <button onClick={async () => {
              const propUrl = rd.rightmoveUrl;
              if (!propUrl) return;
              // Capture episode/round at fetch start — prevents cross-contamination if user switches
              const fetchEpId = activeEpisodeId;
              const fetchRoundIdx = currentRound;
              const updateFetchRound = (field, value) => {
                setEpisodes(prev => prev.map(ep => {
                  if (ep.id !== fetchEpId) return ep;
                  const rounds = [...ep.rounds];
                  if (rounds[fetchRoundIdx]) rounds[fetchRoundIdx] = { ...rounds[fetchRoundIdx], [field]: value };
                  return { ...ep, rounds };
                }));
                setDirty(true);
              };
              setSaveStatus("Fetching property…");
              try {
                const res = await fetch("/api/gtp/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: propUrl }) });
                const data = await res.json();
                if (!data.success) { setSaveStatus(data.error || "Fetch failed"); setTimeout(() => setSaveStatus(""), 3000); return; }
                const p = data.property;
                // Populate round fields
                if (p.address) { updateFetchRound("address", p.address); updateS("propAddress", p.address); }
                if (p.location) { updateFetchRound("location", p.location); updateS("optionLocation", p.location); }
                if (p.beds) { updateFetchRound("beds", p.beds); updateS("propBeds", p.beds); }
                if (p.type) { updateFetchRound("type", p.type); updateS("propType", p.type); }
                if (p.tenure) { updateFetchRound("tenure", p.tenure); updateS("propTenure", p.tenure); }
                if (p.addedDate) { updateFetchRound("addedDate", p.addedDate); updateS("propAddedDate", p.addedDate); }
                // Auto-generate A/B/C price options from listing price
                if (p.price) {
                  const rawPrice = parseInt(p.price.replace(/[^0-9]/g, ""));
                  if (rawPrice > 0) {
                    const variance1 = Math.round(rawPrice * (0.10 + Math.random() * 0.10));
                    const variance2 = Math.round(rawPrice * (0.10 + Math.random() * 0.10));
                    const wrong1 = rawPrice - variance1;
                    const wrong2 = rawPrice + variance2;
                    const round5k = (v) => Math.round(v / 5000) * 5000;
                    const prices = [round5k(wrong1), rawPrice, round5k(wrong2)].sort(() => Math.random() - 0.5);
                    const fmt = (v) => `£${v.toLocaleString()}`;
                    const correctIdx = prices.indexOf(rawPrice);
                    const correctLetter = ["A", "B", "C"][correctIdx];
                    updateFetchRound("optionA", fmt(prices[0])); updateS("optionA", fmt(prices[0]));
                    updateFetchRound("optionB", fmt(prices[1])); updateS("optionB", fmt(prices[1]));
                    updateFetchRound("optionC", fmt(prices[2])); updateS("optionC", fmt(prices[2]));
                    updateFetchRound("correctLetter", correctLetter); updateS("revealLetter", correctLetter);
                    updateFetchRound("correctPrice", rawPrice.toLocaleString()); updateS("revealPrice", rawPrice.toLocaleString());
                  }
                }
                // Download and upload photos
                if (p.photos && p.photos.length > 0) {
                  setSaveStatus(`Downloading ${p.photos.length} photos…`);
                  for (let pi = 0; pi < p.photos.length; pi++) {
                    try {
                      setSaveStatus(`Photo ${pi + 1}/${p.photos.length}…`);
                      if (pi > 0) await new Promise(r => setTimeout(r, 300));
                      const imgRes = await fetch(`/api/gtp/scrape?img=${encodeURIComponent(p.photos[pi])}`);
                      if (!imgRes.ok) continue;
                      const imgBlob = await imgRes.blob();
                      if (imgBlob.size < 50000) continue;
                      const form = new FormData();
                      form.append("photo", imgBlob, "photo.jpg");
                      form.append("episodeId", String(fetchEpId));
                      form.append("round", String(fetchRoundIdx));
                      form.append("index", String(Date.now()));
                      const upRes = await fetch("/api/gtp/photo", { method: "POST", body: form });
                      const upData = await upRes.json();
                      if (upData.url) {
                        setEpisodes(prev => prev.map(ep => {
                          if (ep.id !== fetchEpId) return ep;
                          const rounds = [...ep.rounds];
                          if (rounds[fetchRoundIdx]) {
                            rounds[fetchRoundIdx] = { ...rounds[fetchRoundIdx], photos: [...(rounds[fetchRoundIdx].photos || []), upData.url] };
                          }
                          return { ...ep, rounds };
                        }));
                        setDirty(true);
                        getCachedImage(upData.url);
                      }
                    } catch {}
                  }
                }
                // Download floorplan and map as final images, track their indices
                const extraImages = [
                  p.floorplan ? { url: p.floorplan, label: "floorplan", type: "floorplan" } : null,
                  p.mapUrl ? { url: p.mapUrl, label: "map", type: "map" } : null,
                ].filter(Boolean);
                for (const extra of extraImages) {
                  try {
                    setSaveStatus(`Downloading ${extra.label}…`);
                    await new Promise(r => setTimeout(r, 500));
                    const imgRes = await fetch(`/api/gtp/scrape?img=${encodeURIComponent(extra.url)}`);
                    if (!imgRes.ok) { setSaveStatus(`${extra.label} failed (${imgRes.status})`); await new Promise(r => setTimeout(r, 1000)); continue; }
                    const imgBlob = await imgRes.blob();
                    if (imgBlob.size < 5000) { setSaveStatus(`${extra.label} too small`); await new Promise(r => setTimeout(r, 1000)); continue; }
                    const form = new FormData();
                    form.append("photo", imgBlob, "photo.jpg");
                    form.append("episodeId", String(fetchEpId));
                    form.append("round", String(fetchRoundIdx));
                    form.append("index", String(Date.now()));
                    const upRes = await fetch("/api/gtp/photo", { method: "POST", body: form });
                    const upData = await upRes.json();
                    if (upData.url) {
                      setEpisodes(prev => prev.map(ep => {
                        if (ep.id !== fetchEpId) return ep;
                        const rounds = [...ep.rounds];
                        if (rounds[fetchRoundIdx]) {
                          const newPhotos = [...(rounds[fetchRoundIdx].photos || []), upData.url];
                          const update = { ...rounds[fetchRoundIdx], photos: newPhotos };
                          // Tag floorplan/map index for special rendering
                          if (extra.type === "floorplan") update.floorplanIndex = newPhotos.length - 1;
                          if (extra.type === "map") update.mapIndex = newPhotos.length - 1;
                          rounds[fetchRoundIdx] = update;
                        }
                        return { ...ep, rounds };
                      }));
                      setDirty(true);
                      getCachedImage(upData.url);
                    }
                  } catch {}
                }
                setSaveStatus(`Property loaded ✓`);
                setTimeout(() => setSaveStatus(""), 3000);
              } catch (err) {
                setSaveStatus("Fetch failed");
                setTimeout(() => setSaveStatus(""), 3000);
              }
            }} style={btn({ padding: "6px 12px", fontSize: DS.fsXs, whiteSpace: "nowrap", background: GAME.gold, color: GAME.navy, border: "none", fontWeight: 700 })}>
              Fetch
            </button>
          </div>

          <div style={{ ...sectionHead(), marginTop: DS.xl, fontSize: DS.fsXs, color: GAME.gold }}>PHOTOS ({(rd.photos || []).length})</div>
          {/* Compact upload + manage button */}
          <div style={{ display: "flex", gap: DS.sm, marginTop: DS.sm }}>
            <div
              style={{ flex: 1, padding: `${DS.sm}px ${DS.md}px`, border: `2px dashed ${DS.borderSubtle}`, borderRadius: DS.rSm, textAlign: "center", cursor: "pointer", background: "rgba(255,255,255,0.02)" }}
              onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.multiple = true; inp.onchange = (e) => handlePhotoUpload(e.target.files); inp.click(); }}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = GAME.gold; }}
              onDragLeave={e => { e.currentTarget.style.borderColor = DS.borderSubtle; }}
              onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = DS.borderSubtle; handlePhotoUpload(e.dataTransfer.files); }}
            >
              <div style={{ fontSize: DS.fsSm, color: DS.textMuted }}>+ Add</div>
            </div>
            {(rd.photos || []).length > 0 && (
              <button onClick={() => setPhotoManagerOpen(true)} style={btnPositive({ padding: "6px 14px", fontSize: DS.fsSm })}>
                Manage ({(rd.photos || []).length})
              </button>
            )}
          </div>
          {/* Mini preview strip */}
          {(rd.photos || []).length > 0 && (
            <div style={{ display: "flex", gap: 3, marginTop: DS.sm, overflowX: "auto" }}>
              {(rd.photos || []).slice(0, 8).map((photo, i) => (
                <img key={i} src={photo} alt="" onClick={() => { setPhotoManagerOpen(true); }}
                  style={{ width: 30, height: 22, objectFit: "cover", borderRadius: 3, cursor: "pointer",
                    border: (rd.heroPhotoIndex || 0) === i ? `2px solid ${GAME.gold}` : `1px solid ${DS.borderSubtle}` }} />
              ))}
              {(rd.photos || []).length > 8 && <span style={{ fontSize: DS.fsXs, color: DS.textMuted, alignSelf: "center" }}>+{(rd.photos || []).length - 8}</span>}
            </div>
          )}

          <div style={{ ...sectionHead(), marginTop: DS.xl, fontSize: DS.fsXs, color: GAME.gold }}>NOTES</div>
          <textarea style={{ ...inputS(), height: 60, resize: "vertical", marginTop: DS.sm }} value={rd.notes || ""} placeholder="Production notes…" onChange={e => updateRoundField("notes", e.target.value)} />
        </>);
      }
      case "prompt":
        return <p style={{ color: DS.textMuted, fontSize: DS.fsSm }}>No editable fields &mdash; this card is fixed.</p>;
      case "options":
        return (<>
          {["A", "B", "C"].map(letter => (
            <div key={letter} style={{ marginTop: letter === "A" ? 0 : DS.md }}>
              <div style={{ ...label(), display: "flex", alignItems: "center", gap: DS.xs }}>
                Option {letter}
                {S.revealLetter === letter && <span style={{ color: GAME.gold, fontSize: 10 }}>CORRECT</span>}
              </div>
              <input style={inputS({ borderColor: S.revealLetter === letter ? "rgba(42,157,143,0.5)" : DS.borderSubtle })}
                value={letter === "A" ? S.optionA : letter === "B" ? S.optionB : S.optionC}
                onChange={e => updateS(`option${letter}`, e.target.value)} />
            </div>
          ))}
          <div style={{ ...label(), marginTop: DS.lg }}>Location</div>
          <input style={inputS()} value={S.optionLocation} onChange={e => updateS("optionLocation", e.target.value)} />
        </>);
      case "lockin":
        return (<>
          <div style={label()}>Agent Name</div>
          <input style={inputS()} value={S.lockAgent} onChange={e => updateS("lockAgent", e.target.value)} />
          <div style={{ ...label(), marginTop: DS.lg }}>Locked Letter</div>
          <div style={{ display: "flex", gap: DS.sm }}>
            {["A", "B", "C"].map(l => (
              <button key={l} onClick={() => updateS("lockLetter", l)}
                style={btn({
                  padding: "10px 20px", fontSize: DS.fsLg, fontWeight: 800,
                  background: S.lockLetter === l ? ({ A: GAME.optionA, B: GAME.optionB, C: GAME.optionC }[l]) : DS.bgButton,
                  color: "#fff",
                })}>{l}</button>
            ))}
          </div>
          <div style={{ marginTop: DS.xl, borderTop: `1px solid ${DS.borderSubtle}`, paddingTop: DS.lg }}>
            <label style={{ display: "flex", alignItems: "center", gap: DS.sm, cursor: "pointer", fontSize: DS.fsSm, color: DS.textSecondary }}>
              <input type="checkbox" checked={sequenceMode} onChange={e => setSequenceMode(e.target.checked)}
                style={{ accentColor: GAME.gold, width: 16, height: 16 }} />
              Full Sequence (Lock → Timer → Reveal → Score)
            </label>
            {sequenceMode && (
              <button onClick={playSequence} style={btnCta({ marginTop: DS.md, padding: "10px 20px", fontSize: DS.fsSm, width: "100%" })}>
                Play Full Sequence
              </button>
            )}
          </div>
        </>);
      case "timer":
        return (<>
          <div style={label()}>Duration (seconds)</div>
          <input style={inputS({ width: 80 })} type="number" min={1} max={10} value={S.timerDuration}
            onChange={e => updateS("timerDuration", +e.target.value)} />
          <div style={{ marginTop: DS.lg }}>
            <button onClick={playAnimation} style={btnCta()}>
              {isPlaying ? "\u23f8 Pause" : "\u25b6 Preview"}
            </button>
          </div>
        </>);
      case "reveal":
        return (<>
          <div style={label()}>Correct Letter</div>
          <div style={{ display: "flex", gap: DS.sm }}>
            {["A", "B", "C"].map(l => (
              <button key={l} onClick={() => updateS("revealLetter", l)}
                style={btn({
                  padding: "10px 20px", fontSize: DS.fsLg, fontWeight: 800,
                  background: S.revealLetter === l ? ({ A: GAME.optionA, B: GAME.optionB, C: GAME.optionC }[l]) : DS.bgButton,
                  color: "#fff",
                })}>{l}</button>
            ))}
          </div>
          <div style={{ ...label(), marginTop: DS.lg }}>Correct Price</div>
          <input style={inputS()} value={S.revealPrice} onChange={e => updateS("revealPrice", e.target.value)} />
          <div style={{ marginTop: DS.lg }}>
            <button onClick={playAnimation} style={btnCta()}>
              {isPlaying ? "\u23f8 Pause" : "\u25b6 Preview"}
            </button>
          </div>
        </>);
      case "scoreboard":
        return <p style={{ color: DS.textMuted, fontSize: DS.fsSm }}>Scores controlled from the round bar above. Use +1 buttons.</p>;
      default:
        return null;
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════
  const r = RATIOS[ratio];
  const round = episode.rounds[currentRound];
  const isRoundEmpty = (rd) => !rd.address;

  // ═══════════════════════════════════════════════════════════
  //  DISPLAY MODE — fullscreen canvas, polls /api/gtp/live
  // ═══════════════════════════════════════════════════════════
  const [displayState, setDisplayState] = useState(null);
  const displayPollRef = useRef(null);
  const displayAnimRef = useRef(null);
  const lastTsRef = useRef(0);
  const [dispShowUI, setDispShowUI] = useState(true);
  const dispUITimerRef = useRef(null);

  // Handle incoming display state (from BroadcastChannel or poll)
  // Only accept NEWER timestamps — prevents stale poll data overwriting fresh BroadcastChannel data
  const handleDisplayData = useCallback((data) => {
    if (!data.ts || data.ts <= lastTsRef.current) return;
    lastTsRef.current = data.ts;
    setDisplayState(data);
    if (data.logoImage) getCachedImage(data.logoImage);
    (data.agentImages || []).forEach(u => u && getCachedImage(u));
    ((data.roundData?.photos) || data.photos || []).forEach(u => u && getCachedImage(u));
  }, []);

  // Re-render display when images load (agent photos, logos, property photos)
  const [dispImgTick, setDispImgTick] = useState(0);
  useEffect(() => {
    if (!displayMode) return;
    _imgLoadCallback = () => setDispImgTick(t => t + 1);
    return () => { _imgLoadCallback = null; };
  }, [displayMode]);
  // Force re-draw when images load (bypass key check)
  useEffect(() => {
    if (!displayMode || !displayState) return;
    const ds = displayState;
    const canvas = canvasRef.current;
    if (!canvas || ds.asset === "property") return; // property has its own loop
    const drawFn = DRAW_FNS[ds.asset];
    if (drawFn) drawFn(canvas.getContext("2d"), canvas.width, canvas.height, ds.S, 1);
  }, [dispImgTick]); // eslint-disable-line — intentionally redraw on image load

  useEffect(() => {
    if (!displayMode) return;
    loadFont("DM Sans");
    loadFont("Lora");
    // Wait for fonts before allowing first render
    document.fonts?.ready?.then(() => setDispImgTick(t => t + 1));
    getCachedImage(BRAND.logoUrl);
    getCachedImage(BRAND.logoUrlLight);

    // BroadcastChannel for instant same-browser sync
    let bc;
    try {
      bc = new BroadcastChannel(GTP_CHANNEL_NAME);
      bc.onmessage = (e) => handleDisplayData(e.data);
    } catch {}

    // Polling fallback for cross-device (200ms interval + cache-busting)
    const poll = async () => {
      try {
        const res = await fetch("/api/gtp/live?_=" + Date.now());
        const data = await res.json();
        handleDisplayData(data);
      } catch {}
    };
    poll();
    displayPollRef.current = setInterval(poll, 200);
    // Recalculate CSS letterboxing on resize/orientation change
    const onResize = () => setDispImgTick(t => t + 1);
    window.addEventListener("resize", onResize);

    return () => { clearInterval(displayPollRef.current); try { bc?.close(); } catch {} window.removeEventListener("resize", onResize); };
  }, [displayMode]);

  // Keep a ref to the current display state so the animation loop always reads the latest
  const displayStateRef = useRef(null);
  const displayKeyRef = useRef(""); // tracks asset+round to detect actual slide changes
  useEffect(() => { displayStateRef.current = displayState; }, [displayState]);

  // Update EPISODE data whenever display state changes (without restarting animations)
  useEffect(() => {
    if (!displayMode || !displayState) return;
    const ds = displayState;
    const roundIdx = (ds.round || 1) - 1;
    const updatedRounds = [...(EPISODE.rounds || [])];
    if (ds.roundData) {
      while (updatedRounds.length <= roundIdx) updatedRounds.push({ number: updatedRounds.length + 1, photos: [], heroPhotoIndex: 0 });
      updatedRounds[roundIdx] = ds.roundData;
    }
    EPISODE = {
      ...EPISODE,
      agents: ds.agents || ["Agent 1", "Agent 2"],
      agentImages: ds.agentImages || ["", ""],
      logoImage: ds.logoImage || "",
      rounds: updatedRounds,
    };
  }, [displayMode, displayState]);

  // Render display canvas — only restarts animation when asset or round changes
  useEffect(() => {
    if (!displayMode || !displayState) return;
    const ds = displayState;
    // Key determines whether to restart the animation
    // Use ts for sequence assets so each push replays the animation
    const newKey = ds.asset === "property" ? `property_${ds.round}`
      : ds.asset === "scoreboard" ? `scoreboard_${ds.round}_${(ds.scores || []).join(",")}`
      : `${ds.asset}_${ds.round}_${ds.ts}`;
    if (newKey === displayKeyRef.current) {
      return;
    }
    displayKeyRef.current = newKey;
    if (ds.asset !== "property") { setDispPaused(false); dispManualPhotoRef.current = -1; } // reset on slide change

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Render at screen dimensions — fills display with no bars or stretching
    const dpr = window.devicePixelRatio || 1;
    const cW = Math.round(window.innerWidth * dpr);
    const cH = Math.round(window.innerHeight * dpr);
    if (canvas.width !== cW || canvas.height !== cH) { canvas.width = cW; canvas.height = cH; }

    const drawFn = DRAW_FNS[ds.asset];
    if (!drawFn) return;

    cancelAnimationFrame(displayAnimRef.current);

    // Calculate animation duration per asset
    const numPhotos = Math.max(1, ds.roundData?.photos?.length || 1);
    const dur = ds.asset === "intro" ? 6000
      : ds.asset === "timer" ? (ds.S?.timerDuration || 3) * 1000
      : ds.asset === "property" ? (ds.S?.photoDuration || 5) * numPhotos * 1000
      : 3000;

    // All assets play their entrance animation, then hold at p=1
    // Property loops continuously after finishing
    let pausedAt = null; // tracks when pause started for resuming
    const runAnimation = (startTime) => {
      const tick = (now) => {
        const curDs = displayStateRef.current;
        if (!curDs || curDs.asset !== ds.asset) return; // asset changed, stop

        // Pause support for property: hold at current frame
        if (ds.asset === "property" && dispPausedRef.current) {
          if (!pausedAt) pausedAt = now;
          displayAnimRef.current = requestAnimationFrame(tick);
          return;
        }
        // Resume: adjust start time by pause duration
        if (pausedAt) { startTime += (now - pausedAt); pausedAt = null; }

        const p = Math.min(1, (now - startTime) / dur);
        const cx = canvas.getContext("2d");
        cx.clearRect(0, 0, cW, cH);
        const drawS = ds.asset === "property" ? (displayStateRef.current?.S || ds.S) : ds.S;
        drawFn(cx, cW, cH, drawS, p);
        if (p < 1) {
          displayAnimRef.current = requestAnimationFrame(tick);
        } else if (ds.asset === "property") {
          runAnimation(performance.now());
        }
      };
      displayAnimRef.current = requestAnimationFrame(tick);
    };
    runAnimation(performance.now());
    return () => cancelAnimationFrame(displayAnimRef.current);
  }, [displayMode, displayState]);

  // Display: tap to pause, swipe to step through photos
  const [dispPaused, setDispPaused] = useState(false);
  const dispPausedRef = useRef(false);
  const dispManualPhotoRef = useRef(-1); // -1 = auto, 0+ = manual photo index
  useEffect(() => { dispPausedRef.current = dispPaused; }, [dispPaused]);

  const dispTouchStartRef = useRef(null);
  const dispHandleTouchStart = (e) => {
    dispTouchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
  };
  const dispHandleTouchEnd = (e) => {
    if (!dispTouchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - dispTouchStartRef.current.x;
    const dt = Date.now() - dispTouchStartRef.current.time;
    dispTouchStartRef.current = null;

    if (dt > 500 || Math.abs(dx) < 40) {
      // Tap — toggle pause on property
      if (displayState?.asset === "property") setDispPaused(p => !p);
      dispShowUIBriefly();
      return;
    }

    // Swipe on property — step through photos manually
    if (displayState?.asset === "property") {
      const photos = displayState.roundData?.photos || [];
      if (photos.length <= 1) return;
      setDispPaused(true);
      dispManualPhotoRef.current = Math.max(0, Math.min(photos.length - 1,
        (dispManualPhotoRef.current < 0 ? 0 : dispManualPhotoRef.current) + (dx < 0 ? 1 : -1)
      ));
      // Draw the specific photo
      const canvas = canvasRef.current;
      if (canvas) {
        const p = (dispManualPhotoRef.current + 0.5) / photos.length;
        const cx = canvas.getContext("2d");
        cx.clearRect(0, 0, canvas.width, canvas.height);
        DRAW_FNS.property(cx, canvas.width, canvas.height, displayState.S, p);
      }
    }
  };

  const dispHandleTap = () => {
    if (displayState?.asset === "property") {
      const wasPaused = dispPaused;
      setDispPaused(p => !p);
      if (wasPaused) dispManualPhotoRef.current = -1; // resume auto
    }
    dispShowUIBriefly();
  };

  // Show/hide UI on mouse/touch activity
  const dispShowUIBriefly = () => {
    setDispShowUI(true);
    clearTimeout(dispUITimerRef.current);
    dispUITimerRef.current = setTimeout(() => setDispShowUI(false), 3000);
  };

  // Calculate CSS dimensions for letterboxed canvas
  const dispCanvasW = displayState?.canvasW || 1920;
  const dispCanvasH = displayState?.canvasH || 1080;
  const dispAR = dispCanvasW / dispCanvasH;
  const screenW = typeof window !== "undefined" ? window.innerWidth : 1920;
  const screenH = typeof window !== "undefined" ? window.innerHeight : 1080;
  const screenAR = screenW / screenH;
  const dispCssW = screenAR > dispAR ? Math.round(screenH * dispAR) : screenW;
  const dispCssH = screenAR > dispAR ? screenH : Math.round(screenW / dispAR);

  if (displayMode) {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", cursor: dispShowUI ? "default" : "none", overflow: "hidden", touchAction: "none" }}
        onMouseMove={dispShowUIBriefly} onMouseDown={(e) => { if (e.detail > 0 && !("ontouchstart" in window)) dispHandleTap(); }}
        onTouchStart={dispHandleTouchStart} onTouchEnd={dispHandleTouchEnd}>
        <canvas ref={canvasRef}
          style={{ position: "absolute", top: 0, left: 0, width: "100vw", height: "100dvh", display: "block" }} />
        {!displayState && (
          <div style={{ position: "absolute", color: "rgba(255,255,255,0.3)", fontFamily: DS.font, fontSize: 14 }}>
            Waiting for controller...
          </div>
        )}
        {/* Go fullscreen button — only when NOT already fullscreen */}
        {dispShowUI && !document.fullscreenElement && !document.webkitFullscreenElement && (
          <button onClick={(e) => { e.stopPropagation(); const el = document.documentElement; if (el.webkitRequestFullscreen) el.webkitRequestFullscreen(); else if (el.requestFullscreen) el.requestFullscreen(); }}
            style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.5)", border: "none", color: "rgba(255,255,255,0.6)", borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer", fontFamily: DS.font }}>
            Fullscreen
          </button>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  LIVE MODE RENDER
  // ═══════════════════════════════════════════════════════════
  if (liveMode) {
    const rd = episode.rounds[currentRound];
    const photos = rd?.photos || [];
    const currentFlowAsset = LIVE_FLOW[liveStep];

    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "#000", fontFamily: DS.font, touchAction: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Fullscreen canvas — letterboxed to maintain aspect ratio */}
        <canvas ref={canvasRef} width={r.W} height={r.H}
          style={{ maxWidth: "100vw", maxHeight: "100vh", width: `min(100vw, calc(100vh * ${r.W / r.H}))`, height: `min(100vh, calc(100vw * ${r.H / r.W}))`, display: "block" }}
          onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} />

        {/* Floating overlay */}
        {overlayVisible && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", padding: `12px 16px calc(12px + env(safe-area-inset-bottom, 0px)) 16px` }}>

            {/* Round selector */}
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 10 }}>
              {episode.rounds.map((rd2, i) => (
                <button key={i} onClick={() => !isRoundEmpty(rd2) && liveLoadRound(i + 1)}
                  style={{ padding: `${DS.xs + 2}px ${DS.md}px`, fontSize: DS.fsMd, fontWeight: 700, border: "none", borderRadius: 20, cursor: isRoundEmpty(rd2) ? "default" : "pointer",
                    background: currentRound === i ? GAME.gold : isRoundEmpty(rd2) ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.12)",
                    color: currentRound === i ? "#000" : isRoundEmpty(rd2) ? "rgba(255,255,255,0.2)" : "#fff",
                    opacity: isRoundEmpty(rd2) ? 0.4 : 1 }}>
                  R{i + 1}
                </button>
              ))}
            </div>

            {/* Flow step dots — 44px min touch targets */}
            <div style={{ display: "flex", gap: 2, justifyContent: "center", marginBottom: 12 }}>
              {LIVE_FLOW.map((step, i) => (
                <div key={i} onClick={() => { setLiveStep(i); transitionToAsset(step); if (step === "timer" || step === "reveal") setTimeout(() => playAnimation(), 450); }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 44, minHeight: 44, cursor: "pointer" }}>
                  <div style={{ width: liveStep === i ? 24 : 10, height: 10, borderRadius: 5, transition: "all 0.2s",
                    background: i < liveStep ? "rgba(251,135,112,0.4)" : i === liveStep ? GAME.gold : "rgba(255,255,255,0.2)" }} />
                </div>
              ))}
            </div>

            {/* Lock-in letter selector (lockin step only) */}
            {currentFlowAsset === "lockin" && (
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
                {["A", "B", "C"].map(l => (
                  <button key={l} onClick={() => { updateS("lockLetter", l); pushToLiveRef.current?.(); }}
                    style={{ padding: `${DS.sm}px ${DS.xl}px`, fontSize: 18, fontWeight: 800, border: "none", borderRadius: DS.rSm, minWidth: 60, minHeight: 48, cursor: "pointer",
                      background: S.lockLetter === l ? ({ A: GAME.optionA, B: GAME.optionB, C: GAME.optionC }[l]) : "rgba(255,255,255,0.15)",
                      color: "#fff" }}>{l}</button>
                ))}
              </div>
            )}

            {/* Nav + Scores */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <button onClick={liveGoBack} style={{ padding: `${DS.sm}px ${DS.lg}px`, fontSize: DS.fsMd, fontWeight: 700, border: "none", borderRadius: DS.rSm, background: "rgba(255,255,255,0.1)", color: DS.textPrimary, cursor: "pointer" }}>Back</button>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: DS.textPrimary, fontSize: DS.fsMd, fontWeight: 600 }}>{episode.agents[0]}</span>
                <span style={{ background: GAME.gold, color: GAME.navy, fontWeight: 800, padding: "2px 10px", borderRadius: DS.rMd, fontSize: DS.fsLg }}>{scores[0]}</span>
                <button onClick={() => addScore(0)} style={{ padding: `${DS.sm}px ${DS.md}px`, fontSize: DS.fsMd, fontWeight: 700, border: "none", borderRadius: DS.rSm, background: "rgba(255,255,255,0.15)", color: DS.textPrimary, cursor: "pointer", minWidth: 44, minHeight: 44 }}>+1</button>
              </div>

              <span style={{ color: DS.textMuted, fontSize: DS.fsSm }}>vs</span>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: DS.textPrimary, fontSize: DS.fsMd, fontWeight: 600 }}>{episode.agents[1]}</span>
                <span style={{ background: GAME.gold, color: GAME.navy, fontWeight: 800, padding: "2px 10px", borderRadius: DS.rMd, fontSize: DS.fsLg }}>{scores[1]}</span>
                <button onClick={() => addScore(1)} style={{ padding: `${DS.sm}px ${DS.md}px`, fontSize: DS.fsMd, fontWeight: 700, border: "none", borderRadius: DS.rSm, background: "rgba(255,255,255,0.15)", color: DS.textPrimary, cursor: "pointer", minWidth: 44, minHeight: 44 }}>+1</button>
              </div>

              <button onClick={liveProceed} style={{ padding: `${DS.sm}px ${DS.lg}px`, fontSize: DS.fsMd, fontWeight: 700, border: "none", borderRadius: DS.rSm, background: GAME.gold, color: GAME.navy, cursor: "pointer" }}>Next</button>
            </div>

            {/* Photo dots (property step only) */}
            {currentFlowAsset === "property" && photos.length > 1 && (
              <div style={{ display: "flex", gap: 2, justifyContent: "center", marginTop: 8 }}>
                {photos.map((_, i) => (
                  <div key={i} onClick={() => setLivePhotoIndex(i)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 36, minHeight: 36, cursor: "pointer" }}>
                    <div style={{ width: livePhotoIndex === i ? 20 : 8, height: 8, borderRadius: 4, transition: "all 0.2s",
                      background: livePhotoIndex === i ? GAME.gold : "rgba(255,255,255,0.3)" }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Exit button */}
        <button onClick={exitLiveMode}
          style={{ position: "fixed", top: 12, right: 12, zIndex: 10000, padding: "6px 14px", fontSize: 12, fontWeight: 700, border: "none", borderRadius: 8, background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.7)", cursor: "pointer", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
          EXIT
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  PHOTO MANAGER MODAL — full-screen grid with drag reorder
  // ═══════════════════════════════════════════════════════════
  const mgrRd = episode.rounds[currentRound];
  const mgrPhotos = mgrRd?.photos || [];
  const photoManager = photoManagerOpen && mgrPhotos.length > 0 ? (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column", fontFamily: DS.font }}
      onClick={() => setPhotoManagerOpen(false)}>
      {/* Header */}
      <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${DS.borderSubtle}` }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: DS.textPrimary }}>Photos — Round {(mgrRd?.number || 1)}</span>
          <span style={{ fontSize: 12, color: DS.textMuted }}>{mgrPhotos.length} photos · Drag to reorder</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.multiple = true; inp.onchange = (e) => handlePhotoUpload(e.target.files); inp.click(); }}
            style={btnPositive({ padding: "8px 16px", fontSize: 12 })}>+ Add Photos</button>
          <button onClick={() => setPhotoManagerOpen(false)}
            style={btn({ padding: "8px 16px", fontSize: 14 })}>Done</button>
        </div>
      </div>
      {/* Grid */}
      <div style={{ flex: 1, overflow: "auto", padding: 24 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {mgrPhotos.map((photo, i) => (
            <div key={i} draggable style={{
                position: "relative", borderRadius: 8, overflow: "hidden", cursor: "grab",
                border: dragPhotoIdx === i ? `2px solid ${GAME.gold}` : "2px solid transparent",
                opacity: dragPhotoIdx === i ? 0.5 : 1,
                transition: "opacity 0.15s",
              }}
              onDragStart={() => setDragPhotoIdx(i)}
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.border = `2px solid ${GAME.gold}`; }}
              onDragLeave={e => { e.currentTarget.style.border = "2px solid transparent"; }}
              onDrop={e => { e.preventDefault(); e.currentTarget.style.border = "2px solid transparent"; if (dragPhotoIdx !== null) reorderPhotos(dragPhotoIdx, i); setDragPhotoIdx(null); }}
              onDragEnd={() => setDragPhotoIdx(null)}
            >
              <img src={photo} alt={`Photo ${i + 1}`} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }}
                onClick={() => { setPhotoManagerOpen(false); setPhotoModalIdx(i); }} />
              {/* Number badge */}
              <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,0.7)", color: "#fff", borderRadius: 4, padding: "2px 6px", fontSize: 11, fontWeight: 700 }}>{i + 1}</div>
              {/* Hero badge */}
              {(mgrRd?.heroPhotoIndex || 0) === i && (
                <div style={{ position: "absolute", top: 6, right: 6, background: GAME.gold, color: GAME.navy, borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 800 }}>★ HERO</div>
              )}
              {/* Bottom actions */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "6px 8px", background: "linear-gradient(transparent, rgba(0,0,0,0.8))", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button onClick={(e) => { e.stopPropagation(); updateRoundField("heroPhotoIndex", i); }}
                  style={{ background: (mgrRd?.heroPhotoIndex || 0) === i ? GAME.gold : "rgba(255,255,255,0.15)", border: "none", color: (mgrRd?.heroPhotoIndex || 0) === i ? "#000" : "#fff", borderRadius: 4, padding: "3px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                  {(mgrRd?.heroPhotoIndex || 0) === i ? "Hero ★" : "Set Hero"}
                </button>
                <button onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                  style={{ background: "rgba(192,57,43,0.8)", border: "none", color: "#fff", borderRadius: 4, padding: "3px 8px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  // ═══════════════════════════════════════════════════════════
  //  PHOTO MODAL — single image viewer
  // ═══════════════════════════════════════════════════════════
  const photoModalRd = episode.rounds[currentRound];
  const photoModalPhotos = photoModalRd?.photos || [];
  const photoModal = photoModalIdx !== null && photoModalPhotos.length > 0 ? (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: DS.font }}
      onClick={() => setPhotoModalIdx(null)}>
      {/* Close */}
      <button onClick={() => setPhotoModalIdx(null)}
        style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: 20, width: 40, height: 40, borderRadius: "50%", cursor: "pointer" }}>X</button>

      {/* Main image */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: 20 }} onClick={e => e.stopPropagation()}>
        {/* Prev */}
        <button onClick={() => setPhotoModalIdx(Math.max(0, photoModalIdx - 1))}
          style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: 24, width: 48, height: 48, borderRadius: "50%", cursor: "pointer", flexShrink: 0, opacity: photoModalIdx > 0 ? 1 : 0.2 }}>
          ‹
        </button>
        <img src={photoModalPhotos[photoModalIdx]} alt="" style={{ maxWidth: "calc(100% - 140px)", maxHeight: "calc(100vh - 200px)", objectFit: "contain", borderRadius: 8, margin: "0 16px" }} />
        {/* Next */}
        <button onClick={() => setPhotoModalIdx(Math.min(photoModalPhotos.length - 1, photoModalIdx + 1))}
          style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: 24, width: 48, height: 48, borderRadius: "50%", cursor: "pointer", flexShrink: 0, opacity: photoModalIdx < photoModalPhotos.length - 1 ? 1 : 0.2 }}>
          ›
        </button>
      </div>

      {/* Bottom bar: thumbnails + actions */}
      <div style={{ padding: "12px 20px", background: "rgba(0,0,0,0.5)", width: "100%", display: "flex", alignItems: "center", gap: 12 }} onClick={e => e.stopPropagation()}>
        {/* Thumbnail strip */}
        <div style={{ display: "flex", gap: 6, flex: 1, overflowX: "auto" }}>
          {photoModalPhotos.map((ph, i) => (
            <img key={i} src={ph} alt="" onClick={() => setPhotoModalIdx(i)}
              style={{ width: 56, height: 42, objectFit: "cover", borderRadius: 4, cursor: "pointer",
                border: i === photoModalIdx ? `2px solid ${GAME.gold}` : "2px solid transparent",
                opacity: i === photoModalIdx ? 1 : 0.5 }} />
          ))}
        </div>
        {/* Actions */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={() => { updateRoundField("heroPhotoIndex", photoModalIdx); }}
            style={{ padding: "6px 14px", fontSize: 12, fontWeight: 700, border: "none", borderRadius: 6, cursor: "pointer",
              background: (photoModalRd?.heroPhotoIndex || 0) === photoModalIdx ? GAME.gold : "rgba(255,255,255,0.1)",
              color: (photoModalRd?.heroPhotoIndex || 0) === photoModalIdx ? "#000" : "#fff" }}>
            {(photoModalRd?.heroPhotoIndex || 0) === photoModalIdx ? "Hero ★" : "Set as Hero"}
          </button>
          <button onClick={() => { removePhoto(photoModalIdx); setPhotoModalIdx(Math.min(photoModalIdx, photoModalPhotos.length - 2)); if (photoModalPhotos.length <= 1) setPhotoModalIdx(null); }}
            style={{ padding: "6px 14px", fontSize: 12, fontWeight: 700, border: "none", borderRadius: 6, background: "rgba(192,57,43,0.8)", color: "#fff", cursor: "pointer" }}>
            Delete
          </button>
        </div>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>{photoModalIdx + 1} / {photoModalPhotos.length}</span>
      </div>
    </div>
  ) : null;

  // ═══════════════════════════════════════════════════════════
  //  EDITOR MODE RENDER
  // ═══════════════════════════════════════════════════════════
  return (<>
    <style>{`
      @keyframes gtp-pulse{0%,100%{opacity:1}50%{opacity:.4}}
      /* ── Button hover/focus/active ── */
      button { transition: transform 0.12s ease-out, box-shadow 0.12s ease-out, background 0.08s ease, border-color 0.12s ease, opacity 0.12s ease; }
      button:hover { filter: brightness(1.15); }
      button:active { transform: scale(0.97); transition-duration: 0.06s; }
      button:focus-visible { box-shadow: 0 0 0 2px rgba(42,157,143,0.4); outline: none; }
      /* ── Input focus glow ── */
      input:focus, select:focus, textarea:focus { border-color: rgba(42,157,143,0.5) !important; box-shadow: 0 0 0 2px rgba(42,157,143,0.15); outline: none; }
      /* ── Card hover ── */
      [data-card]:hover { border-color: rgba(255,255,255,0.12) !important; }
      /* ── Smooth scrollbar ── */
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      /* Respect reduced motion preference */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
      }
    `}</style>
    {photoManager}
    {photoModal}
    <div style={{ fontFamily: DS.font, background: DS.bgPage, color: DS.textPrimary, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* HEADER */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${DS.md}px ${DS.xl}px`, borderBottom: `1px solid ${DS.borderSubtle}`, background: DS.bgSurface }}>
        <div style={{ display: "flex", alignItems: "center", gap: DS.md }}>
          <span style={{ fontSize: DS.fsXl, fontWeight: 700, color: GAME.gold }}>Guess the Price</span>
          <button onClick={() => setShowEpisodePanel(!showEpisodePanel)}
            style={btn({ padding: "4px 12px", fontSize: DS.fsSm, background: showEpisodePanel ? "rgba(251,135,112,0.15)" : DS.bgButton, border: showEpisodePanel ? `1px solid rgba(251,135,112,0.25)` : `1px solid ${DS.borderSubtle}` })}>
            Ep {episode.episode} {showEpisodePanel ? "▲" : "▼"}
          </button>
        </div>
        <div style={{ display: "flex", gap: DS.xs, alignItems: "center" }}>
          {/* Save group */}
          <button onClick={() => syncToServer()} style={btn({ padding: "4px 12px", fontSize: DS.fsXs })}>Save</button>
          {saveStatus && <span style={{ fontSize: DS.fsXs, color: GAME.gold, marginLeft: DS.xs }}>{saveStatus}</span>}
          {dirty && !saveStatus && <span style={{ fontSize: DS.fsXs, color: DS.textMuted, marginLeft: DS.xs }}>unsaved</span>}
          <button onClick={() => { const name = `Ep${episode.episode}_${new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}`; saveSnapshot(name); }}
            style={btn({ padding: "4px 12px", fontSize: DS.fsXs })}>Snapshot</button>
          <span style={{ width: DS.sm }} />
          {/* Live group */}
          <button onClick={enterLiveMode}
            style={btn({ padding: "4px 14px", fontSize: DS.fsXs, fontWeight: 600, background: "rgba(251,135,112,0.15)", border: `1px solid rgba(251,135,112,0.3)`, color: GAME.gold })}>
            LIVE
          </button>
          <button onClick={() => pushToLive()}
            style={btn({
              padding: "4px 14px", fontSize: DS.fsXs, fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
              background: lastPushOk === true ? "rgba(131,163,129,0.2)" : lastPushOk === false ? "rgba(251,135,112,0.15)" : DS.bgButton,
              border: `1px solid ${lastPushOk === true ? "rgba(131,163,129,0.3)" : lastPushOk === false ? "rgba(251,135,112,0.3)" : DS.borderSubtle}`,
              color: lastPushOk === true ? BRAND.colorPositive : lastPushOk === false ? GAME.gold : DS.textPrimary,
            })}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
              background: lastPushOk === true ? "#4ade80" : lastPushOk === false ? "#ef4444" : "#6b7280",
              animation: lastPushOk === true ? "gtp-pulse 1.5s ease-in-out infinite" : "none",
            }} />
            Push to Live
          </button>
          <span style={{ width: DS.sm }} />
          {/* Ratio group */}
          {Object.entries(RATIOS).map(([key, val]) => (
            <button key={key} onClick={() => setRatio(key)}
              style={btn({ background: ratio === key ? DS.accent : DS.bgButton, border: ratio === key ? `1px solid ${DS.accentLight}` : `1px solid ${DS.borderSubtle}`, padding: "5px 10px", fontSize: 9 })}>
              {val.label}
            </button>
          ))}
        </div>
      </header>

      {/* EPISODE PANEL */}
      <div style={{
        maxHeight: showEpisodePanel ? 500 : 0, overflow: "hidden", opacity: showEpisodePanel ? 1 : 0,
        transition: "max-height 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease",
        borderBottom: showEpisodePanel ? `1px solid ${DS.borderSubtle}` : "none",
      }}>
        <div style={{ padding: `${DS.md}px ${DS.xl}px`, background: "rgba(11,29,58,0.6)", display: "flex", gap: DS.lg, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Episode list */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ ...sectionHead(), marginBottom: DS.sm }}>Episodes</div>
            <div style={{ display: "flex", gap: DS.xs, flexWrap: "wrap" }}>
              {episodes.map(ep => (
                <button key={ep.id} onClick={() => switchToEpisode(ep)}
                  style={btn({
                    padding: "8px 16px", fontSize: DS.fsSm,
                    background: ep.id === activeEpisodeId ? "rgba(251,135,112,0.2)" : DS.bgButton,
                    border: ep.id === activeEpisodeId ? `1px solid rgba(251,135,112,0.3)` : `1px solid ${DS.borderSubtle}`,
                    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, minWidth: 120,
                  })}>
                  <span style={{ fontWeight: 700 }}>Episode {ep.episode}</span>
                  <span style={{ fontSize: DS.fsXs, color: DS.textMuted }}>{ep.agents.join(" vs ")}</span>
                  <span style={{ fontSize: DS.fsXs, color: DS.textMuted }}>{ep.rounds.filter(r => r.address).length}/6 rounds</span>
                </button>
              ))}
              <button onClick={createNewEpisode}
                style={btn({ padding: "8px 16px", fontSize: DS.fsSm, border: `1px dashed ${DS.borderSubtle}`, minWidth: 100, display: "flex", alignItems: "center", justifyContent: "center" })}>
                + New Episode
              </button>
            </div>
          </div>

          {/* Current episode settings */}
          <div style={{ minWidth: 260 }}>
            <div style={{ ...sectionHead(), marginBottom: DS.sm }}>Episode {episode.episode} Settings</div>
            <div style={{ display: "flex", gap: DS.sm, marginBottom: DS.sm }}>
              <div>
                <div style={{ fontSize: DS.fsXs, color: DS.textMuted, marginBottom: 2 }}>Agent 1</div>
                <input style={inputS({ width: 110 })} value={episode.agents[0]} onChange={e => updateAgentName(0, e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: DS.fsXs, color: DS.textMuted, marginBottom: 2 }}>Agent 2</div>
                <input style={inputS({ width: 110 })} value={episode.agents[1]} onChange={e => updateAgentName(1, e.target.value)} />
              </div>
            </div>
            <div style={{ ...sectionHead(), marginTop: DS.md, marginBottom: DS.xs }}>Who Goes First?</div>
            <div style={{ display: "flex", gap: DS.sm, alignItems: "center", marginBottom: DS.md }}>
              <span style={{ fontSize: DS.fsXs, color: DS.textSecondary }}>R1:</span>
              <span style={{ fontSize: DS.fsXs, fontWeight: 700, color: GAME.gold }}>{episode.rounds[0]?.propertyAgent}</span>
              <span style={{ fontSize: DS.fsXs, color: DS.textMuted }}>picks →</span>
              <span style={{ fontSize: DS.fsXs, fontWeight: 700, color: DS.textPrimary }}>{episode.rounds[0]?.guesser}</span>
              <span style={{ fontSize: DS.fsXs, color: DS.textMuted }}>guesses</span>
              <button onClick={() => {
                const a1 = episode.agents[0], a2 = episode.agents[1];
                // Check current R1 pattern and flip it
                const currentFirst = episode.rounds[0]?.propertyAgent;
                const newFirst = currentFirst === a1 ? a2 : a1;
                const newSecond = currentFirst === a1 ? a1 : a2;
                setEpisodes(prev => prev.map(ep => {
                  if (ep.id !== activeEpisodeId) return ep;
                  const rounds = ep.rounds.map((r, i) => {
                    // Alternate every round: R1 newFirst, R2 newSecond, R3 newFirst...
                    const pa = i % 2 === 0 ? newFirst : newSecond;
                    const gu = i % 2 === 0 ? newSecond : newFirst;
                    return { ...r, propertyAgent: pa, guesser: gu };
                  });
                  return { ...ep, rounds };
                }));
                setDirty(true);
              }} style={btn({ padding: "3px 10px", fontSize: DS.fsXs })}>Swap</button>
            </div>
            <div style={{ display: "flex", gap: DS.xs }}>
              <button onClick={() => duplicateEpisode(episode)}
                style={btn({ padding: "4px 10px", fontSize: DS.fsXs })}>Duplicate</button>
            </div>
          </div>
        </div>
      </div>

      {/* ROUND BAR */}
      <div style={{ padding: `${DS.sm}px ${DS.xl}px`, borderBottom: `1px solid ${DS.borderSubtle}`, background: "rgba(11,29,58,0.4)", display: "flex", alignItems: "center", gap: DS.lg, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: DS.xs }}>
          {episode.rounds.map((rd, i) => {
            const isActive = currentRound === i;
            const empty = isRoundEmpty(rd);
            return (
              <button key={i} draggable onClick={() => loadRound(i + 1)}
                onDragStart={() => setDragRoundIdx(i)}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderLeft = `2px solid ${GAME.gold}`; }}
                onDragLeave={e => { e.currentTarget.style.borderLeft = "2px solid transparent"; }}
                onDrop={e => { e.preventDefault(); e.currentTarget.style.borderLeft = "2px solid transparent"; if (dragRoundIdx !== null) reorderRounds(dragRoundIdx, i); setDragRoundIdx(null); }}
                onDragEnd={() => setDragRoundIdx(null)}
                style={btn({ padding: "6px 14px", fontSize: DS.fsXs, fontWeight: 700, background: isActive ? GAME.gold : empty ? "rgba(255,255,255,0.02)" : DS.bgButton, color: isActive ? GAME.navy : empty ? DS.textMuted : DS.textPrimary, opacity: dragRoundIdx === i ? 0.4 : empty ? 0.4 : 1, cursor: "grab", letterSpacing: "0.05em", borderLeft: "2px solid transparent" })}>
                R{i + 1}{!empty && <span onClick={(e) => {
                  e.stopPropagation();
                  const ri = i;
                  setEpisodes(prev => prev.map(ep => {
                    if (ep.id !== activeEpisodeId) return ep;
                    const rounds = [...ep.rounds];
                    const r = rounds[ri];
                    if (r) rounds[ri] = { ...r, propertyAgent: r.guesser, guesser: r.propertyAgent };
                    return { ...ep, rounds };
                  }));
                  setDirty(true);
                }} style={{ fontSize: DS.fsXs - 2, opacity: 0.7, marginLeft: 4, cursor: "pointer", padding: "2px 4px", borderRadius: 3, background: "rgba(255,255,255,0.1)" }}>{rd.propertyAgent?.charAt(0)}</span>}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: DS.md, marginLeft: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: DS.xs }}>
            <span style={{ fontSize: DS.fsSm, color: DS.textSecondary }}>{episode.agents[0]}</span>
            <span style={{ background: GAME.gold, color: GAME.navy, fontWeight: 800, padding: "3px 10px", borderRadius: 20, fontSize: DS.fsMd, minWidth: 28, textAlign: "center" }}>{scores[0]}</span>
            <button onClick={() => addScore(0)} style={btn({ padding: "3px 8px", fontSize: DS.fsXs })}>+1</button>
          </div>
          <span style={{ color: DS.textMuted, fontSize: DS.fsXs }}>vs</span>
          <div style={{ display: "flex", alignItems: "center", gap: DS.xs }}>
            <span style={{ fontSize: DS.fsSm, color: DS.textSecondary }}>{episode.agents[1]}</span>
            <span style={{ background: GAME.gold, color: GAME.navy, fontWeight: 800, padding: "3px 10px", borderRadius: 20, fontSize: DS.fsMd, minWidth: 28, textAlign: "center" }}>{scores[1]}</span>
            <button onClick={() => addScore(1)} style={btn({ padding: "3px 8px", fontSize: DS.fsXs })}>+1</button>
          </div>
          <button onClick={resetScores} style={btn({ padding: "3px 8px", fontSize: DS.fsXs, color: DS.textMuted })}>Reset</button>
        </div>
      </div>

      {/* Status info merged into round bar above — strip removed */}

      {/* MAIN */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Asset Nav */}
        <nav style={{ width: 160, flexShrink: 0, padding: `${DS.md}px ${DS.sm}px`, borderRight: `1px solid ${DS.borderSubtle}`, display: "flex", flexDirection: "column", gap: DS.xs, overflowY: "auto" }}>
          <div style={sectionHead({ marginBottom: DS.sm })}>Assets</div>
          {ASSETS.map(a => (
            <button key={a.id} onClick={() => { cancelAnimationFrame(animRef.current); clearTimeout(sequenceRef.current); setActiveAsset(a.id); setAnimProgress(0); setIsPlaying(false); }}
              style={{ ...btn({ padding: "8px 12px", width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: DS.sm, background: activeAsset === a.id ? "rgba(251,135,112,0.15)" : DS.bgButton, border: activeAsset === a.id ? `1px solid rgba(251,135,112,0.25)` : `1px solid ${DS.borderSubtle}`, color: activeAsset === a.id ? GAME.gold : DS.textPrimary }) }}>
              <span style={{ fontSize: 14 }}>{a.icon}</span>
              <span style={{ fontSize: DS.fsSm }}>{a.label}</span>
              {a.animated && <span style={{ fontSize: DS.fsXs - 2, color: DS.textMuted, marginLeft: "auto" }}>ANIM</span>}
            </button>
          ))}
        </nav>

        {/* Canvas */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: DS.xl, overflow: "auto", background: "rgba(0,0,0,0.2)" }}>
          <canvas ref={canvasRef} width={r.W} height={r.H}
            style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: DS.rSm, boxShadow: "0 4px 30px rgba(0,0,0,0.5)", background: activeAsset === "property" ? "repeating-conic-gradient(#222 0% 25%, #333 0% 50%) 0 0/20px 20px" : "#000" }} />
        </div>

        {/* Controls */}
        <aside style={{ width: 280, flexShrink: 0, padding: DS.lg, borderLeft: `1px solid ${DS.borderSubtle}`, overflowY: "auto" }}>
          <div style={sectionHead()}>{ASSETS.find(a => a.id === activeAsset)?.label || "Controls"}</div>
          <div style={card()}>{renderControls()}</div>
          {ASSETS.find(a => a.id === activeAsset)?.animated && (
            <div style={card()}>
              <div style={{ display: "flex", gap: DS.sm, marginBottom: DS.sm }}>
                <button onClick={() => { setAnimProgress(0); setIsPlaying(false); render(0); }} style={btn({ padding: "6px 12px", fontSize: DS.fsXs })}>Reset</button>
                <button onClick={playAnimation} style={btnCta({ padding: "6px 14px", fontSize: DS.fsXs, flex: 1 })}>
                  {isPlaying ? "Pause" : animProgress >= 0.99 ? "Replay" : "Play"}
                </button>
              </div>
              <input type="range" min={0} max={1} step={0.01} value={animProgress}
                onChange={e => { setAnimProgress(+e.target.value); render(+e.target.value); }}
                style={{ width: "100%", accentColor: GAME.gold }} />
              <div style={{ fontSize: DS.fsXs, color: DS.textMuted, marginTop: DS.xs }}>{Math.round(animProgress * 100)}%</div>
              {activeAsset === "property" && (
                <div style={{ display: "flex", alignItems: "center", gap: DS.sm, marginTop: DS.md, borderTop: `1px solid ${DS.borderSubtle}`, paddingTop: DS.md }}>
                  <span style={{ fontSize: DS.fsXs, color: DS.textMuted, whiteSpace: "nowrap" }}>Sec/photo</span>
                  <input style={inputS({ width: 50, padding: "4px 8px", fontSize: DS.fsSm })} type="number" min={2} max={15} value={S.photoDuration || 5}
                    onChange={e => updateS("photoDuration", +e.target.value)} />
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* FOOTER */}
      <footer style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${DS.md}px ${DS.xl}px`, borderTop: `1px solid ${DS.borderSubtle}`, background: DS.bgSurface }}>
        <div style={{ display: "flex", gap: DS.sm }}>
          <button onClick={() => exportPNG()} style={btnCta({ padding: "8px 20px", fontSize: DS.fsSm })}>Export PNG</button>
          {ASSETS.find(a => a.id === activeAsset)?.animated && (
            <button onClick={exportMOV} style={btnPositive({ padding: "8px 20px", fontSize: DS.fsSm })}>Export MOV</button>
          )}
          <button onClick={exportRound} style={btn({ padding: "8px 20px", fontSize: DS.fsSm, borderColor: "rgba(251,135,112,0.25)", color: GAME.gold })}>Export Round</button>
          <button onClick={exportAllZIP} style={btn({ padding: "8px 20px", fontSize: DS.fsSm, borderColor: "rgba(251,135,112,0.25)", color: GAME.gold })}>Export All (ZIP)</button>
          <button onClick={exportPDF} style={btn({ padding: "8px 20px", fontSize: DS.fsSm, borderColor: "rgba(251,135,112,0.25)", color: GAME.gold })}>iPad PDF</button>
        </div>
        {exportStatus && (
          <div style={{ display: "flex", alignItems: "center", gap: DS.sm, flex: 1, justifyContent: "center" }}>
            {exportProgress > 0 && exportProgress < 1 && (
              <div style={{ width: 120, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                <div style={{ width: `${Math.round(exportProgress * 100)}%`, height: "100%", background: GAME.gold, borderRadius: 3, transition: "width 0.2s ease" }} />
              </div>
            )}
            <span style={{ fontSize: DS.fsSm, color: GAME.gold }}>{exportStatus}</span>
            {exportProgress > 0 && exportProgress < 1 && (
              <button onClick={() => { exportCancelRef.current = true; }}
                style={btn({ padding: "2px 8px", fontSize: DS.fsXs, color: DS.textMuted, borderColor: "rgba(255,255,255,0.1)" })}>Cancel</button>
            )}
          </div>
        )}
        <div style={{ fontSize: DS.fsXs, color: DS.textMuted }}>{r.W} &times; {r.H} &middot; {activeAsset}</div>
      </footer>
    </div>
  </>);
}
