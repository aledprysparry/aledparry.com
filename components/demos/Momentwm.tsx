"use client";

/* ============================================================
   Momentwm – the Welsh editorial radar, reimagined.
   Not a dashboard: a warm, image-led daily almanac.
   Heddiw (today's moment) -> Darganfod (explore) -> Creu (make),
   with the old dense radar demoted to a "Radar" power-view.
   Self-contained read-only demo: renders a committed snapshot
   (./momentwm-snapshot.json) from the standalone app. Scoped
   styling (.mw-root) so it never touches the rest of the site.
   ============================================================ */
import { useMemo, useState } from "react";
import snapshot from "./momentwm-snapshot.json";

interface Opp {
  candidate: { eventTitle: string; sourceUrl: string; sourceName: string; confidence: number; imageUrl?: string };
  anniversary: { anniversaryType: string; windowLabel: string; occursOn: string | null; occursYear: number; isRound: boolean; milestoneYear: number };
  welshRelevance: { score: number; tags: string[] };
  editorial: { score: number };
  sensitivity: { severity: "none" | "caution" | "high"; handling: string };
  suggestedUse: string[];
  horizon: string;
  drafts?: {
    brief?: { whyNow: string };
    quiz?: { questionCy: string; answer: string } | null;
    heno?: { hookCy: string; treatmentCy: string };
    pitch?: { loglineCy: string; format: string };
    blocked?: string[];
  };
}

interface NewsItem { source: string; title: string; link: string; dateISO: string | null }

const data = snapshot as unknown as {
  today: string;
  stats: { shortlisted: number; filteredLowValue: number; sensitiveFlagged: number };
  opportunities: Opp[];
  news?: NewsItem[];
};

const MONTHS_CY = ["Ionawr", "Chwefror", "Mawrth", "Ebrill", "Mai", "Mehefin", "Gorffennaf", "Awst", "Medi", "Hydref", "Tachwedd", "Rhagfyr"];
function welshDate(iso: string) { const [y, m, d] = iso.split("-").map(Number); return `${d} ${MONTHS_CY[m - 1]} ${y}`; }
function agoWelsh(milestone: number) {
  const named: Record<number, string> = { 25: "Chwarter canrif yn ôl", 50: "Hanner canrif yn ôl", 100: "Canmlwyddiant", 150: "Cant a hanner o flynyddoedd yn ôl", 200: "Daucanmlwyddiant" };
  return named[milestone] ?? `${milestone} mlynedd yn ôl`;
}
function welshWhen(occursOn: string | null, occursYear: number) { return occursOn ? welshDate(occursOn) : `yn ${occursYear}`; }
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/* ── Heddiw ─────────────────────────────────────────────────────────────── */
function HeddiwView({ moments, onCreu }: { moments: Opp[]; onCreu: (o: Opp) => void }) {
  const [index, setIndex] = useState(0);
  const [why, setWhy] = useState(false);
  if (moments.length === 0) return <div className="mw-heddiw mw-light"><div className="mw-bg none" /><div className="mw-hd-body"><h1 className="mw-hd-title">Dim stori heddiw.</h1></div></div>;
  const m = moments[index % moments.length];
  const img = m.candidate.imageUrl;
  const sensitive = m.sensitivity.severity === "high";
  return (
    <div className={`mw-heddiw ${img ? "mw-dark" : "mw-light"}`}>
      <div className={`mw-bg ${img ? "" : "none"}`} style={img ? { backgroundImage: `url("${img}")` } : undefined} />
      <div className="mw-scrim" />
      {moments.length > 1 && <button className="mw-hd-next" onClick={() => { setWhy(false); setIndex((i) => (i + 1) % moments.length); }}>Stori nesaf &rarr;</button>}
      <div className="mw-hd-body" key={index}>
        <div className="mw-hd-kicker">Momentwm &middot; {welshDate(data.today)}</div>
        <div className="mw-hd-ago">{agoWelsh(m.anniversary.milestoneYear)}</div>
        <h1 className="mw-hd-title">{m.candidate.eventTitle}</h1>
        <div className="mw-hd-when">{welshWhen(m.anniversary.occursOn, m.anniversary.occursYear)}{sensitive ? " · er cof" : ""}</div>
        <div className="mw-hd-actions">
          <button className="mw-cta" onClick={() => onCreu(m)}>Creu &rarr;</button>
          <button className="mw-link" onClick={() => setWhy((s) => !s)}>Pam nawr?</button>
        </div>
        {why && (
          <div className="mw-pam">
            {sensitive && <div className="mw-sens">{m.sensitivity.handling}</div>}
            {m.welshRelevance.tags.length > 0 && <div className="mw-tags">{m.welshRelevance.tags.map((t) => <span className="mw-tag" key={t}>{t}</span>)}</div>}
            <p style={{ marginTop: 10 }}><a href={m.candidate.sourceUrl} target="_blank" rel="noreferrer">Ffynhonnell: {m.candidate.sourceName} &#8599;</a></p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Darganfod ──────────────────────────────────────────────────────────── */
function DarganfodView({ onOpen }: { onOpen: (o: Opp) => void }) {
  const soon = useMemo(() => data.opportunities.filter((o) => o.horizon === "year").slice(0, 12), []);
  const round = useMemo(() => data.opportunities.filter((o) => o.anniversary.isRound).slice(0, 12), []);
  const themes = useMemo(() => { const s = new Set<string>(); for (const o of data.opportunities) for (const t of o.welshRelevance.tags) s.add(t); return Array.from(s).sort(); }, []);
  const [theme, setTheme] = useState(themes[0] ?? "");
  const themed = useMemo(() => data.opportunities.filter((o) => o.welshRelevance.tags.includes(theme)).slice(0, 12), [theme]);
  const Card = ({ o }: { o: Opp }) => (
    <div className="mw-dg-card" onClick={() => onOpen(o)}>
      <div className={`mw-dg-thumb ${o.candidate.imageUrl ? "" : "none"}`} style={o.candidate.imageUrl ? { backgroundImage: `url("${o.candidate.imageUrl}")` } : undefined} />
      <div className="mw-dg-meta"><div className="mw-dg-when">{welshWhen(o.anniversary.occursOn, o.anniversary.occursYear)}</div><div className="mw-dg-title">{o.candidate.eventTitle}</div></div>
    </div>
  );
  const Row = ({ items }: { items: Opp[] }) => <div className="mw-dg-row">{items.map((o, i) => <Card key={i} o={o} />)}</div>;
  return (
    <div className="mw-darganfod">
      <h1 className="mw-dg-h">Darganfod</h1>
      <p className="mw-dg-sub">Pori trwy stori Cymru: yr hyn sydd ar ddod, a&apos;r hyn sy&apos;n cysylltu.</p>
      <section className="mw-dg-section"><h3>Eleni</h3><Row items={soon} /></section>
      <section className="mw-dg-section"><h3>Penblwyddi mawr</h3><Row items={round} /></section>
      {themes.length > 0 && (
        <section className="mw-dg-section">
          <h3>Yn ôl thema</h3>
          <div className="mw-dg-themes">{themes.map((t) => <button key={t} className={`mw-dg-theme ${t === theme ? "on" : ""}`} onClick={() => setTheme(t)}>{cap(t)}</button>)}</div>
          <Row items={themed} />
        </section>
      )}
    </div>
  );
}

/* ── Newyddion (live press surface) ─────────────────────────────────────── */
function NewyddionView() {
  const news = data.news ?? [];
  const when = (iso: string | null) => {
    if (!iso) return "";
    const day = iso.slice(0, 10);
    return day === data.today ? "Heddiw" : welshDate(day);
  };
  const sources = useMemo(() => Array.from(new Set(news.map((n) => n.source))), []);
  return (
    <div className="mw-newyddion">
      <header className="mw-ny-head">
        <div className="mw-ny-kicker">Yn fyw o&apos;r wasg Gymreig</div>
        <h1 className="mw-dg-h">Newyddion</h1>
        <p className="mw-ny-sub">Beth mae Cymru&apos;n ei drafod heddiw. Stori heddiw yw archif yfory &middot; bydd y radar yn dal y penblwyddi sy&apos;n tyfu o&apos;r straeon hyn.</p>
        {sources.length > 0 && <div className="mw-ny-srcs">{sources.map((s) => <span key={s} className="mw-ny-srctag">{s}</span>)}</div>}
      </header>
      {news.length === 0 ? (
        <div className="mw-ny-empty"><p>Dim penawdau wedi&apos;u nôl eto.</p></div>
      ) : (
        <ol className="mw-ny-list">
          {news.map((n, i) => (
            <li key={i} className="mw-ny-item">
              <a className="mw-ny-link" href={n.link} target="_blank" rel="noreferrer">
                <div className="mw-ny-meta"><span className="mw-ny-src">{n.source}</span>{when(n.dateISO) && <span className="mw-ny-date">{when(n.dateISO)}</span>}</div>
                <div className="mw-ny-title">{n.title}</div>
              </a>
            </li>
          ))}
        </ol>
      )}
      <p className="mw-ny-foot">Penawdau a dolenni&apos;n unig, yn uniongyrchol o ffrydiau cyhoeddedig y cyhoeddwyr. Nid ydym yn ailgynhyrchu erthyglau llawn.</p>
    </div>
  );
}

/* ── Radar (compact power-view) ─────────────────────────────────────────── */
function RadarView({ onOpen }: { onOpen: (o: Opp) => void }) {
  const [q, setQ] = useState("");
  const [min, setMin] = useState(45);
  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    return data.opportunities.filter((o) => o.editorial.score >= min && (!query || o.candidate.eventTitle.toLowerCase().includes(query)));
  }, [q, min]);
  return (
    <div className="mw-radar">
      <div className="mw-radar-bar">
        <h1 className="mw-dg-h" style={{ fontSize: 34 }}>Radar</h1>
        <input className="mw-search" placeholder="Chwilio..." value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="mw-minl">Sgôr &ge; {min}<input type="range" min={0} max={100} step={5} value={min} onChange={(e) => setMin(Number(e.target.value))} /></label>
        <span className="mw-count">{shown.length} stori</span>
      </div>
      <div className="mw-radar-grid">
        {shown.map((o, i) => {
          const sev = o.sensitivity.severity;
          return (
            <div key={i} className={`mw-rc ${sev === "high" ? "sens" : ""}`} onClick={() => onOpen(o)}>
              <div className="mw-rc-top">
                <span className="mw-rc-badge">{o.anniversary.isRound ? "★ " : ""}{o.anniversary.anniversaryType}</span>
                <span className="mw-rc-score">{o.editorial.score}</span>
              </div>
              <div className="mw-rc-when">{welshWhen(o.anniversary.occursOn, o.anniversary.occursYear)}</div>
              <div className="mw-rc-title">{o.candidate.eventTitle}</div>
              <div className="mw-rc-uses">{o.suggestedUse.slice(0, 4).map((u) => <span key={u} className="mw-rc-use">{u}</span>)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Creu ───────────────────────────────────────────────────────────────── */
function CreuSheet({ opp, onClose }: { opp: Opp; onClose: () => void }) {
  const d = opp.drafts;
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, text: string) => {
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch { ok = false; }
    if (!ok) {
      // Fallback for blocked Clipboard API / Permissions-Policy contexts.
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.top = "-1000px";
        ta.setAttribute("readonly", "");
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch { ok = false; }
    }
    if (ok) {
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600);
    }
  };
  const label = (key: string) => (copied === key ? "Copïwyd ✓" : "Copïo");
  return (
    <div className="mw-creu-back" onClick={onClose}>
      <div className="mw-creu" onClick={(e) => e.stopPropagation()}>
        <div className="mw-creu-top">
          <div><div className="mw-creu-k">Creu</div><h2>{opp.candidate.eventTitle}</h2></div>
          <button className="mw-creu-x" onClick={onClose} aria-label="Cau">&times;</button>
        </div>
        {d?.brief && <div className="mw-cr-block"><div className="mw-cr-k">Pam nawr</div><p className="meta">{d.brief.whyNow}</p></div>}
        {d?.quiz && <div className="mw-cr-block"><div className="mw-cr-k">Cwis Bob Dydd</div><p>{d.quiz.questionCy}</p><p className="meta">Ateb: {d.quiz.answer}</p><div className="mw-cr-actions"><button className="mw-cr-btn primary" onClick={() => copy("quiz", `${d?.quiz?.questionCy ?? ""} (${d?.quiz?.answer ?? ""})`)}>{label("quiz")}</button></div></div>}
        {d?.heno && <div className="mw-cr-block"><div className="mw-cr-k">Heno</div><p>{d.heno.hookCy}</p><p className="meta">{d.heno.treatmentCy}</p><div className="mw-cr-actions"><button className="mw-cr-btn" onClick={() => copy("heno", `${d?.heno?.hookCy ?? ""}: ${d?.heno?.treatmentCy ?? ""}`)}>{label("heno")}</button></div></div>}
        {d?.pitch && <div className="mw-cr-block"><div className="mw-cr-k">Pitch</div><p>{d.pitch.loglineCy}</p><p className="meta">{d.pitch.format}</p><div className="mw-cr-actions"><button className="mw-cr-btn" onClick={() => copy("pitch", d?.pitch?.loglineCy ?? "")}>{label("pitch")}</button></div></div>}
        {d?.blocked && d.blocked.length > 0 && <p className="mw-cr-blocked">Wedi&apos;i atal yn awtomatig (pwnc sensitif): {d.blocked.join(", ")}</p>}
        <p className="mw-cr-note">Cymraeg drafft (templed) yw hwn. Ffynhonnell: <a href={opp.candidate.sourceUrl} target="_blank" rel="noreferrer">{opp.candidate.sourceName} &#8599;</a></p>
      </div>
    </div>
  );
}

export default function Momentwm() {
  const [view, setView] = useState<"heddiw" | "darganfod" | "newyddion" | "radar">("heddiw");
  const [creu, setCreu] = useState<Opp | null>(null);
  const moments = useMemo(() => {
    return Array.from(data.opportunities).sort((a, b) => {
      const ai = a.candidate.imageUrl ? 0 : 1; const bi = b.candidate.imageUrl ? 0 : 1;
      return ai !== bi ? ai - bi : b.editorial.score - a.editorial.score;
    });
  }, []);
  return (
    <div className="mw-root">
      <style>{CSS}</style>
      {view === "heddiw" && <HeddiwView moments={moments} onCreu={setCreu} />}
      {view === "darganfod" && <DarganfodView onOpen={setCreu} />}
      {view === "newyddion" && <NewyddionView />}
      {view === "radar" && <RadarView onOpen={setCreu} />}
      <nav className="mw-nav">
        <button className={view === "heddiw" ? "on" : ""} onClick={() => setView("heddiw")}>Heddiw</button>
        <button className={view === "darganfod" ? "on" : ""} onClick={() => setView("darganfod")}>Darganfod</button>
        <button className={view === "newyddion" ? "on" : ""} onClick={() => setView("newyddion")}>Newyddion</button>
        <button className={view === "radar" ? "on" : ""} onClick={() => setView("radar")}>Radar</button>
      </nav>
      {creu && <CreuSheet opp={creu} onClose={() => setCreu(null)} />}
    </div>
  );
}

const CSS = `
.mw-root{--paper:#faf6ee;--paper-2:#f1e9db;--ink:#211e19;--ink-soft:#6f675b;--ink-faint:#9c9486;--rule:#e6ddcd;--red:#b23a2e;
  --serif:"Playfair Display",Georgia,serif;--sans:"Inter",ui-sans-serif,system-ui,sans-serif;--ease:cubic-bezier(.22,1,.36,1);
  height:100%;background:var(--paper);color:var(--ink);font-family:var(--sans);position:relative;overflow:hidden;}
.mw-root *{box-sizing:border-box;}
@keyframes mwrise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes mwfade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.mw-root *{animation:none!important}}
.mw-nav{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:40;display:flex;gap:4px;padding:5px;border-radius:999px;
  background:rgba(250,246,238,.85);backdrop-filter:blur(12px);border:1px solid var(--rule);box-shadow:0 6px 24px rgba(40,30,10,.14);}
.mw-nav button{font-family:var(--sans);font-size:13px;font-weight:500;padding:8px 16px;border:none;border-radius:999px;background:transparent;color:var(--ink-soft);cursor:pointer;transition:all .2s var(--ease);}
.mw-nav button:hover{color:var(--ink);}
.mw-nav button.on{background:var(--ink);color:var(--paper);}

.mw-heddiw{position:relative;height:100%;display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden;}
.mw-bg{position:absolute;inset:0;background-size:cover;background-position:center;transform:scale(1.04);animation:mwfade 1.2s var(--ease) both;}
.mw-bg.none{background:radial-gradient(120% 120% at 70% 10%,var(--paper-2),var(--paper) 60%);}
.mw-scrim{position:absolute;inset:0;background:linear-gradient(to top,rgba(20,16,10,.88) 0%,rgba(20,16,10,.42) 38%,rgba(20,16,10,.05) 70%);}
.mw-heddiw.mw-light .mw-scrim{background:linear-gradient(to top,rgba(250,246,238,.7),transparent 55%);}
.mw-hd-body{position:relative;z-index:2;padding:0 8vw 120px;max-width:1000px;animation:mwrise .9s var(--ease) both;}
.mw-heddiw.mw-dark .mw-hd-body{color:#fdfaf4;}
.mw-hd-kicker{font-size:12px;letter-spacing:.22em;text-transform:uppercase;font-weight:600;opacity:.82;margin-bottom:20px;}
.mw-hd-ago{font-family:var(--serif);font-size:clamp(20px,3.2vw,30px);font-style:italic;opacity:.92;margin-bottom:6px;}
.mw-hd-title{font-family:var(--serif);font-weight:500;font-size:clamp(40px,7vw,86px);line-height:1.03;letter-spacing:-.02em;margin:0 0 18px;max-width:16ch;}
.mw-hd-when{font-size:15px;opacity:.82;margin-bottom:22px;}
.mw-hd-actions{display:flex;align-items:center;gap:20px;flex-wrap:wrap;}
.mw-cta{font-family:var(--sans);font-size:16px;font-weight:600;padding:14px 30px;border-radius:999px;border:none;cursor:pointer;background:var(--red);color:#fff;transition:transform .2s var(--ease),filter .2s var(--ease);}
.mw-cta:hover{transform:translateY(-1px);filter:brightness(1.06);}
.mw-link{background:none;border:none;cursor:pointer;font-family:var(--sans);font-size:14px;color:inherit;opacity:.82;text-decoration:underline;text-underline-offset:3px;}
.mw-link:hover{opacity:1;}
.mw-hd-next{position:absolute;right:8vw;bottom:122px;z-index:2;background:none;border:none;cursor:pointer;font-family:var(--sans);font-size:13px;letter-spacing:.04em;color:inherit;opacity:.72;}
.mw-heddiw.mw-dark .mw-hd-next{color:#fdfaf4;}
.mw-hd-next:hover{opacity:1;}
.mw-pam{position:relative;z-index:2;margin:14px 0 0;font-size:14px;line-height:1.6;opacity:.9;max-width:60ch;}
.mw-pam a{color:inherit;text-decoration:underline;text-underline-offset:2px;}
.mw-tags{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;}
.mw-tag{font-size:11px;letter-spacing:.06em;text-transform:uppercase;padding:3px 9px;border-radius:999px;border:1px solid currentColor;opacity:.6;}
.mw-sens{margin-top:6px;font-size:13px;line-height:1.5;padding:10px 14px;border-radius:10px;background:rgba(178,58,46,.2);max-width:60ch;}

.mw-darganfod,.mw-radar{height:100%;overflow-y:auto;padding:64px 8vw 130px;}
.mw-dg-h{font-family:var(--serif);font-weight:500;font-size:clamp(30px,5vw,50px);letter-spacing:-.02em;margin:0 0 6px;}
.mw-dg-sub{color:var(--ink-soft);font-size:16px;margin:0 0 40px;}
.mw-dg-section{margin-bottom:44px;}
.mw-dg-section h3{font-family:var(--serif);font-size:22px;font-weight:500;margin:0 0 16px;}
.mw-dg-row{display:flex;gap:16px;overflow-x:auto;padding-bottom:8px;}
.mw-dg-card{flex:0 0 260px;cursor:pointer;background:#fff;border:1px solid var(--rule);border-radius:14px;overflow:hidden;transition:transform .2s var(--ease),box-shadow .2s var(--ease);}
.mw-dg-card:hover{transform:translateY(-3px);box-shadow:0 10px 30px rgba(40,30,10,.1);}
.mw-dg-thumb{height:130px;background-size:cover;background-position:center;background-color:var(--paper-2);}
.mw-dg-thumb.none{background:linear-gradient(135deg,var(--paper-2),#e8ddc9);}
.mw-dg-meta{padding:12px 14px;}
.mw-dg-when{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-faint);}
.mw-dg-title{font-family:var(--serif);font-size:17px;line-height:1.25;margin:4px 0 0;}
.mw-dg-themes{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px;}
.mw-dg-theme{font-size:13px;padding:7px 14px;border-radius:999px;border:1px solid var(--rule);background:#fff;color:var(--ink-soft);cursor:pointer;transition:all .18s var(--ease);}
.mw-dg-theme:hover,.mw-dg-theme.on{border-color:var(--ink);color:var(--ink);}

.mw-radar-bar{display:flex;align-items:center;gap:20px;flex-wrap:wrap;margin-bottom:28px;}
.mw-search{padding:9px 14px;font-size:14px;background:#fff;border:1px solid var(--rule);border-radius:999px;color:var(--ink);min-width:200px;}
.mw-search:focus{outline:none;border-color:var(--ink-soft);}
.mw-minl{font-size:13px;color:var(--ink-soft);display:flex;align-items:center;gap:10px;}
.mw-minl input{accent-color:var(--red);}
.mw-count{font-size:13px;color:var(--ink-faint);margin-left:auto;}
.mw-radar-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;}
.mw-rc{background:#fff;border:1px solid var(--rule);border-radius:14px;padding:16px;cursor:pointer;display:flex;flex-direction:column;gap:8px;transition:transform .18s var(--ease),box-shadow .18s var(--ease);}
.mw-rc:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(40,30,10,.08);}
.mw-rc.sens{border-left:3px solid var(--red);}
.mw-rc-top{display:flex;justify-content:space-between;align-items:center;}
.mw-rc-badge{font-size:11px;font-weight:600;color:var(--ink-soft);}
.mw-rc-score{font-size:13px;font-weight:700;color:var(--red);}
.mw-rc-when{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);}
.mw-rc-title{font-family:var(--serif);font-size:18px;line-height:1.2;}
.mw-rc-uses{display:flex;flex-wrap:wrap;gap:6px;margin-top:auto;}
.mw-rc-use{font-size:11px;padding:2px 8px;border-radius:999px;background:var(--paper-2);color:var(--ink-soft);}

.mw-creu-back{position:fixed;inset:0;z-index:50;background:rgba(20,16,10,.45);backdrop-filter:blur(3px);animation:mwfade .25s var(--ease) both;display:flex;align-items:flex-end;justify-content:center;}
.mw-creu{width:100%;max-width:680px;max-height:88%;overflow-y:auto;background:var(--paper);border-radius:22px 22px 0 0;padding:28px 32px 40px;animation:mwrise .35s var(--ease) both;}
.mw-creu-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;}
.mw-creu-k{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint);}
.mw-creu h2{font-family:var(--serif);font-weight:500;font-size:28px;line-height:1.1;margin:4px 0 22px;}
.mw-creu-x{background:none;border:none;font-size:26px;line-height:1;color:var(--ink-faint);cursor:pointer;}
.mw-creu-x:hover{color:var(--ink);}
.mw-cr-block{border-top:1px solid var(--rule);padding:18px 0;}
.mw-cr-k{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--red);font-weight:600;}
.mw-cr-block p{margin:8px 0 0;line-height:1.5;font-size:16px;}
.mw-cr-block .meta{color:var(--ink-soft);font-size:14px;}
.mw-cr-actions{display:flex;gap:10px;margin-top:12px;}
.mw-cr-btn{font-family:var(--sans);font-size:13px;font-weight:500;padding:8px 16px;border-radius:999px;border:1px solid var(--rule);background:#fff;color:var(--ink);cursor:pointer;}
.mw-cr-btn.primary{background:var(--ink);color:var(--paper);border-color:var(--ink);}
.mw-cr-note{font-size:12px;color:var(--ink-faint);margin-top:18px;line-height:1.5;}
.mw-cr-note a{color:inherit;}
.mw-cr-blocked{font-size:13px;color:var(--red);margin-top:12px;}
.mw-newyddion{height:100%;overflow-y:auto;padding:64px 8vw 130px;max-width:880px;margin:0 auto;}
.mw-ny-head{margin-bottom:30px;}
.mw-ny-kicker{font-size:12px;letter-spacing:.2em;text-transform:uppercase;font-weight:600;color:var(--red);margin-bottom:12px;}
.mw-ny-sub{color:var(--ink-soft);font-size:16px;line-height:1.55;margin:8px 0 16px;max-width:56ch;}
.mw-ny-srcs{display:flex;flex-wrap:wrap;gap:7px;}
.mw-ny-srctag{font-size:11px;letter-spacing:.04em;color:var(--ink-faint);border:1px solid var(--rule);border-radius:999px;padding:3px 10px;}
.mw-ny-list{list-style:none;margin:0;padding:0;border-top:1px solid var(--rule);}
.mw-ny-item{border-bottom:1px solid var(--rule);}
.mw-ny-link{display:block;padding:16px 4px;color:inherit;text-decoration:none;transition:padding-left .18s var(--ease);}
.mw-ny-link:hover{padding-left:12px;}
.mw-ny-link:hover .mw-ny-title{color:var(--red);}
.mw-ny-meta{display:flex;align-items:center;gap:10px;margin-bottom:5px;}
.mw-ny-src{font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;color:#2f6b66;}
.mw-ny-date{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-faint);}
.mw-ny-title{font-family:var(--serif);font-size:clamp(18px,2.2vw,22px);line-height:1.28;letter-spacing:-.01em;transition:color .18s var(--ease);}
.mw-ny-empty{padding:40px 0;color:var(--ink-soft);font-size:16px;}
.mw-ny-foot{margin-top:26px;font-size:12px;color:var(--ink-faint);line-height:1.55;max-width:60ch;}
@media (max-width:680px){.mw-hd-body{padding:0 6vw 120px;}.mw-darganfod,.mw-radar,.mw-newyddion{padding:48px 6vw 130px;}}
`;
