"use client";

/* ============================================================
   Momentwm – Editorial Intelligence Network (read-only demo)
   A Welsh editorial radar: anniversaries, centenaries and
   "why now" stories, scored for Welsh relevance + editorial
   usefulness, with a sensitivity gate and ready Cwis/Heno/pitch
   drafts. This portal demo renders a committed snapshot
   (components/demos/momentwm-snapshot.json) from the standalone
   app (github.com/aledprysparry/momentwm). Self-contained with a
   scoped dark theme (.mw-root) so it can't touch the rest of the site.
   Refresh the data: `npm run snapshot` in the momentwm repo, then
   copy src/data/opportunities.json here.
   ============================================================ */
import { useMemo, useState } from "react";
import snapshot from "./momentwm-snapshot.json";

type Severity = "none" | "caution" | "high";
interface Opp {
  candidate: { eventTitle: string; sourceUrl: string; sourceName: string; confidence: number };
  anniversary: { anniversaryType: string; windowLabel: string; occursOn: string | null; occursYear: number; isRound: boolean };
  welshRelevance: { score: number; tags: string[]; reasons: string[] };
  editorial: { score: number; reasons: string[] };
  sensitivity: { severity: Severity; handling: string; flags: string[] };
  suggestedUse: string[];
  horizon: string;
  drafts?: {
    quiz?: { questionCy: string; answer: string } | null;
    heno?: { hookCy: string; treatmentCy: string };
    pitch?: { loglineCy: string; format: string };
    blocked?: string[];
  };
}

const data = snapshot as unknown as {
  today: string;
  stats: { shortlisted: number; filteredLowValue: number; sensitiveFlagged: number };
  opportunities: Opp[];
};

const USE_LABEL: Record<string, string> = {
  quiz: "Cwis", heno: "Heno", social: "Social", pitch: "Pitch",
  documentary: "Doc", schools: "Schools", "themed-week": "Themed week",
};
const HORIZONS = ["all", "week", "month", "quarter", "year", "longrange"] as const;
const HLABEL: Record<string, string> = {
  all: "All", week: "This week", month: "This month", quarter: "This quarter", year: "This year", longrange: "Long-range",
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const band = (n: number) => (n >= 75 ? "high" : n >= 55 ? "mid" : "low");

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86_400_000);
}
function countdown(o: Opp, today: string) {
  const a = o.anniversary;
  if (a.occursOn) {
    const d = daysBetween(today, a.occursOn);
    if (d < 0) return "passed";
    if (d === 0) return "today";
    if (d < 31) return `in ${d} days`;
    if (d < 365) return `in ${Math.max(1, Math.round(d / 30))} months`;
    return `in ${(d / 365).toFixed(d / 365 < 2 ? 1 : 0)} years`;
  }
  const ty = Number(today.slice(0, 4));
  if (a.occursYear <= ty) return "this year";
  return a.occursYear - ty === 1 ? "next year" : `in ${a.occursYear - ty} years`;
}
function sevMeta(s: Severity) {
  if (s === "high") return { sym: "⚠", cls: "sev-high", label: "Sensitive – commemorative only" };
  if (s === "caution") return { sym: "·", cls: "sev-caution", label: "Handle with care" };
  return null;
}

function Bar({ label, score }: { label: string; score: number }) {
  return (
    <div className="mw-bar">
      <span className="mw-bar-l">{label}</span>
      <span className="mw-bar-t"><span className={`mw-bar-f mw-${band(score)}`} style={{ width: `${score}%` }} /></span>
      <span className="mw-bar-n">{score}</span>
    </div>
  );
}

export default function Momentwm() {
  const [horizon, setHorizon] = useState<string>("all");
  const [minScore, setMinScore] = useState(45);
  const [themes, setThemes] = useState<string[]>([]);
  const [uses, setUses] = useState<string[]>([]);
  const [showSensitive, setShowSensitive] = useState(true);
  const [q, setQ] = useState("");

  const allThemes = useMemo(() => {
    const s = new Set<string>();
    for (const o of data.opportunities) for (const t of o.welshRelevance.tags) s.add(t);
    return Array.from(s).sort();
  }, []);
  const allUses = ["quiz", "heno", "social", "pitch", "documentary", "schools", "themed-week"];

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    return data.opportunities.filter((o) => {
      if (o.editorial.score < minScore) return false;
      if (horizon !== "all" && o.horizon !== horizon) return false;
      if (!showSensitive && o.sensitivity.severity === "high") return false;
      if (themes.length && !o.welshRelevance.tags.some((t) => themes.includes(t))) return false;
      if (uses.length && !o.suggestedUse.some((u) => uses.includes(u))) return false;
      if (query && !o.candidate.eventTitle.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [horizon, minScore, themes, uses, showSensitive, q]);

  const reset = () => { setHorizon("all"); setMinScore(45); setThemes([]); setUses([]); setShowSensitive(true); setQ(""); };

  return (
    <div className="mw-root">
      <style>{CSS}</style>
      <aside className="mw-rail">
        <input className="mw-search" placeholder="Search titles…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="mw-count">Showing <strong>{shown.length}</strong> of {data.opportunities.length}</div>

        <section><h4>Horizon</h4><div className="mw-seg">
          {HORIZONS.map((h) => (
            <button key={h} className={`mw-pill ${horizon === h ? "on" : ""}`} onClick={() => setHorizon(h)}>{HLABEL[h]}</button>
          ))}
        </div></section>

        <section><h4>Min editorial score · {minScore}</h4>
          <input type="range" min={0} max={100} step={5} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} />
        </section>

        <section><h4>Editorial use</h4><div className="mw-seg">
          {allUses.map((u) => (
            <button key={u} className={`mw-pill ${uses.includes(u) ? "on" : ""}`} onClick={() => toggle(uses, u, setUses)}>{USE_LABEL[u]}</button>
          ))}
        </div></section>

        {allThemes.length > 0 && (
          <section><h4>Theme</h4><div className="mw-seg">
            {allThemes.map((t) => (
              <button key={t} className={`mw-pill ${themes.includes(t) ? "on" : ""}`} onClick={() => toggle(themes, t, setThemes)}>{cap(t)}</button>
            ))}
          </div></section>
        )}

        <label className="mw-toggle">
          <input type="checkbox" checked={showSensitive} onChange={(e) => setShowSensitive(e.target.checked)} /> Show sensitive items
        </label>
        <button className="mw-reset" onClick={reset}>Reset filters</button>
      </aside>

      <main className="mw-main">
        <header className="mw-top">
          <div>
            <div className="mw-brand">Momentwm · radar golygyddol Cymru</div>
            <h1>Radar</h1>
          </div>
          <dl className="mw-stats">
            <div><dt>Shortlisted</dt><dd>{data.stats.shortlisted}</dd></div>
            <div><dt>Noise filtered</dt><dd>{data.stats.filteredLowValue}</dd></div>
            <div><dt>Sensitive</dt><dd>{data.stats.sensitiveFlagged}</dd></div>
            <div><dt>Source</dt><dd>Wikidata + news · {data.today}</dd></div>
          </dl>
        </header>

        {shown.length === 0 ? (
          <div className="mw-empty">
            <p className="mw-empty-t">Nothing matches these filters.</p>
            <p className="mw-empty-s">Lower the score, widen the horizon, or clear theme/use filters.</p>
            <button className="mw-reset" onClick={reset}>Reset filters</button>
          </div>
        ) : (
          <div className="mw-grid">
            {shown.map((o, i) => {
              const sev = sevMeta(o.sensitivity.severity);
              const a = o.anniversary;
              const d = o.drafts;
              return (
                <article key={i} className={`mw-card ${sev ? sev.cls : ""}`}>
                  <header className="mw-card-top">
                    <div className="mw-badges">
                      {a.isRound ? <span className="mw-badge round">★ {a.anniversaryType}</span> : <span className="mw-badge soft">{a.anniversaryType}</span>}
                      {sev && <span className={`mw-badge ${sev.cls}`} title={sev.label}>{sev.sym} sensitive</span>}
                    </div>
                    <span className="mw-score">{o.editorial.score}</span>
                  </header>
                  <div className="mw-when"><span>{a.windowLabel}</span><span className="mw-cd">{countdown(o, data.today)}</span></div>
                  <h3 className="mw-title">{o.candidate.eventTitle}</h3>
                  <div className="mw-chips">
                    {o.suggestedUse.map((u) => <span key={u} className={`mw-chip use ${u === "documentary" && sev ? "commem" : ""}`}>{USE_LABEL[u] ?? u}</span>)}
                  </div>
                  {o.welshRelevance.tags.length > 0 && (
                    <div className="mw-chips">{o.welshRelevance.tags.map((t) => <span key={t} className="mw-chip theme">{cap(t)}</span>)}</div>
                  )}
                  <div className="mw-bars"><Bar label="Editorial" score={o.editorial.score} /><Bar label="Welsh" score={o.welshRelevance.score} /></div>
                  {sev && <p className="mw-handling">{o.sensitivity.handling}</p>}
                  {d && (
                    <details className="mw-drafts">
                      <summary>Drafts</summary>
                      {d.quiz && <div className="mw-draft"><span className="mw-dk">Cwis</span><p>{d.quiz.questionCy}</p><p className="mw-dm">Ateb: {d.quiz.answer}</p></div>}
                      {d.heno && <div className="mw-draft"><span className="mw-dk">Heno</span><p>{d.heno.hookCy}</p><p className="mw-dm">{d.heno.treatmentCy}</p></div>}
                      {d.pitch && <div className="mw-draft"><span className="mw-dk">Pitch</span><p>{d.pitch.loglineCy}</p><p className="mw-dm">{d.pitch.format}</p></div>}
                      {d.blocked && d.blocked.length > 0 && <p className="mw-dblock">Withheld (sensitivity): {d.blocked.join(", ")}</p>}
                    </details>
                  )}
                  <footer className="mw-foot">
                    <a href={o.candidate.sourceUrl} target="_blank" rel="noreferrer">{o.candidate.sourceName} ↗</a>
                    <span className="mw-htag">{o.horizon}</span>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

const CSS = `
.mw-root{--bg:#0b0d11;--panel:#14171d;--panel2:#181c23;--ink:#e8eaf0;--ink2:#aeb6c5;--muted:#7c8597;--line:#232936;--line2:#2c3342;--accent:#4f8cff;--accentink:#bcd3ff;--gold:#e3b341;--green:#3fb968;--amber:#e0a23a;--red:#e5544b;
display:grid;grid-template-columns:264px 1fr;height:100%;overflow:hidden;background:var(--bg);color:var(--ink);font-family:ui-sans-serif,system-ui,-apple-system,"Inter",sans-serif;}
.mw-root *{box-sizing:border-box;}
.mw-rail{background:#0f1217;border-right:1px solid var(--line);padding:18px 14px;overflow-y:auto;display:flex;flex-direction:column;gap:16px;}
.mw-rail section{display:flex;flex-direction:column;gap:8px;}
.mw-rail h4{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:0;font-weight:600;}
.mw-search{width:100%;padding:8px 10px;font-size:14px;background:var(--panel);border:1px solid var(--line2);border-radius:6px;color:var(--ink);}
.mw-search:focus{outline:none;border-color:var(--accent);}
.mw-count{font-size:12px;color:var(--muted);}.mw-count strong{color:var(--ink);}
.mw-seg{display:flex;flex-wrap:wrap;gap:6px;}
.mw-pill{font-size:12px;padding:5px 9px;border-radius:999px;cursor:pointer;background:var(--panel);border:1px solid var(--line2);color:var(--ink2);transition:all .16s ease;}
.mw-pill:hover{border-color:var(--accent);color:var(--ink);}
.mw-pill.on{background:rgba(79,140,255,.16);border-color:var(--accent);color:var(--accentink);}
.mw-root input[type=range]{width:100%;accent-color:var(--accent);}
.mw-toggle{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ink2);cursor:pointer;}
.mw-reset{font-size:12px;padding:8px 12px;border-radius:6px;cursor:pointer;background:var(--panel);border:1px solid var(--line2);color:var(--ink2);}
.mw-reset:hover{border-color:var(--accent);color:var(--ink);}
.mw-main{padding:22px 26px;overflow-y:auto;}
.mw-top{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;margin-bottom:22px;}
.mw-brand{font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);font-weight:600;}
.mw-top h1{font-size:30px;line-height:1.15;letter-spacing:-.02em;margin:6px 0 0;}
.mw-stats{display:flex;gap:26px;margin:0;}.mw-stats div{display:flex;flex-direction:column;gap:2px;}
.mw-stats dt{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);}
.mw-stats dd{margin:0;font-size:20px;font-weight:600;}
.mw-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;}
.mw-card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:11px;transition:transform .16s ease,border-color .16s ease;}
.mw-card:hover{transform:translateY(-2px);border-color:var(--line2);}
.mw-card.sev-high{border-left:3px solid var(--red);}.mw-card.sev-caution{border-left:3px solid var(--amber);}
.mw-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;}
.mw-badges{display:flex;flex-wrap:wrap;gap:6px;}
.mw-badge{font-size:11px;padding:3px 8px;border-radius:999px;font-weight:600;white-space:nowrap;}
.mw-badge.round{background:rgba(227,179,65,.16);color:var(--gold);}
.mw-badge.soft{background:var(--panel2);color:var(--ink2);}
.mw-badge.sev-high{background:rgba(229,84,75,.16);color:var(--red);}
.mw-badge.sev-caution{background:rgba(224,162,58,.16);color:var(--amber);}
.mw-score{flex:none;min-width:30px;height:30px;padding:0 8px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;background:rgba(79,140,255,.16);color:var(--accentink);}
.mw-when{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:13px;color:var(--ink2);}
.mw-cd{font-size:12px;color:var(--muted);white-space:nowrap;}
.mw-title{font-size:16px;line-height:1.35;margin:0;letter-spacing:-.01em;}
.mw-chips{display:flex;flex-wrap:wrap;gap:6px;}
.mw-chip{font-size:11px;padding:3px 8px;border-radius:6px;}
.mw-chip.use{background:rgba(79,140,255,.12);color:var(--accentink);}
.mw-chip.use.commem{background:rgba(229,84,75,.14);color:var(--red);}
.mw-chip.theme{background:var(--panel2);color:var(--muted);}
.mw-bars{display:flex;flex-direction:column;gap:6px;}
.mw-bar{display:grid;grid-template-columns:58px 1fr 26px;align-items:center;gap:8px;}
.mw-bar-l{font-size:11px;color:var(--muted);}
.mw-bar-t{height:6px;background:var(--panel2);border-radius:3px;overflow:hidden;}
.mw-bar-f{display:block;height:100%;border-radius:3px;}
.mw-high{background:var(--green);}.mw-mid{background:var(--accent);}.mw-low{background:var(--amber);}
.mw-bar-n{font-size:11px;color:var(--ink2);text-align:right;font-variant-numeric:tabular-nums;}
.mw-handling{margin:0;font-size:12px;line-height:1.5;color:var(--red);background:rgba(229,84,75,.08);padding:8px 10px;border-radius:6px;}
.mw-drafts{font-size:12px;}
.mw-drafts summary{cursor:pointer;color:var(--accentink);list-style:none;}
.mw-drafts summary::-webkit-details-marker{display:none;}
.mw-draft{margin-top:8px;padding:8px 10px;background:var(--panel2);border-radius:6px;}
.mw-dk{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:600;}
.mw-draft p{margin:4px 0 0;line-height:1.45;}.mw-dm{color:var(--muted);font-size:11px;}
.mw-dblock{margin:8px 0 0;font-size:11px;color:var(--red);}
.mw-foot{display:flex;justify-content:space-between;align-items:center;font-size:12px;border-top:1px solid var(--line);padding-top:10px;margin-top:auto;}
.mw-foot a{color:var(--accentink);text-decoration:none;}.mw-foot a:hover{text-decoration:underline;}
.mw-htag{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;}
.mw-empty{text-align:center;padding:70px 24px;max-width:440px;margin:0 auto;}
.mw-empty-t{font-size:18px;font-weight:600;margin:0 0 8px;}
.mw-empty-s{font-size:14px;color:var(--muted);line-height:1.6;margin:0 0 18px;}
@media (max-width:820px){.mw-root{grid-template-columns:1fr;}.mw-rail{border-right:none;border-bottom:1px solid var(--line);}}
`;
