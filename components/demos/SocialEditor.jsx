"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
//  FONTS  — curated Google Fonts for video
// ═══════════════════════════════════════════════════════════════
const FONTS = [
  { name:"Montserrat",       weights:"400;600;700;800;900" },
  { name:"Oswald",           weights:"400;600;700"         },
  { name:"Bebas Neue",       weights:"400"                 },
  { name:"Poppins",          weights:"400;600;700;800;900" },
  { name:"Anton",            weights:"400"                 },
  { name:"Barlow Condensed", weights:"400;600;700;800;900" },
  { name:"Raleway",          weights:"400;600;700;800;900" },
  { name:"Nunito",           weights:"400;600;700;800;900" },
];

function loadFont(name) {
  if (!name) return;
  const id = "gf-" + name.replace(/ /g, "-");
  if (document.getElementById(id)) return;
  const l = document.createElement("link");
  l.id = id; l.rel = "stylesheet";
  l.href = `https://fonts.googleapis.com/css2?family=${name.replace(/ /g,"+")}:wght@${(FONTS.find(f=>f.name===name)||FONTS[0]).weights}&display=swap`;
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
//  DEFAULT BRAND / PROJECT
// ═══════════════════════════════════════════════════════════════
const DEFAULT_BRAND = {
  colorPrimary:"#1D3557", colorAccent:"#E63946",
  colorPositive:"#2A9D8F", colorText:"#FFFFFF",
  fontFamily:"Montserrat",
  channelName:"", cornerRadius:18, iconStyle:"line",
  captionPillRadius:12, captionFontSize:88, animationPreset:"default",
  captionFontWeight:"800", captionPosition:"lower",
  captionTextCase:"upper", captionBgOpacity:0,
  // watermark
  logoDataUrl:"",    // base64 transparent PNG
  logoOpacity:0.75,  // 0–1
  logoSize:0.10,     // fraction of canvas width (0.05–0.25)
  logoPosition:"br", // br | bl | tr | tl
  // typography
  typeScale:1.0,       // 0.7–1.3  — scales all graphic font sizes
  lineHeight:1.30,     // 1.1–1.9  — graphic line height multiplier
  headingWeight:"900", // 700|800|900 — graphic headline weight
  captionLineHeight:1.45, // 1.1–1.9 — caption line height
  // title card
  titleCardSeriesName:"",
  titleCardTitle:"",
  titleCardSubtitle:"",
  titleCardStyle:"bar",  // "bar" | "centred" | "split"
  // endboard
  endboardCTA:"",
  endboardHandles:"",
  endboardWebsite:"",
  endboardStyle:"logo",  // "logo" | "grid" | "minimal"
};

// ── Logo image cache (avoids reloading on every frame) ──────
const IMG_CACHE = {};
function getCachedImage(dataUrl) {
  if (!dataUrl) return null;
  if (IMG_CACHE[dataUrl]) return IMG_CACHE[dataUrl].complete ? IMG_CACHE[dataUrl] : null;
  const img = new Image();
  img.src = dataUrl;
  IMG_CACHE[dataUrl] = img;
  return null; // available next frame once decoded
}

const BS = "infostudio_brands_v1";
const PS = "infostudio_projects_v1";
const TMPL_STORE = "infostudio_templates_v1";
const load = k => { try { const r=localStorage.getItem(k); return r?JSON.parse(r):[]; } catch{ return []; } };
const save = (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch{} };

// ── Style template field list — all visual fields captured in a template ──
const STYLE_FIELDS = [
  "colorPrimary","colorAccent","colorPositive","colorText",
  "fontFamily","typeScale","lineHeight","headingWeight",
  "captionFontSize","captionFontWeight","captionLineHeight",
  "captionPosition","captionTextCase","captionBgOpacity",
  "captionPillRadius","cornerRadius","iconStyle",
  "animationPreset"
];

const newBrand = name => ({ id:Date.now(), name:name||"My Brand", createdAt:new Date().toISOString(), ...DEFAULT_BRAND });
const newProject = (brandId, name) => ({ id:Date.now()+1, brandId, name:name||"Untitled Project", createdAt:new Date().toISOString(), srt:"", subtitles:[], graphics:[], selected:[], previews:{}, captionStyle:"tiktok", titleCardOverride:null });

// ═══════════════════════════════════════════════════════════════
//  SRT PARSER
// ═══════════════════════════════════════════════════════════════
const toSec = ts => { const [h,m,s]=ts.replace(",",".").split(":").map(Number); return h*3600+m*60+s; };
function parseSRT(srt) {
  return srt.trim().split(/\n\s*\n/).map((b,idx)=>{
    const lines=b.trim().split("\n"), tl=lines.find(l=>l.includes("-->"));
    if(!tl)return null;
    const m=tl.match(/(\d{2}:\d{2}:\d{2}[,.:]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.:]\d{3})/);
    if(!m)return null;
    const text=lines.slice(lines.indexOf(tl)+1).join(" ").replace(/<[^>]+>/g,"").trim();
    return{index:idx+1,start:m[1],end:m[2],startSec:toSec(m[1]),endSec:toSec(m[2]),text};
  }).filter(Boolean);
}

// ═══════════════════════════════════════════════════════════════
//  PREMIERE XML GENERATOR
// ═══════════════════════════════════════════════════════════════
function generatePremiereXML(subtitles, ratio, prefix) {
  const { W, H } = RATIOS[ratio] || RATIOS["16:9"];
  const FPS = 30;
  const toF = sec => Math.round(sec * FPS);
  const lastSub = subtitles[subtitles.length - 1];
  const totalFrames = lastSub ? toF(lastSub.endSec) + FPS : FPS * 60;
  const clips = subtitles.map((s,i) => {
    const sf=toF(s.startSec), ef=toF(s.endSec), dur=ef-sf;
    const fn=`${prefix}caption_${String(s.index).padStart(3,"0")}.webm`;
    return `      <clipitem id="clip${i+1}">
        <name>${fn}</name><start>${sf}</start><end>${ef}</end>
        <in>0</in><out>${dur}</out>
        <file id="file${i+1}">
          <name>${fn}</name><pathurl>${fn}</pathurl>
          <duration>${dur}</duration>
          <rate><timebase>${FPS}</timebase><ntsc>FALSE</ntsc></rate>
          <media><video><samplecharacteristics>
            <width>${W}</width><height>${H}</height>
          </samplecharacteristics></video></media>
        </file>
      </clipitem>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE xmeml>\n<xmeml version="5">\n  <sequence id="seq1">\n    <name>Captions ${ratio}</name>\n    <duration>${totalFrames}</duration>\n    <rate><timebase>${FPS}</timebase><ntsc>FALSE</ntsc></rate>\n    <media>\n      <video>\n        <format><samplecharacteristics><width>${W}</width><height>${H}</height></samplecharacteristics></format>\n        <track>\n${clips}\n        </track>\n      </video>\n    </media>\n  </sequence>\n</xmeml>`;
}

// ═══════════════════════════════════════════════════════════════
//  CANVAS UTILS
// ═══════════════════════════════════════════════════════════════
function rrPath(ctx,x,y,w,h,r){
  const[tl,tr,br,bl]=typeof r==="number"?[r,r,r,r]:r;
  ctx.beginPath();ctx.moveTo(x+tl,y);ctx.lineTo(x+w-tr,y);ctx.quadraticCurveTo(x+w,y,x+w,y+tr);
  ctx.lineTo(x+w,y+h-br);ctx.quadraticCurveTo(x+w,y+h,x+w-br,y+h);
  ctx.lineTo(x+bl,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-bl);
  ctx.lineTo(x,y+tl);ctx.quadraticCurveTo(x,y,x+tl,y);ctx.closePath();
}
function fitFont(ctx,text,maxW,maxH,baseSz,weight,maxLines,ff,lhMult=1.30){
  let sz=baseSz;
  while(sz>20){
    ctx.font=`${weight} ${sz}px "${ff}","Arial",sans-serif`;
    const lh=sz*lhMult,words=(text||"").split(" ");let lines=0,line="";
    for(const w of words){const t=line+w+" ";if(ctx.measureText(t).width>maxW&&line){lines++;line=w+" ";}else line=t;}
    if(line.trim())lines++;
    if(lines<=maxLines&&lines*lh<=maxH)break;sz-=3;
  }
  return{sz,lh:sz*lhMult};
}
function drawText(ctx,text,x,y,maxW,maxH,baseSz,weight,align,color,maxLines=3,ff="Montserrat",lhMult=1.30){
  if(!text)return y;
  const{sz,lh}=fitFont(ctx,text,maxW,maxH,baseSz,weight||"700",maxLines,ff,lhMult);
  ctx.font=`${weight||"700"} ${sz}px "${ff}","Arial",sans-serif`;
  ctx.fillStyle=color||"#fff";ctx.textAlign=align||"center";ctx.textBaseline="alphabetic";
  const words=text.split(" ");let line="",cy=y,count=0;
  for(const word of words){
    const test=line+word+" ";
    if(ctx.measureText(test).width>maxW&&line){
      if(count<maxLines&&cy<=y+maxH){ctx.fillText(line.trim(),x,cy);line=word+" ";cy+=lh;count++;}else break;
    }else line=test;
  }
  if(line.trim()&&count<maxLines&&cy<=y+maxH)ctx.fillText(line.trim(),x,cy);
  return cy;
}
function stamp(ctx,brand,W,H){
  const MARGIN=W*0.03;
  const opacity=Math.min(1,Math.max(0,brand.logoOpacity??0.75));
  // Logo image
  if(brand.logoDataUrl){
    const img=getCachedImage(brand.logoDataUrl);
    if(img){
      const logoW=Math.round(W*Math.min(0.25,Math.max(0.04,brand.logoSize??0.10)));
      const logoH=Math.round(logoW*(img.naturalHeight/img.naturalWidth));
      const pos=brand.logoPosition||"br";
      const x=pos.includes("r")?W-MARGIN-logoW:MARGIN;
      const y=pos.includes("b")?H-MARGIN-logoH:MARGIN;
      ctx.save();ctx.globalAlpha=opacity;ctx.drawImage(img,x,y,logoW,logoH);ctx.restore();
    }
    return;
  }
  // Text fallback
  if(!brand.channelName)return;
  ctx.save();ctx.globalAlpha=0.22;
  ctx.font=`600 ${Math.round(W*0.014)}px "${brand.fontFamily}","Arial",sans-serif`;
  ctx.fillStyle="#fff";ctx.textAlign="right";ctx.textBaseline="alphabetic";
  ctx.fillText(brand.channelName.toUpperCase(),W-MARGIN,H-H*0.035);ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  ICONS
// ═══════════════════════════════════════════════════════════════
function drawIcon(ctx,name,cx,cy,size,color,style){
  const r=size/2,lw=Math.max(4,size*0.095);
  ctx.save();ctx.translate(cx,cy);ctx.strokeStyle=color;ctx.fillStyle=color;
  ctx.lineWidth=lw;ctx.lineCap="round";ctx.lineJoin="round";
  const disc=(a=0.2)=>{ctx.save();ctx.globalAlpha=a;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.restore();};
  if(name==="cross"){if(style==="filled")disc();const a=r*0.46;ctx.beginPath();ctx.moveTo(-a,-a);ctx.lineTo(a,a);ctx.stroke();ctx.beginPath();ctx.moveTo(a,-a);ctx.lineTo(-a,a);ctx.stroke();}
  else if(name==="check"){if(style==="filled")disc();ctx.beginPath();ctx.moveTo(-r*0.52,r*0.02);ctx.lineTo(-r*0.06,r*0.48);ctx.lineTo(r*0.60,-r*0.52);ctx.stroke();}
  else if(name==="info"){ctx.beginPath();ctx.arc(0,0,r*0.9,0,Math.PI*2);if(style==="filled"){ctx.save();ctx.globalAlpha=0.2;ctx.fill();ctx.restore();}ctx.stroke();ctx.beginPath();ctx.arc(0,-r*0.44,lw*0.6,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(0,-r*0.16);ctx.lineTo(0,r*0.52);ctx.stroke();}
  else if(name==="question"){ctx.beginPath();ctx.arc(0,0,r*0.9,0,Math.PI*2);if(style==="filled"){ctx.save();ctx.globalAlpha=0.2;ctx.fill();ctx.restore();}ctx.stroke();ctx.font=`900 ${r*1.0}px Arial,sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("?",0,r*0.07);}
  else if(name==="warning"){if(style==="filled")disc(0.2);ctx.beginPath();ctx.moveTo(0,-r*0.88);ctx.lineTo(r*0.84,r*0.68);ctx.lineTo(-r*0.84,r*0.68);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.moveTo(0,-r*0.38);ctx.lineTo(0,r*0.18);ctx.stroke();ctx.beginPath();ctx.arc(0,r*0.42,lw*0.55,0,Math.PI*2);ctx.fill();}
  else if(name==="lock"){const bw=r*1.2,bh=r*0.95,bx=-bw/2,by=r*0.05;if(style==="filled"){ctx.save();ctx.globalAlpha=0.2;rrPath(ctx,bx,by,bw,bh,4);ctx.fill();ctx.restore();}rrPath(ctx,bx,by,bw,bh,4);ctx.stroke();ctx.beginPath();ctx.arc(0,by,bw*0.36,Math.PI,0);ctx.stroke();}
  else if(name==="calendar"){const bw=r*1.4,bh=r*1.3,bx=-bw/2,by=-r*0.75;if(style==="filled"){ctx.save();ctx.globalAlpha=0.2;rrPath(ctx,bx,by,bw,bh,5);ctx.fill();ctx.restore();}rrPath(ctx,bx,by,bw,bh,5);ctx.stroke();ctx.beginPath();ctx.moveTo(bx,by+bh*0.34);ctx.lineTo(bx+bw,by+bh*0.34);ctx.stroke();[0.28,0.72].forEach(p=>{ctx.beginPath();ctx.moveTo(bx+bw*p,by-lw*0.4);ctx.lineTo(bx+bw*p,by+lw*1.6);ctx.stroke();});}
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  EASING
// ═══════════════════════════════════════════════════════════════
const easeOut  = t => 1-(1-t)**3;
const easeBack = t => { const c=1.70158+1; return 1+c*(t-1)**3+1.70158*(t-1)**2; };
const easeOutOnly = t => 1-(1-t)**2; // no overshoot — smooth decel only
const easeBackTight = t => { const c=1.2+1; return 1+c*(t-1)**3+1.2*(t-1)**2; }; // tighter spring
const easeBackBig = t => { const c=2.8+1; return 1+c*(t-1)**3+2.8*(t-1)**2; }; // exaggerated spring
const clamp    = (v,a,b) => Math.max(a,Math.min(b,v));

// ── Animation Presets ──────────────────────────────────────────
const ANIM_PRESETS = {
  default: { label:"Default",   icon:"▶",  entMul:2,   txtMul:2.5, txtDelay:0.15, easeFn:easeOut,     easeBackFn:easeBack,      feel:"Current behaviour" },
  snappy:  { label:"Snappy",    icon:"⚡", entMul:3.5, txtMul:4,   txtDelay:0.08, easeFn:easeOut,     easeBackFn:easeBackTight,  feel:"Fast, punchy" },
  gentle:  { label:"Gentle",    icon:"🌊", entMul:1.2, txtMul:1.8, txtDelay:0.20, easeFn:easeOutOnly, easeBackFn:easeOutOnly,    feel:"Smooth, elegant" },
  punchy:  { label:"Punchy",    icon:"💥", entMul:2.8, txtMul:3.2, txtDelay:0.10, easeFn:easeOut,     easeBackFn:easeBackBig,    feel:"Bouncy, social-media" },
};

// ── Style Extraction Mappings ─────────────────────────────────
const FONT_MAP  = { condensed:"Barlow Condensed", sans:"Montserrat", display:"Anton", serif:"Raleway" };
const RADIUS_MAP = { sharp:0, slight:8, rounded:18, pill:32 };
const LH_MAP     = { tight:1.15, normal:1.30, airy:1.55 };

const EXTRACTION_PROMPT = `Analyse this graphic/screenshot and extract the visual style.
Return ONLY valid JSON, no markdown:
{
  "colorPrimary": "#hex — the main background or card colour",
  "colorAccent": "#hex — the strongest highlight/emphasis colour",
  "colorPositive": "#hex — secondary accent if present, else similar to colorAccent",
  "colorText": "#hex — the main text colour",
  "fontStyle": "condensed|sans|serif|display — best description of the font style",
  "fontWeight": "700|800|900 — approximate heading weight",
  "lineHeightFeel": "tight|normal|airy",
  "cornerRadiusFeel": "sharp|slight|rounded|pill",
  "iconStyle": "line|filled",
  "overallFeel": "bold|minimal|editorial|playful|corporate",
  "animationSuggestion": "snappy|default|gentle|punchy",
  "notes": "any other observations about the visual style"
}`;

function mapExtractedStyle(raw){
  return {
    colorPrimary:     raw.colorPrimary    || undefined,
    colorAccent:      raw.colorAccent     || undefined,
    colorPositive:    raw.colorPositive   || undefined,
    colorText:        raw.colorText       || undefined,
    fontFamily:       FONT_MAP[raw.fontStyle]  || "Montserrat",
    headingWeight:    raw.fontWeight      || "800",
    lineHeight:       LH_MAP[raw.lineHeightFeel] || 1.30,
    cornerRadius:     RADIUS_MAP[raw.cornerRadiusFeel]!==undefined ? RADIUS_MAP[raw.cornerRadiusFeel] : 18,
    iconStyle:        (raw.iconStyle==="filled"||raw.iconStyle==="line") ? raw.iconStyle : "line",
    animationPreset:  ["snappy","default","gentle","punchy"].includes(raw.animationSuggestion) ? raw.animationSuggestion : "default",
  };
}

// ═══════════════════════════════════════════════════════════════
//  GRAPHIC RENDERER
// ═══════════════════════════════════════════════════════════════
function drawGraphic(canvas,g,brand,ratio,progress=1){
  const AR=RATIOS[ratio||"16:9"]||RATIOS["16:9"];
  const W=AR.W,H=AR.H;canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext("2d",{alpha:true});ctx.clearRect(0,0,W,H);
  const B={...DEFAULT_BRAND,...brand};
  const R=Math.max(0,Number(B.cornerRadius)||18);
  const IC=B.iconStyle||"line";
  const FF=B.fontFamily||"Montserrat";
  const{template:t,content:c={}}=g;
  const sc=Math.min(W,H)/1080,PAD=Math.round(80*sc);
  const p=clamp(progress,0,1);
  const AP=ANIM_PRESETS[B.animationPreset]||ANIM_PRESETS.default;
  const ENT=AP.easeFn(clamp(p*AP.entMul,0,1)),TXT=AP.easeFn(clamp((p-AP.txtDelay)*AP.txtMul,0,1));
  const TS=Math.max(0.5,Math.min(1.6,Number(B.typeScale)||1.0));   // type scale
  const LH=Math.max(1.0,Math.min(2.2,Number(B.lineHeight)||1.30)); // line height
  const HW=B.headingWeight||"900";                                   // heading weight
  // DT: helper that applies TS to font size and LH to line height
  // wt==="HW" is a sentinel meaning "use brand heading weight"
  const DT=(text,x,y,mW,mH,sz,wt,al,col,ml)=>drawText(ctx,text,x,y,mW,mH,Math.round(sz*TS),wt==="HW"?HW:wt,al,col,ml,FF,LH);
  const isPortrait=H>W;

  if(t==="myth"||t==="reality"){
    const bg=t==="myth"?B.colorAccent:B.colorPositive;
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    ctx.save();ctx.globalAlpha=0.07;ctx.strokeStyle="#000";ctx.lineWidth=2;
    for(let i=-H;i<W+H;i+=44*sc){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+H,H);ctx.stroke();}ctx.restore();
    const icR=Math.round(118*sc),icSc=AP.easeBackFn(clamp(p*AP.entMul*1.1,0,1));
    ctx.save();ctx.translate(W/2,H*0.28);ctx.scale(icSc,icSc);
    ctx.globalAlpha=0.18;ctx.fillStyle="#000";ctx.beginPath();ctx.arc(0,0,icR,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=1;drawIcon(ctx,t==="myth"?"cross":"check",0,0,icR*1.05,"#fff",IC);ctx.restore();
    ctx.save();ctx.translate(0,(1-ENT)*H*0.08);ctx.globalAlpha=ENT;
    ctx.font=`800 ${Math.round(52*sc)}px "${FF}","Arial",sans-serif`;
    const badge=t==="myth"?"MYTH":"REALITY",bw=ctx.measureText(badge).width;
    ctx.fillStyle="rgba(0,0,0,0.3)";rrPath(ctx,W/2-bw/2-28*sc,H*0.50,bw+56*sc,72*sc,36*sc);ctx.fill();
    ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="alphabetic";ctx.fillText(badge,W/2,H*0.50+52*sc);ctx.restore();
    ctx.save();ctx.globalAlpha=TXT;DT(c.body||"",W/2,H*0.62,W-PAD*2,H*0.26,Math.round(78*sc),"800","center","#fff",3);ctx.restore();
    stamp(ctx,B,W,H);
  }
  else if(t==="title"){
    ctx.fillStyle=B.colorPrimary;ctx.fillRect(0,0,W,H);
    if(c.number){ctx.save();ctx.globalAlpha=0.05;ctx.fillStyle="#fff";ctx.font=`900 ${Math.round(Math.min(W,H)*0.52)}px "${FF}","Arial",sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(c.number,W/2,H/2+H*0.07);ctx.restore();}
    if(isPortrait){
      // Portrait: centred layout — accent rule + centred text stack
      const ruleW=Math.round(W*0.18*ENT);
      ctx.fillStyle=B.colorAccent;ctx.fillRect(W/2-ruleW/2,H*0.38,ruleW,Math.round(6*sc));
      ctx.save();ctx.globalAlpha=TXT*0.55;DT((c.headline||"").toUpperCase(),W/2,H*0.30,W-PAD*2,H*0.10,Math.round(44*sc),"600","center","rgba(255,255,255,0.7)",1);ctx.restore();
      ctx.save();ctx.globalAlpha=TXT;ctx.translate(0,(1-TXT)*50*sc);
      let y=H*0.41;
      y=DT(c.headline||"",W/2,y,W-PAD*2,H*0.20,Math.round(110*sc),"900","center","#fff",2)+H*0.03;
      if(c.subheadline)y=DT(c.subheadline,W/2,y,W-PAD*2,H*0.10,Math.round(52*sc),"600","center","rgba(255,255,255,0.65)",2)+H*0.02;
      if(c.body)DT(c.body,W/2,y,W-PAD*2,H*0.08,Math.round(40*sc),"500","center","rgba(255,255,255,0.38)",1);
      ctx.restore();
    } else {
      ctx.fillStyle=B.colorAccent;ctx.fillRect(PAD,H*0.27,Math.round(10*sc),H*0.46*ENT);
      const tx=PAD+Math.round(38*sc);
      ctx.save();ctx.globalAlpha=TXT;ctx.translate((1-TXT)*-40*sc,0);
      let y=H*0.34;
      y=DT(c.headline||"",tx,y,W-tx-PAD,H*0.20,Math.round(115*sc),"900","left","#fff",2)+H*0.03;
      if(c.subheadline)y=DT(c.subheadline,tx,y,W-tx-PAD,H*0.14,Math.round(68*sc),"600","left","rgba(255,255,255,0.72)",2)+H*0.02;
      if(c.body)DT(c.body,tx,y,W-tx-PAD,H*0.12,Math.round(48*sc),"500","left","rgba(255,255,255,0.42)",2);
      ctx.restore();
    }
    stamp(ctx,B,W,H);
  }
  else if(t==="rule_number"){
    ctx.fillStyle=B.colorPrimary;ctx.fillRect(0,0,W,H);
    ctx.save();ctx.globalAlpha=0.05;ctx.fillStyle="#fff";const gs=easeOut(clamp(p*1.5,0,1));
    ctx.font=`900 ${Math.round(Math.min(W,H)*0.5)}px "${FF}","Arial",sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.translate(W/2,H/2+H*0.08);ctx.scale(gs,gs);ctx.fillText(c.number||"1",0,0);ctx.restore();
    ctx.fillStyle=B.colorAccent;ctx.fillRect(0,0,W,Math.round(10*sc));
    ctx.save();ctx.globalAlpha=ENT;ctx.translate(0,(1-ENT)*H*0.06);
    ctx.fillStyle="rgba(255,255,255,0.4)";ctx.font=`700 ${Math.round(56*sc)}px "${FF}","Arial",sans-serif`;ctx.textAlign="center";ctx.textBaseline="alphabetic";ctx.fillText("— RULE —",W/2,H*0.35);
    ctx.fillStyle="#fff";ctx.font=`900 ${Math.round(220*sc)}px "${FF}","Arial",sans-serif`;ctx.fillText("#"+(c.number||"1"),W/2,H*0.68);ctx.restore();
    if(c.body){ctx.save();ctx.globalAlpha=TXT;DT(c.body,W/2,H*0.73,W-PAD*2,H*0.14,Math.round(54*sc),"500","center","rgba(255,255,255,0.55)",2);ctx.restore();}
    stamp(ctx,B,W,H);
  }
  else if(t==="key_point"){
    ctx.fillStyle=B.colorPrimary;ctx.fillRect(0,0,W,H);ctx.fillStyle=B.colorPositive;ctx.fillRect(0,0,W,Math.round(10*sc));
    if(isPortrait){
      // Portrait: icon centred above, headline + body stacked
      const icSc=AP.easeBackFn(clamp(p*AP.entMul,0,1));ctx.save();ctx.translate(W/2,H*0.28);ctx.scale(icSc,icSc);drawIcon(ctx,"info",0,0,Math.round(120*sc),B.colorPositive,IC);ctx.restore();
      ctx.save();ctx.globalAlpha=TXT;ctx.translate(0,(1-TXT)*40*sc);
      DT(c.headline||"KEY POINT",W/2,H*0.38,W-PAD*2,H*0.10,Math.round(72*sc),"900","center","#fff",1);ctx.restore();
      const divW=(W-PAD*2)*ENT;ctx.strokeStyle="rgba(255,255,255,0.1)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W/2-divW/2,H*0.46);ctx.lineTo(W/2+divW/2,H*0.46);ctx.stroke();
      ctx.save();ctx.globalAlpha=TXT;DT(c.body||"",W/2,H*0.50,W-PAD*2,H*0.36,Math.round(64*sc),"600","center","rgba(255,255,255,0.88)",4);ctx.restore();
    } else {
      const icSc=AP.easeBackFn(clamp(p*AP.entMul,0,1));ctx.save();ctx.translate(PAD+Math.round(75*sc),H*0.34);ctx.scale(icSc,icSc);drawIcon(ctx,"info",0,0,Math.round(100*sc),B.colorPositive,IC);ctx.restore();
      ctx.save();ctx.globalAlpha=TXT;ctx.translate((1-TXT)*-30*sc,0);DT(c.headline||"KEY POINT",PAD+Math.round(152*sc),H*0.26,W-PAD-Math.round(152*sc)-PAD,H*0.13,Math.round(76*sc),"900","left","#fff",1);ctx.restore();
      ctx.strokeStyle="rgba(255,255,255,0.1)";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(PAD,H*0.44);ctx.lineTo(PAD+(W-PAD*2)*ENT,H*0.44);ctx.stroke();
      ctx.save();ctx.globalAlpha=TXT;DT(c.body||"",W/2,H*0.50,W-PAD*2,H*0.38,Math.round(68*sc),"600","center","rgba(255,255,255,0.88)",4);ctx.restore();
    }
    stamp(ctx,B,W,H);
  }
  else if(t==="fact_box"){
    if(isPortrait){
      // Portrait: full-width card at bottom, slides up
      const bW=W-PAD,bH=Math.round(300*sc),bX=PAD/2,bY=H-bH-Math.round(90*sc);
      ctx.save();ctx.translate(0,(1-ENT)*bH*0.7);ctx.globalAlpha=ENT;
      ctx.shadowColor="rgba(0,0,0,0.55)";ctx.shadowBlur=36;rrPath(ctx,bX,bY,bW,bH,R);ctx.fillStyle=B.colorPrimary;ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle=B.colorPositive;rrPath(ctx,bX,bY,bW,Math.round(12*sc),[R,R,0,0]);ctx.fill();
      drawIcon(ctx,"info",bX+Math.round(58*sc),bY+bH*0.42,Math.round(50*sc),B.colorPositive,IC);
      DT((c.headline||"").toUpperCase(),bX+Math.round(96*sc),bY+Math.round(80*sc),bW-Math.round(120*sc),Math.round(64*sc),Math.round(44*sc),"700","left","#fff",1);
      DT(c.body||"",bX+Math.round(96*sc),bY+Math.round(148*sc),bW-Math.round(120*sc),bH-Math.round(166*sc),Math.round(36*sc),"500","left","rgba(255,255,255,0.72)",3);
      ctx.restore();
    } else {
      const bW=Math.round(780*sc),bH=Math.round(260*sc),bX=W-bW-Math.round(80*sc),bY=H/2-bH/2;
      ctx.save();ctx.translate((1-ENT)*bW*0.6,0);ctx.globalAlpha=ENT;
      ctx.shadowColor="rgba(0,0,0,0.55)";ctx.shadowBlur=36;rrPath(ctx,bX,bY,bW,bH,R);ctx.fillStyle=B.colorPrimary;ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle=B.colorPositive;rrPath(ctx,bX,bY,Math.round(15*sc),bH,[R,0,0,R]);ctx.fill();
      drawIcon(ctx,"info",bX+Math.round(58*sc),bY+bH/2,Math.round(46*sc),B.colorPositive,IC);
      DT((c.headline||"").toUpperCase(),bX+Math.round(94*sc),bY+Math.round(72*sc),bW-Math.round(114*sc),Math.round(58*sc),Math.round(42*sc),"700","left","#fff",1);
      DT(c.body||"",bX+Math.round(94*sc),bY+Math.round(130*sc),bW-Math.round(114*sc),bH-Math.round(148*sc),Math.round(34*sc),"500","left","rgba(255,255,255,0.72)",3);
      ctx.restore();
    }
  }
  else if(t==="speech_bubble"){
    if(isPortrait){
      // Portrait: wide centred bubble at top, scales in from centre
      const bW=W-PAD,bH=Math.round(240*sc),bX=PAD/2,bY=Math.round(80*sc);
      const sc2=AP.easeBackFn(ENT);ctx.save();ctx.translate(W/2,bY+bH/2);ctx.scale(sc2,sc2);ctx.translate(-W/2,-(bY+bH/2));ctx.globalAlpha=ENT;
      ctx.shadowColor="rgba(0,0,0,0.38)";ctx.shadowBlur=28;rrPath(ctx,bX,bY,bW,bH,R);ctx.fillStyle="#fff";ctx.fill();ctx.shadowBlur=0;
      // tail centred
      ctx.fillStyle="#fff";ctx.beginPath();ctx.moveTo(W/2-30*sc,bY+bH);ctx.lineTo(W/2,bY+bH+50*sc);ctx.lineTo(W/2+30*sc,bY+bH);ctx.closePath();ctx.fill();
      drawIcon(ctx,"question",bX+60*sc,bY+bH/2,46*sc,B.colorPrimary,IC);
      DT(c.text||"",bX+110*sc+(bW-120*sc)/2,bY+78*sc,bW-130*sc,bH-96*sc,Math.round(48*sc),"600","center",B.colorPrimary,2);
      ctx.restore();
    } else {
      const bW=Math.round(680*sc),bH=Math.round(210*sc),bX=W-bW-Math.round(100*sc),bY=Math.round(76*sc);
      const sc2=AP.easeBackFn(ENT);ctx.save();ctx.translate(W-Math.round(60*sc),bY);ctx.scale(sc2,sc2);ctx.translate(-(W-Math.round(60*sc)),-bY);ctx.globalAlpha=ENT;
      ctx.shadowColor="rgba(0,0,0,0.38)";ctx.shadowBlur=28;rrPath(ctx,bX,bY,bW,bH,R);ctx.fillStyle="#fff";ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle="#fff";ctx.beginPath();ctx.moveTo(bX+46*sc,bY+bH);ctx.lineTo(bX+18*sc,bY+bH+50*sc);ctx.lineTo(bX+124*sc,bY+bH);ctx.closePath();ctx.fill();
      drawIcon(ctx,"question",bX+64*sc,bY+bH/2,42*sc,B.colorPrimary,IC);
      DT(c.text||"",bX+106*sc+(bW-120*sc)/2,bY+68*sc,bW-128*sc,bH-84*sc,Math.round(44*sc),"600","center",B.colorPrimary,2);
      ctx.restore();
    }
  }
  else if(t==="stat"){
    const bW=Math.round(540*sc),bH=Math.round(260*sc),bX=isPortrait?(W-Math.round(540*sc))/2:Math.round(80*sc),bY=H-bH-Math.round(100*sc);
    ctx.save();ctx.translate(0,(1-ENT)*bH*0.6);ctx.globalAlpha=ENT;
    ctx.shadowColor="rgba(0,0,0,0.5)";ctx.shadowBlur=32;rrPath(ctx,bX,bY,bW,bH,R);ctx.fillStyle=B.colorPrimary;ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle=B.colorAccent;rrPath(ctx,bX,bY,bW,Math.round(10*sc),[R,R,0,0]);ctx.fill();
    const rs=c.stat||"",nm=rs.match(/^([^0-9]*)([0-9.]+)(.*)$/);
    let ds=rs;if(nm){const n=parseFloat(nm[2]),d=Math.round(n*TXT*10)/10;ds=nm[1]+(Number.isInteger(n)?Math.round(d):d.toFixed(1))+nm[3];}
    DT(ds,bX+bW/2,bY+Math.round(52*sc),bW-40*sc,Math.round(155*sc),Math.round(115*sc),"900","center","#fff",1);
    DT(c.label||"",bX+bW/2,bY+Math.round(218*sc),bW-40*sc,52*sc,Math.round(34*sc),"500","center","rgba(255,255,255,0.62)",1);
    ctx.restore();
  }
  else if(t==="timeline"){
    const bW=Math.round(Math.min(1220,W-160)*sc),bH=Math.round(220*sc),bX=(W-bW)/2,bY=H-bH-80*sc;
    ctx.save();ctx.globalAlpha=ENT;ctx.translate(0,(1-ENT)*50*sc);
    ctx.shadowColor="rgba(0,0,0,0.5)";ctx.shadowBlur=30;rrPath(ctx,bX,bY,bW,bH,R);ctx.fillStyle=B.colorPrimary;ctx.fill();ctx.shadowBlur=0;
    DT(c.label||"TIMELINE",bX+bW/2,bY+46*sc,bW-80*sc,52*sc,Math.round(36*sc),"700","center","rgba(255,255,255,0.5)",1);
    const ty=bY+138*sc,tx0=bX+80*sc,txW=bW-160*sc;
    ctx.strokeStyle="rgba(255,255,255,0.18)";ctx.lineWidth=Math.round(4*sc);ctx.beginPath();ctx.moveTo(tx0,ty);ctx.lineTo(tx0+txW*ENT,ty);ctx.stroke();
    const markers=c.markers||["6 months","12 months"];
    markers.forEach((m,i)=>{
      const frac=i/(Math.max(markers.length-1,1));if(frac>ENT)return;
      const mx=tx0+txW*frac,ds=AP.easeBackFn(clamp((ENT-frac)*4,0,1));
      ctx.save();ctx.translate(mx,ty);ctx.scale(ds,ds);ctx.fillStyle=B.colorAccent;ctx.beginPath();ctx.arc(0,0,11*sc,0,Math.PI*2);ctx.fill();ctx.restore();
      ctx.fillStyle="#fff";ctx.font=`600 ${Math.round(28*sc)}px "${FF}","Arial",sans-serif`;ctx.textAlign="center";ctx.textBaseline="alphabetic";ctx.globalAlpha=ENT*0.9;ctx.fillText(m,mx,ty+46*sc);
    });
    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════════
//  CAPTION RENDERER
// ═══════════════════════════════════════════════════════════════
function estimateWordTimings(words,dur){
  const clean=words.map(w=>w.replace(/[^a-zA-Z0-9']/g,""));
  const total=clean.reduce((s,w)=>s+Math.max(w.length,1),0);
  const GAP=Math.min(0.04,dur/(words.length*8));const usable=dur-GAP*(words.length-1);
  let t=0;
  return words.map((word,i)=>{const d=(Math.max(clean[i].length,1)/total)*usable;const tm={word,start:t,end:t+d};t+=d+GAP;return tm;});
}

function drawCaption(canvas,subtitle,brand,captionStyle,currentTime,ratio){
  const AR=RATIOS[ratio||brand.aspectRatio||"9:16"]||RATIOS["9:16"];
  const{W,H}=AR;canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext("2d",{alpha:true});ctx.clearRect(0,0,W,H);
  const B={...DEFAULT_BRAND,...brand};
  const sc=H/1080,FF=B.fontFamily||"Montserrat";
  const CLH=Math.max(1.0,Math.min(2.2,Number(B.captionLineHeight)||1.45)); // caption line height
  const fsize=Math.round((B.captionFontSize||88)*sc);
  const fw=B.captionFontWeight||"800";
  const PAD=Math.round(60*sc);
  const PR=Math.max(0,Math.min(50,Number(B.captionPillRadius)||12)); // pill radius
  const rawWords=subtitle.text.split(/\s+/).filter(Boolean);
  const dispWords=B.captionTextCase==="upper"?rawWords.map(w=>w.toUpperCase()):rawWords;
  const dur=subtitle.endSec-subtitle.startSec;
  const wt=estimateWordTimings(dispWords,dur);
  const activeIdx=wt.findIndex(w=>currentTime>=w.start&&currentTime<w.end);
  const shownUpTo=wt.reduce((acc,w,i)=>currentTime>=w.start?i:acc,-1);
  const yPos={lower:H*0.82,middle:H*0.50,upper:H*0.20};
  const centerY=yPos[B.captionPosition||"lower"]||H*0.82;

  if(B.captionBgOpacity>0){
    ctx.save();ctx.globalAlpha=B.captionBgOpacity;ctx.fillStyle="#000";
    rrPath(ctx,PAD*0.5,centerY-fsize*1.6,W-PAD,fsize*3.2,Math.round(16*sc));ctx.fill();ctx.restore();
  }

  const FONT=`${fw} ${fsize}px "${FF}","Arial",sans-serif`;

  const buildLines=words=>{
    ctx.font=FONT;const maxW=W-PAD*2,lines=[];let line=[],lineW=0;const spW=ctx.measureText(" ").width;
    for(let i=0;i<words.length;i++){
      const ww=ctx.measureText(words[i]).width;
      if(lineW+ww>maxW&&line.length){lines.push(line);line=[{w:words[i],idx:i,ww}];lineW=ww+spW;}
      else{line.push({w:words[i],idx:i,ww});lineW+=ww+spW;}
    }
    if(line.length)lines.push(line);return lines;
  };

  if(captionStyle==="karaoke"){
    ctx.font=FONT;ctx.textBaseline="alphabetic";
    const lines=buildLines(dispWords);const lh=fsize*CLH;
    let startY=centerY-(lines.length*lh)/2+fsize;const spW=ctx.measureText(" ").width;
    for(const ln of lines){
      const lw=ln.reduce((s,e)=>s+e.ww,0)+spW*(ln.length-1);let cx=W/2-lw/2;
      const prog=easeOut(clamp((currentTime-(wt[ln[0].idx]?.start||0))*4,0,1));
      for(const e of ln){
        const isA=e.idx===activeIdx,isPast=e.idx<=shownUpTo&&!isA;
        ctx.save();ctx.translate(0,(1-prog)*fsize*0.35);ctx.globalAlpha=prog*0.95;
        if(isA){const pp=Math.round(14*sc),pH=fsize*1.38;rrPath(ctx,cx-pp,startY-fsize*0.84,e.ww+pp*2,pH,PR*sc);ctx.fillStyle=B.colorPositive;ctx.fill();ctx.fillStyle="#fff";}
        else ctx.fillStyle=isPast?"rgba(255,255,255,0.55)":"rgba(255,255,255,0.30)";
        ctx.shadowColor="rgba(0,0,0,0.7)";ctx.shadowBlur=Math.round(8*sc);ctx.fillText(e.w,cx,startY);ctx.restore();cx+=e.ww+spW;
      }
      startY+=lh;
    }
  }
  else if(captionStyle==="popin"){
    ctx.font=FONT;ctx.textBaseline="alphabetic";
    const lines=buildLines(dispWords);const lh=fsize*CLH;
    let startY=centerY-(lines.length*lh)/2+fsize;const spW=ctx.measureText(" ").width;
    for(const ln of lines){
      const lw=ln.reduce((s,e)=>s+e.ww,0)+spW*(ln.length-1);let cx=W/2-lw/2;
      for(const e of ln){
        const tw=wt[e.idx];if(!tw||currentTime<tw.start){cx+=e.ww+spW;continue;}
        const el=currentTime-tw.start,td=tw.end-tw.start;
        const prog=easeBack(clamp(el/(td*0.6),0,1)),sc2=0.4+prog*0.6;
        ctx.save();ctx.translate(cx+e.ww/2,startY-fsize*0.3);ctx.scale(sc2,sc2);ctx.translate(-(cx+e.ww/2),-(startY-fsize*0.3));
        ctx.globalAlpha=clamp(el/0.08,0,1);ctx.fillStyle=e.idx===activeIdx?B.colorPositive:B.colorText;
        ctx.shadowColor="rgba(0,0,0,0.8)";ctx.shadowBlur=Math.round(10*sc);ctx.textBaseline="alphabetic";ctx.fillText(e.w,cx,startY);ctx.restore();cx+=e.ww+spW;
      }startY+=lh;
    }
  }
  else if(captionStyle==="tiktok"){
    const CHUNK=3;const chunks=[];
    for(let i=0;i<dispWords.length;i+=CHUNK)chunks.push(dispWords.slice(i,i+CHUNK).map((w,j)=>({w,idx:i+j})));
    const aci=chunks.findIndex(ch=>{const f=wt[ch[0].idx],l=wt[ch[ch.length-1].idx];return f&&l&&currentTime>=f.start&&currentTime<=l.end+0.1;});
    const chunk=aci>=0?chunks[aci]:(currentTime>0?chunks[chunks.length-1]:[]);
    if(!chunk||!chunk.length)return;
    const fwt=wt[chunk[0].idx];const cp=easeOut(clamp((currentTime-(fwt?.start||0))*6,0,1));
    ctx.save();ctx.globalAlpha=cp;ctx.translate(0,(1-cp)*fsize*0.4);
    ctx.font=FONT;ctx.textBaseline="alphabetic";const spW=ctx.measureText(" ").width*0.8;
    const meas=chunk.map(e=>({...e,ww:ctx.measureText(e.w).width}));
    const tw=meas.reduce((s,e)=>s+e.ww,0)+spW*(meas.length-1);let cx=W/2-tw/2;
    for(const e of meas){
      const ewt=wt[e.idx];const isA=e.idx===activeIdx||(activeIdx===-1&&currentTime>=(ewt?.end||0));
      if(isA){const pp=Math.round(16*sc),pH=fsize*1.44;rrPath(ctx,cx-pp,centerY-fsize*0.86,e.ww+pp*2,pH,PR*sc);ctx.fillStyle=B.colorPositive;ctx.fill();ctx.fillStyle="#fff";}
      else ctx.fillStyle=B.colorText;
      ctx.shadowColor="rgba(0,0,0,0.85)";ctx.shadowBlur=Math.round(12*sc);ctx.fillText(e.w,cx,centerY);cx+=e.ww+spW;
    }ctx.restore();
  }
  else if(captionStyle==="fade"){
    ctx.font=FONT;ctx.textBaseline="alphabetic";
    const lines=buildLines(dispWords);const lh=fsize*CLH;
    let startY=centerY-(lines.length*lh)/2+fsize;const spW=ctx.measureText(" ").width;
    for(const ln of lines){
      const lw=ln.reduce((s,e)=>s+e.ww,0)+spW*(ln.length-1);let cx=W/2-lw/2;
      for(const e of ln){
        const tw=wt[e.idx];if(!tw||currentTime<tw.start){cx+=e.ww+spW;continue;}
        const prog=easeOut(clamp((currentTime-tw.start)/0.18,0,1));
        ctx.save();ctx.globalAlpha=0.3+prog*0.7;ctx.fillStyle=e.idx===activeIdx?B.colorPositive:B.colorText;
        ctx.shadowColor="rgba(0,0,0,0.9)";ctx.shadowBlur=Math.round(16*sc);ctx.textBaseline="alphabetic";ctx.fillText(e.w,cx,startY);ctx.restore();cx+=e.ww+spW;
      }startY+=lh;
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  RECORDING
// ═══════════════════════════════════════════════════════════════
const FPS=30;
const MIME=()=>MediaRecorder.isTypeSupported("video/webm;codecs=vp9")?"video/webm;codecs=vp9":"video/webm";

function recordGraphic(g,brand,ratio){
  return new Promise((res,rej)=>{
    const AR=RATIOS[ratio||"16:9"]||RATIOS["16:9"];
    const cvs=document.createElement("canvas");cvs.width=AR.W;cvs.height=AR.H;
    const frames=Math.round(2*FPS);
    const rec=new MediaRecorder(cvs.captureStream(FPS),{mimeType:MIME(),videoBitsPerSecond:8000000});
    const ch=[];rec.ondataavailable=e=>{if(e.data.size>0)ch.push(e.data);};
    rec.onstop=()=>res(new Blob(ch,{type:"video/webm"}));rec.onerror=rej;
    rec.start();let f=0;
    const tick=()=>{drawGraphic(cvs,g,brand,ratio,clamp(f/(frames*0.35),0,1));f++;if(f<frames)requestAnimationFrame(tick);else rec.stop();};
    requestAnimationFrame(tick);
  });
}

function recordCaption(subtitle,brand,captionStyle,ratio){
  return new Promise((res,rej)=>{
    const AR=RATIOS[ratio||brand.aspectRatio||"9:16"]||RATIOS["9:16"];
    const cvs=document.createElement("canvas");cvs.width=AR.W;cvs.height=AR.H;
    const dur=(subtitle.endSec-subtitle.startSec)+0.15,frames=Math.ceil(dur*FPS);
    const rec=new MediaRecorder(cvs.captureStream(FPS),{mimeType:MIME(),videoBitsPerSecond:6000000});
    const ch=[];rec.ondataavailable=e=>{if(e.data.size>0)ch.push(e.data);};
    rec.onstop=()=>res(new Blob(ch,{type:"video/webm"}));rec.onerror=rej;
    rec.start();let f=0;
    const tick=()=>{drawCaption(cvs,subtitle,brand,captionStyle,f/FPS,ratio);f++;if(f<frames)requestAnimationFrame(tick);else rec.stop();};
    requestAnimationFrame(tick);
  });
}


// ═══════════════════════════════════════════════════════════════
//  COMPOSITE CAPTION RECORDER  — one full-length transparent WebM
// ═══════════════════════════════════════════════════════════════
function recordCompositeCaption(subtitles, brand, captionStyle, ratio, onProgress){
  return new Promise((resolve,reject)=>{
    if(!subtitles.length){ resolve(new Blob([])); return; }
    const AR=RATIOS[ratio||"9:16"]||RATIOS["9:16"];
    const cvs=document.createElement("canvas");cvs.width=AR.W;cvs.height=AR.H;
    const ctx=cvs.getContext("2d",{alpha:true});
    const totalDur=(subtitles[subtitles.length-1]?.endSec||10)+0.3;
    const totalFrames=Math.ceil(totalDur*FPS);
    const mime=MIME();
    const rec=new MediaRecorder(cvs.captureStream(FPS),{mimeType:mime,videoBitsPerSecond:8000000});
    const chunks=[];
    rec.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
    rec.onstop=()=>resolve(new Blob(chunks,{type:"video/webm"}));
    rec.onerror=reject;
    rec.start();
    let frame=0;
    const tick=()=>{
      const t=frame/FPS;
      ctx.clearRect(0,0,AR.W,AR.H);
      // find active subtitle at this timestamp
      const active=subtitles.find(s=>t>=s.startSec&&t<s.endSec);
      if(active) drawCaption(cvs,active,brand,captionStyle,t-active.startSec,ratio);
      if(onProgress) onProgress(frame/totalFrames);
      frame++;
      if(frame<totalFrames) requestAnimationFrame(tick);
      else rec.stop();
    };
    requestAnimationFrame(tick);
  });
}

// ═══════════════════════════════════════════════════════════════
//  CLAUDE PROMPT
// ═══════════════════════════════════════════════════════════════
const GFX_PROMPT=`You are a video graphics producer creating social media explainer graphics. Given a transcript, be GENEROUS — identify 10–16 moments where a graphic would help the viewer understand or stay engaged. It is far better to suggest too many than too few, as the editor can always remove extras but cannot add what was not suggested.

Return ONLY a valid JSON array. No markdown, no preamble.

Each item: {"id":n,"timestamp":"HH:MM:SS","duration":3–6,"type":"fullscreen"|"overlay","template": one of below,"content":{...},"label":"kebab-case-filename"}

Templates and their content fields (keep ALL text SHORT — readable on mobile in 2 seconds):
- myth:          { body:"the misconception (max 10 words)" }
- reality:       { body:"the correction (max 10 words)" }
- title:         { headline:"TITLE (max 4 words)", subheadline:"sub", body:"detail", number:"bg number" }
- rule_number:   { number:"1", body:"rule label (max 7 words)" }
- key_point:     { headline:"LABEL (max 3 words)", body:"the point (max 18 words)" }
- fact_box:      { headline:"LABEL (2–3 words)", body:"detail (max 15 words)" }
- speech_bubble: { text:"a question (max 9 words)" }
- stat:          { stat:"VALUE e.g. 2%", label:"description (max 5 words)" }
- timeline:      { label:"label (max 4 words)", markers:["6 months","12 months"] }

Placement rules — be generous, use every appropriate moment:
- myth at opening myth-bust moments
- reality immediately after each myth
- title for video intro and major section changes
- rule_number whenever a numbered rule is introduced
- key_point for every important legal or factual statement
- fact_box as overlay during talking-head explanations
- speech_bubble for rhetorical or tenant/landlord questions
- stat whenever a number, percentage, or time period is mentioned
- timeline for any contract period or deadline sequence
- Use overlays (fact_box, speech_bubble, stat) generously — they don't interrupt the video`;

// ═══════════════════════════════════════════════════════════════
//  UI ATOMS
// ═══════════════════════════════════════════════════════════════
function Swatch({label,value,onChange}){
  return(
    <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:10}}>
      <div style={{width:36,height:36,borderRadius:8,background:value,border:"2px solid rgba(255,255,255,0.2)",position:"relative",flexShrink:0}}>
        <input type="color" value={value} onChange={e=>onChange(e.target.value)} style={{opacity:0,position:"absolute",inset:0,cursor:"pointer",width:"100%",height:"100%"}}/>
      </div>
      <div><div style={{fontSize:10,fontWeight:700,opacity:0.5,letterSpacing:1}}>{label}</div><div style={{fontSize:12,fontWeight:600,opacity:0.8,fontFamily:"monospace"}}>{value}</div></div>
    </label>
  );
}

function FontPicker({value,onChange}){
  useEffect(()=>{ FONTS.forEach(f=>loadFont(f.name)); },[]);
  return(
    <div>
      <div style={{fontSize:10,fontWeight:700,opacity:0.5,letterSpacing:1,marginBottom:8}}>FONT FAMILY</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {FONTS.map(f=>(
          <button key={f.name} onClick={()=>onChange(f.name)} style={{background:value===f.name?"rgba(42,157,143,0.2)":"rgba(255,255,255,0.05)",border:`1px solid ${value===f.name?"#2A9D8F":"rgba(255,255,255,0.1)"}`,borderRadius:9,padding:"12px 14px",cursor:"pointer",textAlign:"left",transition:"all 0.15s",color:"#fff",fontFamily:`"${f.name}","Arial",sans-serif`}}>
            <div style={{fontSize:20,fontWeight:900,marginBottom:2,fontFamily:`"${f.name}","Arial",sans-serif`}}>Aa</div>
            <div style={{fontSize:11,opacity:0.65,fontFamily:"Montserrat,Arial,sans-serif"}}>{f.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CaptionPreview({subtitle,brand,captionStyle,ratio}){
  const ref=useRef();const rafRef=useRef();const startRef=useRef(Date.now());
  useEffect(()=>{
    startRef.current=Date.now();
    const dur=subtitle.endSec-subtitle.startSec;
    const loop=()=>{const el=((Date.now()-startRef.current)/1000)%(dur+0.5);if(ref.current)drawCaption(ref.current,subtitle,brand,captionStyle,el,ratio);rafRef.current=requestAnimationFrame(loop);};
    rafRef.current=requestAnimationFrame(loop);return()=>cancelAnimationFrame(rafRef.current);
  },[subtitle,brand,captionStyle,ratio]);
  const AR=RATIOS[ratio||"9:16"]||RATIOS["9:16"];const aspect=AR.W/AR.H;const w=280;const h=w/aspect;
  return(
    <div style={{position:"relative",width:w,height:h,margin:"0 auto",flexShrink:0}}>
      <div style={{position:"absolute",inset:0,borderRadius:10,background:"repeating-conic-gradient(#3a3a3a 0% 25%,#2a2a2a 0% 50%) 0 0/18px 18px",border:"1px solid rgba(255,255,255,0.1)"}}/>
      <canvas ref={ref} width={AR.W} height={AR.H} style={{position:"absolute",inset:0,width:"100%",height:"100%",borderRadius:10}}/>
    </div>
  );
}

function GraphicAnimPreview({g,brand,ratio}){
  const ref=useRef();const rafRef=useRef();const st=useRef(Date.now());
  useEffect(()=>{
    st.current=Date.now();
    const loop=()=>{const p=Math.min((Date.now()-st.current)/700,1);if(ref.current)drawGraphic(ref.current,g,brand,ratio||"16:9",p);rafRef.current=requestAnimationFrame(loop);};
    rafRef.current=requestAnimationFrame(loop);return()=>cancelAnimationFrame(rafRef.current);
  },[g,brand,ratio]);
  const AR=RATIOS[ratio||"16:9"]||RATIOS["16:9"];
  return(<canvas ref={ref} width={AR.W} height={AR.H} style={{width:"100%",borderRadius:8,border:"1px solid rgba(255,255,255,0.1)",background:"repeating-conic-gradient(#444 0% 25%,#2a2a2a 0% 50%) 0 0/22px 22px"}}/>);
}

const TMPL={myth:{label:"MYTH",type:"fullscreen"},reality:{label:"REALITY",type:"fullscreen"},title:{label:"Title",type:"fullscreen"},rule_number:{label:"Rule #",type:"fullscreen"},key_point:{label:"Key Point",type:"fullscreen"},fact_box:{label:"Fact Box",type:"overlay"},speech_bubble:{label:"Bubble",type:"overlay"},stat:{label:"Stat",type:"overlay"},timeline:{label:"Timeline",type:"overlay"}};
const CAP_STYLES={karaoke:{label:"Karaoke",icon:"🎤"},popin:{label:"Pop-in",icon:"💥"},tiktok:{label:"TikTok Block",icon:"📱"},fade:{label:"Elegant Fade",icon:"✨"}};


// ── AddGraphicModal — inline form to manually add a graphic ──────
function AddGraphicModal({brand, onAdd, onClose}){
  const [tpl,setTpl]=useState("key_point");
  const [ts,setTs]=useState("00:00:00");
  const [dur,setDur]=useState(4);
  const [headline,setHeadline]=useState("");
  const [body,setBody]=useState("");
  const [text,setText]=useState("");
  const [stat,setStat]=useState("");
  const [label,setLabel]=useState("");
  const [markerStr,setMarkerStr]=useState("6 months,12 months");
  const [num,setNum]=useState("1");

  const meta=TMPL[tpl]||{type:"fullscreen"};
  const isOv=meta.type==="overlay";

  const buildContent=()=>{
    if(tpl==="myth"||tpl==="reality") return{body};
    if(tpl==="title") return{headline,subheadline:body,number:num};
    if(tpl==="rule_number") return{number:num,body};
    if(tpl==="key_point") return{headline,body};
    if(tpl==="fact_box") return{headline,body};
    if(tpl==="speech_bubble") return{text};
    if(tpl==="stat") return{stat,label};
    if(tpl==="timeline") return{label:headline,markers:markerStr.split(",").map(s=>s.trim()).filter(Boolean)};
    return{};
  };

  const handleAdd=()=>{
    const slug=(headline||body||text||stat||"custom").toLowerCase().replace(/[^a-z0-9]+/g,"-").slice(0,30);
    onAdd({
      id:Date.now(),timestamp:ts,duration:dur,
      type:meta.type,template:tpl,
      content:buildContent(),
      label:slug
    });
    onClose();
  };

  const sm={background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.13)",color:"#fff",padding:"7px 13px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600};
  const inp={width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"10px 12px",color:"#fff",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"};
  const lbl={display:"block",fontSize:10,opacity:0.5,fontWeight:700,letterSpacing:1,marginBottom:4};

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}} onClick={onClose}>
      <div style={{background:"#141e2e",border:"1px solid rgba(255,255,255,0.12)",borderRadius:16,padding:"22px 24px",width:"100%",maxWidth:500,maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
          <div style={{fontWeight:900,fontSize:15,flex:1}}>+ Add Graphic</div>
          <button style={{...sm,padding:"5px 10px"}} onClick={onClose}>✕</button>
        </div>

        {/* Template picker */}
        <div style={{marginBottom:14}}>
          <label style={lbl}>TEMPLATE TYPE</label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
            {Object.entries(TMPL).map(([k,v])=>(
              <button key={k} style={{...sm,padding:"7px 6px",fontSize:11,textAlign:"center",
                background:tpl===k?brand.colorAccent:"rgba(255,255,255,0.06)",
                border:`1px solid ${tpl===k?brand.colorAccent:"rgba(255,255,255,0.1)"}`}}
                onClick={()=>setTpl(k)}>
                <div style={{marginBottom:1}}>{v.type==="overlay"?"⬜":"⬛"}</div>
                {v.label}
              </button>
            ))}
          </div>
          <div style={{marginTop:6,fontSize:11,opacity:0.45}}>{isOv?"Overlay — transparent PNG, sits over footage":"Fullscreen — replaces footage momentarily"}</div>
        </div>

        {/* Timing */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div>
            <label style={lbl}>TIMESTAMP</label>
            <input value={ts} onChange={e=>setTs(e.target.value)} placeholder="HH:MM:SS" style={inp}/>
          </div>
          <div>
            <label style={lbl}>DURATION (seconds)</label>
            <input type="number" min={1} max={10} value={dur} onChange={e=>setDur(Number(e.target.value))} style={inp}/>
          </div>
        </div>

        {/* Content fields — contextual */}
        <div style={{display:"grid",gap:10,marginBottom:18}}>
          {["title","key_point","fact_box","timeline"].includes(tpl)&&(
            <div><label style={lbl}>{tpl==="timeline"?"CHART LABEL":"HEADLINE / LABEL"}</label><input value={headline} onChange={e=>setHeadline(e.target.value)} placeholder={tpl==="title"?"e.g. RULE #1":tpl==="timeline"?"e.g. CONTRACT PERIODS":"e.g. KEY POINT"} style={inp}/></div>
          )}
          {["myth","reality","key_point","fact_box","rule_number","title"].includes(tpl)&&(
            <div><label style={lbl}>{tpl==="title"?"SUBTITLE (optional)":"BODY TEXT"}</label><input value={body} onChange={e=>setBody(e.target.value)} placeholder="Keep it short — max 15 words" style={inp}/></div>
          )}
          {tpl==="speech_bubble"&&(
            <div><label style={lbl}>QUESTION TEXT</label><input value={text} onChange={e=>setText(e.target.value)} placeholder="e.g. Can I challenge this?" style={inp}/></div>
          )}
          {tpl==="stat"&&(<>
            <div><label style={lbl}>STAT VALUE</label><input value={stat} onChange={e=>setStat(e.target.value)} placeholder="e.g. 2% or 12 months" style={inp}/></div>
            <div><label style={lbl}>DESCRIPTION</label><input value={label} onChange={e=>setLabel(e.target.value)} placeholder="e.g. max increase" style={inp}/></div>
          </>)}
          {["title","rule_number"].includes(tpl)&&(
            <div><label style={lbl}>NUMBER (large background)</label><input value={num} onChange={e=>setNum(e.target.value)} placeholder="e.g. 1" style={inp}/></div>
          )}
          {tpl==="timeline"&&(
            <div><label style={lbl}>MARKERS (comma-separated)</label><input value={markerStr} onChange={e=>setMarkerStr(e.target.value)} placeholder="6 months, 9 months, 12 months" style={inp}/></div>
          )}
        </div>

        <button style={{width:"100%",background:brand.colorAccent,border:"none",borderRadius:10,padding:"14px",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}} onClick={handleAdd}>
          + Add to Graphics List
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  GRAPHICS TAB
// ═══════════════════════════════════════════════════════════════
function GraphicsTab({project,brand,updateProject,previewRatio}){
  const [gStep,setGStep]=useState(project.graphics.length>0?"review":"idle");
  const [animIdx,setAnimIdx]=useState(null);
  const [exporting,setExporting]=useState(new Set());
  const [progress,setProgress]=useState("");
  const [error,setError]=useState("");
  const [showAdd,setShowAdd]=useState(false);
  const cvs=useRef(document.createElement("canvas"));

  const graphics=project.graphics;
  const selected=new Set(project.selected||[]);
  const previews=project.previews||{};
  const setGraphics=gs=>updateProject({graphics:gs,selected:gs.map((_,i)=>i),previews:{}});
  const setSelected=fn=>{const n=fn(selected);updateProject({selected:[...n]});};
  const setPreviews=fn=>updateProject({previews:typeof fn==="function"?fn(previews):fn});

  const analyse=async()=>{
    setGStep("analysing");setError("");
    try{
      const transcript=project.subtitles.map(s=>`[${s.start}] ${s.text}`).join("\n");
      const res=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2500,system:GFX_PROMPT,messages:[{role:"user",content:`Title:"${project.name}"\n\n${transcript}`}]})});
      const data=await res.json();
      const raw=data.content?.find(b=>b.type==="text")?.text||"";
      setGraphics(JSON.parse(raw.replace(/```json|```/g,"").trim()));setGStep("review");
    }catch(e){setError("Analysis failed: "+e.message+(e.message.includes("fetch")?" — check your API key in Settings":""));setGStep("idle");}
  };

  const doPreview=useCallback((g,i)=>{
    drawGraphic(cvs.current,g,brand,previewRatio,1);
    setPreviews(p=>({...p,[i]:cvs.current.toDataURL("image/png")}));
  },[brand,previewRatio]);

  const previewAll=useCallback(()=>{
    graphics.forEach((g,i)=>{drawGraphic(cvs.current,g,brand,previewRatio,1);setPreviews(p=>({...p,[i]:cvs.current.toDataURL("image/png")}));});
  },[graphics,brand,previewRatio]);

  const exportWebM=async(g,i)=>{
    setExporting(s=>{const n=new Set(s);n.add(i);return n;});
    try{const blob=await recordGraphic(g,brand,previewRatio);const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${String(i+1).padStart(2,"0")}_${g.label||g.template}_animated.webm`;a.click();}
    catch(e){alert("Export failed: "+e.message);}
    setExporting(s=>{const n=new Set(s);n.delete(i);return n;});
  };

  const exportSelectedBatch=async()=>{
    const sel=[...selected].sort((a,b)=>a-b);
    if(!sel.length){alert("Select graphics to export first.");return;}
    for(const i of sel){
      const g=graphics[i]; if(!g) continue;
      drawGraphic(cvs.current,g,brand,previewRatio,1);
      const dataUrl=cvs.current.toDataURL("image/png");
      const a=document.createElement("a");a.href=dataUrl;
      a.download=`${String(i+1).padStart(2,"0")}_${g.label||g.template}_still.png`;a.click();
    }
    for(const i of sel){
      const g=graphics[i]; if(!g) continue;
      setExporting(s=>{const n=new Set(s);n.add(i);return n;});
      try{
        const blob=await recordGraphic(g,brand,previewRatio);
        const a=document.createElement("a");a.href=URL.createObjectURL(blob);
        a.download=`${String(i+1).padStart(2,"0")}_${g.label||g.template}_animated.webm`;a.click();
      }catch{}
      setExporting(s=>{const n=new Set(s);n.delete(i);return n;});
    }
  };

  const toggleGraphicType=(i)=>{
    const ng=[...graphics];
    const g=ng[i]; if(!g) return;
    const defaultType=(TMPL[g.template]||{}).type||"fullscreen";
    const currentType=g.typeOverride||defaultType;
    ng[i]={...g,typeOverride:currentType==="overlay"?"fullscreen":"overlay"};
    setGraphics(ng);
  };

  const sm={background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.13)",color:"#fff",padding:"7px 12px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600};
  const tplBg=t=>t==="myth"?brand.colorAccent:t==="reality"?brand.colorPositive:brand.colorPrimary;

  if(gStep==="idle"||gStep==="analysing")return(
    <div style={{textAlign:"center",padding:"60px 0"}}>
      {gStep==="analysing"?<>
        <AnimatedRobot/>
        <div style={{fontSize:20,fontWeight:900,marginBottom:4,letterSpacing:0.5}}>Analysing transcript…</div>
        <ThinkingDots/>
        <div style={{opacity:0.4,fontSize:13,marginTop:10}}>Reading every line, finding the right moments</div>
      </>
      :<><div style={{fontSize:46,marginBottom:14}}>🎨</div><div style={{fontSize:20,fontWeight:900,marginBottom:6}}>Ready to generate graphics</div>
        {error&&<div style={{color:brand.colorAccent,fontSize:13,fontWeight:600,marginBottom:12}}>{error}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button style={{background:brand.colorAccent,border:"none",borderRadius:11,padding:"14px 36px",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}} onClick={analyse}>🔍 Analyse Script</button>
          <button style={{background:"rgba(42,157,143,0.2)",border:"1px solid rgba(42,157,143,0.5)",borderRadius:11,padding:"14px 24px",color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}} onClick={()=>{setGStep("review");setShowAdd(true);}}>+ Add Manually</button>
        </div>
        {showAdd&&<AddGraphicModal brand={brand} onAdd={g=>{setGraphics([g]);setSelected(new Set([0]));setGStep("review");}} onClose={()=>setShowAdd(false)}/>}
        </>}
    </div>
  );

  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:13,fontWeight:700,opacity:0.6}}>{graphics.length} suggested</span>
        <button style={sm} onClick={()=>setSelected(()=>new Set(graphics.map((_,i)=>i)))}>All</button>
        <button style={sm} onClick={()=>setSelected(()=>new Set())}>None</button>
        <button style={{...sm,marginLeft:"auto"}} onClick={previewAll}>👁 Preview All</button>
        <button style={{...sm,background:"rgba(42,157,143,0.18)",border:"1px solid rgba(42,157,143,0.5)"}} onClick={exportSelectedBatch}>⬇ Export Selected</button>
        <button style={{...sm,background:"rgba(29,53,87,0.6)",border:"1px solid rgba(255,255,255,0.2)"}} onClick={()=>{
          const ng=graphics.map(g=>({...g,typeOverride:"fullscreen"}));setGraphics(ng);
        }}>⬛ All Full</button>
        <button style={{...sm,background:"rgba(42,157,143,0.25)",border:"1px solid rgba(42,157,143,0.4)"}} onClick={()=>{
          const ng=graphics.map(g=>({...g,typeOverride:"overlay"}));setGraphics(ng);
        }}>⬜ All Overlay</button>
        <button style={{...sm,background:"rgba(42,157,143,0.18)",border:"1px solid rgba(42,157,143,0.5)"}} onClick={()=>setShowAdd(true)}>+ Add</button>
        <button style={{...sm,background:"rgba(230,57,70,0.15)",border:"1px solid rgba(230,57,70,0.3)"}} onClick={()=>{setGraphics([]);setGStep("idle");}}>↺ Re-analyse</button>
      </div>
      {showAdd&&<AddGraphicModal brand={brand} onAdd={g=>{const ng=[...graphics,g];setGraphics(ng);setSelected(s=>{const n=new Set(s);n.add(ng.length-1);return n;});}} onClose={()=>setShowAdd(false)}/>}
      {graphics.map((g,i)=>{
        const meta=TMPL[g.template]||{label:g.template,type:"?"};const sel=selected.has(i);const effectiveType=g.typeOverride||meta.type||"fullscreen";const isOv=effectiveType==="overlay";const isExp=exporting.has(i);const showAnim=animIdx===i;
        return(
          <div key={i} style={{marginBottom:8}}>
            <div style={{background:sel?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.025)",border:`1px solid ${sel?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.06)"}`,borderRadius:12,padding:"11px 13px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"all 0.15s"}} onClick={()=>setSelected(s=>{const n=new Set(s);n.has(i)?n.delete(i):n.add(i);return n;})}>
              <div style={{width:19,height:19,borderRadius:5,border:`2px solid ${sel?brand.colorPositive:"rgba(255,255,255,0.18)"}`,background:sel?brand.colorPositive:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0,fontWeight:700}}>{sel&&"✓"}</div>
              <div style={{width:5,height:38,borderRadius:3,background:isOv?brand.colorPositive:tplBg(g.template),flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:12}}>{meta.label}</span>
                  <span style={{fontSize:10,background:isOv?"rgba(42,157,143,0.22)":"rgba(29,53,87,0.85)",padding:"1px 6px",borderRadius:4,fontWeight:700,cursor:"pointer"}} onClick={e=>{e.stopPropagation();toggleGraphicType(i);}} title="Click to toggle">{isOv?"OVERLAY":"FULLSCREEN"}</span>
                </div>
                <div style={{opacity:0.45,fontSize:11}}>⏱ {g.timestamp} · {g.duration}s</div>
              </div>
              <div style={{display:"flex",gap:5,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                <button style={sm} onClick={()=>doPreview(g,i)}>{previews[i]?"🔄":"👁"}</button>
                <button style={{...sm,background:showAnim?"rgba(42,157,143,0.3)":undefined}} onClick={()=>setAnimIdx(showAnim?null:i)}>{showAnim?"⏹":"▶"}</button>
                <button style={{...sm,opacity:isExp?0.6:1}} onClick={()=>!isExp&&exportWebM(g,i)}>{isExp?"⏳":"🎞"}</button>
              </div>
            </div>
            {previews[i]&&!showAnim&&<img src={previews[i]} alt="" style={{width:"100%",borderRadius:"0 0 8px 8px",border:"1px solid rgba(255,255,255,0.08)",borderTop:"none",background:"repeating-conic-gradient(#444 0% 25%,#2a2a2a 0% 50%) 0 0/22px 22px"}}/>}
            {showAnim&&<GraphicAnimPreview g={g} brand={brand} ratio={previewRatio}/>}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CAPTIONS TAB
// ═══════════════════════════════════════════════════════════════
function CaptionsTab({project,brand,updateProject,previewRatio}){
  const captionStyle=project.captionStyle||"tiktok";
  const [prevIdx,setPrevIdx]=useState(0);
  const subtitles=project.subtitles;
  const activeSub=subtitles[prevIdx]||subtitles[0];
  const sm={background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.13)",color:"#fff",padding:"6px 11px",borderRadius:7,cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:600};
  return(
    <div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:10,fontWeight:700,opacity:0.5,letterSpacing:1,marginBottom:8}}>CAPTION STYLE</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {Object.entries(CAP_STYLES).map(([k,cs])=>(
            <button key={k} style={{flex:1,minWidth:110,background:captionStyle===k?"rgba(230,57,70,0.15)":"rgba(255,255,255,0.04)",border:`1px solid ${captionStyle===k?brand.colorAccent:"rgba(255,255,255,0.1)"}`,borderRadius:10,padding:"11px 8px",cursor:"pointer",textAlign:"center",color:"#fff",fontFamily:"inherit",transition:"all 0.15s"}} onClick={()=>updateProject({captionStyle:k})}>
              <div style={{fontSize:18,marginBottom:4}}>{cs.icon}</div>
              <div style={{fontWeight:800,fontSize:11}}>{cs.label}</div>
            </button>
          ))}
        </div>
      </div>
      {activeSub&&(
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px",marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:700,opacity:0.5,letterSpacing:1,marginBottom:10}}>LIVE PREVIEW</div>
          <CaptionPreview subtitle={activeSub} brand={brand} captionStyle={captionStyle} ratio={previewRatio}/>
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:10,flexWrap:"wrap"}}>
            <span style={{fontSize:10,opacity:0.4}}>Line:</span>
            {subtitles.slice(0,8).map((s,i)=>(
              <button key={i} style={{...sm,background:prevIdx===i?brand.colorAccent:"rgba(255,255,255,0.07)",border:`1px solid ${prevIdx===i?brand.colorAccent:"rgba(255,255,255,0.12)"}`}} onClick={()=>setPrevIdx(i)}>#{s.index}</button>
            ))}
          </div>
          <div style={{marginTop:8,fontSize:11,opacity:0.5,fontStyle:"italic"}}>"{activeSub.text}"</div>
        </div>
      )}
      <div style={{background:"rgba(42,157,143,0.08)",border:"1px solid rgba(42,157,143,0.22)",borderRadius:9,padding:"11px 14px",fontSize:12,lineHeight:1.6}}>
        <strong>Export captions from the Export tab →</strong> Choose your ratios there and get PNGs, WebMs, and a Premiere XML sequence all in one go.
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  EXPORT TAB
// ═══════════════════════════════════════════════════════════════
function ExportTab({project,brand,updateProject}){
  const [ratios,setRatios]=useState({"16:9":true,"1:1":false,"9:16":false});
  const [previewRatio,setPreviewRatio]=useState("16:9");
  const [mode,setMode]=useState("idle"); // idle | confirming | running | done
  const [phase,setPhase]=useState("");
  const [prog,setProg]=useState({done:0,total:0,pct:0});
  const [captionMode,setCaptionMode]=useState("composite"); // composite | individual
  const cvs=useRef(document.createElement("canvas"));

  const selectedRatios=Object.entries(ratios).filter(([,v])=>v).map(([k])=>k);
  const graphics=project.graphics;
  const selectedGfx=(project.selected||[]).map(i=>graphics[i]).filter(Boolean);
  const subtitles=project.subtitles;
  const captionStyle=project.captionStyle||"tiktok";

  const dl=(blob,name)=>{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();};
  const dlText=(text,name)=>dl(new Blob([text],{type:"text/plain"}),name);

  const runExport=async()=>{
    setMode("running");
    try{
    const pn=project.name.replace(/\s+/g,"_");
    // total steps: gfx PNGs + captions (1 composite or N individual) per ratio
    const capSteps = captionMode==="composite" ? 1 : subtitles.length;
    let totalSteps=Math.max(1,(selectedGfx.length+capSteps)*selectedRatios.length);
    setProg({done:0,total:totalSteps,pct:0});
    let done=0;
    const tick=(d,pct)=>{done=d;setProg({done,total:totalSteps,pct:pct??done/totalSteps});};

    for(const ratio of selectedRatios){
      const prefix=`${ratio.replace(":","x")}_`;
      // Graphics PNGs
      setPhase(`${ratio} — exporting graphic PNGs…`);
      for(let i=0;i<selectedGfx.length;i++){
        drawGraphic(cvs.current,selectedGfx[i],brand,ratio,1);
        await new Promise(res=>{
          cvs.current.toBlob(blob=>{
            if(blob) dl(blob,`${prefix}${String(i+1).padStart(2,"0")}_${selectedGfx[i].label||selectedGfx[i].template}.png`);
            res();
          },"image/png");
        });
        tick(done+1);
        await new Promise(r=>setTimeout(r,300));
      }
      // Captions
      if(captionMode==="composite"){
        setPhase(`${ratio} — rendering composite caption video…`);
        const blob=await recordCompositeCaption(subtitles,brand,captionStyle,ratio,pct=>{
          setProg(p=>({...p,pct:(done/totalSteps)+(pct/totalSteps)}));
        });
        dl(blob,`${prefix}${pn}_captions_composite.webm`);
        tick(done+1);
        // Also export Premiere XML so editor knows clip is one file starting at 00:00
        const xml=generatePremiereXML(subtitles,ratio,prefix);
        dlText(xml,`${prefix}${pn}_captions_sequence.xml`);
      } else {
        setPhase(`${ratio} — rendering individual caption WebMs…`);
        for(let i=0;i<subtitles.length;i++){
          const blob=await recordCaption(subtitles[i],brand,captionStyle,ratio);
          dl(blob,`${prefix}caption_${String(subtitles[i].index).padStart(3,"0")}.webm`);
          tick(done+1);
          await new Promise(r=>setTimeout(r,150));
        }
        const xml=generatePremiereXML(subtitles,ratio,prefix);
        dlText(xml,`${prefix}${pn}_captions_sequence.xml`);
      }
      // Graphics cue sheet
      const gfxCues=["Filename\tTimestamp\tDuration(s)\tType\tTemplate",
        ...selectedGfx.map((g,i)=>`${prefix}${String(i+1).padStart(2,"0")}_${g.label||g.template}.png\t${g.timestamp}\t${g.duration}\t${g.type}\t${g.template}`)
      ].join("\n");
      dlText(gfxCues,`${prefix}${pn}_graphics_cues.txt`);
    }
    setMode("done");setPhase("");
    }catch(err){setPhase("Export error: "+err.message);console.error(err);}
  };

  const sm={background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.13)",color:"#fff",padding:"8px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600};
  const ratioBtn=(k,active)=>({flex:1,background:active?"rgba(42,157,143,0.18)":"rgba(255,255,255,0.04)",border:`1px solid ${active?"#2A9D8F":"rgba(255,255,255,0.1)"}`,borderRadius:10,padding:"14px 8px",cursor:"pointer",textAlign:"center",color:"#fff",fontFamily:"inherit",transition:"all 0.15s"});

  if(mode==="done")return(
    <div style={{textAlign:"center",padding:"40px 0"}}>
      <div style={{fontSize:52,marginBottom:14}}>🎬</div>
      <div style={{fontSize:22,fontWeight:900,marginBottom:8}}>Export complete!</div>
      <div style={{opacity:0.55,fontSize:13,maxWidth:460,margin:"0 auto 24px",lineHeight:1.6}}>
        For each ratio: graphic PNGs, {captionMode==="composite"?"a composite caption WebM (drop on V4 — done!)":"individual caption WebMs + Premiere XML"}, and a graphics cue sheet.
      </div>
      <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"18px 22px",textAlign:"left",marginBottom:22,maxWidth:520,margin:"0 auto 22px"}}>
        <div style={{fontWeight:800,fontSize:12,marginBottom:12}}>📋 PREMIERE WORKFLOW</div>
        {["Create a sequence per ratio (e.g. 1920×1080 for 16:9)","Import the XML for that ratio — it places all caption clips automatically","Import graphic PNGs and use the cue sheet for timecodes","Fullscreen graphics → V2   Overlays → V3   Captions → V4","Transparency is preserved in all WebMs — no matte needed"].map((t,i)=>(
          <div key={i} style={{display:"flex",gap:10,marginBottom:8,fontSize:13,opacity:0.82}}><span style={{color:"#2A9D8F",fontWeight:800,flexShrink:0}}>{i+1}.</span>{t}</div>
        ))}
      </div>
      <button style={{...sm,padding:"12px 28px"}} onClick={()=>setMode("idle")}>← Export Again</button>
    </div>
  );

  if(mode==="running")return(
    <div style={{textAlign:"center",padding:"50px 0"}}>
      <div style={{fontSize:46,marginBottom:14}}>🎞</div>
      <div style={{fontSize:20,fontWeight:900,marginBottom:8}}>Exporting…</div>
      <div style={{opacity:0.6,fontSize:13,marginBottom:16}}>{phase}</div>
      <div style={{width:380,height:6,background:"rgba(255,255,255,0.1)",borderRadius:3,margin:"0 auto 8px",overflow:"hidden"}}>
        <div style={{width:`${Math.round((prog.pct||0)*100)}%`,height:"100%",background:brand.colorAccent,borderRadius:3,transition:"width 0.3s"}}/>
      </div>
      <div style={{fontSize:11,opacity:0.4}}>{prog.done} / {prog.total} files</div>
    </div>
  );

  return(
    <div>
      {/* Caption export mode */}
      {subtitles.length>0&&(
        <div style={{marginBottom:18}}>
          <div style={{fontSize:10,fontWeight:700,opacity:0.5,letterSpacing:1,marginBottom:8}}>CAPTION EXPORT MODE</div>
          <div style={{display:"flex",gap:8}}>
            <button style={{flex:1,background:captionMode==="composite"?"rgba(42,157,143,0.2)":"rgba(255,255,255,0.05)",border:`1px solid ${captionMode==="composite"?"#2A9D8F":"rgba(255,255,255,0.1)"}`,borderRadius:10,padding:"12px",cursor:"pointer",color:"#fff",fontFamily:"inherit",transition:"all 0.15s",textAlign:"center"}} onClick={()=>setCaptionMode("composite")}>
              <div style={{fontWeight:800,fontSize:13,marginBottom:3}}>⬛ Composite WebM</div>
              <div style={{fontSize:11,opacity:0.55,lineHeight:1.4}}>One transparent video the full length of your edit. Drop on V4, done.</div>
            </button>
            <button style={{flex:1,background:captionMode==="individual"?"rgba(42,157,143,0.2)":"rgba(255,255,255,0.05)",border:`1px solid ${captionMode==="individual"?"#2A9D8F":"rgba(255,255,255,0.1)"}`,borderRadius:10,padding:"12px",cursor:"pointer",color:"#fff",fontFamily:"inherit",transition:"all 0.15s",textAlign:"center"}} onClick={()=>setCaptionMode("individual")}>
              <div style={{fontWeight:800,fontSize:13,marginBottom:3}}>📄 Individual WebMs</div>
              <div style={{fontSize:11,opacity:0.55,lineHeight:1.4}}>{subtitles.length} separate files. Use the XML to auto-place in Premiere.</div>
            </button>
          </div>
        </div>
      )}

      {/* Ratio selector */}
      <div style={{marginBottom:18}}>
        <div style={{fontSize:10,fontWeight:700,opacity:0.5,letterSpacing:1,marginBottom:8}}>EXPORT RATIOS — tick all you need</div>
        <div style={{display:"flex",gap:8}}>
          {Object.entries(RATIOS).map(([k,v])=>(
            <button key={k} style={ratioBtn(k,ratios[k])} onClick={()=>setRatios(r=>({...r,[k]:!r[k]}))}>
              <div style={{fontSize:18,marginBottom:4}}>{ratios[k]?"☑":"☐"}</div>
              <div style={{fontWeight:800,fontSize:14,marginBottom:2}}>{k}</div>
              <div style={{fontSize:10,opacity:0.55}}>{v.hint}</div>
              <div style={{fontSize:10,opacity:0.35,marginTop:2}}>{v.W}×{v.H}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Preview ratio switcher */}
      <div style={{marginBottom:18}}>
        <div style={{fontSize:10,fontWeight:700,opacity:0.5,letterSpacing:1,marginBottom:8}}>PREVIEW RATIO</div>
        <div style={{display:"flex",gap:6}}>
          {Object.keys(RATIOS).map(k=>(
            <button key={k} style={{...sm,background:previewRatio===k?"rgba(42,157,143,0.2)":"rgba(255,255,255,0.07)",border:`1px solid ${previewRatio===k?"#2A9D8F":"rgba(255,255,255,0.13)"}`}} onClick={()=>setPreviewRatio(k)}>{k}</button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px 18px",marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:700,opacity:0.5,letterSpacing:1,marginBottom:10}}>WHAT WILL BE EXPORTED</div>
        {selectedRatios.length===0
          ?<div style={{opacity:0.4,fontSize:13}}>Select at least one ratio above.</div>
          :selectedRatios.map(r=>(
            <div key={r} style={{marginBottom:8}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:3,color:"#2A9D8F"}}>{r} — {RATIOS[r].W}×{RATIOS[r].H}</div>
              <div style={{fontSize:12,opacity:0.6,display:"flex",gap:16,flexWrap:"wrap"}}>
                <span>{selectedGfx.length} graphic PNG{selectedGfx.length!==1?"s":""}</span>
                <span>{captionMode==="composite"?"1 composite caption WebM":`${subtitles.length} caption WebM${subtitles.length!==1?"s":""}`}</span>
                <span>1 Premiere XML sequence</span>
                <span>1 graphics cue sheet</span>
              </div>
            </div>
          ))
        }
      </div>

      {mode==="confirming"
        ?(
          <div style={{background:"rgba(230,57,70,0.1)",border:"1px solid rgba(230,57,70,0.3)",borderRadius:11,padding:"14px 18px",marginBottom:8}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:8}}>Ready? Your browser will download multiple files.</div>
            <div style={{fontSize:12,opacity:0.6,marginBottom:12}}>Make sure pop-up blocking is off for this page.</div>
            <div style={{display:"flex",gap:8}}>
              <button style={{...sm,background:brand.colorAccent,border:`1px solid ${brand.colorAccent}`,padding:"10px 22px",fontSize:13}} onClick={runExport}>🚀 Start Export</button>
              <button style={sm} onClick={()=>setMode("idle")}>Cancel</button>
            </div>
          </div>
        ):(
          <button disabled={selectedRatios.length===0||(!selectedGfx.length&&!subtitles.length)}
            style={{width:"100%",background:selectedRatios.length>0?"#E63946":"rgba(255,255,255,0.07)",border:"none",borderRadius:12,padding:"15px",color:"#fff",fontSize:16,fontWeight:700,cursor:selectedRatios.length>0?"pointer":"not-allowed",fontFamily:"inherit",opacity:selectedRatios.length>0?1:0.4}}
            onClick={()=>setMode("confirming")}>
            ⬇ Export {selectedRatios.length} Ratio{selectedRatios.length!==1?"s":" — "}{selectedRatios.join(" · ")}
          </button>
        )
      }
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TITLE CARD PANEL  — per-project override of brand title card
// ═══════════════════════════════════════════════════════════════
function TitleCardPanel({project, brand, updateProject}){
  const [open, setOpen] = useState(false);
  const [previewRatio, setPreviewRatio] = useState("16:9");
  const cvs = useRef(document.createElement("canvas"));
  const override = project.titleCardOverride;
  const isOverriding = override !== null;

  // Merged brand: brand defaults + project overrides
  const effectiveBrand = isOverriding ? {...brand, ...override} : brand;

  const setField = k => v => updateProject({titleCardOverride: {...(override||{}), [k]:v}});
  const enableOverride = () => updateProject({titleCardOverride:{
    titleCardTitle: brand.titleCardTitle||"",
    titleCardSeriesName: brand.titleCardSeriesName||"",
    titleCardSubtitle: brand.titleCardSubtitle||"",
    titleCardStyle: brand.titleCardStyle||"bar",
  }});
  const disableOverride = () => updateProject({titleCardOverride:null});

  const exportAll = () => {
    Object.keys(RATIOS).forEach(ratio=>{
      drawTitleCard(cvs.current, effectiveBrand, ratio, 1);
      cvs.current.toBlob(blob=>{
        if(!blob)return;
        const a=document.createElement("a");a.href=URL.createObjectURL(blob);
        a.download=`title_card_${project.name.replace(/\s+/g,"_")}_${ratio.replace(":","x")}.png`;a.click();
      },"image/png");
    });
  };

  const S={
    sm:{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.13)",color:"#fff",padding:"6px 12px",borderRadius:7,cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:600},
    inp:{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:9,padding:"10px 13px",color:"#fff",fontSize:13,fontFamily:"inherit",boxSizing:"border-box",outline:"none"},
    lbl:{display:"block",fontSize:10,opacity:0.5,fontWeight:700,letterSpacing:1,marginBottom:4},
  };

  return(
    <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,marginBottom:16,overflow:"hidden"}}>
      {/* Header row */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 16px",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <span style={{fontSize:14}}>🎬</span>
        <span style={{fontWeight:700,fontSize:13,flex:1}}>Title Card</span>
        {isOverriding
          ?<span style={{fontSize:10,fontWeight:700,color:brand.colorAccent,background:"rgba(230,57,70,0.15)",border:"1px solid rgba(230,57,70,0.3)",borderRadius:4,padding:"2px 7px"}}>EPISODE OVERRIDE</span>
          :<span style={{fontSize:10,opacity:0.4,fontWeight:600}}>Using brand defaults</span>
        }
        <span style={{opacity:0.4,fontSize:12}}>{open?"▲":"▼"}</span>
      </div>

      {open&&(
        <div style={{padding:"0 16px 16px"}}>
          {/* Override toggle */}
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            <button style={{...S.sm,background:isOverriding?"rgba(230,57,70,0.2)":"rgba(42,157,143,0.18)",border:`1px solid ${isOverriding?brand.colorAccent:"#2A9D8F"}`}}
              onClick={isOverriding?disableOverride:enableOverride}>
              {isOverriding?"↺ Reset to brand defaults":"✏ Override for this episode"}
            </button>
            {isOverriding&&(
              <div style={{display:"flex",gap:5}}>
                {Object.keys(RATIOS).map(k=>(
                  <button key={k} style={{...S.sm,background:previewRatio===k?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.06)",fontSize:10,padding:"5px 9px"}} onClick={()=>setPreviewRatio(k)}>{k}</button>
                ))}
              </div>
            )}
            <button style={{...S.sm,marginLeft:"auto",background:"rgba(42,157,143,0.15)",border:"1px solid rgba(42,157,143,0.4)"}} onClick={exportAll}>⬇ Export PNGs</button>
          </div>

          {/* Live preview */}
          <StaticCanvasPreview
            drawFn={drawTitleCard} brand={effectiveBrand} ratio={previewRatio} width={360}
            deps={[effectiveBrand.titleCardTitle,effectiveBrand.titleCardSeriesName,effectiveBrand.titleCardSubtitle,effectiveBrand.titleCardStyle,effectiveBrand.colorPrimary,effectiveBrand.colorAccent,effectiveBrand.fontFamily,effectiveBrand.logoDataUrl,previewRatio]}
          />

          {/* Override fields — only shown when overriding */}
          {isOverriding&&(
            <div style={{marginTop:14,display:"grid",gap:10}}>
              <div style={{display:"flex",gap:8,marginBottom:4}}>
                {[["bar","▌ Bar"],["centred","◎ Centred"],["split","▬ Split"]].map(([k,l])=>(
                  <button key={k} style={{...S.sm,fontSize:11,background:(override.titleCardStyle||"bar")===k?brand.colorPositive:"rgba(255,255,255,0.07)",border:`1px solid ${(override.titleCardStyle||"bar")===k?brand.colorPositive:"rgba(255,255,255,0.12)"}`}} onClick={()=>setField("titleCardStyle")(k)}>{l}</button>
                ))}
              </div>
              <div>
                <label style={S.lbl}>SERIES NAME</label>
                <input value={override.titleCardSeriesName||""} onChange={e=>setField("titleCardSeriesName")(e.target.value)} placeholder={brand.titleCardSeriesName||"e.g. Wales Housing Law"} style={S.inp}/>
              </div>
              <div>
                <label style={S.lbl}>EPISODE TITLE</label>
                <input value={override.titleCardTitle||""} onChange={e=>setField("titleCardTitle")(e.target.value)} placeholder={brand.titleCardTitle||"e.g. Rent Increase Rules"} style={S.inp}/>
              </div>
              <div>
                <label style={S.lbl}>SUBTITLE / EPISODE NUMBER</label>
                <input value={override.titleCardSubtitle||""} onChange={e=>setField("titleCardSubtitle")(e.target.value)} placeholder={brand.titleCardSubtitle||"e.g. Episode 1"} style={S.inp}/>
              </div>
            </div>
          )}
          {!isOverriding&&(
            <div style={{marginTop:10,fontSize:12,opacity:0.4,fontStyle:"italic"}}>
              Showing brand defaults. Click "Override for this episode" to customise for {project.name}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PROJECT VIEW
// ═══════════════════════════════════════════════════════════════
function ProjectView({project,brand,updateProject,onBack}){
  const [tab,setTab]=useState("graphics");
  const [previewRatio,setPreviewRatio]=useState("16:9");
  const fileRef=useRef();
  const {hasKey,refresh}=useApiKey();

  const handleSRT=f=>{
    const r=new FileReader();
    r.onload=e=>{ const subs=parseSRT(e.target.result); updateProject({srt:e.target.result,subtitles:subs,graphics:[],selected:[],previews:{}}); };
    r.readAsText(f);
  };

  const hasSRT=project.subtitles.length>0;
  const S={
    app:{fontFamily:`"${brand.fontFamily}","Arial",sans-serif`,background:"#0b1320",minHeight:"100vh",color:"#fff"},
    topbar:{background:brand.colorPrimary,padding:"10px 22px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid rgba(0,0,0,0.3)"},
    tabbar:{background:brand.colorPrimary+"ee",borderBottom:"1px solid rgba(0,0,0,0.25)",display:"flex",padding:"0 22px",gap:2},
    tab:a=>({padding:"14px 20px",cursor:"pointer",fontWeight:a?800:600,fontSize:13,color:a?"#fff":"rgba(255,255,255,0.42)",background:"none",border:"none",borderBottom:a?`3px solid ${brand.colorAccent}`:"3px solid transparent",fontFamily:"inherit",marginTop:1,transition:"color 0.15s"}),
    sm:{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",padding:"6px 12px",borderRadius:7,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600},
    wrap:{maxWidth:860,margin:"0 auto",padding:"24px 18px"},
  };

  return(
    <div style={S.app}>
      {/* Top bar */}
      <div style={S.topbar}>
        <button style={{...S.sm,background:"transparent",border:"none",opacity:0.5}} onClick={onBack}>← Back</button>
        <div style={{width:1,height:26,background:"rgba(255,255,255,0.15)",margin:"0 8px"}}/>
        <div style={{fontWeight:900,fontSize:15,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{project.name}</div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
          {/* Preview ratio toggle */}
          <div style={{display:"flex",gap:4}}>
            {Object.keys(RATIOS).map(k=>(
              <button key={k} style={{...S.sm,background:previewRatio===k?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.08)",fontSize:11,padding:"5px 9px"}} onClick={()=>setPreviewRatio(k)}>{k}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={S.tabbar}>
        {[["graphics","🎨 Graphics"],["captions","💬 Captions"],["export","📦 Export"]].map(([k,l])=>(
          <button key={k} style={S.tab(tab===k)} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      <div style={S.wrap}>
        {/* API key banner */}
        {!hasKey&&<ApiKeyBanner onSaved={refresh}/>}
        {/* SRT bar */}
        <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"11px 16px",marginBottom:18,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <span style={{fontSize:10,fontWeight:700,opacity:0.45,letterSpacing:1,flexShrink:0}}>SRT</span>
          {hasSRT
            ?<><span style={{background:"rgba(42,157,143,0.2)",border:"1px solid rgba(42,157,143,0.4)",borderRadius:5,padding:"3px 9px",fontSize:11,fontWeight:700,color:"#2A9D8F",flexShrink:0}}>✓ {project.subtitles.length} lines</span>
              <span style={{fontSize:12,opacity:0.4,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>"{project.subtitles[0]?.text}"…</span></>
            :<span style={{fontSize:12,opacity:0.4,flex:1}}>No SRT — upload one to unlock both tabs</span>
          }
          <button style={{...S.sm,flexShrink:0}} onClick={()=>fileRef.current.click()}>{hasSRT?"↺ Replace":"⬆ Upload SRT"}</button>
          <input ref={fileRef} type="file" accept=".srt,.txt" style={{display:"none"}} onChange={e=>e.target.files[0]&&handleSRT(e.target.files[0])}/>
        </div>

        {/* Title card panel — always visible */}
        <TitleCardPanel project={project} brand={brand} updateProject={updateProject}/>

        {/* Tab content */}
        {!hasSRT
          ?<div style={{textAlign:"center",padding:"60px 0",opacity:0.35}}><div style={{fontSize:42,marginBottom:12}}>📄</div><div style={{fontSize:15,fontWeight:700}}>Upload an SRT to get started</div></div>
          :tab==="graphics"?<GraphicsTab project={project} brand={brand} updateProject={updateProject} previewRatio={previewRatio}/>
          :tab==="captions"?<CaptionsTab project={project} brand={brand} updateProject={updateProject} previewRatio={previewRatio}/>
          :<ExportTab project={project} brand={brand} updateProject={updateProject}/>
        }
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  TITLE CARD RENDERER
// ═══════════════════════════════════════════════════════════════
function drawTitleCard(canvas, brand, ratio, progress=1){
  const AR=RATIOS[ratio||"16:9"]||RATIOS["16:9"];
  const W=AR.W,H=AR.H;
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext("2d",{alpha:true});
  ctx.clearRect(0,0,W,H);
  const B={...DEFAULT_BRAND,...brand};
  const FF=B.fontFamily||"Montserrat";
  const sc=Math.min(W,H)/1080;
  const p=clamp(progress,0,1);
  const ENT=easeOut(clamp(p*1.8,0,1));
  const TXT=easeOut(clamp((p-0.1)*2,0,1));
  const PAD=Math.round(90*sc);

  const style=B.titleCardStyle||"bar";

  // Background
  ctx.fillStyle=B.colorPrimary; ctx.fillRect(0,0,W,H);

  // Subtle noise texture
  ctx.save(); ctx.globalAlpha=0.04;
  for(let i=0;i<W;i+=3){ for(let j=0;j<H;j+=3){ if(Math.random()>0.5){ctx.fillStyle="#fff";ctx.fillRect(i,j,2,2);} } }
  ctx.restore();

  if(style==="bar"){
    // Thick accent bar on left — grows down
    const barH=H*ENT;
    ctx.fillStyle=B.colorAccent; ctx.fillRect(0,(H-barH)/2,Math.round(14*sc),barH);
    // Series name — small, top
    ctx.save(); ctx.globalAlpha=TXT*0.55;
    ctx.font=`600 ${Math.round(36*sc)}px "${FF}",Arial,sans-serif`;
    ctx.fillStyle="#fff"; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
    ctx.fillText((B.titleCardSeriesName||"").toUpperCase(), PAD+Math.round(28*sc), H*0.38);
    ctx.restore();
    // Title — big
    ctx.save(); ctx.globalAlpha=TXT; ctx.translate((1-TXT)*-50*sc,0);
    drawText(ctx,B.titleCardTitle||"EPISODE TITLE",PAD+Math.round(28*sc),H*0.44,W-PAD*2,H*0.22,Math.round(110*sc),"900","left","#fff",2,FF);
    ctx.restore();
    // Subtitle
    if(B.titleCardSubtitle){
      ctx.save(); ctx.globalAlpha=TXT*0.6; ctx.translate((1-TXT)*-30*sc,0);
      drawText(ctx,B.titleCardSubtitle,PAD+Math.round(28*sc),H*0.68,W-PAD*2,H*0.12,Math.round(44*sc),"500","left","rgba(255,255,255,0.8)",1,FF);
      ctx.restore();
    }
    // Divider line grows right
    ctx.strokeStyle=B.colorAccent; ctx.lineWidth=Math.round(3*sc);
    ctx.beginPath(); ctx.moveTo(PAD+Math.round(28*sc),H*0.66); ctx.lineTo(PAD+Math.round(28*sc)+(W*0.35)*ENT,H*0.66); ctx.stroke();
  }
  else if(style==="centred"){
    // Large ghost circle
    ctx.save(); ctx.globalAlpha=0.05*ENT; ctx.fillStyle=B.colorAccent;
    ctx.beginPath(); ctx.arc(W/2,H/2,Math.min(W,H)*0.42,0,Math.PI*2); ctx.fill(); ctx.restore();
    // Series name
    ctx.save(); ctx.globalAlpha=TXT*0.5;
    ctx.font=`600 ${Math.round(32*sc)}px "${FF}",Arial,sans-serif`;
    ctx.fillStyle="#fff"; ctx.textAlign="center"; ctx.textBaseline="alphabetic";
    ctx.fillText((B.titleCardSeriesName||"").toUpperCase(),W/2,H*0.36);
    ctx.restore();
    // Accent rule
    const ruleW=Math.round(60*sc)*ENT;
    ctx.fillStyle=B.colorAccent; ctx.fillRect(W/2-ruleW/2,H*0.40,ruleW,Math.round(4*sc));
    // Title
    ctx.save(); ctx.globalAlpha=TXT;
    drawText(ctx,B.titleCardTitle||"EPISODE TITLE",W/2,H*0.44,W-PAD*2,H*0.22,Math.round(108*sc),"900","center","#fff",2,FF);
    ctx.restore();
    // Subtitle
    if(B.titleCardSubtitle){
      ctx.save(); ctx.globalAlpha=TXT*0.6;
      drawText(ctx,B.titleCardSubtitle,W/2,H*0.70,W-PAD*2,H*0.10,Math.round(40*sc),"500","center","rgba(255,255,255,0.75)",1,FF);
      ctx.restore();
    }
  }
  else if(style==="split"){
    // Bottom half colour block slides up
    const splitY=H*(0.5+(1-ENT)*0.5);
    ctx.fillStyle=B.colorAccent; ctx.fillRect(0,splitY,W,H-splitY);
    // Series name top half
    ctx.save(); ctx.globalAlpha=TXT;
    ctx.font=`700 ${Math.round(38*sc)}px "${FF}",Arial,sans-serif`;
    ctx.fillStyle="rgba(255,255,255,0.5)"; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
    ctx.fillText((B.titleCardSeriesName||"").toUpperCase(),PAD,H*0.40);
    ctx.restore();
    // Title on accent half
    ctx.save(); ctx.globalAlpha=TXT;
    drawText(ctx,B.titleCardTitle||"EPISODE TITLE",PAD,H*0.56,W-PAD*2,H*0.26,Math.round(108*sc),"900","left","#fff",2,FF);
    ctx.restore();
    if(B.titleCardSubtitle){
      ctx.save(); ctx.globalAlpha=TXT*0.8;
      drawText(ctx,B.titleCardSubtitle,PAD,H*0.82,W-PAD*2,H*0.10,Math.round(40*sc),"500","left","rgba(255,255,255,0.85)",1,FF);
      ctx.restore();
    }
  }

  // Logo always bottom-right
  stamp(ctx,B,W,H);
}

// ═══════════════════════════════════════════════════════════════
//  ENDBOARD RENDERER
// ═══════════════════════════════════════════════════════════════
function drawEndboard(canvas, brand, ratio, progress=1){
  const AR=RATIOS[ratio||"16:9"]||RATIOS["16:9"];
  const W=AR.W,H=AR.H;
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext("2d",{alpha:true});
  ctx.clearRect(0,0,W,H);
  const B={...DEFAULT_BRAND,...brand};
  const FF=B.fontFamily||"Montserrat";
  const sc=Math.min(W,H)/1080;
  const p=clamp(progress,0,1);
  const ENT=easeOut(clamp(p*1.8,0,1));
  const TXT=easeOut(clamp((p-0.12)*2,0,1));
  const PAD=Math.round(90*sc);
  const style=B.endboardStyle||"logo";

  ctx.fillStyle=B.colorPrimary; ctx.fillRect(0,0,W,H);

  if(style==="logo"){
    // Large centred logo
    const logoImg=brand.logoDataUrl?getCachedImage(brand.logoDataUrl):null;
    if(logoImg){
      const lw=Math.round(W*0.28*ENT);
      const lh=Math.round(lw*(logoImg.naturalHeight/logoImg.naturalWidth));
      ctx.save(); ctx.globalAlpha=ENT;
      ctx.drawImage(logoImg,(W-lw)/2,(H*0.28-lh/2),lw,lh);
      ctx.restore();
    } else {
      // Placeholder circle if no logo
      ctx.save(); ctx.globalAlpha=0.15*ENT; ctx.fillStyle=B.colorAccent;
      ctx.beginPath(); ctx.arc(W/2,H*0.28,Math.round(90*sc),0,Math.PI*2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalAlpha=0.5*ENT;
      ctx.font=`900 ${Math.round(36*sc)}px "${FF}",Arial,sans-serif`;
      ctx.fillStyle="#fff"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(B.channelName||"LOGO",W/2,H*0.28);
      ctx.restore();
    }
    // Divider
    const rW=Math.round(W*0.3*ENT);
    ctx.fillStyle=B.colorAccent; ctx.fillRect(W/2-rW/2,H*0.46,rW,Math.round(4*sc));
    // CTA
    ctx.save(); ctx.globalAlpha=TXT;
    drawText(ctx,B.endboardCTA||"Thanks for watching",W/2,H*0.50,W-PAD*2,H*0.14,Math.round(72*sc),"800","center","#fff",2,FF);
    ctx.restore();
    // Handles
    if(B.endboardHandles){
      ctx.save(); ctx.globalAlpha=TXT*0.65;
      drawText(ctx,B.endboardHandles,W/2,H*0.68,W-PAD*2,H*0.08,Math.round(38*sc),"600","center",B.colorAccent,1,FF);
      ctx.restore();
    }
    // Website
    if(B.endboardWebsite){
      ctx.save(); ctx.globalAlpha=TXT*0.5;
      drawText(ctx,B.endboardWebsite,W/2,H*0.76,W-PAD*2,H*0.07,Math.round(34*sc),"500","center","rgba(255,255,255,0.7)",1,FF);
      ctx.restore();
    }
  }
  else if(style==="grid"){
    // Top bar in accent colour slides down
    const barH=H*0.12*ENT;
    ctx.fillStyle=B.colorAccent; ctx.fillRect(0,0,W,barH);
    // Logo in bar
    const logoImg=brand.logoDataUrl?getCachedImage(brand.logoDataUrl):null;
    if(logoImg && ENT>0.3){
      const lh=Math.round(barH*0.6); const lw=Math.round(lh*(logoImg.naturalWidth/logoImg.naturalHeight));
      ctx.save(); ctx.globalAlpha=Math.max(0,(ENT-0.3)/0.7);
      ctx.drawImage(logoImg,PAD,(barH-lh)/2,lw,lh); ctx.restore();
    }
    // Big CTA
    ctx.save(); ctx.globalAlpha=TXT;
    drawText(ctx,B.endboardCTA||"Thanks for watching",W/2,H*0.22,W-PAD*2,H*0.20,Math.round(90*sc),"900","center","#fff",2,FF);
    ctx.restore();
    // Subscribe placeholder boxes
    const boxW=Math.round(260*sc),boxH=Math.round(80*sc),gap=Math.round(24*sc);
    const totalW=boxW*2+gap; const bx=(W-totalW)/2; const by=H*0.52;
    ["▶  Subscribe","🔔  Notify me"].forEach((lbl,i)=>{
      const x=bx+i*(boxW+gap);
      ctx.save(); ctx.globalAlpha=TXT;
      ctx.shadowColor="rgba(0,0,0,0.3)"; ctx.shadowBlur=20;
      rrPath(ctx,x,by,boxW,boxH,Math.round(14*sc));
      ctx.fillStyle=i===0?B.colorAccent:"rgba(255,255,255,0.12)"; ctx.fill(); ctx.shadowBlur=0;
      ctx.font=`700 ${Math.round(28*sc)}px "${FF}",Arial,sans-serif`;
      ctx.fillStyle="#fff"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(lbl,x+boxW/2,by+boxH/2); ctx.restore();
    });
    if(B.endboardHandles){
      ctx.save(); ctx.globalAlpha=TXT*0.6;
      drawText(ctx,B.endboardHandles,W/2,H*0.75,W-PAD*2,H*0.07,Math.round(34*sc),"600","center",B.colorPositive,1,FF);
      ctx.restore();
    }
    if(B.endboardWebsite){
      ctx.save(); ctx.globalAlpha=TXT*0.45;
      drawText(ctx,B.endboardWebsite,W/2,H*0.82,W-PAD*2,H*0.06,Math.round(30*sc),"500","center","rgba(255,255,255,0.6)",1,FF);
      ctx.restore();
    }
  }
  else if(style==="minimal"){
    // Just a thin accent line, logo, one line of text
    ctx.fillStyle=B.colorAccent; ctx.fillRect(0,0,W,Math.round(8*sc));
    const logoImg=brand.logoDataUrl?getCachedImage(brand.logoDataUrl):null;
    if(logoImg){
      const lw=Math.round(W*0.18*ENT); const lh=Math.round(lw*(logoImg.naturalHeight/logoImg.naturalWidth));
      ctx.save(); ctx.globalAlpha=ENT; ctx.drawImage(logoImg,(W-lw)/2,H*0.30,lw,lh); ctx.restore();
    }
    ctx.save(); ctx.globalAlpha=TXT;
    drawText(ctx,B.endboardCTA||"Thanks for watching",W/2,H*0.56,W-PAD*2,H*0.14,Math.round(64*sc),"700","center","rgba(255,255,255,0.85)",1,FF);
    ctx.restore();
    if(B.endboardHandles||B.endboardWebsite){
      ctx.save(); ctx.globalAlpha=TXT*0.5;
      drawText(ctx,(B.endboardHandles||"")+(B.endboardHandles&&B.endboardWebsite?"  ·  ":"")+(B.endboardWebsite||""),W/2,H*0.66,W-PAD*2,H*0.07,Math.round(32*sc),"500","center",B.colorAccent,1,FF);
      ctx.restore();
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  STATIC CANVAS PREVIEW COMPONENT
// ═══════════════════════════════════════════════════════════════
function StaticCanvasPreview({drawFn, brand, ratio, deps=[], width=380}){
  const ref=useRef(); const rafRef=useRef(); const st=useRef(Date.now());
  useEffect(()=>{
    st.current=Date.now();
    const loop=()=>{
      const p=Math.min((Date.now()-st.current)/800,1);
      if(ref.current) drawFn(ref.current,brand,ratio,p);
      if(p<1) rafRef.current=requestAnimationFrame(loop);
    };
    rafRef.current=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[ratio,...deps]);
  const AR=RATIOS[ratio||"16:9"]||RATIOS["16:9"]; const aspect=AR.W/AR.H;
  return(
    <div style={{position:"relative",width,height:width/aspect,borderRadius:10,overflow:"hidden",border:"1px solid rgba(255,255,255,0.1)"}}>
      <canvas ref={ref} width={AR.W} height={AR.H} style={{width:"100%",height:"100%"}}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  BRAND ASSETS SECTION  (inside BrandEditor)
// ═══════════════════════════════════════════════════════════════
function BrandAssets({b, set, S}){
  const [previewRatio,setPreviewRatio]=useState("16:9");
  const [activeAsset,setActiveAsset]=useState("titlecard"); // titlecard | endboard
  const cvs=useRef(document.createElement("canvas"));

  const exportAsset=(drawFn,prefix)=>{
    Object.keys(RATIOS).forEach(ratio=>{
      drawFn(cvs.current,b,ratio,1);
      cvs.current.toBlob(blob=>{
        if(!blob)return;
        const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
        a.download=`${prefix}_${ratio.replace(":","x")}.png`; a.click();
      },"image/png");
    });
  };

  const tabBtn=active=>({...S.sm,background:active?"rgba(42,157,143,0.25)":"rgba(255,255,255,0.06)",border:`1px solid ${active?"#2A9D8F":"rgba(255,255,255,0.1)"}`,padding:"9px 18px",fontSize:13,fontWeight:active?800:600});
  const ratioBtn=active=>({...S.sm,background:active?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.06)",border:`1px solid ${active?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.1)"}`,padding:"6px 12px",fontSize:12});

  return(
    <div>
      {/* Asset tabs */}
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        <button style={tabBtn(activeAsset==="titlecard")} onClick={()=>setActiveAsset("titlecard")}>🎬 Title Card</button>
        <button style={tabBtn(activeAsset==="endboard")} onClick={()=>setActiveAsset("endboard")}>🏁 Endboard</button>
      </div>

      {/* Ratio switcher + preview */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span style={{fontSize:10,fontWeight:700,opacity:0.45,letterSpacing:1}}>PREVIEW</span>
        {Object.keys(RATIOS).map(k=>(
          <button key={k} style={ratioBtn(previewRatio===k)} onClick={()=>setPreviewRatio(k)}>{k}</button>
        ))}
      </div>

      <StaticCanvasPreview
        drawFn={activeAsset==="titlecard"?drawTitleCard:drawEndboard}
        brand={b} ratio={previewRatio}
        deps={activeAsset==="titlecard"
          ?[b.titleCardTitle,b.titleCardSeriesName,b.titleCardSubtitle,b.titleCardStyle,b.colorPrimary,b.colorAccent,b.fontFamily,b.logoDataUrl]
          :[b.endboardCTA,b.endboardHandles,b.endboardWebsite,b.endboardStyle,b.colorPrimary,b.colorAccent,b.fontFamily,b.logoDataUrl]}
        width={380}
      />

      <div style={{marginTop:14}}>
        {activeAsset==="titlecard"?(
          <div>
            {/* Layout style */}
            <div style={{marginBottom:14}}>
              <label style={S.lbl}>LAYOUT STYLE</label>
              <div style={{display:"flex",gap:8,marginTop:6}}>
                {[["bar","▌ Bar"],["centred","◎ Centred"],["split","▬ Split"]].map(([k,l])=>(
                  <button key={k} style={{...S.sm,background:(b.titleCardStyle||"bar")===k?b.colorPositive:"rgba(255,255,255,0.07)",border:`1px solid ${(b.titleCardStyle||"bar")===k?b.colorPositive:"rgba(255,255,255,0.13)"}`,padding:"8px 16px",fontSize:12}} onClick={()=>set("titleCardStyle")(k)}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{display:"grid",gap:10}}>
              <div>
                <label style={S.lbl}>SERIES NAME (small, above title)</label>
                <input value={b.titleCardSeriesName||""} onChange={e=>set("titleCardSeriesName")(e.target.value)} placeholder="e.g. Wales Housing Law" style={S.inp}/>
              </div>
              <div>
                <label style={S.lbl}>EPISODE TITLE (hero text)</label>
                <input value={b.titleCardTitle||""} onChange={e=>set("titleCardTitle")(e.target.value)} placeholder="e.g. Rent Increase Rules" style={S.inp}/>
              </div>
              <div>
                <label style={S.lbl}>SUBTITLE / EPISODE NUMBER</label>
                <input value={b.titleCardSubtitle||""} onChange={e=>set("titleCardSubtitle")(e.target.value)} placeholder="e.g. Episode 1 · 5 Rules You Need to Know" style={S.inp}/>
              </div>
            </div>
          </div>
        ):(
          <div>
            {/* Endboard style */}
            <div style={{marginBottom:14}}>
              <label style={S.lbl}>LAYOUT STYLE</label>
              <div style={{display:"flex",gap:8,marginTop:6}}>
                {[["logo","◎ Logo"],["grid","⊞ Grid"],["minimal","— Minimal"]].map(([k,l])=>(
                  <button key={k} style={{...S.sm,background:(b.endboardStyle||"logo")===k?b.colorPositive:"rgba(255,255,255,0.07)",border:`1px solid ${(b.endboardStyle||"logo")===k?b.colorPositive:"rgba(255,255,255,0.13)"}`,padding:"8px 16px",fontSize:12}} onClick={()=>set("endboardStyle")(k)}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{display:"grid",gap:10}}>
              <div>
                <label style={S.lbl}>CALL TO ACTION</label>
                <input value={b.endboardCTA||""} onChange={e=>set("endboardCTA")(e.target.value)} placeholder="e.g. Thanks for watching — subscribe for more" style={S.inp}/>
              </div>
              <div>
                <label style={S.lbl}>SOCIAL HANDLES</label>
                <input value={b.endboardHandles||""} onChange={e=>set("endboardHandles")(e.target.value)} placeholder="e.g. @waleslaw  ·  @waleslaw.co.uk" style={S.inp}/>
              </div>
              <div>
                <label style={S.lbl}>WEBSITE</label>
                <input value={b.endboardWebsite||""} onChange={e=>set("endboardWebsite")(e.target.value)} placeholder="e.g. waleslaw.co.uk" style={S.inp}/>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export all ratios */}
      <button style={{...S.sm,marginTop:16,width:"100%",padding:"12px",background:"rgba(42,157,143,0.18)",border:"1px solid #2A9D8F",fontSize:13,textAlign:"center"}}
        onClick={()=>exportAsset(activeAsset==="titlecard"?drawTitleCard:drawEndboard, activeAsset==="titlecard"?"title_card":"endboard")}>
        ⬇ Export {activeAsset==="titlecard"?"Title Card":"Endboard"} — all ratios (PNG)
      </button>
      <div style={{fontSize:10,opacity:0.35,marginTop:6,textAlign:"center"}}>Exports 16:9, 1:1 and 9:16 PNGs in one click</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ANIMATION PRESET PICKER  (inside BrandEditor)
// ═══════════════════════════════════════════════════════════════
function AnimationPresetPicker({value,onChange,brand,S}){
  const [hovered,setHovered]=useState(null);
  // Small live canvas preview per preset on hover
  const previewRef=useRef();
  const rafRef=useRef();
  const startRef=useRef(Date.now());

  useEffect(()=>{
    if(!hovered||!previewRef.current)return;
    startRef.current=Date.now();
    const preset=ANIM_PRESETS[hovered]||ANIM_PRESETS.default;
    const sampleG={template:"key_point",content:{headline:"KEY POINT",body:"Animation preview for this preset"}};
    const fakeBrand={...DEFAULT_BRAND,...brand,animationPreset:hovered};
    const loop=()=>{
      const elapsed=(Date.now()-startRef.current)/1000;
      const p=elapsed%2<1.4?Math.min(elapsed%2/0.7,1):1; // animate then hold
      if(previewRef.current) drawGraphic(previewRef.current,sampleG,fakeBrand,"16:9",p);
      rafRef.current=requestAnimationFrame(loop);
    };
    rafRef.current=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(rafRef.current);
  },[hovered,brand]);

  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:hovered?12:0}}>
        {Object.entries(ANIM_PRESETS).map(([k,preset])=>(
          <button key={k}
            style={{
              background:value===k?"rgba(42,157,143,0.2)":"rgba(255,255,255,0.05)",
              border:`1px solid ${value===k?"#2A9D8F":"rgba(255,255,255,0.1)"}`,
              borderRadius:10,padding:"12px 8px",cursor:"pointer",textAlign:"center",
              color:"#fff",fontFamily:"inherit",transition:"all 0.15s"
            }}
            onClick={()=>onChange(k)}
            onMouseEnter={()=>setHovered(k)}
            onMouseLeave={()=>setHovered(null)}
          >
            <div style={{fontSize:20,marginBottom:4}}>{preset.icon}</div>
            <div style={{fontWeight:800,fontSize:11,marginBottom:2}}>{preset.label}</div>
            <div style={{fontSize:9,opacity:0.45}}>{preset.feel}</div>
          </button>
        ))}
      </div>
      {hovered&&(
        <div style={{borderRadius:10,overflow:"hidden",border:"1px solid rgba(255,255,255,0.1)"}}>
          <canvas ref={previewRef} width={1920} height={1080} style={{width:"100%",display:"block",background:"repeating-conic-gradient(#3a3a3a 0% 25%,#2a2a2a 0% 50%) 0 0/18px 18px"}}/>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  STYLE EXTRACTOR  (Claude Vision image upload + extraction)
// ═══════════════════════════════════════════════════════════════
function StyleExtractor({onExtracted,S}){
  const [images,setImages]=useState([]);       // [{name,dataURL,mediaType}]
  const [extracting,setExtracting]=useState(false);
  const [error,setError]=useState("");
  const [result,setResult]=useState(null);      // raw Claude response
  const fileRef=useRef();
  const dropRef=useRef();

  const addFiles=files=>{
    const allowed=["image/png","image/jpeg","image/webp"];
    const toAdd=[...files].filter(f=>allowed.includes(f.type)).slice(0,4-images.length);
    toAdd.forEach(f=>{
      const reader=new FileReader();
      reader.onload=()=>{
        const mediaType=f.type==="image/png"?"image/png":f.type==="image/webp"?"image/webp":"image/jpeg";
        setImages(prev=>{
          if(prev.length>=4)return prev;
          return[...prev,{name:f.name,dataURL:reader.result,mediaType}];
        });
      };
      reader.readAsDataURL(f);
    });
  };

  const handleDrop=e=>{e.preventDefault();e.stopPropagation();addFiles(e.dataTransfer.files);};
  const handleDragOver=e=>{e.preventDefault();e.stopPropagation();};

  const extract=async()=>{
    setExtracting(true);setError("");setResult(null);
    try{
      const content=[];
      images.forEach(img=>{
        const base64=img.dataURL.split(",")[1];
        content.push({type:"image",source:{type:"base64",media_type:img.mediaType,data:base64}});
      });
      content.push({type:"text",text:EXTRACTION_PROMPT});

      const resp=await fetch("/api/ai",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1024,
          messages:[{role:"user",content}]
        })
      });
      if(!resp.ok){const e=await resp.text();throw new Error(`API ${resp.status}: ${e.slice(0,200)}`);}
      const data=await resp.json();
      const txt=(data.content||[]).find(b=>b.type==="text")?.text||"";
      // Parse JSON — strip markdown fences if present
      const jsonStr=txt.replace(/```json?\n?/g,"").replace(/```/g,"").trim();
      const parsed=JSON.parse(jsonStr);
      setResult(parsed);
      const mapped=mapExtractedStyle(parsed);
      onExtracted(mapped,parsed);
    }catch(err){
      setError(err.message||"Extraction failed");
    }finally{
      setExtracting(false);
    }
  };

  return(
    <div style={{marginBottom:16}}>
      <label style={S.lbl}>EXTRACT STYLE FROM REFERENCE IMAGE</label>
      <div ref={dropRef} onDrop={handleDrop} onDragOver={handleDragOver}
        onClick={()=>fileRef.current?.click()}
        style={{
          border:"2px dashed rgba(255,255,255,0.15)",borderRadius:12,padding:"24px 16px",
          textAlign:"center",cursor:"pointer",background:"rgba(255,255,255,0.02)",
          transition:"border-color 0.2s",marginBottom:10
        }}
        onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(42,157,143,0.5)"}
        onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.15)"}
      >
        <div style={{fontSize:28,marginBottom:6}}>📷</div>
        <div style={{fontSize:13,fontWeight:600,opacity:0.7}}>Drop an image here or click to upload</div>
        <div style={{fontSize:10,opacity:0.35,marginTop:4}}>PNG, JPG, WebP — upload 1–4 examples for best results</div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple
          style={{display:"none"}} onChange={e=>{addFiles(e.target.files);e.target.value="";}}/>
      </div>

      {/* Thumbnails */}
      {images.length>0&&(
        <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
          {images.map((img,i)=>(
            <div key={i} style={{position:"relative",width:72,height:72,borderRadius:8,overflow:"hidden",border:"1px solid rgba(255,255,255,0.12)"}}>
              <img src={img.dataURL} alt={img.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
              <button onClick={e=>{e.stopPropagation();setImages(prev=>prev.filter((_,j)=>j!==i));}}
                style={{position:"absolute",top:2,right:2,background:"rgba(0,0,0,0.7)",border:"none",color:"#fff",
                  borderRadius:10,width:18,height:18,fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
          ))}
          {images.length<4&&(
            <div onClick={()=>fileRef.current?.click()}
              style={{width:72,height:72,borderRadius:8,border:"2px dashed rgba(255,255,255,0.1)",display:"flex",
                alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:20,opacity:0.3}}>+</div>
          )}
        </div>
      )}

      {/* Extract button */}
      {images.length>0&&(
        <button onClick={extract} disabled={extracting}
          style={{...S.sm,background:extracting?"rgba(255,255,255,0.05)":"rgba(42,157,143,0.18)",
            border:`1px solid ${extracting?"rgba(255,255,255,0.1)":"rgba(42,157,143,0.5)"}`,
            padding:"10px 20px",fontSize:13,fontWeight:700,opacity:extracting?0.5:1}}>
          {extracting?"⏳ Analysing…":"🎨 Extract Style"}
        </button>
      )}

      {error&&<div style={{marginTop:8,padding:"8px 12px",background:"rgba(255,80,80,0.12)",border:"1px solid rgba(255,80,80,0.3)",borderRadius:8,fontSize:12,color:"#ff8080"}}>{error}</div>}

      {result&&(
        <div style={{marginTop:10,padding:"10px 14px",background:"rgba(42,157,143,0.08)",border:"1px solid rgba(42,157,143,0.2)",borderRadius:10}}>
          <div style={{fontSize:11,fontWeight:700,opacity:0.6,marginBottom:6}}>EXTRACTED STYLE</div>
          <div style={{display:"flex",gap:6,marginBottom:6}}>
            {[result.colorPrimary,result.colorAccent,result.colorPositive,result.colorText].filter(Boolean).map((c,i)=>(
              <div key={i} style={{width:28,height:28,borderRadius:6,background:c,border:"1px solid rgba(255,255,255,0.15)"}} title={c}/>
            ))}
          </div>
          <div style={{fontSize:11,opacity:0.5}}>
            {result.fontStyle&&<span>Font: {result.fontStyle} · </span>}
            {result.cornerRadiusFeel&&<span>Corners: {result.cornerRadiusFeel} · </span>}
            {result.overallFeel&&<span>Feel: {result.overallFeel}</span>}
          </div>
          {result.notes&&<div style={{fontSize:10,opacity:0.35,marginTop:4}}>{result.notes}</div>}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  STYLE TEMPLATE SECTION  (inside BrandEditor)
// ═══════════════════════════════════════════════════════════════
function StyleTemplateSection({b, setB, brandId, allBrands, S}){
  const [templates,setTemplates]=useState(()=>load(TMPL_STORE));
  const [savedMsg,setSavedMsg]=useState("");
  const [varName,setVarName]=useState("");
  const [showVarInput,setShowVarInput]=useState(false);
  const [confirmDialog,setConfirmDialog]=useState(null);
  const [copyDropdown,setCopyDropdown]=useState(null); // template id being copied

  const persist=ts=>{setTemplates(ts);save(TMPL_STORE,ts);};

  // Extract style fields from current brand state
  const extractStyle=()=>{
    const style={};
    STYLE_FIELDS.forEach(k=>{if(b[k]!==undefined)style[k]=b[k];});
    return style;
  };

  // Apply template to brand
  const applyTemplate=t=>{
    const updates={};
    STYLE_FIELDS.forEach(k=>{if(t[k]!==undefined)updates[k]=t[k];});
    setB(prev=>({...prev,...updates}));
  };

  // Save template
  const saveTemplate=(name,isMaster)=>{
    const t={
      id:Date.now(), name:name||"Untitled Style",
      description:"", isMaster, brandId:brandId||null,
      createdAt:new Date().toISOString(),
      ...extractStyle()
    };
    persist([...templates,t]);
    setSavedMsg("✓ Saved");setTimeout(()=>setSavedMsg(""),2000);
    setShowVarInput(false);setVarName("");
  };

  // Delete template
  const deleteTemplate=id=>{persist(templates.filter(t=>t.id!==id));setConfirmDialog(null);};

  // Copy template to another brand
  const copyToBrand=(tplId,targetBrandId)=>{
    const src=templates.find(t=>t.id===tplId);
    if(!src)return;
    const copy={...src,id:Date.now(),brandId:targetBrandId,isMaster:false,
      name:src.name+" (copy)",createdAt:new Date().toISOString()};
    persist([...templates,copy]);
    setCopyDropdown(null);
    setSavedMsg("✓ Copied");setTimeout(()=>setSavedMsg(""),2000);
  };

  // Visible templates: associated with this brand + global
  const visible=templates.filter(t=>t.brandId===brandId||t.brandId===null)
    .sort((a,b2)=>(b2.isMaster?1:0)-(a.isMaster?1:0)||b2.id-a.id);
  const allTemplates=[...templates].sort((a,b2)=>(b2.isMaster?1:0)-(a.isMaster?1:0)||b2.id-a.id);

  const otherBrands=(allBrands||[]).filter(br=>br.id!==brandId);

  return(
    <div>
      {confirmDialog&&<ConfirmDialog message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={()=>setConfirmDialog(null)}/>}

      {/* Apply dropdown */}
      <div style={{marginBottom:14}}>
        <label style={S.lbl}>APPLY A TEMPLATE</label>
        <select
          value=""
          onChange={e=>{const t=allTemplates.find(t2=>String(t2.id)===e.target.value);if(t)applyTemplate(t);}}
          style={{...S.inp,appearance:"auto",cursor:"pointer"}}
        >
          <option value="">Choose a template to start from…</option>
          {allTemplates.map(t=>(
            <option key={t.id} value={t.id}>{t.isMaster?"⭐ ":""}{t.name}{t.brandId&&t.brandId!==brandId?` (${(allBrands||[]).find(br=>br.id===t.brandId)?.name||"other"})`:""}</option>
          ))}
        </select>
      </div>

      {/* Save buttons */}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <button style={{...S.sm,background:"rgba(42,157,143,0.18)",border:"1px solid rgba(42,157,143,0.5)"}}
          onClick={()=>saveTemplate(b.name+" Master",true)}>
          ⭐ Save as Master Template
        </button>
        {showVarInput?(
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <input value={varName} onChange={e=>setVarName(e.target.value)}
              placeholder="Variation name…" autoFocus
              onKeyDown={e=>{if(e.key==="Enter"&&varName.trim())saveTemplate(varName.trim(),false);if(e.key==="Escape")setShowVarInput(false);}}
              style={{...S.inp,width:180,padding:"7px 10px",fontSize:12}}/>
            <button style={{...S.sm,padding:"7px 12px"}} onClick={()=>{if(varName.trim())saveTemplate(varName.trim(),false);}}>Save</button>
            <button style={{...S.sm,padding:"7px 10px",opacity:0.5}} onClick={()=>setShowVarInput(false)}>✕</button>
          </div>
        ):(
          <button style={S.sm} onClick={()=>setShowVarInput(true)}>
            Save As Variation
          </button>
        )}
        {savedMsg&&<span style={{fontSize:12,fontWeight:700,color:"#2A9D8F",animation:"fadeIn 0.2s"}}>{savedMsg}</span>}
      </div>

      {/* Style extraction from reference images */}
      <StyleExtractor onExtracted={(mapped,raw)=>{
        setB(prev=>({...prev,...mapped}));
      }} S={S}/>

      {/* Template list */}
      {visible.length>0&&(
        <div>
          <label style={{...S.lbl,marginBottom:8}}>SAVED TEMPLATES</label>
          {visible.map(t=>{
            const fromOther=t.brandId&&t.brandId!==brandId;
            const brandName=fromOther?(allBrands||[]).find(br=>br.id===t.brandId)?.name:"";
            return(
              <div key={t.id} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,padding:"9px 13px",marginBottom:6,display:"flex",alignItems:"center",gap:8}}>
                {/* Color dots preview */}
                <div style={{display:"flex",gap:3,flexShrink:0}}>
                  {[t.colorPrimary,t.colorAccent,t.colorPositive].filter(Boolean).map((c,i)=>(
                    <div key={i} style={{width:10,height:10,borderRadius:3,background:c}}/>
                  ))}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {t.isMaster&&"⭐ "}{t.name}
                  </div>
                  <div style={{fontSize:10,opacity:0.4}}>
                    {t.fontFamily||"Montserrat"}{fromOther?` · from ${brandName}`:""}{!t.brandId?" · global":""}
                  </div>
                </div>
                <div style={{display:"flex",gap:4,flexShrink:0}}>
                  <button style={{...S.sm,padding:"4px 8px",fontSize:10}} onClick={()=>applyTemplate(t)} title="Apply">✓ Apply</button>
                  {/* Copy to brand */}
                  <div style={{position:"relative"}}>
                    <button style={{...S.sm,padding:"4px 8px",fontSize:10}} onClick={()=>setCopyDropdown(copyDropdown===t.id?null:t.id)} title="Copy to brand">📋</button>
                    {copyDropdown===t.id&&otherBrands.length>0&&(
                      <div style={{position:"absolute",right:0,top:"110%",background:"#1a2636",border:"1px solid rgba(255,255,255,0.15)",borderRadius:8,padding:6,zIndex:50,minWidth:160,boxShadow:"0 8px 24px rgba(0,0,0,0.5)"}}>
                        {otherBrands.map(br=>(
                          <div key={br.id} style={{padding:"6px 10px",fontSize:11,cursor:"pointer",borderRadius:5,fontWeight:600,color:"#fff"}}
                            onClick={()=>copyToBrand(t.id,br.id)}
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(42,157,143,0.2)"}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            → {br.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button style={{...S.sm,padding:"4px 8px",fontSize:10,opacity:0.5}} onClick={()=>setConfirmDialog({message:`Delete template "${t.name}"?`,onConfirm:()=>deleteTemplate(t.id)})} title="Delete">🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  BRAND EDITOR
// ═══════════════════════════════════════════════════════════════
function BrandEditor({brand,onSave,onCancel,onDelete,allBrands}){
  const [b,setB]=useState({...DEFAULT_BRAND,...brand});
  const set=k=>v=>setB(prev=>({...prev,[k]:v}));
  const S={
    app:{fontFamily:`"${b.fontFamily}","Arial",sans-serif`,background:"#0b1320",minHeight:"100vh",color:"#fff"},
    hdr:{background:b.colorPrimary,padding:"13px 24px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid rgba(0,0,0,0.3)"},
    wrap:{maxWidth:720,margin:"0 auto",padding:"26px 18px"},
    section:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"18px 20px",marginBottom:16},
    shead:{fontWeight:800,fontSize:12,letterSpacing:1,opacity:0.5,textTransform:"uppercase",marginBottom:14},
    inp:{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:9,padding:"11px 13px",color:"#fff",fontSize:14,fontFamily:"inherit",boxSizing:"border-box",outline:"none"},
    lbl:{display:"block",fontSize:10,opacity:0.5,fontWeight:700,letterSpacing:1,marginBottom:5},
    sm:{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.13)",color:"#fff",padding:"8px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600},
  };
  return(
    <div style={S.app}>
      <div style={S.hdr}>
        <div style={{width:6,height:38,background:b.colorAccent,borderRadius:4,flexShrink:0}}/>
        <div style={{fontWeight:900,fontSize:18,flex:1}}>{brand.id?"Edit Brand":"New Brand"}</div>
        <div style={{display:"flex",gap:8}}>
          <button style={S.sm} onClick={onCancel}>Cancel</button>
          <button style={{...S.sm,background:b.colorAccent,border:`1px solid ${b.colorAccent}`,padding:"8px 20px"}} onClick={()=>onSave(b)}>Save Brand →</button>
        </div>
      </div>
      <div style={S.wrap}>
        {/* Name */}
        <div style={S.section}>
          <div style={S.shead}>Brand Name</div>
          <input value={b.name} onChange={e=>set("name")(e.target.value)} placeholder="e.g. WalesLaw" style={S.inp}/>
        </div>
        {/* Font */}
        <div style={S.section}>
          <div style={S.shead}>Font</div>
          <FontPicker value={b.fontFamily} onChange={set("fontFamily")}/>
          <div style={{marginTop:12,background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"14px 18px",fontFamily:`"${b.fontFamily}","Arial",sans-serif`}}>
            <div style={{fontSize:28,fontWeight:900,marginBottom:2}}>The quick brown fox</div>
            <div style={{fontSize:15,opacity:0.55}}>0123456789 — {b.fontFamily}</div>
          </div>
        </div>
        {/* Style Templates */}
        <div style={S.section}>
          <div style={S.shead}>Style Templates</div>
          <StyleTemplateSection b={b} setB={setB} brandId={brand.id||null} allBrands={allBrands} S={S}/>
        </div>
        {/* Colours */}
        <div style={S.section}>
          <div style={S.shead}>Colours</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px"}}>
            <Swatch label="PRIMARY — cards & titles"   value={b.colorPrimary}  onChange={set("colorPrimary")}/>
            <Swatch label="ACCENT — myth & highlights" value={b.colorAccent}   onChange={set("colorAccent")}/>
            <Swatch label="POSITIVE — reality & facts" value={b.colorPositive} onChange={set("colorPositive")}/>
            <Swatch label="TEXT — captions & overlays" value={b.colorText}     onChange={set("colorText")}/>
          </div>
        </div>
        {/* Caption style */}
        <div style={S.section}>
          <div style={S.shead}>Caption Settings</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
            <div>
              <label style={S.lbl}>FONT SIZE (base at 1080px height)</label>
              <input type="number" min={40} max={160} value={b.captionFontSize} onChange={e=>set("captionFontSize")(Number(e.target.value))} style={S.inp}/>
            </div>
            <div>
              <label style={S.lbl}>FONT WEIGHT</label>
              <select value={b.captionFontWeight} onChange={e=>set("captionFontWeight")(e.target.value)} style={{...S.inp,appearance:"none"}}>
                {["600","700","800","900"].map(w=><option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label style={S.lbl}>POSITION</label>
              <select value={b.captionPosition} onChange={e=>set("captionPosition")(e.target.value)} style={{...S.inp,appearance:"none"}}>
                <option value="lower">Lower third</option>
                <option value="middle">Centre</option>
                <option value="upper">Upper third</option>
              </select>
            </div>
            <div>
              <label style={S.lbl}>TEXT CASE</label>
              <select value={b.captionTextCase} onChange={e=>set("captionTextCase")(e.target.value)} style={{...S.inp,appearance:"none"}}>
                <option value="upper">UPPERCASE</option>
                <option value="normal">Normal Case</option>
              </select>
            </div>
          </div>
          <label style={S.lbl}>HIGHLIGHT PILL CORNER RADIUS — {b.captionPillRadius}px&nbsp; (0 = square · 50 = full pill)</label>
          <input type="range" min={0} max={50} step={1} value={b.captionPillRadius} onChange={e=>set("captionPillRadius")(Number(e.target.value))} style={{width:"100%",accentColor:b.colorAccent,marginBottom:4}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,opacity:0.4}}>
            <span>Square</span><span>Rounded</span><span>Full Pill</span>
          </div>
          <div style={{marginTop:12}}>
            <label style={S.lbl}>CARD BACKGROUND OPACITY — {Math.round((b.captionBgOpacity||0)*100)}%</label>
            <input type="range" min={0} max={0.85} step={0.05} value={b.captionBgOpacity} onChange={e=>set("captionBgOpacity")(Number(e.target.value))} style={{width:"100%",accentColor:b.colorAccent}}/>
          </div>
        </div>
        {/* Animation preset */}
        <div style={S.section}>
          <div style={S.shead}>Animation Feel</div>
          <AnimationPresetPicker value={b.animationPreset||"default"} onChange={set("animationPreset")} brand={b} S={S}/>
        </div>
        {/* Graphic style */}
        <div style={S.section}>
          <div style={S.shead}>Graphic Settings</div>

          {/* ── Typography ── */}
        <div style={S.section}>
          <div style={S.shead}>Typography</div>
          <div style={{display:"grid",gap:14}}>
            {/* Type scale */}
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
                <label style={S.lbl}>GRAPHIC TYPE SCALE</label>
                <span style={{fontSize:12,fontWeight:700,opacity:0.7,fontFamily:"monospace"}}>{(b.typeScale||1.0).toFixed(2)}×</span>
              </div>
              <input type="range" min={0.70} max={1.30} step={0.01} value={b.typeScale||1.0}
                onChange={e=>set("typeScale")(Number(e.target.value))}
                style={{width:"100%",accentColor:b.colorAccent}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,opacity:0.35,marginTop:2}}>
                <span>Smaller</span><span>Default (1.0)</span><span>Larger</span>
              </div>
            </div>
            {/* Line height */}
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
                <label style={S.lbl}>GRAPHIC LINE HEIGHT</label>
                <span style={{fontSize:12,fontWeight:700,opacity:0.7,fontFamily:"monospace"}}>{(b.lineHeight||1.30).toFixed(2)}</span>
              </div>
              <input type="range" min={1.10} max={1.90} step={0.02} value={b.lineHeight||1.30}
                onChange={e=>set("lineHeight")(Number(e.target.value))}
                style={{width:"100%",accentColor:b.colorAccent}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,opacity:0.35,marginTop:2}}>
                <span>Tight</span><span>Default (1.30)</span><span>Airy</span>
              </div>
            </div>
            {/* Heading weight */}
            <div>
              <label style={S.lbl}>HEADING WEIGHT</label>
              <div style={{display:"flex",gap:8,marginTop:6}}>
                {[["700","Regular Bold"],["800","Extra Bold"],["900","Black"]].map(([w,l])=>(
                  <button key={w} onClick={()=>set("headingWeight")(w)} style={{...S.sm,flex:1,textAlign:"center",
                    background:(b.headingWeight||"900")===w?b.colorPositive:"rgba(255,255,255,0.06)",
                    border:`1px solid ${(b.headingWeight||"900")===w?b.colorPositive:"rgba(255,255,255,0.12)"}`,
                    fontWeight:Number(w),fontFamily:`"${b.fontFamily}",Arial,sans-serif`}}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {/* Caption line height */}
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:4}}>
                <label style={S.lbl}>CAPTION LINE HEIGHT</label>
                <span style={{fontSize:12,fontWeight:700,opacity:0.7,fontFamily:"monospace"}}>{(b.captionLineHeight||1.45).toFixed(2)}</span>
              </div>
              <input type="range" min={1.10} max={1.90} step={0.02} value={b.captionLineHeight||1.45}
                onChange={e=>set("captionLineHeight")(Number(e.target.value))}
                style={{width:"100%",accentColor:b.colorAccent}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,opacity:0.35,marginTop:2}}>
                <span>Tight</span><span>Default (1.45)</span><span>Airy</span>
              </div>
            </div>
          </div>
          {/* Live type preview */}
          <div style={{marginTop:16,background:"rgba(0,0,0,0.35)",borderRadius:10,padding:"18px 22px",
            fontFamily:`"${b.fontFamily}","Arial",sans-serif`}}>
            <div style={{fontSize:28,fontWeight:Number(b.headingWeight||900)*1,
              lineHeight:b.lineHeight||1.3,color:"#fff",transform:`scale(${b.typeScale||1})`,transformOrigin:"left top",
              marginBottom:Math.round((b.typeScale||1)*8)}}>
              The quick brown fox
            </div>
            <div style={{fontSize:15,lineHeight:b.lineHeight||1.3,opacity:0.55,
              color:"#fff",fontFamily:`"${b.fontFamily}","Arial",sans-serif`}}>
              jumps over the lazy dog — 0123456789
            </div>
          </div>
        </div>
        {/* ── Logo watermark ── */}
          <div style={{marginBottom:18}}>
            <label style={S.lbl}>WATERMARK LOGO (transparent PNG)</label>
            <div style={{display:"flex",gap:12,alignItems:"flex-start",flexWrap:"wrap"}}>
              {/* Upload / preview zone */}
              <div style={{width:120,height:80,borderRadius:10,border:`2px dashed ${b.logoDataUrl?"rgba(42,157,143,0.6)":"rgba(255,255,255,0.15)"}`,background:b.logoDataUrl?"rgba(42,157,143,0.07)":"rgba(255,255,255,0.03)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,position:"relative",overflow:"hidden"}}
                onClick={()=>document.getElementById("logo-upload").click()}>
                {b.logoDataUrl
                  ?<img src={b.logoDataUrl} alt="logo" style={{maxWidth:"90%",maxHeight:"70%",objectFit:"contain"}}/>
                  :<div style={{textAlign:"center",opacity:0.45,fontSize:11,lineHeight:1.4}}>⬆<br/>Upload PNG</div>
                }
                <input id="logo-upload" type="file" accept="image/png,image/svg+xml,image/webp" style={{display:"none"}}
                  onChange={e=>{
                    const f=e.target.files[0];if(!f)return;
                    const r=new FileReader();
                    r.onload=ev=>set("logoDataUrl")(ev.target.result);
                    r.readAsDataURL(f);
                    e.target.value="";
                  }}/>
              </div>
              {/* Controls */}
              <div style={{flex:1,minWidth:160}}>
                <div style={{marginBottom:10}}>
                  <label style={S.lbl}>OPACITY — {Math.round((b.logoOpacity??0.75)*100)}%</label>
                  <input type="range" min={0.1} max={1} step={0.05} value={b.logoOpacity??0.75}
                    onChange={e=>set("logoOpacity")(Number(e.target.value))}
                    style={{width:"100%",accentColor:b.colorAccent}}/>
                </div>
                <div style={{marginBottom:10}}>
                  <label style={S.lbl}>SIZE — {Math.round((b.logoSize??0.10)*100)}% of canvas width</label>
                  <input type="range" min={0.04} max={0.25} step={0.01} value={b.logoSize??0.10}
                    onChange={e=>set("logoSize")(Number(e.target.value))}
                    style={{width:"100%",accentColor:b.colorAccent}}/>
                </div>
                <div>
                  <label style={S.lbl}>POSITION</label>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginTop:4}}>
                    {[["tl","↖ Top left"],["tr","↗ Top right"],["bl","↙ Bottom left"],["br","↘ Bottom right"]].map(([k,l])=>(
                      <button key={k} style={{...S.sm,fontSize:11,padding:"6px 8px",background:(b.logoPosition||"br")===k?"rgba(42,157,143,0.25)":"rgba(255,255,255,0.06)",border:`1px solid ${(b.logoPosition||"br")===k?"#2A9D8F":"rgba(255,255,255,0.12)"}`}} onClick={()=>set("logoPosition")(k)}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {b.logoDataUrl&&(
              <button style={{...S.sm,marginTop:8,fontSize:11,background:"rgba(230,57,70,0.15)",border:"1px solid rgba(230,57,70,0.3)"}} onClick={()=>set("logoDataUrl")("")}>✕ Remove logo</button>
            )}
            {!b.logoDataUrl&&(
              <div style={{marginTop:8}}>
                <label style={{...S.lbl,marginBottom:4}}>TEXT FALLBACK (if no logo)</label>
                <input value={b.channelName||""} onChange={e=>set("channelName")(e.target.value)} placeholder="e.g. WalesLaw" style={{...S.inp,fontSize:13,padding:"9px 12px"}}/>
              </div>
            )}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div>
              <label style={S.lbl}>CARD CORNER RADIUS (px)</label>
              <input type="number" min={0} max={50} value={b.cornerRadius} onChange={e=>set("cornerRadius")(Number(e.target.value))} style={S.inp}/>
            </div>
          </div>
          <label style={S.lbl}>ICON STYLE</label>
          <div style={{display:"flex",gap:8,marginTop:6}}>
            {["line","filled"].map(v=>(
              <button key={v} onClick={()=>set("iconStyle")(v)} style={{...S.sm,background:b.iconStyle===v?b.colorPositive:"rgba(255,255,255,0.07)",border:`1px solid ${b.iconStyle===v?b.colorPositive:"rgba(255,255,255,0.13)"}`,padding:"8px 22px",textTransform:"capitalize"}}>
                {v==="line"?"⊘ Line":"● Filled"}
              </button>
            ))}
          </div>
        </div>
        {/* ── BRAND ASSETS ── */}
        <div style={S.section}>
          <div style={S.shead}>Brand Assets</div>
          <div style={{fontSize:12,opacity:0.5,marginBottom:16,lineHeight:1.5}}>
            Title cards and endboards are saved with your brand and export as PNGs for all three aspect ratios in one click.
            In Premiere, drop them at the start/end of your sequence on V2.
          </div>
          <BrandAssets b={b} set={set} S={S}/>
        </div>
        {/* Delete brand — only when editing existing */}
        {onDelete&&(
          <div style={{...S.section,borderColor:"rgba(230,57,70,0.2)",marginTop:24}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:12,opacity:0.4}}>Permanently delete this brand and all its projects</div>
              <button onClick={()=>{if(window.confirm(`Delete "${b.name}"? All projects will also be deleted.`)) onDelete();}}
                style={{background:"rgba(230,57,70,0.15)",border:"1px solid rgba(230,57,70,0.4)",color:"#E63946",padding:"8px 18px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:700}}>
                🗑 Delete Brand
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  API KEY SETUP  — shown when no key is stored
// ═══════════════════════════════════════════════════════════════
function ApiKeyBanner({onSaved}){
  const [key,setKey]=useState("");
  const [show,setShow]=useState(false);
  const save=()=>{
    if(!key.trim())return;
    localStorage.setItem("anthropic_api_key",key.trim());
    onSaved();
  };
  if(!show) return(
    <div style={{background:"rgba(230,57,70,0.12)",border:"1px solid rgba(230,57,70,0.35)",borderRadius:10,padding:"12px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",fontFamily:"Montserrat,Arial,sans-serif"}}>
      <span style={{fontSize:13,color:"#fff",flex:1,opacity:0.85}}>⚠️ No Anthropic API key set — script analysis won't work.</span>
      <button onClick={()=>setShow(true)} style={{background:"#E63946",border:"none",color:"#fff",padding:"8px 18px",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>Set API Key</button>
    </div>
  );
  return(
    <div style={{background:"rgba(230,57,70,0.12)",border:"1px solid rgba(230,57,70,0.35)",borderRadius:10,padding:"16px 18px",marginBottom:16,fontFamily:"Montserrat,Arial,sans-serif"}}>
      <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:4}}>Anthropic API Key</div>
      <div style={{fontSize:11,opacity:0.55,marginBottom:12,lineHeight:1.5}}>
        Get a key at <span style={{color:"#2A9D8F"}}>console.anthropic.com</span> → API Keys. It's stored only in this browser, never sent anywhere except Anthropic.
      </div>
      <div style={{display:"flex",gap:8}}>
        <input
          type="password"
          value={key}
          onChange={e=>setKey(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&save()}
          placeholder="sk-ant-..."
          style={{flex:1,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,padding:"10px 13px",color:"#fff",fontSize:13,fontFamily:"inherit",outline:"none"}}
        />
        <button onClick={save} disabled={!key.trim()} style={{background:key.trim()?"#2A9D8F":"rgba(255,255,255,0.1)",border:"none",color:"#fff",padding:"10px 20px",borderRadius:8,cursor:key.trim()?"pointer":"not-allowed",fontSize:13,fontWeight:700,fontFamily:"inherit",transition:"background 0.2s"}}>Save</button>
        <button onClick={()=>setShow(false)} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",padding:"10px 14px",borderRadius:8,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>✕</button>
      </div>
    </div>
  );
}

function useApiKey(){
  return{hasKey:true,refresh:()=>{}};
}


// ═══════════════════════════════════════════════════════════════
//  ANIMATED ROBOT  — used during analysis loading state
// ═══════════════════════════════════════════════════════════════
function AnimatedRobot(){
  return(
    <div style={{position:"relative",width:120,height:120,margin:"0 auto 8px"}}>
      <style>{`
        @keyframes robotFloat {
          0%,100%{transform:translateY(0px)}
          50%{transform:translateY(-10px)}
        }
        @keyframes robotEye {
          0%,90%,100%{transform:scaleY(1)}
          95%{transform:scaleY(0.08)}
        }
        @keyframes robotAntenna {
          0%,100%{transform:rotate(-8deg)}
          50%{transform:rotate(8deg)}
        }
        @keyframes robotScan {
          0%{opacity:0.2;transform:scaleX(0.4)}
          50%{opacity:1;transform:scaleX(1)}
          100%{opacity:0.2;transform:scaleX(0.4)}
        }
        @keyframes robotGlow {
          0%,100%{box-shadow:0 0 12px rgba(42,157,143,0.4)}
          50%{box-shadow:0 0 28px rgba(42,157,143,0.9)}
        }
        @keyframes dotBounce {
          0%,80%,100%{transform:translateY(0);opacity:0.4}
          40%{transform:translateY(-6px);opacity:1}
        }
      `}</style>

      {/* Floating robot body */}
      <div style={{animation:"robotFloat 2.4s ease-in-out infinite",position:"relative"}}>
        <svg width="120" height="110" viewBox="0 0 120 110" xmlns="http://www.w3.org/2000/svg">
          {/* Antenna */}
          <g style={{transformOrigin:"60px 18px",animation:"robotAntenna 1.8s ease-in-out infinite"}}>
            <line x1="60" y1="18" x2="60" y2="6" stroke="#2A9D8F" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="60" cy="4" r="4" fill="#E63946" style={{animation:"robotGlow 1.8s ease-in-out infinite"}}/>
          </g>
          {/* Head */}
          <rect x="28" y="18" width="64" height="48" rx="12" fill="#1D3557" stroke="#2A9D8F" strokeWidth="2.5"/>
          {/* Eye left */}
          <g style={{transformOrigin:"45px 38px",animation:"robotEye 3.2s ease-in-out infinite"}}>
            <rect x="38" y="30" width="14" height="16" rx="4" fill="#2A9D8F"/>
            <rect x="41" y="33" width="6" height="6" rx="2" fill="#fff" opacity="0.9"/>
          </g>
          {/* Eye right */}
          <g style={{transformOrigin:"75px 38px",animation:"robotEye 3.2s ease-in-out infinite 0.15s"}}>
            <rect x="68" y="30" width="14" height="16" rx="4" fill="#2A9D8F"/>
            <rect x="71" y="33" width="6" height="6" rx="2" fill="#fff" opacity="0.9"/>
          </g>
          {/* Mouth — scan line */}
          <rect x="44" y="54" width="32" height="5" rx="2.5" fill="#E63946" style={{transformOrigin:"60px 56px",animation:"robotScan 1.2s ease-in-out infinite"}}/>
          {/* Neck */}
          <rect x="54" y="66" width="12" height="8" rx="3" fill="#1D3557" stroke="#2A9D8F" strokeWidth="2"/>
          {/* Body */}
          <rect x="22" y="74" width="76" height="32" rx="10" fill="#1D3557" stroke="#2A9D8F" strokeWidth="2.5"/>
          {/* Body panel */}
          <rect x="32" y="81" width="56" height="18" rx="5" fill="rgba(42,157,143,0.15)" stroke="rgba(42,157,143,0.4)" strokeWidth="1.5"/>
          {/* Panel dots */}
          <circle cx="44" cy="90" r="3" fill="#E63946" opacity="0.9"/>
          <circle cx="56" cy="90" r="3" fill="#2A9D8F" opacity="0.9"/>
          <circle cx="68" cy="90" r="3" fill="#E63946" opacity="0.5"/>
          <circle cx="80" cy="90" r="3" fill="#2A9D8F" opacity="0.5"/>
          {/* Arms */}
          <rect x="4" y="76" width="18" height="10" rx="5" fill="#1D3557" stroke="#2A9D8F" strokeWidth="2"/>
          <rect x="98" y="76" width="18" height="10" rx="5" fill="#1D3557" stroke="#2A9D8F" strokeWidth="2"/>
        </svg>
      </div>
    </div>
  );
}

function ThinkingDots(){
  return(
    <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:4}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{
          width:8,height:8,borderRadius:"50%",
          background:"#2A9D8F",
          animation:`dotBounce 1.2s ease-in-out infinite`,
          animationDelay:`${i*0.18}s`
        }}/>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CONFIRM DIALOG  — replaces window.confirm (blocked in some hosts)
// ═══════════════════════════════════════════════════════════════
function ConfirmDialog({message, onConfirm, onCancel}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:20}}>
      <div style={{background:"#141e2e",border:"1px solid rgba(255,255,255,0.15)",borderRadius:14,padding:"24px 28px",maxWidth:380,width:"100%",fontFamily:"Montserrat,Arial,sans-serif"}}>
        <div style={{fontSize:15,fontWeight:600,color:"#fff",marginBottom:20,lineHeight:1.5}}>{message}</div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onCancel} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",padding:"9px 20px",borderRadius:8,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>Cancel</button>
          <button onClick={onConfirm} style={{background:"#E63946",border:"none",color:"#fff",padding:"9px 20px",borderRadius:8,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:700}}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  HOME
// ═══════════════════════════════════════════════════════════════
function Home({brands,projects,onNewBrand,onEditBrand,onOpenProject,onNewProject,onDeleteBrand,onDeleteProject,onRenameProject,onSave,onLoadVersion}){
  const [newProjName,setNewProjName]=useState("");
  const [selBrandId,setSelBrandId]=useState(brands[0]?.id||null);
  const [confirmDialog,setConfirmDialog]=useState(null);
  const [showApiPanel,setShowApiPanel]=useState(false);
  const [saveStatus,setSaveStatus]=useState("");
  const [showVersions,setShowVersions]=useState(false);
  const [versions,setVersions]=useState([]);
  const [apiKeyInput,setApiKeyInput]=useState("");
  const allTemplates=load(TMPL_STORE);
  const templateCountForBrand=id=>allTemplates.filter(t=>t.brandId===id||t.brandId===null).length;
  const [hasApiKey,setHasApiKey]=useState(!!localStorage.getItem("anthropic_api_key"));
  const confirm=(message,onConfirm)=>setConfirmDialog({message,onConfirm});
  const closeConfirm=()=>setConfirmDialog(null);
  const saveApiKey=()=>{
    if(!apiKeyInput.trim())return;
    localStorage.setItem("anthropic_api_key",apiKeyInput.trim());
    setHasApiKey(true);setShowApiPanel(false);setApiKeyInput("");
  };
  const clearApiKey=()=>{
    localStorage.removeItem("anthropic_api_key");
    setHasApiKey(false);setApiKeyInput("");
  };
  const selBrand=brands.find(b=>b.id===selBrandId);
  const brandProjects=projects.filter(p=>p.brandId===selBrandId);
  const inp={width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:9,padding:"12px 14px",color:"#fff",fontSize:14,fontFamily:"Montserrat,Arial,sans-serif",boxSizing:"border-box",outline:"none"};
  const sm={background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.13)",color:"#fff",padding:"7px 13px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600};
  return(
    <div style={{fontFamily:"Montserrat,Arial,sans-serif",background:"#0b1320",minHeight:"100vh",color:"#fff"}}>
      {confirmDialog&&<ConfirmDialog message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={closeConfirm}/>}
      {/* Header */}
      <div style={{background:"#1D3557",padding:"14px 26px",display:"flex",alignItems:"center",gap:12,borderBottom:"1px solid rgba(0,0,0,0.3)"}}>
        <div style={{width:6,height:38,background:"#E63946",borderRadius:4,flexShrink:0}}/>
        <div><div style={{fontWeight:900,fontSize:20,letterSpacing:0.5}}>INFOGRAPHIC STUDIO</div><div style={{fontSize:11,opacity:0.38,marginTop:1}}>Graphics · Captions · Multi-ratio Premiere export</div></div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          {saveStatus&&<span style={{fontSize:11,color:saveStatus.includes("!")||saveStatus.includes("Loaded")?"#2A9D8F":"#E63946",fontWeight:600}}>{saveStatus}</span>}
          <button onClick={async()=>{setSaveStatus("Saving...");const ok=await onSave();setSaveStatus(ok?"Saved!":"Error");setTimeout(()=>setSaveStatus(""),2000);}}
            style={{background:"rgba(42,157,143,0.2)",border:"1px solid rgba(42,157,143,0.4)",color:"#fff",padding:"7px 14px",borderRadius:7,cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:600}}>
            💾 Save
          </button>
          <button onClick={async()=>{
            const name=prompt("Snapshot name (e.g. 'Before client meeting'):");
            if(!name) return;
            setSaveStatus("Saving snapshot...");
            const ok=await onSave(name);
            setSaveStatus(ok?"Snapshot saved!":"Error");
            setTimeout(()=>setSaveStatus(""),2500);
          }}
            style={{background:"rgba(42,157,143,0.1)",border:"1px solid rgba(42,157,143,0.3)",color:"#fff",padding:"7px 14px",borderRadius:7,cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:600}}>
            📸 Save As
          </button>
          <div style={{position:"relative"}}>
            <button onClick={async()=>{
              if(showVersions){setShowVersions(false);return;}
              setVersions([]);setShowVersions(true);
              try{
                const r=await fetch("/api/studio?versions=1");
                const d=await r.json();
                setVersions(d.versions||[]);
              }catch{setVersions([]);}
            }}
              style={{background:showVersions?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",color:"#fff",padding:"7px 14px",borderRadius:7,cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:600}}>
              📂 Versions {showVersions?"▲":"▼"}
            </button>
            {showVersions&&(
              <div style={{position:"absolute",top:"100%",right:0,marginTop:6,background:"#141e2e",border:"1px solid rgba(255,255,255,0.15)",borderRadius:10,minWidth:280,maxHeight:320,overflowY:"auto",zIndex:999,boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
                {versions.length===0?(
                  <div style={{padding:"16px 18px",fontSize:12,opacity:0.5,textAlign:"center"}}>No snapshots yet — use Save As to create one</div>
                ):versions.map((v,i)=>{
                  const name=(v.pathname||"").split("/").pop().replace(/\.json.*$/,"").replace(/^\d{4}-\d{2}-\d{2}T[\d-]+_/,"").replace(/_/g," ");
                  const date=new Date(v.uploadedAt).toLocaleString();
                  return(
                    <div key={i} onClick={async()=>{
                      setSaveStatus("Loading...");setShowVersions(false);
                      try{
                        const lr=await fetch("/api/studio?load="+encodeURIComponent(v.pathname));
                        const ld=await lr.json();
                        if(ld.brands){onLoadVersion(ld);setSaveStatus("Loaded!");}
                        else setSaveStatus("Failed");
                      }catch{setSaveStatus("Error");}
                      setTimeout(()=>setSaveStatus(""),2000);
                    }}
                      style={{padding:"10px 16px",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,0.06)",transition:"background 0.15s"}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(42,157,143,0.15)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{name||"Untitled"}</div>
                      <div style={{fontSize:10,opacity:0.4}}>{date}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* API Key panel */}
      {showApiPanel&&(
        <div style={{background:"#0f1927",borderBottom:"1px solid rgba(255,255,255,0.1)",padding:"16px 26px",fontFamily:"Montserrat,Arial,sans-serif"}}>
          <div style={{maxWidth:880,margin:"0 auto"}}>
            <div style={{fontSize:12,fontWeight:700,opacity:0.6,marginBottom:10,letterSpacing:1}}>ANTHROPIC API KEY</div>
            {hasApiKey
              ?<div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                  <div style={{fontSize:13,color:"#2A9D8F",fontWeight:600}}>✓ API key is set and active</div>
                  <button onClick={clearApiKey} style={{background:"rgba(230,57,70,0.2)",border:"1px solid rgba(230,57,70,0.4)",color:"#fff",padding:"7px 16px",borderRadius:7,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600}}>Remove key</button>
                  <button onClick={()=>setShowApiPanel(false)} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",padding:"7px 14px",borderRadius:7,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>✕ Close</button>
                </div>
              :<div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={e=>setApiKeyInput(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&saveApiKey()}
                    placeholder="sk-ant-api03-..."
                    autoFocus
                    style={{flex:1,minWidth:260,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,padding:"10px 14px",color:"#fff",fontSize:13,fontFamily:"inherit",outline:"none"}}
                  />
                  <button onClick={saveApiKey} disabled={!apiKeyInput.trim()} style={{background:apiKeyInput.trim()?"#2A9D8F":"rgba(255,255,255,0.1)",border:"none",color:"#fff",padding:"10px 20px",borderRadius:8,cursor:apiKeyInput.trim()?"pointer":"not-allowed",fontSize:13,fontWeight:700,fontFamily:"inherit",transition:"background 0.2s"}}>Save</button>
                  <button onClick={()=>setShowApiPanel(false)} style={{background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",padding:"10px 14px",borderRadius:8,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>Cancel</button>
                  <div style={{width:"100%",fontSize:11,opacity:0.45,marginTop:2}}>Get a key at <strong>console.anthropic.com</strong> → API Keys. Stored only in this browser.</div>
                </div>
            }
          </div>
        </div>
      )}
      <div style={{maxWidth:880,margin:"0 auto",padding:"28px 18px",display:"grid",gridTemplateColumns:"260px 1fr",gap:20}}>
        {/* Brands sidebar */}
        <div>
          <div style={{fontWeight:800,fontSize:11,opacity:0.45,letterSpacing:1,marginBottom:10}}>BRANDS</div>
          {brands.map(b=>(
            <div key={b.id} style={{background:selBrandId===b.id?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${selBrandId===b.id?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.07)"}`,borderRadius:10,padding:"11px 13px",marginBottom:7,cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"all 0.15s"}} onClick={()=>setSelBrandId(b.id)}>
              <div style={{display:"flex",gap:4,flexShrink:0}}>
                {[b.colorAccent,b.colorPrimary,b.colorPositive].map((c,i)=><div key={i} style={{width:10,height:10,borderRadius:2,background:c}}/>)}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.name}</div>
                <div style={{fontSize:10,opacity:0.4,fontFamily:`"${b.fontFamily}",Arial,sans-serif`}}>{b.fontFamily}</div>
              </div>
              {templateCountForBrand(b.id)>0&&(
                <span style={{fontSize:9,fontWeight:700,background:"rgba(42,157,143,0.2)",border:"1px solid rgba(42,157,143,0.4)",color:"#2A9D8F",padding:"2px 6px",borderRadius:4,flexShrink:0}}>{templateCountForBrand(b.id)} tpl{templateCountForBrand(b.id)!==1?"s":""}</span>
              )}
              <button style={{...sm,padding:"4px 8px",fontSize:10}} onClick={e=>{e.stopPropagation();onEditBrand(b.id);}}>✏</button>
            </div>
          ))}
          <button style={{...sm,width:"100%",marginTop:4,padding:"10px",textAlign:"center"}} onClick={onNewBrand}>+ New Brand</button>
        </div>

        {/* Projects panel */}
        <div>
          {selBrand?(
            <>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                <div style={{fontWeight:800,fontSize:11,opacity:0.45,letterSpacing:1}}>PROJECTS — {selBrand.name}</div>
              </div>
              {/* New project */}
              <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:12,padding:"16px",marginBottom:14}}>
                <div style={{fontWeight:800,fontSize:12,opacity:0.6,marginBottom:10}}>NEW PROJECT</div>
                <input value={newProjName} onChange={e=>setNewProjName(e.target.value)} placeholder="Project name — e.g. EP01 Rent Increase" style={inp} onKeyDown={e=>e.key==="Enter"&&newProjName.trim()&&(onNewProject(selBrandId,newProjName.trim()),setNewProjName(""))}/>
                <button disabled={!newProjName.trim()} style={{width:"100%",background:newProjName.trim()?"#E63946":"rgba(255,255,255,0.07)",border:"none",borderRadius:10,padding:"12px",color:"#fff",fontSize:14,fontWeight:700,cursor:newProjName.trim()?"pointer":"not-allowed",fontFamily:"inherit",marginTop:10,opacity:newProjName.trim()?1:0.4,transition:"background 0.2s"}}
                  onClick={()=>{if(newProjName.trim()){onNewProject(selBrandId,newProjName.trim());setNewProjName("");}}}>
                  Create Project →
                </button>
              </div>
              {/* Project list */}
              {brandProjects.length>0?[...brandProjects].reverse().map(p=>(
                <div key={p.id} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:11,padding:"13px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:12,cursor:"pointer",transition:"background 0.15s"}} onClick={()=>onOpenProject(p.id)}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:14,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                    <div style={{fontSize:11,opacity:0.4,display:"flex",gap:12,flexWrap:"wrap"}}>
                      {p.subtitles?.length>0&&<span>📄 {p.subtitles.length} lines</span>}
                      {p.graphics?.length>0&&<span>🎨 {p.graphics.length} graphics</span>}
                      <span>{new Date(p.createdAt).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
                    <button style={{...sm,padding:"4px 8px",fontSize:10,opacity:0.5}} onClick={()=>{const n=prompt("Rename project:",p.name);if(n&&n.trim())onRenameProject(p.id,n.trim());}}>✏</button>
                    <button style={{...sm,background:"#E63946",border:"1px solid #E63946"}} onClick={()=>onOpenProject(p.id)}>Open →</button>
                    <button style={{...sm,opacity:0.45}} onClick={()=>confirm(`Delete project "${p.name}"?`,()=>{onDeleteProject(p.id);closeConfirm();})}>🗑</button>
                  </div>
                </div>
              )):<div style={{textAlign:"center",opacity:0.25,padding:"30px 0",fontSize:13}}>No projects yet</div>}
            </>
          ):<div style={{textAlign:"center",opacity:0.25,padding:"60px 0"}}><div style={{fontSize:36,marginBottom:10}}>←</div><div style={{fontSize:14}}>Select or create a brand to get started</div></div>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════════════════════
function App(){
  const [brands,setBrands]=useState(()=>load(BS));
  const [projects,setProjects]=useState(()=>load(PS));
  const [view,setView]=useState("home");       // home | brand-edit | project
  const [editBrandId,setEditBrandId]=useState(null);
  const [activeProjectId,setActiveProjectId]=useState(null);
  const syncTimer=useRef(null);

  // ── Server sync: load on mount ──
  useEffect(()=>{
    fetch("/api/studio").then(r=>r.json()).then(d=>{
      if(d.brands?.length){setBrands(d.brands);save(BS,d.brands);}
      if(d.projects?.length){setProjects(d.projects);save(PS,d.projects);}
      if(d.templates?.length) save(TMPL_STORE,d.templates);
    }).catch(()=>{});
  },[]);

  // ── Server sync: debounced save ──
  const syncToServer=useCallback((b,p)=>{
    if(syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current=setTimeout(()=>{
      const templates=load(TMPL_STORE);
      fetch("/api/studio",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({brands:b,projects:p,templates})}).catch(()=>{});
    },1500);
  },[]);

  useEffect(()=>{save(BS,brands);syncToServer(brands,projects);},[brands]);
  useEffect(()=>{save(PS,projects);syncToServer(brands,projects);},[projects]);

  useEffect(()=>{ brands.forEach(b=>loadFont(b.fontFamily)); },[brands]);

  const activeBrand=brands.find(b=>b.id===projects.find(p=>p.id===activeProjectId)?.brandId)||brands[0];
  const activeProject=projects.find(p=>p.id===activeProjectId);

  const updateProject=useCallback((changes)=>{
    setProjects(ps=>ps.map(p=>p.id===activeProjectId?{...p,...changes}:p));
  },[activeProjectId]);

  if(view==="brand-edit"){
    const editing=editBrandId?brands.find(b=>b.id===editBrandId):null;
    return(
      <BrandEditor
        brand={editing||newBrand("")}
        allBrands={brands}
        onDelete={editBrandId?()=>{setBrands(bs=>bs.filter(x=>x.id!==editBrandId));setProjects(ps=>ps.filter(p=>p.brandId!==editBrandId));setView("home");setEditBrandId(null);}:null}
        onSave={b=>{
          if(editBrandId) setBrands(bs=>bs.map(x=>x.id===editBrandId?{...x,...b,id:editBrandId}:x));
          else setBrands(bs=>[...bs,{...b,id:Date.now(),createdAt:new Date().toISOString()}]);
          setView("home");setEditBrandId(null);
        }}
        onCancel={()=>{setView("home");setEditBrandId(null);}}
      />
    );
  }

  if(view==="project"&&activeProject&&activeBrand){
    return(
      <ProjectView
        project={activeProject}
        brand={activeBrand}
        updateProject={updateProject}
        onBack={()=>setView("home")}
      />
    );
  }

  return(
    <Home
      brands={brands}
      projects={projects}
      onNewBrand={()=>{setEditBrandId(null);setView("brand-edit");}}
      onEditBrand={id=>{setEditBrandId(id);setView("brand-edit");}}
      onNewProject={(brandId,name)=>{const p=newProject(brandId,name);setProjects(ps=>[...ps,p]);setActiveProjectId(p.id);setView("project");}}
      onOpenProject={id=>{setActiveProjectId(id);setView("project");}}
      onDeleteBrand={id=>{setBrands(bs=>bs.filter(b=>b.id!==id));setProjects(ps=>ps.filter(p=>p.brandId!==id));}}
      onDeleteProject={id=>setProjects(ps=>ps.filter(p=>p.id!==id))}
      onRenameProject={(id,name)=>setProjects(ps=>ps.map(p=>p.id===id?{...p,name}:p))}
      onSave={(snapshotName)=>{
        const templates=load(TMPL_STORE);
        const url=snapshotName?"/api/studio?snapshot="+encodeURIComponent(snapshotName):"/api/studio";
        return fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({brands,projects,templates})}).then(r=>r.ok).catch(()=>false);
      }}
      onLoadVersion={(d)=>{
        if(d.brands){setBrands(d.brands);save(BS,d.brands);}
        if(d.projects){setProjects(d.projects);save(PS,d.projects);}
        if(d.templates) save(TMPL_STORE,d.templates);
      }}
    />
  );
}

export default App;
