import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Sparkles, Wand2, Save, Film, Layers, X } from 'lucide-react';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { useStore } from '@engine/lib/store/StoreProvider';
import { Button, Panel, EmptyState } from '@engine/components/ui';

// ═══ Postio P1b — one guided journey ═══
// Brief → Media → AI analysis → Suggested clips → Create → Export, brand-scoped.
// This is the coherence layer: it assembles capabilities that already exist
// (optional brief, Capsiynau transcription, clip-analysis, save-to-brand clips,
// templates, output-mode export) into a single stepped workflow instead of
// separate pages.
interface Suggestion {
  start: string; end: string; duration_seconds: number;
  title: string; hook: string; reason: string; caption: string;
  platforms: string[]; aspect_ratio: string; score: number; fit?: string;
}

function Step({ n, title, desc, done, children }: { n: number; title: string; desc?: string; done?: boolean; children: ReactNode }) {
  return (
    <div className="relative pl-12">
      <div className={`absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full text-[13px] font-bold ${done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/15 text-indigo-200'}`}>
        {done ? <Check size={15} /> : n}
      </div>
      <h2 className="text-[16px] font-bold">{title}</h2>
      {desc && <p className="mt-0.5 text-[13px] text-white/45">{desc}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function Pipeline() {
  const { t } = useI18n();
  const store = useStore();
  const navigate = useNavigate();
  const { brandId = '' } = useParams();
  const brand = store.getBrand(brandId);

  const [brief, setBrief] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const [transStatus, setTransStatus] = useState<string | null>(null);
  const [clips, setClips] = useState<Suggestion[] | null>(null);
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [rejected, setRejected] = useState<Record<number, boolean>>({});
  const [folderSel, setFolderSel] = useState('none');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!brand) {
    return <div className="mx-auto max-w-3xl px-8 py-10"><EmptyState title={t('brand.notFound')} action={<Link to="/"><Button variant="subtle">{t('brand.backToDashboard')}</Button></Link>} /></div>;
  }

  const folders = store.foldersByBrand(brand.id);
  const templates = store.templatesByBrand(brand.id);
  const animatedTpl = templates.find((tp) => tp.kind === 'animated-caption');

  const transcribe = async () => {
    if (!videoUrl.trim() || transcribing) return;
    setTranscribing(true); setErr(null); setTransStatus('Starting…');
    try {
      const start = await fetch('/api/postio/transcribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fileUrl: videoUrl.trim() }) });
      const sd = await start.json();
      if (!start.ok) { setErr(sd.message || sd.error || 'Transcription unavailable.'); return; }
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const pr = await fetch(`/api/postio/transcribe?jobId=${encodeURIComponent(sd.jobId)}`);
        const pd = await pr.json();
        if (!pr.ok) { setErr(pd.message || 'Transcription failed.'); return; }
        if (pd.status === 'complete') { setTranscript(pd.transcript || ''); setTransStatus(null); return; }
        setTransStatus(pd.progress != null ? `Transcribing… ${pd.progress}%` : `Transcribing… (${pd.status})`);
      }
      setErr('Transcription timed out — paste the transcript below.');
    } catch { setErr('Transcription failed.'); } finally { setTranscribing(false); }
  };

  const find = async () => {
    if (!transcript.trim() || busy) return;
    setBusy(true); setErr(null); setClips(null); setSaved({});
    try {
      const res = await fetch('/api/ai/social', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ task: 'clip-analysis', transcript, ...(brief.trim() ? { brief: brief.trim() } : {}) }) });
      const data = await res.json();
      if (!res.ok) { setErr(data.message || data.error || 'Clip analysis failed.'); return; }
      const r = (data.result || {}) as { clips?: Suggestion[] };
      setClips(Array.isArray(r.clips) ? r.clips : []);
    } catch { setErr('Clip analysis failed.'); } finally { setBusy(false); }
  };

  const saveClip = (c: Suggestion, i: number) => {
    if (saved[i]) return;
    store.createClip(brand.id, {
      name: c.title || 'Clip', start: c.start, end: c.end, durationSeconds: c.duration_seconds,
      hook: c.hook, reason: c.reason, caption: c.caption, fit: c.fit, platforms: c.platforms,
      aspectRatio: c.aspect_ratio, score: c.score, sourceUrl: videoUrl.trim() || undefined, brief: brief.trim() || undefined,
    }, { folderId: folderSel !== 'none' ? folderSel : undefined });
    setSaved((s) => ({ ...s, [i]: true }));
  };

  const makeCaption = (c: Suggestion) => {
    if (!animatedTpl) return;
    const g = store.createGraphic(brand.id, animatedTpl.id, { name: c.title || 'Clip caption' });
    if (!g) return;
    store.updateGraphic(g.id, { inputs: { ...g.inputs, copyOverrides: { ...((g.inputs?.copyOverrides as Record<string, string>) || {}), caption: c.hook || c.title || '', sub: c.caption || '' } } });
    navigate(`/graphics/${g.id}`);
  };

  // Adjust a suggestion's in/out points before saving (brief Step 6).
  const adjust = (i: number, field: 'start' | 'end', value: string) =>
    setClips((cs) => (cs ? cs.map((c, j) => (j === i ? { ...c, [field]: value } : c)) : cs));
  // Reject a suggestion (hidden; indices stay stable so saved/adjust hold).
  const reject = (i: number) => setRejected((r) => ({ ...r, [i]: true }));

  const savedCount = Object.values(saved).filter(Boolean).length;
  const fieldCls = 'w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[13px] leading-relaxed text-white placeholder:text-white/30 focus:border-indigo-400/60 focus:outline-none';

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <Link to={`/brands/${brand.id}`} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-white/45 hover:text-white">
        <ArrowLeft size={14} /> {t('editor.backToBrand')}
      </Link>
      <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-indigo-300"><Sparkles size={13} /> {brand.name}</div>
      <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">{t('pipe.title')}</h1>
      <p className="mt-1 text-[13px] text-white/45">{t('pipe.subtitle')}</p>

      {err && <p className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">{err}</p>}

      <div className="mt-8 flex flex-col gap-9 border-l border-white/10 pl-px">
        {/* 1 — Brief */}
        <Step n={1} title={t('pipe.briefTitle')} desc={t('pipe.briefDesc')} done={!!brief.trim()}>
          <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={3} placeholder={t('clip.briefPlaceholder')} className={fieldCls} />
        </Step>

        {/* 2 — Media */}
        <Step n={2} title={t('pipe.mediaTitle')} desc={t('pipe.mediaDesc')} done={!!transcript.trim()}>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder={t('clip.videoPlaceholder')} className="min-w-[220px] flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:border-indigo-400/60 focus:outline-none" />
            <Button variant="subtle" onClick={transcribe} disabled={transcribing || !videoUrl.trim()}>{transcribing ? (transStatus || t('clip.transcribing')) : t('clip.transcribe')}</Button>
          </div>
          <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={5} placeholder={t('clip.placeholder')} className={fieldCls} />
          <p className="mt-1 text-[11px] text-white/35">{t('pipe.mediaNote')}</p>
        </Step>

        {/* 3 — Analyse */}
        <Step n={3} title={t('pipe.analyseTitle')} desc={t('pipe.analyseDesc')} done={clips != null}>
          <Button onClick={find} disabled={busy || !transcript.trim()}><Sparkles size={15} /> {busy ? t('clip.finding') : t('clip.find')}</Button>
        </Step>

        {/* 4 — Suggested clips */}
        <Step n={4} title={t('pipe.clipsTitle')} desc={t('pipe.clipsDesc')} done={savedCount > 0}>
          {clips == null ? (
            <p className="text-[13px] text-white/35">{t('pipe.clipsEmpty')}</p>
          ) : clips.length === 0 ? (
            <p className="text-[13px] text-white/35">{t('clip.none')}</p>
          ) : (
            <>
              {folders.length > 0 && (
                <select value={folderSel} onChange={(e) => setFolderSel(e.target.value)} className="mb-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[13px] text-white/90 focus:outline-none">
                  <option value="none">{t('clip.noFolder')}</option>
                  {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              )}
              {clips.every((_, i) => rejected[i]) && <p className="text-[13px] text-white/35">{t('pipe.allRejected')}</p>}
              <div className="space-y-3">
                {clips.map((c, i) => rejected[i] ? null : (
                  <Panel key={i} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold">{c.title || `Clip ${i + 1}`}</p>
                        {/* Adjust the in/out points (brief Step 6) — applied on save + by the render worker later. */}
                        <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-white/45">
                          <input value={c.start} onChange={(e) => adjust(i, 'start', e.target.value)} disabled={saved[i]} aria-label={t('pipe.in')} className="w-16 rounded border border-white/10 bg-black/30 px-2 py-1 text-center text-white/90 focus:border-indigo-400/60 focus:outline-none disabled:opacity-60" />
                          <span>→</span>
                          <input value={c.end} onChange={(e) => adjust(i, 'end', e.target.value)} disabled={saved[i]} aria-label={t('pipe.out')} className="w-16 rounded border border-white/10 bg-black/30 px-2 py-1 text-center text-white/90 focus:border-indigo-400/60 focus:outline-none disabled:opacity-60" />
                          <span className="text-white/30">· {c.aspect_ratio}</span>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-bold text-white/70">{c.score}</span>
                    </div>
                    {c.hook && <p className="mt-2 text-[13px] font-semibold text-amber-300">“{c.hook}”</p>}
                    {c.reason && <p className="mt-1.5 text-[12px] text-white/55"><span className="font-semibold text-white/70">{t('clip.why')}:</span> {c.reason}</p>}
                    {c.fit && c.fit.trim() && <p className="mt-1.5 text-[12px] text-indigo-200/80"><span className="font-semibold text-indigo-200">{t('clip.fit')}:</span> {c.fit}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => saveClip(c, i)} disabled={saved[i]} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-semibold text-white/85 hover:bg-white/10 disabled:opacity-60">
                        {saved[i] ? <><Check size={13} className="text-emerald-300" /> {t('clip.saved')}</> : <><Save size={13} className="text-indigo-300" /> {t('clip.save')}</>}
                      </button>
                      {animatedTpl && (
                        <button onClick={() => makeCaption(c)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-semibold text-white/85 hover:bg-white/10">
                          <Wand2 size={13} className="text-indigo-300" /> {t('clip.makeCaption')}
                        </button>
                      )}
                      {!saved[i] && (
                        <button onClick={() => reject(i)} className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white/40 hover:bg-white/5 hover:text-white/70">
                          <X size={13} /> {t('clip.reject')}
                        </button>
                      )}
                    </div>
                  </Panel>
                ))}
              </div>
            </>
          )}
        </Step>

        {/* 5 — Create assets */}
        <Step n={5} title={t('pipe.createTitle')} desc={t('pipe.createDesc')} done={false}>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate(`/brands/${brand.id}/create`)}><Sparkles size={15} /> {t('brand.createGraphic')}</Button>
            <Button variant="subtle" onClick={() => navigate(`/brands/${brand.id}`)}><Layers size={15} /> {t('pipe.viewClips')}</Button>
          </div>
        </Step>

        {/* 6 — Export */}
        <Step n={6} title={t('pipe.exportTitle')} desc={t('pipe.exportDesc')} done={false}>
          <p className="inline-flex items-center gap-1.5 text-[12px] text-white/40"><Film size={13} /> {t('pipe.exportNote')}</p>
        </Step>
      </div>
    </div>
  );
}
