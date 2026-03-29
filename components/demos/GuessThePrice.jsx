"use client";

import { useState, useRef, useEffect, useCallback } from "react";

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
  background: DS.bgCardGlass, border: `1px solid ${DS.borderSubtle}`,
  borderRadius: DS.rMd, padding: `${DS.lg}px`, marginBottom: DS.lg,
  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", ...o,
});
const label = (o) => ({
  display: "block", fontSize: DS.fsXs, fontWeight: 700, color: DS.textSecondary,
  letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: DS.xs, ...o,
});
const sectionHead = (o) => ({
  fontWeight: 700, fontSize: 10, color: DS.textMuted,
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
  "16:9": { W:1920, H:1080, label:"16:9", hint:"YouTube / Premiere" },
  "1:1":  { W:1080, H:1080, label:"1:1",  hint:"Instagram Feed"     },
  "9:16": { W:1080, H:1920, label:"9:16", hint:"TikTok / Reels"     },
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
function getCachedImage(src) {
  if (!src) return null;
  if (IMG_CACHE[src]) return IMG_CACHE[src].complete ? IMG_CACHE[src] : null;
  const img = new Image();
  img.crossOrigin = "anonymous";
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

// Compress uploaded photo — adaptive quality based on existing photo count
function compressPhoto(file, existingCount = 0) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const highCount = existingCount > 10;
        const maxW = highCount ? 600 : 800;
        const quality = highCount ? 0.6 : 0.75;
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
        beds: 3, type: "Terraced", tenure: "Freehold", addedDate: "24/03/2026",
        optionA: "\u00a3299,950", optionB: "\u00a3375,000", optionC: "\u00a3450,000",
        correctLetter: "C", correctPrice: "450,000",
        photos: [], heroPhotoIndex: 0, notes: "Strongest reaction property \u2014 Cathays at \u00a3450k will surprise Sian.",
      },
      emptyRound(4, "Sian", "Nathan"),
      emptyRound(5, "Sian", "Nathan"),
      emptyRound(6, "Sian", "Nathan"),
    ],
  };
}

function loadEpisodes() {
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
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

// ═══════════════════════════════════════════════════════════════
//  ASSET TYPES
// ═══════════════════════════════════════════════════════════════
const ASSETS = [
  { id: "intro",     label: "Intro Title",    icon: "\u25b6", animated: true },
  { id: "property",  label: "Property Frame",  icon: "\ud83c\udfe0", animated: true },
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
const LIVE_FLOW = ["property", "prompt", "options", "lockin", "timer", "reveal", "scoreboard"];

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
  if (!logo) return;
  const logoW = W * BRAND.logoSize;
  const logoH = logoW * (logo.naturalHeight / logo.naturalWidth);
  const pad = W * 0.03;
  // In portrait, keep logo above the bottom safe zone (420px on 1080x1920)
  const ar = H > W ? "portrait" : "other";
  const bottomPad = ar === "portrait" ? Math.round(420 * (W / 1080)) + pad : pad;
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

  // ── Dynamic background texture ──
  // Large question marks scattered as watermarks
  ctx.save();
  ctx.globalAlpha = 0.025;
  ctx.font = `800 ${Math.round(unit * 0.35)}px 'Lora', serif`;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("?", W * 0.15, H * 0.25);
  ctx.fillText("?", W * 0.85, H * 0.75);
  ctx.font = `800 ${Math.round(unit * 0.55)}px 'Lora', serif`;
  ctx.fillText("?", W * 0.5, H * 0.48);
  ctx.restore();

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

  // ── VS section with agent headshots ──
  const vsY = ar === "portrait" ? safeTop + safeH * 0.48 : H * 0.58;
  const headR = sz(W, H, ar === "portrait" ? 0.09 : 0.065); // headshot circle radius
  const spread = ar === "portrait" ? W * 0.28 : W * 0.18;

  // Left agent (agent 1)
  const leftX = W / 2 - spread;
  const rightX = W / 2 + spread;

  // Draw headshot circles
  const drawHeadshot = (x, y, imgUrl, name, idx) => {
    const img = imgUrl ? getCachedImage(imgUrl) : null;

    // Outer ring — salmon glow
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, headR + headR * 0.12, 0, Math.PI * 2);
    ctx.strokeStyle = GAME.gold;
    ctx.lineWidth = headR * 0.06;
    ctx.stroke();
    ctx.restore();

    // Circle clip for image
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, headR, 0, Math.PI * 2);
    ctx.closePath();

    if (img && img.complete && img.naturalWidth > 0) {
      ctx.clip();
      // Cover-fit the image into the circle
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const scale = Math.max(headR * 2 / iw, headR * 2 / ih);
      const dw = iw * scale, dh = ih * scale;
      ctx.drawImage(img, x - dw / 2, y - dh / 2, dw, dh);
    } else {
      // Placeholder — gradient circle with initial
      const pg = ctx.createRadialGradient(x, y, 0, x, y, headR);
      pg.addColorStop(0, idx === 0 ? BRAND.colorAccent : BRAND.colorPositive);
      pg.addColorStop(1, idx === 0 ? "#c2564a" : "#5a7a58");
      ctx.fillStyle = pg;
      ctx.fill();
      // Initial letter
      ctx.font = `800 ${headR * 0.9}px 'DM Sans', sans-serif`;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(name.charAt(0).toUpperCase(), x, y);
    }
    ctx.restore();

    // Name below headshot
    const nameS = sz(W, H, ar === "portrait" ? 0.04 : 0.032);
    ctx.font = `700 ${nameS}px 'DM Sans', sans-serif`;
    ctx.fillStyle = BRAND.colorText;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(name, x, y + headR + headR * 0.3);
  };

  const eHP = easeOutExpo(headshotP);
  const slideOffset = W * 0.15 * (1 - eHP);
  ctx.save();
  ctx.globalAlpha = eHP;
  drawHeadshot(leftX - slideOffset, vsY, EPISODE.agentImages?.[0], EPISODE.agents[0], 0);
  drawHeadshot(rightX + slideOffset, vsY, EPISODE.agentImages?.[1], EPISODE.agents[1], 1);
  ctx.restore();

  // ── "VS" badge in center ──
  const eVP = easeOutBack(vsP);
  const vsR = sz(W, H, ar === "portrait" ? 0.045 : 0.035) * eVP;
  if (vsP > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, vsP * 2);
    ctx.beginPath();
    ctx.arc(W / 2, vsY, vsR, 0, Math.PI * 2);
    ctx.fillStyle = GAME.navy;
    ctx.fill();
    ctx.strokeStyle = GAME.gold;
    ctx.lineWidth = vsR * 0.12;
    ctx.stroke();
    ctx.font = `900 ${vsR * 0.85}px 'DM Sans', sans-serif`;
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

  // Draw hero photo as background if available
  const rd = EPISODE.rounds ? EPISODE.rounds[S.propRound - 1] : null;
  const heroSrc = rd && rd.photos && rd.photos[rd.heroPhotoIndex || 0];
  const heroImg = heroSrc ? getCachedImage(heroSrc) : null;
  const ep = easeOutExpo(Math.min(1, p / 0.5));
  if (heroImg && heroImg.complete && heroImg.naturalWidth > 0) {
    // Cover-fit with Ken Burns zoom entrance
    const iw = heroImg.naturalWidth, ih = heroImg.naturalHeight;
    const zoomScale = 1.0 + 0.06 * (1 - ep);
    const scale = Math.max(W / iw, H / ih) * zoomScale;
    const dw = iw * scale, dh = ih * scale;
    ctx.save();
    ctx.globalAlpha = ep;
    ctx.drawImage(heroImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.restore();
    // Darken bottom for readability
    const grad = ctx.createLinearGradient(0, H * 0.4, 0, H);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.6, "rgba(0,0,0,0.4)");
    grad.addColorStop(1, "rgba(0,0,0,0.75)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }
  const barP = easeOutExpo(Math.min(1, Math.max(0, (p - 0.3) / 0.5)));

  const barSlide = H * 0.03 * (1 - barP);
  ctx.save();
  ctx.globalAlpha = barP;
  ctx.translate(0, barSlide);

  if (ar === "portrait") {
    // Vertical: slim card — positioned above the 420px bottom danger zone
    const cardH = H * 0.08;
    const pad = Math.max(W * 0.05, safe.left);
    const cardY = safe.contentBottom - cardH - W * 0.03;

    ctx.fillStyle = "rgba(30, 58, 64, 0.92)";
    roundRect(ctx, pad, cardY, W - pad * 2, cardH, BRAND.cornerRadius);
    ctx.fill();

    ctx.fillStyle = GAME.gold;
    roundRect(ctx, pad, cardY, W - pad * 2, 4, BRAND.cornerRadius);
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

    // Address — centered
    ctx.font = `700 ${sz(W, H, 0.03)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = BRAND.colorText;
    ctx.textAlign = "center";
    ctx.fillText(S.propAddress.split(",")[0], W / 2, cardY + cardH * 0.4);

    // Location
    ctx.font = `500 ${sz(W, H, 0.022)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = GAME.goldLight;
    ctx.fillText(S.optionLocation || "", W / 2, cardY + cardH * 0.72);
  } else {
    // Landscape/square: slim bottom bar — no logo
    const barH = H * 0.09;
    const pad = W * 0.03;
    const barY = H - barH - pad;

    ctx.fillStyle = "rgba(30, 58, 64, 0.92)";
    roundRect(ctx, pad, barY, W - pad * 2, barH, BRAND.cornerRadius);
    ctx.fill();

    ctx.fillStyle = GAME.gold;
    roundRect(ctx, pad, barY, W - pad * 2, 4, BRAND.cornerRadius);
    ctx.fill();

    // Round badge
    const bSize = Math.min(W, H) * 0.05;
    const bx = pad + bSize;
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

    // Address
    const ax = bx + bSize;
    ctx.font = `700 ${sz(W, H, 0.025)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = BRAND.colorText;
    ctx.textAlign = "left";
    ctx.fillText(S.propAddress, ax, by - sz(W, H, 0.01));

    // Location
    ctx.font = `500 ${sz(W, H, 0.018)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = GAME.goldLight;
    ctx.fillText(S.optionLocation || "", ax, by + sz(W, H, 0.016));
  }
  ctx.restore(); // barP animation
  // No CPS logo on property frame — properties aren't listed with CPS
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

  // Address bar at bottom
  const barH = H * 0.14;
  const pad = W * 0.03;
  const barY = ar === "portrait" ? safe.contentBottom - barH : H - barH - pad;

  // Round badge
  const bSize = Math.min(W, H) * 0.06;
  const bx = pad + bSize;
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

  // Address
  const ax = bx + bSize;
  ctx.font = `700 ${sz(W, H, 0.03)}px 'DM Sans', sans-serif`;
  ctx.fillStyle = BRAND.colorText;
  ctx.textAlign = "left";
  ctx.fillText(S.propAddress || "", ax, by - sz(W, H, 0.015));
  // Location
  ctx.font = `500 ${sz(W, H, 0.02)}px 'DM Sans', sans-serif`;
  ctx.fillStyle = GAME.goldLight;
  ctx.fillText(S.optionLocation || "", ax, by + sz(W, H, 0.02));

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
  // No CPS logo — properties aren't listed with CPS
}

function drawPrompt(ctx, W, H, _S, progress) {
  const p = progress ?? 1;
  drawBg(ctx, W, H);
  drawAccentBars(ctx, W, H);
  const ar = aspect(W, H);
  const safe = safeZone(W, H);
  const safeH = ar === "portrait" ? safe.contentBottom - safe.contentTop : H;
  const safeTop = ar === "portrait" ? safe.contentTop : 0;

  // Giant "?" behind
  ctx.save();
  ctx.font = `800 ${sz(W, H, 1.2)}px 'Lora', serif`;
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("?", W / 2, H * 0.48);
  ctx.restore();

  // Main question — HUGE — fades + scales in
  const textP = easeOutExpo(Math.min(1, p / 0.5));
  ctx.save();
  ctx.globalAlpha = textP;
  const qY = ar === "portrait" ? safeTop + safeH * 0.25 : H * 0.40;
  const qs = sz(W, H, ar === "portrait" ? 0.10 : 0.085);
  ctx.font = `700 ${qs}px 'Lora', serif`;
  ctx.fillStyle = BRAND.colorWarm;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (ar === "portrait") {
    ctx.fillText("Which one", W / 2, qY - qs * 0.55);
    ctx.fillText("is it?", W / 2, qY + qs * 0.55);
  } else {
    ctx.fillText("Which one is it?", W / 2, qY);
  }

  // Subtitle
  ctx.font = `500 ${sz(W, H, 0.028)}px 'DM Sans', sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText("Choose A, B, or C", W / 2, ar === "portrait" ? safeTop + safeH * 0.40 : H * 0.52);
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

  // Full-canvas card — use safe margins for padding
  const pad = ar === "portrait" ? Math.max(W * 0.06, safe.left) : W * 0.04;

  // Subtle background for overlay context
  drawBg(ctx, W, H);

  // Round header — within safe zone
  const headerY = ar === "portrait" ? safeTop + safeH * 0.05 : H * 0.10;
  ctx.font = `700 ${sz(W, H, 0.035)}px 'DM Sans', sans-serif`;
  ctx.fillStyle = GAME.gold;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`ROUND ${S.propRound || 1}`, W / 2, headerY);

  // Location
  ctx.font = `500 ${sz(W, H, 0.025)}px 'DM Sans', sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText(S.optionLocation || "", W / 2, headerY + sz(W, H, 0.045));

  // Option pills — BIG, full-width, safe-zone aware
  const opts = [
    { letter: "A", price: S.optionA, color: GAME.optionA },
    { letter: "B", price: S.optionB, color: GAME.optionB },
    { letter: "C", price: S.optionC, color: GAME.optionC },
  ];

  const ow = W - pad * 2;
  const oh = ar === "portrait" ? safeH * 0.14 : H * 0.15;
  const og = ar === "portrait" ? safeH * 0.03 : H * 0.04;
  const startY = ar === "portrait" ? safeTop + safeH * 0.20 : H * 0.24;

  for (let i = 0; i < 3; i++) {
    const o = opts[i];
    // Staggered entrance: each pill slides in from right
    const pillDelay = 0.15 + i * 0.15;
    const pillP = easeOutExpo(Math.min(1, Math.max(0, (p - pillDelay) / 0.4)));
    const slideX = W * 0.1 * (1 - pillP);
    const oy = startY + i * (oh + og);

    ctx.save();
    ctx.globalAlpha = pillP;
    ctx.translate(slideX, 0);

    // Pill with rounded ends
    ctx.fillStyle = o.color;
    roundRect(ctx, pad, oy, ow, oh, oh / 2);
    ctx.fill();

    // Subtle inner shadow at top
    const innerGrad = ctx.createLinearGradient(0, oy, 0, oy + oh * 0.3);
    innerGrad.addColorStop(0, "rgba(255,255,255,0.12)");
    innerGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = innerGrad;
    roundRect(ctx, pad, oy, ow, oh, oh / 2);
    ctx.fill();

    // Letter badge — left side
    const br = oh * 0.38;
    const bx2 = pad + oh / 2;
    const by2 = oy + oh / 2;
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.arc(bx2, by2, br, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `800 ${Math.round(br * 1.2)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(o.letter, bx2, by2);

    // Price — large, centered in remaining space
    const priceX = pad + oh + (ow - oh) / 2;
    ctx.font = `700 ${Math.round(oh * 0.48)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(o.price || "---", priceX, by2);
    ctx.restore(); // pill animation
  }

  drawStamp(ctx, W, H);
}

function drawLockIn(ctx, W, H, S, progress) {
  const p = progress ?? 1;
  drawBg(ctx, W, H);
  drawAccentBars(ctx, W, H);
  const ar = aspect(W, H);
  const safe = safeZone(W, H);
  const letter = S.lockLetter || "B";
  const colors = { A: GAME.optionA, B: GAME.optionB, C: GAME.optionC };
  const letterColor = colors[letter] || GAME.gold;
  // Center content within safe zone in portrait
  const centerY = ar === "portrait" ? safe.contentTop + (safe.contentBottom - safe.contentTop) * 0.42 : H * 0.45;

  // Large glow behind letter
  ctx.save();
  ctx.globalAlpha = 0.15;
  const glow = ctx.createRadialGradient(W / 2, centerY, 0, W / 2, centerY, sz(W, H, 0.35));
  glow.addColorStop(0, letterColor);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Agent name — fades in
  const nameP = easeOutExpo(Math.min(1, p / 0.3));
  ctx.save();
  ctx.globalAlpha = nameP;
  ctx.font = `600 ${sz(W, H, 0.04)}px 'DM Sans', sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(S.lockAgent || "Agent", W / 2, centerY - sz(W, H, 0.18));

  // "LOCKS IN" label
  ctx.font = `700 ${sz(W, H, 0.025)}px 'DM Sans', sans-serif`;
  ctx.fillStyle = GAME.gold;
  ctx.fillText("LOCKS IN", W / 2, centerY - sz(W, H, 0.12));
  ctx.restore();

  // Giant letter — scale in with elastic bounce
  const letterLP = Math.min(1, Math.max(0, (p - 0.25) / 0.5));
  const letterScale = easeOutBack(letterLP);
  const letterSz = sz(W, H, ar === "portrait" ? 0.35 : 0.28) * letterScale;
  if (letterLP > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, letterLP * 2);
    ctx.shadowColor = letterColor;
    ctx.shadowBlur = sz(W, H, 0.04);
    ctx.font = `800 ${Math.round(letterSz)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = letterColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letter, W / 2, centerY + sz(W, H, 0.05));
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
  const ringR = sz(W, H, 0.18);

  if (elapsed < totalSec) {
    const displayNum = Math.ceil(totalSec - elapsed);
    const inPhase = elapsed % 1;

    // Outer ring — fading background ring
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = sz(W, H, 0.015);
    ctx.beginPath();
    ctx.arc(W / 2, centerY, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Progress ring — salmon, fills clockwise
    ctx.strokeStyle = GAME.gold;
    ctx.lineWidth = sz(W, H, 0.015);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(W / 2, centerY, ringR, -Math.PI / 2, -Math.PI / 2 + inPhase * Math.PI * 2);
    ctx.stroke();

    // Number — elastic scale on each beat
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
  const ar = aspect(W, H);
  const safe = safeZone(W, H);
  const cl = S.revealLetter || "B";
  const cp = S.revealPrice || "---";
  const colors = { A: GAME.optionA, B: GAME.optionB, C: GAME.optionC };
  const cc = colors[cl] || GAME.gold;
  const centerY = ar === "portrait" ? safe.contentTop + (safe.contentBottom - safe.contentTop) * 0.38 : H * 0.42;

  // Phase 1 (0–0.35): tension — "THE ANSWER IS..."
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
    ctx.fillText("THE ANSWER IS...", W / 2, centerY);

    // Animated dots
    const dots = Math.floor(tp * 4) % 4;
    ctx.fillText(".".repeat(dots), W / 2, centerY + sz(W, H, 0.06));
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

    // Letter — scale in with elastic
    if (rp > 0.05) {
      const letterP = Math.min(1, (rp - 0.05) / 0.3);
      const scale = easeOutBack(letterP);
      const letterSz = sz(W, H, ar === "portrait" ? 0.30 : 0.22) * scale;
      ctx.save();
      ctx.shadowColor = cc;
      ctx.shadowBlur = sz(W, H, 0.06) * Math.min(1, rp * 2);
      ctx.font = `800 ${Math.round(letterSz)}px 'DM Sans', sans-serif`;
      ctx.fillStyle = cc;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cl, W / 2, centerY - sz(W, H, 0.02));
      ctx.restore();
    }

    // Price — fade up
    if (rp > 0.45) {
      const priceP = Math.min(1, (rp - 0.45) / 0.25);
      const a = easeOutExpo(priceP);
      const priceSz = sz(W, H, ar === "portrait" ? 0.09 : 0.07);
      ctx.font = `700 ${priceSz}px 'DM Sans', sans-serif`;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const priceY = centerY + sz(W, H, ar === "portrait" ? 0.18 : 0.15);
      ctx.fillText(`\u00a3${cp}`, W / 2, priceY + (1 - a) * sz(W, H, 0.02));
    }

    // "CORRECT PRICE" label
    if (rp > 0.6) {
      const lblP = Math.min(1, (rp - 0.6) / 0.2);
      ctx.font = `600 ${sz(W, H, 0.022)}px 'DM Sans', sans-serif`;
      ctx.fillStyle = `rgba(251,135,112,${lblP})`;
      ctx.textAlign = "center";
      ctx.fillText("CORRECT PRICE", W / 2, centerY + sz(W, H, ar === "portrait" ? 0.26 : 0.23));
    }
  }

  drawAccentBars(ctx, W, H);
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

  // Title — fades in
  const titleP = easeOutExpo(Math.min(1, p / 0.3));
  ctx.save();
  ctx.globalAlpha = titleP;
  ctx.font = `700 ${sz(W, H, 0.03)}px 'DM Sans', sans-serif`;
  ctx.fillStyle = GAME.gold;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SCOREBOARD", W / 2, ar === "portrait" ? safeTop + safeH * 0.06 : H * 0.15);
  ctx.restore();

  if (ar === "portrait") {
    // Vertical: stack the two agent cards within safe zone
    const cardW2 = W * 0.7;
    const cardH2 = safeH * 0.22;
    const gap = safeH * 0.04;
    const centerX = W / 2 - cardW2 / 2;

    // Agent 1
    const y1 = safeTop + safeH * 0.15;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundRect(ctx, centerX, y1, cardW2, cardH2, BRAND.cornerRadius);
    ctx.fill();
    ctx.strokeStyle = GAME.gold;
    ctx.lineWidth = 2;
    roundRect(ctx, centerX, y1, cardW2, cardH2, BRAND.cornerRadius);
    ctx.stroke();
    ctx.font = `700 ${sz(W, H, 0.035)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = BRAND.colorText;
    ctx.textAlign = "center";
    ctx.fillText(a1, W / 2, y1 + cardH2 * 0.35);
    ctx.font = `800 ${sz(W, H, 0.09)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = GAME.gold;
    ctx.fillText(String(s1), W / 2, y1 + cardH2 * 0.72);

    // VS
    ctx.font = `600 ${sz(W, H, 0.03)}px 'Lora', serif`;
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillText("vs", W / 2, y1 + cardH2 + gap / 2);

    // Agent 2
    const y2 = y1 + cardH2 + gap;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundRect(ctx, centerX, y2, cardW2, cardH2, BRAND.cornerRadius);
    ctx.fill();
    ctx.strokeStyle = GAME.gold;
    ctx.lineWidth = 2;
    roundRect(ctx, centerX, y2, cardW2, cardH2, BRAND.cornerRadius);
    ctx.stroke();
    ctx.font = `700 ${sz(W, H, 0.035)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = BRAND.colorText;
    ctx.fillText(a2, W / 2, y2 + cardH2 * 0.35);
    ctx.font = `800 ${sz(W, H, 0.09)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = GAME.gold;
    ctx.fillText(String(s2), W / 2, y2 + cardH2 * 0.72);

    // Round label
    ctx.font = `500 ${sz(W, H, 0.022)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillText(`After Round ${S.propRound || 1} of 6`, W / 2, y2 + cardH2 + safeH * 0.05);
  } else {
    // Landscape/square: side-by-side
    const cw2 = W * 0.3, ch2 = H * 0.4, gap = W * 0.05;
    const cy2 = H * 0.28;

    // Agent 1
    const x1 = W / 2 - gap / 2 - cw2;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundRect(ctx, x1, cy2, cw2, ch2, BRAND.cornerRadius);
    ctx.fill();
    ctx.strokeStyle = GAME.gold;
    ctx.lineWidth = 2;
    roundRect(ctx, x1, cy2, cw2, ch2, BRAND.cornerRadius);
    ctx.stroke();
    ctx.font = `700 ${sz(W, H, 0.032)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = BRAND.colorText;
    ctx.textAlign = "center";
    ctx.fillText(a1, x1 + cw2 / 2, cy2 + ch2 * 0.28);
    ctx.font = `800 ${sz(W, H, 0.10)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = GAME.gold;
    ctx.fillText(String(s1), x1 + cw2 / 2, cy2 + ch2 * 0.65);

    // VS
    ctx.font = `600 ${sz(W, H, 0.03)}px 'Lora', serif`;
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillText("vs", W / 2, cy2 + ch2 / 2);

    // Agent 2
    const x2 = W / 2 + gap / 2;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundRect(ctx, x2, cy2, cw2, ch2, BRAND.cornerRadius);
    ctx.fill();
    ctx.strokeStyle = GAME.gold;
    ctx.lineWidth = 2;
    roundRect(ctx, x2, cy2, cw2, ch2, BRAND.cornerRadius);
    ctx.stroke();
    ctx.font = `700 ${sz(W, H, 0.032)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = BRAND.colorText;
    ctx.fillText(a2, x2 + cw2 / 2, cy2 + ch2 * 0.28);
    ctx.font = `800 ${sz(W, H, 0.10)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = GAME.gold;
    ctx.fillText(String(s2), x2 + cw2 / 2, cy2 + ch2 * 0.65);

    // Round label
    ctx.font = `500 ${sz(W, H, 0.02)}px 'DM Sans', sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillText(`After Round ${S.propRound || 1} of 6`, W / 2, cy2 + ch2 + H * 0.06);
  }

  drawStamp(ctx, W, H);
}

const DRAW_FNS = {
  intro: drawIntro,
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
  const saveTimerRef = useRef(null);
  const [ratio, setRatio] = useState("16:9");
  const [activeAsset, setActiveAsset] = useState("intro");
  const [currentRound, setCurrentRound] = useState(0);
  const [scores, setScores] = useState([0, 0]);
  const [animProgress, setAnimProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [exportStatus, setExportStatus] = useState("");

  // ── Episode state ──
  const [episodes, setEpisodes] = useState([]);
  const [activeEpisodeId, setActiveEpisodeId] = useState(null);
  const [showEpisodePanel, setShowEpisodePanel] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [dirty, setDirty] = useState(false);

  // ── Live mode state ──
  const [liveMode, setLiveMode] = useState(false);
  const [liveStep, setLiveStep] = useState(0);
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
    lockLetter: EPISODE.rounds[0].correctLetter,
    score1: 0,
    score2: 0,
    timerDuration: 3,
  });

  // ── Load from localStorage on mount ──
  useEffect(() => {
    loadFont("DM Sans");
    loadFont("Lora");
    getCachedImage(BRAND.logoUrl);
    getCachedImage(BRAND.logoUrlLight);

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

    const t = setTimeout(() => render(), 500);
    return () => clearTimeout(t);
  }, []);

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

  const syncToServer = async () => {
    try {
      setSaveStatus("Syncing…");
      await fetch("/api/gtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodes, activeEpisodeId }),
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
        body: JSON.stringify({ episodes, activeEpisodeId }),
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
  const pushToLive = async (overrideAsset, overrideS) => {
    try {
      const rd = episode.rounds[currentRound] || {};
      await fetch("/api/gtp/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: overrideAsset || activeAsset,
          round: currentRound + 1,
          S: overrideS || S,
          scores,
          agents: episode.agents,
          agentImages: episode.agentImages || [],
          logoImage: episode.logoImage || "",
          photos: rd.photos || [],
          heroPhotoIndex: rd.heroPhotoIndex || 0,
        }),
      });
      setLiveConnected(true);
    } catch {
      setLiveConnected(false);
    }
  };

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
      optionA: round.optionA,
      optionB: round.optionB,
      optionC: round.optionC,
      revealLetter: round.correctLetter,
      revealPrice: round.correctPrice,
      lockAgent: round.guesser,
      lockLetter: round.correctLetter,
      score1: sc ? sc[0] : 0,
      score2: sc ? sc[1] : 0,
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
      return { ...ep, show: newS.showTitle, episode: newS.introEpisode, rounds, scores };
    }));
    setDirty(true);
  }, [activeEpisodeId, currentRound, scores]);

  // ── Episode management ──
  const createNewEpisode = () => {
    const num = episodes.length + 1;
    const ep = createDefaultEpisode(num);
    ep.agents = episode.agents ? [...episode.agents] : ["Agent 1", "Agent 2"];
    ep.rounds = Array.from({ length: 6 }, (_, i) => emptyRound(i + 1, ep.agents[i < 3 ? 0 : 1], ep.agents[i < 3 ? 1 : 0]));
    setEpisodes(prev => [...prev, ep]);
    switchToEpisode(ep);
  };

  const switchToEpisode = (ep) => {
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

  // Handle photo upload for current round
  const handlePhotoUpload = async (files) => {
    const rd = episode.rounds[currentRound];
    if (!rd) return;
    const existing = rd.photos || [];
    const remaining = 20 - existing.length;
    if (remaining <= 0) { setSaveStatus("Max 20 photos per round"); setTimeout(() => setSaveStatus(""), 3000); return; }
    const toProcess = Array.from(files).slice(0, remaining);
    const compressed = await Promise.all(toProcess.map(f => compressPhoto(f, existing.length)));
    const newPhotos = [...existing, ...compressed];
    updateRoundField("photos", newPhotos);
    newPhotos.forEach(p => getCachedImage(p));
    // Check for quota warning
    if (_saveWarning) { setSaveStatus(_saveWarning); setTimeout(() => setSaveStatus(""), 5000); }
  };

  const removePhoto = (idx) => {
    const rd = episode.rounds[currentRound];
    if (!rd) return;
    const photos = [...(rd.photos || [])];
    photos.splice(idx, 1);
    updateRoundField("photos", photos);
    if ((rd.heroPhotoIndex || 0) >= photos.length) {
      updateRoundField("heroPhotoIndex", Math.max(0, photos.length - 1));
    }
  };

  const [dragPhotoIdx, setDragPhotoIdx] = useState(null);
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
      optionA: round.optionA,
      optionB: round.optionB,
      optionC: round.optionC,
      revealLetter: round.correctLetter,
      revealPrice: round.correctPrice,
      lockAgent: round.guesser,
      lockLetter: round.correctLetter,
      score1: scores[0],
      score2: scores[1],
    }));
    setAnimProgress(0);
    setIsPlaying(false);
  }, [scores, episode]);

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
      drawFn(ctx, r.W, r.H, S, progress ?? animProgress);
    } else {
      drawFn(ctx, r.W, r.H, S);
    }
  }, [ratio, activeAsset, S, animProgress]);

  useEffect(() => { render(); }, [render]);

  const playAnimation = useCallback(() => {
    if (isPlaying) {
      cancelAnimationFrame(animRef.current);
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    const duration = (activeAsset === "timer" ? (S.timerDuration || 3) : 3) * 1000;
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const p = Math.min(1, elapsed / duration);
      setAnimProgress(p);
      render(p);
      if (p < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setIsPlaying(false);
      }
    };
    animRef.current = requestAnimationFrame(tick);
  }, [isPlaying, activeAsset, S, render]);

  const addScore = (idx) => {
    setScores(prev => {
      const n = [...prev]; n[idx]++;
      // Persist scores to episode
      setEpisodes(eps => eps.map(ep => ep.id === activeEpisodeId ? { ...ep, scores: n } : ep));
      setDirty(true);
      return n;
    });
  };
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

  // ── Export WebM ──
  const exportWebM = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const asset = ASSETS.find(a => a.id === activeAsset);
    if (!asset?.animated) { exportPNG(); return; }

    setExportStatus("Recording...");
    const duration = (activeAsset === "timer" ? (S.timerDuration || 3) : 3) * 1000;
    const fps = 30;
    const stream = canvas.captureStream(fps);
    const chunks = [];
    const rec = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
    rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `gtp_${activeAsset}_r${S.propRound}.webm`;
      a.click();
      URL.revokeObjectURL(a.href);
      setExportStatus("Done \u2713");
      setTimeout(() => setExportStatus(""), 2000);
    };
    rec.start();
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const p = Math.min(1, elapsed / duration);
      render(p);
      if (p < 1) requestAnimationFrame(tick);
      else rec.stop();
    };
    requestAnimationFrame(tick);
  }, [activeAsset, S, render, exportPNG]);

  // ── Batch export round ──
  const exportRound = useCallback(async () => {
    const rn = S.propRound;
    const toExport = [
      { asset: "property", name: `r${rn}_property.png` },
      { asset: "options",  name: `r${rn}_options.png` },
      { asset: "reveal",   name: `r${rn}_reveal_hold.png` },
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
      if (drawFn) {
        const ad = ASSETS.find(a => a.id === asset);
        if (ad?.animated) drawFn(ctx, rat.W, rat.H, S, 1);
        else drawFn(ctx, rat.W, rat.H, S);
      }
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
    };
    transitionRef.current = requestAnimationFrame(tick);
  };

  // Live step navigation
  const liveProceed = () => {
    const next = Math.min(liveStep + 1, LIVE_FLOW.length - 1);
    if (next === liveStep) return;
    setLiveStep(next);
    const newAsset = LIVE_FLOW[next];
    transitionToAsset(newAsset);
    // Auto-play animated assets after transition
    if (newAsset === "timer" || newAsset === "reveal") {
      setTimeout(() => playAnimation(), 450);
    }
  };

  const liveGoBack = () => {
    const prev = Math.max(liveStep - 1, 0);
    if (prev === liveStep) return;
    setLiveStep(prev);
    setLivePhotoIndex(0);
    transitionToAsset(LIVE_FLOW[prev]);
    cancelAnimationFrame(animRef.current);
    setIsPlaying(false);
  };

  const liveLoadRound = (roundNum) => {
    loadRound(roundNum);
    setLiveStep(0);
    setLivePhotoIndex(0);
    transitionToAsset("property");
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
            onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/png,image/webp"; inp.onchange = async (ev) => { const f = ev.target.files[0]; if (!f) return; const reader = new FileReader(); reader.onload = (re) => { const b64 = re.target.result; setEpisodes(prev => prev.map(ep => ep.id === activeEpisodeId ? { ...ep, logoImage: b64 } : ep)); setDirty(true); getCachedImage(b64); }; reader.readAsDataURL(f); }; inp.click(); }}
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
                <button onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.onchange = async (ev) => { const f = ev.target.files[0]; if (!f) return; const b64 = await compressPhoto(f, 0); const imgs = [...(episode.agentImages || ["", ""])]; imgs[idx] = b64; setEpisodes(prev => prev.map(ep => ep.id === activeEpisodeId ? { ...ep, agentImages: imgs } : ep)); setDirty(true); getCachedImage(b64); }; inp.click(); }}
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
          <div style={{ ...label(), marginTop: DS.sm }}>Rightmove URL</div>
          <input style={inputS()} value={rd.rightmoveUrl || ""} placeholder="https://www.rightmove.co.uk/…" onChange={e => updateRoundField("rightmoveUrl", e.target.value)} />

          <div style={{ ...sectionHead(), marginTop: DS.xl, fontSize: DS.fsXs, color: GAME.gold }}>PHOTOS ({(rd.photos || []).length})</div>
          {/* Photo upload zone */}
          <div
            style={{ marginTop: DS.sm, padding: DS.lg, border: `2px dashed ${DS.borderSubtle}`, borderRadius: DS.rSm, textAlign: "center", cursor: "pointer", background: "rgba(255,255,255,0.02)" }}
            onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.multiple = true; inp.onchange = (e) => handlePhotoUpload(e.target.files); inp.click(); }}
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = GAME.gold; }}
            onDragLeave={e => { e.currentTarget.style.borderColor = DS.borderSubtle; }}
            onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = DS.borderSubtle; handlePhotoUpload(e.dataTransfer.files); }}
          >
            <div style={{ fontSize: DS.fsSm, color: DS.textMuted }}>Drop photos here or click to upload</div>
            <div style={{ fontSize: DS.fsXs, color: DS.textMuted, marginTop: 4 }}>JPG/PNG — drag to reorder</div>
          </div>
          {/* Photo thumbnails — draggable to reorder */}
          {(rd.photos || []).length > 0 && (
            <div style={{ display: "flex", gap: DS.xs, marginTop: DS.sm, flexWrap: "wrap" }}>
              {(rd.photos || []).map((photo, i) => (
                <div key={i} draggable style={{
                    position: "relative", cursor: "grab",
                    borderLeft: dragPhotoIdx !== null && dragPhotoIdx !== i ? `2px solid transparent` : "none",
                  }}
                  onClick={() => updateRoundField("heroPhotoIndex", i)}
                  onDragStart={() => setDragPhotoIdx(i)}
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderLeft = `2px solid ${GAME.gold}`; }}
                  onDragLeave={e => { e.currentTarget.style.borderLeft = "2px solid transparent"; }}
                  onDrop={e => { e.preventDefault(); e.currentTarget.style.borderLeft = "2px solid transparent"; if (dragPhotoIdx !== null) reorderPhotos(dragPhotoIdx, i); setDragPhotoIdx(null); }}
                  onDragEnd={() => setDragPhotoIdx(null)}
                >
                  <img src={photo} alt={`Photo ${i + 1}`} style={{
                    width: 56, height: 42, objectFit: "cover", borderRadius: 4,
                    border: (rd.heroPhotoIndex || 0) === i ? `2px solid ${GAME.gold}` : `2px solid transparent`,
                    opacity: dragPhotoIdx === i ? 0.4 : 1,
                  }} />
                  {(rd.heroPhotoIndex || 0) === i && <div style={{ position: "absolute", top: -4, right: -4, background: GAME.gold, color: GAME.navy, borderRadius: "50%", width: 14, height: 14, fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>★</div>}
                  <button onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                    style={{ position: "absolute", top: -4, left: -4, background: "#c0392b", color: "#fff", border: "none", borderRadius: "50%", width: 14, height: 14, fontSize: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
              ))}
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
          <div style={label()}>Option A</div>
          <input style={inputS()} value={S.optionA} onChange={e => updateS("optionA", e.target.value)} />
          <div style={{ ...label(), marginTop: DS.lg }}>Option B</div>
          <input style={inputS()} value={S.optionB} onChange={e => updateS("optionB", e.target.value)} />
          <div style={{ ...label(), marginTop: DS.lg }}>Option C</div>
          <input style={inputS()} value={S.optionC} onChange={e => updateS("optionC", e.target.value)} />
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

  useEffect(() => {
    if (!displayMode) return;
    loadFont("DM Sans");
    loadFont("Lora");
    getCachedImage(BRAND.logoUrl);
    getCachedImage(BRAND.logoUrlLight);

    const poll = async () => {
      try {
        const res = await fetch("/api/gtp/live");
        const data = await res.json();
        if (data.ts && data.ts !== lastTsRef.current) {
          lastTsRef.current = data.ts;
          setDisplayState(data);
          // Pre-cache any images
          if (data.logoImage) getCachedImage(data.logoImage);
          (data.agentImages || []).forEach(u => u && getCachedImage(u));
          (data.photos || []).forEach(u => u && getCachedImage(u));
        }
      } catch { /* retry next poll */ }
    };
    poll();
    displayPollRef.current = setInterval(poll, 500);
    return () => clearInterval(displayPollRef.current);
  }, [displayMode]);

  // Render display canvas when state changes
  useEffect(() => {
    if (!displayMode || !displayState) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ds = displayState;
    const r2 = RATIOS["16:9"];
    canvas.width = r2.W;
    canvas.height = r2.H;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, r2.W, r2.H);

    // Update module-level EPISODE for draw functions
    EPISODE = {
      ...EPISODE,
      agents: ds.agents || ["Agent 1", "Agent 2"],
      agentImages: ds.agentImages || ["", ""],
      logoImage: ds.logoImage || "",
      rounds: EPISODE.rounds || [],
    };

    const drawFn = DRAW_FNS[ds.asset];
    if (!drawFn) return;
    const asset = ASSETS.find(a => a.id === ds.asset);

    // For property gallery with photos
    if (ds.asset === "property" && ds.photos && ds.photos.length > 0) {
      const src = ds.photos[ds.heroPhotoIndex || 0] || null;
      drawPropertyGallery(ctx, r2.W, r2.H, ds.S, src, 1, ds.heroPhotoIndex || 0, ds.photos.length);
      return;
    }

    if (asset?.animated) {
      // Animate over 3 seconds
      cancelAnimationFrame(displayAnimRef.current);
      const dur = ds.asset === "timer" ? (ds.S?.timerDuration || 3) * 1000 : 3000;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / dur);
        ctx.clearRect(0, 0, r2.W, r2.H);
        drawFn(ctx, r2.W, r2.H, ds.S, p);
        if (p < 1) displayAnimRef.current = requestAnimationFrame(tick);
      };
      displayAnimRef.current = requestAnimationFrame(tick);
    } else {
      drawFn(ctx, r2.W, r2.H, ds.S);
    }
  }, [displayMode, displayState]);

  if (displayMode) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <canvas ref={canvasRef} width={1920} height={1080}
          style={{ width: "100vw", height: "100vh", objectFit: "contain", display: "block" }} />
        {!displayState && (
          <div style={{ position: "absolute", color: "rgba(255,255,255,0.3)", fontFamily: DS.font, fontSize: 14 }}>
            Waiting for controller...
          </div>
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
      <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "#000", fontFamily: DS.font, touchAction: "none" }}>
        {/* Fullscreen canvas */}
        <canvas ref={canvasRef} width={r.W} height={r.H}
          style={{ width: "100vw", height: "100vh", objectFit: "contain", display: "block" }}
          onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} />

        {/* Floating overlay */}
        {overlayVisible && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", padding: `12px 16px calc(12px + env(safe-area-inset-bottom, 0px)) 16px` }}>

            {/* Round selector */}
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 10 }}>
              {episode.rounds.map((rd2, i) => (
                <button key={i} onClick={() => !isRoundEmpty(rd2) && liveLoadRound(i + 1)}
                  style={{ padding: "6px 14px", fontSize: 13, fontWeight: 700, border: "none", borderRadius: 20, cursor: isRoundEmpty(rd2) ? "default" : "pointer",
                    background: currentRound === i ? GAME.gold : isRoundEmpty(rd2) ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.12)",
                    color: currentRound === i ? "#000" : isRoundEmpty(rd2) ? "rgba(255,255,255,0.2)" : "#fff",
                    opacity: isRoundEmpty(rd2) ? 0.4 : 1 }}>
                  R{i + 1}
                </button>
              ))}
            </div>

            {/* Flow step dots */}
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 12 }}>
              {LIVE_FLOW.map((step, i) => (
                <div key={i} onClick={() => { setLiveStep(i); transitionToAsset(step); if (step === "timer" || step === "reveal") setTimeout(() => playAnimation(), 450); }}
                  style={{ width: liveStep === i ? 24 : 8, height: 8, borderRadius: 4, cursor: "pointer", transition: "all 0.2s",
                    background: i < liveStep ? "rgba(251,135,112,0.4)" : i === liveStep ? GAME.gold : "rgba(255,255,255,0.2)" }} />
              ))}
            </div>

            {/* Nav + Scores */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <button onClick={liveGoBack} style={{ padding: "8px 16px", fontSize: 14, fontWeight: 700, border: "none", borderRadius: 8, background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer" }}>Back</button>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{episode.agents[0]}</span>
                <span style={{ background: GAME.gold, color: "#000", fontWeight: 800, padding: "2px 10px", borderRadius: 12, fontSize: 16 }}>{scores[0]}</span>
                <button onClick={() => addScore(0)} style={{ padding: "4px 8px", fontSize: 11, border: "none", borderRadius: 6, background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer" }}>+1</button>
              </div>

              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>vs</span>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{episode.agents[1]}</span>
                <span style={{ background: GAME.gold, color: "#000", fontWeight: 800, padding: "2px 10px", borderRadius: 12, fontSize: 16 }}>{scores[1]}</span>
                <button onClick={() => addScore(1)} style={{ padding: "4px 8px", fontSize: 11, border: "none", borderRadius: 6, background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer" }}>+1</button>
              </div>

              <button onClick={liveProceed} style={{ padding: "8px 16px", fontSize: 14, fontWeight: 700, border: "none", borderRadius: 8, background: GAME.gold, color: "#000", cursor: "pointer" }}>Next</button>
            </div>

            {/* Photo dots (property step only) */}
            {currentFlowAsset === "property" && photos.length > 1 && (
              <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 10 }}>
                {photos.map((_, i) => (
                  <div key={i} onClick={() => setLivePhotoIndex(i)}
                    style={{ width: livePhotoIndex === i ? 20 : 6, height: 6, borderRadius: 3, cursor: "pointer", transition: "all 0.2s",
                      background: livePhotoIndex === i ? GAME.gold : "rgba(255,255,255,0.3)" }} />
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
  //  EDITOR MODE RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div style={{ fontFamily: DS.font, background: DS.bgPage, color: DS.textPrimary, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* HEADER */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${DS.md}px ${DS.xl}px`, borderBottom: `1px solid ${DS.borderSubtle}`, background: DS.bgSurface }}>
        <div style={{ display: "flex", alignItems: "center", gap: DS.md }}>
          <span style={{ fontSize: DS.fsXl, fontWeight: 700, color: GAME.gold }}>Guess the Price</span>
          <button onClick={() => setShowEpisodePanel(!showEpisodePanel)}
            style={btn({ padding: "4px 12px", fontSize: DS.fsSm, background: showEpisodePanel ? "rgba(251,135,112,0.15)" : DS.bgButton, border: showEpisodePanel ? `1px solid rgba(251,135,112,0.25)` : `1px solid ${DS.borderSubtle}` })}>
            Ep {episode.episode} {showEpisodePanel ? "▲" : "▼"}
          </button>
          {saveStatus && <span style={{ fontSize: DS.fsXs, color: GAME.gold }}>{saveStatus}</span>}
          {dirty && !saveStatus && <span style={{ fontSize: DS.fsXs, color: DS.textMuted }}>unsaved</span>}
        </div>
        <div style={{ display: "flex", gap: DS.xs, alignItems: "center" }}>
          <button onClick={() => syncToServer()} style={btn({ padding: "4px 12px", fontSize: DS.fsXs })}>Save</button>
          <button onClick={() => { const name = `Ep${episode.episode}_${new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}`; saveSnapshot(name); }}
            style={btn({ padding: "4px 12px", fontSize: DS.fsXs })}>Snapshot</button>
          <button onClick={enterLiveMode}
            style={btn({ padding: "4px 14px", fontSize: DS.fsXs, fontWeight: 800, background: "rgba(251,135,112,0.15)", border: `1px solid rgba(251,135,112,0.3)`, color: GAME.gold, letterSpacing: "0.1em" })}>
            LIVE
          </button>
          <span style={{ width: 1, height: 20, background: DS.borderSubtle }} />
          {Object.entries(RATIOS).map(([key, val]) => (
            <button key={key} onClick={() => setRatio(key)}
              style={btn({ background: ratio === key ? DS.accent : DS.bgButton, border: ratio === key ? `1px solid ${DS.accentLight}` : `1px solid ${DS.borderSubtle}`, padding: "5px 12px", fontSize: DS.fsXs })}>
              {val.label}
            </button>
          ))}
        </div>
      </header>

      {/* EPISODE PANEL */}
      {showEpisodePanel && (
        <div style={{ padding: `${DS.md}px ${DS.xl}px`, borderBottom: `1px solid ${DS.borderSubtle}`, background: "rgba(11,29,58,0.6)", display: "flex", gap: DS.lg, alignItems: "flex-start", flexWrap: "wrap" }}>
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
            <div style={{ display: "flex", gap: DS.xs }}>
              <button onClick={() => duplicateEpisode(episode)}
                style={btn({ padding: "4px 10px", fontSize: DS.fsXs })}>Duplicate</button>
            </div>
          </div>
        </div>
      )}

      {/* ROUND BAR */}
      <div style={{ padding: `${DS.sm}px ${DS.xl}px`, borderBottom: `1px solid ${DS.borderSubtle}`, background: "rgba(11,29,58,0.4)", display: "flex", alignItems: "center", gap: DS.lg, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: DS.xs }}>
          {episode.rounds.map((rd, i) => {
            const isActive = currentRound === i;
            const empty = isRoundEmpty(rd);
            return (
              <button key={i} onClick={() => !empty && loadRound(i + 1)}
                style={btn({ padding: "6px 14px", fontSize: DS.fsXs, fontWeight: 700, background: isActive ? GAME.gold : empty ? "rgba(255,255,255,0.02)" : DS.bgButton, color: isActive ? GAME.navy : empty ? DS.textMuted : DS.textPrimary, opacity: empty ? 0.4 : 1, cursor: empty ? "not-allowed" : "pointer", letterSpacing: "0.05em" })}>
                R{i + 1}
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

      {/* STATUS STRIP */}
      <div style={{ padding: `${DS.xs}px ${DS.xl}px`, borderBottom: `1px solid ${DS.borderSubtle}`, fontSize: DS.fsSm, color: DS.textMuted, background: "rgba(11,29,58,0.2)" }}>
        Round {round.number} of 6 &middot; {round.address ? round.address.split(",")[0] : "\u2014"} &middot; {round.guesser} guesses {round.propertyAgent}&apos;s property
      </div>

      {/* MAIN */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Asset Nav */}
        <nav style={{ width: 160, flexShrink: 0, padding: `${DS.md}px ${DS.sm}px`, borderRight: `1px solid ${DS.borderSubtle}`, display: "flex", flexDirection: "column", gap: DS.xs, overflowY: "auto" }}>
          <div style={sectionHead({ marginBottom: DS.sm })}>Assets</div>
          {ASSETS.map(a => (
            <button key={a.id} onClick={() => { setActiveAsset(a.id); setAnimProgress(0); setIsPlaying(false); }}
              style={{ ...btn({ padding: "8px 12px", width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: DS.sm, background: activeAsset === a.id ? "rgba(251,135,112,0.15)" : DS.bgButton, border: activeAsset === a.id ? `1px solid rgba(251,135,112,0.25)` : `1px solid ${DS.borderSubtle}`, color: activeAsset === a.id ? GAME.gold : DS.textPrimary }) }}>
              <span style={{ fontSize: 14 }}>{a.icon}</span>
              <span style={{ fontSize: DS.fsSm }}>{a.label}</span>
              {a.animated && <span style={{ fontSize: 8, color: DS.textMuted, marginLeft: "auto" }}>ANIM</span>}
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
              <div style={label()}>Animation Progress</div>
              <input type="range" min={0} max={1} step={0.01} value={animProgress}
                onChange={e => { setAnimProgress(+e.target.value); render(+e.target.value); }}
                style={{ width: "100%", accentColor: GAME.gold }} />
              <div style={{ fontSize: DS.fsXs, color: DS.textMuted, marginTop: DS.xs }}>{Math.round(animProgress * 100)}%</div>
            </div>
          )}
        </aside>
      </div>

      {/* FOOTER */}
      <footer style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `${DS.md}px ${DS.xl}px`, borderTop: `1px solid ${DS.borderSubtle}`, background: DS.bgSurface }}>
        <div style={{ display: "flex", gap: DS.sm }}>
          <button onClick={() => exportPNG()} style={btnCta({ padding: "8px 20px", fontSize: DS.fsSm })}>Export PNG</button>
          {ASSETS.find(a => a.id === activeAsset)?.animated && (
            <button onClick={exportWebM} style={btnPositive({ padding: "8px 20px", fontSize: DS.fsSm })}>Export WebM</button>
          )}
          <button onClick={exportRound} style={btn({ padding: "8px 20px", fontSize: DS.fsSm, borderColor: "rgba(251,135,112,0.25)", color: GAME.gold })}>Export Round</button>
          <button onClick={exportPDF} style={btn({ padding: "8px 20px", fontSize: DS.fsSm, borderColor: "rgba(251,135,112,0.25)", color: GAME.gold })}>iPad PDF</button>
          <span style={{ width: 1, height: 24, background: DS.borderSubtle }} />
          <button onClick={() => pushToLive()}
            style={btn({ padding: "8px 20px", fontSize: DS.fsSm, fontWeight: 800, background: liveConnected ? "rgba(131,163,129,0.2)" : "rgba(251,135,112,0.15)", border: `1px solid ${liveConnected ? "rgba(131,163,129,0.3)" : "rgba(251,135,112,0.3)"}`, color: liveConnected ? BRAND.colorPositive : GAME.gold })}>
            {liveConnected ? "Push to Live \u2713" : "Push to Live"}
          </button>
        </div>
        {exportStatus && <span style={{ fontSize: DS.fsSm, color: GAME.gold }}>{exportStatus}</span>}
        <div style={{ fontSize: DS.fsXs, color: DS.textMuted }}>{r.W} &times; {r.H} &middot; {activeAsset}{liveConnected && " \u00b7 LIVE"}</div>
      </footer>
    </div>
  );
}
