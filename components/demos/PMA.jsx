"use client";

import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";

// ════════════════════════════════════════════════════════════════
// PSC PRODUCTION MODULE — BUNDLED v2
// All modules inlined. API-wired. Ready for Vercel deployment.
// Set VITE_API_URL in your env vars to point at your backend API.
// ════════════════════════════════════════════════════════════════

// ═══ psc_constants.js ═══
// All enumerations, role definitions, and permissions matrix.
// Import this everywhere — never hardcode these values elsewhere.

const STATUSES = ["DEVELOPMENT","READY_TO_SHOOT","FILMING","IN_EDIT","DELIVERED","ARCHIVED"];
const STATUS_META = {
  DEVELOPMENT:   { label:"Development",    cls:"b-dev",  step:0 },
  READY_TO_SHOOT:{ label:"Ready to Shoot", cls:"b-rts",  step:1 },
  FILMING:       { label:"Filming",        cls:"b-film", step:2 },
  IN_EDIT:       { label:"In Edit",        cls:"b-edit", step:3 },
  DELIVERED:     { label:"Delivered",      cls:"b-del",  step:4 },
  ARCHIVED:      { label:"Archived",       cls:"b-arc",  step:5 },
};

const TONES        = ["FUNNY","EMOTIONAL","OBSERVATIONAL","INVESTIGATIVE","INSPIRATIONAL","OTHER"];
const PRIORITIES   = ["MUST","SHOULD","NICE"];
const FORMATS      = { RATIO_16_9:"16:9", RATIO_9_16:"9:16", RATIO_1_1:"1:1" };
const FORMAT_DESC  = {
  RATIO_16_9:"Broadcast / Website / YouTube",
  RATIO_9_16:"TikTok / Reels / Shorts",
  RATIO_1_1:"Instagram / Facebook"
};
const PLATFORMS    = ["BROADCAST","WEBSITE","YOUTUBE","TIKTOK","INSTAGRAM_REELS","YOUTUBE_SHORTS","INSTAGRAM_FEED","FACEBOOK","OTHER"];
const PLAT_LBL     = {
  BROADCAST:"Broadcast",WEBSITE:"Website",YOUTUBE:"YouTube",TIKTOK:"TikTok",
  INSTAGRAM_REELS:"IG Reels",YOUTUBE_SHORTS:"YT Shorts",INSTAGRAM_FEED:"IG Feed",
  FACEBOOK:"Facebook",OTHER:"Other"
};
const CAPTION_OPTS = ["NONE","BURNT_IN","SRT","BOTH"];
const LANG_OPTS    = ["WELSH","ENGLISH","BILINGUAL"];
const REFRAME_OPTS = ["KEEP_SUBJECT_CENTRE","ALLOW_CROP_EDGES","AVOID_LOWER_THIRD_GRAPHICS","GRAPHICS_SAFE_AREA_SOCIAL"];
const REFRAME_LBL  = {
  KEEP_SUBJECT_CENTRE:"Keep Subject Centre",
  ALLOW_CROP_EDGES:"Allow Crop Edges",
  AVOID_LOWER_THIRD_GRAPHICS:"Avoid Lower Third Gfx",
  GRAPHICS_SAFE_AREA_SOCIAL:"Gfx Safe Area Social"
};
const DURATIONS    = ["30 sec","60 sec","90 sec","2:00","3:00","5:00","Other"];
const LINK_TYPES   = ["Rushes","Footage","Transcript","Audio","Reference","Script","Other"];

// ─── LANGUAGES ────────────────────────────────────────────────────────────────
const LANGUAGES = { CY:"Welsh", EN:"English" };
const TRANSLATION_STATUS = {
  NOT_REQUIRED: { label:"Not Required", icon:null },
  PENDING:      { label:"Pending",      icon:"⏳" },
  AUTO_TRANSLATED: { label:"Auto-translated", icon:"🌐" },
  REVIEWED:     { label:"Reviewed",     icon:"✓" },
};
const TRANSLATION_METHOD = { MANUAL:"MANUAL", MACHINE:"MACHINE" };

// ─── ROLES & PERMISSIONS ──────────────────────────────────────────────────────
// Organisation-level roles
const ORG_ROLES = {
  OWNER:   { label:"Owner",   level:100 },
  ADMIN:   { label:"Admin",   level:90  },
  MANAGER: { label:"Manager", level:70  },
};
// Team-level roles
const TEAM_ROLES = {
  PRODUCER:   { label:"Producer",   level:60 },
  EDITOR:     { label:"Editor",     level:50 },
  SOCIAL:     { label:"Social",     level:40 },
  RESEARCHER: { label:"Researcher", level:35 },
  VIEWER:     { label:"Viewer",     level:10 },
};
const ALL_ROLES = { ...ORG_ROLES, ...TEAM_ROLES };

// Permissions matrix — what each role can do
// Format: { action: minimumLevel }
const PERMISSIONS = {
  CREATE_STORY:        60,  // Producer+
  EDIT_BRIEF:          60,  // Producer+
  EDIT_HANDOVER:       50,  // Editor+
  EDIT_DELIVERABLES:   50,  // Editor+
  EDIT_MEDIA:          50,  // Editor+
  VIEW_STORY:          10,  // All
  MANAGE_TEAMS:        70,  // Manager+
  MANAGE_USERS:        90,  // Admin+
  MANAGE_ORG:         100,  // Owner only
  EXPORT_PACK:         40,  // Social+
  REVIEW_TRANSLATION:  50,  // Editor+
  DELETE_STORY:        70,  // Manager+
  CHANGE_VISIBILITY:   60,  // Producer+
};

// Story visibility levels
const VISIBILITY = {
  PRIVATE:             { label:"Private",              icon:"🔒", desc:"Only you and admins" },
  TEAM_ONLY:           { label:"Team Only",            icon:"👥", desc:"Your team members" },
  ORGANISATION_VISIBLE:{ label:"Organisation Visible", icon:"🏢", desc:"Everyone in your organisation" },
};

const canDo = (userRole, action) => {
  const userLevel = ALL_ROLES[userRole]?.level ?? 0;
  const required  = PERMISSIONS[action] ?? 999;
  return userLevel >= required;
};

// ═══ psc_styles.js ═══
// All CSS for the PSC Production Module.
// Single source of truth — import CSS into the root component only.

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');`;

const CSS = `
${FONT_IMPORT}
/* ── SCOPED ROOT — all PMA styles contained under .pma ── */
.pma{
  --bg:#0a0c10;--surface:#12141b;--surface2:#181b25;--surface3:#1e2230;--surface4:#252a3a;
  --border:#1e2230;--border2:#2a3048;
  --accent:#4f72ff;--accent-hover:#3d5de8;--accent-dim:rgba(79,114,255,0.10);--accent-mid:rgba(79,114,255,0.22);
  --green:#22c55e;--green-dim:rgba(34,197,94,0.10);
  --amber:#f59e0b;--amber-dim:rgba(245,158,11,0.10);
  --red:#ef4444;--red-dim:rgba(239,68,68,0.10);
  --purple:#a78bfa;--purple-dim:rgba(167,139,250,0.10);
  --teal:#2dd4bf;--teal-dim:rgba(45,212,191,0.10);
  --text:#e2e4ef;--text2:#8b92b0;--text3:#4e5672;--text4:#363d58;
  --radius:8px;--radius-sm:6px;--radius-lg:12px;--radius-xl:16px;
  --space-xs:4px;--space-sm:8px;--space-md:16px;--space-lg:24px;--space-xl:32px;--space-2xl:48px;
  background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;font-size:14px;line-height:1.6;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;
}
.pma-app{display:flex;height:100vh;overflow:hidden}
.pma *,.pma *::before,.pma *::after{box-sizing:border-box;margin:0;padding:0}
.pma h1,.pma h2,.pma h3,.pma h4,.pma h5{font-family:'Syne',sans-serif;letter-spacing:-0.01em}
.pma button{font-family:'DM Sans',sans-serif;cursor:pointer}
.pma input,.pma textarea,.pma select{font-family:'DM Sans',sans-serif}
.pma a{text-decoration:none;color:inherit}
.pma ::-webkit-scrollbar{width:4px;height:4px}
.pma ::-webkit-scrollbar-track{background:transparent}
.pma ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px}
.pma ::-webkit-scrollbar-thumb:hover{background:var(--text4)}

/* ── LAYOUT ────────────────────────────────── */
.sidebar{width:252px;min-width:252px;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.topbar{height:52px;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 24px;flex-shrink:0;gap:12px}
.content{flex:1;overflow-y:auto;padding:28px 32px;scroll-behavior:smooth}

/* ── SIDEBAR ────────────────────────────────── */
.sb-logo{padding:16px 16px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}
.sb-org-avatar{width:32px;height:32px;border-radius:8px;background:var(--accent);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:13px;font-weight:800;color:#fff;flex-shrink:0;overflow:hidden}
.sb-org-avatar img{width:100%;height:100%;object-fit:cover}
.sb-org-name{font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-org-tag{font-size:10px;color:var(--text3);margin-top:2px}
.sb-nav{flex:1;overflow-y:auto;padding:8px 6px}
.sb-section{font-size:10px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:var(--text4);padding:14px 10px 6px}
.sb-item{display:flex;align-items:center;gap:9px;padding:7px 10px;border-radius:var(--radius-sm);cursor:pointer;color:var(--text3);font-size:13px;font-weight:500;margin-bottom:1px;white-space:nowrap;overflow:hidden}
.sb-item:hover{background:var(--surface2);color:var(--text2)}
.sb-item.active{background:var(--accent-dim);color:var(--accent);font-weight:600}
.sb-icon{font-size:15px;width:20px;text-align:center;flex-shrink:0}
.sb-divider{height:1px;background:var(--border);margin:6px 8px}
.sb-story{padding:8px 10px;border-radius:var(--radius-sm);cursor:pointer;margin-bottom:1px}
.sb-story:hover{background:var(--surface2)}
.sb-story.active{background:var(--accent-dim)}
.sb-story-title{font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px}
.sb-user{padding:12px 14px;border-top:1px solid var(--border);display:flex;align-items:center;gap:10px;flex-shrink:0}
.sb-user-av{width:28px;height:28px;border-radius:50%;background:var(--surface3);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--text2);flex-shrink:0}
.sb-user-info{flex:1;min-width:0}
.sb-user-name{font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-user-role{font-size:10px;color:var(--text3)}

/* ── BREADCRUMB ────────────────────────────── */
.bc{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text3)}
.bc-sep{color:var(--text4);font-size:11px}
.bc-cur{color:var(--text);font-weight:600}

/* ── BADGES ─────────────────────────────────── */
.badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:600;letter-spacing:.3px;text-transform:uppercase;white-space:nowrap}
.badge-dot{width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0}
.b-dev{background:var(--accent-dim);color:#7b9fff;border:1px solid var(--accent-mid)}
.b-rts{background:var(--amber-dim);color:#fbbf24;border:1px solid rgba(245,158,11,.2)}
.b-film{background:var(--red-dim);color:#f87171;border:1px solid rgba(239,68,68,.2)}
.b-edit{background:var(--purple-dim);color:var(--purple);border:1px solid rgba(167,139,250,.2)}
.b-del{background:var(--green-dim);color:#4ade80;border:1px solid rgba(34,197,94,.2)}
.b-arc{background:rgba(85,94,128,.08);color:var(--text3);border:1px solid var(--border)}
.b-must{background:var(--red-dim);color:#f87171;border:1px solid rgba(239,68,68,.2)}
.b-should{background:var(--amber-dim);color:#fbbf24;border:1px solid rgba(245,158,11,.2)}
.b-nice{background:var(--green-dim);color:#4ade80;border:1px solid rgba(34,197,94,.2)}
.b-teal{background:var(--teal-dim);color:var(--teal);border:1px solid rgba(45,212,191,.2)}
.b-role{background:var(--surface3);color:var(--text2);border:1px solid var(--border2)}

/* ── BUTTONS ─────────────────────────────────── */
.btn{display:inline-flex;align-items:center;gap:7px;padding:8px 16px;border-radius:var(--radius-sm);font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;letter-spacing:0;border:none;white-space:nowrap;cursor:pointer}
.btn-primary{background:var(--accent);color:#fff}
.btn-primary:hover{background:var(--accent-hover)}
.btn-secondary{background:var(--surface3);color:var(--text);border:1px solid var(--border2)}
.btn-secondary:hover{background:var(--surface4)}
.btn-ghost{background:transparent;color:var(--text2);border:1px solid var(--border)}
.btn-ghost:hover{background:var(--surface2);color:var(--text)}
.btn-danger{background:var(--red-dim);color:#f87171;border:1px solid rgba(239,68,68,.2)}
.btn-danger:hover{background:rgba(239,68,68,.18)}
.btn-green{background:var(--green-dim);color:#4ade80;border:1px solid rgba(34,197,94,.2)}
.btn-green:hover{background:rgba(34,197,94,.18)}
.btn-teal{background:var(--teal-dim);color:var(--teal);border:1px solid rgba(45,212,191,.2)}
.btn-teal:hover{background:rgba(45,212,191,.18)}
.btn-sm{padding:6px 12px;font-size:11px}
.btn-xs{padding:4px 9px;font-size:11px}
.btn:disabled{opacity:.35;cursor:not-allowed;pointer-events:none}

/* ── FORM ─────────────────────────────────────── */
.fg{margin-bottom:20px}
.fg:last-child{margin-bottom:0}
.fl{display:block;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:var(--text3);margin-bottom:8px}
.fh{font-size:12px;color:var(--text4);margin-bottom:8px;font-style:normal;line-height:1.5;opacity:.8}
.fi,.fta,.fsel{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 14px;color:var(--text);font-size:13px;outline:none}
.fi:focus,.fta:focus,.fsel:focus{border-color:var(--accent)}
.fi::placeholder,.fta::placeholder{color:var(--text4)}
.fi:disabled,.fta:disabled{opacity:.4;cursor:not-allowed;background:var(--surface)}
.fta{resize:vertical;min-height:88px;line-height:1.6}
.fsel option{background:var(--surface2)}
.frow{display:grid;gap:14px}
.frow-2{grid-template-columns:1fr 1fr}
.frow-3{grid-template-columns:1fr 1fr 1fr}

/* ── CARDS ───────────────────────────────────── */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);margin-bottom:16px}
.card:last-child{margin-bottom:0}
.card-hd{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px}
.card-hd-l{display:flex;align-items:center;gap:10px}
.card-title{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:var(--text);letter-spacing:-0.01em}
.card-sub{font-size:11px;color:var(--text3)}
.card-bd{padding:18px}

/* ── TABS ────────────────────────────────────── */
.tabs{display:flex;border-bottom:1px solid var(--border);margin-bottom:24px;gap:0;overflow-x:auto}
.tab{padding:10px 18px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;letter-spacing:0;cursor:pointer;color:var(--text4);border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap;position:relative}
.tab:hover{color:var(--text2)}
.tab.active{color:var(--accent);border-bottom-color:var(--accent)}

/* ── LANG TOGGLE ─────────────────────────────── */
.lang-toggle{display:inline-flex;border:1px solid var(--border);border-radius:20px;overflow:hidden;background:var(--surface2)}
.lang-btn{padding:4px 14px;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:.5px;cursor:pointer;color:var(--text3);border:none;background:transparent;transition:all .15s}
.lang-btn:hover{color:var(--text2)}
.lang-btn.active{background:var(--accent);color:#fff}

/* ── BILINGUAL FIELD ─────────────────────────── */
.bil-field{border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:4px}
.bil-panel{padding:10px 14px}
.bil-panel+.bil-panel{border-top:1px solid var(--border)}
.bil-panel-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.bil-lang-tag{font-family:'DM Sans',sans-serif;font-size:10px;font-weight:600;letter-spacing:.3px;text-transform:uppercase;padding:2px 8px;border-radius:10px}
.bil-cy{background:var(--teal-dim);color:var(--teal);border:1px solid rgba(45,212,191,.25)}
.bil-en{background:var(--accent-dim);color:#7b9fff;border:1px solid var(--accent-mid)}
.bil-status{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text3)}
.bil-status.auto{color:var(--amber)}
.bil-status.reviewed{color:var(--green)}
.bil-text{font-size:13px;color:var(--text);line-height:1.6;min-height:20px}
.bil-textarea{width:100%;background:transparent;border:none;outline:none;font-family:'DM Sans',sans-serif;font-size:13px;color:var(--text);resize:vertical;min-height:80px;line-height:1.6}
.bil-actions{display:flex;gap:6px;margin-top:8px}
.bil-translating{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--amber);padding:8px 0}

/* ── TABLE ───────────────────────────────────── */
.tbl-wrap{overflow-x:auto}
.pma table{width:100%;border-collapse:collapse}
.pma th{font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--text4);padding:9px 13px;text-align:left;border-bottom:1px solid var(--border);white-space:nowrap}
.pma td{padding:9px 13px;border-bottom:1px solid rgba(37,42,58,.6);font-size:13px;color:var(--text);vertical-align:middle}
.pma tr:last-child td{border-bottom:none}
.pma tr:hover td{background:rgba(255,255,255,.015)}

/* ── WORKFLOW BAR ────────────────────────────── */
.wf{display:flex;margin-bottom:24px;flex-wrap:wrap;gap:3px}
.wf-step{display:flex;align-items:center;gap:7px;padding:7px 14px;background:var(--surface);border:1px solid var(--border);font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;color:var(--text3);cursor:pointer;white-space:nowrap;border-radius:var(--radius-sm)}
.wf-step:hover{background:var(--surface2);color:var(--text2)}
.wf-step.wf-done{color:var(--green);background:var(--green-dim);border-color:rgba(34,197,94,.2)}
.wf-step.wf-active{background:var(--accent-dim);color:var(--accent);border-color:var(--accent-mid)}
.wf-dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex-shrink:0}

/* ── TONE PILLS ──────────────────────────────── */
.tone-grid{display:flex;flex-wrap:wrap;gap:8px}
.tone-pill{padding:6px 16px;border-radius:20px;border:1px solid var(--border2);font-family:'DM Sans',sans-serif;font-size:12px;font-weight:600;cursor:pointer;color:var(--text3)}
.tone-pill:hover{border-color:var(--accent);color:var(--text)}
.tone-pill.sel{background:var(--accent);color:#fff;border-color:var(--accent)}

/* ── CHIPS ───────────────────────────────────── */
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{padding:5px 12px;background:var(--surface3);border:1px solid var(--border);border-radius:6px;font-size:11px;font-weight:500;color:var(--text3);cursor:pointer}
.chip:hover{border-color:var(--border2);color:var(--text2)}
.chip.sel{background:var(--accent-dim);border-color:var(--accent);color:#7b9fff}

/* ── DELIVERABLE ─────────────────────────────── */
.del-card{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:12px}
.del-ratio{font-family:'Syne',sans-serif;font-size:24px;font-weight:800;color:var(--accent);line-height:1}
.del-desc{font-size:11px;color:var(--text3);margin-top:2px}

/* ── MEDIA ───────────────────────────────────── */
.media-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
.asset-card{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;transition:border-color .15s}
.asset-card:hover{border-color:var(--border2)}
.asset-thumb{height:100px;background:var(--surface3);display:flex;align-items:center;justify-content:center;font-size:32px;position:relative;overflow:hidden;cursor:pointer}
.asset-thumb img,.asset-thumb video{width:100%;height:100%;object-fit:cover}
.asset-overlay{position:absolute;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s}
.asset-card:hover .asset-overlay{opacity:1}
.asset-info{padding:9px 12px}
.asset-name{font-size:12px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px}
.asset-meta{font-size:11px;color:var(--text3)}
.asset-actions{display:flex;gap:5px;padding:0 12px 10px}
.link-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(37,42,58,.5)}
.link-row:last-child{border-bottom:none}
.link-icon{font-size:20px;width:32px;text-align:center;flex-shrink:0}
.link-info{flex:1;min-width:0}
.link-name{font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.link-url{font-size:11px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.link-tag{font-size:10px;padding:2px 7px;border-radius:4px;background:var(--surface3);color:var(--text3);border:1px solid var(--border);font-weight:600;white-space:nowrap}
.drop-zone{border:2px dashed var(--border2);border-radius:var(--radius);padding:28px;text-align:center;cursor:pointer;transition:all .2s;color:var(--text3)}
.drop-zone:hover,.drop-zone.over{border-color:var(--accent);background:var(--accent-dim);color:var(--text2)}
.drop-zone-icon{font-size:26px;margin-bottom:8px}

/* ── AUDIT ───────────────────────────────────── */
.audit-row{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid rgba(37,42,58,.4);font-size:12px}
.audit-row:last-child{border-bottom:none}
.audit-time{color:var(--text4);white-space:nowrap;flex-shrink:0;width:130px}
.audit-who{color:var(--accent);font-weight:600;flex-shrink:0;width:90px}
.audit-field{color:var(--text3);flex-shrink:0;width:130px;font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;padding-top:2px}
.audit-change{color:var(--text);flex:1}
.audit-old{color:var(--red);text-decoration:line-through;margin-right:6px;opacity:.8}
.audit-new{color:var(--green)}

/* ── STATS ───────────────────────────────────── */
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 18px;cursor:pointer}
.stat-card:hover{border-color:var(--border2)}
.stat-label{font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:.3px;text-transform:uppercase;color:var(--text4);margin-bottom:8px}
.stat-value{font-family:'Syne',sans-serif;font-size:28px;font-weight:800;line-height:1;letter-spacing:-0.02em}
.stat-sub{font-size:11px;color:var(--text3);margin-top:6px}

/* ── PROGRESS ────────────────────────────────── */
.prog-steps{display:flex;gap:3px;margin-top:12px}
.prog-step{flex:1;height:3px;border-radius:2px;background:var(--border2)}
.prog-step.done{background:var(--accent)}
.prog-step.cur{background:var(--amber)}

/* ── NOTICE ──────────────────────────────────── */
.notice{border-radius:var(--radius);padding:12px 16px;font-size:13px;margin-bottom:16px;display:flex;align-items:flex-start;gap:10px;line-height:1.5}
.notice-blue{background:var(--accent-dim);border:1px solid var(--accent-mid);color:#7b9fff}
.notice-purple{background:var(--purple-dim);border:1px solid rgba(167,139,250,.2);color:var(--purple)}
.notice-amber{background:var(--amber-dim);border:1px solid rgba(245,158,11,.2);color:#fbbf24}
.notice-green{background:var(--green-dim);border:1px solid rgba(34,197,94,.2);color:#4ade80}
.notice-teal{background:var(--teal-dim);border:1px solid rgba(45,212,191,.2);color:var(--teal)}

/* ── EMPTY ───────────────────────────────────── */
.empty{text-align:center;padding:48px 24px;color:var(--text3)}
.empty-icon{font-size:40px;margin-bottom:14px;opacity:.6}
.empty h3{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:var(--text2);margin-bottom:6px;letter-spacing:-0.01em}
.empty p{font-size:13px;color:var(--text4);line-height:1.5}

/* ── MODAL ───────────────────────────────────── */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);width:580px;max-width:100%;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 16px 64px rgba(0,0,0,.5)}
.modal-hd{padding:18px 22px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.modal-title{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;letter-spacing:-0.01em}
.modal-bd{padding:22px;overflow-y:auto;flex:1}
.modal-ft{padding:14px 22px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px;flex-shrink:0}

/* ── PAGE HEADER ─────────────────────────────── */
.sh{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px;gap:16px}
.sh-left h1{font-size:24px;font-weight:800;margin-bottom:4px;letter-spacing:-0.02em}
.sh-left p{font-size:13px;color:var(--text3)}

/* ── LOGIN ───────────────────────────────────── */
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:24px;background-image:radial-gradient(ellipse 80% 60% at 50% 0%,rgba(79,114,255,0.06),transparent)}
.login-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-xl);padding:44px;width:420px;max-width:100%;box-shadow:0 4px 40px rgba(0,0,0,.3)}
.login-logo{font-family:'Syne',sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--accent);margin-bottom:8px}
.login-title{font-size:28px;font-weight:800;margin-bottom:8px;letter-spacing:-0.02em}
.login-sub{font-size:13px;color:var(--text3);margin-bottom:32px}
.login-divider{display:flex;align-items:center;gap:10px;margin:20px 0}
.login-divider::before,.login-divider::after{content:'';flex:1;height:1px;background:var(--border)}
.login-divider span{font-size:11px;color:var(--text4)}
.user-picker{display:grid;gap:8px;margin-bottom:20px}
.user-pick-item{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);cursor:pointer;transition:all .15s}
.user-pick-item:hover{border-color:var(--accent);background:var(--accent-dim)}
.user-pick-av{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:13px;font-weight:800;flex-shrink:0}
.user-pick-info{flex:1;min-width:0}
.user-pick-name{font-size:13px;font-weight:600;color:var(--text)}
.user-pick-role{font-size:11px;color:var(--text3)}

/* ── ACCOUNT PAGES ───────────────────────────── */
.profile-header{display:flex;align-items:center;gap:20px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:20px;background-image:linear-gradient(135deg,rgba(79,114,255,.03) 0%,transparent 60%)}
.profile-avatar{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:24px;font-weight:800;flex-shrink:0}
.profile-avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.profile-name{font-size:20px;font-weight:800;margin-bottom:3px}
.profile-meta{font-size:13px;color:var(--text3);display:flex;gap:12px;flex-wrap:wrap}
.org-logo-box{width:56px;height:56px;border-radius:12px;background:var(--accent);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:#fff;flex-shrink:0;overflow:hidden}
.team-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(37,42,58,.5)}
.team-row:last-child{border-bottom:none}
.team-av{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;background:var(--surface3);flex-shrink:0}
.user-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(37,42,58,.5)}
.user-row:last-child{border-bottom:none}
.user-av-sm{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:11px;font-weight:800;flex-shrink:0}

/* ── EXPORT PREVIEW ──────────────────────────── */
.ep{background:#fff;color:#111;font-family:'DM Sans',sans-serif;padding:36px;border-radius:var(--radius-lg)}
.ep h1{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;margin-bottom:4px}
.ep-meta{font-size:12px;color:#666;margin-bottom:20px}
.ep-label{font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#999;margin-bottom:6px}
.ep-value{font-size:13px;color:#222;line-height:1.6;margin-bottom:14px}
.ep-hr{height:1px;background:#e5e7eb;margin:20px 0}
.ep-clip{background:#f8f9ff;border:1px solid #e0e4ff;border-radius:8px;padding:10px 14px;margin-bottom:8px;font-size:12px}
.ep-del{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;margin-bottom:8px;display:flex;gap:14px;align-items:flex-start}
.ep-del-ratio{font-family:'Syne',sans-serif;font-weight:800;font-size:20px;color:#4f72ff;flex-shrink:0;width:52px}
.ep-bilingual{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
.ep-cy{border-left:3px solid #2dd4bf;padding-left:10px}
.ep-en{border-left:3px solid #4f72ff;padding-left:10px}
`;

// ═══ psc_utils.js ═══
// Utility functions, bilingual field model, and the translation service wrapper.
// The translation service is designed to be swapped — replace translateText() only.

// ─── GENERAL HELPERS ─────────────────────────────────────────────────────────
const genId  = () => Math.random().toString(36).slice(2,9);
const fmt    = b => b<1024?`${b}B`:b<1048576?`${(b/1024).toFixed(1)}KB`:`${(b/1048576).toFixed(1)}MB`;
const ext    = (n="") => n.split(".").pop().toLowerCase();
const isVid  = (n="") => ["mp4","mov","avi","webm"].includes(ext(n));
const isAud  = (n="") => ["mp3","wav","aac","m4a"].includes(ext(n));
const isImg  = (n="") => ["jpg","jpeg","png","gif","webp"].includes(ext(n));
const isPdf  = (n="") => ext(n)==="pdf";
const fIcon  = (n="") => {
  const e=ext(n);
  if(["mp4","mov","avi","webm"].includes(e))return"🎬";
  if(["mp3","wav","aac","m4a"].includes(e))return"🎵";
  if(e==="pdf")return"📄";
  if(["jpg","jpeg","png","gif","webp"].includes(e))return"🖼️";
  return"📎";
};
const nowStr  = () => new Date().toISOString().slice(0,16).replace("T"," ");
const initials = (name="") => name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
const avatarColor = (name="") => {
  const colors = ["#4f72ff","#7c3aed","#2dd4bf","#f59e0b","#ef4444","#22c55e","#ec4899"];
  let hash = 0;
  for(let i=0;i<name.length;i++) hash = name.charCodeAt(i) + ((hash<<5)-hash);
  return colors[Math.abs(hash) % colors.length];
};

// ─── BILINGUAL FIELD MODEL ────────────────────────────────────────────────────
// Creates a new bilingual field object.
// All major text fields should use this structure.
const createBilingualField = (text="", lang="EN") => ({
  original_language: lang,
  source_text: text,
  translated_text: "",
  translation_status: text ? "PENDING" : "NOT_REQUIRED",
  translation_method: null,
});

// Gets display text for a given view language
const getFieldText = (field, viewLang) => {
  if (!field || typeof field === "string") return field || ""; // legacy string fallback
  if (viewLang === field.original_language) return field.source_text || "";
  return field.translated_text || field.source_text || "";
};

// Checks if a field has bilingual content ready
const fieldHasTranslation = (field) => {
  if (!field || typeof field === "string") return false;
  return field.translated_text && field.translated_text.length > 0;
};

// ─── BLANK RECORD FACTORIES ───────────────────────────────────────────────────
const blankBF = (text="", lang="EN") => createBilingualField(text, lang);

const blankBrief = (lang="EN") => ({
  story_hook:   blankBF("", lang),
  why_now:      blankBF("", lang),
  tone: "",
  tone_notes:   blankBF("", lang),
  ending:       blankBF("", lang),
  characters: [],
  sync_lines:  [],
  visuals:     [],
});

const blankNotes = (lang="EN") => ({
  worked_well:  blankBF("", lang),
  unexpected:   blankBF("", lang),
  strong_beats: blankBF("", lang),
  missing:      blankBF("", lang),
});

const blankHandover = (lang="EN") => ({
  story_intention: blankBF("", lang),
  tone_reference:  blankBF("", lang),
  music_suggestions: "",
  clips:      [],
  highlights: [],
  duration:   "",
});

// ─── TRANSLATION SERVICE ──────────────────────────────────────────────────────
// To swap translation providers, replace translateText() only.
// The rest of the system uses translateBilingualField() which calls translateText().

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

/**
 * Core translation function — swap this to use a different provider.
 * @param {string} text — source text to translate
 * @param {string} fromLang — "CY" or "EN"
 * @param {string} toLang — "CY" or "EN"
 * @returns {Promise<string>} — translated text
 */
const translateText = async (text, fromLang, toLang) => {
  if (!text?.trim()) return "";

  const langNames = { CY: "Welsh (Cymraeg)", EN: "English" };
  const prompt = `Translate the following ${langNames[fromLang]} text to ${langNames[toLang]}. 
This is a TV/broadcast production document. Preserve editorial tone, named people and place names. 
Return ONLY the translation, no explanation or preamble.

Text to translate:
${text}`;

  const response = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();
  return data.content?.[0]?.text?.trim() || "";
};

/**
 * Translates a bilingual field object and returns an updated copy.
 * Called when a user finishes entering text in source language.
 */
const translateBilingualField = async (field) => {
  if (!field?.source_text?.trim()) return field;
  const targetLang = field.original_language === "CY" ? "EN" : "CY";
  try {
    const translated = await translateText(field.source_text, field.original_language, targetLang);
    return {
      ...field,
      translated_text: translated,
      translation_status: "AUTO_TRANSLATED",
      translation_method: "MACHINE",
    };
  } catch (e) {
    console.error("Translation failed:", e);
    return { ...field, translation_status: "PENDING" };
  }
};


// ─── SHARED ATOMS ─────────────────────────────────────────────────────────────
function Btn({children,cls="btn-secondary",sm,xs,onClick,disabled,style}){
  return <button className={`btn ${cls}${sm?" btn-sm":""}${xs?" btn-xs":""}`} onClick={onClick} disabled={disabled} style={style}>{children}</button>;
}
function Notice({type="blue",icon,children}){return <div className={`notice notice-${type}`}><span>{icon}</span><div>{children}</div></div>;}
function Empty({icon="📭",title,sub}){return <div className="empty"><div className="empty-icon">{icon}</div><h3>{title}</h3>{sub&&<p>{sub}</p>}</div>;}
function Badge({status}){const m=STATUS_META[status]||STATUS_META.DEVELOPMENT;return <span className={`badge ${m.cls}`}><span className="badge-dot"/>{m.label}</span>;}
function PBadge({p}){const c=p==="MUST"?"b-must":p==="SHOULD"?"b-should":"b-nice";return <span className={`badge ${c}`}>{p}</span>;}

const STATUSES_IDX = (s) => ["DEVELOPMENT","READY_TO_SHOOT","FILMING","IN_EDIT","DELIVERED","ARCHIVED"].indexOf(s);
// ═══ psc_seedData.js ═══
// Generic placeholder data — replaced at runtime by API responses.
// These are only used as fallbacks if the API is unreachable.

const SEED_ORG = {
  id: "org1",
  name: "My Organisation",
  slug: "myorg",
  logo: null,
  default_language: "CY",
  billing_owner: "u1",
  subscription: "PROFESSIONAL",
  privacy_default: "TEAM_ONLY",
  export_branding: true,
};

const SEED_TEAMS = [
  { id: "t1", org_id:"org1", name:"Production",  icon:"🎬", description:"Story development and filming" },
  { id: "t2", org_id:"org1", name:"Edit",         icon:"✂️", description:"Post-production and assembly" },
  { id: "t3", org_id:"org1", name:"Social",       icon:"📱", description:"Social media and digital delivery" },
  { id: "t4", org_id:"org1", name:"Management",   icon:"🏢", description:"Exec and operations" },
];

const SEED_USERS = [];

// ─── BILINGUAL FIELD HELPER (inline for seed data) ───────────────────────────
const bf = (cyText, enText="") => ({
  original_language: "CY",
  source_text: cyText,
  translated_text: enText,
  translation_status: enText ? "AUTO_TRANSLATED" : "PENDING",
  translation_method: enText ? "MACHINE" : null,
});

const bfen = (enText, cyText="") => ({
  original_language: "EN",
  source_text: enText,
  translated_text: cyText,
  translation_status: cyText ? "AUTO_TRANSLATED" : "PENDING",
  translation_method: cyText ? "MACHINE" : null,
});

const SEED_STORIES = [];

// ═══════════════════════════════════════════════════════════════════
// API CLIENT (src/api/index.js)
// ═══════════════════════════════════════════════════════════════════

// ─── src/api/index.js ─────────────────────────────────────────────────────────
// Full API client. All calls go through here.
// Token storage: sessionStorage (survives refresh, clears on tab close)
// Auto-refresh: deduped promise, retries original request once on 401

const BASE = process.env.NEXT_PUBLIC_PMA_API_URL || "https://pma-production-6ddd.up.railway.app/api";

// ─── Token storage ────────────────────────────────────────────────────────────
let _access  = null;
let _refresh = null;

function setTokens(access, refresh) {
  _access  = access;
  _refresh = refresh;
  try {
    sessionStorage.setItem("psc_access",  access  || "");
    sessionStorage.setItem("psc_refresh", refresh || "");
  } catch {}
}

function clearTokens() {
  _access = _refresh = null;
  try {
    sessionStorage.removeItem("psc_access");
    sessionStorage.removeItem("psc_refresh");
  } catch {}
}

function loadStoredTokens() {
  try {
    _access  = sessionStorage.getItem("psc_access")  || null;
    _refresh = sessionStorage.getItem("psc_refresh") || null;
  } catch {}
  return { accessToken: _access, refreshToken: _refresh };
}
loadStoredTokens(); // run on import

function isAuthenticated() { return !!_access; }

// ─── Auto-refresh (deduped) ───────────────────────────────────────────────────
let _refreshing = null;

async function refreshTokens() {
  if (_refreshing) return _refreshing;
  _refreshing = _raw("POST", "/auth/refresh", { refresh_token: _refresh }, false)
    .then(data => { setTokens(data.access_token, data.refresh_token); return data; })
    .catch(e   => { clearTokens(); throw e; })
    .finally(() => { _refreshing = null; });
  return _refreshing;
}

// ─── Core fetch ───────────────────────────────────────────────────────────────
async function _raw(method, path, body, withAuth = true) {
  const headers = { "Content-Type": "application/json" };
  if (withAuth && _access) headers["Authorization"] = `Bearer ${_access}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data   = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const err  = new Error(isJson ? (data.error || "Request failed") : data);
    err.status = res.status;
    err.data   = isJson ? data : { error: data };
    throw err;
  }
  return data;
}

async function request(method, path, body) {
  try {
    return await _raw(method, path, body, true);
  } catch (e) {
    if (e.status === 401 && _refresh) {
      await refreshTokens();
      return await _raw(method, path, body, true);
    }
    throw e;
  }
}

// ─── Shorthand verbs (exported so bundle can use api.get etc) ────────────────
export const get   = (path)        => request("GET",    path);
export const post  = (path, body)  => request("POST",   path, body);
export const put   = (path, body)  => request("PUT",    path, body);
export const patch = (path, body)  => request("PATCH",  path, body);
export const del   = (path)        => request("DELETE", path);

// ─── Blob fetch (PDF/CSV exports) ─────────────────────────────────────────────
async function fetchBlob(path) {
  const doFetch = () => fetch(`${BASE}${path}`, {
    headers: _access ? { Authorization: `Bearer ${_access}` } : {},
  });
  let res = await doFetch();
  if (res.status === 401 && _refresh) {
    await refreshTokens();
    res = await doFetch();
  }
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  return res.blob();
}

// ─── File download trigger ────────────────────────────────────────────────────
async function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── Multipart upload ─────────────────────────────────────────────────────────
async function uploadFile(path, file, extraFields = {}) {
  const fd = new FormData();
  fd.append("file", file);
  Object.entries(extraFields).forEach(([k, v]) => fd.append(k, String(v)));

  const doUpload = async () => {
    const res  = await fetch(`${BASE}${path}`, {
      method:  "POST",
      headers: _access ? { Authorization: `Bearer ${_access}` } : {},
      body:    fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(data.error || "Upload failed"); e.data = data; throw e; }
    return data;
  };

  try {
    return await doUpload();
  } catch (e) {
    if (e.status === 401 && _refresh) { await refreshTokens(); return doUpload(); }
    throw e;
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
const auth = {
  login:              (body)  => post("/auth/login",               body),
  register:           (body)  => post("/auth/register",            body),
  logout:             ()      => post("/auth/logout",              { refresh_token: _refresh }),
  refresh:            ()      => _raw("POST", "/auth/refresh",     { refresh_token: _refresh }, false),
  me:                 ()      => get("/auth/me"),
  forgot:             (email) => post("/auth/forgot",              { email }),        // ← was /forgot-password
  reset:              (body)  => post("/auth/reset",               body),             // ← was /reset-password
  verifyEmail:        (token) => post("/auth/verify-email",        { token }),
  resendVerification: ()      => post("/auth/resend-verification", {}),
  acceptInvite:       (body)  => post("/auth/invite/accept",       body),             // ← was /accept-invite
  updateProfile:      (body)  => patch("/auth/profile",            body),
  changePassword:     (body)  => patch("/auth/password",           body),             // ← was /change-password
};

// ─── Stories ──────────────────────────────────────────────────────────────────
const stories = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return get(`/stories${q ? "?" + q : ""}`);
  },
  get:       (id)         => get(`/stories/${id}`),
  create:    (body)       => post("/stories",               body),
  update:    (id, body)   => patch(`/stories/${id}`,        body),   // title/programme/date/visibility only
  setStatus: (id, status) => patch(`/stories/${id}/status`, { status }),  // ← was PATCH /:id with {status}
  delete:    (id)         => del(`/stories/${id}`),
  restore:   (id)         => post(`/stories/${id}/restore`,   {}),
  duplicate: (id)         => post(`/stories/${id}/duplicate`, {}),

  // Sub-resource saves — each hits its own endpoint
  updateBrief:    (id, body) => patch(`/stories/${id}/brief`,       body),
  updateShoot:    (id, body) => patch(`/stories/${id}/shoot-notes`, body),  // ← was /shoot
  updateHandover: (id, body) => patch(`/stories/${id}/handover`,    body),

  // Deliverables
  deliverables:      (id)         => get(`/stories/${id}/deliverables`),
  createDeliverable: (id, body)   => post(`/stories/${id}/deliverables`, body),
  updateDeliverable: (id, did, b) => patch(`/stories/${id}/deliverables/${did}`, b),
  deleteDeliverable: (id, did)    => del(`/stories/${id}/deliverables/${did}`),

  // Media
  media:       (id)              => get(`/stories/${id}/media`),
  uploadMedia: (id, file, extra) => uploadFile(`/stories/${id}/media`, file, extra),
  updateMedia: (id, mid, b)      => patch(`/stories/${id}/media/${mid}`, b),
  deleteMedia: (id, mid)         => del(`/stories/${id}/media/${mid}`),

  // Comments
  comments:      (id)         => get(`/stories/${id}/comments`),
  addComment:    (id, body)   => post(`/stories/${id}/comments`, body),
  updateComment: (id, cid, b) => patch(`/stories/${id}/comments/${cid}`, b),
  deleteComment: (id, cid)    => del(`/stories/${id}/comments/${cid}`),

  // Assignments
  assignments: (id)       => get(`/stories/${id}/assignments`),
  assign:      (id, body) => post(`/stories/${id}/assignments`, body),
  unassign:    (id, uid)  => del(`/stories/${id}/assignments/${uid}`),

  // Export — GET /:id/export/pdf?type=brief|handover&lang=CY|EN|BILINGUAL
  exportPDF: (id, type = "brief", lang = "BILINGUAL") =>
    fetchBlob(`/stories/${id}/export/pdf?type=${type}&lang=${lang}`),

  // Translation — backend expects { text, from, to }
  translate: (id, text, from, to) =>
    post(`/stories/${id}/translate`, { text, from, to }),

  detectLang: (id, text) =>
    post(`/stories/${id}/detect-language`, { text }),
};

// ─── Organisation ─────────────────────────────────────────────────────────────
const org = {
  get:           ()       => get("/org"),
  update:        (body)   => patch("/org", body),
  uploadLogo:    (file)   => uploadFile("/org/logo", file),
  stats:         ()       => get("/org/stats"),

  members:       ()       => get("/org/members"),
  updateMember:  (id, b)  => patch(`/org/members/${id}`, b),
  removeMember:  (id)     => del(`/org/members/${id}`),

  // Org-level invite lives on auth router at /auth/org/invite
  invite:        (body)   => post("/auth/org/invite", body),

  platforms:     ()       => get("/org/platforms"),
  createPlatform:(body)   => post("/org/platforms", body),
  updatePlatform:(id, b)  => patch(`/org/platforms/${id}`, b),
  deletePlatform:(id)     => del(`/org/platforms/${id}`),

  schedulePDF:   (params) => fetchBlob(`/org/schedule/pdf?${new URLSearchParams(params)}`),
  scheduleCSV:   (params) => fetchBlob(`/org/schedule/csv?${new URLSearchParams(params)}`),
};

// ─── Teams ────────────────────────────────────────────────────────────────────
const teams = {
  list:         ()        => get("/teams"),
  get:          (id)      => get(`/teams/${id}`),
  create:       (body)    => post("/teams", body),
  update:       (id, b)   => patch(`/teams/${id}`, b),
  delete:       (id)      => del(`/teams/${id}`),
  addMember:    (id, uid) => post(`/teams/${id}/members`, { user_id: uid }),
  removeMember: (id, uid) => del(`/teams/${id}/members/${uid}`),
};

// ─── Notifications ────────────────────────────────────────────────────────────
const notifications = {
  list:     ()   => get("/notifications"),
  markRead: (id) => patch(`/notifications/${id}/read`, {}),   // ← was /:id with {read:true}
  markAll:  ()   => patch("/notifications/read-all",   {}),   // ← was POST /mark-all-read
};

// ─── Translation (used by BilingualField) ─────────────────────────────────────
const translate = {
  field: (storyId, text, fromLang) => {
    const to = fromLang === "CY" ? "EN" : "CY";
    return stories.translate(storyId, text, fromLang, to);
  },
};


// ─── API namespace (for inline use without ES module imports) ─────────────────
const api = {
  auth, stories, org, teams, notifications, translate,
  downloadBlob, setTokens, clearTokens, loadStoredTokens, isAuthenticated,
  get:    (path)       => request("GET",    path),
  post:   (path, body) => request("POST",   path, body),
  patch:  (path, body) => request("PATCH",  path, body),
  put:    (path, body) => request("PUT",    path, body),
  delete: (path)       => request("DELETE", path),
};

// ═══════════════════════════════════════════════════════════════════
// AUTH + SESSION (psc_auth.jsx)
// ═══════════════════════════════════════════════════════════════════

// ─── psc_auth.jsx ─────────────────────────────────────────────────────────────
// Session context + all auth screens wired to the real backend API.
// Handles: login, register, forgot password, reset password, accept invite,
//          email verification banner, URL param handling (?verify= ?reset= ?invite=)


// ─── SESSION CONTEXT ──────────────────────────────────────────────────────────
const SessionContext = createContext(null);
const useSession = () => useContext(SessionContext);

function SessionProvider({ children }) {
  const [session,   setSession]   = useState(null);
  const [authView,  setAuthView]  = useState("sign-in");
  const [authToken, setAuthToken] = useState(null); // invite/reset/verify token from URL
  const [loading,   setLoading]   = useState(true);

  // ── On mount: restore session from stored tokens + check URL params ────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite");
    const reset  = params.get("reset");
    const verify = params.get("verify");

    if (invite) { setAuthView("accept-invite"); setAuthToken(invite); setLoading(false); return; }
    if (reset)  { setAuthView("reset");         setAuthToken(reset);  setLoading(false); return; }
    if (verify) {
      // Auto-verify and drop to sign-in with a success message
      api.auth.verifyEmail(verify)
        .then(() => { setAuthView("sign-in"); })
        .catch(() => { setAuthView("sign-in"); })
        .finally(() => setLoading(false));
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    // Try restoring from stored tokens — refresh then /me
    const { accessToken } = api.loadStoredTokens();
    if (accessToken) {
      api.auth.refresh()
        .then(data => {
          api.setTokens(data.access_token, data.refresh_token);
          return api.auth.me();
        })
        .then(data => {
          setSession({ user: data.user, org: data.org });
          setAuthView("app");
        })
        .catch(() => { api.clearTokens(); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback((userData, orgData, tokens) => {
    if (tokens) api.setTokens(tokens.access_token, tokens.refresh_token);
    setSession({ user: userData, org: orgData });
    setAuthView("app");
    // Clean URL
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const logout = useCallback(async () => {
    try { await api.auth.logout(); } catch {}
    api.clearTokens();
    setSession(null);
    setAuthView("sign-in");
  }, []);

  const can = useCallback((action) => {
    if (!session) return false;
    return canDo(session.user.role, action);
  }, [session]);

  const updateUser = useCallback((updates) => {
    setSession(prev => prev ? { ...prev, user: { ...prev.user, ...updates } } : prev);
  }, []);

  const updateOrg = useCallback((updates) => {
    setSession(prev => prev ? { ...prev, org: { ...prev.org, ...updates } } : prev);
  }, []);

  if (loading) return (
    <div className="pma" style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{CSS}{EXTRA_CSS}</style>
      <div style={{ textAlign:"center", animation:"fadeIn .4s ease" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:700, letterSpacing:3,
          textTransform:"uppercase", color:"var(--accent)", marginBottom:16 }}>PSC Module</div>
        <span className="spinner" style={{ width:24, height:24, borderWidth:2.5 }}/>
      </div>
    </div>
  );

  return (
    <SessionContext.Provider value={{ session, can, login, logout, updateUser, updateOrg }}>
      {authView === "sign-in"       && <div className="pma"><style>{CSS}{EXTRA_CSS}</style><SignInPage onNav={setAuthView} onLogin={login} /></div>}
      {authView === "register"      && <div className="pma"><style>{CSS}{EXTRA_CSS}</style><RegisterPage onNav={setAuthView} onLogin={login} /></div>}
      {authView === "forgot"        && <div className="pma"><style>{CSS}{EXTRA_CSS}</style><ForgotPage onNav={setAuthView} /></div>}
      {authView === "reset"         && <div className="pma"><style>{CSS}{EXTRA_CSS}</style><ResetPage token={authToken} onNav={setAuthView} /></div>}
      {authView === "accept-invite" && <div className="pma"><style>{CSS}{EXTRA_CSS}</style><AcceptInvitePage token={authToken} onNav={setAuthView} onLogin={login} /></div>}
      {authView === "app" && session && (
        <>
          {!session.user.email_verified_at && (
            <VerifyBanner onResend={() => api.auth.resendVerification()} />
          )}
          {children}
        </>
      )}
    </SessionContext.Provider>
  );
}

// ─── UserAvatar ───────────────────────────────────────────────────────────────
function UserAvatar({ user, size = 32, style = {} }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background:avatarColor(user?.name || "?"), display:"flex", alignItems:"center",
      justifyContent:"center", fontFamily:"'Syne',sans-serif",
      fontSize:size*0.38, fontWeight:800, color:"#fff",
      flexShrink:0, overflow:"hidden", ...style
    }}>
      {user?.avatar_url
        ? <img src={user.avatar_url} alt={user.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
        : initials(user?.name || "?")}
    </div>
  );
}

// ─── Shared auth card wrapper ─────────────────────────────────────────────────
function AuthCard({ children }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"var(--bg)", padding:24,
      backgroundImage:"radial-gradient(ellipse 80% 50% at 50% 0%, rgba(79,114,255,0.06), transparent)" }}>
      <div style={{ background:"var(--surface)", border:"1px solid var(--border)",
        borderRadius:16, padding:44, width:420, maxWidth:"100%",
        boxShadow:"0 4px 40px rgba(0,0,0,.3)" }}>
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:700,
          letterSpacing:3, textTransform:"uppercase", color:"var(--accent)", marginBottom:8 }}>
          PSC Module
        </div>
        {children}
      </div>
    </div>
  );
}

function AuthInput({ label, type="text", value, onChange, placeholder, autoFocus, autoComplete }) {
  const id = useRef("ai-" + Math.random().toString(36).slice(2,7)).current;
  return (
    <div style={{ marginBottom:18 }}>
      <label htmlFor={id} style={{ display:"block", fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:600,
        letterSpacing:".5px", textTransform:"uppercase", color:"var(--text3)", marginBottom:8 }}>
        {label}
      </label>
      <input id={id} type={type} className="fi" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} autoFocus={autoFocus} autoComplete={autoComplete} />
    </div>
  );
}

function AuthBtn({ children, onClick, disabled, loading: ld, cls="btn-primary" }) {
  return (
    <button className={`btn ${cls}`} onClick={onClick} disabled={disabled || ld}
      style={{ width:"100%", justifyContent:"center", padding:"11px 0", fontSize:13, fontWeight:600, marginTop:6 }}>
      {ld ? <><span className="spinner" style={{ width:14, height:14, borderWidth:2 }}/> Please wait…</> : children}
    </button>
  );
}

function AuthError({ msg }) {
  return msg ? (
    <div style={{ background:"var(--red-dim)", border:"1px solid rgba(239,68,68,.3)", borderRadius:8,
      padding:"10px 14px", color:"#f87171", fontSize:13, marginBottom:14, lineHeight:1.5 }}>
      {msg}
    </div>
  ) : null;
}

function AuthLink({ children, onClick }) {
  return (
    <span onClick={onClick} style={{ color:"var(--accent)", cursor:"pointer", fontSize:13,
      textDecoration:"underline", textDecorationColor:"transparent" }}
      onMouseEnter={e => e.target.style.textDecorationColor="var(--accent)"}
      onMouseLeave={e => e.target.style.textDecorationColor="transparent"}>
      {children}
    </span>
  );
}

// ─── Sign In ──────────────────────────────────────────────────────────────────
function SignInPage({ onNav, onLogin }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const submit = async () => {
    setError("");
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    try {
      const data = await api.auth.login({ email, password });
      onLogin(data.user, data.org, { access_token: data.access_token, refresh_token: data.refresh_token });
    } catch (e) {
      setError(e.data?.error || "Sign-in failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <h1 style={{ fontSize:26, fontWeight:800, marginBottom:6, fontFamily:"'Syne',sans-serif" }}>Sign in</h1>
      <p style={{ fontSize:13, color:"var(--text3)", marginBottom:28 }}>
        Welcome back to PSC Production Module
      </p>
      <AuthError msg={error} />
      <AuthInput label="Email address" type="email" value={email} onChange={setEmail}
        placeholder="you@yourcompany.wales" autoFocus autoComplete="email" />
      <AuthInput label="Password" type="password" value={password} onChange={setPassword}
        placeholder="Your password" autoComplete="current-password" />
      <div style={{ textAlign:"right", marginBottom:20, marginTop:-8 }}>
        <AuthLink onClick={() => onNav("forgot")}>Forgot password?</AuthLink>
      </div>
      <AuthBtn onClick={submit} loading={loading}>Sign In →</AuthBtn>
      <p style={{ textAlign:"center", marginTop:20, fontSize:13, color:"var(--text3)" }}>
        Don't have an account?{" "}
        <AuthLink onClick={() => onNav("register")}>Register</AuthLink>
      </p>
    </AuthCard>
  );
}

// ─── Register ─────────────────────────────────────────────────────────────────
function RegisterPage({ onNav, onLogin }) {
  const [f, setF] = useState({ name:"", email:"", password:"", confirm:"", org_name:"" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]:v }));

  const submit = async () => {
    setError("");
    if (!f.name || !f.email || !f.password || !f.org_name) {
      setError("Please fill in all fields."); return;
    }
    if (f.password !== f.confirm) { setError("Passwords do not match."); return; }
    if (f.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const data = await api.auth.register({
        name: f.name, email: f.email, password: f.password, org_name: f.org_name
      });
      onLogin(data.user, data.org, { access_token: data.access_token, refresh_token: data.refresh_token });
    } catch (e) {
      setError(e.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <h1 style={{ fontSize:26, fontWeight:800, marginBottom:6, fontFamily:"'Syne',sans-serif" }}>Create account</h1>
      <p style={{ fontSize:13, color:"var(--text3)", marginBottom:24 }}>
        Set up your organisation on PSC Module
      </p>
      <AuthError msg={error} />
      <AuthInput label="Your full name" value={f.name} onChange={v=>set("name",v)} placeholder="Your full name" autoFocus />
      <AuthInput label="Work email" type="email" value={f.email} onChange={v=>set("email",v)} placeholder="you@yourcompany.wales" />
      <AuthInput label="Organisation name" value={f.org_name} onChange={v=>set("org_name",v)} placeholder="Your production company" />
      <AuthInput label="Password" type="password" value={f.password} onChange={v=>set("password",v)} placeholder="Min. 8 characters" />
      <AuthInput label="Confirm password" type="password" value={f.confirm} onChange={v=>set("confirm",v)} placeholder="Repeat password" />
      <AuthBtn onClick={submit} loading={loading}>Create Account →</AuthBtn>
      <p style={{ textAlign:"center", marginTop:20, fontSize:13, color:"var(--text3)" }}>
        Already have an account?{" "}
        <AuthLink onClick={() => onNav("sign-in")}>Sign in</AuthLink>
      </p>
    </AuthCard>
  );
}

// ─── Forgot Password ──────────────────────────────────────────────────────────
function ForgotPage({ onNav }) {
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!email) { setError("Please enter your email address."); return; }
    setLoading(true);
    try {
      await api.auth.forgot(email);
      setSent(true);
    } catch (e) {
      setError(e.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <AuthCard>
      <div style={{ textAlign:"center", padding:"20px 0" }}>
        <div style={{ fontSize:40, marginBottom:16 }}>📧</div>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:10 }}>Check your email</h2>
        <p style={{ fontSize:13, color:"var(--text3)", lineHeight:1.6, marginBottom:24 }}>
          If an account exists for <strong>{email}</strong>, a reset link has been sent.
          Please check your inbox.
        </p>
        <AuthLink onClick={() => onNav("sign-in")}>← Back to sign in</AuthLink>
      </div>
    </AuthCard>
  );

  return (
    <AuthCard>
      <h1 style={{ fontSize:26, fontWeight:800, marginBottom:6, fontFamily:"'Syne',sans-serif" }}>Reset password</h1>
      <p style={{ fontSize:13, color:"var(--text3)", marginBottom:24 }}>
        Enter your email and we'll send a reset link.
      </p>
      <AuthError msg={error} />
      <AuthInput label="Email address" type="email" value={email} onChange={setEmail}
        placeholder="you@yourcompany.wales" autoFocus />
      <AuthBtn onClick={submit} loading={loading}>Send Reset Link</AuthBtn>
      <p style={{ textAlign:"center", marginTop:16, fontSize:13 }}>
        <AuthLink onClick={() => onNav("sign-in")}>← Back to sign in</AuthLink>
      </p>
    </AuthCard>
  );
}

// ─── Reset Password ───────────────────────────────────────────────────────────
function ResetPage({ token, onNav }) {
  const [f, setF] = useState({ password:"", confirm:"" });
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]:v }));

  const submit = async () => {
    setError("");
    if (!f.password) { setError("Please enter a new password."); return; }
    if (f.password !== f.confirm) { setError("Passwords do not match."); return; }
    if (f.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      await api.auth.reset({ token, new_password: f.password });
      setDone(true);
    } catch (e) {
      setError(e.data?.error || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <AuthCard>
      <div style={{ textAlign:"center", padding:"20px 0" }}>
        <div style={{ fontSize:40, marginBottom:16 }}>✅</div>
        <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:800, marginBottom:10 }}>Password updated</h2>
        <p style={{ fontSize:13, color:"var(--text3)", marginBottom:24 }}>You can now sign in with your new password.</p>
        <AuthBtn onClick={() => onNav("sign-in")}>Sign In →</AuthBtn>
      </div>
    </AuthCard>
  );

  return (
    <AuthCard>
      <h1 style={{ fontSize:26, fontWeight:800, marginBottom:6, fontFamily:"'Syne',sans-serif" }}>New password</h1>
      <AuthError msg={error} />
      <AuthInput label="New password" type="password" value={f.password} onChange={v=>set("password",v)} placeholder="Min. 8 characters" autoFocus />
      <AuthInput label="Confirm password" type="password" value={f.confirm} onChange={v=>set("confirm",v)} placeholder="Repeat password" />
      <AuthBtn onClick={submit} loading={loading}>Set New Password</AuthBtn>
    </AuthCard>
  );
}

// ─── Accept Invite ────────────────────────────────────────────────────────────
function AcceptInvitePage({ token, onNav, onLogin }) {
  const [f, setF] = useState({ name:"", password:"", confirm:"" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]:v }));

  const submit = async () => {
    setError("");
    if (!f.name || !f.password) { setError("Please fill in all fields."); return; }
    if (f.password !== f.confirm) { setError("Passwords do not match."); return; }
    if (f.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const data = await api.auth.acceptInvite({ token, name: f.name, password: f.password });
      onLogin(data.user, data.org, { access_token: data.access_token, refresh_token: data.refresh_token });
    } catch (e) {
      setError(e.data?.error || "Could not accept invitation. It may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <h1 style={{ fontSize:26, fontWeight:800, marginBottom:6, fontFamily:"'Syne',sans-serif" }}>Accept invitation</h1>
      <p style={{ fontSize:13, color:"var(--text3)", marginBottom:24 }}>
        Create your account to join your team.
      </p>
      <AuthError msg={error} />
      <AuthInput label="Your full name" value={f.name} onChange={v=>set("name",v)} placeholder="e.g. Lowri Evans" autoFocus />
      <AuthInput label="Password" type="password" value={f.password} onChange={v=>set("password",v)} placeholder="Min. 8 characters" />
      <AuthInput label="Confirm password" type="password" value={f.confirm} onChange={v=>set("confirm",v)} placeholder="Repeat password" />
      <AuthBtn onClick={submit} loading={loading}>Create Account →</AuthBtn>
    </AuthCard>
  );
}

// ─── Email Verification Banner ────────────────────────────────────────────────
function VerifyBanner({ onResend }) {
  const [sent, setSent] = useState(false);
  return (
    <div style={{ background:"var(--amber-dim)", borderBottom:"1px solid rgba(245,158,11,.3)",
      padding:"10px 24px", display:"flex", alignItems:"center", justifyContent:"space-between",
      fontSize:13, color:"#fbbf24", flexShrink:0 }}>
      <span>⚠️ Please verify your email address to unlock all features.</span>
      {sent
        ? <span style={{ fontSize:12, opacity:.8 }}>Email sent — check your inbox.</span>
        : <button className="btn btn-ghost btn-sm" style={{ color:"#fbbf24", borderColor:"rgba(245,158,11,.4)" }}
            onClick={async () => { await onResend(); setSent(true); }}>
            Resend verification email
          </button>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TRANSLATION + BILINGUAL FIELD (psc_translation.jsx)
// ═══════════════════════════════════════════════════════════════════

// ─── psc_translation.jsx ──────────────────────────────────────────────────────
// LangContext, BilingualField, BilText.
// Translation now goes via backend API — no Anthropic key in the browser.


// ─── LANG CONTEXT ─────────────────────────────────────────────────────────────
const LangContext = createContext({ viewLang:"EN", setViewLang:()=>{} });
const useLang = () => useContext(LangContext);

function LangProvider({ defaultLang="EN", children }) {
  const [viewLang, setViewLang] = useState(defaultLang);
  return <LangContext.Provider value={{ viewLang, setViewLang }}>{children}</LangContext.Provider>;
}

function LangToggle({ compact=false }) {
  const { viewLang, setViewLang } = useLang();
  return (
    <div className="lang-toggle">
      {[["CY","🏴󠁧󠁢󠁷󠁬󠁳󠁿 Cymraeg"],["EN","🇬🇧 English"]].map(([k,l])=>(
        <button key={k} className={`lang-btn${viewLang===k?" active":""}`} onClick={()=>setViewLang(k)}>
          {compact ? (k==="CY"?"🏴󠁧󠁢󠁷󠁬󠁳󠁿":"🇬🇧") : l}
        </button>
      ))}
    </div>
  );
}

// ─── TranslationIndicator ─────────────────────────────────────────────────────
function TranslationIndicator({ status }) {
  const map = {
    NOT_REQUIRED: null,
    PENDING:      { label:"Pending", cls:"", icon:"⏳" },
    AUTO_TRANSLATED: { label:"Auto", cls:"auto", icon:"🌐" },
    REVIEWED:     { label:"Reviewed", cls:"reviewed", icon:"✓" },
  };
  const m = map[status];
  if (!m) return null;
  return <span className={`bil-status ${m.cls}`}>{m.icon} {m.label}</span>;
}

// ─── BilText (read-only) ──────────────────────────────────────────────────────
function BilText({ field, fallback="—" }) {
  const { viewLang } = useLang();
  if (!field || typeof field === "string") return <span>{field||fallback}</span>;
  const text = viewLang === field.original_language
    ? field.source_text
    : (field.translated_text || field.source_text);
  return <span>{text || fallback}</span>;
}

// ─── BilingualField (edit + translate) ───────────────────────────────────────
// Accepts: field, onChange, disabled, multiline, placeholder, hint, storyId
// storyId is needed for the backend translation route.
// If storyId not provided, translation button is shown but routes via a 
// direct Anthropic API call as fallback (requires VITE_ANTHROPIC_KEY).
function BilingualField({
  field, onChange, disabled=false, multiline=true,
  placeholder="", hint="", storyId=null
}) {
  const { viewLang } = useLang();
  const [translating, setTranslating] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState(false);

  if (!field || typeof field === "string") {
    return multiline
      ? <textarea className="fta" disabled={disabled} value={field||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>
      : <input className="fi" disabled={disabled} value={field||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>;
  }

  const isCYSource = field.original_language === "CY";
  const sourceLang = field.original_language;
  const targetLang = sourceLang === "CY" ? "EN" : "CY";

  const handleTranslate = async () => {
    if (!field.source_text?.trim()) return;
    setTranslating(true);
    try {
      let translated;
      if (storyId) {
        const res = await api.translate.field(storyId, field.source_text, sourceLang);
        translated = res.translated_text || res.text;
      } else {
        // Fallback: direct Anthropic call (dev only, needs VITE_ANTHROPIC_KEY)
        const ANTHROPIC_KEY = null; // Translation handled by backend API
        if (!ANTHROPIC_KEY) throw new Error("No storyId or VITE_ANTHROPIC_KEY provided");
        const langNames = { CY:"Welsh (Cymraeg)", EN:"English" };
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST",
          headers:{ "Content-Type":"application/json", "x-api-key":ANTHROPIC_KEY, "anthropic-version":"2023-06-01" },
          body: JSON.stringify({
            model:"claude-sonnet-4-5",
            max_tokens:1000,
            messages:[{ role:"user", content:`Translate the following ${langNames[sourceLang]} text to ${langNames[targetLang]}. This is a TV/broadcast production document. Preserve editorial tone, names and places. Return ONLY the translation.\n\n${field.source_text}` }]
          })
        });
        const d = await res.json();
        translated = d.content?.[0]?.text?.trim() || "";
      }
      onChange({ ...field, translated_text:translated, translation_status:"AUTO_TRANSLATED", translation_method:"MACHINE" });
    } catch (e) {
      console.error("Translation failed:", e);
    } finally {
      setTranslating(false);
    }
  };

  const sourceFlag  = isCYSource ? "🏴󠁧󠁢󠁷󠁬󠁳󠁿" : "🇬🇧";
  const targetFlag  = isCYSource ? "🇬🇧" : "🏴󠁧󠁢󠁷󠁬󠁳󠁿";
  const sourceName  = isCYSource ? "CYMRAEG" : "ENGLISH";
  const targetName  = isCYSource ? "ENGLISH" : "CYMRAEG";

  return (
    <div className="bil-field">
      {/* Source panel */}
      <div className="bil-panel">
        <div className="bil-panel-hd">
          <span className={`bil-lang-tag ${isCYSource?"bil-cy":"bil-en"}`}>{sourceFlag} {sourceName} — Source</span>
          <TranslationIndicator status={field.translation_status}/>
        </div>
        {hint && <p className="fh" style={{ marginBottom:6 }}>{hint}</p>}
        {disabled
          ? <div className="bil-text">{field.source_text || <span style={{ color:"var(--text4)" }}>—</span>}</div>
          : multiline
            ? <textarea className="bil-textarea" value={field.source_text||""} placeholder={placeholder}
                onChange={e=>onChange({ ...field, source_text:e.target.value, translation_status:e.target.value?"PENDING":"NOT_REQUIRED" })}/>
            : <input className="fi" value={field.source_text||""} placeholder={placeholder}
                onChange={e=>onChange({ ...field, source_text:e.target.value, translation_status:e.target.value?"PENDING":"NOT_REQUIRED" })}/>
        }
        {!disabled && field.source_text?.trim() && (
          <div className="bil-actions">
            {translating
              ? <div className="bil-translating">🌐 Translating…</div>
              : <button className="btn btn-ghost btn-xs" onClick={handleTranslate}>🌐 Auto-translate →</button>}
          </div>
        )}
      </div>

      {/* Translation panel */}
      <div className="bil-panel" style={{ background:"rgba(255,255,255,.018)" }}>
        <div className="bil-panel-hd">
          <span className={`bil-lang-tag ${!isCYSource?"bil-cy":"bil-en"}`}>{targetFlag} {targetName}</span>
          {field.translated_text && !editingTranslation && !disabled && (
            <button className="btn btn-ghost btn-xs" onClick={()=>setEditingTranslation(true)}>Edit ✏️</button>
          )}
          {field.translated_text && field.translation_status==="AUTO_TRANSLATED" && !disabled && !editingTranslation && (
            <button className="btn btn-ghost btn-xs" style={{ color:"var(--green)" }}
              onClick={()=>onChange({ ...field, translation_status:"REVIEWED" })}>✓ Mark reviewed</button>
          )}
        </div>
        {!field.translated_text && !editingTranslation
          ? <div className="bil-text" style={{ color:"var(--text4)", fontStyle:"italic" }}>
              {translating ? "Translating…" : "Not yet translated — use Auto-translate above."}
            </div>
          : (editingTranslation && !disabled)
            ? <>
                {multiline
                  ? <textarea className="bil-textarea" value={field.translated_text||""} autoFocus
                      onChange={e=>onChange({ ...field, translated_text:e.target.value })}/>
                  : <input className="fi" value={field.translated_text||""} autoFocus
                      onChange={e=>onChange({ ...field, translated_text:e.target.value })}/>}
                <div className="bil-actions">
                  <button className="btn btn-ghost btn-xs" onClick={()=>setEditingTranslation(false)}>Done</button>
                  <button className="btn btn-ghost btn-xs" style={{ color:"var(--green)" }}
                    onClick={()=>{ onChange({ ...field, translation_status:"REVIEWED" }); setEditingTranslation(false); }}>✓ Mark Reviewed</button>
                </div>
              </>
            : <div className="bil-text">{field.translated_text}</div>
        }
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ACCOUNTS PAGES (psc_accounts.jsx)
// ═══════════════════════════════════════════════════════════════════

// ─── psc_accounts.jsx ─────────────────────────────────────────────────────────
// UserAccountPage, OrganisationPage, TeamManagementPage — all wired to API.


function Card({children,style}){return <div className="card" style={style}>{children}</div>;}
function CardHd({title,sub,right}){return <div className="card-hd"><div className="card-hd-l"><span className="card-title">{title}</span>{sub&&<span className="card-sub">{sub}</span>}</div>{right}</div>;}
function CardBd({children}){return <div className="card-bd">{children}</div>;}
function SavedBadge({ show }){ return show ? <span className="badge b-del">✓ Saved</span> : null; }
function ApiError({ msg }) {
  return msg ? <div style={{ background:"var(--red-dim)", color:"#f87171", borderRadius:8, padding:"10px 14px", fontSize:13, marginBottom:14 }}>{msg}</div> : null;
}

// ─── MY ACCOUNT ───────────────────────────────────────────────────────────────
function UserAccountPage() {
  const { session, logout, updateUser } = useSession();
  const { viewLang, setViewLang } = useLang();
  const user = session.user;
  const org  = session.org;

  const [form,  setForm]  = useState({ name: user.name, email: user.email, job_title: user.job_title||"", preferred_lang: user.preferred_lang||"EN" });
  const [pw,    setPw]    = useState({ current:"", next:"", confirm:"" });
  const [saved, setSaved] = useState(false);
  const [saving,setSaving]= useState(false);
  const [error, setError] = useState("");
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));
  const setPwF = (k,v) => setPw(p => ({ ...p, [k]:v }));

  const saveProfile = async () => {
    setError(""); setSaving(true);
    try {
      const data = await api.auth.updateProfile(form);
      updateUser(form);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.data?.error || "Save failed.");
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    setError("");
    if (!pw.current || !pw.next) { setError("Please fill in all password fields."); return; }
    if (pw.next !== pw.confirm)  { setError("New passwords do not match."); return; }
    if (pw.next.length < 8)      { setError("Password must be at least 8 characters."); return; }
    setSaving(true);
    try {
      await api.auth.changePassword({ current_password: pw.current, new_password: pw.next });
      setPw({ current:"", next:"", confirm:"" });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.data?.error || "Password change failed.");
    } finally { setSaving(false); }
  };

  const myTeams = (org?.teams || []).filter(t => user.team_ids?.includes(t.id));

  return (
    <div className="content">
      <div className="sh">
        <div className="sh-left"><h1>My Account</h1><p>Personal settings and preferences</p></div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <SavedBadge show={saved}/>
          <Btn cls="btn-ghost" onClick={logout}>Sign Out</Btn>
        </div>
      </div>

      <div className="profile-header">
        <AvatarUploadWidget user={user} size={64} onUploaded={(result) => {
          if (result?.avatar_url) updateUser({ avatar_url: result.avatar_url });
        }}/>
        <div style={{ flex:1 }}>
          <div className="profile-name">{user.name}</div>
          <div className="profile-meta">
            <span>✉️ {user.email}</span>
            {user.job_title && <span>💼 {user.job_title}</span>}
            <span><span className="badge b-role">{ALL_ROLES[user.role]?.label||user.role}</span></span>
          </div>
        </div>
      </div>

      <ApiError msg={error}/>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:16 }}>
        <Card>
          <CardHd title="Profile Information"/>
          <CardBd>
            <div className="fg"><label className="fl">Full Name</label><input className="fi" value={form.name} onChange={e=>set("name",e.target.value)}/></div>
            <div className="fg"><label className="fl">Email Address</label><input className="fi" type="email" value={form.email} onChange={e=>set("email",e.target.value)}/></div>
            <div className="fg"><label className="fl">Job Title</label><input className="fi" value={form.job_title} onChange={e=>set("job_title",e.target.value)}/></div>
            <Btn cls="btn-primary" sm onClick={saveProfile} disabled={saving}>{saving?"Saving…":"Save Changes"}</Btn>
          </CardBd>
        </Card>

        <Card>
          <CardHd title="Language Preferences"/>
          <CardBd>
            <div className="fg">
              <label className="fl">Content Display Language</label>
              <p className="fh">Your default language for viewing editorial content.</p>
              <LangToggle/>
            </div>
            <div className="fg">
              <label className="fl">Preferred UI Language</label>
              <select className="fsel" value={form.preferred_lang} onChange={e=>set("preferred_lang",e.target.value)}>
                <option value="CY">🏴󠁧󠁢󠁷󠁬󠁳󠁿 Cymraeg (Welsh)</option>
                <option value="EN">🇬🇧 English</option>
              </select>
            </div>
          </CardBd>
        </Card>

        <Card>
          <CardHd title="Change Password"/>
          <CardBd>
            <div className="fg"><label className="fl">Current Password</label><input className="fi" type="password" value={pw.current} onChange={e=>setPwF("current",e.target.value)}/></div>
            <div className="fg"><label className="fl">New Password</label><input className="fi" type="password" value={pw.next} onChange={e=>setPwF("next",e.target.value)}/></div>
            <div className="fg"><label className="fl">Confirm New Password</label><input className="fi" type="password" value={pw.confirm} onChange={e=>setPwF("confirm",e.target.value)}/></div>
            <Btn cls="btn-secondary" sm onClick={changePassword} disabled={saving}>Update Password</Btn>
          </CardBd>
        </Card>

        <Card>
          <CardHd title="Team Membership" sub={`${myTeams.length} team${myTeams.length!==1?"s":""}`}/>
          <CardBd>
            {myTeams.length === 0
              ? <p style={{ color:"var(--text3)", fontSize:13 }}>Not assigned to any team.</p>
              : myTeams.map(t => (
                <div key={t.id} className="team-row">
                  <div className="team-av">{t.icon||"👥"}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{t.name}</div>
                    <div style={{ fontSize:11, color:"var(--text3)" }}>{t.description||""}</div>
                  </div>
                  <span className="badge b-role">{ALL_ROLES[user.role]?.label}</span>
                </div>
              ))}
          </CardBd>
        </Card>
      </div>
    </div>
  );
}

// ─── ORGANISATION ─────────────────────────────────────────────────────────────
function OrganisationPage({ orgMembers, onMembersChange }) {
  const { session, updateOrg } = useSession();
  const org = session.org;
  const can = (a) => canDo(session.user.role, a);

  const [form,   setForm]   = useState({ name: org.name||"", default_language: org.default_language||"CY", privacy_default: org.privacy_default||"TEAM_ONLY" });
  const [invite, setInvite] = useState({ email:"", role:"PRODUCER" });
  const [saved,  setSaved]  = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const [stats,  setStats]  = useState(null);
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");
  const [inviteOk, setInviteOk] = useState(false);
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  useEffect(() => {
    api.org.stats().then(setStats).catch(() => {});
  }, []);

  const saveOrg = async () => {
    setError(""); setSaving(true);
    try {
      const updated = await api.org.update(form);
      updateOrg(updated);
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e.data?.error || "Save failed.");
    } finally { setSaving(false); }
  };

  const sendInvite = async () => {
    if (!invite.email) return;
    setInviting(true); setInviteMsg(""); setInviteOk(false);
    try {
      await api.org.invite(invite);
      setInviteMsg(`Invite sent to ${invite.email}`);
      setInviteOk(true);
      setInvite({ email:"", role:"PRODUCER" });
    } catch (e) {
      setInviteMsg(e.data?.error || "Invite failed.");
      setInviteOk(false);
    } finally { setInviting(false); }
  };

  const removeM = async (id) => {
    if (!window.confirm("Remove this member?")) return;
    try {
      await api.org.removeMember(id);
      onMembersChange(prev => prev.filter(u => u.id !== id));
    } catch (e) {
      alert(e.data?.error || "Failed to remove member.");
    }
  };

  return (
    <div className="content">
      <div className="sh">
        <div className="sh-left"><h1>Organisation</h1><p>{org.name}</p></div>
        <SavedBadge show={saved}/>
      </div>

      <div className="profile-header">
        <div className="org-logo-box">
          {org.logo_url ? <img src={org.logo_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:12 }}/> : (org.name||"?").split(" ").map(w=>w[0]).join("").slice(0,2)}
        </div>
        <div style={{ flex:1 }}>
          <div className="profile-name">{org.name}</div>
          <div className="profile-meta">
            <span>🌐 {org.slug}.pscmodule.wales</span>
            <span>👥 {orgMembers.length} members</span>
          </div>
        </div>
      </div>

      <ApiError msg={error}/>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:16 }}>
        <Card>
          <CardHd title="Organisation Details"/>
          <CardBd>
            <div className="fg"><label className="fl">Company Name</label><input className="fi" disabled={!can("MANAGE_ORG")} value={form.name} onChange={e=>set("name",e.target.value)}/></div>
            <div className="fg">
              <label className="fl">Default Language</label>
              <select className="fsel" disabled={!can("MANAGE_ORG")} value={form.default_language} onChange={e=>set("default_language",e.target.value)}>
                <option value="CY">🏴󠁧󠁢󠁷󠁬󠁳󠁿 Cymraeg (Welsh)</option>
                <option value="EN">🇬🇧 English</option>
              </select>
            </div>
            <div className="fg">
              <label className="fl">Default Story Privacy</label>
              <select className="fsel" disabled={!can("MANAGE_ORG")} value={form.privacy_default} onChange={e=>set("privacy_default",e.target.value)}>
                {Object.entries(VISIBILITY).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
            {can("MANAGE_ORG") && <Btn cls="btn-primary" sm onClick={saveOrg} disabled={saving}>{saving?"Saving…":"Save Changes"}</Btn>}
          </CardBd>
        </Card>

        <Card>
          <CardHd title="Invite Member"/>
          <CardBd>
            <div className="fg"><label className="fl">Email address</label>
              <input className="fi" type="email" value={invite.email} onChange={e=>setInvite(p=>({...p,email:e.target.value}))} placeholder="colleague@company.wales"/>
            </div>
            <div className="fg"><label className="fl">Role</label>
              <select className="fsel" value={invite.role} onChange={e=>setInvite(p=>({...p,role:e.target.value}))}>
                {Object.entries({...ORG_ROLES,...TEAM_ROLES}).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <Btn cls="btn-primary" sm onClick={sendInvite} disabled={inviting||!invite.email}>{inviting?"Sending…":"Send Invite"}</Btn>
            {inviteMsg && <p style={{ marginTop:10, fontSize:12, color: inviteOk ? "var(--green)" : "var(--red)" }}>{inviteOk ? "✓ " : "✗ "}{inviteMsg}</p>}
          </CardBd>
        </Card>

        {stats && (
          <Card style={{ gridColumn:"1/-1" }}>
            <CardHd title="Organisation Stats"/>
            <CardBd>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 }}>
                {[
                  ["Stories", stats.total_stories||0, "all time"],
                  ["Members", orgMembers.length, "active"],
                  ["Deliverables", stats.total_deliverables||0, "across stories"],
                  ["Translation Cache", stats.translation_cache||0, "cached entries"],
                ].map(([l,v,s]) => (
                  <div key={l} style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:12 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:9, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--text4)", marginBottom:6 }}>{l}</div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:22, fontWeight:800, color:"var(--text)" }}>{v}</div>
                    <div style={{ fontSize:11, color:"var(--text3)" }}>{s}</div>
                  </div>
                ))}
              </div>
            </CardBd>
          </Card>
        )}

        <Card style={{ gridColumn:"1/-1" }}>
          <CardHd title="Members" sub={`${orgMembers.length}`}/>
          <CardBd>
            {orgMembers.map(u => (
              <div key={u.id} className="user-row">
                <UserAvatar user={u} size={30}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{u.name}</div>
                  <div style={{ fontSize:11, color:"var(--text3)" }}>{u.job_title||""} · {u.email}</div>
                </div>
                <span className="badge b-role">{ALL_ROLES[u.role]?.label||u.role}</span>
                {can("MANAGE_USERS") && u.id !== session.user.id && (
                  <Btn xs cls="btn-danger" onClick={() => removeM(u.id)}>Remove</Btn>
                )}
              </div>
            ))}
          </CardBd>
        </Card>
      </div>
    </div>
  );
}

// ─── TEAM MANAGEMENT ─────────────────────────────────────────────────────────
function TeamManagementPage({ orgMembers, onMembersChange }) {
  const { session } = useSession();
  const can = (a) => canDo(session.user.role, a);

  const [teams,        setTeams]        = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [showAdd,      setShowAdd]      = useState(false);
  const [newUser,      setNewUser]      = useState({ email:"", role:"PRODUCER" });
  const [adding,       setAdding]       = useState(false);
  const [addMsg,       setAddMsg]       = useState("");

  useEffect(() => {
    api.teams.list().then(data => {
      setTeams(data || []);
      if (data?.length) setSelectedTeam(data[0].id);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const team = teams.find(t => t.id === selectedTeam);
  const teamMembers = orgMembers.filter(u => u.team_ids?.includes(selectedTeam));

  const addTeam = async () => {
    try {
      const t = await api.teams.create({ name:"New Team", icon:"👥", description:"" });
      setTeams(prev => [...prev, t]);
      setSelectedTeam(t.id);
    } catch (e) { alert(e.data?.error||"Failed to create team."); }
  };

  const saveTeam = async (changes) => {
    if (!selectedTeam) return;
    try {
      await api.teams.update(selectedTeam, changes);
      setTeams(prev => prev.map(t => t.id===selectedTeam ? { ...t, ...changes } : t));
    } catch {}
  };

  const addMember = async () => {
    if (!newUser.email) return;
    setAdding(true); setAddMsg("");
    const member = orgMembers.find(u => u.email.toLowerCase() === newUser.email.toLowerCase());
    if (!member) { setAddMsg("No member found with that email."); setAdding(false); return; }
    try {
      await api.teams.addMember(selectedTeam, member.id);
      onMembersChange(prev => prev.map(u => u.id===member.id
        ? { ...u, team_ids: [...(u.team_ids||[]), selectedTeam] }
        : u));
      setNewUser({ email:"", role:"PRODUCER" });
      setShowAdd(false);
    } catch (e) {
      setAddMsg(e.data?.error || "Failed to add member.");
    } finally { setAdding(false); }
  };

  const removeMember = async (uid) => {
    try {
      await api.teams.removeMember(selectedTeam, uid);
      onMembersChange(prev => prev.map(u => u.id===uid
        ? { ...u, team_ids: (u.team_ids||[]).filter(id => id !== selectedTeam) }
        : u));
    } catch (e) { alert(e.data?.error||"Remove failed."); }
  };

  const changeRole = async (uid, role) => {
    try {
      await api.org.updateMember(uid, { role });
      onMembersChange(prev => prev.map(u => u.id===uid ? { ...u, role } : u));
    } catch {}
  };

  if (loading) return <div className="content"><p style={{ color:"var(--text3)" }}>Loading teams…</p></div>;

  return (
    <div className="content">
      <div className="sh">
        <div className="sh-left"><h1>Team Management</h1><p>Teams, members and role assignments</p></div>
        {can("MANAGE_TEAMS") && <Btn cls="btn-primary" sm onClick={addTeam}>＋ New Team</Btn>}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:16 }}>
        <div>
          <div className="card">
            <div className="card-hd"><span className="card-title">Teams</span><span className="card-sub">{teams.length}</span></div>
            <div style={{ padding:"8px" }}>
              {teams.map(t => {
                const mc = orgMembers.filter(u => u.team_ids?.includes(t.id)).length;
                return (
                  <div key={t.id}
                    style={{ padding:"10px 12px", borderRadius:"var(--radius-sm)", cursor:"pointer", marginBottom:2,
                      background: selectedTeam===t.id?"var(--surface3)":"transparent",
                      border: selectedTeam===t.id?"1px solid var(--accent)":"1px solid transparent" }}
                    onClick={() => setSelectedTeam(t.id)}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:16 }}>{t.icon||"👥"}</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{t.name}</div>
                        <div style={{ fontSize:11, color:"var(--text3)" }}>{mc} member{mc!==1?"s":""}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {team && (
          <div>
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-l">
                  <span style={{ fontSize:20 }}>{team.icon||"👥"}</span>
                  <span className="card-title">{team.name}</span>
                  <span className="card-sub">{teamMembers.length} members</span>
                </div>
                {can("MANAGE_USERS") && <Btn sm cls="btn-primary" onClick={() => setShowAdd(v=>!v)}>＋ Add Member</Btn>}
              </div>
              <div className="card-bd">
                {can("MANAGE_TEAMS") && (
                  <div className="frow frow-2" style={{ marginBottom:16 }}>
                    <div className="fg"><label className="fl">Team Name</label>
                      <input className="fi" value={team.name} onChange={e=>saveTeam({name:e.target.value})}/>
                    </div>
                    <div className="fg"><label className="fl">Description</label>
                      <input className="fi" value={team.description||""} onChange={e=>saveTeam({description:e.target.value})}/>
                    </div>
                  </div>
                )}

                {showAdd && (
                  <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:16, marginBottom:16 }}>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:11, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--text3)", marginBottom:12 }}>Add to Team</div>
                    <div className="fg"><label className="fl">Member email (must already be in org)</label>
                      <input className="fi" type="email" value={newUser.email} onChange={e=>setNewUser(f=>({...f,email:e.target.value}))} placeholder="colleague@yourcompany.wales"/>
                    </div>
                    {addMsg && <p style={{ fontSize:12, color:"var(--red)", marginBottom:8 }}>{addMsg}</p>}
                    <div style={{ display:"flex", gap:8 }}>
                      <Btn sm cls="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
                      <Btn sm cls="btn-primary" onClick={addMember} disabled={adding||!newUser.email}>{adding?"Adding…":"Add to Team"}</Btn>
                    </div>
                  </div>
                )}

                {teamMembers.length === 0
                  ? <div style={{ padding:"20px 0", textAlign:"center", color:"var(--text3)", fontSize:13 }}>No members in this team.</div>
                  : teamMembers.map(u => (
                    <div key={u.id} className="user-row">
                      <UserAvatar user={u} size={30}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{u.name}</div>
                        <div style={{ fontSize:11, color:"var(--text3)" }}>{u.job_title||""} · {u.email}</div>
                      </div>
                      <span style={{ fontSize:11, color:"var(--text3)" }}>{u.preferred_lang==="CY"?"🏴󠁧󠁢󠁷󠁬󠁳󠁿":"🇬🇧"}</span>
                      {can("MANAGE_TEAMS") ? (
                        <select className="fsel" value={u.role} onChange={e=>changeRole(u.id,e.target.value)} style={{ width:120 }}>
                          {Object.entries({...ORG_ROLES,...TEAM_ROLES}).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                        </select>
                      ) : (
                        <span className="badge b-role">{ALL_ROLES[u.role]?.label||u.role}</span>
                      )}
                      {can("MANAGE_USERS") && u.id !== session.user.id && (
                        <Btn xs cls="btn-danger" onClick={() => removeMember(u.id)}>Remove</Btn>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            <div className="card">
              <CardHd title="Permissions Reference" sub="for this team"/>
              <CardBd>
                <div className="tbl-wrap"><table>
                  <thead><tr><th>Action</th><th>Required</th><th>Who can</th></tr></thead>
                  <tbody>
                    {[
                      ["Create Story","Producer+","Producer, Manager, Admin, Owner"],
                      ["Edit PSC Brief","Producer+","Producer, Manager, Admin, Owner"],
                      ["Edit Handover","Editor+","Editor, Producer, Manager, Admin, Owner"],
                      ["Export Editor Pack","Social+","Social, Editor, Producer, Manager, Admin, Owner"],
                      ["Review Translation","Editor+","Editor, Producer, Manager, Admin, Owner"],
                      ["Change Visibility","Producer+","Producer, Manager, Admin, Owner"],
                      ["Manage Teams","Manager+","Manager, Admin, Owner"],
                      ["Manage Users","Admin+","Admin, Owner"],
                      ["Organisation Settings","Owner only","Owner"],
                    ].map(([a,r,w])=>(
                      <tr key={a}><td style={{ fontWeight:500 }}>{a}</td><td><span className="badge b-role">{r}</span></td><td style={{ fontSize:12, color:"var(--text3)" }}>{w}</td></tr>
                    ))}
                  </tbody>
                </table></div>
              </CardBd>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PSC BRIEF / SHOOT NOTES / HANDOVER (psc_brief.jsx)
// ═══════════════════════════════════════════════════════════════════

// ─── psc_brief.jsx ────────────────────────────────────────────────────────────
// PSCBriefTab, ShootNotesTab, HandoverTab — wired to API via onUpdate().
// Each tab auto-saves on every field change (debounced 800ms).


// ─── useDebounce ──────────────────────────────────────────────────────────────
function useDebounced(fn, delay = 800) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

// ─── PSC BRIEF TAB ────────────────────────────────────────────────────────────
function PSCBriefTab({ story, onUpdate }) {
  const { session } = useSession();
  const b = story.brief || story.psc_brief || {};
  const locked = ["IN_EDIT","DELIVERED","ARCHIVED"].includes(story.status);
  const canEdit = !locked && canDo(session?.user?.role, "EDIT_BRIEF");
  const lang = b.story_hook?.original_language || story.input_language || "CY";

  const save = useDebounced((briefUpdates) => {
    api.stories.updateBrief(story.id, briefUpdates).catch(()=>{});
  });

  const upd = (f, v) => {
    const updated = { ...b, [f]:v };
    save(updated);
    return updated;
  };
  const updArr = (key, id, f, v) => {
    const updated = { ...b, [key]: b[key].map(x => x.id===id ? {...x,[f]:v} : x) };
    save(updated);
  };
  const addArr = (key, item) => {
    const updated = { ...b, [key]: [...(b[key]||[]), item] };
    save(updated);
  };
  const delArr = (key, id) => {
    const updated = { ...b, [key]: b[key].filter(x => x.id!==id) };
    save(updated);
  };

  return (
    <div>
      {locked && <Notice type="purple" icon="🔒">PSC Brief is locked while in edit or delivered.</Notice>}
      {!canEdit && !locked && <Notice type="amber" icon="⚠️">Your role ({session?.user?.role}) does not have permission to edit PSC Briefs.</Notice>}

      <div className="card">
        <div className="card-hd">
          <span className="card-title">Story Hook</span>
          <span className={`badge ${lang==="CY"?"b-teal":"b-dev"}`}>{lang==="CY"?"🏴󠁧󠁢󠁷󠁬󠁳󠁿 Welsh source":"🇬🇧 English source"}</span>
        </div>
        <div className="card-bd">
          <BilingualField field={b.story_hook} storyId={story.id}
            onChange={v=>upd("story_hook",v)} disabled={!canEdit}
            placeholder="Short paragraph summarising the core idea..."
            hint="What makes this story interesting? What is the emotional or narrative hook?"/>
        </div>
      </div>

      <div className="card">
        <div className="card-hd"><span className="card-title">Why Now</span></div>
        <div className="card-bd">
          <BilingualField field={b.why_now} storyId={story.id}
            onChange={v=>upd("why_now",v)} disabled={!canEdit}
            placeholder="Why is this story relevant right now?"
            hint="Topical issue, local event, personal milestone, news relevance."/>
        </div>
      </div>

      <div className="card">
        <div className="card-hd"><span className="card-title">Tone</span></div>
        <div className="card-bd">
          <div className="tone-grid" style={{ marginBottom:14 }}>
            {TONES.map(t => <div key={t} className={`tone-pill${b.tone===t?" sel":""}`} onClick={()=>canEdit&&upd("tone",t)}>{t}</div>)}
          </div>
          <BilingualField field={b.tone_notes} storyId={story.id}
            onChange={v=>upd("tone_notes",v)} disabled={!canEdit}
            multiline={false} placeholder="Optional tone notes…"/>
        </div>
      </div>

      <div className="card">
        <div className="card-hd"><span className="card-title">Ending / Payoff</span></div>
        <div className="card-bd">
          <BilingualField field={b.ending} storyId={story.id}
            onChange={v=>upd("ending",v)} disabled={!canEdit}
            placeholder="What should the audience feel at the end?"
            hint="Is there a reveal, hopeful resolution, or unresolved tension?"/>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <span className="card-title">Key Characters</span>
          {canEdit && <Btn sm onClick={()=>addArr("characters",{id:genId(),name:"",role:blankBF("",lang),notes:blankBF("",lang)})}>＋ Add</Btn>}
        </div>
        <div className="card-bd">
          {!b.characters?.length ? <Empty icon="👤" title="No characters yet"/> : (
            <div className="tbl-wrap"><table>
              <thead><tr><th>Name</th><th>Role in Story</th><th>Notes</th>{canEdit&&<th></th>}</tr></thead>
              <tbody>{b.characters.map(c => (
                <tr key={c.id}>
                  <td><input className="fi" disabled={!canEdit} value={c.name} onChange={e=>updArr("characters",c.id,"name",e.target.value)} placeholder="Full name"/></td>
                  <td><BilingualField field={c.role} storyId={story.id} onChange={v=>updArr("characters",c.id,"role",v)} disabled={!canEdit} multiline={false}/></td>
                  <td><BilingualField field={c.notes} storyId={story.id} onChange={v=>updArr("characters",c.id,"notes",v)} disabled={!canEdit} multiline={false}/></td>
                  {canEdit && <td><Btn xs cls="btn-danger" onClick={()=>delArr("characters",c.id)}>✕</Btn></td>}
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <span className="card-title">Key Sync Lines Needed</span>
          {canEdit && <Btn sm onClick={()=>addArr("sync_lines",{id:genId(),prompt:blankBF("",lang),priority:"MUST",notes:blankBF("",lang)})}>＋ Add</Btn>}
        </div>
        <div className="card-bd">
          {!b.sync_lines?.length ? <Empty icon="🎙" title="No sync prompts yet"/> : (
            b.sync_lines.map(s => (
              <div key={s.id} style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:14, marginBottom:10 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 120px", gap:10, marginBottom:10 }}>
                  <div>
                    <label className="fl">Interview Prompt</label>
                    <BilingualField field={s.prompt} storyId={story.id} onChange={v=>updArr("sync_lines",s.id,"prompt",v)} disabled={!canEdit} multiline={false} placeholder='"How has this affected you?"'/>
                  </div>
                  <div>
                    <label className="fl">Priority</label>
                    {!canEdit ? <PBadge p={s.priority}/> : (
                      <select className="fsel" value={s.priority} onChange={e=>updArr("sync_lines",s.id,"priority",e.target.value)}>
                        {PRIORITIES.map(p=><option key={p}>{p}</option>)}
                      </select>
                    )}
                  </div>
                </div>
                <BilingualField field={s.notes} storyId={story.id} onChange={v=>updArr("sync_lines",s.id,"notes",v)} disabled={!canEdit} multiline={false} placeholder="Notes…"/>
                {canEdit && <Btn xs cls="btn-danger" style={{ marginTop:8 }} onClick={()=>delArr("sync_lines",s.id)}>Remove</Btn>}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <span className="card-title">Visual Moments / Activities</span>
          {canEdit && <Btn sm onClick={()=>addArr("visuals",{id:genId(),activity:blankBF("",lang),location:"",notes:blankBF("",lang),priority:"MUST"})}>＋ Add</Btn>}
        </div>
        <div className="card-bd">
          {!b.visuals?.length ? <Empty icon="🎬" title="No visual moments yet"/> : (
            b.visuals.map(v => (
              <div key={v.id} style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:14, marginBottom:10 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 120px", gap:10, marginBottom:10 }}>
                  <div>
                    <label className="fl">Activity</label>
                    <BilingualField field={v.activity} storyId={story.id} onChange={val=>updArr("visuals",v.id,"activity",val)} disabled={!canEdit} multiline={false} placeholder="Activity"/>
                  </div>
                  <div>
                    <label className="fl">Location</label>
                    <input className="fi" disabled={!canEdit} value={v.location} onChange={e=>updArr("visuals",v.id,"location",e.target.value)} placeholder="Location"/>
                  </div>
                  <div>
                    <label className="fl">Priority</label>
                    {!canEdit ? <PBadge p={v.priority}/> : (
                      <select className="fsel" value={v.priority} onChange={e=>updArr("visuals",v.id,"priority",e.target.value)}>
                        {PRIORITIES.map(p=><option key={p}>{p}</option>)}
                      </select>
                    )}
                  </div>
                </div>
                <BilingualField field={v.notes} storyId={story.id} onChange={val=>updArr("visuals",v.id,"notes",val)} disabled={!canEdit} multiline={false} placeholder="Visual notes…"/>
                {canEdit && <Btn xs cls="btn-danger" style={{ marginTop:8 }} onClick={()=>delArr("visuals",v.id)}>Remove</Btn>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SHOOT NOTES TAB ─────────────────────────────────────────────────────────
function ShootNotesTab({ story, onUpdate }) {
  const { session } = useSession();
  const n = story.shoot_notes || story.shootNotes || {};
  const canEdit = canDo(session?.user?.role, "EDIT_BRIEF");

  const save = useDebounced((updates) => {
    api.stories.updateShoot(story.id, updates).catch(()=>{});
  });

  const upd = (f, v) => save({ ...n, [f]:v });

  return (
    <div>
      {STATUSES_IDX(story.status) < 2 && <Notice type="amber" icon="⚠️">Shoot notes are typically completed after filming.</Notice>}
      {[
        ["worked_well","What Worked Well","Strong moments, coverage that exceeded expectations…"],
        ["unexpected","Unexpected Moments","Unplanned moments that could be gold…"],
        ["strong_beats","Strong Emotional Beats","Moments with real emotional power…"],
        ["missing","Missing Elements","What didn't we get? Do we need to return?"],
      ].map(([k,title,ph]) => (
        <div key={k} className="card">
          <div className="card-hd"><span className="card-title">{title}</span></div>
          <div className="card-bd">
            <BilingualField field={n[k]} storyId={story.id} onChange={v=>upd(k,v)} disabled={!canEdit} placeholder={ph}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── HANDOVER TAB ────────────────────────────────────────────────────────────
function HandoverTab({ story, onUpdate }) {
  const { session } = useSession();
  const b = story.brief || story.psc_brief || {};
  const h = story.handover || {};
  const canEdit = canDo(session?.user?.role, "EDIT_HANDOVER");
  const lang = h.story_intention?.original_language || "CY";

  const save = useDebounced((updates) => {
    api.stories.updateHandover(story.id, updates).catch(()=>{});
  });

  const upd  = (f, v)     => save({ ...h, [f]:v });
  const updC = (id, f, v) => save({ ...h, clips: h.clips?.map(c=>c.id===id?{...c,[f]:v}:c)||[] });
  const addC = ()         => save({ ...h, clips:[...(h.clips||[]),{id:genId(),interviewee:"",description:blankBF("",lang),tc_in:"",tc_out:"",asset:""}] });
  const delC = (id)       => save({ ...h, clips:(h.clips||[]).filter(c=>c.id!==id) });
  const updHL= (id, f, v) => save({ ...h, highlights: h.highlights?.map(x=>x.id===id?{...x,[f]:v}:x)||[] });
  const addHL= ()         => save({ ...h, highlights:[...(h.highlights||[]),{id:genId(),highlight:blankBF("",lang),asset:""}] });
  const delHL= (id)       => save({ ...h, highlights:(h.highlights||[]).filter(x=>x.id!==id) });

  return (
    <div>
      <div className="notice notice-purple" style={{ marginBottom:16 }}>
        <span>📋</span>
        <div>
          <strong>Brief Reference (read-only)</strong><br/>
          <span style={{ fontSize:12, opacity:.85 }}>
            <b>Hook:</b> <BilText field={b.story_hook} fallback="—"/> &nbsp;·&nbsp;
            <b>Tone:</b> {b.tone||"—"}
          </span>
        </div>
      </div>

      <div className="card">
        <div className="card-hd"><span className="card-title">Story Intention</span></div>
        <div className="card-bd">
          <p className="fh">What story are we telling? What should the audience understand and feel?</p>
          <BilingualField field={h.story_intention} storyId={story.id} onChange={v=>upd("story_intention",v)} disabled={!canEdit} placeholder="The editorial intention for the edit…"/>
        </div>
      </div>

      <div className="card">
        <div className="card-hd"><span className="card-title">Tone & Music Reference</span></div>
        <div className="card-bd">
          <div className="fg">
            <label className="fl">Tone Reference</label>
            <BilingualField field={h.tone_reference} storyId={story.id} onChange={v=>upd("tone_reference",v)} disabled={!canEdit} placeholder="e.g. Quiet observational style. Let the landscape do the work."/>
          </div>
          <div className="fg">
            <label className="fl">Music Suggestions (plain text)</label>
            <input className="fi" disabled={!canEdit} value={h.music_suggestions||""} onChange={e=>upd("music_suggestions",e.target.value)} placeholder="e.g. Slow acoustic guitar, minimal piano…"/>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-hd"><span className="card-title">Must-Use Interview Clips</span>{canEdit&&<Btn sm onClick={addC}>＋ Add Clip</Btn>}</div>
        <div className="card-bd">
          {!(h.clips?.length) ? <Empty icon="🎬" title="No clips added yet"/> : (h.clips||[]).map(c=>(
            <div key={c.id} style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, padding:14, marginBottom:10 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                <div className="fg"><label className="fl">Interviewee</label><input className="fi" disabled={!canEdit} value={c.interviewee} onChange={e=>updC(c.id,"interviewee",e.target.value)}/></div>
                <div className="fg"><label className="fl">Description</label><BilingualField field={c.description} storyId={story.id} onChange={v=>updC(c.id,"description",v)} disabled={!canEdit} multiline={false}/></div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 2fr auto", gap:10, alignItems:"flex-end" }}>
                <div className="fg"><label className="fl">TC In</label><input className="fi" disabled={!canEdit} value={c.tc_in} onChange={e=>updC(c.id,"tc_in",e.target.value)} placeholder="00:00:00"/></div>
                <div className="fg"><label className="fl">TC Out</label><input className="fi" disabled={!canEdit} value={c.tc_out} onChange={e=>updC(c.id,"tc_out",e.target.value)} placeholder="00:00:00"/></div>
                <div className="fg"><label className="fl">Asset Ref</label><input className="fi" disabled={!canEdit} value={c.asset} onChange={e=>updC(c.id,"asset",e.target.value)}/></div>
                {canEdit && <Btn xs cls="btn-danger" onClick={()=>delC(c.id)} style={{ marginBottom:18 }}>✕</Btn>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-hd"><span className="card-title">Visual Highlights</span>{canEdit&&<Btn sm onClick={addHL}>＋ Add</Btn>}</div>
        <div className="card-bd">
          {!(h.highlights?.length) ? <Empty icon="✨" title="No highlights yet"/> : (
            <div className="tbl-wrap"><table>
              <thead><tr><th>Highlight</th><th>Asset Ref</th>{canEdit&&<th></th>}</tr></thead>
              <tbody>{(h.highlights||[]).map(x=>(
                <tr key={x.id}>
                  <td><BilingualField field={x.highlight} storyId={story.id} onChange={v=>updHL(x.id,"highlight",v)} disabled={!canEdit} multiline={false} placeholder="Describe the visual moment…"/></td>
                  <td><input className="fi" disabled={!canEdit} value={x.asset} onChange={e=>updHL(x.id,"asset",e.target.value)} placeholder="Asset ref"/></td>
                  {canEdit&&<td><Btn xs cls="btn-danger" onClick={()=>delHL(x.id)}>✕</Btn></td>}
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-hd"><span className="card-title">Global Duration</span></div>
        <div className="card-bd">
          <select className="fsel" style={{ width:200 }} disabled={!canEdit} value={h.duration||""} onChange={e=>upd("duration",e.target.value)}>
            <option value="">— Select —</option>
            {DURATIONS.map(d=><option key={d}>{d}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DELIVERABLES / MEDIA / AUDIT (psc_deliverables.jsx)
// ═══════════════════════════════════════════════════════════════════

// ─── psc_deliverables.jsx ────────────────────────────────────────────────────
// DeliverablesTab, MediaTab, AuditTab — all wired to real API.


// ─── DELIVERABLES TAB ────────────────────────────────────────────────────────
function DeliverablesTab({ story, onUpdate }) {
  const { session } = useSession();
  const { viewLang } = useLang();
  const dels = story.deliverables || [];
  const canEdit = canDo(session?.user?.role, "EDIT_DELIVERABLES");
  const lang = story.brief?.story_hook?.original_language || story.input_language || "CY";
  const [saving, setSaving] = useState({});
  const [error, setError] = useState("");

  const setSav = (id, v) => setSaving(p => ({ ...p, [id]:v }));

  // Map UI field names → DB field names before sending to API
  const mapToDb = (changes) => {
    const m = { ...changes };
    if ("aspect_ratio"    in m) { m.format         = m.aspect_ratio;    delete m.aspect_ratio; }
    if ("duration_seconds"in m) { m.duration_secs   = m.duration_seconds; delete m.duration_seconds; }
    if ("cover_frame"     in m) { delete m.cover_frame; }  // not in schema
    if ("cover"           in m) { delete m.cover; }        // not in schema
    if ("thumbnail"       in m) { delete m.thumbnail; }    // not in schema
    if ("checked"         in m) { delete m.checked; }      // not in schema
    if ("platforms"       in m) { delete m.platforms; }    // stored in notes JSON
    if ("reframe"         in m) { delete m.reframe; }      // stored in notes JSON
    // BURNT_IN is not a valid DB enum value — map to SRT
    if (m.caption_format === "BURNT_IN") m.caption_format = "SRT";
    if (m.captions)               delete m.captions;       // alias field
    return m;
  };

  const add = async () => {
    setError("");
    try {
      // DB schema: platform (req), format, duration_secs, language, caption_required, caption_format, notes, status
      const d = await api.stories.createDeliverable(story.id, {
        platform:        "S4C",
        format:          "RATIO_16_9",
        duration_secs:   180,
        language:        "BILINGUAL",
        caption_required: false,
        caption_format:  "SRT",
        status:          "PENDING",
        notes:           "",
      });
      onUpdate(story.id, { deliverables:[...dels, d] }).catch(()=>{});
    } catch (e) { setError(e.data?.error||"Failed to add deliverable."); }
  };

  const upd = async (id, changes) => {
    setSav(id, true);
    try {
      await api.stories.updateDeliverable(story.id, id, mapToDb(changes));
      const updated = dels.map(d => d.id===id ? {...d,...changes} : d);
      onUpdate(story.id, { deliverables: updated }).catch(()=>{});
    } catch (e) { setError(e.data?.error||"Save failed."); }
    finally { setSav(id, false); }
  };

  const remove = async (id) => {
    if (!window.confirm("Remove this deliverable?")) return;
    try {
      await api.stories.deleteDeliverable(story.id, id);
      const updated = dels.filter(d => d.id!==id);
      onUpdate(story.id, { deliverables: updated }).catch(()=>{});
    } catch (e) { setError(e.data?.error||"Delete failed."); }
  };

  const tog = (id, key, val) => {
    const d = dels.find(x=>x.id===id);
    if (!d) return;
    const arr = d[key]||[];
    upd(id, { [key]: arr.includes(val) ? arr.filter(x=>x!==val) : [...arr,val] });
  };

  const allDone = dels.length > 0 && dels.every(d => d.status === "DELIVERED" || d.checked);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:16, fontWeight:700, marginBottom:3 }}>Output Deliverables</h3>
          <p style={{ fontSize:12, color:"var(--text3)" }}>At least one deliverable required before marking as Delivered.</p>
        </div>
        {canEdit && <Btn cls="btn-primary" onClick={add}>＋ Add Deliverable</Btn>}
      </div>

      {error && <div style={{ background:"var(--red-dim)", color:"#f87171", borderRadius:8, padding:"10px 14px", fontSize:13, marginBottom:14 }}>{error}</div>}
      {allDone && <Notice type="green" icon="✅">All deliverables are marked as complete!</Notice>}
      {dels.length === 0 && <Empty icon="📦" title="No deliverables yet" sub="Add at least one output format."/>}

      {dels.map(d => {
        const format   = d.format || d.aspect_ratio || "RATIO_16_9";
        const checked  = d.status === "DELIVERED";
        const isSaving = saving[d.id];
        return (
          <div key={d.id} className="del-card" style={checked?{borderColor:"var(--green)",background:"rgba(34,197,94,.04)"}:{}}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
              <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                <div>
                  <div className="del-ratio">{FORMATS[format]||format}</div>
                  <div className="del-desc">{FORMAT_DESC[format]||""}</div>
                </div>
                {checked && <span className="badge b-del"><span className="badge-dot"/>Done</span>}
                {isSaving && <span style={{ fontSize:11, color:"var(--text3)" }}>Saving…</span>}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                {canEdit && <Btn xs cls={checked?"btn-secondary":"btn-green"} onClick={()=>upd(d.id,{status:checked?"PENDING":"DELIVERED",checked:!checked})}>{checked?"↩ Unmark":"✓ Mark Done"}</Btn>}
                {canEdit && <Btn xs cls="btn-danger" onClick={()=>remove(d.id)}>Remove</Btn>}
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:14 }}>
              <div className="fg"><label className="fl">Format</label>
                <select className="fsel" disabled={!canEdit} value={format} onChange={e=>upd(d.id,{format:e.target.value})}>
                  {Object.entries(FORMATS).map(([k,v])=><option key={k} value={k}>{v} — {FORMAT_DESC[k]}</option>)}
                </select>
              </div>
              <div className="fg"><label className="fl">Duration (seconds)</label>
                <input type="number" className="fi" disabled={!canEdit} value={d.duration_secs||d.duration_seconds||180} onChange={e=>upd(d.id,{duration_secs:parseInt(e.target.value)||0})}/>
              </div>
              <div className="fg"><label className="fl">Captions</label>
                <select className="fsel" disabled={!canEdit} value={d.caption_format||d.captions||"SRT"} onChange={e=>upd(d.id,{caption_format:e.target.value})}>
                  {CAPTION_OPTS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="fg"><label className="fl">Language</label>
                <select className="fsel" disabled={!canEdit} value={d.language||"BILINGUAL"} onChange={e=>upd(d.id,{language:e.target.value})}>
                  {LANG_OPTS.map(l=><option key={l}>{l}</option>)}
                </select>
              </div>
              <div className="fg" style={{ display:"flex", gap:20, alignItems:"center", paddingTop:22 }}>
                <label style={{ display:"flex", gap:7, alignItems:"center", cursor:"pointer", fontSize:13, color:"var(--text2)" }}>
                  <input type="checkbox" disabled={!canEdit} checked={!!d.thumbnail} onChange={e=>upd(d.id,{thumbnail:e.target.checked})}/> Thumbnail
                </label>
                <label style={{ display:"flex", gap:7, alignItems:"center", cursor:"pointer", fontSize:13, color:"var(--text2)" }}>
                  <input type="checkbox" disabled={!canEdit} checked={!!d.cover_frame||!!d.cover} onChange={e=>upd(d.id,{cover_frame:e.target.checked,cover:e.target.checked})}/> Cover Frame
                </label>
              </div>
            </div>

            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--text4)", marginBottom:7 }}>Destination Platforms</div>
              <div className="chips">{PLATFORMS.map(p=>(
                <div key={p} className={`chip${(d.platforms||[]).includes(p)?" sel":""}`} onClick={()=>canEdit&&tog(d.id,"platforms",p)}>{PLAT_LBL[p]}</div>
              ))}</div>
            </div>

            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--text4)", marginBottom:7 }}>Reframe Guidance</div>
              <div className="chips">{REFRAME_OPTS.map(r=>(
                <div key={r} className={`chip${(d.reframe||[]).includes(r)?" sel":""}`} onClick={()=>canEdit&&tog(d.id,"reframe",r)}>{REFRAME_LBL[r]}</div>
              ))}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MEDIA TAB ───────────────────────────────────────────────────────────────
function MediaTab({ story, onUpdate }) {
  const { session } = useSession();
  const [preview, setPreview] = useState(null);
  const [addLink, setAddLink] = useState(false);
  const [lf, setLf] = useState({ name:"", url:"", type:"Rushes", notes:"" });
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();
  const canEdit = canDo(session?.user?.role, "EDIT_MEDIA");

  const links   = story.media_links || story.mediaLinks || [];
  const uploads = story.media || story.uploads || [];
  const LINK_TYPES = ["Rushes","Footage","Transcript","Audio","Reference","Script","Other"];

  const saveLink = async () => {
    if (!lf.url.trim()) return;
    try {
      // Media links are stored in the story's media_links JSON field
      const updated = [...links, { id:genId(), ...lf, added_at: nowStr() }];
      await onUpdate(story.id, { media_links: updated });
      setLf({ name:"", url:"", type:"Rushes", notes:"" });
      setAddLink(false);
    } catch (e) { setError(e.data?.error||"Save failed."); }
  };

  const delLink = async (id) => {
    const updated = links.filter(l => l.id!==id);
    await onUpdate(story.id, { media_links: updated });
  };

  const handleFiles = useCallback(async (files) => {
    setUploading(true); setError("");
    for (const file of Array.from(files)) {
      try {
        await api.stories.uploadMedia(story.id, file, { story_id: story.id });
      } catch (e) {
        setError(`Upload failed: ${e.message}`);
      }
    }
    // Reload story to get updated media list
    const fresh = await api.stories.get(story.id);
    onUpdate(story.id, { media: fresh.media }).catch(()=>{});
    setUploading(false);
  }, [story.id, onUpdate]);

  const delUpload = async (id) => {
    try {
      await api.stories.deleteMedia(story.id, id);
      const updated = uploads.filter(u => u.id!==id);
      onUpdate(story.id, { media: updated }).catch(()=>{});
    } catch (e) { setError(e.data?.error||"Delete failed."); }
  };

  const onDrop = e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); };
  const linkIcon = t => ({Rushes:"🎬",Footage:"📹",Transcript:"📝",Audio:"🎵",Reference:"🔗",Script:"📋",Other:"📎"}[t]||"🔗");

  return (
    <div>
      {error && <div style={{ background:"var(--red-dim)", color:"#f87171", borderRadius:8, padding:"10px 14px", fontSize:13, marginBottom:14 }}>{error}</div>}

      {/* Links */}
      <div className="card">
        <div className="card-hd">
          <div className="card-hd-l"><span className="card-title">Media Links</span><span className="card-sub">{links.length} linked</span></div>
          {canEdit && <Btn sm onClick={()=>setAddLink(v=>!v)}>＋ Add Link</Btn>}
        </div>
        <div className="card-bd">
          {addLink && (
            <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:"var(--radius-sm)", padding:16, marginBottom:16 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                <div className="fg"><label className="fl">Link Name</label><input className="fi" value={lf.name} onChange={e=>setLf(f=>({...f,name:e.target.value}))} placeholder="e.g. Interview Rushes — Subject 1"/></div>
                <div className="fg"><label className="fl">Type</label><select className="fsel" value={lf.type} onChange={e=>setLf(f=>({...f,type:e.target.value}))}>{LINK_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
              </div>
              <div className="fg"><label className="fl">URL / File Path</label><input className="fi" value={lf.url} onChange={e=>setLf(f=>({...f,url:e.target.value}))} placeholder="https:// or //server/share/path"/></div>
              <div className="fg"><label className="fl">Notes</label><input className="fi" value={lf.notes} onChange={e=>setLf(f=>({...f,notes:e.target.value}))} placeholder="e.g. 4K ProRes, auto-generated…"/></div>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <Btn sm cls="btn-ghost" onClick={()=>setAddLink(false)}>Cancel</Btn>
                <Btn sm cls="btn-primary" onClick={saveLink}>Save Link</Btn>
              </div>
            </div>
          )}
          {!links.length && !addLink
            ? <Empty icon="🔗" title="No media links yet" sub="Add links to rushes, footage, transcripts or shared drives."/>
            : links.map(l => (
              <div key={l.id} className="link-row">
                <span className="link-icon">{linkIcon(l.type)}</span>
                <div className="link-info">
                  <div className="link-name">{l.name||l.url}</div>
                  <div className="link-url">{l.url}</div>
                  {l.notes&&<div style={{ fontSize:11, color:"var(--text4)", marginTop:2 }}>{l.notes}</div>}
                </div>
                <span className="link-tag">{l.type}</span>
                <Btn xs cls="btn-ghost" onClick={()=>window.open(l.url,"_blank")}>Open ↗</Btn>
                {canEdit && <Btn xs cls="btn-danger" onClick={()=>delLink(l.id)}>✕</Btn>}
              </div>
            ))}
        </div>
      </div>

      {/* Uploads */}
      <div className="card">
        <div className="card-hd">
          <div className="card-hd-l">
            <span className="card-title">Uploaded Files</span>
            <span className="card-sub">{uploads.length} files</span>
          </div>
          {canEdit && <Btn sm onClick={()=>fileRef.current?.click()}>{uploading?"Uploading…":"⬆ Upload"}</Btn>}
        </div>
        <div className="card-bd">
          <input ref={fileRef} type="file" multiple style={{ display:"none" }} onChange={e=>handleFiles(e.target.files)}/>
          <div className={`drop-zone${dragOver?" over":""}`}
            onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={onDrop}
            onClick={()=>canEdit&&!uploading&&fileRef.current?.click()} style={{ marginBottom:uploads.length?16:0 }}>
            <div className="drop-zone-icon">{uploading?"⏳":"📂"}</div>
            <p style={{ fontSize:13 }}>{uploading?"Uploading…":"Drag & drop files, or click to browse"}</p>
            <small style={{ fontSize:11, color:"var(--text4)", marginTop:4, display:"block" }}>PDFs, transcripts, images, audio, video — stored in Cloudflare R2</small>
          </div>
          {uploads.length > 0 && (
            <div className="media-grid">{uploads.map(u=>(
              <div key={u.id} className="asset-card">
                <div className="asset-thumb" onClick={()=>setPreview(u)}>
                  {u.url && isImg(u.file_name||u.name) && <img src={u.url} alt={u.file_name||u.name}/>}
                  {u.url && isVid(u.file_name||u.name) && <video src={u.url}/>}
                  {(!u.url || (!isImg(u.file_name||u.name)&&!isVid(u.file_name||u.name))) && <span>{fIcon(u.file_name||u.name||"")}</span>}
                  <div className="asset-overlay"><span style={{ color:"#fff", fontSize:22 }}>▶</span></div>
                </div>
                <div className="asset-info">
                  <div className="asset-name">{u.file_name||u.name}</div>
                  <div className="asset-meta">{u.file_size ? fmt(u.file_size) : ""} · {u.created_at?.slice?.(0,10)||""}</div>
                </div>
                <div className="asset-actions">
                  <Btn xs cls="btn-ghost" onClick={()=>setPreview(u)}>Preview</Btn>
                  {canEdit && <Btn xs cls="btn-danger" onClick={()=>delUpload(u.id)}>Remove</Btn>}
                </div>
              </div>
            ))}</div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {preview && (
        <div className="modal-overlay" onClick={()=>setPreview(null)}>
          <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", width:760, maxWidth:"96vw", maxHeight:"90vh", display:"flex", flexDirection:"column" }} onClick={e=>e.stopPropagation()}>
            <div style={{ padding:"14px 22px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:700 }}>{fIcon(preview.file_name||preview.name||"")} {preview.file_name||preview.name}</span>
              <div style={{ display:"flex", gap:8 }}>
                {preview.url && <a href={preview.url} download={preview.file_name||preview.name} className="btn btn-secondary btn-sm" target="_blank" rel="noreferrer">⬇ Download</a>}
                <button className="btn btn-ghost btn-sm" onClick={()=>setPreview(null)}>✕</button>
              </div>
            </div>
            <div style={{ flex:1, overflow:"auto", background:"#000", borderRadius:"0 0 var(--radius-lg) var(--radius-lg)", display:"flex", alignItems:"center", justifyContent:"center", minHeight:300 }}>
              {preview.url && isImg(preview.file_name||preview.name||"") && <img src={preview.url} alt="" style={{ maxWidth:"100%", maxHeight:500, objectFit:"contain" }}/>}
              {preview.url && isVid(preview.file_name||preview.name||"") && <video src={preview.url} controls autoPlay style={{ width:"100%", maxHeight:500 }}/>}
              {preview.url && isAud(preview.file_name||preview.name||"") && <div style={{ padding:32, width:"100%" }}><audio src={preview.url} controls style={{ width:"100%" }}/></div>}
              {!preview.url && <div style={{ padding:40, textAlign:"center", color:"var(--text3)" }}><div style={{ fontSize:48, marginBottom:12 }}>{fIcon(preview.file_name||"")}</div><p>No preview available.</p></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AUDIT LOG TAB ────────────────────────────────────────────────────────────
function AuditTab({ story }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load from API first, fall back to story.audit
    api.get ? Promise.resolve() : null;
    const local = [...(story.audit||[])].reverse();
    setEntries(local);
    setLoading(false);
    // Optionally poll for fresh audit data — for now local is fine
  }, [story.id]);

  const actionIcon = a => ({STATUS_CHANGE:"🔄",EDIT:"✏️",VIEW:"👁",EXPORT:"⬇",VISIBILITY:"🔒"}[a]||"•");

  if (loading) return <div style={{ padding:20, color:"var(--text3)", fontSize:13 }}>Loading…</div>;

  return (
    <div>
      <div className="card">
        <div className="card-hd">
          <span className="card-title">Change History</span>
          <span className="card-sub">{entries.length} entries</span>
        </div>
        <div className="card-bd">
          {!entries.length
            ? <Empty icon="🕒" title="No changes recorded yet"/>
            : entries.map(e => (
              <div key={e.id} className="audit-row">
                <div className="audit-time">{e.at||e.created_at?.slice?.(0,16)||""}</div>
                <div className="audit-who">{e.by||e.user?.name||"—"}</div>
                <div className="audit-field">{actionIcon(e.action)} {e.field||e.action}</div>
                <div className="audit-change">
                  {e.old&&<span className="audit-old">{e.old}</span>}
                  <span className="audit-new">{e.new||e.description||""}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROOT APP (psc_app.jsx)
// ═══════════════════════════════════════════════════════════════════

// ─── psc_app.jsx ──────────────────────────────────────────────────────────────
// AppInner — root app shell after auth. Replaces localStorage with real API.
// Handles: story list, story CRUD, navigation, org members cache.


// ─── HASH ROUTER ─────────────────────────────────────────────────
// Lightweight hash-based routing: #/dashboard, #/story/abc, #/account, etc.
// No library needed — just syncs view/selectedId with window.location.hash.

function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, "") || "dashboard";
  const parts = raw.split("/");
  if (parts[0] === "story" && parts[1]) return { view: "story", id: parts[1] };
  const validViews = ["dashboard","account","org","teams","archived"];
  if (validViews.includes(parts[0])) return { view: parts[0], id: null };
  return { view: "dashboard", id: null };
}

function setHash(view, id) {
  const path = view === "story" && id ? `story/${id}` : view;
  const newHash = `#/${path}`;
  if (window.location.hash !== newHash) {
    window.history.pushState(null, "", newHash);
  }
}

function replaceHash(view, id) {
  const path = view === "story" && id ? `story/${id}` : view;
  window.history.replaceState(null, "", `#/${path}`);
}

function useHashRouter() {
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onHash);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onHash);
    };
  }, []);

  const navigate = useCallback((view, id = null) => {
    setHash(view, id);
    setRoute({ view, id });
  }, []);

  return { view: route.view, selectedId: route.id, navigate };
}

function Spinner() {
  return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:40,
    color:"var(--text3)", fontSize:13, gap:10 }}><span className="spinner"/>Loading…</div>;
}
function Toast({ msg, type="success", onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
  const bg = type === "error" ? "var(--red-dim)" : type === "warn" ? "var(--amber-dim)" : "var(--green-dim)";
  const c  = type === "error" ? "#f87171" : type === "warn" ? "#fbbf24" : "#4ade80";
  const icon = type === "error" ? "✗" : type === "warn" ? "⚠" : "✓";
  return (
    <div className="toast-enter" style={{ position:"fixed", bottom:24, right:24, background:bg, border:`1px solid ${c}33`,
      borderRadius:12, padding:"12px 18px", color:c, fontSize:13, zIndex:9999, maxWidth:360,
      boxShadow:"0 8px 32px rgba(0,0,0,.4)", display:"flex", alignItems:"center", gap:10,
      backdropFilter:"blur(8px)" }}>
      <span style={{ fontSize:16, flexShrink:0 }}>{icon}</span>
      <span style={{ lineHeight:1.4 }}>{msg}</span>
    </div>
  );
}

// ─── Story shape normaliser ───────────────────────────────────────────────────
// The backend returns flat fields: brief.hook_cy / brief.hook_en
// The UI components expect bilingual objects: brief.story_hook.source_text etc.
// This reconstructs the UI shape from the DB shape on every fetch.
function makeBF(cy, en, cyStatus = "PENDING") {
  const srcLang = cy ? "CY" : "EN";
  return {
    original_language: srcLang,
    source_text:       srcLang === "CY" ? (cy || "") : (en || ""),
    translated_text:   srcLang === "CY" ? (en || "") : (cy || ""),
    translation_status: cyStatus || (en ? "AUTO_TRANSLATED" : "PENDING"),
    translation_method: "MACHINE",
  };
}

function normalizeStory(s) {
  if (!s) return s;
  const b = s.brief || {};
  const h = s.handover || {};
  const n = s.shoot_notes || {};

  return {
    ...s,
    // Normalise brief
    brief: {
      ...b,
      story_hook: makeBF(b.hook_cy, b.hook_en, b.hook_status),
      why_now:    makeBF(b.why_now_cy, b.why_now_en, b.why_now_status),
      tone:       b.tone || "",
      sync_lines: b.sync_lines || [],
      characters: s.characters || [],
      visuals:    s.visuals || [],
    },
    // Normalise handover
    handover: {
      ...h,
      story_intention: makeBF(h.intention_cy, h.intention_en),
      clips:           Array.isArray(h.must_clips)        ? h.must_clips        : [],
      highlights:      Array.isArray(h.visual_highlights) ? h.visual_highlights : [],
      music_suggestions: typeof h.music_ref === "object" ? (h.music_ref?.text || "") : (h.music_ref || ""),
    },
    // Normalise shoot notes
    shoot_notes: {
      ...n,
      worked_well: n.what_worked || n.worked_well || makeBF("", ""),
      unexpected:  n.unexpected  || makeBF("", ""),
      missing:     n.missing     || makeBF("", ""),
    },
  };
}

// ─── WORKFLOW BAR ─────────────────────────────────────────────────────────────
function WorkflowBar({ status, onChange, canChange }) {
  const cur = STATUSES.indexOf(status);
  return (
    <div className="wf">
      {STATUSES.filter(s => s !== "ARCHIVED").map((s, i) => (
        <div key={s} className={`wf-step${s===status?" wf-active":i<cur?" wf-done":""}`}
          onClick={() => canChange && onChange(s)}
          style={{ cursor: canChange ? "pointer" : "default" }}>
          <span className="wf-dot"/>{STATUS_META[s].label}
        </div>
      ))}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ stories, orgMembers, loading, onOpen, onNew }) {
  const { session, can } = useSession();
  const { viewLang } = useLang();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const counts = {};
  STATUSES.forEach(s => counts[s] = stories.filter(x => x.status === s).length);

  const visible = stories.filter(s => {
    if (s.visibility === "PRIVATE") {
      const uid = session.user.id;
      const isAssigned = s.assignments?.some(a => a.user_id === uid);
      if (s.created_by !== uid && !isAssigned && !canDo(session.user.role,"MANAGE_TEAMS")) return false;
    }
    if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
    if (q) {
      const t = q.toLowerCase();
      const title = (s.title_cy || s.title_en || s.programme || "").toLowerCase();
      if (!title.includes(t)) return false;
    }
    return true;
  });

  const getTitle = (s) => viewLang === "CY" ? (s.title_cy || s.title_en) : (s.title_en || s.title_cy);

  return (
    <div className="content">
      <div className="sh">
        <div className="sh-left">
          <h1>Production Module</h1>
          <p>{visible.length} stories · PSC Workflow</p>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <LangToggle/>
          {can("CREATE_STORY") && <Btn cls="btn-primary" onClick={onNew}>＋ New Story</Btn>}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12, marginBottom:16 }}>
        {STATUSES.filter(s => s !== "ARCHIVED").map(s => (
          <div key={s} className="stat-card" role="button" tabIndex={0}
            onClick={() => setStatusFilter(s === statusFilter ? "ALL" : s)}
            onKeyDown={e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setStatusFilter(s === statusFilter ? "ALL" : s))}
            style={{ borderColor: statusFilter===s ? "var(--accent)" : undefined,
              background: statusFilter===s ? "var(--accent-dim)" : undefined }}>
            <div className="stat-label">{STATUS_META[s].label}</div>
            <div className="stat-value" style={{ color: STATUS_META[s].cls ? `var(--${s==="DELIVERED"?"green":s==="IN_EDIT"?"purple":s==="FILMING"?"red":s==="READY_TO_SHOOT"?"amber":"accent"})` : "var(--text)" }}>
              {counts[s]||0}
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom:16 }}>
        <input className="fi" value={q} onChange={e=>setQ(e.target.value)}
          placeholder="Search stories…" style={{ maxWidth:320 }}/>
      </div>

      {loading && <Spinner />}
      {!loading && visible.length === 0 && (
        <Empty icon="📋"
          title={q ? "No results" : statusFilter !== "ALL" ? "No stories in this status" : "No stories yet"}
          sub={q ? "Try a different search term." : statusFilter !== "ALL" ? "Clear the filter to see all stories." : "Create your first story to get started."}/>
      )}

      {/* Story grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
        {visible.map(s => {
          const step = STATUS_META[s.status]?.step ?? 0;
          const assignedUsers = (s.assignments||[]).slice(0,3).map(a => orgMembers.find(u=>u.id===a.user_id)).filter(Boolean);
          const visInfo = VISIBILITY[s.visibility];
          const title = getTitle(s);
          return (
            <div key={s.id} className="story-card" role="button" tabIndex={0}
              onClick={() => onOpen(s.id)}
              onKeyDown={e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen(s.id))}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:4,
                display:"flex", gap:8, alignItems:"flex-start", justifyContent:"space-between", letterSpacing:"-0.01em" }}>
                <span style={{ flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{title}</span>
                <span title={visInfo?.desc} style={{ fontSize:14, flexShrink:0 }}>{visInfo?.icon}</span>
              </div>
              {s.programme&&<div style={{ fontSize:12, color:"var(--text3)", marginBottom:8 }}>📺 {s.programme}</div>}
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center", marginBottom:8 }}>
                <Badge status={s.status}/>
                {s.shoot_date&&<span style={{ fontSize:11, color:"var(--text3)" }}>📅 {s.shoot_date?.slice?.(0,10) || s.shoot_date}</span>}
              </div>
              <div className="hook-text">
                {s.brief?.hook_cy || s.brief?.hook_en || "No story hook yet."}
              </div>
              <div style={{ display:"flex", gap:10, fontSize:11, color:"var(--text4)", marginTop:8, marginBottom:6 }}>
                <span>📦 {(s._count?.deliverables||s.deliverables?.length||0)} deliverables</span>
                <span>🗂 {(s._count?.media||s.media?.length||0)} assets</span>
              </div>
              {assignedUsers.length > 0 && (
                <div style={{ display:"flex", marginTop:6 }}>
                  {assignedUsers.map(u => <UserAvatar key={u.id} user={u} size={20} style={{ marginRight:4 }}/>)}
                </div>
              )}
              <div className="prog-steps">{[0,1,2,3,4].map(i=>(
                <div key={i} className={`prog-step${i<step?" done":i===step?" cur":""}`}/>
              ))}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── NEW STORY MODAL ──────────────────────────────────────────────────────────
function NewStoryModal({ onClose, onCreate, orgMembers }) {
  const { session } = useSession();
  const [f, setF] = useState({
    title_cy:"", title_en:"", programme:"", shoot_date:"",
    location:"", visibility:"TEAM_ONLY"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setF(x => ({ ...x, [k]:v }));

  const submit = async () => {
    if (!f.title_cy.trim()) { setError("A Welsh title is required."); return; }
    setLoading(true);
    try {
      await onCreate(f);
    } catch (e) {
      setError(e.data?.error || "Failed to create story.");
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hd">
          <span className="modal-title">New Story</span>
          <Btn sm cls="btn-ghost" onClick={onClose}>✕</Btn>
        </div>
        <div className="modal-bd">
          {error && <div style={{ background:"var(--red-dim)", color:"#f87171", padding:"10px 14px",
            borderRadius:8, fontSize:13, marginBottom:14 }}>{error}</div>}
          <div className="fg"><label className="fl">Welsh Title (Cymraeg) *</label>
            <input className="fi" value={f.title_cy} onChange={e=>set("title_cy",e.target.value)}
              placeholder="e.g. Stori'r Fferm Danfon" autoFocus/>
          </div>
          <div className="fg"><label className="fl">English Title (optional)</label>
            <input className="fi" value={f.title_en} onChange={e=>set("title_en",e.target.value)}
              placeholder="e.g. Flooded Farm Story"/>
          </div>
          <div className="fg"><label className="fl">Programme</label>
            <input className="fi" value={f.programme} onChange={e=>set("programme",e.target.value)}
              placeholder="e.g. Wythnos yn Wythnos"/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div className="fg"><label className="fl">Shoot Date</label>
              <input type="date" className="fi" value={f.shoot_date} onChange={e=>set("shoot_date",e.target.value)}/>
            </div>
            <div className="fg"><label className="fl">Location</label>
              <input className="fi" value={f.location} onChange={e=>set("location",e.target.value)}
                placeholder="e.g. Caerdydd / Cardiff"/>
            </div>
          </div>
          <div className="fg"><label className="fl">Visibility</label>
            <select className="fsel" value={f.visibility} onChange={e=>set("visibility",e.target.value)}>
              {Object.entries(VISIBILITY).map(([k,v])=>(
                <option key={k} value={k}>{v.icon} {v.label} — {v.desc}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-ft">
          <Btn cls="btn-ghost" onClick={onClose}>Cancel</Btn>
          <Btn cls="btn-primary" disabled={!f.title_cy.trim() || loading}
            onClick={submit}>{loading ? "Creating…" : "Create Story"}</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── EXPORT MODAL ─────────────────────────────────────────────────────────────
function ExportModal({ story, onClose }) {
  const { viewLang } = useLang();
  const [exportLang, setExportLang] = useState("BOTH");
  const [exporting, setExporting] = useState(false);
  const b = story.brief || {}, h = story.handover || {};
  const now = new Date().toISOString().slice(0,10);

  const getT = (field) => {
    if (!field || typeof field==="string") return field || "—";
    if (exportLang==="CY") return field.original_language==="CY" ? field.source_text : (field.translated_text||field.source_text);
    if (exportLang==="EN") return field.original_language==="EN" ? field.source_text : (field.translated_text||field.source_text);
    return null;
  };
  const BilExport = ({ field }) => {
    if (!field || typeof field==="string") return <div className="ep-value">{field||"—"}</div>;
    if (exportLang !== "BOTH") return <div className="ep-value">{getT(field)||"—"}</div>;
    return (
      <div className="ep-bilingual">
        <div className="ep-cy"><div style={{fontSize:10,fontWeight:700,color:"#888",marginBottom:4}}>🏴󠁧󠁢󠁷󠁬󠁳󠁿 CYMRAEG</div><div style={{fontSize:13,color:"#222",lineHeight:1.6}}>{field.original_language==="CY"?field.source_text:field.translated_text||"—"}</div></div>
        <div className="ep-en"><div style={{fontSize:10,fontWeight:700,color:"#888",marginBottom:4}}>🇬🇧 ENGLISH</div><div style={{fontSize:13,color:"#222",lineHeight:1.6}}>{field.original_language==="EN"?field.source_text:field.translated_text||"—"}</div></div>
      </div>
    );
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await api.stories.exportPDF(story.id, "brief", exportLang === "BOTH" ? "BILINGUAL" : exportLang);
      const title = (story.title_cy || story.title_en || "story").replace(/[^a-z0-9]/gi,"_");
      api.downloadBlob(blob, `PSC_Brief_${title}_${now}_${exportLang}.pdf`);
      onClose();
    } catch (e) {
      console.error("Export failed:", e);
      alert("Export failed — check your backend connection.");
    } finally {
      setExporting(false);
    }
  };

  const title = exportLang === "CY" ? story.title_cy : exportLang === "EN" ? (story.title_en || story.title_cy) : `${story.title_cy}${story.title_en ? " / " + story.title_en : ""}`;

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{ width:720, maxWidth:"96vw" }}>
        <div className="modal-hd">
          <span className="modal-title">Editor Pack Export</span>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:11, color:"var(--text3)" }}>Export language:</span>
            <div className="lang-toggle">
              {[["CY","🏴󠁧󠁢󠁷󠁬󠁳󠁿 Welsh"],["EN","🇬🇧 English"],["BOTH","Bilingual"]].map(([k,l])=>(
                <button key={k} className={`lang-btn${exportLang===k?" active":""}`} onClick={()=>setExportLang(k)}>{l}</button>
              ))}
            </div>
            <Btn sm cls="btn-ghost" onClick={onClose}>✕</Btn>
          </div>
        </div>
        <div className="modal-bd">
          <div className="ep">
            <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:14 }}>
              <div style={{ background:"#4f72ff", color:"#fff", padding:"2px 10px", borderRadius:4, fontFamily:"'Syne',sans-serif", fontSize:9, fontWeight:700, letterSpacing:2 }}>PSC HANDOVER</div>
              <div style={{ fontSize:11, color:"#888" }}>{now} · {exportLang==="CY"?"Cymraeg":exportLang==="EN"?"English":"Bilingual"}</div>
            </div>
            <h1>{title}</h1>
            <div className="ep-meta">{[story.programme, story.shoot_date?.slice?.(0,10)].filter(Boolean).join(" · ")}</div>
            <div className="ep-hr"/>
            <div className="ep-label">Story Hook</div>
            <BilExport field={{ original_language:"CY", source_text: b.hook_cy||"", translated_text: b.hook_en||"" }}/>
            <div className="ep-label">Why Now</div>
            <BilExport field={{ original_language:"CY", source_text: b.why_now_cy||"", translated_text: b.why_now_en||"" }}/>
            {b.tone&&<><div className="ep-label">Tone</div><div className="ep-value">{b.tone}</div></>}
            <div className="ep-hr"/>
            <div className="ep-label">Story Intention</div>
            <BilExport field={{ original_language:"CY", source_text: h.intention_cy||"", translated_text: h.intention_en||"" }}/>
            {h.music_ref?.cy||h.music_ref?.en
              ? <><div className="ep-label">Music</div><div className="ep-value">{h.music_ref?.cy||h.music_ref?.en||""}</div></>
              : null}
            {story.deliverables?.length>0&&<>
              <div className="ep-hr"/>
              <div className="ep-label" style={{ marginBottom:8 }}>Deliverables</div>
              {story.deliverables.map(d=>(
                <div key={d.id} className="ep-del">
                  <div className="ep-del-ratio">{d.aspect_ratio||d.platform||"—"}</div>
                  <div><div style={{ fontSize:12, color:"#555" }}>{d.platform} · {d.status}</div></div>
                </div>
              ))}
            </>}
          </div>
        </div>
        <div className="modal-ft">
          <Btn cls="btn-ghost" onClick={onClose}>Close</Btn>
          <Btn cls="btn-primary" onClick={handleExport} disabled={exporting}>
            {exporting ? "Generating PDF…" : "⬇ Export PDF"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── STORY VIEW ───────────────────────────────────────────────────────────────
const TABS = [
  { id:"brief",    label:"📋 PSC Brief" },
  { id:"shoot",    label:"🎬 Shoot Notes" },
  { id:"handover", label:"✂️ Handover" },
  { id:"deliver",  label:"📦 Deliverables" },
  { id:"media",    label:"🗂️ Media & Assets" },
  { id:"comments", label:"💬 Comments" },
  { id:"audit",    label:"🕒 Audit Log" },
];

function StoryView({ story, orgMembers, onUpdate, onStatusChange, onBack, onDuplicate, onArchive, onRestore }) {
  const { session, can } = useSession();
  const { viewLang } = useLang();
  const [tab, setTab] = useState("brief");
  const [showExport, setShowExport] = useState(false);
  const [showVis, setShowVis] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef(null);

  // Close action menu on outside click or Escape
  useEffect(() => {
    if (!showActions) return;
    const onKey = (e) => { if (e.key === "Escape") setShowActions(false); };
    const onClick = (e) => { if (actionsRef.current && !actionsRef.current.contains(e.target)) setShowActions(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [showActions]);

  const visInfo = VISIBILITY[story.visibility];
  const canChangeStatus = can("EDIT_BRIEF");

  const getTitle = () => viewLang === "CY" ? (story.title_cy||story.title_en) : (story.title_en||story.title_cy);

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    try {
      await onStatusChange(story.id, newStatus);
    } finally {
      setSaving(false);
    }
  };

  const handleVisibilityChange = async (vis) => {
    setShowVis(false);
    await onUpdate(story.id, { visibility: vis });
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%" }}>
      <div className="topbar">
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <Btn sm cls="btn-ghost" onClick={onBack}>← Back</Btn>
          <div className="bc">
            <span>Stories</span><span className="bc-sep">›</span>
            <span className="bc-cur">{getTitle()}</span>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <LangToggle compact/>
          <span title={visInfo?.desc} style={{ fontSize:16, cursor:"pointer" }} onClick={()=>setShowVis(true)}>{visInfo?.icon}</span>
          <Badge status={story.status}/>
          {saving && <span style={{ fontSize:11, color:"var(--text3)" }}><span className="spinner" style={{ width:14, height:14, marginRight:6 }}/>Saving</span>}
          {can("EXPORT_PACK") && <Btn sm cls="btn-secondary" onClick={()=>setShowExport(true)}>⬇ Editor Pack</Btn>}
          <div ref={actionsRef} style={{ position:"relative" }}>
            <Btn sm cls="btn-ghost" onClick={() => setShowActions(v => !v)}>⋯</Btn>
            {showActions && (
              <div className="action-dropdown">
                <div className="sb-item" onClick={() => { setShowActions(false); onDuplicate?.(story.id); }} style={{ margin:0 }}>
                  <span className="sb-icon">📋</span>Duplicate Story
                </div>
                {story.status !== "ARCHIVED" ? (
                  <div className="sb-item" onClick={() => { setShowActions(false); onArchive?.(story.id); }} style={{ margin:0, color:"var(--red)" }}>
                    <span className="sb-icon">🗄</span>Archive Story
                  </div>
                ) : (
                  <div className="sb-item" onClick={() => { setShowActions(false); onRestore?.(story.id); }} style={{ margin:0, color:"var(--green)" }}>
                    <span className="sb-icon">↩</span>Restore Story
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="content">
        <div style={{ marginBottom:16 }}>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:24, fontWeight:800, marginBottom:6 }}>{getTitle()}</h1>
          <div style={{ display:"flex", gap:14, flexWrap:"wrap", fontSize:13, color:"var(--text3)" }}>
            {story.programme&&<span>📺 {story.programme}</span>}
            {story.shoot_date&&<span>📅 {story.shoot_date?.slice?.(0,10)||story.shoot_date}</span>}
            {story.locations?.length>0&&<span>📍 {story.locations.join(", ")}</span>}
          </div>
        </div>

        <WorkflowBar status={story.status} onChange={handleStatusChange} canChange={canChangeStatus}/>

        <div className="tabs">
          {TABS.map(t => <div key={t.id} className={`tab${tab===t.id?" active":""}`} onClick={()=>setTab(t.id)}>{t.label}</div>)}
        </div>

        {tab==="brief"    && <PSCBriefTab    story={story} onUpdate={onUpdate}/>}
        {tab==="shoot"    && <ShootNotesTab  story={story} onUpdate={onUpdate}/>}
        {tab==="handover" && <HandoverTab    story={story} onUpdate={onUpdate}/>}
        {tab==="deliver"  && <DeliverablesTab story={story} onUpdate={onUpdate}/>}
        {tab==="media"    && <MediaTab story={story} onUpdate={onUpdate}/>}
        {tab==="comments" && <CommentsTab story={story}/>}
        {tab==="audit"    && <AuditTab story={story}/>}
      </div>

      {showExport && <ExportModal story={story} onClose={()=>setShowExport(false)}/>}

      {showVis && (
        <div className="modal-overlay" onClick={()=>setShowVis(false)}>
          <div className="modal" style={{ width:400 }} onClick={e=>e.stopPropagation()}>
            <div className="modal-hd"><span className="modal-title">Story Visibility</span><Btn sm cls="btn-ghost" onClick={()=>setShowVis(false)}>✕</Btn></div>
            <div className="modal-bd">
              {Object.entries(VISIBILITY).map(([k,v])=>(
                <div key={k}
                  style={{ padding:14, borderRadius:"var(--radius-sm)", marginBottom:8, cursor:can("CHANGE_VISIBILITY")?"pointer":"default",
                    border:`1px solid ${story.visibility===k?"var(--accent)":"var(--border)"}`,
                    background:story.visibility===k?"var(--accent-dim)":"var(--surface2)", transition:"all .15s" }}
                  onClick={()=>can("CHANGE_VISIBILITY") && handleVisibilityChange(k)}>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <span style={{ fontSize:20 }}>{v.icon}</span>
                    <div><div style={{ fontWeight:600, fontSize:13 }}>{v.label}</div><div style={{ fontSize:12, color:"var(--text3)" }}>{v.desc}</div></div>
                    {story.visibility===k&&<span style={{ marginLeft:"auto", color:"var(--accent)" }}>✓</span>}
                  </div>
                </div>
              ))}
              {!can("CHANGE_VISIBILITY") && <p style={{ fontSize:12, color:"var(--text3)", marginTop:8 }}>You don't have permission to change story visibility.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ stories, view, selectedId, onNav, onOpen, onNew }) {
  const { session, logout } = useSession();
  const { viewLang } = useLang();
  const user = session?.user;
  const org  = session?.org;

  const navItem = (key, icon, label) => (
    <div className={`sb-item${view===key?" active":""}`} onClick={()=>onNav(key)}>
      <span className="sb-icon">{icon}</span>{label}
    </div>
  );

  const getTitle = (s) => viewLang === "CY" ? (s.title_cy||s.title_en) : (s.title_en||s.title_cy);

  return (
    <div className="sidebar">
      <div className="sb-logo">
        <div className="sb-org-avatar">
          {org?.logo_url ? <img src={org.logo_url} alt=""/> : (org?.name||"PSC").split(" ").map(w=>w[0]).join("").slice(0,2)}
        </div>
        <div>
          <div className="sb-org-name">{org?.workspace_display_name || org?.name || "PSC Module"}</div>
          <div className="sb-org-tag">S4C · Production</div>
        </div>
      </div>

      <div className="sb-nav">
        {navItem("dashboard","⬡","Dashboard")}
        {navItem("archived","🗄","Archived")}
        <div className="sb-divider"/>
        <div className="sb-section">Manage</div>
        {navItem("account","👤","My Account")}
        {canDo(user?.role,"MANAGE_TEAMS") && navItem("teams","👥","Teams")}
        {canDo(user?.role,"MANAGE_ORG")   && navItem("org","🏢","Organisation")}
        <div className="sb-divider"/>
        <div className="sb-section">Stories</div>
        <div className="sb-item" onClick={onNew}><span className="sb-icon">＋</span>New Story</div>
        {stories.slice(0,15).map(s => (
          <div key={s.id} className={`sb-story${selectedId===s.id?" active":""}`} onClick={()=>onOpen(s.id)}>
            <div className="sb-story-title">{getTitle(s)}</div>
            <div style={{ marginTop:3, display:"flex", gap:6, alignItems:"center" }}>
              <span className={`badge ${STATUS_META[s.status]?.cls||"b-dev"}`}>
                <span className="badge-dot"/>{STATUS_META[s.status]?.label}
              </span>
              <span style={{ fontSize:11 }}>{VISIBILITY[s.visibility]?.icon}</span>
            </div>
          </div>
        ))}
        {stories.length > 15 && (
          <div className="sb-more" onClick={() => onNav("dashboard")}>
            View all {stories.length} stories
          </div>
        )}
      </div>

      {user && (
        <div className="sb-user">
          <UserAvatar user={user} size={28}/>
          <div className="sb-user-info">
            <div className="sb-user-name">{user.name}</div>
            <div className="sb-user-role">{user.preferred_lang==="CY"?"🏴󠁧󠁢󠁷󠁬󠁳󠁿 ":""}{ALL_ROLES[user.role]?.label||user.role}</div>
          </div>
          <NotificationBell/>
          <button className="btn btn-ghost btn-xs" onClick={logout} title="Sign out">↩</button>
        </div>
      )}
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const EXTRA_CSS = `
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes fadeInDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
@keyframes slideInRight{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}
@keyframes slideInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes pulseGlow{0%,100%{opacity:.6}50%{opacity:1}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

/* ── MOTION TOKENS ──────────────────────────── */
.pma{--dur-fast:120ms;--dur-base:200ms;--dur-slow:300ms;--dur-enter:250ms;--ease-out:cubic-bezier(0.16,1,0.3,1);--ease-in-out:cubic-bezier(0.4,0,0.2,1);--ease-spring:cubic-bezier(0.34,1.56,0.64,1)}

/* ── SKELETON LOADING ───────────────────────── */
.skel{background:linear-gradient(90deg,var(--surface2) 25%,var(--surface3) 50%,var(--surface2) 75%);background-size:200% 100%;animation:shimmer 1.5s ease-in-out infinite;border-radius:var(--radius-sm)}
.skel-text{height:14px;margin-bottom:8px;border-radius:4px}
.skel-text.w-full{width:100%}
.skel-text.w-3-4{width:75%}
.skel-text.w-half{width:50%}
.skel-text.w-1-4{width:25%}
.skel-title{height:20px;width:60%;margin-bottom:12px;border-radius:4px}
.skel-avatar{width:32px;height:32px;border-radius:50%}
.skel-card{height:180px;border-radius:var(--radius-lg)}

/* ── SPINNER ────────────────────────────────── */
.pma .spinner{width:18px;height:18px;border:2px solid var(--border2);border-top-color:var(--accent);border-radius:50%;animation:spin .6s linear infinite;display:inline-block}

/* ── NOTIFICATION BELL ──────────────────────── */
.notif-bell{position:relative;cursor:pointer;padding:6px;border-radius:var(--radius-sm);transition:background var(--dur-fast) var(--ease-in-out)}
.notif-bell:hover{background:var(--surface2)}
.notif-bell svg{width:18px;height:18px;color:var(--text3);transition:color var(--dur-fast)}
.notif-bell:hover svg{color:var(--text2)}
.notif-badge{position:absolute;top:2px;right:2px;width:8px;height:8px;background:var(--red);border-radius:50%;border:2px solid var(--surface);animation:pulseGlow 2s infinite}
.notif-badge-count{position:absolute;top:-2px;right:-4px;min-width:16px;height:16px;background:var(--red);border-radius:8px;font-size:9px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;padding:0 4px;border:2px solid var(--surface)}

/* ── NOTIFICATION DROPDOWN ──────────────────── */
.notif-dropdown{position:absolute;top:calc(100% + 8px);right:0;width:360px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:0 8px 32px rgba(0,0,0,.4);z-index:100;overflow:hidden;animation:fadeInDown var(--dur-enter) var(--ease-out)}
.notif-hd{padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.notif-hd-title{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--text2)}
.notif-list{max-height:320px;overflow-y:auto}
.notif-item{padding:12px 16px;border-bottom:1px solid rgba(37,42,58,.4);cursor:pointer;transition:background var(--dur-fast)}
.notif-item:hover{background:var(--surface2)}
.notif-item:last-child{border-bottom:none}
.notif-item.unread{background:var(--accent-dim)}
.notif-item.unread:hover{background:rgba(79,114,255,.12)}
.notif-time{font-size:11px;color:var(--text4)}
.notif-msg{font-size:13px;color:var(--text);line-height:1.5;margin-top:2px}
.notif-empty{padding:32px 16px;text-align:center;color:var(--text3);font-size:13px}

/* ── COMMENTS ───────────────────────────────── */
.comment-list{display:flex;flex-direction:column;gap:2px}
.comment-item{padding:14px 0;border-bottom:1px solid rgba(37,42,58,.4);animation:fadeIn var(--dur-enter) var(--ease-out)}
.comment-item:last-child{border-bottom:none}
.comment-header{display:flex;align-items:center;gap:10px;margin-bottom:6px}
.comment-author{font-size:13px;font-weight:600;color:var(--text)}
.comment-time{font-size:11px;color:var(--text4)}
.comment-body{font-size:13px;color:var(--text2);line-height:1.6;padding-left:38px}
.comment-actions{display:flex;gap:6px;padding-left:38px;margin-top:6px}
.comment-input-wrap{display:flex;gap:10px;align-items:flex-start;padding:16px 0;border-top:1px solid var(--border)}
.comment-input{flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:10px 14px;color:var(--text);font-size:13px;font-family:'DM Sans',sans-serif;resize:none;min-height:42px;max-height:120px;outline:none;transition:border-color var(--dur-fast)}
.comment-input:focus{border-color:var(--accent)}

/* ── AVATAR UPLOAD ──────────────────────────── */
.avatar-upload{position:relative;cursor:pointer;display:inline-block}
.avatar-upload-overlay{position:absolute;inset:0;border-radius:50%;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity var(--dur-base);font-size:18px}
.avatar-upload:hover .avatar-upload-overlay{opacity:1}

/* ── ARCHIVED STORIES ───────────────────────── */
.archived-bar{background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius);padding:10px 16px;display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;animation:fadeIn var(--dur-enter) var(--ease-out)}

/* ── POLISH: ENHANCED TRANSITIONS ───────────── */
.pma .btn{transition:all var(--dur-base) var(--ease-in-out)}
.pma .btn:active:not(:disabled){transform:scale(.97)}
.pma .card{transition:border-color var(--dur-base) var(--ease-in-out)}
.pma .card:hover{border-color:var(--border2)}
.pma .fi,.pma .fta,.pma .fsel{transition:border-color var(--dur-base) var(--ease-in-out),box-shadow var(--dur-base)}
.pma .fi:focus,.pma .fta:focus,.pma .fsel:focus{box-shadow:0 0 0 3px var(--accent-dim)}
.pma .sb-item{transition:all var(--dur-base) var(--ease-in-out)}
.pma .sb-story{transition:all var(--dur-base) var(--ease-in-out)}
.pma .tab{transition:all var(--dur-base) var(--ease-in-out)}
.pma .chip{transition:all var(--dur-base) var(--ease-in-out)}
.pma .tone-pill{transition:all var(--dur-base) var(--ease-in-out)}
.pma .modal-overlay{animation:fadeIn var(--dur-base) var(--ease-out)}
.pma .modal{animation:slideInUp var(--dur-slow) var(--ease-spring)}
.pma .badge{transition:all var(--dur-fast)}
.pma .wf-step{transition:all var(--dur-base) var(--ease-in-out)}
.pma .wf-step:active{transform:scale(.97)}
.pma .del-card{transition:all var(--dur-base) var(--ease-in-out)}
.pma .del-card:hover{border-color:var(--border2)}
.pma .notice{animation:fadeIn var(--dur-enter) var(--ease-out)}
.pma .toast-enter{animation:slideInRight var(--dur-slow) var(--ease-spring)}

/* ── POLISH: REDUCED MOTION ─────────────────── */
@media(prefers-reduced-motion:reduce){
  .pma,.pma *{animation-duration:0.01ms!important;animation-iteration-count:1!important;transition-duration:0.01ms!important}
}

/* ── POLISH: FOCUS VISIBLE ──────────────────── */
.pma :focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.pma button:focus:not(:focus-visible),.pma input:focus:not(:focus-visible),.pma select:focus:not(:focus-visible),.pma textarea:focus:not(:focus-visible){outline:none}

/* ── STORY CARD (Dashboard) ─────────────────── */
.story-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:18px 20px;cursor:pointer;position:relative}
.story-card:hover,.story-card:focus-visible{border-color:var(--accent-mid);transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,0,0,.2)}
.story-card .hook-text{font-size:12px;color:var(--text3);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;height:36px}

/* ── ACTION DROPDOWN ────────────────────────── */
.action-dropdown{position:absolute;top:calc(100% + 4px);right:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:4px;min-width:180px;z-index:50;box-shadow:0 8px 24px rgba(0,0,0,.3);animation:fadeInDown var(--dur-enter) var(--ease-out)}
.action-dropdown .sb-item{margin:0;border-radius:var(--radius-sm)}

/* ── SIDEBAR FOOTER ─────────────────────────── */
.sb-more{padding:6px 10px;font-size:11px;color:var(--text4);cursor:pointer;text-align:center}
.sb-more:hover{color:var(--accent)}

/* ── RESPONSIVE ─────────────────────────────── */
@media(max-width:1024px){
  .pma .content{padding:20px 20px}
}
@media(max-width:768px){
  .pma .sidebar{display:none}
  .pma .topbar{padding:0 16px}
  .pma .content{padding:16px}
  .pma .sh{flex-direction:column;gap:12px}
  .pma .profile-header{flex-direction:column;text-align:center;gap:12px}
  .pma .profile-meta{justify-content:center}
}
`;

// ─── SKELETON LOADER ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"18px 20px" }}>
      <div className="skel skel-title"/>
      <div className="skel skel-text w-3-4"/>
      <div className="skel skel-text w-full" style={{ marginBottom:12 }}/>
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <div className="skel" style={{ width:80, height:22, borderRadius:20 }}/>
        <div className="skel" style={{ width:60, height:22, borderRadius:20 }}/>
      </div>
      <div className="skel skel-text w-full"/>
      <div className="skel skel-text w-half"/>
      <div style={{ display:"flex", gap:3, marginTop:12 }}>
        {[0,1,2,3,4].map(i => <div key={i} className="skel" style={{ flex:1, height:3, borderRadius:2 }}/>)}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="content" style={{ animation:"fadeIn .3s ease" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:22 }}>
        <div><div className="skel skel-title" style={{ width:200 }}/><div className="skel skel-text w-half" style={{ width:120 }}/></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:16 }}>
        {[0,1,2,3,4].map(i => <div key={i} className="skel" style={{ height:80, borderRadius:"var(--radius)" }}/>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
        {[0,1,2,3,4,5].map(i => <SkeletonCard key={i}/>)}
      </div>
    </div>
  );
}

// ─── NOTIFICATION BELL ──────────────────────────────────────────
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef(null);

  const unreadCount = notifs.filter(n => !n.read_at).length;

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const loadNotifs = async () => {
    setLoading(true);
    try {
      const data = await api.notifications.list();
      setNotifs(Array.isArray(data) ? data : data?.notifications || []);
    } catch { }
    finally { setLoading(false); }
  };

  const toggleOpen = () => {
    if (!open) loadNotifs();
    setOpen(v => !v);
  };

  const markRead = async (id) => {
    try {
      await api.notifications.markRead(id);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    } catch { }
  };

  const markAll = async () => {
    try {
      await api.notifications.markAll();
      setNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    } catch { }
  };

  const relTime = (d) => {
    if (!d) return "";
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div ref={dropRef} style={{ position: "relative" }}>
      <div className="notif-bell" onClick={toggleOpen}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          unreadCount > 9
            ? <span className="notif-badge"/>
            : <span className="notif-badge-count">{unreadCount}</span>
        )}
      </div>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-hd">
            <span className="notif-hd-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="btn btn-ghost btn-xs" onClick={markAll}>Mark all read</button>
            )}
          </div>
          <div className="notif-list">
            {loading && <div style={{ padding:20, textAlign:"center" }}><span className="spinner"/></div>}
            {!loading && notifs.length === 0 && (
              <div className="notif-empty">No notifications yet</div>
            )}
            {!loading && notifs.map(n => (
              <div key={n.id} className={`notif-item${!n.read_at ? " unread" : ""}`}
                onClick={() => !n.read_at && markRead(n.id)}>
                <div className="notif-time">{relTime(n.created_at)}</div>
                <div className="notif-msg">{n.message || n.body || "Notification"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COMMENTS TAB ───────────────────────────────────────────────
function CommentsTab({ story }) {
  const { session } = useSession();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    api.stories.comments(story.id)
      .then(data => setComments(Array.isArray(data) ? data : data?.comments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [story.id]);

  const postComment = async () => {
    if (!text.trim()) return;
    setPosting(true);
    try {
      const c = await api.stories.addComment(story.id, { body: text });
      setComments(prev => [...prev, c]);
      setText("");
    } catch { }
    finally { setPosting(false); }
  };

  const deleteComment = async (id) => {
    try {
      await api.stories.deleteComment(story.id, id);
      setComments(prev => prev.filter(c => c.id !== id));
    } catch { }
  };

  const saveEdit = async (id) => {
    try {
      const updated = await api.stories.updateComment(story.id, id, { body: editText });
      setComments(prev => prev.map(c => c.id === id ? { ...c, body: editText, ...updated } : c));
      setEditingId(null);
      setEditText("");
    } catch { }
  };

  const relTime = (d) => {
    if (!d) return "";
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div>
      <div className="card">
        <div className="card-hd">
          <span className="card-title">Comments</span>
          <span className="card-sub">{comments.length}</span>
        </div>
        <div className="card-bd">
          {loading && <div style={{ padding:20, textAlign:"center" }}><span className="spinner"/></div>}
          {!loading && comments.length === 0 && (
            <Empty icon="💬" title="No comments yet" sub="Start a conversation about this story."/>
          )}
          {!loading && (
            <div className="comment-list">
              {comments.map(c => (
                <div key={c.id} className="comment-item">
                  <div className="comment-header">
                    <UserAvatar user={c.user || { name: c.user_name || "?" }} size={28}/>
                    <span className="comment-author">{c.user?.name || c.user_name || "Unknown"}</span>
                    <span className="comment-time">{relTime(c.created_at)}</span>
                  </div>
                  {editingId === c.id ? (
                    <div style={{ paddingLeft:38 }}>
                      <textarea className="comment-input" value={editText}
                        onChange={e => setEditText(e.target.value)} autoFocus/>
                      <div style={{ display:"flex", gap:6, marginTop:6 }}>
                        <button className="btn btn-primary btn-xs" onClick={() => saveEdit(c.id)}>Save</button>
                        <button className="btn btn-ghost btn-xs" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="comment-body">{c.body}</div>
                      {session?.user?.id === c.user_id && (
                        <div className="comment-actions">
                          <button className="btn btn-ghost btn-xs"
                            onClick={() => { setEditingId(c.id); setEditText(c.body); }}>Edit</button>
                          <button className="btn btn-ghost btn-xs" style={{ color:"var(--red)" }}
                            onClick={() => deleteComment(c.id)}>Delete</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="comment-input-wrap">
            <UserAvatar user={session?.user || { name:"?" }} size={28}/>
            <textarea className="comment-input" value={text} onChange={e => setText(e.target.value)}
              placeholder="Add a comment..." rows={1}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); postComment(); } }}/>
            <button className="btn btn-primary btn-sm" onClick={postComment}
              disabled={posting || !text.trim()}>
              {posting ? <span className="spinner" style={{ width:14, height:14 }}/> : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AVATAR UPLOAD ──────────────────────────────────────────────
function AvatarUploadWidget({ user, size = 64, onUploaded }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadFile("/auth/avatar", file);
      onUploaded?.(result);
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="avatar-upload" onClick={() => !uploading && fileRef.current?.click()}>
      <UserAvatar user={user} size={size}/>
      <div className="avatar-upload-overlay">
        {uploading ? <span className="spinner" style={{ borderTopColor:"#fff" }}/> : "📷"}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFile}/>
    </div>
  );
}

// ─── ARCHIVED STORIES VIEW ──────────────────────────────────────
function ArchivedStoriesView({ stories, onLoad, onRestore, onOpen }) {
  const { viewLang } = useLang();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    onLoad().finally(() => setLoading(false));
  }, []);

  const getTitle = (s) => viewLang === "CY" ? (s.title_cy || s.title_en) : (s.title_en || s.title_cy);

  return (
    <div className="content">
      <div className="sh">
        <div className="sh-left">
          <h1>Archived Stories</h1>
          <p>{stories.length} archived {stories.length === 1 ? "story" : "stories"}</p>
        </div>
      </div>

      {loading && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
          {[0,1,2].map(i => <SkeletonCard key={i}/>)}
        </div>
      )}

      {!loading && stories.length === 0 && (
        <Empty icon="🗄" title="No archived stories" sub="Stories you archive will appear here."/>
      )}

      {!loading && stories.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
          {stories.map(s => (
            <div key={s.id}
              style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)",
                padding:"18px 20px", transition:"all .2s", opacity:.8 }}
              onMouseEnter={e => { e.currentTarget.style.opacity="1"; e.currentTarget.style.borderColor="var(--accent)"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity=".8"; e.currentTarget.style.borderColor="var(--border)"; }}>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, marginBottom:4 }}>
                {getTitle(s)}
              </div>
              {s.programme && <div style={{ fontSize:12, color:"var(--text3)", marginBottom:8 }}>📺 {s.programme}</div>}
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
                <Badge status="ARCHIVED"/>
                {s.archived_at && <span style={{ fontSize:11, color:"var(--text4)" }}>Archived {s.archived_at.slice?.(0,10)}</span>}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn btn-green btn-sm" onClick={() => onRestore(s.id)}>↩ Restore</button>
                <button className="btn btn-ghost btn-sm" onClick={() => onOpen(s.id)}>View</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── APP INNER ────────────────────────────────────────────────────────────────
function AppInner() {
  const { session } = useSession();
  const user = session?.user;

  const { view, selectedId, navigate } = useHashRouter();

  const [stories,    setStories]    = useState([]);
  const [archived,   setArchived]   = useState([]);
  const [orgMembers, setOrgMembers] = useState([]);
  const [showNew,    setShowNew]    = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [toast,      setToast]      = useState(null);

  const showToast = useCallback((msg, type="success") => setToast({ msg, type }), []);

  // ── Load stories + members on mount ─────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.stories.list({ include_archived:"false", limit:200 }),
      api.org.members(),
    ]).then(([sData, mData]) => {
      setStories((sData.stories || []).map(normalizeStory));
      setOrgMembers(mData || []);
    }).catch(e => {
      showToast("Failed to load stories: " + (e.message||"Unknown error"), "error");
    }).finally(() => setLoading(false));
  }, []);

  const openStory   = (id) => navigate("story", id);
  const story = selectedId ? stories.find(s => s.id === selectedId) : null;

  // ── Create story ─────────────────────────────────────────────────────────────
  const createStory = async (form) => {
    const created = await api.stories.create({
      title_cy:   form.title_cy,
      title_en:   form.title_en || undefined,
      programme:  form.programme || undefined,
      shoot_date: form.shoot_date ? new Date(form.shoot_date).toISOString() : undefined,
      locations:  form.location ? [form.location] : [],
      visibility: form.visibility,
    });
    setStories(prev => [normalizeStory(created), ...prev]);
    setShowNew(false);
    openStory(created.id);
  };

  // ── Update story fields ───────────────────────────────────────────────────────
  const handleUpdate = useCallback(async (id, changes) => {
    try {
      let updated;

      if ("brief" in changes) {
        // Convert bilingual object shape → flat DB fields expected by PATCH /brief
        const b = changes.brief || {};
        const flat = {
          hook_cy:       b.story_hook?.original_language === "CY" ? b.story_hook?.source_text     : b.story_hook?.translated_text,
          hook_en:       b.story_hook?.original_language === "EN" ? b.story_hook?.source_text     : b.story_hook?.translated_text,
          hook_status:   b.story_hook?.translation_status || "PENDING",
          why_now_cy:    b.why_now?.original_language === "CY"    ? b.why_now?.source_text        : b.why_now?.translated_text,
          why_now_en:    b.why_now?.original_language === "EN"    ? b.why_now?.source_text        : b.why_now?.translated_text,
          why_now_status:b.why_now?.translation_status || "PENDING",
          tone:          b.tone || undefined,
          sync_lines:    b.sync_lines || undefined,
        };
        const result = await api.stories.updateBrief(id, flat);
        setStories(prev => prev.map(s => s.id===id ? { ...s, brief: result } : s));
        return result;
      }

      if ("shoot_notes" in changes) {
        const n = changes.shoot_notes || {};
        const flat = {
          what_worked: n.worked_well || n.what_worked || undefined,
          unexpected:  n.unexpected  || undefined,
          missing:     n.missing     || undefined,
        };
        const result = await api.stories.updateShoot(id, flat);
        setStories(prev => prev.map(s => s.id===id ? { ...s, shoot_notes: result } : s));
        return result;
      }

      if ("handover" in changes) {
        const h = changes.handover || {};
        const flat = {
          intention_cy:      h.story_intention?.original_language === "CY" ? h.story_intention?.source_text : h.story_intention?.translated_text,
          intention_en:      h.story_intention?.original_language === "EN" ? h.story_intention?.source_text : h.story_intention?.translated_text,
          must_clips:        h.clips          || undefined,
          visual_highlights: h.highlights     || undefined,
          music_ref:         h.music_suggestions ? { text: h.music_suggestions } : undefined,
          additional_notes:  h.additional_notes  || undefined,
        };
        const result = await api.stories.updateHandover(id, flat);
        setStories(prev => prev.map(s => s.id===id ? { ...s, handover: result } : s));
        return result;
      }

      // Deliverables, media_links, media — local state only (child tabs manage API calls directly)
      if ("deliverables" in changes || "media" in changes || "media_links" in changes) {
        setStories(prev => prev.map(s => s.id===id ? { ...s, ...changes } : s));
        return changes;
      }

      // Top-level story fields: title, programme, shoot_date, visibility, locations
      const topLevelAllowed = ["title_cy","title_en","programme","shoot_date","visibility","locations","team_id"];
      const topLevel = Object.fromEntries(Object.entries(changes).filter(([k]) => topLevelAllowed.includes(k)));
      if (Object.keys(topLevel).length > 0) {
        updated = await api.stories.update(id, topLevel);
        setStories(prev => prev.map(s => s.id===id ? { ...s, ...updated } : s));
        return updated;
      }

      // Fallback: merge locally
      setStories(prev => prev.map(s => s.id===id ? { ...s, ...changes } : s));
      return changes;

    } catch (e) {
      showToast("Save failed: " + (e.data?.error||e.message), "error");
      throw e;
    }
  }, []);

  // ── Status change ─────────────────────────────────────────────────────────────
  const handleStatusChange = useCallback(async (id, status) => {
    try {
      const updated = await api.stories.setStatus(id, status);
      setStories(prev => prev.map(s => s.id===id ? { ...s, status: updated.status } : s));
      showToast(`Status → ${status.replace(/_/g," ")}`);
    } catch (e) {
      showToast("Status change failed: " + (e.data?.error||e.message), "error");
    }
  }, []);

  // ── Duplicate story ─────────────────────────────────────────────────────────
  const handleDuplicate = useCallback(async (id) => {
    try {
      const dup = await api.stories.duplicate(id);
      setStories(prev => [normalizeStory(dup), ...prev]);
      openStory(dup.id);
      showToast("Story duplicated");
    } catch (e) {
      showToast("Duplicate failed: " + (e.data?.error||e.message), "error");
    }
  }, []);

  // ── Archive story ──────────────────────────────────────────────────────────
  const handleArchive = useCallback(async (id) => {
    try {
      await api.stories.delete(id);
      const s = stories.find(x => x.id === id);
      if (s) {
        setStories(prev => prev.filter(x => x.id !== id));
        setArchived(prev => [{ ...s, status:"ARCHIVED", archived_at:new Date().toISOString() }, ...prev]);
      }
      navigate("dashboard");
      showToast("Story archived");
    } catch (e) {
      showToast("Archive failed: " + (e.data?.error||e.message), "error");
    }
  }, [stories, navigate]);

  // ── Restore story ──────────────────────────────────────────────────────────
  const handleRestore = useCallback(async (id) => {
    try {
      const restored = await api.stories.restore(id);
      setArchived(prev => prev.filter(x => x.id !== id));
      setStories(prev => [normalizeStory(restored), ...prev]);
      navigate("dashboard");
      showToast("Story restored");
    } catch (e) {
      showToast("Restore failed: " + (e.data?.error||e.message), "error");
    }
  }, [navigate]);

  // ── Load archived stories ──────────────────────────────────────────────────
  const loadArchived = useCallback(async () => {
    try {
      const data = await api.stories.list({ include_archived:"true", status:"ARCHIVED", limit:100 });
      setArchived((data.stories || []).map(normalizeStory));
    } catch { }
  }, []);

  // ── Reload single story (after sub-resource saves) ────────────────────────────
  const reloadStory = useCallback(async (id) => {
    try {
      const fresh = await api.stories.get(id);
      setStories(prev => prev.map(s => s.id===id ? normalizeStory(fresh) : s));
      return fresh;
    } catch {}
  }, []);

  return (
    <LangProvider defaultLang={user?.preferred_lang || "EN"}>
      <div className="pma pma-app">
        <style>{CSS}{EXTRA_CSS}</style>

        <Sidebar
          stories={stories}
          view={view}
          selectedId={selectedId}
          onNav={v => navigate(v)}
          onOpen={openStory}
          onNew={() => setShowNew(true)}
        />

        <div className="main">
          {view === "dashboard" && (
            loading ? <DashboardSkeleton/> : (
              <Dashboard
                stories={stories}
                orgMembers={orgMembers}
                loading={false}
                onOpen={openStory}
                onNew={() => setShowNew(true)}
              />
            )
          )}
          {view === "story" && story && (
            <StoryView
              story={story}
              orgMembers={orgMembers}
              onUpdate={handleUpdate}
              onStatusChange={handleStatusChange}
              onDuplicate={handleDuplicate}
              onArchive={handleArchive}
              onRestore={handleRestore}
              onBack={() => navigate("dashboard")}
            />
          )}
          {view === "archived" && (
            <ArchivedStoriesView
              stories={archived}
              onLoad={loadArchived}
              onRestore={handleRestore}
              onOpen={(id) => navigate("story", id)}
            />
          )}
          {view === "account" && <UserAccountPage orgMembers={orgMembers}/>}
          {view === "org"     && <OrganisationPage orgMembers={orgMembers} onMembersChange={setOrgMembers}/>}
          {view === "teams"   && <TeamManagementPage orgMembers={orgMembers} onMembersChange={setOrgMembers}/>}
        </div>

        {showNew && (
          <NewStoryModal
            orgMembers={orgMembers}
            onClose={() => setShowNew(false)}
            onCreate={createStory}
          />
        )}

        {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)}/>}
      </div>
    </LangProvider>
  );
}

// ─── ROOT ENTRY POINT ─────────────────────────────────────────────
function App() {
  return (
    <SessionProvider>
      <AppInner/>
    </SessionProvider>
  );
}

export default App;
