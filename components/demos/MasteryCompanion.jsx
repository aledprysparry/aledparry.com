"use client";

import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";

// ─── SCHOOLS ──────────────────────────────────────────────────────────────
const WELSH_SCHOOLS = [
  { id:"sch-001", name:"Ysgol Gymraeg Casnewydd",                location:"Newport" },
  { id:"sch-002", name:"Ysgol Gyfun Gymraeg Glantaf",           location:"Cardiff" },
  { id:"sch-003", name:"Ysgol Bro Morgannwg",                   location:"Barry" },
  { id:"sch-004", name:"St. David's Catholic Primary",          location:"Cardiff" },
  { id:"sch-005", name:"Ysgol Gynradd Gymraeg Llwyncelyn",      location:"Porth" },
  { id:"sch-006", name:"Cardiff High School",                   location:"Cardiff" },
  { id:"sch-007", name:"Ysgol Pen-y-Garth",                    location:"Penarth" },
  { id:"sch-008", name:"Bishop Hedley High School",             location:"Merthyr Tydfil" },
  { id:"sch-009", name:"Ysgol Gyfun Gymraeg Plasmawr",         location:"Cardiff" },
  { id:"sch-010", name:"St. Cyres School",                     location:"Penarth" },
  { id:"sch-011", name:"Ysgol Gymraeg Pwll Coch",              location:"Cardiff" },
  { id:"sch-012", name:"Christ The King Primary",              location:"Cardiff" },
  { id:"sch-013", name:"Ysgol Gyfun Gymraeg Bro Myrddin",      location:"Carmarthen" },
  { id:"sch-014", name:"Ysgol Gyfun Llangefni",                location:"Anglesey" },
  { id:"sch-015", name:"Ysgol David Hughes",                   location:"Anglesey" },
  { id:"sch-016", name:"Ysgol Gyfun Gwyr",                     location:"Swansea" },
  { id:"sch-017", name:"Ysgol Gyfun Brynrefail",               location:"Gwynedd" },
  { id:"sch-018", name:"Ysgol Bro Hyddgen",                    location:"Machynlleth" },
  { id:"sch-019", name:"Ysgol Maes y Gwendraeth",              location:"Carmarthenshire" },
  { id:"sch-020", name:"Ysgol Gyfun Gymraeg Rhydywaun",        location:"Rhondda Cynon Taf" },
  { id:"sch-021", name:"Ysgol Bro Dinefwr",                    location:"Llandeilo" },
  { id:"sch-022", name:"Ysgol Uwchradd Aberteifi",             location:"Cardigan" },
  { id:"sch-023", name:"Ysgol Gyfun Emlyn",                    location:"Newcastle Emlyn" },
  { id:"sch-024", name:"Ysgol Syr Thomas Picton",              location:"Haverfordwest" },
  { id:"sch-025", name:"Ysgol Greenhill",                      location:"Tenby" },
  { id:"sch-026", name:"Ysgol Gyfun y Preseli",                location:"Pembrokeshire" },
  { id:"sch-027", name:"Ysgol Caer Elen",                      location:"Brecon" },
  { id:"sch-028", name:"Ysgol Y Fenni",                        location:"Abergavenny" },
  { id:"sch-029", name:"St. Joseph's Catholic High School",    location:"Newport" },
  { id:"sch-030", name:"Ysgol Gymraeg Iolo Morganwg",          location:"Bridgend" },
].sort((a,b)=>a.name.localeCompare(b.name));

const ADMIN_EMAILS = ["aled@aledparry.com"];

const CPA_MODULES = [
  "Number Sense Foundations",
  "Concrete Manipulatives Discovery",
  "Part-Whole Bar Modelling",
  "Comparison Bar Modelling",
  "Heuristic Problem Solving",
  "Abstract Algorithm Precision",
];

const LESSON_DEFS = [
  { id:"anchor",  label:"Anchor Task: Concept Discovery",        min:5,  ideal:10, type:"Non-Negotiable", cpa:"Concrete" },
  { id:"model",   label:"Explicit Modelling: Multiple Pathways", min:12, ideal:15, type:"Non-Negotiable", cpa:"Pictorial" },
  { id:"guided",  label:"Guided Practice: CPA Scaffolding",      min:8,  ideal:15, type:"Adaptable",      cpa:"Transitioning" },
  { id:"journal", label:"Journaling: Metacognitive Reflection",  min:10, ideal:15, type:"Core",           cpa:"Abstract" },
  { id:"review",  label:"Lesson Review: Key Generalisation",     min:3,  ideal:5,  type:"Core",           cpa:"Abstract" },
];

const LESSON_TEMPLATES = [
  { name:"Number & Place Value",    duration:60 },
  { name:"Addition & Subtraction",  duration:55 },
  { name:"Multiplication & Division",duration:60 },
  { name:"Fractions",               duration:65 },
  { name:"Geometry & Measurement",  duration:50 },
  { name:"Statistics & Data",       duration:45 },
  { name:"Problem Solving",         duration:70 },
];

const DEFAULT_TRANSLATIONS = {
  dashboard:        { en:"Dashboard",            cy:"Bwrdd Rheoli" },
  planning:         { en:"Lesson Planning",      cy:"Cynllunio Gwersi" },
  journal:          { en:"Journal Capture",      cy:"Cipio Dyfnlyfr" },
  mastery:          { en:"Mastery Tracking",     cy:"Tracio Meistrolaeth" },
  profiles:         { en:"Big Picture",          cy:"Llun Mawr" },
  curriculum:       { en:"Curriculum Alignment", cy:"Aliniad Cwricwlwm" },
  inspection:       { en:"Inspection Proof",     cy:"Prawf Archwiliad" },
  reports:          { en:"Reports",              cy:"Adroddiadau" },
  admin:            { en:"Translation Admin",    cy:"Gweinyddu Cyfieithiadau" },
  signOut:          { en:"Sign Out",             cy:"Allgofnodi" },
  signIn:           { en:"Sign In",              cy:"Mewngofnodi" },
  welcome:          { en:"Welcome to Mastery Companion", cy:"Croeso i'r Cydymaith Meistrolaeth" },
  methodologyFirst: { en:"Methodology First",    cy:"Y Fethodoleg yn Gyntaf" },
  account:          { en:"Account",              cy:"Cyfrif" },
  createAccount:    { en:"Create Account",       cy:"Creu Cyfrif" },
  institution:      { en:"Institution",          cy:"Sefydliad" },
  selectSchool:     { en:"Select your school",   cy:"Dewiswch eich ysgol" },
  classroomName:    { en:"Classroom Name",       cy:"Enw'r Dosbarth" },
  saveChanges:      { en:"Save Changes",         cy:"Cadw Newidiadau" },
  pupils:           { en:"Pupils",               cy:"Disgyblion" },
  lessons:          { en:"Lessons",              cy:"Gwersi" },
  evidence:         { en:"Evidence",             cy:"Tystiolaeth" },
  noData:           { en:"No data yet",          cy:"Dim data eto" },
};

const uid = () => Math.random().toString(36).slice(2,9) + Date.now().toString(36);

// ─── DEMO DATA ────────────────────────────────────────────────────────────
const DEMO_CLASSROOM = { id:"c1", name:"Year 5 Maths – Set A", schoolId:"sch-006", schoolName:"Cardiff High School", schoolLocation:"Cardiff", academicYear:"2024–2025" };
const DEMO_STUDENTS = [
  { id:"s1", firstName:"Ioan",    lastName:"Griffiths", moduleIdx:3, dob:"2013-04-12", notes:"Strong visual learner, excels at bar modelling." },
  { id:"s2", firstName:"Cerys",   lastName:"Jones",     moduleIdx:4, dob:"2013-07-23", notes:"Occasionally mislabels diagrams — reinforce conventions." },
  { id:"s3", firstName:"Rhys",    lastName:"Williams",  moduleIdx:1, dob:"2013-01-08", notes:"Struggles with abstract representation. More concrete time needed." },
  { id:"s4", firstName:"Nia",     lastName:"Evans",     moduleIdx:4, dob:"2013-09-15", notes:"Very independent — challenge with extension tasks." },
  { id:"s5", firstName:"Dylan",   lastName:"Thomas",    moduleIdx:0, dob:"2013-11-29", notes:"New to the methodology. Building foundational understanding." },
  { id:"s6", firstName:"Lowri",   lastName:"Roberts",   moduleIdx:3, dob:"2013-06-03", notes:"Good peer mentor — consider pair work arrangements." },
  { id:"s7", firstName:"Ffion",   lastName:"Davies",    moduleIdx:2, dob:"2013-03-17", notes:"Consistent effort; needs more time on part-whole models." },
  { id:"s8", firstName:"Gethin",  lastName:"Morgan",    moduleIdx:4, dob:"2013-08-11", notes:"High achiever, ready for heuristic extension." },
];
const DEMO_LESSONS = [
  { id:"l1", title:"Bar Modelling Introduction", duration:60, status:"InProgress", notes:"Focus on equal and unequal parts. Use physical counters first.", createdAt: new Date(Date.now()-86400000).toISOString() },
  { id:"l2", title:"Number Bonds to 20",         duration:45, status:"Completed",  notes:"Strong session — most pupils grasped the abstract stage.", createdAt: new Date(Date.now()-172800000).toISOString() },
  { id:"l3", title:"Part-Whole Model Mastery",   duration:50, status:"Planned",    notes:"Introduce 3-part whole models. Prepare physical resources.", createdAt: new Date(Date.now()-259200000).toISOString() },
];
const DEMO_ENTRIES = [
  { id:"e1", studentId:"s1", studentName:"Ioan Griffiths", lessonId:"l2", lessonTitle:"Number Bonds to 20", cpaDetected:"Abstract",  paceStatus:"On Track", reasoningScore:82, methodUsed:"Number Bond",     misconceptions:[],                           successes:["Clear working shown","Correct answer"],             nextStep:"Move to abstract computation",         captureDate:new Date(Date.now()-172800000).toISOString(), transcription:"Student wrote: 14 + 6 = 20 and 20 - 14 = 6, showing understanding of inverse." },
  { id:"e2", studentId:"s2", studentName:"Cerys Jones",    lessonId:"l2", lessonTitle:"Number Bonds to 20", cpaDetected:"Pictorial", paceStatus:"On Track", reasoningScore:74, methodUsed:"Part-Whole Bar",  misconceptions:["Mislabelled bar segment"],    successes:["Correct final answer","Good diagram"],              nextStep:"Revisit bar labelling conventions",     captureDate:new Date(Date.now()-172800000).toISOString(), transcription:"Bar model drawn correctly but whole and parts labels swapped in one instance." },
  { id:"e3", studentId:"s3", studentName:"Rhys Williams",  lessonId:"l2", lessonTitle:"Number Bonds to 20", cpaDetected:"Concrete",  paceStatus:"At Risk",  reasoningScore:45, methodUsed:"Counting On",    misconceptions:["Over-reliance on fingers"],   successes:["Persistent effort"],                                nextStep:"Introduce structured number line",      captureDate:new Date(Date.now()-86400000).toISOString(),  transcription:"Used finger counting throughout. Numbers correct but method is pre-mastery." },
  { id:"e4", studentId:"s4", studentName:"Nia Evans",      lessonId:"l1", lessonTitle:"Bar Modelling Introduction", cpaDetected:"Abstract",  paceStatus:"On Track", reasoningScore:91, methodUsed:"Bar Model",      misconceptions:[],                           successes:["Extended independently","Explained reasoning"], nextStep:"Challenge with multi-step problems",    captureDate:new Date(Date.now()-43200000).toISOString(),  transcription:"Created own extension problem using bar model. Excellent abstract thinking demonstrated." },
  { id:"e5", studentId:"s6", studentName:"Lowri Roberts",  lessonId:"l1", lessonTitle:"Bar Modelling Introduction", cpaDetected:"Pictorial", paceStatus:"On Track", reasoningScore:78, methodUsed:"Part-Whole Bar",  misconceptions:["Unequal bar widths"],        successes:["Correct values","Good effort"],                    nextStep:"Reinforce proportional drawing",        captureDate:new Date(Date.now()-43200000).toISOString(),  transcription:"Bar model values correct but physical proportions were not maintained in drawing." },
];

// ─── CONTEXT ──────────────────────────────────────────────────────────────
const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

function Provider({ children }) {
  const [userDB,    setUserDB]    = useState({ "demo@mastery.wales": { id:"demo", email:"demo@mastery.wales", password:"demo123", firstName:"Demo", lastName:"Teacher", jobTitle:"Teacher" } });
  const [user,      setUser]      = useState(null);
  const [classroom, setClassroom] = useState(null);
  const [students,  setStudents]  = useState([]);
  const [lessons,   setLessons]   = useState([]);
  const [entries,   setEntries]   = useState([]);
  const [alerts,    setAlerts]    = useState([]);
  const [lang,      setLang]      = useState("en");
  const [transl,    setTransl]    = useState({ ...DEFAULT_TRANSLATIONS });
  const [sideOpen,  setSideOpen]  = useState(true);

  const t = useCallback((k) => {
    const e = transl[k];
    if (!e) return k;
    return e[lang] || e.en || k;
  }, [transl, lang]);

  const toggleLang = () => setLang(l => l === "en" ? "cy" : "en");

  const login = (email, password) => {
    const u = userDB[email.toLowerCase()];
    if (!u || u.password !== password) throw new Error("Invalid email or password.");
    const s = { ...u }; delete s.password;
    setUser(s); return s;
  };

  const register = (data) => {
    const key = data.email.toLowerCase();
    if (userDB[key]) throw new Error("An account already exists with this email.");
    const nu = { id: uid(), ...data };
    setUserDB(p => ({ ...p, [key]: nu }));
    const s = { ...nu }; delete s.password;
    setUser(s); return s;
  };

  const logout = () => { setUser(null); setClassroom(null); setStudents([]); setLessons([]); setEntries([]); setAlerts([]); };
  const updateUser = (u) => { setUser(p => ({ ...p, ...u })); setUserDB(p => { const k = user?.email?.toLowerCase(); return k&&p[k] ? { ...p, [k]: { ...p[k], ...u } } : p; }); };
  const deleteAccount = () => logout();

  const loadDemo = () => { setClassroom({ ...DEMO_CLASSROOM }); setStudents([...DEMO_STUDENTS]); setLessons([...DEMO_LESSONS]); setEntries([...DEMO_ENTRIES]); setAlerts([]); };

  const createClassroom = (data) => { const c = { id: uid(), academicYear: "2024–2025", ...data }; setClassroom(c); return c; };

  const addStudent    = (d)    => { const s = { id: uid(), moduleIdx: 0, notes: "", ...d }; setStudents(p => [...p, s]); return s; };
  const removeStudent = (id)   => setStudents(p => p.filter(s => s.id !== id));
  const updateStudent = (id,u) => setStudents(p => p.map(s => s.id === id ? { ...s, ...u } : s));

  const addLesson    = (d)    => { const l = { id: uid(), createdAt: new Date().toISOString(), status:"Planned", notes:"", ...d }; setLessons(p => [l, ...p]); return l; };
  const updateLesson = (id,u) => setLessons(p => p.map(l => l.id === id ? { ...l, ...u } : l));
  const deleteLesson = (id)   => setLessons(p => p.filter(l => l.id !== id));

  const addEntry     = (d)    => { const e = { id: uid(), captureDate: new Date().toISOString(), ...d }; setEntries(p => [e, ...p]); return e; };
  const deleteEntry  = (id)   => setEntries(p => p.filter(e => e.id !== id));

  const addAlert     = (d)    => { const a = { id: uid(), date: new Date().toISOString(), status:"Active", ...d }; setAlerts(p => [a, ...p]); return a; };
  const dismissAlert = (id)   => setAlerts(p => p.map(a => a.id === id ? { ...a, status:"Resolved" } : a));

  const setTranslation = (key, en, cy) => setTransl(p => ({ ...p, [key]: { en, cy } }));
  const isAdmin = ADMIN_EMAILS.includes(user?.email || "");

  return (
    <Ctx.Provider value={{
      user, userDB, login, register, logout, updateUser, deleteAccount, loadDemo,
      classroom, createClassroom,
      students, addStudent, removeStudent, updateStudent,
      lessons, addLesson, updateLesson, deleteLesson,
      entries, addEntry, deleteEntry,
      alerts, addAlert, dismissAlert,
      lang, toggleLang, t, transl, setTranslation,
      isAdmin, sideOpen, setSideOpen,
    }}>
      {children}
    </Ctx.Provider>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────
const ToastCtx = createContext(null);
const useToast = () => useContext(ToastCtx);
function ToastProvider({ children }) {
  const [list, setList] = useState([]);
  const toast = useCallback(({ title, description, variant="default" }) => {
    const id = uid();
    setList(p => [...p, { id, title, description, variant }]);
    setTimeout(() => setList(p => p.filter(t => t.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div style={{ position:"fixed", bottom:22, right:22, zIndex:9999, display:"flex", flexDirection:"column", gap:9, maxWidth:350 }}>
        {list.map(t => (
          <div key={t.id} style={{ background: t.variant==="destructive"?"#DC2626":"#0D1A2B", color:"#fff", padding:"12px 18px", borderRadius:13, boxShadow:"0 8px 32px rgba(0,0,0,.26)", animation:"fadeUp .3s ease", fontSize:13.5, borderLeft: t.variant==="destructive"?"4px solid #FCA5A5":"4px solid #3D8BD4" }}>
            <div style={{ fontWeight:700 }}>{t.title}</div>
            {t.description && <div style={{ opacity:.78, marginTop:3, fontSize:12.5, lineHeight:1.45 }}>{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ─── AI HELPERS ───────────────────────────────────────────────────────────
async function aiCall(system, userContent) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1024, system, messages:[{ role:"user", content: userContent }] }),
  });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.error?.message || `API error ${res.status}`); }
  const data = await res.json();
  const raw = data.content.map(b => b.text||"").join("");
  return JSON.parse(raw.replace(/```json\s*|```/g,"").trim());
}

// Image compression: resize to max 1200px, JPEG quality 0.82
const compressImage = (b64, mime) => new Promise(resolve => {
  const img = new Image();
  img.onload = () => {
    const MAX = 1200;
    let { width: w, height: h } = img;
    if (w > MAX || h > MAX) { if (w > h) { h = Math.round(h * MAX / w); w = MAX; } else { w = Math.round(w * MAX / h); h = MAX; } }
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d").drawImage(img, 0, 0, w, h);
    const compressed = c.toDataURL("image/jpeg", 0.82);
    resolve({ b64: compressed.split(",")[1], mime: "image/jpeg" });
  };
  img.src = `data:${mime};base64,${b64}`;
});

const analyzeJournal = async ({ b64, mime, lessonCtx, cpa }) => {
  const { b64: cb64, mime: cmime } = await compressImage(b64, mime);
  return aiCall(
    "You are an expert in Dr. Yeap Ban Har's Mastery methodology. Respond ONLY with valid JSON — no markdown, no preamble.",
    [
      { type:"image", source:{ type:"base64", media_type: cmime, data: cb64 } },
      { type:"text",  text:`Lesson: ${lessonCtx}\nExpected CPA stage: ${cpa}\n\nPerform two tasks:\n1. OCR: transcribe all visible handwritten text and working verbatim.\n2. NLP Analysis: analyse for mastery indicators.\n\nRespond with ONLY this JSON (no markdown):\n{"transcription":"full verbatim OCR of all text/numbers/workings visible","cpaStageDetected":"Concrete|Pictorial|Abstract|Transitioning","methodUsed":"specific method name","reasoningDepthScore":75,"misconceptionPatterns":["specific misconception"],"successIndicators":["specific success"],"suggestedInstructionalNextStep":"concrete next action","paceStatus":"On Track|At Risk|Drifting","sentimentIndicators":{"effort":"Low|Medium|High","confidence":"Low|Medium|High","engagement":"Low|Medium|High"},"lessonObjectivesMet":["objective met"],"keyVocabularyUsed":["word"]}` },
    ]
  );
};

const detectDrift = ({ name, idx, classIdx }) => aiCall(
  "You are a mastery methodology expert. Respond ONLY with valid JSON.",
  `Student: ${name}\nMastered module index: ${idx}\nClass current index: ${classIdx}\nDrift threshold: 2 modules\nModules: ${CPA_MODULES.map((m,i)=>`${i}:${m}`).join(", ")}\n\nRespond with ONLY:\n{"driftDetected":true,"driftDetails":"...","identifiedDriftModule":"...","suggestedIntervention":"..."}`
);

// Export evidence pack as printable HTML
const exportEvidencePack = ({ classroom, students, entries, alerts, profs }) => {
  const date = new Date().toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" });
  const avgScore = entries.length ? Math.round(entries.reduce((a,e)=>a+e.reasoningScore,0)/entries.length) : 0;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>Evidence Pack – ${classroom?.name || "Mastery Companion"}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a2332;line-height:1.5;font-size:13px}
  .page{max-width:210mm;margin:0 auto;padding:20mm}
  .cover{text-align:center;padding:40px 0 30px;border-bottom:3px solid #2A7AB5;margin-bottom:30px}
  .logo{width:60px;height:60px;background:linear-gradient(135deg,#2A7AB5,#7B6EE7);border-radius:14px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:28px;font-weight:800;margin-bottom:12px}
  h1{font-size:24px;color:#2A7AB5;margin-bottom:4px}h2{font-size:16px;color:#4A5568;font-weight:400;margin-bottom:20px}
  .meta{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
  .meta span{background:#EBF4FF;color:#2A7AB5;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700}
  .section{margin-bottom:28px}
  .sh{font-size:14px;font-weight:700;color:#2A7AB5;border-bottom:2px solid #EBF4FF;padding-bottom:6px;margin-bottom:14px;display:flex;align-items:center;gap:6px}
  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}
  .stat{background:#F5F8FB;border:1px solid #E1E8F0;border-radius:8px;padding:12px;text-align:center}
  .stat .v{font-size:22px;font-weight:800;color:#2A7AB5;line-height:1}
  .stat .l{font-size:10px;color:#8FA0B3;text-transform:uppercase;letter-spacing:.06em;margin-top:4px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#F5F8FB;padding:7px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#8FA0B3;border-bottom:1px solid #E1E8F0}
  td{padding:8px 10px;border-bottom:1px solid #F0F4F8}tr:hover td{background:#FAFCFF}
  .badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:9px;font-weight:700;text-transform:uppercase}
  .ok{background:#DCFCE7;color:#15803D}.warn{background:#FEF3C7;color:#B45309}.err{background:#FEE2E2;color:#DC2626}.pri{background:#EBF4FF;color:#2A7AB5}.acc{background:#F0EEFF;color:#7B6EE7}
  .prof{margin-bottom:10px}.prof .bar{height:6px;background:#E1E8F0;border-radius:999px;overflow:hidden;margin-top:4px}
  .prof .fill{height:100%;background:linear-gradient(90deg,#2A7AB5,#7B6EE7);border-radius:999px}
  .footer{margin-top:32px;padding-top:14px;border-top:1px solid #E1E8F0;text-align:center;font-size:10px;color:#8FA0B3}
  @media print{.page{padding:10mm}@page{margin:0}}
</style></head><body><div class="page">
<div class="cover">
  <div class="logo">M</div>
  <h1>Mastery Companion</h1>
  <h2>Evidence Pack – ${classroom?.schoolName || ""}</h2>
  <div class="meta">
    <span>${classroom?.name || "—"}</span>
    <span>${classroom?.academicYear || "—"}</span>
    <span>Generated: ${date}</span>
    <span>Dr. Yeap Ban Har Methodology</span>
  </div>
</div>

<div class="section">
  <div class="sh">📊 Class Summary</div>
  <div class="stats">
    <div class="stat"><div class="v">${students.length}</div><div class="l">Pupils Enrolled</div></div>
    <div class="stat"><div class="v">${entries.length}</div><div class="l">Diagnostic Entries</div></div>
    <div class="stat"><div class="v">${avgScore}%</div><div class="l">Avg Reasoning Score</div></div>
    <div class="stat"><div class="v">${alerts.length}</div><div class="l">Drift Alerts Logged</div></div>
  </div>
</div>

<div class="section">
  <div class="sh">📋 5 Mathematical Proficiencies – Curriculum for Wales</div>
  ${(profs||[]).map(p=>{
    const pct = Math.min(100,entries.length?Math.round((p.ev/Math.max(p.target,1))*100):0);
    return `<div class="prof"><div style="display:flex;justify-content:space-between"><span style="font-weight:600;font-size:12px">${p.name}</span><span style="font-size:11px;font-weight:700;color:#2A7AB5">${pct}%</span></div><div class="bar"><div class="fill" style="width:${pct}%"></div></div><div style="font-size:10px;color:#8FA0B3;margin-top:2px">${p.ev} verified entries</div></div>`;
  }).join("")}
</div>

<div class="section">
  <div class="sh">👥 Pupil Roster</div>
  <table>
    <thead><tr><th>Pupil</th><th>Mastered Module</th><th>Progress</th><th>Entries</th></tr></thead>
    <tbody>${students.map(s=>{
      const pupEntries = entries.filter(e=>e.studentId===s.id);
      return `<tr><td style="font-weight:700">${s.firstName} ${s.lastName}</td><td>${['Number Sense Foundations','Concrete Manipulatives Discovery','Part-Whole Bar Modelling','Comparison Bar Modelling','Heuristic Problem Solving','Abstract Algorithm Precision'][s.moduleIdx||0]}</td><td><span class="badge pri">Module ${(s.moduleIdx||0)+1}/6</span></td><td>${pupEntries.length}</td></tr>`;
    }).join("")}</tbody>
  </table>
</div>

${entries.length > 0 ? `<div class="section">
  <div class="sh">📓 Approved Diagnostic Evidence Log</div>
  <table>
    <thead><tr><th>Pupil</th><th>Lesson</th><th>CPA Stage</th><th>Score</th><th>Pace Status</th><th>Date</th></tr></thead>
    <tbody>${entries.map(e=>`<tr>
      <td style="font-weight:700">${e.studentName}</td>
      <td>${e.lessonTitle}</td>
      <td><span class="badge acc">${e.cpaDetected}</span></td>
      <td style="font-weight:700;color:#2A7AB5">${e.reasoningScore}%</td>
      <td><span class="badge ${e.paceStatus==="On Track"?"ok":e.paceStatus==="Drifting"?"err":"warn"}">${e.paceStatus}</span></td>
      <td>${new Date(e.captureDate).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</td>
    </tr>`).join("")}</tbody>
  </table>
</div>` : ""}

${alerts.length > 0 ? `<div class="section">
  <div class="sh">⚠ Drift Intervention Log</div>
  <table>
    <thead><tr><th>Pupil</th><th>Drifting Module</th><th>Suggested Intervention</th><th>Severity</th><th>Status</th><th>Date</th></tr></thead>
    <tbody>${alerts.map(a=>`<tr>
      <td style="font-weight:700">${a.studentName}</td>
      <td>${a.module||"—"}</td>
      <td>${a.intervention||"—"}</td>
      <td><span class="badge warn">${a.severity}</span></td>
      <td><span class="badge ${a.status==="Active"?"err":"ok"}">${a.status}</span></td>
      <td>${new Date(a.date).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"})}</td>
    </tr>`).join("")}</tbody>
  </table>
</div>` : ""}

<div class="footer">Mastery Companion · Curriculum for Wales · Dr. Yeap Ban Har Methodology · Generated ${date}</div>
</div></body></html>`;
  
  const win = window.open("","_blank","width=900,height=700");
  if (!win) { alert("Please allow popups for this site to export evidence packs."); return; }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 600);
};

const generateReport = ({ classroom, students, entries, alerts }) => aiCall(
  "You are a Welsh education expert specialising in Mastery methodology and Curriculum for Wales. Respond ONLY with valid JSON.",
  `Classroom: ${classroom?.name} at ${classroom?.schoolName}\nStudents: ${students.length}\nDiagnostic entries: ${entries.length}\nDrift alerts: ${alerts.length}\nAvg reasoning score: ${entries.length ? Math.round(entries.reduce((a,e)=>a+e.reasoningScore,0)/entries.length) : 0}\nCPA distribution: ${["Concrete","Pictorial","Abstract","Transitioning"].map(c=>c+":"+entries.filter(e=>e.cpaDetected===c).length).join(", ")}\n\nGenerate a professional term summary. Respond with ONLY:\n{"executiveSummary":"...","strengthAreas":["...","...","..."],"developmentPriorities":["...","..."],"estynReadiness":"Excellent|Good|Adequate|Requires Improvement","recommendedActions":["...","...","..."],"overallRating":85}`
);

const generateLongitudinalProfile = ({ student, entries }) => aiCall(
  "You are a Welsh education specialist with expertise in longitudinal student profiling. Respond ONLY with valid JSON — no markdown.",
  `Student: ${student.firstName} ${student.lastName}\nCurrent Module: ${['Number Sense Foundations','Concrete Manipulatives Discovery','Part-Whole Bar Modelling','Comparison Bar Modelling','Heuristic Problem Solving','Abstract Algorithm Precision'][student.moduleIdx||0]}\nTotal diagnostic entries: ${entries.length}\n\nEntry timeline (oldest first):\n${entries.slice().reverse().map((e,i)=>`Entry ${i+1} [${new Date(e.captureDate).toLocaleDateString('en-GB')}]: CPA=${e.cpaDetected}, Score=${e.reasoningScore}, Pace=${e.paceStatus}, Method=${e.methodUsed}, Misconceptions=${(e.misconceptions||[]).join('; ')||'None'}, Successes=${(e.successes||[]).join('; ')||'None'}`).join('\n')}\n\nGenerate a longitudinal "Big Picture" profile. Respond with ONLY:\n{"overallTrajectory":"Accelerating|Steady|Plateauing|Declining","growthSummary":"2-3 sentence narrative of student journey","cpaProgression":{"concrete":0,"pictorial":0,"abstract":0,"transitioning":0},"persistentStrengths":["..."],"recurringMisconceptions":["..."],"semesterArc":"narrative of start→middle→now","predictedNextChallenge":"...","recommendedFocus":"...","readinessForNextModule":true,"confidenceIndex":75,"engagementTrend":"Improving|Stable|Declining","teacherRecommendations":["...","..."]}`
);

// ─── CSS ──────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#EEF2F7;--surf:#fff;--surf2:#F5F8FB;--bdr:#E1E8F0;--bdr2:#CBD5E0;
  --pri:#2A7AB5;--pril:#EBF4FF;--prid:#1B5C8C;--pri2:#E0F0FF;
  --acc:#7B6EE7;--accl:#F0EEFF;--accl2:#E4DFFF;
  --tx:#0D1A2B;--tx2:#4A5568;--tx3:#8FA0B3;--tx4:#B8C7D4;
  --ok:#15803D;--okl:#DCFCE7;--okl2:#BBF7D0;
  --warn:#B45309;--warnl:#FEF3C7;
  --err:#DC2626;--errl:#FEE2E2;
  --r:10px;--rl:16px;--rxl:22px;
  --sh:0 1px 3px rgba(0,0,0,.05),0 4px 18px rgba(0,0,0,.04);
  --shm:0 4px 20px rgba(0,0,0,.08),0 1px 4px rgba(0,0,0,.04);
  --fh:'DM Serif Display',serif;--fb:'DM Sans',sans-serif;
  --sbw:236px;
}
body{font-family:var(--fb);background:var(--bg);color:var(--tx);line-height:1.5}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes slideIn{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
.fu{animation:fadeUp .32s ease forwards}
.si{animation:slideIn .28s ease forwards}
.spin{animation:spin .7s linear infinite;display:inline-block}

/* Layout */
.shell{display:flex;min-height:100vh}
.sidebar{width:var(--sbw);background:var(--surf);border-right:1px solid var(--bdr);display:flex;flex-direction:column;position:fixed;top:0;left:0;height:100vh;z-index:100;transition:transform .22s ease}
.sidebar.closed{transform:translateX(calc(-1 * var(--sbw)))}
.main{flex:1;margin-left:var(--sbw);padding:28px 30px;min-height:100vh;transition:margin-left .22s ease;max-width:1200px}
.main.expanded{margin-left:0}

/* Sidebar */
.sbh{padding:16px 12px 13px;border-bottom:1px solid var(--bdr)}
.sblogo{display:flex;align-items:center;gap:9px}
.sbicon{width:34px;height:34px;background:linear-gradient(135deg,var(--pri),var(--prid));border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:18px;font-family:var(--fh);flex-shrink:0;box-shadow:0 2px 8px rgba(42,122,181,.3)}
.sbrand{font-family:var(--fh);font-size:13.5px;line-height:1.2}
.sbsub{font-size:9px;text-transform:uppercase;letter-spacing:.09em;color:var(--tx3);margin-top:2px}
.sbnav{flex:1;padding:8px 6px;overflow-y:auto}
.ni{display:flex;align-items:center;gap:9px;padding:8px 11px;border-radius:9px;cursor:pointer;transition:all .12s;font-size:13px;font-weight:500;color:var(--tx2);border:none;background:none;width:100%;text-align:left;margin-bottom:1px;font-family:var(--fb)}
.ni:hover{background:var(--pril);color:var(--pri)}
.ni.on{background:var(--pril);color:var(--pri);font-weight:650}
.ni.off{opacity:.35;pointer-events:none}
.nisep{height:1px;background:var(--bdr);margin:7px 5px}
.sbft{padding:9px 6px 11px;border-top:1px solid var(--bdr)}
.ava{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--pril),var(--accl));color:var(--pri);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11.5px;flex-shrink:0;border:1.5px solid var(--bdr)}

/* Top bar (mobile) */
.topbar{display:none;position:fixed;top:0;left:0;right:0;height:52px;background:var(--surf);border-bottom:1px solid var(--bdr);z-index:99;padding:0 16px;align-items:center;gap:10px}
.topbar-title{font-family:var(--fh);font-size:15px;font-weight:600}

/* Cards */
.card{background:var(--surf);border:1px solid var(--bdr);border-radius:var(--rl);box-shadow:var(--sh);overflow:hidden}
.card:hover{box-shadow:var(--shm)}
.ch{padding:15px 20px 12px;border-bottom:1px solid var(--bdr)}
.cb{padding:18px 20px}
.ctitle{font-family:var(--fh);font-size:15.5px}
.cdesc{font-size:12px;color:var(--tx3);margin-top:3px}

/* Buttons */
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all .13s;font-family:var(--fb);white-space:nowrap;justify-content:center}
.bpri{background:var(--pri);color:#fff}.bpri:hover{background:var(--prid);transform:translateY(-1px);box-shadow:0 3px 10px rgba(42,122,181,.3)}
.bout{background:#fff;border:1.5px solid var(--bdr);color:var(--tx)}.bout:hover{border-color:var(--pri);color:var(--pri)}
.bout-acc{background:#fff;border:1.5px solid var(--accl2);color:var(--acc)}.bout-acc:hover{background:var(--accl)}
.bghost{background:transparent;color:var(--tx2)}.bghost:hover{background:var(--bg)}
.berr{background:var(--err);color:#fff}.berr:hover{filter:brightness(.9)}
.bacc{background:var(--acc);color:#fff}.bacc:hover{filter:brightness(.9);transform:translateY(-1px)}
.bok{background:var(--ok);color:#fff}.bok:hover{filter:brightness(.9)}
.bwarn{background:var(--warn);color:#fff}.bwarn:hover{filter:brightness(.9)}
.bsm{padding:5px 11px;font-size:12px}
.blg{padding:10px 22px;font-size:14px}
.btn:disabled{opacity:.42;cursor:not-allowed;pointer-events:none;transform:none!important;box-shadow:none!important}
.bico{padding:6px;border-radius:8px}

/* Inputs */
.inp{width:100%;padding:8px 12px;border:1.5px solid var(--bdr);border-radius:9px;font-size:13px;font-family:var(--fb);background:#fff;color:var(--tx);outline:none;transition:border-color .12s}
.inp:focus{border-color:var(--pri);box-shadow:0 0 0 3px rgba(42,122,181,.1)}
.inp:disabled{background:var(--surf2);color:var(--tx3)}
.textarea{resize:vertical;min-height:80px;line-height:1.5}
.ig{margin-bottom:13px}
.lbl{display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--tx3);margin-bottom:5px}
.sel{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7'%3E%3Cpath d='M1 1l4.5 4.5L10 1' stroke='%238FA0B3' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 11px center;padding-right:34px}

/* Badges */
.badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.bpri-b{background:var(--pril);color:var(--pri)}
.bacc-b{background:var(--accl);color:var(--acc)}
.bok-b{background:var(--okl);color:var(--ok)}
.berr-b{background:var(--errl);color:var(--err)}
.bwarn-b{background:var(--warnl);color:var(--warn)}
.bout-b{background:transparent;border:1.5px solid var(--bdr);color:var(--tx2)}
.bdark{background:var(--tx);color:#fff}

/* Progress */
.prog{height:5px;background:var(--bdr);border-radius:999px;overflow:hidden}
.progf{height:100%;background:linear-gradient(90deg,var(--pri),var(--acc));border-radius:999px;transition:width .6s cubic-bezier(.34,1.56,.64,1)}
.progf-ok{background:linear-gradient(90deg,#15803D,#10B981)}
.progf-warn{background:linear-gradient(90deg,#B45309,#F59E0B)}

/* Stats */
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px}
.sc{background:var(--surf);border:1px solid var(--bdr);border-radius:var(--rl);padding:16px;transition:box-shadow .12s}
.sc:hover{box-shadow:var(--shm)}
.sl{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--tx3);margin-bottom:8px}
.sv{font-size:23px;font-weight:700;line-height:1;color:var(--tx)}
.ss{font-size:11px;color:var(--tx3);margin-top:4px}

/* Table */
.tbl{width:100%;border-collapse:collapse}
.tbl th{padding:9px 12px;text-align:left;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--tx3);background:var(--surf2);border-bottom:1px solid var(--bdr)}
.tbl td{padding:10px 12px;border-top:1px solid var(--bdr);font-size:13px;vertical-align:middle}
.tbl tr:hover td{background:#FAFCFF}
.tbl tbody tr:last-child td{border-bottom:none}
.tw{overflow-x:auto}

/* Page header */
.ph{margin-bottom:22px}
.pheye{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.11em;color:var(--tx3);display:flex;align-items:center;gap:5px;margin-bottom:4px}
.phtitle{font-family:var(--fh);font-size:25px;color:var(--tx);line-height:1.2;margin-bottom:1px}
.phsub{font-size:12.5px;color:var(--tx3);margin-top:5px}

/* Misc layout */
.row{display:flex;align-items:center}.rowb{display:flex;align-items:center;justify-content:space-between}.rowt{display:flex;align-items:flex-start}
.col{display:flex;flex-direction:column}.colc{display:flex;flex-direction:column;align-items:center}
.g1{gap:4px}.g2{gap:8px}.g3{gap:12px}.g4{gap:16px}.g6{gap:24px}
.gr2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.gr3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.gr75{display:grid;grid-template-columns:3fr 2fr;gap:20px}
.gr25{display:grid;grid-template-columns:2fr 3fr;gap:20px}
.w100{width:100%}
.mt1{margin-top:4px}.mt2{margin-top:8px}.mt3{margin-top:12px}.mt4{margin-top:16px}.mt5{margin-top:20px}.mt6{margin-top:24px}
.mb1{margin-bottom:4px}.mb2{margin-bottom:8px}.mb3{margin-bottom:12px}.mb4{margin-bottom:16px}.mb5{margin-bottom:20px}
.p4{padding:16px}.p5{padding:20px}
.xs{font-size:11px}.sm{font-size:12.5px}.md{font-size:14px}.bold{font-weight:700}.med{font-weight:500}.semibold{font-weight:600}
.tc{color:var(--pri)}.ta{color:var(--acc)}.tm{color:var(--tx3)}.tok{color:var(--ok)}.terr{color:var(--err)}.twarn{color:var(--warn)}
.ital{font-style:italic}.trunc{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rnd{border-radius:var(--r)}.rndf{border-radius:999px}.rndfull{border-radius:var(--rl)}
.divider{height:1px;background:var(--bdr);margin:14px 0}
.sy4>*+*{margin-top:16px}.sy6>*+*{margin-top:24px}.sy3>*+*{margin-top:12px}
.tc-bg{text-align:center}

/* Login */
.loginwrap{min-height:100vh;background:linear-gradient(140deg,#EEF2F7 0%,#E2EBF7 50%,#EDE8FF 100%);display:flex;align-items:center;justify-content:center;padding:20px;position:relative;overflow:hidden}
.loginwrap::before{content:'';position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(42,122,181,.06),transparent);top:-200px;right:-100px}
.loginwrap::after{content:'';position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(123,110,231,.07),transparent);bottom:-100px;left:-50px}
.logincard{background:#fff;border-radius:22px;box-shadow:0 24px 80px rgba(0,0,0,.1);padding:40px 36px;width:100%;max-width:460px;position:relative;z-index:1}

/* Tabs */
.tabs{display:flex;gap:2px;background:var(--surf2);border-radius:10px;padding:3px;margin-bottom:18px;border:1px solid var(--bdr)}
.tab{flex:1;padding:7px 8px;border-radius:8px;font-size:12.5px;font-weight:600;cursor:pointer;border:none;background:none;color:var(--tx2);transition:all .13s;font-family:var(--fb)}
.tab.on{background:#fff;color:var(--pri);box-shadow:0 1px 5px rgba(0,0,0,.09)}

/* Slider */
.slider{-webkit-appearance:none;appearance:none;width:100%;height:5px;border-radius:999px;background:var(--bdr);outline:none}
.slider::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:var(--pri);cursor:pointer;box-shadow:0 2px 8px rgba(42,122,181,.4);transition:box-shadow .12s}
.slider::-webkit-slider-thumb:hover{box-shadow:0 2px 14px rgba(42,122,181,.5)}

/* Camera */
.cambox{aspect-ratio:4/3;border:2px dashed var(--bdr);border-radius:var(--rl);overflow:hidden;display:flex;align-items:center;justify-content:center;background:var(--surf2);transition:border-color .12s}
.cambox:hover{border-color:var(--bdr2)}
.cambox video,.cambox img{width:100%;height:100%;object-fit:cover}

/* Module block */
.modbk{display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-radius:var(--r);border:1.5px solid var(--bdr);background:#fff;margin-bottom:7px;transition:border-color .12s,box-shadow .12s}
.modbk:hover{box-shadow:0 2px 8px rgba(0,0,0,.05)}
.mnn{border-left:4px solid var(--pri)}
.mcore{border-left:4px solid var(--acc)}
.madapt{border-left:4px solid #10B981}

/* Modal */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.46);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(3px)}
.mbox{background:#fff;border-radius:20px;padding:26px;max-width:500px;width:100%;box-shadow:0 32px 80px rgba(0,0,0,.22);animation:scaleIn .22s ease}
.mbox-lg{max-width:680px}
.mbox-xl{max-width:820px}

/* Switch */
.sw{position:relative;display:inline-block;width:37px;height:20px;flex-shrink:0}
.sw input{opacity:0;width:0;height:0}
.swt{position:absolute;cursor:pointer;inset:0;background:var(--bdr2);border-radius:20px;transition:.25s}
.swt:before{content:'';position:absolute;height:14px;width:14px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.25s;box-shadow:0 1px 4px rgba(0,0,0,.15)}
input:checked+.swt{background:var(--pri)}
input:checked+.swt:before{transform:translateX(17px)}

/* Alert strip */
.astrip{padding:11px 14px;border-radius:var(--r);border:1.5px solid;font-size:13px;display:flex;align-items:flex-start;gap:9px;margin-bottom:13px;line-height:1.45}
.awarn{background:var(--warnl);border-color:#F59E0B;color:#92400E}
.aerr{background:var(--errl);border-color:#FCA5A5;color:#991B1B}
.aok{background:var(--okl);border-color:#86EFAC;color:#166534}
.ainfo{background:var(--pril);border-color:#93C5FD;color:#1E40AF}
.aacc{background:var(--accl);border-color:#A78BFA;color:#5B21B6}

/* Score ring */
.ring{width:60px;height:60px;flex-shrink:0}

/* Pupil card highlight */
.pupilcard{padding:11px 13px;border-radius:var(--r);border:1.5px solid var(--bdr);background:#fff;transition:all .13s;cursor:pointer}
.pupilcard:hover{border-color:var(--pri);background:var(--pril);box-shadow:0 2px 10px rgba(42,122,181,.1)}
.pupilcard.drift{border-color:var(--err);background:var(--errl)}

/* Responsive */
.sb-overlay{display:none}
.sb-close-btn{display:none}
@media(max-width:900px){
  .sb-overlay{display:block}
  .sb-close-btn{display:flex}
  .sidebar{transform:translateX(calc(-1 * var(--sbw)))}
  .sidebar.open{transform:translateX(0)}
  .main{margin-left:0!important;padding:70px 16px 24px}
  .topbar{display:flex}
  .gr2{grid-template-columns:1fr}
  .gr3{grid-template-columns:1fr}
  .gr75{grid-template-columns:1fr}
  .gr25{grid-template-columns:1fr}
  .stats{grid-template-columns:1fr 1fr}
}
@media(max-width:500px){
  .stats{grid-template-columns:1fr}
  .logincard{padding:28px 20px}
}
@media print{
  .sidebar,.topbar,.btn,.tabs{display:none!important}
  .main{margin-left:0!important;padding:10px}
  .card{box-shadow:none;border:1px solid #ccc}
  body{background:#fff}
}
`;

// ─── ICONS ────────────────────────────────────────────────────────────────
const P = {
  dashboard:  "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  planning:   "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  camera:     "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 17a4 4 0 100-8 4 4 0 000 8",
  mastery:    "M18 20V10M12 20V4M6 20v-6",
  curriculum: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8M16 17H8M10 9H8",
  inspection: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  reports:    "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z",
  admin:      "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z",
  account:    "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8",
  signout:    "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  plus:       "M12 5v14M5 12h14",
  trash:      "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2",
  save:       "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z M17 21v-8H7v8M7 3v5h8",
  check:      "M20 6L9 17l-5-5",
  alert:      "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4M12 17h.01",
  upload:     "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12",
  brain:      "M9.5 2A2.5 2.5 0 017 4.5v1A2.5 2.5 0 009.5 8h5A2.5 2.5 0 0017 5.5v-1A2.5 2.5 0 0014.5 2h-5z M9.5 16A2.5 2.5 0 017 18.5v1A2.5 2.5 0 009.5 22h5a2.5 2.5 0 002.5-2.5v-1A2.5 2.5 0 0014.5 16h-5z M2 9.5h20M2 14.5h20",
  shield:     "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  download:   "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  clock:      "M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2",
  layers:     "M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5",
  graduation: "M22 10v6M2 10l10-5 10 5-10 5-10-5z M6 12v5c3 3 9 3 12 0v-5",
  globe:      "M12 22a10 10 0 100-20 10 10 0 000 20z M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z",
  langs:      "M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6",
  history:    "M3 3v5h5M3.05 13A9 9 0 106 5.3L3 8",
  landmark:   "M3 22h18M6 18V11M10 18V11M14 18V11M18 18V11M12 2L2 7h20L12 2z",
  x:          "M18 6L6 18M6 6l12 12",
  lock:       "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z M7 11V7a5 5 0 0110 0v4",
  users:      "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  search:     "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0",
  mail:       "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
  menu:       "M3 12h18M3 6h18M3 18h18",
  note:       "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6M16 13H8M16 17H8M10 9H8",
  eye:        "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12a3 3 0 100-6 3 3 0 000 6",
  info:       "M12 22a10 10 0 100-20 10 10 0 000 20z M12 16v-4M12 8h.01",
  expand:     "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
  star:       "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  chart:      "M18 20V10M12 20V4M6 20v-6",
  sparkle:    "M12 3v1m0 16v1M4.22 4.22l.71.71m12.73 12.73l.71.71M1 12h1m20 0h1M4.22 19.78l.71-.71M18.36 5.64l.71-.71",
};

function Ic({ n, sz=16, color="currentColor", style={} }) {
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.85} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,...style}}>
      {(P[n]||"").split("M").filter(Boolean).map((seg,i) => <path key={i} d={"M"+seg}/>)}
    </svg>
  );
}
function Spinner({ sz=16 }) {
  return <svg className="spin" width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>;
}

// ─── SHARED SMALL COMPONENTS ──────────────────────────────────────────────
function Sw({ checked, onChange }) {
  return (
    <label className="sw">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}/>
      <span className="swt"/>
    </label>
  );
}

function Modal({ open, onClose, title, children, size="" }) {
  if (!open) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className={`mbox${size?" "+size:""}`} onClick={e => e.stopPropagation()}>
        <div className="rowb mb4">
          <h2 style={{fontFamily:"var(--fh)",fontSize:18}}>{title}</h2>
          <button className="btn bghost bico bsm" onClick={onClose}><Ic n="x" sz={14}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Confirm({ open, onClose, onConfirm, title, desc, danger=false }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p style={{fontSize:13,color:"var(--tx2)",marginBottom:20,lineHeight:1.6}}>{desc}</p>
      <div className="row g3" style={{justifyContent:"flex-end"}}>
        <button className="btn bout bsm" onClick={onClose}>Cancel</button>
        <button className={`btn bsm ${danger?"berr":"bpri"}`} onClick={() => { onConfirm(); onClose(); }}>Confirm</button>
      </div>
    </Modal>
  );
}

function ScoreRing({ score, size=52 }) {
  const r = 20, circ = 2*Math.PI*r;
  const pct = Math.max(0,Math.min(100,score||0));
  const col = pct>=75?"var(--ok)":pct>=50?"var(--warn)":"var(--err)";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{flexShrink:0}}>
      <circle cx={24} cy={24} r={r} fill="none" stroke="var(--bdr)" strokeWidth={4}/>
      <circle cx={24} cy={24} r={r} fill="none" stroke={col} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={circ*(1-pct/100)}
        strokeLinecap="round" transform="rotate(-90 24 24)" style={{transition:"stroke-dashoffset .7s ease"}}/>
      <text x={24} y={28} textAnchor="middle" fontSize={10} fontWeight={700} fill={col} fontFamily="var(--fb)">{pct}</text>
    </svg>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────
function Login({ onDone }) {
  const app = useApp();
  const { toast } = useToast();
  const [mode,    setMode]    = useState("login");
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({ email:"", password:"", firstName:"", lastName:"", jobTitle:"", schoolId:"", className:"", phone:"" });
  const set = (k,v) => setF(p => ({...p,[k]:v}));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        app.login(f.email.trim(), f.password);
      } else {
        if (!f.firstName||!f.lastName) throw new Error("Please enter your full name.");
        if (f.password.length < 6) throw new Error("Password must be at least 6 characters.");
        app.register({ email:f.email.trim(), password:f.password, firstName:f.firstName.trim(), lastName:f.lastName.trim(), jobTitle:f.jobTitle });
        if (f.schoolId && f.className) {
          const sc = WELSH_SCHOOLS.find(s=>s.id===f.schoolId);
          app.createClassroom({ name:f.className, schoolId:f.schoolId, schoolName:sc?.name, schoolLocation:sc?.location });
        }
      }
      onDone();
    } catch(err) {
      toast({ variant:"destructive", title:"Authentication Failed", description:err.message });
    } finally { setLoading(false); }
  };

  const demoLogin = () => {
    app.login("demo@mastery.wales","demo123");
    app.loadDemo();
    onDone();
  };

  return (
    <div className="loginwrap">
      <div className="logincard">
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:52,height:52,background:"linear-gradient(135deg,var(--pri),var(--acc))",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",boxShadow:"0 6px 20px rgba(42,122,181,.28)"}}>
            <span style={{color:"#fff",fontFamily:"var(--fh)",fontWeight:800,fontSize:24}}>M</span>
          </div>
          <h1 style={{fontFamily:"var(--fh)",fontSize:24,marginBottom:4}}>Mastery Companion</h1>
          <p className="tm sm">Dr. Yeap Ban Har's methodology · Curriculum for Wales</p>
        </div>

        <div className="tabs" style={{marginBottom:20}}>
          {[{id:"login",l:"Sign In"},{id:"register",l:"Create Account"}].map(x=>(
            <button key={x.id} className={`tab${mode===x.id?" on":""}`} onClick={()=>setMode(x.id)}>{x.l}</button>
          ))}
        </div>

        <form onSubmit={submit}>
          {mode==="register" && (
            <div className="gr2">
              <div className="ig"><label className="lbl">First Name *</label><input className="inp" required value={f.firstName} onChange={e=>set("firstName",e.target.value)} placeholder="e.g. Cerys"/></div>
              <div className="ig"><label className="lbl">Last Name *</label><input className="inp" required value={f.lastName} onChange={e=>set("lastName",e.target.value)} placeholder="e.g. Jones"/></div>
            </div>
          )}
          <div className="ig"><label className="lbl">Email Address *</label><input className="inp" type="email" required value={f.email} onChange={e=>set("email",e.target.value)} placeholder="your@school.wales"/></div>
          <div className="ig"><label className="lbl">Password *</label><input className="inp" type="password" required value={f.password} onChange={e=>set("password",e.target.value)} placeholder={mode==="login"?"Your password":"Min 6 characters"}/></div>
          {mode==="register" && (
            <>
              <div className="ig">
                <label className="lbl">Job Title</label>
                <select className="inp sel" value={f.jobTitle} onChange={e=>set("jobTitle",e.target.value)}>
                  <option value="">Select role…</option>
                  <option>Teacher</option><option>Management (Head / Deputy)</option><option>Classroom Assistant</option>
                </select>
              </div>
              <div className="divider"/>
              <p className="tm xs mb3" style={{lineHeight:1.5}}>Optional: link your school and classroom now, or do it later in Account Settings.</p>
              <div className="ig">
                <label className="lbl">School</label>
                <select className="inp sel" value={f.schoolId} onChange={e=>set("schoolId",e.target.value)}>
                  <option value="">Select school (optional)…</option>
                  {WELSH_SCHOOLS.map(s=><option key={s.id} value={s.id}>{s.name} – {s.location}</option>)}
                </select>
              </div>
              <div className="ig"><label className="lbl">Classroom Name</label><input className="inp" value={f.className} onChange={e=>set("className",e.target.value)} placeholder="e.g. Year 5 Maths – Set A"/></div>
            </>
          )}
          <button type="submit" className="btn bpri w100" style={{height:42,marginTop:4}} disabled={loading}>
            {loading ? <Spinner sz={14}/> : mode==="login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="divider" style={{margin:"18px 0"}}/>
        <button className="btn bout w100" style={{height:38}} onClick={demoLogin}>
          <Ic n="sparkle" sz={13} color="var(--acc)"/>
          <span style={{color:"var(--acc)",fontWeight:700}}>Try Sandbox Demo</span>
        </button>
        <p className="tm xs tc-bg mt2">Pre-loaded with 8 pupils, 3 lessons & 5 diagnostic entries</p>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────
function Sidebar({ page, go }) {
  const { user, logout, isAdmin, classroom, t, lang, toggleLang, sideOpen, setSideOpen } = useApp();
  const hasEnv = !!classroom || isAdmin;
  const initials = `${user?.firstName?.[0]||""}${user?.lastName?.[0]||""}`.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";

  const nav = [
    { id:"dashboard",  label:t("dashboard"),   ic:"dashboard",   always:true },
    { id:"planning",   label:t("planning"),     ic:"planning",    always:false },
    { id:"journal",    label:t("journal"),      ic:"camera",      always:false },
    { id:"mastery",    label:t("mastery"),      ic:"mastery",     always:false },
    { id:"profiles",   label:t("profiles")||"Big Picture",  ic:"brain",       always:false },
    { id:"curriculum", label:t("curriculum"),   ic:"curriculum",  always:false },
    { id:"inspection", label:t("inspection"),   ic:"inspection",  always:false },
    { id:"reports",    label:t("reports"),      ic:"reports",     always:false },
  ];

  return (
    <aside className={`sidebar${sideOpen?" open":""}`}>
      <div className="sbh">
        <div className="sblogo">
          <div className="sbicon">M</div>
          <div style={{flex:1}}>
            <div className="sbrand">Mastery Companion</div>
            <div className="sbsub">{t("methodologyFirst")}</div>
          </div>
          <button className="btn bghost bico sb-close-btn" style={{padding:4}} onClick={()=>setSideOpen(false)}><Ic n="x" sz={14}/></button>
        </div>
      </div>

      <nav className="sbnav">
        {nav.map(item => (
          <button key={item.id} className={`ni${page===item.id?" on":""}${!item.always&&!hasEnv?" off":""}`} onClick={()=>{go(item.id);setSideOpen(false);}}>
            <Ic n={item.ic} sz={15}/>{item.label}
          </button>
        ))}
        {isAdmin && (
          <>
            <div className="nisep"/>
            <button className={`ni${page==="admin"?" on":""}`} onClick={()=>{go("admin");setSideOpen(false);}} style={{color:"var(--err)"}}>
              <Ic n="admin" sz={15} color="var(--err)"/>Translation Admin
            </button>
          </>
        )}
      </nav>

      <div className="sbft">
        <button className="btn bout bsm w100 mb2" style={{fontSize:11}} onClick={toggleLang}>
          <Ic n="langs" sz={12}/>{lang==="en" ? "Switch to Cymraeg" : "Newid i Saesneg"}
        </button>
        <div className="divider" style={{margin:"6px 0"}}/>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 5px 6px"}}>
          <div className="ava">{initials}</div>
          <div style={{flex:1,minWidth:0}}>
            <div className="trunc bold sm">{user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email}</div>
            <div className="trunc tm xs">{isAdmin ? "Site Administrator" : (user?.jobTitle||"Teacher")}</div>
          </div>
        </div>
        <div className="row g1">
          <button className="ni" style={{flex:1,padding:"6px 9px",fontSize:12}} onClick={()=>go("account")}><Ic n="account" sz={13}/>Account</button>
          <button className="ni" style={{flex:1,padding:"6px 9px",fontSize:12,color:"var(--err)"}} onClick={logout}><Ic n="signout" sz={13}/>{t("signOut")}</button>
        </div>
      </div>
    </aside>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────
function Dashboard({ go }) {
  const { classroom, students, lessons, entries, isAdmin, t } = useApp();
  const active = lessons.find(l => l.status === "InProgress");
  const atRisk = students.filter(s => entries.some(e => e.studentId===s.id && e.paceStatus==="At Risk")).length;
  const avgScore = entries.length ? Math.round(entries.reduce((a,e)=>a+e.reasoningScore,0)/entries.length) : 0;

  // CPA distribution
  const cpaDist = ["Concrete","Pictorial","Transitioning","Abstract"].map(c=>({
    label:c, count:entries.filter(e=>e.cpaDetected===c).length,
    color:c==="Concrete"?"var(--err)":c==="Pictorial"?"var(--warn)":c==="Transitioning"?"var(--acc)":"var(--ok)"
  }));

  if (!classroom && !isAdmin) return (
    <div className="fu">
      <div className="tc-bg" style={{padding:"60px 0 40px"}}>
        <div style={{width:66,height:66,background:"linear-gradient(135deg,var(--pri),var(--acc))",borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:"0 8px 24px rgba(42,122,181,.25)"}}>
          <Ic n="graduation" sz={34} color="#fff"/>
        </div>
        <h1 style={{fontFamily:"var(--fh)",fontSize:28,marginBottom:10}}>{t("welcome")}</h1>
        <p style={{color:"var(--tx2)",maxWidth:480,margin:"0 auto 24px",lineHeight:1.7,fontSize:13.5}}>
          Empowering Welsh teachers to deliver Dr. Yeap Ban Har's world-renowned mastery methodology with AI diagnostics and automated Estyn compliance.
        </p>
        <button className="btn bpri blg" onClick={()=>go("account")}>Set Up Your Environment <Ic n="graduation" sz={16}/></button>
      </div>
      <div className="gr3" style={{marginTop:8}}>
        {[
          {ic:"layers",    title:"CPA Framework",  desc:"Concrete-Pictorial-Abstract integrity is built into every lesson plan and diagnostic.", c:"var(--acc)"},
          {ic:"brain",     title:"AI Diagnostics", desc:"Capture pupil journal photos and get instant methodology-locked AI analysis.", c:"var(--pri)"},
          {ic:"inspection",title:"Estyn Ready",    desc:"Automated evidence mapping to all 5 Mathematical Proficiencies in Curriculum for Wales.", c:"var(--ok)"},
        ].map(item => (
          <div key={item.title} className="card" style={{padding:20}}>
            <div style={{width:42,height:42,borderRadius:12,background:item.c+"1A",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}}>
              <Ic n={item.ic} sz={21} color={item.c}/>
            </div>
            <div style={{fontFamily:"var(--fh)",fontSize:15.5,marginBottom:6}}>{item.title}</div>
            <p className="tm sm" style={{lineHeight:1.6}}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fu">
      <div className="rowb mb4" style={{marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div>
          <div className="pheye"><Ic n="graduation" sz={12}/>Active Environment</div>
          <h1 className="phtitle">{classroom?.name || "Dashboard"}</h1>
          <p className="phsub ital">{classroom?.schoolName} · {t("methodologyFirst")}</p>
        </div>
        <div className="row g2">
          <button className="btn bout bsm" onClick={()=>go("planning")}><Ic n="clock" sz={13}/>Plan Lesson</button>
          <button className="btn bpri bsm" onClick={()=>go("journal")}><Ic n="camera" sz={13}/>New Diagnostic</button>
        </div>
      </div>

      <div className="stats">
        {[
          {l:"Pupils Enrolled",v:students.length,        s:"In current class",  ic:"users",      c:"var(--pri)"},
          {l:"Avg Reasoning",  v:avgScore?`${avgScore}%`:"—", s:"Across all entries",ic:"brain",  c:"var(--acc)"},
          {l:"At-Risk Pupils", v:atRisk,                  s:"Need intervention", ic:"alert",      c:atRisk>0?"var(--err)":"var(--tx3)"},
          {l:"Evidence Logs",  v:entries.length,          s:"Approved this term",ic:"curriculum", c:"var(--ok)"},
        ].map(s => (
          <div key={s.l} className="sc">
            <div className="rowb mb2"><span className="sl">{s.l}</span><Ic n={s.ic} sz={14} color={s.c}/></div>
            <div className="sv" style={{color:s.c==="var(--err)"&&s.v>0?"var(--err)":undefined}}>{s.v}</div>
            <div className="ss">{s.s}</div>
          </div>
        ))}
      </div>

      <div className="gr2" style={{gap:16,marginBottom:16}}>
        {/* Active Lesson */}
        <div className="card">
          <div className="ch rowb">
            <div>
              <div className="ctitle" style={{fontSize:15,display:"flex",alignItems:"center",gap:6}}><Ic n="clock" sz={14} color="var(--pri)"/>Active Lesson</div>
              <div className="cdesc">{active ? active.title : "No lesson in progress"}</div>
            </div>
            {active && <span className="badge bpri-b">Live</span>}
          </div>
          <div className="cb">
            {active ? (
              <div className="sy3">
                <div style={{padding:"12px 14px",background:"var(--pril)",borderRadius:"var(--r)",border:"1px solid var(--pri2)"}}>
                  <div className="row g3 mb2">
                    <Ic n="layers" sz={16} color="var(--pri)"/>
                    <span className="bold sm">{active.title}</span>
                    <span className="badge bpri-b" style={{marginLeft:"auto"}}>{active.duration}m</span>
                  </div>
                  {active.notes && <p className="tm xs" style={{lineHeight:1.5}}>{active.notes}</p>}
                </div>
                {LESSON_DEFS.map(m => (
                  <div key={m.id} className="row g3" style={{padding:"7px 10px",borderRadius:8,background:"var(--surf2)",border:"1px solid var(--bdr)"}}>
                    <div style={{width:3,height:28,borderRadius:2,background:m.type==="Non-Negotiable"?"var(--pri)":m.type==="Core"?"var(--acc)":"#10B981",flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div className="trunc sm bold">{m.label}</div>
                      <span className="badge bout-b mt1" style={{fontSize:9}}>{m.cpa}</span>
                    </div>
                  </div>
                ))}
                <button className="btn bghost w100 sm" onClick={()=>go("planning")}>View Full Architecture →</button>
              </div>
            ) : (
              <div className="tc-bg" style={{padding:"24px 0"}}>
                <Ic n="clock" sz={28} color="var(--tx4)" style={{display:"block",margin:"0 auto 10px"}}/>
                <p className="tm sm mb3">No active lesson. Start one from Lesson Planning.</p>
                <button className="btn bpri bsm" onClick={()=>go("planning")}>Plan a Lesson</button>
              </div>
            )}
          </div>
        </div>

        {/* CPA Distribution */}
        <div className="card">
          <div className="ch">
            <div className="ctitle" style={{fontSize:15,display:"flex",alignItems:"center",gap:6}}><Ic n="chart" sz={14} color="var(--acc)"/>CPA Evidence Spread</div>
            <div className="cdesc">Distribution across {entries.length} diagnostic entries</div>
          </div>
          <div className="cb">
            {entries.length === 0 ? (
              <div className="tc-bg" style={{padding:"24px 0"}}>
                <Ic n="layers" sz={28} color="var(--tx4)" style={{display:"block",margin:"0 auto 10px"}}/>
                <p className="tm sm">Capture journal diagnostics to see CPA distribution.</p>
              </div>
            ) : (
              <div className="sy3">
                {cpaDist.map(c => (
                  <div key={c.label}>
                    <div className="rowb mb1">
                      <span className="sm bold">{c.label}</span>
                      <span style={{fontSize:11,fontWeight:700,color:c.color}}>{c.count} entries</span>
                    </div>
                    <div className="prog">
                      <div style={{height:"100%",width:`${entries.length?Math.round(c.count/entries.length*100):0}%`,background:c.color,borderRadius:999,transition:"width .6s ease"}}/>
                    </div>
                  </div>
                ))}
                <button className="btn bghost w100 sm mt2" onClick={()=>go("curriculum")}>View Curriculum Alignment →</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pupil snapshot */}
      <div className="card">
        <div className="ch rowb">
          <div>
            <div className="ctitle" style={{fontSize:15,display:"flex",alignItems:"center",gap:6}}><Ic n="users" sz={14} color="var(--acc)"/>Pupil Snapshot</div>
            <div className="cdesc">{students.length} pupils enrolled · {atRisk} flagged at risk</div>
          </div>
          <button className="btn bout bsm" onClick={()=>go("mastery")}>View All</button>
        </div>
        <div className="cb">
          {students.length === 0 ? (
            <p className="tm sm tc-bg" style={{padding:"10px 0"}}>Add pupils in Mastery Tracking to see them here.</p>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:9}}>
              {students.slice(0,8).map(s => {
                const latestEntry = entries.filter(e=>e.studentId===s.id)[0];
                const risk = latestEntry?.paceStatus==="At Risk" || latestEntry?.paceStatus==="Drifting";
                return (
                  <div key={s.id} className={`pupilcard${risk?" drift":""}`}>
                    <div className="row g2 mb1">
                      <div style={{width:26,height:26,borderRadius:"50%",background:risk?"var(--errl)":"var(--accl)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:risk?"var(--err)":"var(--acc)",flexShrink:0}}>
                        {s.firstName[0]}{s.lastName[0]}
                      </div>
                      <span className="trunc bold sm">{s.firstName} {s.lastName}</span>
                    </div>
                    <div className="row g2 mt1">
                      <span className="badge bout-b" style={{fontSize:8}}>M{(s.moduleIdx||0)+1}/{CPA_MODULES.length}</span>
                      {latestEntry && <span className={`badge ${latestEntry.paceStatus==="On Track"?"bok-b":"berr-b"}`} style={{fontSize:8}}>{latestEntry.paceStatus}</span>}
                    </div>
                  </div>
                );
              })}
              {students.length>8 && <div className="pupilcard tc-bg" style={{display:"flex",alignItems:"center",justifyContent:"center",color:"var(--tx3)",fontSize:12}}>+{students.length-8} more</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LESSON PLANNING ──────────────────────────────────────────────────────
function Planning() {
  const { lessons, addLesson, updateLesson, deleteLesson, classroom } = useApp();
  const { toast } = useToast();
  const [dur,      setDur]      = useState(45);
  const [title,    setTitle]    = useState(`Lesson: ${new Date().toLocaleDateString("en-GB")}`);
  const [notes,    setNotes]    = useState("");
  const [saving,   setSaving]   = useState(false);
  const [delId,    setDelId]    = useState(null);
  const [editNotes,setEditNotes]= useState(null); // lessonId being note-edited
  const [editNoteTxt,setEditNoteTxt]=useState("");
  const [noteOpen, setNoteOpen] = useState(null); // lesson detail view

  const calc = (mod) => {
    const base = LESSON_DEFS.reduce((a,m) => a+m.ideal, 0);
    return mod.type === "Non-Negotiable"
      ? Math.max(mod.min, Math.floor(mod.ideal * Math.max(0.9, dur/base)))
      : Math.max(mod.min, Math.floor(mod.ideal * (dur/base)));
  };
  const total = LESSON_DEFS.reduce((a,m) => a+calc(m), 0);
  const typeC = {"Non-Negotiable":"var(--pri)","Core":"var(--acc)","Adaptable":"#10B981"};
  const typeCls = {"Non-Negotiable":"mnn","Core":"mcore","Adaptable":"madapt"};

  const applyTemplate = (tpl) => { setTitle(tpl.name); setDur(tpl.duration); };

  const create = () => {
    if (!title.trim()) return;
    setSaving(true);
    addLesson({ title:title.trim(), duration:dur, notes, modules: LESSON_DEFS.map(m=>({...m,allocated:calc(m)})) });
    toast({ title:"Lesson Planned", description:`"${title}" saved to archive.` });
    setNotes(""); setSaving(false);
  };

  const activate = (id) => {
    const cur = lessons.find(l=>l.status==="InProgress");
    if (cur) updateLesson(cur.id,{status:"Planned"});
    updateLesson(id,{status:"InProgress"});
    toast({ title:"Lesson Activated", description:"Previous lesson moved back to Planned." });
  };
  const complete = (id) => { updateLesson(id,{status:"Completed"}); toast({ title:"Lesson Marked Complete" }); };

  const saveNote = () => {
    updateLesson(editNotes, { notes:editNoteTxt });
    toast({ title:"Notes Saved" });
    setEditNotes(null);
  };

  const viewLesson = lessons.find(l=>l.id===noteOpen);

  return (
    <div className="fu">
      <div className="ph">
        <div className="pheye"><Ic n="planning" sz={12}/>Lesson Architecture</div>
        <h1 className="phtitle">Dynamic Lesson Planner</h1>
        <p className="phsub">Ban Har's methodology with real-time CPA timing recalibration</p>
      </div>

      <div className="gr2" style={{gap:20,alignItems:"start"}}>
        <div>
          <div className="card mb4">
            <div className="ch"><div className="ctitle" style={{fontSize:15}}>New Lesson</div><div className="cdesc">Auto-distribute module time based on total duration</div></div>
            <div className="cb">
              {/* Templates */}
              <div className="ig">
                <label className="lbl">Topic Templates</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {LESSON_TEMPLATES.map(tpl=>(
                    <button key={tpl.name} className="btn bout bsm" style={{fontSize:11,padding:"4px 9px"}} onClick={()=>applyTemplate(tpl)}>{tpl.name}</button>
                  ))}
                </div>
              </div>
              <div className="ig"><label className="lbl">Lesson Title *</label><input className="inp" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Number Bonds to 20"/></div>
              <div className="ig">
                <label className="lbl">Duration: <span className="tc bold">{dur} minutes</span></label>
                <input type="range" className="slider" min={30} max={90} step={5} value={dur} onChange={e=>setDur(+e.target.value)}/>
                <div className="rowb mt1 xs tm"><span>30m</span><span>45m</span><span>60m</span><span>75m</span><span>90m</span></div>
              </div>
              <div className="ig">
                <label className="lbl">Lesson Notes (optional)</label>
                <textarea className="inp textarea" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Key resources, grouping strategies, differentiation notes…" style={{minHeight:72}}/>
              </div>
              <div style={{background:total<=dur?"var(--okl)":"var(--warnl)",borderRadius:"var(--r)",padding:"9px 13px",fontSize:13,marginBottom:13,color:total<=dur?"var(--ok)":"var(--warn)",fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                <Ic n={total<=dur?"check":"alert"} sz={13}/>
                {total}m across {LESSON_DEFS.length} modules{total>dur?` · ${total-dur}m over budget`:" · Balanced"}
              </div>
              <button className="btn bpri w100" style={{height:40}} onClick={create} disabled={saving||!classroom||!title.trim()}>
                {saving ? <Spinner sz={13}/> : <Ic n="save" sz={13}/>} Save Lesson Plan
              </button>
              {!classroom && <p className="tm xs tc-bg mt2">Link your school in Account → Organisation first.</p>}
            </div>
          </div>

          <div className="card">
            <div className="ch"><div className="ctitle" style={{fontSize:14.5}}>CPA Module Breakdown</div><div className="cdesc">Methodology-protected component sequence</div></div>
            <div className="cb">
              {LESSON_DEFS.map(mod => (
                <div key={mod.id} className={`modbk ${typeCls[mod.type]}`}>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="trunc bold sm">{mod.label}</div>
                    <div className="row g2 mt1">
                      <span className="badge bout-b" style={{fontSize:9}}>{mod.cpa}</span>
                      <span className="badge" style={{fontSize:9,background:typeC[mod.type]+"18",color:typeC[mod.type]}}>{mod.type}</span>
                    </div>
                  </div>
                  <div style={{textAlign:"right",marginLeft:12}}>
                    <div style={{fontWeight:800,fontSize:20,color:typeC[mod.type],lineHeight:1}}>{calc(mod)}<span style={{fontSize:10,fontWeight:500,opacity:.6}}>m</span></div>
                    <div className="tm xs">min {mod.min}m</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="ch">
            <div className="ctitle" style={{fontSize:15}}>Lesson Archive</div>
            <div className="cdesc">{lessons.length} lesson plans · {lessons.filter(l=>l.status==="Completed").length} completed</div>
          </div>
          {lessons.length === 0 ? (
            <div className="tc-bg" style={{padding:"44px 20px"}}>
              <Ic n="clock" sz={30} color="var(--tx4)" style={{display:"block",margin:"0 auto 10px"}}/>
              <p className="tm sm">No lessons yet. Create one to get started.</p>
            </div>
          ) : lessons.map(l => (
            <div key={l.id} style={{padding:"11px 17px",borderTop:"1px solid var(--bdr)"}}>
              <div className="rowb" style={{gap:8,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div className="trunc bold sm">{l.title}</div>
                  <div className="row g2 mt1">
                    <span className="tm xs">{l.duration}m</span>
                    <span className="tm xs">·</span>
                    <span className={`badge ${l.status==="InProgress"?"bpri-b":l.status==="Completed"?"bok-b":"bout-b"}`} style={{fontSize:9}}>{l.status}</span>
                    <span className="tm xs">· {new Date(l.createdAt).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</span>
                  </div>
                  {l.notes && <p className="tm xs mt1 trunc" style={{maxWidth:200}}>{l.notes}</p>}
                </div>
                <div className="row g1">
                  <button className="btn bghost bico bsm" title="View / edit notes" onClick={()=>{setNoteOpen(l.id);}}><Ic n="note" sz={13} color="var(--tx3)"/></button>
                  {l.status==="Planned"    && <button className="btn bpri bsm" onClick={()=>activate(l.id)}>Activate</button>}
                  {l.status==="InProgress" && <button className="btn bout bsm" onClick={()=>complete(l.id)}>Complete</button>}
                  <button className="btn bghost bico bsm" onClick={()=>setDelId(l.id)}><Ic n="trash" sz={13} color="var(--err)"/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lesson detail modal */}
      {viewLesson && (
        <Modal open={true} onClose={()=>setNoteOpen(null)} title={viewLesson.title} size="mbox-lg">
          <div className="sy4">
            <div className="gr2">
              <div style={{padding:"11px 14px",borderRadius:"var(--r)",background:"var(--pril)",border:"1px solid var(--pri2)"}}>
                <div className="lbl">Duration</div><div className="bold">{viewLesson.duration} minutes</div>
              </div>
              <div style={{padding:"11px 14px",borderRadius:"var(--r)",background:viewLesson.status==="InProgress"?"var(--pril)":viewLesson.status==="Completed"?"var(--okl)":"var(--surf2)",border:"1px solid var(--bdr)"}}>
                <div className="lbl">Status</div><div className="bold">{viewLesson.status}</div>
              </div>
            </div>
            <div>
              <label className="lbl mb2">Lesson Notes</label>
              {editNotes===viewLesson.id ? (
                <>
                  <textarea className="inp textarea w100" value={editNoteTxt} onChange={e=>setEditNoteTxt(e.target.value)} style={{minHeight:100}}/>
                  <div className="row g2 mt2" style={{justifyContent:"flex-end"}}>
                    <button className="btn bout bsm" onClick={()=>setEditNotes(null)}>Cancel</button>
                    <button className="btn bpri bsm" onClick={saveNote}><Ic n="save" sz={12}/>Save</button>
                  </div>
                </>
              ) : (
                <div style={{padding:"11px 14px",borderRadius:"var(--r)",background:"var(--surf2)",border:"1px solid var(--bdr)",minHeight:60,fontSize:13,color:viewLesson.notes?"var(--tx)":"var(--tx3)"}}>
                  {viewLesson.notes || "No notes added yet."}
                  <button className="btn bghost bsm" style={{display:"block",marginTop:8}} onClick={()=>{setEditNotes(viewLesson.id);setEditNoteTxt(viewLesson.notes||"");}}>Edit Notes</button>
                </div>
              )}
            </div>
            <div>
              <div className="lbl mb2">Module Breakdown</div>
              {LESSON_DEFS.map(m=>{
                const alloc = viewLesson.modules?.find(x=>x.id===m.id)?.allocated||m.ideal;
                return (
                  <div key={m.id} className="rowb" style={{padding:"8px 12px",borderRadius:8,border:"1px solid var(--bdr)",marginBottom:6,background:"#fff"}}>
                    <div className="row g3">
                      <div style={{width:3,height:22,borderRadius:2,background:m.type==="Non-Negotiable"?"var(--pri)":m.type==="Core"?"var(--acc)":"#10B981"}}/>
                      <span className="sm bold">{m.label}</span>
                      <span className="badge bout-b" style={{fontSize:9}}>{m.cpa}</span>
                    </div>
                    <span style={{fontWeight:700,color:"var(--pri)"}}>{alloc}m</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      <Confirm open={!!delId} onClose={()=>setDelId(null)} onConfirm={()=>deleteLesson(delId)} title="Delete Lesson?" desc="This will permanently remove this lesson plan and all its notes." danger/>
    </div>
  );
}

// ─── LOG TAB COMPONENT ───────────────────────────────────────────────────────
function LogTab({ entries, students, setViewEntry, setDelId }) {
  const [search, setSearch] = useState("");
  const [filterCpa, setFilterCpa] = useState("all");
  const [filterPace, setFilterPace] = useState("all");

  const filtered = entries.filter(e => {
    const matchSearch = !search || 
      e.studentName.toLowerCase().includes(search.toLowerCase()) ||
      e.lessonTitle.toLowerCase().includes(search.toLowerCase()) ||
      (e.methodUsed||"").toLowerCase().includes(search.toLowerCase());
    const matchCpa = filterCpa==="all" || e.cpaDetected===filterCpa;
    const matchPace = filterPace==="all" || e.paceStatus===filterPace;
    return matchSearch && matchCpa && matchPace;
  });

  if (entries.length === 0) return (
    <div className="card tc-bg" style={{padding:"60px 20px"}}>
      <Ic n="curriculum" sz={30} color="var(--tx4)" style={{display:"block",margin:"0 auto 12px"}}/>
      <p className="tm sm mb3">No approved diagnostics yet.</p>
    </div>
  );

  return (
    <div className="card">
      <div className="ch">
        <div className="rowb" style={{flexWrap:"wrap",gap:10}}>
          <div><div className="ctitle" style={{fontSize:15}}>Evidence Log</div><div className="cdesc">{filtered.length} of {entries.length} entries</div></div>
          <div className="row g2" style={{flexWrap:"wrap"}}>
            <div style={{position:"relative"}}>
              <Ic n="search" sz={13} color="var(--tx3)" style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)"}}/>
              <input className="inp" style={{paddingLeft:28,width:160,fontSize:12.5}} placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <select className="inp sel" style={{width:"auto",fontSize:12,padding:"5px 28px 5px 9px",height:"auto"}} value={filterCpa} onChange={e=>setFilterCpa(e.target.value)}>
              <option value="all">All CPA</option>
              {["Concrete","Pictorial","Transitioning","Abstract"].map(c=><option key={c}>{c}</option>)}
            </select>
            <select className="inp sel" style={{width:"auto",fontSize:12,padding:"5px 28px 5px 9px",height:"auto"}} value={filterPace} onChange={e=>setFilterPace(e.target.value)}>
              <option value="all">All Pace</option>
              {["On Track","At Risk","Drifting"].map(p=><option key={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="tw">
        <table className="tbl">
          <thead><tr><th>Pupil</th><th>Lesson</th><th>CPA</th><th>Score</th><th>Pace</th><th>Date</th><th style={{textAlign:"right"}}>Actions</th></tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="tc-bg tm" style={{padding:"30px 16px"}}>No entries match your filters.</td></tr>
            ) : filtered.map(e=>(
              <tr key={e.id}>
                <td className="bold sm">{e.studentName}</td>
                <td className="trunc tm" style={{fontSize:12,maxWidth:130}}>{e.lessonTitle}</td>
                <td><span className="badge bacc-b" style={{fontSize:9}}>{e.cpaDetected}</span></td>
                <td><ScoreRing score={e.reasoningScore} size={34}/></td>
                <td><span className={`badge ${e.paceStatus==="On Track"?"bok-b":e.paceStatus==="Drifting"?"berr-b":"bwarn-b"}`} style={{fontSize:9}}>{e.paceStatus}</span></td>
                <td className="tm xs">{new Date(e.captureDate).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</td>
                <td style={{textAlign:"right"}}>
                  <div className="row g1" style={{justifyContent:"flex-end"}}>
                    <button className="btn bghost bico bsm" title="View details" onClick={()=>setViewEntry(e)}><Ic n="eye" sz={13} color="var(--pri)"/></button>
                    <button className="btn bghost bico bsm" onClick={()=>setDelId(e.id)}><Ic n="trash" sz={13} color="var(--err)"/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PUPIL NOTES EDITOR ───────────────────────────────────────────────────────
function PupilNotesEditor({ pupil, updateStudent, toast }) {
  const [editing, setEditing] = useState(false);
  const [txt, setTxt] = useState(pupil.notes||"");

  const save = () => {
    updateStudent(pupil.id, { notes: txt });
    toast({ title:"Notes Saved", description:`Notes updated for ${pupil.firstName}.` });
    setEditing(false);
  };

  if (editing) return (
    <div>
      <textarea className="inp textarea w100" value={txt} onChange={e=>setTxt(e.target.value)} style={{minHeight:90,fontSize:13}} placeholder="Teaching observations, learning style notes, interventions tried…"/>
      <div className="row g2 mt2">
        <button className="btn bpri bsm" onClick={save}><Ic n="save" sz={12}/>Save Notes</button>
        <button className="btn bghost bsm" onClick={()=>{setEditing(false);setTxt(pupil.notes||"");}}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div style={{padding:"10px 13px",borderRadius:"var(--r)",background:"var(--surf2)",border:"1px solid var(--bdr)",minHeight:52,fontSize:13,lineHeight:1.6,color:txt?"var(--tx)":"var(--tx3)"}}>
      {txt || "No notes yet."}
      <button className="btn bghost bsm" style={{display:"block",marginTop:6}} onClick={()=>setEditing(true)}>
        <Ic n="note" sz={11}/>{txt?"Edit":"Add"} Notes
      </button>
    </div>
  );
}

// ─── JOURNAL ──────────────────────────────────────────────────────────────
// ─── JOURNAL ──────────────────────────────────────────────────────────────
function Journal() {
  const { students, lessons, entries, addEntry, deleteEntry, classroom } = useApp();
  const { toast } = useToast();
  const [tab,         setTab]         = useState("capture");
  // Single capture state
  const [selLesson,   setSelLesson]   = useState("");
  const [selStudent,  setSelStudent]  = useState("");
  const [img,         setImg]         = useState(null);
  const [b64,         setB64]         = useState(null);
  const [mime,        setMime]        = useState("image/jpeg");
  const [analyzing,   setAnalyzing]   = useState(false);
  const [result,      setResult]      = useState(null);
  const [editResult,  setEditResult]  = useState(null); // editable copy of AI result
  const [camOn,       setCamOn]       = useState(false);
  // Bulk queue state
  const [queue,       setQueue]       = useState([]); // [{id, file, b64, mime, img, studentId, status, result, editResult}]
  const [qLesson,     setQLesson]     = useState("");
  const [bulkAnalyzing,setBulkAnalyzing]=useState(false);
  const [bulkIdx,     setBulkIdx]     = useState(null); // index being reviewed
  // Log state
  const [viewEntry,   setViewEntry]   = useState(null);
  const [delId,       setDelId]       = useState(null);
  const vid = useRef(null); const can = useRef(null);

  useEffect(() => () => { vid.current?.srcObject?.getTracks().forEach(t=>t.stop()); }, []);

  // ── Camera helpers ──
  const startCam = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"environment" } });
      setCamOn(true);
      setTimeout(()=>{ if(vid.current) vid.current.srcObject = s; }, 50);
    } catch { toast({ variant:"destructive", title:"Camera Denied", description:"Allow camera access in your browser settings." }); }
  };
  const stopCam = () => { vid.current?.srcObject?.getTracks().forEach(t=>t.stop()); setCamOn(false); };
  const snap = () => {
    if (!vid.current||!can.current) return;
    const v=vid.current, c=can.current;
    c.width=v.videoWidth; c.height=v.videoHeight;
    c.getContext("2d").drawImage(v,0,0);
    const url=c.toDataURL("image/jpeg",0.92);
    setImg(url); setB64(url.split(",")[1]); setMime("image/jpeg"); setResult(null); setEditResult(null); stopCam();
  };
  const onFile = e => {
    const f=e.target.files?.[0]; if(!f) return;
    const r=new FileReader();
    r.onload=()=>{ setImg(r.result); setB64(r.result.split(",")[1]); setMime(f.type||"image/jpeg"); setResult(null); setEditResult(null); };
    r.readAsDataURL(f);
  };

  // ── Single analyse ──
  const run = async () => {
    if (!b64||!selLesson) return;
    const lesson=lessons.find(l=>l.id===selLesson);
    setAnalyzing(true);
    try {
      const out = await analyzeJournal({ b64, mime, lessonCtx:lesson?.title||"Lesson", cpa:"Pictorial" });
      setResult(out);
      setEditResult({ ...out,
        cpaStageDetected: out.cpaStageDetected,
        paceStatus: out.paceStatus,
        reasoningDepthScore: out.reasoningDepthScore,
        methodUsed: out.methodUsed,
        transcription: out.transcription,
        misconceptionPatterns: (out.misconceptionPatterns||[]).join("\n"),
        successIndicators: (out.successIndicators||[]).join("\n"),
        suggestedInstructionalNextStep: out.suggestedInstructionalNextStep,
      });
    } catch(err) {
      toast({ variant:"destructive", title:"Analysis Failed", description:err.message });
    } finally { setAnalyzing(false); }
  };

  const approve = () => {
    if (!selStudent) { toast({ variant:"destructive", title:"Select a pupil first" }); return; }
    const s=students.find(x=>x.id===selStudent);
    const r = editResult || result;
    addEntry({
      studentId:selStudent, studentName:`${s.firstName} ${s.lastName}`,
      lessonId:selLesson, lessonTitle:lessons.find(l=>l.id===selLesson)?.title||"",
      cpaDetected:r.cpaStageDetected, paceStatus:r.paceStatus,
      reasoningScore:Number(r.reasoningDepthScore)||0, methodUsed:r.methodUsed,
      misconceptions: typeof r.misconceptionPatterns==="string" ? r.misconceptionPatterns.split("\n").filter(Boolean) : r.misconceptionPatterns||[],
      successes: typeof r.successIndicators==="string" ? r.successIndicators.split("\n").filter(Boolean) : r.successIndicators||[],
      nextStep:r.suggestedInstructionalNextStep, transcription:r.transcription,
      sentimentIndicators:result?.sentimentIndicators||{},
      lessonObjectivesMet:result?.lessonObjectivesMet||[],
      keyVocabularyUsed:result?.keyVocabularyUsed||[],
      humanEdited: JSON.stringify(editResult) !== JSON.stringify({...result, misconceptionPatterns:(result?.misconceptionPatterns||[]).join("\n"), successIndicators:(result?.successIndicators||[]).join("\n")}),
    });
    toast({ title:"Diagnostic Approved & Logged" });
    setImg(null); setB64(null); setResult(null); setEditResult(null); setSelStudent("");
  };

  // ── Bulk upload helpers ──
  const onBulkFiles = e => {
    const files = Array.from(e.target.files||[]);
    if (!files.length) return;
    const newItems = files.map(f => ({ id:uid(), file:f, b64:null, mime:f.type||"image/jpeg", img:null, studentId:"", status:"pending", result:null, editResult:null }));
    // Load base64 for each
    newItems.forEach(item => {
      const r=new FileReader();
      r.onload=()=>{
        const dataUrl=r.result;
        setQueue(q=>q.map(qi=>qi.id===item.id ? {...qi, b64:dataUrl.split(",")[1], img:dataUrl} : qi));
      };
      r.readAsDataURL(item.file);
    });
    setQueue(q=>[...q, ...newItems]);
    e.target.value="";
  };

  const removeBulkItem = (id) => setQueue(q=>q.filter(qi=>qi.id!==id));

  const runBulk = async () => {
    if (!qLesson) { toast({ variant:"destructive", title:"Select a lesson first" }); return; }
    const pending = queue.filter(qi=>qi.b64 && qi.studentId && qi.status==="pending");
    if (!pending.length) { toast({ variant:"destructive", title:"Assign pupils to all images first" }); return; }
    const lesson=lessons.find(l=>l.id===qLesson);
    setBulkAnalyzing(true);
    for (const item of pending) {
      setQueue(q=>q.map(qi=>qi.id===item.id?{...qi,status:"analyzing"}:qi));
      try {
        const out = await analyzeJournal({ b64:item.b64, mime:item.mime, lessonCtx:lesson?.title||"Lesson", cpa:"Pictorial" });
        const er = { ...out, misconceptionPatterns:(out.misconceptionPatterns||[]).join("\n"), successIndicators:(out.successIndicators||[]).join("\n") };
        setQueue(q=>q.map(qi=>qi.id===item.id?{...qi,status:"done",result:out,editResult:er}:qi));
      } catch {
        setQueue(q=>q.map(qi=>qi.id===item.id?{...qi,status:"error"}:qi));
      }
    }
    setBulkAnalyzing(false);
    setBulkIdx(queue.findIndex(qi=>qi.status==="done"));
    toast({ title:"Bulk Analysis Complete", description:`${pending.length} entries ready for review.` });
  };

  const approveBulkItem = (item) => {
    const s=students.find(x=>x.id===item.studentId);
    const r=item.editResult||item.result;
    const lesson=lessons.find(l=>l.id===qLesson);
    addEntry({
      studentId:item.studentId, studentName:`${s.firstName} ${s.lastName}`,
      lessonId:qLesson, lessonTitle:lesson?.title||"",
      cpaDetected:r.cpaStageDetected, paceStatus:r.paceStatus,
      reasoningScore:Number(r.reasoningDepthScore)||0, methodUsed:r.methodUsed,
      misconceptions: typeof r.misconceptionPatterns==="string"?r.misconceptionPatterns.split("\n").filter(Boolean):r.misconceptionPatterns||[],
      successes: typeof r.successIndicators==="string"?r.successIndicators.split("\n").filter(Boolean):r.successIndicators||[],
      nextStep:r.suggestedInstructionalNextStep, transcription:r.transcription,
      sentimentIndicators:item.result?.sentimentIndicators||{},
      humanEdited:true,
    });
    setQueue(q=>q.map(qi=>qi.id===item.id?{...qi,status:"approved"}:qi));
    toast({ title:`${s.firstName} approved`, description:"Entry committed to evidence log." });
  };

  const approveAllBulk = () => {
    const done=queue.filter(qi=>qi.status==="done"&&qi.studentId&&qi.result);
    done.forEach(approveBulkItem);
  };

  const updateBulkEdit = (id, field, val) => setQueue(q=>q.map(qi=>qi.id===id?{...qi,editResult:{...qi.editResult,[field]:val}}:qi));

  const paceBadge = {"On Track":"bok-b","At Risk":"bwarn-b","Drifting":"berr-b"};
  const paceBg    = {"On Track":"var(--okl)","At Risk":"var(--warnl)","Drifting":"var(--errl)"};
  const cpaOpts   = ["Concrete","Pictorial","Transitioning","Abstract"];
  const paceOpts  = ["On Track","At Risk","Drifting"];

  if (!classroom) return (
    <div className="fu tc-bg" style={{padding:"80px 0"}}>
      <Ic n="camera" sz={34} color="var(--tx4)" style={{display:"block",margin:"0 auto 14px"}}/>
      <h2 style={{fontFamily:"var(--fh)",fontSize:19,marginBottom:7}}>No Active Classroom</h2>
      <p className="tm sm">Set up your school environment in Account → Organisation first.</p>
    </div>
  );

  const doneCount  = queue.filter(qi=>qi.status==="done").length;
  const approvedCount = queue.filter(qi=>qi.status==="approved").length;

  return (
    <div className="fu">
      <div className="ph">
        <div className="pheye"><Ic n="camera" sz={12}/>AI Diagnostics</div>
        <h1 className="phtitle">Journal Analysis</h1>
        <p className="phsub">OCR + NLP pipeline — single capture or bulk session upload</p>
      </div>

      <div className="tabs">
        {[
          {id:"capture", l:"Single Capture"},
          {id:"bulk",    l:`Bulk Upload${queue.length?` (${queue.length})`:""}` },
          {id:"log",     l:`Evidence Log (${entries.length})`},
        ].map(x=>(
          <button key={x.id} className={`tab${tab===x.id?" on":""}`} onClick={()=>setTab(x.id)}>{x.l}</button>
        ))}
      </div>

      {/* ── SINGLE CAPTURE TAB ── */}
      {tab==="capture" && (
        <div className="gr2" style={{gap:20,alignItems:"start"}}>
          <div>
            <div className="card mb4" style={{border:"1px solid var(--pri)",background:"var(--pril)"}}>
              <div className="ch"><div className="ctitle" style={{fontSize:14.5,display:"flex",alignItems:"center",gap:6}}><Ic n="layers" sz={14} color="var(--pri)"/>1. Set Context</div></div>
              <div className="cb">
                <div className="ig">
                  <label className="lbl">Lesson</label>
                  <select className="inp sel" value={selLesson} onChange={e=>setSelLesson(e.target.value)}>
                    <option value="">Choose lesson…</option>
                    {lessons.map(l=><option key={l.id} value={l.id}>[{l.status}] {l.title}</option>)}
                  </select>
                </div>
                <div className="ig" style={{marginBottom:0}}>
                  <label className="lbl">Pupil</label>
                  <select className="inp sel" value={selStudent} onChange={e=>setSelStudent(e.target.value)}>
                    <option value="">Choose pupil…</option>
                    {students.map(s=><option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="ch"><div className="ctitle" style={{fontSize:14.5,display:"flex",alignItems:"center",gap:6}}><Ic n="camera" sz={14} color="var(--pri)"/>2. Capture Image</div></div>
              <div className="cb">
                <div className="cambox mb4">
                  {img ? <img src={img} alt="Captured"/> : camOn ? <video ref={vid} autoPlay muted playsInline/> : (
                    <div className="tc-bg" style={{padding:"0 20px"}}>
                      <Ic n="camera" sz={34} color="var(--tx4)" style={{display:"block",margin:"0 auto 10px"}}/>
                      <p className="tm mb3 sm">Frame the journal page</p>
                      <button className="btn bout bsm" onClick={startCam}>Enable Camera</button>
                    </div>
                  )}
                  <canvas ref={can} style={{display:"none"}}/>
                </div>
                <div className="row g2">
                  {camOn ? (
                    <>
                      <button className="btn bpri" style={{flex:1}} onClick={snap}><Ic n="camera" sz={13}/>Capture</button>
                      <button className="btn bout bsm" onClick={stopCam}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn bout" style={{flex:1}} onClick={()=>document.getElementById("jfu").click()} disabled={!selLesson}><Ic n="upload" sz={13}/>Upload</button>
                      {img && <button className="btn bout bsm" onClick={()=>{setImg(null);setB64(null);setResult(null);setEditResult(null);}}>Retake</button>}
                      <button className="btn bpri" style={{flex:1}} disabled={!img||analyzing||!selLesson} onClick={run}>
                        {analyzing?<Spinner sz={13}/>:<Ic n="brain" sz={13}/>} Analyse
                      </button>
                    </>
                  )}
                </div>
                <input id="jfu" type="file" accept="image/*" style={{display:"none"}} onChange={onFile}/>
                {b64 && <p className="tm xs tc-bg mt2" style={{opacity:.6}}>Image compressed &amp; ready · {Math.round(b64.length*0.75/1024)}KB</p>}
              </div>
            </div>
          </div>

          <div>
            {analyzing && (
              <div className="card tc-bg" style={{padding:"52px 20px"}}>
                <Spinner sz={28}/><p className="bold mt4" style={{fontSize:15}}>Running OCR + NLP pipeline…</p>
                <p className="tm mt2 sm">Extracting handwriting and analysing mastery indicators</p>
              </div>
            )}

            {editResult && !analyzing && (
              <div className="card si" style={{border:"1px solid var(--pri)"}}>
                <div style={{background:"linear-gradient(135deg,var(--pri),var(--prid))",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <div style={{color:"#fff",fontFamily:"var(--fh)",fontSize:16}}>AI Quick Analytical Review</div>
                    <div style={{color:"rgba(255,255,255,.65)",fontSize:11,marginTop:2}}>All fields are editable — override AI suggestions before approving</div>
                  </div>
                  <ScoreRing score={editResult.reasoningDepthScore} size={46}/>
                </div>
                <div className="cb sy4">
                  {/* Transcription — editable */}
                  <div>
                    <div className="lbl mb1">OCR Transcription <span style={{color:"var(--acc)",fontStyle:"italic",textTransform:"none",letterSpacing:0}}>(editable)</span></div>
                    <textarea className="inp textarea w100" style={{minHeight:80,fontSize:12.5,lineHeight:1.55}} value={editResult.transcription||""} onChange={e=>setEditResult(p=>({...p,transcription:e.target.value}))}/>
                  </div>

                  {/* CPA + Pace — editable dropdowns */}
                  <div className="gr2">
                    <div>
                      <div className="lbl mb1">CPA Stage</div>
                      <select className="inp sel" value={editResult.cpaStageDetected||""} onChange={e=>setEditResult(p=>({...p,cpaStageDetected:e.target.value}))}>
                        {cpaOpts.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="lbl mb1">Pace Status</div>
                      <select className="inp sel" value={editResult.paceStatus||""} onChange={e=>setEditResult(p=>({...p,paceStatus:e.target.value}))}>
                        {paceOpts.map(p=><option key={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Score + Method — editable */}
                  <div className="gr2">
                    <div>
                      <div className="lbl mb1">Reasoning Score (0–100)</div>
                      <input className="inp" type="number" min={0} max={100} value={editResult.reasoningDepthScore||0} onChange={e=>setEditResult(p=>({...p,reasoningDepthScore:+e.target.value}))}/>
                    </div>
                    <div>
                      <div className="lbl mb1">Method Used</div>
                      <input className="inp" value={editResult.methodUsed||""} onChange={e=>setEditResult(p=>({...p,methodUsed:e.target.value}))}/>
                    </div>
                  </div>

                  {/* Misconceptions — editable textarea (one per line) */}
                  <div>
                    <div className="lbl mb1">⚠ Misconceptions <span style={{color:"var(--tx3)",fontStyle:"italic",textTransform:"none",letterSpacing:0}}>(one per line)</span></div>
                    <textarea className="inp textarea w100" style={{minHeight:64,fontSize:12.5}} value={editResult.misconceptionPatterns||""} onChange={e=>setEditResult(p=>({...p,misconceptionPatterns:e.target.value}))} placeholder="No misconceptions detected"/>
                  </div>

                  {/* Successes — editable */}
                  <div>
                    <div className="lbl mb1">✓ Success Indicators <span style={{color:"var(--tx3)",fontStyle:"italic",textTransform:"none",letterSpacing:0}}>(one per line)</span></div>
                    <textarea className="inp textarea w100" style={{minHeight:64,fontSize:12.5}} value={editResult.successIndicators||""} onChange={e=>setEditResult(p=>({...p,successIndicators:e.target.value}))} placeholder="No successes detected"/>
                  </div>

                  {/* Next Step — editable */}
                  <div>
                    <div className="lbl mb1">Instructional Next Step</div>
                    <input className="inp" value={editResult.suggestedInstructionalNextStep||""} onChange={e=>setEditResult(p=>({...p,suggestedInstructionalNextStep:e.target.value}))}/>
                  </div>

                  {/* Sentiment (read-only display) */}
                  {result?.sentimentIndicators && (
                    <div>
                      <div className="lbl mb2">Pupil Sentiment Indicators</div>
                      <div className="row g2" style={{flexWrap:"wrap"}}>
                        {Object.entries(result.sentimentIndicators).map(([k,v])=>(
                          <div key={k} style={{padding:"6px 12px",borderRadius:8,background:"var(--surf2)",border:"1px solid var(--bdr)",fontSize:12}}>
                            <span className="tm">{k}: </span><span className="bold">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Approve */}
                  <div style={{borderTop:"1px solid var(--bdr)",paddingTop:14}}>
                    <div className="lbl mb2">3. Approve &amp; Commit to Evidence Log</div>
                    {!selStudent && <p className="tm xs mb2 aerr" style={{padding:"6px 10px",borderRadius:8,border:"1px solid var(--err)"}}>⬆ Select a pupil above before approving.</p>}
                    <div className="row g2">
                      <button className="btn bok" style={{flex:1,height:39}} disabled={!selStudent} onClick={approve}>
                        <Ic n="check" sz={13}/>Approve &amp; Log
                      </button>
                      <button className="btn bout bsm" onClick={()=>{setEditResult({...result,misconceptionPatterns:(result.misconceptionPatterns||[]).join("\n"),successIndicators:(result.successIndicators||[]).join("\n")}); toast({title:"Reset to AI Suggestions"});}}>
                        Reset AI
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!editResult && !analyzing && (
              <div className="card tc-bg" style={{padding:"40px 20px",border:"2px dashed var(--bdr)"}}>
                <Ic n="brain" sz={30} color="var(--tx4)" style={{display:"block",margin:"0 auto 12px"}}/>
                <p className="tm sm">Capture or upload a journal image, then click Analyse.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BULK UPLOAD TAB ── */}
      {tab==="bulk" && (
        <div>
          {/* Lesson context */}
          <div className="card mb4" style={{border:"1px solid var(--pri)",background:"var(--pril)"}}>
            <div className="ch"><div className="ctitle" style={{fontSize:14.5,display:"flex",alignItems:"center",gap:6}}><Ic n="layers" sz={14} color="var(--pri)"/>Session Context</div></div>
            <div className="cb">
              <div className="row g3" style={{alignItems:"flex-end",flexWrap:"wrap"}}>
                <div style={{flex:"1 1 220px"}}>
                  <label className="lbl">Lesson for this batch</label>
                  <select className="inp sel" value={qLesson} onChange={e=>setQLesson(e.target.value)}>
                    <option value="">Choose lesson…</option>
                    {lessons.map(l=><option key={l.id} value={l.id}>[{l.status}] {l.title}</option>)}
                  </select>
                </div>
                <button className="btn bout" style={{height:38}} onClick={()=>document.getElementById("bfu").click()}>
                  <Ic n="upload" sz={13}/>Add Images
                </button>
                <input id="bfu" type="file" accept="image/*" multiple style={{display:"none"}} onChange={onBulkFiles}/>
                {queue.length>0 && (
                  <>
                    <button className="btn bpri" style={{height:38}} onClick={runBulk} disabled={bulkAnalyzing||!qLesson}>
                      {bulkAnalyzing?<><Spinner sz={13}/>Analysing…</>:<><Ic n="brain" sz={13}/>Analyse All</>}
                    </button>
                    {doneCount>0 && (
                      <button className="btn bok" style={{height:38}} onClick={approveAllBulk}>
                        <Ic n="check" sz={13}/>Approve All ({doneCount})
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {queue.length===0 ? (
            <div className="card tc-bg" style={{padding:"60px 20px",border:"2px dashed var(--bdr)"}}>
              <Ic n="upload" sz={34} color="var(--tx4)" style={{display:"block",margin:"0 auto 14px"}}/>
              <p className="bold" style={{fontSize:15,marginBottom:8}}>Bulk Session Upload</p>
              <p className="tm sm mb4">Upload multiple journal photos at once — assign pupils, analyse all, review &amp; approve.</p>
              <button className="btn bpri" onClick={()=>document.getElementById("bfu").click()}><Ic n="upload" sz={14}/>Select Images</button>
            </div>
          ) : (
            <>
              {/* Progress strip */}
              <div className="astrip ainfo mb4" style={{justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                <div className="row g3">
                  <Ic n="info" sz={14}/>
                  <span><strong>{queue.length}</strong> images queued · <strong>{queue.filter(q=>q.status==="done").length}</strong> analysed · <strong>{approvedCount}</strong> approved</span>
                </div>
                <div className="row g2">
                  {doneCount>0 && <span className="badge bok-b">{doneCount} ready to review</span>}
                  {queue.filter(q=>q.status==="error").length>0 && <span className="badge berr-b">{queue.filter(q=>q.status==="error").length} errors</span>}
                </div>
              </div>

              {/* Queue grid */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14,marginBottom:16}}>
                {queue.map((item,idx)=>(
                  <div key={item.id} className="card" style={{overflow:"visible", border: item.status==="approved"?"1px solid var(--ok)": item.status==="error"?"1px solid var(--err)": item.status==="done"?"1px solid var(--pri)":"1px solid var(--bdr)"}}>
                    {/* Thumbnail */}
                    <div style={{height:140,overflow:"hidden",borderRadius:"var(--rl) var(--rl) 0 0",background:"var(--surf2)",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                      {item.img ? <img src={item.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <Ic n="camera" sz={28} color="var(--tx4)"/>}
                      <div style={{position:"absolute",top:7,right:7}}>
                        {item.status==="pending"   && <span className="badge bout-b" style={{background:"rgba(255,255,255,.9)"}}>Pending</span>}
                        {item.status==="analyzing" && <span className="badge bpri-b" style={{background:"rgba(255,255,255,.9)"}}><Spinner sz={9}/> Analysing</span>}
                        {item.status==="done"      && <span className="badge bpri-b" style={{background:"rgba(255,255,255,.9)"}}>✓ Ready</span>}
                        {item.status==="approved"  && <span className="badge bok-b"  style={{background:"rgba(255,255,255,.9)"}}>Approved</span>}
                        {item.status==="error"     && <span className="badge berr-b" style={{background:"rgba(255,255,255,.9)"}}>Error</span>}
                      </div>
                      <button className="btn bghost bico" style={{position:"absolute",top:7,left:7,background:"rgba(255,255,255,.9)",padding:4}} onClick={()=>removeBulkItem(item.id)}><Ic n="x" sz={11} color="var(--err)"/></button>
                    </div>

                    <div style={{padding:"11px 13px"}}>
                      {/* Pupil assignment */}
                      <div className="ig" style={{marginBottom:8}}>
                        <label className="lbl">Assign to Pupil</label>
                        <select className="inp sel" style={{fontSize:12}} value={item.studentId} onChange={e=>setQueue(q=>q.map(qi=>qi.id===item.id?{...qi,studentId:e.target.value}:qi))} disabled={item.status==="approved"}>
                          <option value="">Choose pupil…</option>
                          {students.map(s=><option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                        </select>
                      </div>

                      {/* Quick result summary if done */}
                      {item.status==="done" && item.editResult && (
                        <div style={{fontSize:11.5,marginBottom:8}}>
                          <div className="row g2 mb1">
                            <span className="badge bacc-b" style={{fontSize:9}}>{item.editResult.cpaStageDetected}</span>
                            <span className={`badge ${item.editResult.paceStatus==="On Track"?"bok-b":item.editResult.paceStatus==="Drifting"?"berr-b":"bwarn-b"}`} style={{fontSize:9}}>{item.editResult.paceStatus}</span>
                            <span className="tm xs">Score: {item.editResult.reasoningDepthScore}</span>
                          </div>
                          {item.editResult.transcription && <p className="tm xs trunc" style={{marginBottom:4}}>{item.editResult.transcription}</p>}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="row g1">
                        {(item.status==="done") && (
                          <>
                            <button className="btn bpri bsm" style={{flex:1,fontSize:11}} onClick={()=>setBulkIdx(idx)}>Review &amp; Edit</button>
                            <button className="btn bok bsm" style={{fontSize:11}} disabled={!item.studentId} onClick={()=>approveBulkItem(item)}><Ic n="check" sz={11}/>OK</button>
                          </>
                        )}
                        {item.status==="error" && (
                          <button className="btn bout bsm" style={{flex:1,fontSize:11}} onClick={()=>{ setQueue(q=>q.map(qi=>qi.id===item.id?{...qi,status:"pending"}:qi)); }}>Retry</button>
                        )}
                        {item.status==="approved" && <span className="tm xs" style={{padding:"4px 0",flex:1}}>✓ Committed to log</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Bulk item review modal */}
          {bulkIdx !== null && queue[bulkIdx] && queue[bulkIdx].editResult && (
            <Modal open={true} onClose={()=>setBulkIdx(null)} title={`Review: ${students.find(s=>s.id===queue[bulkIdx].studentId)?.firstName||"?"} — Image ${bulkIdx+1}/${queue.length}`} size="mbox-lg">
              <div className="sy4">
                <div className="astrip ainfo" style={{marginBottom:0,fontSize:12}}><Ic n="info" sz={13}/>Edit any field below to override the AI analysis before approving.</div>
                {queue[bulkIdx].img && <div style={{borderRadius:"var(--r)",overflow:"hidden",maxHeight:200}}><img src={queue[bulkIdx].img} alt="" style={{width:"100%",objectFit:"contain"}}/></div>}
                <div>
                  <div className="lbl mb1">OCR Transcription</div>
                  <textarea className="inp textarea w100" style={{minHeight:70,fontSize:12.5}} value={queue[bulkIdx].editResult.transcription||""} onChange={e=>updateBulkEdit(queue[bulkIdx].id,"transcription",e.target.value)}/>
                </div>
                <div className="gr2">
                  <div><div className="lbl mb1">CPA Stage</div>
                    <select className="inp sel" value={queue[bulkIdx].editResult.cpaStageDetected||""} onChange={e=>updateBulkEdit(queue[bulkIdx].id,"cpaStageDetected",e.target.value)}>
                      {cpaOpts.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div><div className="lbl mb1">Pace Status</div>
                    <select className="inp sel" value={queue[bulkIdx].editResult.paceStatus||""} onChange={e=>updateBulkEdit(queue[bulkIdx].id,"paceStatus",e.target.value)}>
                      {paceOpts.map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="gr2">
                  <div><div className="lbl mb1">Score (0–100)</div><input className="inp" type="number" min={0} max={100} value={queue[bulkIdx].editResult.reasoningDepthScore||0} onChange={e=>updateBulkEdit(queue[bulkIdx].id,"reasoningDepthScore",+e.target.value)}/></div>
                  <div><div className="lbl mb1">Method Used</div><input className="inp" value={queue[bulkIdx].editResult.methodUsed||""} onChange={e=>updateBulkEdit(queue[bulkIdx].id,"methodUsed",e.target.value)}/></div>
                </div>
                <div><div className="lbl mb1">Misconceptions (one per line)</div><textarea className="inp textarea w100" style={{minHeight:60,fontSize:12.5}} value={queue[bulkIdx].editResult.misconceptionPatterns||""} onChange={e=>updateBulkEdit(queue[bulkIdx].id,"misconceptionPatterns",e.target.value)}/></div>
                <div><div className="lbl mb1">Success Indicators (one per line)</div><textarea className="inp textarea w100" style={{minHeight:60,fontSize:12.5}} value={queue[bulkIdx].editResult.successIndicators||""} onChange={e=>updateBulkEdit(queue[bulkIdx].id,"successIndicators",e.target.value)}/></div>
                <div><div className="lbl mb1">Next Step</div><input className="inp" value={queue[bulkIdx].editResult.suggestedInstructionalNextStep||""} onChange={e=>updateBulkEdit(queue[bulkIdx].id,"suggestedInstructionalNextStep",e.target.value)}/></div>
                <div className="row g2" style={{justifyContent:"space-between"}}>
                  <div className="row g2">
                    <button className="btn bout bsm" disabled={bulkIdx===0} onClick={()=>setBulkIdx(i=>Math.max(0,i-1))}>← Prev</button>
                    <button className="btn bout bsm" disabled={bulkIdx>=queue.length-1} onClick={()=>setBulkIdx(i=>Math.min(queue.length-1,i+1))}>Next →</button>
                  </div>
                  <div className="row g2">
                    <button className="btn bghost bsm" onClick={()=>setBulkIdx(null)}>Close</button>
                    <button className="btn bok bsm" disabled={!queue[bulkIdx].studentId} onClick={()=>{approveBulkItem(queue[bulkIdx]);setBulkIdx(null);}}>
                      <Ic n="check" sz={12}/>Approve &amp; Commit
                    </button>
                  </div>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* ── LOG TAB ── */}
      {tab==="log" && (
        <LogTab entries={entries} students={students} setViewEntry={setViewEntry} setDelId={setDelId}/>
      )}

      {/* Entry detail modal */}
      {viewEntry && (
        <Modal open={true} onClose={()=>setViewEntry(null)} title={`${viewEntry.studentName} — ${viewEntry.lessonTitle}`} size="mbox-lg">
          <div className="sy4">
            <div className="gr2">
              {[{l:"CPA Stage",v:viewEntry.cpaDetected},{l:"Method Used",v:viewEntry.methodUsed},{l:"Pace Status",v:viewEntry.paceStatus},{l:"Date",v:new Date(viewEntry.captureDate).toLocaleDateString("en-GB")}].map(item=>(
                <div key={item.l} style={{padding:"10px 13px",borderRadius:"var(--r)",background:"var(--surf2)",border:"1px solid var(--bdr)"}}>
                  <div className="lbl">{item.l}</div><div className="bold sm">{item.v||"—"}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:14,padding:"12px 14px",borderRadius:"var(--r)",background:"var(--pril)",border:"1px solid var(--pri2)"}}>
              <ScoreRing score={viewEntry.reasoningScore} size={52}/>
              <div>
                <div className="lbl">Reasoning Depth Score</div>
                <div style={{fontFamily:"var(--fh)",fontSize:22,color:"var(--pri)"}}>{viewEntry.reasoningScore}<span style={{fontSize:13,fontWeight:400,color:"var(--tx3)"}}>/100</span></div>
                <div className="tm xs">{viewEntry.humanEdited?"Teacher-edited":"AI analysis"} · {viewEntry.methodUsed}</div>
              </div>
            </div>
            {viewEntry.transcription && <div><div className="lbl mb1">OCR Transcription</div><p style={{fontSize:13,lineHeight:1.6,color:"var(--tx2)",padding:"11px 14px",background:"var(--surf2)",borderRadius:"var(--r)",border:"1px solid var(--bdr)"}}>{viewEntry.transcription}</p></div>}
            {viewEntry.misconceptions?.length>0 && <div><div className="lbl mb1">Misconceptions Detected</div>{viewEntry.misconceptions.map((m,i)=><div key={i} className="astrip aerr" style={{marginBottom:5,fontSize:12.5,padding:"8px 11px"}}>{m}</div>)}</div>}
            {viewEntry.successes?.length>0 && <div><div className="lbl mb1">Success Indicators</div>{viewEntry.successes.map((s,i)=><div key={i} className="astrip aok" style={{marginBottom:5,fontSize:12.5,padding:"8px 11px"}}>{s}</div>)}</div>}
            {viewEntry.nextStep && <div><div className="lbl mb1">Instructional Next Step</div><div className="astrip ainfo" style={{marginBottom:0}}><Ic n="info" sz={14}/>{viewEntry.nextStep}</div></div>}
            {viewEntry.sentimentIndicators && Object.keys(viewEntry.sentimentIndicators).length>0 && (
              <div>
                <div className="lbl mb2">Sentiment Indicators</div>
                <div className="row g2" style={{flexWrap:"wrap"}}>
                  {Object.entries(viewEntry.sentimentIndicators).map(([k,v])=>(
                    <div key={k} style={{padding:"6px 12px",borderRadius:8,background:"var(--surf2)",border:"1px solid var(--bdr)",fontSize:12}}><span className="tm">{k}: </span><span className="bold">{v}</span></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      <Confirm open={!!delId} onClose={()=>setDelId(null)} onConfirm={()=>{deleteEntry(delId);toast({title:"Entry Removed"});}} title="Remove Entry?" desc="Permanently deletes this diagnostic entry from the evidence log." danger/>
    </div>
  );
}


// ─── MASTERY TRACKING ─────────────────────────────────────────────────────
function Mastery() {
  const { students, entries, alerts, addStudent, removeStudent, updateStudent, addAlert, dismissAlert } = useApp();
  const { toast } = useToast();
  const [driftRes,  setDriftRes]  = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  const [showAdd,   setShowAdd]   = useState(false);
  const [nf,setNf]=useState(""); const [nl,setNl]=useState("");
  const [delId,     setDelId]     = useState(null);
  const [viewPupil, setViewPupil] = useState(null);
  const [filter,    setFilter]    = useState("all");

  const runDrift = async () => {
    if (students.length===0) return;
    setAnalyzing(true);
    const classIdx = students.length>0 ? Math.round(students.reduce((a,s)=>a+(s.moduleIdx||0),0)/students.length) : CPA_MODULES.length-2;
    const res = {};
    for (const s of students) {
      try { res[s.id] = await detectDrift({ name:`${s.firstName} ${s.lastName}`, idx:s.moduleIdx||0, classIdx }); } catch {}
    }
    setDriftRes(res); setAnalyzing(false);
    const driftCount = Object.values(res).filter(r=>r.driftDetected).length;
    toast({ title:"Drift Analysis Complete", description:driftCount>0?`${driftCount} pupil(s) flagged for intervention.`:"All pupils on track. No drift detected." });
  };

  const recordAlert = (sid) => {
    const r=driftRes[sid]; const s=students.find(x=>x.id===sid);
    if (!r?.driftDetected) return;
    addAlert({ studentId:sid, studentName:`${s.firstName} ${s.lastName}`, severity:"Medium", intervention:r.suggestedIntervention, module:r.identifiedDriftModule });
    toast({ title:"Intervention Alert Logged", description:`Action required for ${s.firstName}.` });
  };

  const doAdd = () => {
    if (!nf.trim()||!nl.trim()) return;
    addStudent({ firstName:nf.trim(), lastName:nl.trim(), moduleIdx:0 });
    toast({ title:"Pupil Enrolled", description:`${nf} ${nl} added to the roster.` });
    setNf(""); setNl(""); setShowAdd(false);
  };

  const driftCount = Object.values(driftRes).filter(r=>r.driftDetected).length;
  const activeAlerts = alerts.filter(a=>a.status==="Active").length;

  const filteredStudents = students.filter(s => {
    if (filter==="drift") return driftRes[s.id]?.driftDetected;
    if (filter==="atrisk") return entries.some(e=>e.studentId===s.id&&(e.paceStatus==="At Risk"||e.paceStatus==="Drifting"));
    return true;
  });

  const pupilEntries = viewPupil ? entries.filter(e=>e.studentId===viewPupil.id) : [];

  return (
    <div className="fu">
      <div className="ph">
        <div className="pheye"><Ic n="mastery" sz={12}/>Mastery Tracking</div>
        <h1 className="phtitle">Drift Monitoring</h1>
        <p className="phsub">Prevent silent conceptual slippage before it impacts assessments</p>
      </div>

      <div className="stats">
        <div className="sc" style={driftCount>0?{background:"var(--errl)",borderColor:"#FCA5A5"}:{}}>
          <div className="sl">{driftCount>0?"Drift Detected":"Synchronised"}</div>
          <div className="sv" style={{color:driftCount>0?"var(--err)":"var(--ok)"}}>{driftCount}</div>
          <div className="ss">{driftCount>0?"Pupils need intervention":"All pupils aligned"}</div>
        </div>
        <div className="sc"><div className="sl">Pupils Enrolled</div><div className="sv">{students.length}</div><div className="ss">In current class</div></div>
        <div className="sc"><div className="sl">Active Alerts</div><div className="sv" style={{color:activeAlerts>0?"var(--warn)":undefined}}>{activeAlerts}</div><div className="ss">Intervention logged</div></div>
        <div className="sc"><div className="sl">Avg Module</div><div className="sv">{students.length?Math.round(students.reduce((a,s)=>a+(s.moduleIdx||0),0)/students.length)+1:0}</div><div className="ss">Class average</div></div>
      </div>

      <div className="card mb4">
        <div className="ch rowb" style={{flexWrap:"wrap",gap:10}}>
          <div><div className="ctitle" style={{fontSize:15}}>Pupil Roster</div><div className="cdesc">Click a pupil to see their full diagnostic history</div></div>
          <div className="row g2" style={{flexWrap:"wrap"}}>
            <div className="row g1" style={{background:"var(--surf2)",borderRadius:9,padding:3,border:"1px solid var(--bdr)"}}>
              {[{id:"all",l:"All"},{id:"drift",l:"Drifting"},{id:"atrisk",l:"At Risk"}].map(f=>(
                <button key={f.id} className={`btn bsm${filter===f.id?" bpri":" bghost"}`} style={{fontSize:11,padding:"4px 9px"}} onClick={()=>setFilter(f.id)}>{f.l}</button>
              ))}
            </div>
            <button className="btn bout bsm" onClick={runDrift} disabled={analyzing||students.length===0}>
              {analyzing ? <Spinner sz={12}/> : <Ic n="brain" sz={12}/>} AI Drift Check
            </button>
            <button className="btn bpri bsm" onClick={()=>setShowAdd(s=>!s)}><Ic n="plus" sz={12}/>Add Pupil</button>
          </div>
        </div>

        {showAdd && (
          <div style={{padding:"12px 18px",background:"var(--pril)",borderBottom:"1px solid var(--bdr)"}}>
            <div className="row g3" style={{alignItems:"flex-end"}}>
              <div style={{flex:1}}><label className="lbl">First Name</label><input className="inp" value={nf} onChange={e=>setNf(e.target.value)} placeholder="e.g. Cerys" onKeyDown={e=>e.key==="Enter"&&doAdd()}/></div>
              <div style={{flex:1}}><label className="lbl">Last Name</label><input className="inp" value={nl} onChange={e=>setNl(e.target.value)} placeholder="e.g. Jones" onKeyDown={e=>e.key==="Enter"&&doAdd()}/></div>
              <button className="btn bpri bsm" style={{height:38}} onClick={doAdd}><Ic n="check" sz={12}/>Add</button>
              <button className="btn bghost bsm" style={{height:38}} onClick={()=>setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="tw">
          <table className="tbl">
            <thead><tr><th>Pupil</th><th>Mastered Module</th><th>Progress</th><th>Entries</th><th>Drift</th><th>Suggested Action</th><th style={{textAlign:"right"}}>Actions</th></tr></thead>
            <tbody>
              {filteredStudents.length===0 ? (
                <tr><td colSpan={7} className="tc-bg tm" style={{padding:"40px 16px"}}>{students.length===0?"No pupils enrolled. Click 'Add Pupil' to begin.":"No pupils match the selected filter."}</td></tr>
              ) : filteredStudents.map(s => {
                const r=driftRes[s.id];
                const idx=s.moduleIdx||0;
                const pupEntries=entries.filter(e=>e.studentId===s.id);
                return (
                  <tr key={s.id} style={{cursor:"pointer"}} onClick={()=>setViewPupil(s)}>
                    <td>
                      <div className="row g2">
                        <div style={{width:28,height:28,borderRadius:8,background:"var(--accl)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"var(--acc)",flexShrink:0}}>{s.firstName[0]}{s.lastName[0]}</div>
                        <span className="bold sm">{s.firstName} {s.lastName}</span>
                      </div>
                    </td>
                    <td>
                      <select className="inp sel" style={{width:"auto",fontSize:12,padding:"4px 28px 4px 8px",height:"auto"}} value={idx} onClick={e=>e.stopPropagation()} onChange={e=>updateStudent(s.id,{moduleIdx:+e.target.value})}>
                        {CPA_MODULES.map((m,i)=><option key={i} value={i}>{m}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="row g2" style={{minWidth:90}}>
                        <div className="prog" style={{width:64}}><div className="progf" style={{width:`${((idx+1)/CPA_MODULES.length)*100}%`}}/></div>
                        <span className="tm xs">{idx+1}/{CPA_MODULES.length}</span>
                      </div>
                    </td>
                    <td className="tm sm">{pupEntries.length}</td>
                    <td onClick={e=>e.stopPropagation()}>
                      {r ? r.driftDetected ? <span className="badge berr-b">Drifting</span> : <span className="badge bok-b">On Track</span> : <span className="badge bout-b">Pending</span>}
                    </td>
                    <td style={{maxWidth:180}} onClick={e=>e.stopPropagation()}>
                      <span className="trunc tm" style={{display:"block",fontSize:11.5}}>{r?.suggestedIntervention||(r?"None required":"Run diagnostic first")}</span>
                    </td>
                    <td style={{textAlign:"right"}} onClick={e=>e.stopPropagation()}>
                      <div className="row g1" style={{justifyContent:"flex-end"}}>
                        {r?.driftDetected && <button className="btn bwarn bsm" style={{fontSize:11,padding:"4px 8px"}} onClick={()=>recordAlert(s.id)}><Ic n="alert" sz={11}/>Alert</button>}
                        <button className="btn bghost bico bsm" onClick={()=>setDelId(s.id)}><Ic n="trash" sz={12} color="var(--err)"/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="card">
          <div className="ch"><div className="ctitle" style={{fontSize:15}}>Intervention Alert Log</div><div className="cdesc">{alerts.filter(a=>a.status==="Active").length} active · {alerts.filter(a=>a.status==="Resolved").length} resolved</div></div>
          <div className="tw">
            <table className="tbl">
              <thead><tr><th>Pupil</th><th>Drifting Module</th><th>Suggested Intervention</th><th>Severity</th><th>Status</th><th>Date</th><th style={{textAlign:"right"}}>Actions</th></tr></thead>
              <tbody>
                {alerts.map(a=>(
                  <tr key={a.id} style={{opacity:a.status==="Resolved"?.55:1}}>
                    <td className="bold sm">{a.studentName}</td>
                    <td className="sm tm">{a.module||"—"}</td>
                    <td style={{maxWidth:220}}><span className="trunc tm" style={{display:"block",fontSize:12}}>{a.intervention||"—"}</span></td>
                    <td><span className="badge bwarn-b">{a.severity}</span></td>
                    <td><span className={`badge ${a.status==="Active"?"berr-b":"bok-b"}`}>{a.status}</span></td>
                    <td className="tm xs">{new Date(a.date).toLocaleDateString("en-GB")}</td>
                    <td style={{textAlign:"right"}}>
                      {a.status==="Active" && <button className="btn bghost bsm" style={{fontSize:11}} onClick={()=>dismissAlert(a.id)}><Ic n="check" sz={11} color="var(--ok)"/>Resolve</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pupil Profile Modal */}
      {viewPupil && (
        <Modal open={true} onClose={()=>setViewPupil(null)} title={`${viewPupil.firstName} ${viewPupil.lastName}`} size="mbox-xl">
          <div className="sy4">
            <div className="gr3">
              <div style={{padding:"11px 14px",borderRadius:"var(--r)",background:"var(--pril)",border:"1px solid var(--pri2)"}}>
                <div className="lbl">Current Module</div>
                <div className="bold sm">{CPA_MODULES[viewPupil.moduleIdx||0]}</div>
                <div className="tm xs">{(viewPupil.moduleIdx||0)+1} of {CPA_MODULES.length}</div>
              </div>
              <div style={{padding:"11px 14px",borderRadius:"var(--r)",background:"var(--surf2)",border:"1px solid var(--bdr)"}}>
                <div className="lbl">Diagnostic Entries</div>
                <div className="bold" style={{fontSize:20}}>{pupilEntries.length}</div>
              </div>
              <div style={{padding:"11px 14px",borderRadius:"var(--r)",background:driftRes[viewPupil.id]?.driftDetected?"var(--errl)":"var(--okl)",border:"1px solid var(--bdr)"}}>
                <div className="lbl">Drift Status</div>
                <div className="bold sm">{driftRes[viewPupil.id]?.driftDetected?"Drifting":driftRes[viewPupil.id]?"On Track":"Not Checked"}</div>
              </div>
            </div>
            <div>
              <div className="lbl mb1">Teacher Notes</div>
              <PupilNotesEditor pupil={viewPupil} updateStudent={updateStudent} toast={toast}/>
            </div>
            <div>
              <div className="lbl mb2">Diagnostic History ({pupilEntries.length})</div>
              {pupilEntries.length===0 ? <p className="tm sm">No journal diagnostics yet for this pupil.</p> : (
                <div className="sy3">
                  {pupilEntries.map(e=>(
                    <div key={e.id} style={{padding:"11px 14px",borderRadius:"var(--r)",border:"1px solid var(--bdr)",background:"#fff"}}>
                      <div className="rowb mb2">
                        <div className="row g2">
                          <span className="badge bacc-b" style={{fontSize:9}}>{e.cpaDetected}</span>
                          <span className={`badge ${e.paceStatus==="On Track"?"bok-b":"berr-b"}`} style={{fontSize:9}}>{e.paceStatus}</span>
                          <span className="tm xs">{e.lessonTitle}</span>
                        </div>
                        <div className="row g2">
                          <ScoreRing score={e.reasoningScore} size={32}/>
                          <span className="tm xs">{new Date(e.captureDate).toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}</span>
                        </div>
                      </div>
                      {e.nextStep && <p className="tm xs"><span className="bold">Next: </span>{e.nextStep}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      <Confirm open={!!delId} onClose={()=>setDelId(null)} onConfirm={()=>removeStudent(delId)} title="Remove Pupil?" desc="This will permanently remove this pupil and all their linked records." danger/>
    </div>
  );
}

// ─── CURRICULUM ALIGNMENT ─────────────────────────────────────────────────
function Curriculum() {
  const { entries, classroom, students, alerts } = useApp();
  const n = entries.length;

  const profs = [
    { name:"Conceptual Understanding",    key:"cu",  ev:entries.filter(e=>e.reasoningScore>=70).length, target:30,  icon:"brain" },
    { name:"Communication using Symbols", key:"cs",  ev:entries.filter(e=>e.cpaDetected==="Abstract").length, target:25, icon:"curriculum" },
    { name:"Fluency",                     key:"fl",  ev:entries.filter(e=>e.paceStatus==="On Track").length, target:30, icon:"check" },
    { name:"Logical Reasoning",           key:"lr",  ev:entries.filter(e=>e.reasoningScore>=80).length, target:20, icon:"layers" },
    { name:"Strategic Competence",        key:"sc2", ev:entries.filter(e=>e.methodUsed?.toLowerCase().includes("bar")).length, target:20, icon:"mastery" },
  ];

  const aole = [
    { id:"MN-01", desc:"Understanding the number system and place value",  evidenceCount:entries.filter(e=>["Number Bond","Number Line","Counting On"].includes(e.methodUsed)).length },
    { id:"MN-02", desc:"Using operations flexibly to solve problems",       evidenceCount:entries.filter(e=>["Bar Model","Part-Whole Bar","Comparison Bar"].includes(e.methodUsed)).length },
    { id:"MN-03", desc:"Exploring geometric properties of 2D and 3D shapes",evidenceCount:entries.filter(e=>e.methodUsed?.toLowerCase().includes("shape")).length },
    { id:"MN-04", desc:"Collecting, representing and interpreting data",    evidenceCount:entries.filter(e=>e.methodUsed?.toLowerCase().includes("data")).length },
    { id:"MN-05", desc:"Measuring and comparing quantities",                evidenceCount:entries.filter(e=>e.methodUsed?.toLowerCase().includes("measur")).length },
  ];

  const profLevel = (ev,target) => {
    const pct = Math.min(100,n>0?Math.round((ev/Math.max(target,1))*100):0);
    if (pct>=80) return { label:"Full Coverage",       badge:"bok-b" };
    if (pct>=40) return { label:"Substantial Evidence",badge:"bpri-b" };
    if (pct>0)   return { label:"Emerging Evidence",   badge:"bwarn-b" };
    return          { label:"No Evidence Yet",        badge:"bout-b" };
  };

  return (
    <div className="fu">
      <div className="ph rowb" style={{flexWrap:"wrap",gap:10}}>
        <div>
          <div className="pheye"><Ic n="curriculum" sz={12}/>Evidence Mapping</div>
          <h1 className="phtitle">Curriculum Alignment</h1>
          <p className="phsub">Statutory mapping to AoLE Mathematics &amp; Numeracy</p>
        </div>
        <button className="btn bpri" onClick={()=>exportEvidencePack({classroom,students,entries,alerts,profs})}><Ic n="download" sz={14}/>Export Evidence Pack</button>
      </div>

      <div className="gr75" style={{alignItems:"start"}}>
        <div>
          <div className="card mb4">
            <div className="ch"><div className="ctitle" style={{fontSize:15}}>5 Mathematical Proficiencies</div><div className="cdesc">Live mapping to Curriculum for Wales · {n} verified entries</div></div>
            <div className="cb sy6">
              {profs.map(p => {
                const pct = Math.min(100,n>0?Math.round((p.ev/Math.max(p.target,1))*100):0);
                const lvl = profLevel(p.ev,p.target);
                return (
                  <div key={p.name}>
                    <div className="rowb mb2">
                      <div className="row g2">
                        <Ic n={p.icon} sz={13} color="var(--tx3)"/>
                        <div><div className="bold sm">{p.name}</div><div className="tm xs">{p.ev} verified entries</div></div>
                      </div>
                      <div className="row g2">
                        <span className={`badge ${lvl.badge}`} style={{fontSize:9}}>{lvl.label}</span>
                        <span style={{fontFamily:"monospace",fontWeight:700,fontSize:12}}>{pct}%</span>
                      </div>
                    </div>
                    <div className="prog"><div className="progf" style={{width:`${pct}%`}}/></div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card mb4">
            <div className="ch"><div className="ctitle" style={{fontSize:14.5}}>AoLE: Mathematics &amp; Numeracy</div><div className="cdesc">5 statutory requirements · Curriculum for Wales</div></div>
            <div className="cb sy3">
              {aole.map(item => {
                const lvl = profLevel(item.evidenceCount, 10);
                return (
                  <div key={item.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 13px",border:"1px solid var(--bdr)",borderRadius:"var(--r)",background:"#fff"}}>
                    <div className="row g3">
                      <span className="badge bout-b" style={{fontFamily:"monospace",fontSize:9,flexShrink:0}}>{item.id}</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:500}}>{item.desc}</div>
                        <div className="tm xs">{item.evidenceCount} entries mapped</div>
                      </div>
                    </div>
                    <span className={`badge ${lvl.badge}`} style={{fontSize:9,flexShrink:0,marginLeft:8}}>{lvl.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {entries.length > 0 && (
            <div className="card">
              <div className="ch"><div className="ctitle" style={{fontSize:14.5}}>Approved Diagnostics ({entries.length})</div></div>
              <div className="tw">
                <table className="tbl">
                  <thead><tr><th>Pupil</th><th>Lesson</th><th>CPA</th><th>Score</th><th>Pace</th><th>Date</th></tr></thead>
                  <tbody>
                    {entries.map(e=>(
                      <tr key={e.id}>
                        <td className="bold sm">{e.studentName}</td>
                        <td className="trunc tm" style={{fontSize:12,maxWidth:130}}>{e.lessonTitle}</td>
                        <td><span className="badge bacc-b" style={{fontSize:9}}>{e.cpaDetected}</span></td>
                        <td><ScoreRing score={e.reasoningScore} size={32}/></td>
                        <td><span className={`badge ${e.paceStatus==="On Track"?"bok-b":e.paceStatus==="Drifting"?"berr-b":"bwarn-b"}`} style={{fontSize:9}}>{e.paceStatus}</span></td>
                        <td className="tm xs">{new Date(e.captureDate).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="card mb4" style={{background:"linear-gradient(135deg,var(--pri),var(--acc))",overflow:"hidden",position:"relative"}}>
            <div style={{position:"absolute",top:-10,right:-10,opacity:.1}}><Ic n="shield" sz={110} color="#fff"/></div>
            <div className="cb">
              <div style={{color:"rgba(255,255,255,.65)",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>Inspection Dashboard</div>
              <div style={{color:"#fff",fontFamily:"var(--fh)",fontSize:21,marginBottom:5}}>Estyn Ready</div>
              <p style={{color:"rgba(255,255,255,.7)",fontSize:12.5,marginBottom:16,lineHeight:1.5}}>Ready for inspection review</p>
              <div style={{background:"rgba(255,255,255,.15)",borderRadius:"var(--r)",padding:"11px 14px",marginBottom:14,backdropFilter:"blur(4px)"}}>
                <div className="row g2"><Ic n="check" sz={15} color="#fff"/><span style={{color:"#fff",fontWeight:700,fontSize:13.5}}>{n>0?"Active Evidence Portfolio":"Awaiting Evidence"}</span></div>
                <p style={{fontSize:11.5,color:"rgba(255,255,255,.6)",marginTop:3}}>{n} diagnostic entries this term</p>
              </div>
              <button className="btn w100" style={{background:"rgba(255,255,255,.95)",color:"var(--pri)",fontWeight:700,height:38}} onClick={()=>exportEvidencePack({classroom,students,entries,alerts,profs})}>
                <Ic n="download" sz={13} color="var(--pri)"/>Export Evidence Pack
              </button>
            </div>
          </div>

          <div className="card">
            <div className="ch"><div className="ctitle" style={{fontSize:14,display:"flex",alignItems:"center",gap:6}}><Ic n="history" sz={13} color="var(--tx3)"/>Evidence Timeline</div></div>
            <div className="cb">
              {entries.length===0 ? (
                <p className="tm sm tc-bg" style={{padding:"14px 0"}}>Approve journal diagnostics to build your evidence timeline.</p>
              ) : entries.slice(0,8).map((e,i,arr) => (
                <div key={e.id} className="row g3" style={{marginBottom:i<arr.length-1?12:0}}>
                  <div className="colc">
                    <div style={{width:8,height:8,borderRadius:"50%",background:e.paceStatus==="On Track"?"var(--ok)":e.paceStatus==="At Risk"?"var(--warn)":"var(--err)",marginTop:2,flexShrink:0}}/>
                    {i<arr.length-1 && <div style={{width:1,flex:1,background:"var(--bdr)",margin:"3px 0"}}/>}
                  </div>
                  <div style={{flex:1,paddingBottom:10}}>
                    <div className="tm xs bold" style={{textTransform:"uppercase"}}>{new Date(e.captureDate).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</div>
                    <div className="bold sm">{e.studentName}</div>
                    <div className="tm xs">{e.lessonTitle} · <span className="ta">{e.cpaDetected}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── INSPECTION PROOF ─────────────────────────────────────────────────────
function Inspection() {
  const { entries, alerts, classroom, students } = useApp();
  const n = entries.length;
  const metrics = [
    { name:"Curriculum Alignment",    score:100,                          status:"Verified"  },
    { name:"CPA Heuristic Integrity", score:95,                           status:"High"      },
    { name:"Evidence Capture Rate",   score:Math.min(100,n*5),            status:"On Track"  },
    { name:"Diagnostic Coverage",     score:Math.min(100,Math.round(n/25*100)), status:"Statutory" },
  ];
  const logItems = [
    ...entries.slice(0,4).map(e=>({ date:e.captureDate, event:"Journal diagnostic approved", who:e.studentName, type:"ok" })),
    ...alerts.slice(0,3).map(a=>({ date:a.date, event:`Drift intervention ${a.status==="Resolved"?"resolved":"recorded"}`, who:a.studentName, type:a.status==="Resolved"?"ok":"warn" })),
  ].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,8);

  return (
    <div className="fu">
      <div className="ph rowb" style={{flexWrap:"wrap",gap:10}}>
        <div>
          <div className="pheye" style={{color:"var(--acc)"}}><Ic n="inspection" sz={12} color="var(--acc)"/>Estyn Compliance</div>
          <h1 className="phtitle">Inspection Proof Dashboard</h1>
          <p className="phsub ital">Statutory Reporting · Curriculum for Wales Framework</p>
        </div>
        <button className="btn bpri blg" onClick={()=>exportEvidencePack({classroom,students,entries,alerts})}><Ic n="download" sz={15}/>Export Pack</button>
      </div>

      <div className="stats">
        {metrics.map(m=>(
          <div key={m.name} className="sc">
            <div className="sl">{m.name}</div>
            <div className="row g2 mt1 mb1"><span className="sv">{m.score}%</span><span className="badge bok-b" style={{fontSize:9}}>{m.status}</span></div>
            <div className="prog"><div className="progf" style={{width:`${m.score}%`}}/></div>
          </div>
        ))}
      </div>

      <div className="gr75" style={{alignItems:"start"}}>
        <div>
          <div className="card mb4" style={{border:"1px solid var(--pri)",background:"var(--pril)"}}>
            <div className="ch"><div className="ctitle" style={{fontSize:15,display:"flex",alignItems:"center",gap:6}}><Ic n="landmark" sz={16} color="var(--pri)"/>Compliance Status</div><div className="cdesc">Statutory requirements for Mathematics and Numeracy</div></div>
            <div className="cb sy4">
              <div style={{padding:"16px 18px",borderRadius:"var(--rl)",background:"#fff",border:"1px solid var(--bdr)"}}>
                <div className="row g3 mb4">
                  <div style={{width:44,height:44,borderRadius:"50%",background:"var(--okl)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic n="check" sz={20} color="var(--ok)"/></div>
                  <div>
                    <div className="bold" style={{fontSize:14}}>High Methodology Compliance</div>
                    <div className="tm xs">Last recalibrated: today · Estyn-aligned</div>
                  </div>
                </div>
                <div className="gr2">
                  {[{l:"Evidence Entries",v:`${n} Verified`},{l:"Drift Alerts",v:`${alerts.length} Logged`},{l:"Pupils",v:`${students.length} Enrolled`},{l:"Classroom",v:classroom?.name||"—"}].map(item=>(
                    <div key={item.l} style={{padding:"9px 12px",borderRadius:"var(--r)",background:"var(--bg)",border:"1px solid var(--bdr)"}}>
                      <div className="lbl">{item.l}</div><div className="bold sm">{item.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="lbl mb2">Statutory Proficiency Mapping</h3>
                {["Conceptual Understanding","Communication using Symbols","Fluency","Logical Reasoning","Strategic Competence"].map((p,i)=>{
                  const counts = [entries.filter(e=>e.reasoningScore>=70).length,entries.filter(e=>e.cpaDetected==="Abstract").length,entries.filter(e=>e.paceStatus==="On Track").length,entries.filter(e=>e.reasoningScore>=80).length,entries.filter(e=>e.methodUsed?.toLowerCase().includes("bar")).length];
                  const lvl = counts[i]>=20?"bok-b":counts[i]>=5?"bpri-b":"bwarn-b";
                  return (
                    <div key={p} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 13px",border:"1px solid var(--bdr)",borderRadius:"var(--r)",marginBottom:6,background:"#fff"}}>
                      <span style={{fontSize:13,fontWeight:500}}>{p}</span>
                      <span className={`badge ${lvl}`}>{counts[i]>=20?"Full Coverage":counts[i]>=5?"Substantial":"Emerging"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="ch"><div className="ctitle" style={{fontSize:14,display:"flex",alignItems:"center",gap:6}}><Ic n="history" sz={14} color="var(--tx3)"/>Evidence Log</div></div>
          <div className="cb">
            {logItems.length===0 ? (
              <p className="tm sm tc-bg" style={{padding:"18px 0"}}>Complete journal diagnostics and drift checks to populate the evidence log.</p>
            ) : logItems.map((item,i,arr)=>(
              <div key={i} className="row g3" style={{marginBottom:i<arr.length-1?12:0}}>
                <div className="colc">
                  <div style={{width:8,height:8,borderRadius:"50%",background:item.type==="ok"?"var(--ok)":"var(--warn)",marginTop:2,flexShrink:0}}/>
                  {i<arr.length-1 && <div style={{width:1,flex:1,background:"var(--bdr)",margin:"3px 0"}}/>}
                </div>
                <div style={{flex:1,paddingBottom:10}}>
                  <div className="tm xs bold" style={{textTransform:"uppercase"}}>{new Date(item.date).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</div>
                  <div className="bold sm">{item.event}</div>
                  <div className="tm xs">{item.who}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────
function Reports() {
  const { classroom, students, entries, alerts } = useApp();
  const { toast } = useToast();
  const [report,     setReport]     = useState(null);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    if (!classroom) return;
    setGenerating(true);
    try {
      const r = await generateReport({ classroom, students, entries, alerts });
      setReport(r);
    } catch(err) {
      toast({ variant:"destructive", title:"Report Generation Failed", description:err.message });
    } finally { setGenerating(false); }
  };

  const ratingColor = { Excellent:"var(--ok)", Good:"var(--pri)", Adequate:"var(--warn)", "Requires Improvement":"var(--err)" };

  return (
    <div className="fu">
      <div className="ph">
        <div className="pheye"><Ic n="reports" sz={12}/>AI Reports</div>
        <h1 className="phtitle">Term Summary Report</h1>
        <p className="phsub">AI-generated professional summary for governors, SLT, and Estyn</p>
      </div>

      {!classroom ? (
        <div className="card tc-bg" style={{padding:"60px 20px"}}>
          <Ic n="reports" sz={30} color="var(--tx4)" style={{display:"block",margin:"0 auto 12px"}}/>
          <p className="tm sm">Set up your classroom in Account → Organisation to generate reports.</p>
        </div>
      ) : (
        <>
          <div className="card mb4" style={{background:"linear-gradient(135deg,var(--surf),var(--pril))",border:"1px solid var(--pri2)"}}>
            <div className="cb">
              <div className="rowb" style={{flexWrap:"wrap",gap:12}}>
                <div>
                  <div style={{fontFamily:"var(--fh)",fontSize:18,marginBottom:4}}>{classroom.name}</div>
                  <p className="tm sm">{classroom.schoolName} · {classroom.academicYear}</p>
                  <div className="row g2 mt2">
                    {[{l:"Pupils",v:students.length},{l:"Evidence Entries",v:entries.length},{l:"Alerts",v:alerts.length}].map(s=>(
                      <div key={s.l} style={{padding:"5px 10px",borderRadius:8,background:"#fff",border:"1px solid var(--bdr)",fontSize:12}}>
                        <span className="bold">{s.v}</span> <span className="tm">{s.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="row g2">
                  <button className="btn bpri blg" onClick={generate} disabled={generating}>
                    {generating ? <><Spinner sz={14}/>Generating…</> : <><Ic n="sparkle" sz={15}/>Generate AI Report</>}
                  </button>
                  {report && <button className="btn bout" onClick={()=>window.print()}><Ic n="download" sz={14}/>Print Report</button>}
                </div>
              </div>
            </div>
          </div>

          {generating && (
            <div className="card tc-bg" style={{padding:"60px 20px"}}>
              <Spinner sz={32}/><p className="bold mt4" style={{fontSize:15}}>Generating term summary…</p>
              <p className="tm mt2 sm">AI is analysing class performance across all evidence</p>
            </div>
          )}

          {report && !generating && (
            <div className="card si">
              <div style={{background:"linear-gradient(135deg,var(--pri),var(--acc))",padding:"18px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{color:"rgba(255,255,255,.7)",fontSize:9.5,textTransform:"uppercase",letterSpacing:".1em",marginBottom:3}}>AI-Generated Term Summary</div>
                  <div style={{color:"#fff",fontFamily:"var(--fh)",fontSize:18}}>{classroom.name} · {classroom.academicYear}</div>
                </div>
                {report.estynReadiness && (
                  <div style={{textAlign:"center",padding:"8px 14px",background:"rgba(255,255,255,.18)",borderRadius:10,backdropFilter:"blur(4px)"}}>
                    <div style={{color:"rgba(255,255,255,.7)",fontSize:9,textTransform:"uppercase",letterSpacing:".08em"}}>Estyn Readiness</div>
                    <div style={{color:"#fff",fontWeight:800,fontSize:16,marginTop:2}}>{report.estynReadiness}</div>
                  </div>
                )}
              </div>
              <div className="cb sy6">
                <div>
                  <div className="lbl mb2">Executive Summary</div>
                  <p style={{fontSize:13.5,lineHeight:1.7,color:"var(--tx2)",padding:"14px 16px",background:"var(--surf2)",borderRadius:"var(--r)",border:"1px solid var(--bdr)"}}>{report.executiveSummary}</p>
                </div>
                <div className="gr2">
                  <div>
                    <div className="lbl mb2" style={{color:"var(--ok)"}}>✓ Strength Areas</div>
                    {report.strengthAreas?.map((s,i)=>(
                      <div key={i} className="astrip aok" style={{marginBottom:6,fontSize:12.5,padding:"9px 12px"}}>{s}</div>
                    ))}
                  </div>
                  <div>
                    <div className="lbl mb2" style={{color:"var(--warn)"}}>↗ Development Priorities</div>
                    {report.developmentPriorities?.map((p,i)=>(
                      <div key={i} className="astrip awarn" style={{marginBottom:6,fontSize:12.5,padding:"9px 12px"}}>{p}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="lbl mb2">Recommended Actions</div>
                  {report.recommendedActions?.map((a,i)=>(
                    <div key={i} style={{display:"flex",gap:10,padding:"9px 12px",borderRadius:"var(--r)",border:"1px solid var(--bdr)",marginBottom:7,background:"#fff"}}>
                      <div style={{width:20,height:20,borderRadius:"50%",background:"var(--pril)",color:"var(--pri)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0}}>{i+1}</div>
                      <span style={{fontSize:13,lineHeight:1.5}}>{a}</span>
                    </div>
                  ))}
                </div>
                {report.overallRating && (
                  <div style={{padding:"14px 16px",borderRadius:"var(--r)",background:"var(--surf2)",border:"1px solid var(--bdr)",display:"flex",alignItems:"center",gap:14}}>
                    <ScoreRing score={report.overallRating} size={54}/>
                    <div>
                      <div className="lbl">Overall Methodology Rating</div>
                      <div style={{fontFamily:"var(--fh)",fontSize:20,color:ratingColor[report.estynReadiness]||"var(--pri)"}}>{report.overallRating}/100</div>
                      <div className="tm xs">{report.estynReadiness} — Estyn readiness assessment</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── SECURITY TAB ────────────────────────────────────────────────────────────
function SecurityTab({ user, updateUser, deleteAccount, toast }) {
  const [mode, setMode] = useState("idle"); // idle | change
  const [pw, setPw] = useState({ current:"", next:"", confirm:"" });
  const [changing, setChanging] = useState(false);
  const { userDB } = useApp();

  const changePassword = () => {
    if (!pw.current) { toast({ variant:"destructive", title:"Enter your current password" }); return; }
    const stored = userDB[user?.email?.toLowerCase()];
    if (!stored || stored.password !== pw.current) { toast({ variant:"destructive", title:"Current password is incorrect" }); return; }
    if (pw.next.length < 6) { toast({ variant:"destructive", title:"New password must be at least 6 characters" }); return; }
    if (pw.next !== pw.confirm) { toast({ variant:"destructive", title:"Passwords do not match" }); return; }
    setChanging(true);
    // Update password in userDB via updateUser
    updateUser({ password: pw.next });
    setTimeout(() => {
      toast({ title:"Password Changed", description:"Your password has been updated successfully." });
      setPw({ current:"", next:"", confirm:"" });
      setMode("idle");
      setChanging(false);
    }, 400);
  };

  return (
    <div className="card fu">
      <div className="ch"><div className="ctitle" style={{fontSize:14.5,display:"flex",alignItems:"center",gap:6}}><Ic n="shield" sz={14} color="var(--ok)"/>Account Security</div></div>
      <div className="cb sy4">
        {/* Password change */}
        <div style={{padding:18,borderRadius:"var(--rl)",border:"1px solid var(--bdr)"}}>
          <div className="rowb mb3">
            <div className="row g3">
              <div style={{width:38,height:38,borderRadius:"50%",background:"var(--pril)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic n="lock" sz={17} color="var(--pri)"/></div>
              <div><div className="bold sm">Password</div><div className="tm xs">{mode==="idle"?"Change your account password":"Enter your current and new password"}</div></div>
            </div>
            {mode==="idle" && <button className="btn bout bsm" onClick={()=>setMode("change")}>Change Password</button>}
          </div>
          {mode==="change" && (
            <div className="sy3">
              <div className="ig" style={{marginBottom:0}}><label className="lbl">Current Password</label><input className="inp" type="password" value={pw.current} onChange={e=>setPw(p=>({...p,current:e.target.value}))} placeholder="Your current password"/></div>
              <div className="ig" style={{marginBottom:0}}><label className="lbl">New Password</label><input className="inp" type="password" value={pw.next} onChange={e=>setPw(p=>({...p,next:e.target.value}))} placeholder="At least 6 characters"/></div>
              <div className="ig" style={{marginBottom:0}}><label className="lbl">Confirm New Password</label><input className="inp" type="password" value={pw.confirm} onChange={e=>setPw(p=>({...p,confirm:e.target.value}))} placeholder="Repeat new password"/></div>
              {pw.next && pw.confirm && pw.next !== pw.confirm && (
                <div className="astrip aerr" style={{padding:"7px 11px",fontSize:12,marginBottom:0}}><Ic n="alert" sz={12}/>Passwords do not match</div>
              )}
              {pw.next && pw.next.length < 6 && <div className="astrip awarn" style={{padding:"7px 11px",fontSize:12,marginBottom:0}}><Ic n="alert" sz={12}/>Minimum 6 characters required</div>}
              <div className="row g2">
                <button className="btn bpri bsm" onClick={changePassword} disabled={changing}>{changing?<Spinner sz={12}/>:<Ic n="save" sz={12}/>}Save New Password</button>
                <button className="btn bghost bsm" onClick={()=>{setMode("idle");setPw({current:"",next:"",confirm:""});}}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Account info */}
        <div style={{padding:"12px 16px",borderRadius:"var(--rl)",border:"1px solid var(--bdr)",background:"var(--surf2)"}}>
          <div className="row g3">
            <div style={{width:38,height:38,borderRadius:"50%",background:"var(--okl)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic n="check" sz={17} color="var(--ok)"/></div>
            <div>
              <div className="bold sm">Signed in as</div>
              <div className="tm xs">{user?.email}</div>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div style={{padding:18,borderRadius:"var(--rl)",border:"1.5px solid var(--err)",background:"var(--errl)"}}>
          <div className="row g3 mb3">
            <div style={{width:38,height:38,borderRadius:"50%",background:"rgba(220,38,38,.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic n="trash" sz={17} color="var(--err)"/></div>
            <div><div className="bold sm terr">Danger Zone</div><div className="tm xs">Permanently delete your account and all data. Cannot be undone.</div></div>
          </div>
          <button className="btn berr bsm" onClick={deleteAccount}><Ic n="trash" sz={12}/>Delete My Account</button>
        </div>
      </div>
    </div>
  );
}

// ─── ACCOUNT ──────────────────────────────────────────────────────────────
function Account() {
  const { user, updateUser, deleteAccount, isAdmin, classroom, createClassroom, lang, toggleLang } = useApp();
  const { toast } = useToast();
  const [tab,     setTab]     = useState("profile");
  const [f,       setF]       = useState({ firstName:user?.firstName||"", lastName:user?.lastName||"", jobTitle:user?.jobTitle||"", emailAlerts:true, pushNotifs:false });
  const [editEnv, setEditEnv] = useState(!classroom);
  const [env,     setEnv]     = useState({ schoolId:classroom?.schoolId||"", className:classroom?.name||"" });
  const [delConf, setDelConf] = useState(false);
  const setFv = (k,v) => setF(p=>({...p,[k]:v}));

  const saveProfile = () => {
    updateUser({ firstName:f.firstName, lastName:f.lastName, jobTitle:f.jobTitle });
    toast({ title:"Profile Saved", description:"Your identity has been updated." });
  };

  const saveEnv = () => {
    if (!env.schoolId||!env.className.trim()) { toast({ variant:"destructive", title:"Please fill in all fields" }); return; }
    const sc = WELSH_SCHOOLS.find(s=>s.id===env.schoolId);
    updateUser({ schoolId:env.schoolId, schoolName:sc?.name, schoolLocation:sc?.location, classroomName:env.className });
    createClassroom({ name:env.className.trim(), schoolId:env.schoolId, schoolName:sc?.name, schoolLocation:sc?.location, academicYear:env.academicYear||"2024–2025" });
    toast({ title:"Environment Linked", description:`${sc?.name} — ${env.className} ready.` });
    setEditEnv(false);
  };

  const school = WELSH_SCHOOLS.find(s=>s.id===(user?.schoolId||classroom?.schoolId));

  return (
    <div className="fu" style={{maxWidth:760,margin:"0 auto"}}>
      <div className="ph">
        <div className="pheye"><Ic n="account" sz={12}/>Settings</div>
        <h1 className="phtitle">Your Account</h1>
        <p className="phsub">Manage your identity, preferences, and school context.</p>
      </div>

      {isAdmin && (
        <div className="astrip aacc">
          <Ic n="shield" sz={15} color="var(--acc)"/>
          <div><strong>Administrative Role Active.</strong> Global platform access and methodology write permissions.</div>
        </div>
      )}

      <div className="tabs">
        {[{id:"profile",l:"Profile"},{id:"prefs",l:"Preferences"},{id:"org",l:"Organisation"},{id:"sec",l:"Security"}].map(t=>(
          <button key={t.id} className={`tab${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)}>{t.l}</button>
        ))}
      </div>

      {tab==="profile" && (
        <div className="card fu">
          <div className="ch"><div className="ctitle" style={{fontSize:14.5}}>Personal Identity</div><div className="cdesc">Professional information across the platform.</div></div>
          <div className="cb">
            <div className="gr2">
              <div className="ig"><label className="lbl">First Name</label><input className="inp" value={f.firstName} onChange={e=>setFv("firstName",e.target.value)}/></div>
              <div className="ig"><label className="lbl">Last Name</label><input className="inp" value={f.lastName} onChange={e=>setFv("lastName",e.target.value)}/></div>
            </div>
            <div className="ig"><label className="lbl">Email Address</label><input className="inp" value={user?.email||""} disabled/></div>
            <div className="ig">
              <label className="lbl">Job Title</label>
              <select className="inp sel" value={f.jobTitle} onChange={e=>setFv("jobTitle",e.target.value)}>
                <option value="">Select role…</option>
                <option>Teacher</option><option>Management (Head / Deputy)</option><option>Classroom Assistant</option><option>SENCO</option><option>Subject Leader</option>
              </select>
            </div>
            <button className="btn bpri" onClick={saveProfile}><Ic n="save" sz={13}/>Save Profile</button>
          </div>
        </div>
      )}

      {tab==="prefs" && (
        <div className="card fu">
          <div className="ch"><div className="ctitle" style={{fontSize:14.5}}>Interface &amp; Localisation</div></div>
          <div className="cb">
            <div className="ig">
              <label className="lbl" style={{display:"block",marginBottom:10}}>Language Preference</label>
              <div className="row g3">
                <button className={`btn ${lang==="en"?"bpri":"bout"}`} style={{height:38}} onClick={()=>lang!=="en"&&toggleLang()}>🇬🇧 UK English</button>
                <button className={`btn ${lang==="cy"?"bpri":"bout"}`} style={{height:38}} onClick={()=>lang!=="cy"&&toggleLang()}>🏴󠁧󠁢󠁷󠁬󠁳󠁿 Cymraeg</button>
              </div>
            </div>
            <div className="divider"/>
            <h3 className="lbl mb3">Notification Preferences</h3>
            {[
              {k:"emailAlerts",  l:"Email Drift Alerts",  d:"Critical methodology drift alerts and weekly summaries sent to your email."},
              {k:"pushNotifs",   l:"Push Notifications",  d:"Real-time alerts when journal diagnostics complete processing."},
            ].map(item=>(
              <div key={item.k} className="rowb mb4">
                <div><div className="bold sm">{item.l}</div><div className="tm xs" style={{maxWidth:340,marginTop:2}}>{item.d}</div></div>
                <Sw checked={f[item.k]} onChange={v=>setFv(item.k,v)}/>
              </div>
            ))}
            <button className="btn bpri bsm" onClick={()=>toast({ title:"Preferences Saved" })}><Ic n="save" sz={12}/>Save Preferences</button>
          </div>
        </div>
      )}

      {tab==="org" && (
        <div className="card fu">
          <div className="ch rowb">
            <div><div className="ctitle" style={{fontSize:14.5}}>School &amp; Classroom</div><div className="cdesc">Your teaching environment context</div></div>
            {!isAdmin && classroom && (
              <button className="btn bout bsm" onClick={()=>setEditEnv(e=>!e)}>{editEnv?"Cancel":"Edit Environment"}</button>
            )}
          </div>
          <div className="cb">
            {editEnv || !classroom ? (
              <div style={{padding:16,background:"var(--pril)",borderRadius:"var(--r)",border:"1px solid var(--pri2)"}}>
                <p className="tm xs mb3" style={{lineHeight:1.5}}>Link your school and classroom to unlock all Mastery Companion features.</p>
                <div className="ig">
                  <label className="lbl" style={{color:"var(--pri)"}}>School / Institution *</label>
                  <select className="inp sel" value={env.schoolId} onChange={e=>setEnv(p=>({...p,schoolId:e.target.value}))}>
                    <option value="">Select school…</option>
                    {WELSH_SCHOOLS.map(s=><option key={s.id} value={s.id}>{s.name} – {s.location}</option>)}
                  </select>
                </div>
                <div className="ig" style={{marginBottom:14}}>
                  <label className="lbl" style={{color:"var(--pri)"}}>Classroom / Group Name *</label>
                  <input className="inp" placeholder="e.g. Year 5 Maths – Set A" value={env.className} onChange={e=>setEnv(p=>({...p,className:e.target.value}))}/>
                </div>
                <div className="ig" style={{marginBottom:14}}>
                  <label className="lbl" style={{color:"var(--pri)"}}>Academic Year</label>
                  <select className="inp sel" value={env.academicYear||"2024–2025"} onChange={e=>setEnv(p=>({...p,academicYear:e.target.value}))}>
                    <option>2023–2024</option><option>2024–2025</option><option>2025–2026</option><option>2026–2027</option>
                  </select>
                </div>
                <button className="btn bpri w100" onClick={saveEnv}><Ic n="graduation" sz={13}/>Link Environment</button>
              </div>
            ) : (
              <>
                <div style={{padding:"14px 16px",background:"var(--pril)",borderRadius:"var(--r)",marginBottom:13,border:"1px solid var(--pri2)"}}>
                  <div className="lbl">Institution</div>
                  <div className="bold" style={{fontSize:19,marginBottom:2}}>{school?.name||classroom?.schoolName||"—"}</div>
                  <div className="tm sm">{school?.location||classroom?.schoolLocation||"Wales, UK"}</div>
                  <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(42,122,181,.15)"}}>
                    <div className="lbl">Primary Classroom</div>
                    <div className="bold">{classroom.name}</div>
                    <div className="tm xs ital">Academic Year: {classroom.academicYear}</div>
                  </div>
                </div>
                <div className="gr2">
                  {[{l:"Role",v:isAdmin?"Site Administrator":(user?.jobTitle||"Teacher")},{l:"Permissions",v:isAdmin?"Root Access":"Full Methodology Write"}].map(item=>(
                    <div key={item.l} style={{padding:"10px 13px",borderRadius:"var(--r)",background:"var(--bg)",border:"1px solid var(--bdr)"}}>
                      <div className="lbl">{item.l}</div><div className="bold sm">{item.v}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab==="sec" && (
        <SecurityTab user={user} updateUser={updateUser} deleteAccount={()=>setDelConf(true)} toast={toast}/>
      )}

      <Confirm open={delConf} onClose={()=>setDelConf(false)} onConfirm={deleteAccount} title="Delete Account?" desc="This will permanently delete your account and all data. This action cannot be undone." danger/>
    </div>
  );
}

// ─── TRANSLATION ADMIN ────────────────────────────────────────────────────
function Admin() {
  const { transl, setTranslation, isAdmin } = useApp();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [edits,  setEdits]  = useState({});
  const [saved,  setSaved]  = useState({});

  if (!isAdmin) return (
    <div className="fu tc-bg" style={{padding:"80px 0"}}>
      <Ic n="lock" sz={32} color="var(--tx4)" style={{display:"block",margin:"0 auto 14px"}}/>
      <h2 style={{fontFamily:"var(--fh)",fontSize:19,marginBottom:7}}>Access Restricted</h2>
      <p className="tm sm">This page requires site administrator privileges.</p>
    </div>
  );

  const keys = Object.keys(transl).filter(k =>
    !search ||
    k.toLowerCase().includes(search.toLowerCase()) ||
    transl[k].en.toLowerCase().includes(search.toLowerCase()) ||
    (transl[k].cy||"").toLowerCase().includes(search.toLowerCase())
  );

  const setEdit = (k, lang, val) => setEdits(p => ({ ...p, [k]: { ...transl[k], ...p[k], [lang]: val } }));

  const save = (k) => {
    const d = { ...transl[k], ...edits[k] };
    setTranslation(k, d.en, d.cy);
    setSaved(p => ({...p,[k]:true}));
    setTimeout(()=>setSaved(p=>({...p,[k]:false})),2000);
    toast({ title:"Translation Saved", description:`'${k}' updated live across the platform.` });
  };

  return (
    <div className="fu">
      <div className="ph">
        <div className="pheye" style={{color:"var(--err)"}}><Ic n="admin" sz={12} color="var(--err)"/>Site Administration</div>
        <h1 className="phtitle">Translation Dictionary</h1>
        <p className="phsub">Edit English &amp; Welsh keys — changes apply live across the platform.</p>
      </div>

      <div className="astrip awarn">
        <Ic n="alert" sz={15}/><div><strong>Admin only.</strong> Dynamic updates take priority over defaults. Changes are immediate and persistent for this session.</div>
      </div>

      <div className="card">
        <div className="ch rowb">
          <div><div className="ctitle" style={{fontSize:15}}>Translation Keys ({keys.length})</div><div className="cdesc">{Object.keys(transl).length} total keys in the platform</div></div>
          <div style={{position:"relative",width:210}}>
            <Ic n="search" sz={13} color="var(--tx3)" style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)"}}/>
            <input className="inp" style={{paddingLeft:30,fontSize:12.5}} placeholder="Search keys…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
        </div>
        <div className="tw">
          <table className="tbl">
            <thead><tr><th style={{width:100}}>Key</th><th>English (UK)</th><th>Welsh (Cymraeg)</th><th style={{width:80,textAlign:"right"}}>Action</th></tr></thead>
            <tbody>
              {keys.map(k=>{
                const cur={...transl[k],...edits[k]};
                return (
                  <tr key={k}>
                    <td><span className="badge bout-b" style={{fontFamily:"monospace",fontSize:9}}>{k}</span></td>
                    <td><input className="inp" style={{fontSize:12.5}} value={cur.en||""} onChange={e=>setEdit(k,"en",e.target.value)}/></td>
                    <td><input className="inp" style={{fontSize:12.5}} value={cur.cy||""} onChange={e=>setEdit(k,"cy",e.target.value)}/></td>
                    <td style={{textAlign:"right"}}>
                      <button className={`btn bsm ${saved[k]?"bok":"bpri"}`} onClick={()=>save(k)} style={{minWidth:58}}>
                        {saved[k]?<><Ic n="check" sz={11}/>Saved</>:<><Ic n="save" sz={11}/>Save</>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── LONGITUDINAL PROFILE ─────────────────────────────────────────────────
function LongitudinalProfile() {
  const { students, entries } = useApp();
  const { toast } = useToast();
  const [selStudent, setSelStudent] = useState(students[0]?.id || "");
  const [profile,    setProfile]    = useState(null);
  const [generating, setGenerating] = useState(false);

  const student      = students.find(s => s.id === selStudent);
  const pupilEntries = entries.filter(e => e.studentId === selStudent).sort((a,b)=>new Date(a.captureDate)-new Date(b.captureDate));

  const generate = async () => {
    if (!student) return;
    if (pupilEntries.length < 1) { toast({ variant:"destructive", title:"No entries yet", description:"At least one approved diagnostic entry is needed." }); return; }
    setGenerating(true);
    setProfile(null);
    try {
      const p = await generateLongitudinalProfile({ student, entries: pupilEntries });
      setProfile(p);
    } catch(err) {
      toast({ variant:"destructive", title:"Profile Generation Failed", description:err.message });
    } finally { setGenerating(false); }
  };

  const sparkPoints = (() => {
    if (pupilEntries.length < 2) return "";
    const W=260,H=60,pad=4;
    const scores=pupilEntries.map(e=>e.reasoningScore);
    const min=Math.min(...scores),max=Math.max(...scores),range=max-min||1;
    return pupilEntries.map((e,i)=>{
      const x=pad+i*(W-pad*2)/(pupilEntries.length-1);
      const y=H-pad-((e.reasoningScore-min)/range)*(H-pad*2);
      return `${x},${y}`;
    }).join(" ");
  })();

  const trajColor = { Accelerating:"var(--ok)", Steady:"var(--pri)", Plateauing:"var(--warn)", Declining:"var(--err)" };
  const cpaColors = { concrete:"#F97316", pictorial:"#3B82F6", transitioning:"#8B5CF6", abstract:"#10B981" };

  return (
    <div className="fu">
      <div className="ph">
        <div className="pheye"><Ic n="brain" sz={12}/>Longitudinal Profiling</div>
        <h1 className="phtitle">Big Picture Profile</h1>
        <p className="phsub">AI-aggregated semester arc — built from all approved diagnostic entries per pupil</p>
      </div>

      {students.length === 0 ? (
        <div className="card tc-bg" style={{padding:"60px 20px"}}>
          <Ic n="brain" sz={30} color="var(--tx4)" style={{display:"block",margin:"0 auto 12px"}}/>
          <p className="tm sm">Add pupils in Mastery Tracking before generating profiles.</p>
        </div>
      ) : (
        <>
          <div className="card mb4">
            <div className="cb">
              <div className="row g3" style={{flexWrap:"wrap",alignItems:"flex-end"}}>
                <div style={{flex:"1 1 220px"}}>
                  <label className="lbl">Select Pupil</label>
                  <select className="inp sel" value={selStudent} onChange={e=>{setSelStudent(e.target.value);setProfile(null);}}>
                    {students.map(s=>(
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({entries.filter(x=>x.studentId===s.id).length} entries)</option>
                    ))}
                  </select>
                </div>
                <button className="btn bpri" style={{height:38}} onClick={generate} disabled={generating||!student}>
                  {generating?<><Spinner sz={13}/>Generating…</>:<><Ic n="sparkle" sz={13}/>Generate Big Picture</>}
                </button>
              </div>
            </div>
          </div>

          {student && (
            <div className="stats mb4">
              {[
                {l:"Entries",      v:pupilEntries.length},
                {l:"Module",       v:`M${(student.moduleIdx||0)+1}`},
                {l:"Avg Score",    v:pupilEntries.length?Math.round(pupilEntries.reduce((a,e)=>a+e.reasoningScore,0)/pupilEntries.length)+"%":"—"},
                {l:"On Track",     v:pupilEntries.length?Math.round(pupilEntries.filter(e=>e.paceStatus==="On Track").length/pupilEntries.length*100)+"%":"—"},
              ].map(s=>(
                <div key={s.l} className="stat"><div className="sv">{s.v}</div><div className="sl">{s.l}</div></div>
              ))}
            </div>
          )}

          {pupilEntries.length>=2 && (
            <div className="card mb4">
              <div className="ch"><div className="ctitle" style={{fontSize:13.5}}>Reasoning Score Timeline</div><div className="cdesc">{pupilEntries.length} entries</div></div>
              <div className="cb">
                <svg viewBox="0 0 260 64" style={{width:"100%",maxWidth:540,height:64,display:"block"}}>
                  <polyline points={sparkPoints} fill="none" stroke="var(--pri)" strokeWidth="2" strokeLinejoin="round"/>
                  {pupilEntries.map((e,i)=>{
                    const W=260,H=60,pad=4;
                    const scores=pupilEntries.map(x=>x.reasoningScore);
                    const min=Math.min(...scores),max=Math.max(...scores),range=max-min||1;
                    const x=pad+i*(W-pad*2)/(pupilEntries.length-1);
                    const y=H-pad-((e.reasoningScore-min)/range)*(H-pad*2);
                    return <circle key={e.id} cx={x} cy={y} r="3.5" fill="var(--pri)" stroke="#fff" strokeWidth="1.5"><title>{e.reasoningScore}% — {new Date(e.captureDate).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</title></circle>;
                  })}
                </svg>
                <div className="rowb" style={{marginTop:2}}>
                  <span className="tm xs">{new Date(pupilEntries[0]?.captureDate).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</span>
                  <span className="tm xs">{new Date(pupilEntries[pupilEntries.length-1]?.captureDate).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</span>
                </div>
              </div>
            </div>
          )}

          {generating && (
            <div className="card tc-bg" style={{padding:"60px 20px"}}>
              <Spinner sz={32}/><p className="bold mt4" style={{fontSize:15}}>Building Big Picture Profile…</p>
              <p className="tm mt2 sm">Aggregating {pupilEntries.length} diagnostic entries across the semester</p>
            </div>
          )}

          {profile && !generating && (
            <div className="sy4">
              <div className="card si" style={{border:`2px solid ${trajColor[profile.overallTrajectory]||"var(--pri)"}`}}>
                <div style={{background:`linear-gradient(135deg,${trajColor[profile.overallTrajectory]||"var(--pri)"},var(--pri))`,padding:"16px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                  <div>
                    <div style={{color:"rgba(255,255,255,.7)",fontSize:9.5,textTransform:"uppercase",letterSpacing:".1em",marginBottom:3}}>Big Picture — {student?.firstName} {student?.lastName}</div>
                    <div style={{color:"#fff",fontFamily:"var(--fh)",fontSize:20}}>Trajectory: {profile.overallTrajectory}</div>
                  </div>
                  <div className="row g2" style={{flexWrap:"wrap"}}>
                    {[
                      {l:"Confidence",v:`${profile.confidenceIndex}/100`},
                      {l:"Engagement",v:profile.engagementTrend},
                      {l:"Next Module",v:profile.readinessForNextModule?"Ready":"Not Yet"},
                    ].map(x=>(
                      <div key={x.l} style={{textAlign:"center",padding:"8px 12px",background:"rgba(255,255,255,.18)",borderRadius:10,backdropFilter:"blur(4px)"}}>
                        <div style={{color:"rgba(255,255,255,.65)",fontSize:9,textTransform:"uppercase",letterSpacing:".06em"}}>{x.l}</div>
                        <div style={{color:"#fff",fontWeight:700,fontSize:14,marginTop:2}}>{x.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="cb">
                  <p style={{fontSize:13.5,lineHeight:1.75,color:"var(--tx2)",padding:"12px 14px",background:"var(--surf2)",borderRadius:"var(--r)",border:"1px solid var(--bdr)"}}>{profile.growthSummary}</p>
                </div>
              </div>

              {profile.cpaProgression && (
                <div className="card">
                  <div className="ch"><div className="ctitle" style={{fontSize:14}}>CPA Stage Distribution</div><div className="cdesc">Across all approved entries</div></div>
                  <div className="cb">
                    {Object.entries(profile.cpaProgression).map(([stage,count])=>{
                      const total=Object.values(profile.cpaProgression).reduce((a,b)=>a+b,0)||1;
                      const pct=Math.round(count/total*100);
                      return (
                        <div key={stage} style={{marginBottom:12}}>
                          <div className="rowb mb1">
                            <span style={{fontSize:13,fontWeight:600,textTransform:"capitalize"}}>{stage}</span>
                            <span style={{fontSize:12,color:"var(--tx3)"}}>{count} entries · {pct}%</span>
                          </div>
                          <div style={{height:8,background:"var(--surf2)",borderRadius:999,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${pct}%`,background:cpaColors[stage]||"var(--pri)",borderRadius:999}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {profile.semesterArc && (
                <div className="card">
                  <div className="ch"><div className="ctitle" style={{fontSize:14}}>Semester Arc</div><div className="cdesc">Start → Middle → Now</div></div>
                  <div className="cb"><p style={{fontSize:13,lineHeight:1.75,color:"var(--tx2)"}}>{profile.semesterArc}</p></div>
                </div>
              )}

              <div className="gr2" style={{alignItems:"start"}}>
                <div className="card">
                  <div className="ch"><div className="ctitle" style={{fontSize:14,color:"var(--ok)"}}>✓ Persistent Strengths</div></div>
                  <div className="cb sy2">
                    {(profile.persistentStrengths||[]).length ? profile.persistentStrengths.map((s,i)=>(
                      <div key={i} className="astrip aok" style={{fontSize:12.5,padding:"8px 12px",marginBottom:0}}>{s}</div>
                    )) : <p className="tm sm">None identified yet.</p>}
                  </div>
                </div>
                <div className="card">
                  <div className="ch"><div className="ctitle" style={{fontSize:14,color:"var(--err)"}}>⚠ Recurring Misconceptions</div></div>
                  <div className="cb sy2">
                    {(profile.recurringMisconceptions||[]).length ? profile.recurringMisconceptions.map((m,i)=>(
                      <div key={i} className="astrip aerr" style={{fontSize:12.5,padding:"8px 12px",marginBottom:0}}>{m}</div>
                    )) : <div className="astrip aok" style={{fontSize:12.5,padding:"8px 12px",marginBottom:0}}>No recurring misconceptions detected.</div>}
                  </div>
                </div>
              </div>

              <div className="gr2" style={{alignItems:"start"}}>
                <div className="card">
                  <div className="ch"><div className="ctitle" style={{fontSize:14}}>Predicted Next Challenge</div></div>
                  <div className="cb"><div className="astrip awarn" style={{fontSize:13,lineHeight:1.6,marginBottom:0}}><Ic n="alert" sz={14}/>{profile.predictedNextChallenge||"—"}</div></div>
                </div>
                <div className="card">
                  <div className="ch"><div className="ctitle" style={{fontSize:14}}>Recommended Focus</div></div>
                  <div className="cb"><div className="astrip ainfo" style={{fontSize:13,lineHeight:1.6,marginBottom:0}}><Ic n="info" sz={14}/>{profile.recommendedFocus||"—"}</div></div>
                </div>
              </div>

              {(profile.teacherRecommendations||[]).length>0 && (
                <div className="card">
                  <div className="ch"><div className="ctitle" style={{fontSize:14}}>Teacher Recommendations</div></div>
                  <div className="cb sy3">
                    {profile.teacherRecommendations.map((r,i)=>(
                      <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 13px",borderRadius:"var(--r)",border:"1px solid var(--bdr)",background:"#fff"}}>
                        <div style={{width:22,height:22,borderRadius:"50%",background:"var(--pril)",color:"var(--pri)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0,marginTop:1}}>{i+1}</div>
                        <span style={{fontSize:13,lineHeight:1.55}}>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card">
                <div className="ch"><div className="ctitle" style={{fontSize:14}}>Full Entry History</div><div className="cdesc">{pupilEntries.length} entries</div></div>
                <div className="tw">
                  <table className="tbl">
                    <thead><tr><th>Date</th><th>Lesson</th><th>CPA</th><th>Score</th><th>Pace</th><th>Method</th></tr></thead>
                    <tbody>
                      {pupilEntries.map(e=>(
                        <tr key={e.id}>
                          <td className="tm xs">{new Date(e.captureDate).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"2-digit"})}</td>
                          <td className="trunc tm" style={{fontSize:12,maxWidth:120}}>{e.lessonTitle}</td>
                          <td><span className="badge bacc-b" style={{fontSize:9}}>{e.cpaDetected}</span></td>
                          <td><ScoreRing score={e.reasoningScore} size={32}/></td>
                          <td><span className={`badge ${e.paceStatus==="On Track"?"bok-b":e.paceStatus==="Drifting"?"berr-b":"bwarn-b"}`} style={{fontSize:9}}>{e.paceStatus}</span></td>
                          <td className="tm xs">{e.methodUsed||"—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!profile && !generating && pupilEntries.length>=1 && (
            <div className="card tc-bg" style={{padding:"40px 20px",border:"2px dashed var(--bdr)"}}>
              <Ic n="brain" sz={30} color="var(--tx4)" style={{display:"block",margin:"0 auto 12px"}}/>
              <p className="bold mb1" style={{fontSize:14}}>Ready to profile {student?.firstName}</p>
              <p className="tm sm mb4">{pupilEntries.length} diagnostic {pupilEntries.length===1?"entry":"entries"} available.</p>
              <button className="btn bpri bsm" onClick={generate}><Ic n="sparkle" sz={13}/>Generate Profile</button>
            </div>
          )}

          {!profile && !generating && pupilEntries.length===0 && (
            <div className="card tc-bg" style={{padding:"40px 20px",border:"2px dashed var(--bdr)"}}>
              <Ic n="camera" sz={30} color="var(--tx4)" style={{display:"block",margin:"0 auto 12px"}}/>
              <p className="tm sm">No journal entries yet for {student?.firstName}. Capture diagnostics in the Journal tab first.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── SHELL ────────────────────────────────────────────────────────────────
function Shell() {
  const { user, sideOpen, setSideOpen } = useApp();
  const [page,   setPage]   = useState("dashboard");
  const [authed, setAuthed] = useState(false);

  if (!user && !authed) return <Login onDone={()=>setAuthed(true)}/>;

  const go = (p) => { setPage(p); setSideOpen(false); };

  const pages = {
    dashboard:   <Dashboard go={go}/>,
    planning:    <Planning/>,
    journal:     <Journal/>,
    mastery:     <Mastery/>,
    profiles:    <LongitudinalProfile/>,
    curriculum:  <Curriculum/>,
    inspection:  <Inspection/>,
    reports:     <Reports/>,
    account:     <Account/>,
    admin:       <Admin/>,
  };

  const pageTitles = { dashboard:"Dashboard", planning:"Lesson Planning", journal:"Journal Capture", mastery:"Mastery Tracking", profiles:"Big Picture Profiles", curriculum:"Curriculum Alignment", inspection:"Inspection Proof", reports:"Reports", account:"Account", admin:"Admin" };

  return (
    <div className="shell">
      <style>{CSS}</style>
      {/* Mobile top bar */}
      <div className="topbar">
        <button className="btn bghost bico" onClick={()=>setSideOpen(s=>!s)} style={{padding:6}}><Ic n="menu" sz={18}/></button>
        <span className="topbar-title">Mastery Companion</span>
      </div>
      {/* Overlay for mobile sidebar */}
      {sideOpen && <div onClick={()=>setSideOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:99}} className="sb-overlay"/>}
      <Sidebar page={page} go={go}/>
      <main className={`main${sideOpen?"":" "}`}>
        {user?.email==="demo@mastery.wales" && (
          <div style={{background:"linear-gradient(90deg,#7B6EE7,#5B50C7)",padding:"8px 16px",margin:"-28px -30px 24px",display:"flex",alignItems:"center",gap:9,flexWrap:"wrap"}}>
            <Ic n="sparkle" sz={13} color="rgba(255,255,255,.8)"/>
            <span style={{color:"#fff",fontSize:12.5,fontWeight:600}}>Sandbox Demo Mode</span>
            <span style={{color:"rgba(255,255,255,.7)",fontSize:12}}>— Data is in-memory only and will reset on refresh. Register a free account to save your work.</span>
          </div>
        )}
        <div key={page} className="fu">
          {pages[page] || pages.dashboard}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Provider>
      <ToastProvider>
        <style>{CSS}</style>
        <Shell/>
      </ToastProvider>
    </Provider>
  );
}
