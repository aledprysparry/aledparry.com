import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Sparkles, Wand2, Save, Film, Layers, X, Upload, MessageSquare, Copy, Link2 } from 'lucide-react';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { useStore } from '@engine/lib/store/StoreProvider';
import { Button, Panel, EmptyState } from '@engine/components/ui';

// ═══ Postio P1b - one guided journey ═══
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
    <div className="relative pl-11 sm:pl-12">
      <div className={`absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full text-[13px] font-bold ${done ? 'bg-violet-600 text-white' : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'}`}>
        {done ? <Check size={15} /> : n}
      </div>
      <h2 className="text-[16px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h2>
      {desc && <p className="mt-0.5 text-[13px] text-zinc-500 dark:text-zinc-400">{desc}</p>}
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
  const [briefFile, setBriefFile] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [localMedia, setLocalMedia] = useState<{ name: string; url: string; audio: boolean } | null>(null);
  const [transcript, setTranscript] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const [transStatus, setTransStatus] = useState<string | null>(null);
  const [clips, setClips] = useState<Suggestion[] | null>(null);
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [rejected, setRejected] = useState<Record<number, boolean>>({});
  const [folderSel, setFolderSel] = useState('none');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copyBusy, setCopyBusy] = useState<number | null>(null);
  const [socialCopy, setSocialCopy] = useState<Record<number, { platform: string; text: string; hashtags?: string[] }[]>>({});
  const [copied, setCopied] = useState<string | null>(null);

  if (!brand) {
    return <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8"><EmptyState title={t('brand.notFound')} action={<Link to="/"><Button variant="subtle">{t('brand.backToDashboard')}</Button></Link>} /></div>;
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
      setErr('Transcription timed out - paste the transcript below.');
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

  // AI social copy - per-platform post text + hashtags from a clip's content
  // (brief Step 7). Reuses /api/ai/social; needs the live key.
  const genCopy = async (c: Suggestion, i: number) => {
    if (copyBusy != null) return;
    setCopyBusy(i); setErr(null);
    try {
      const res = await fetch('/api/ai/social', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ task: 'social-copy', texts: [c.hook, c.title, c.caption].filter(Boolean), ...(brief.trim() ? { brief: brief.trim() } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.message || data.error || 'Copy generation failed.'); return; }
      const variants = (data.result?.variants || []) as { platform: string; text: string; hashtags?: string[] }[];
      setSocialCopy((s) => ({ ...s, [i]: variants }));
    } catch { setErr('Copy generation failed.'); } finally { setCopyBusy(null); }
  };
  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied((k) => (k === key ? null : k)), 1500); }).catch(() => {});
  };

  // Link a LOCAL media file - referenced for in-browser preview, never
  // uploaded (Issue 2: reference, don't host). Server transcription needs a
  // URL, so a local file can't be transcribed until the render worker resolves
  // it; for now paste/transcribe a URL separately. Session-only objectURL.
  const linkLocal = (file?: File) => {
    if (!file) return;
    setLocalMedia({ name: file.name, url: URL.createObjectURL(file), audio: file.type.startsWith('audio') });
  };

  // Upload a written brief - TXT / Markdown read in-browser (no backend, no
  // parser dep). PDF / DOCX need a parser library; flagged as a follow-up.
  const uploadBrief = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setBrief(String(reader.result || '')); setBriefFile(file.name); };
    reader.onerror = () => setErr('Could not read that file.');
    reader.readAsText(file);
  };

  // Adjust a suggestion's in/out points before saving (brief Step 6).
  const adjust = (i: number, field: 'start' | 'end', value: string) =>
    setClips((cs) => (cs ? cs.map((c, j) => (j === i ? { ...c, [field]: value } : c)) : cs));
  // Reject a suggestion (hidden; indices stay stable so saved/adjust hold).
  const reject = (i: number) => setRejected((r) => ({ ...r, [i]: true }));

  const savedCount = Object.values(saved).filter(Boolean).length;
  const fieldCls = 'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
      <Link to={`/brands/${brand.id}`} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
        <ArrowLeft size={14} /> {t('editor.backToBrand')}
      </Link>
      <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400"><Sparkles size={13} /> {brand.name}</div>
      <h1 className="mt-1 text-[26px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[28px]">{t('pipe.title')}</h1>
      <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">{t('pipe.subtitle')}</p>

      {err && <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">{err}</p>}

      <div className="mt-8 flex flex-col gap-9 border-l border-zinc-200 pl-px dark:border-zinc-800">
        {/* 1 - Brief */}
        <Step n={1} title={t('pipe.briefTitle')} desc={t('pipe.briefDesc')} done={!!brief.trim()}>
          <textarea value={brief} onChange={(e) => { setBrief(e.target.value); if (briefFile) setBriefFile(null); }} rows={3} placeholder={t('clip.briefPlaceholder')} className={fieldCls} />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="cursor-pointer">
              <input type="file" accept=".txt,.md,.markdown,text/plain,text/markdown" className="hidden" onChange={(e) => uploadBrief(e.target.files?.[0])} />
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"><Upload size={13} /> {t('pipe.uploadBrief')}</span>
            </label>
            {briefFile && <span className="inline-flex items-center gap-1.5 text-[12px] text-emerald-600 dark:text-emerald-400"><Check size={13} /> {briefFile}</span>}
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{t('pipe.briefFormats')}</span>
          </div>
        </Step>

        {/* 2 - Media */}
        <Step n={2} title={t('pipe.mediaTitle')} desc={t('pipe.mediaDesc')} done={!!transcript.trim()}>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder={t('clip.videoPlaceholder')} className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 sm:min-w-[220px]" />
            <Button variant="subtle" onClick={transcribe} disabled={transcribing || !videoUrl.trim()}>{transcribing ? (transStatus || t('clip.transcribing')) : t('clip.transcribe')}</Button>
            <label className="cursor-pointer">
              <input type="file" accept="video/*,audio/*" className="hidden" onChange={(e) => linkLocal(e.target.files?.[0])} />
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"><Link2 size={14} /> {t('pipe.linkLocal')}</span>
            </label>
          </div>
          {localMedia && (
            <div className="mb-2 rounded-lg border border-zinc-200 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-900">
              <div className="mb-1.5 flex items-center gap-1.5 text-[12px] text-emerald-600 dark:text-emerald-400"><Link2 size={13} /> {localMedia.name}</div>
              {localMedia.audio
                ? <audio src={localMedia.url} controls className="w-full" />
                : <video src={localMedia.url} controls className="max-h-56 w-full rounded" />}
              <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">{t('pipe.localNote')}</p>
            </div>
          )}
          <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={5} placeholder={t('clip.placeholder')} className={fieldCls} />
          <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">{t('pipe.mediaNote')}</p>
        </Step>

        {/* 3 - Analyse */}
        <Step n={3} title={t('pipe.analyseTitle')} desc={t('pipe.analyseDesc')} done={clips != null}>
          <Button onClick={find} disabled={busy || !transcript.trim()}><Sparkles size={15} /> {busy ? t('clip.finding') : t('clip.find')}</Button>
        </Step>

        {/* 4 - Suggested clips */}
        <Step n={4} title={t('pipe.clipsTitle')} desc={t('pipe.clipsDesc')} done={savedCount > 0}>
          {clips == null ? (
            <p className="text-[13px] text-zinc-400 dark:text-zinc-500">{t('pipe.clipsEmpty')}</p>
          ) : clips.length === 0 ? (
            <p className="text-[13px] text-zinc-400 dark:text-zinc-500">{t('clip.none')}</p>
          ) : (
            <>
              {folders.length > 0 && (
                <select value={folderSel} onChange={(e) => setFolderSel(e.target.value)} className="mb-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-800 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                  <option value="none">{t('clip.noFolder')}</option>
                  {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              )}
              {clips.every((_, i) => rejected[i]) && <p className="text-[13px] text-zinc-400 dark:text-zinc-500">{t('pipe.allRejected')}</p>}
              <div className="space-y-3">
                {clips.map((c, i) => rejected[i] ? null : (
                  <Panel key={i} className="p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <div className="min-w-0 order-2 sm:order-1">
                        <p className="text-[14px] font-bold text-zinc-900 dark:text-zinc-50">{c.title || `Clip ${i + 1}`}</p>
                        {/* Adjust the in/out points (brief Step 6), applied on save + by the render worker later. */}
                        <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400">
                          <input value={c.start} onChange={(e) => adjust(i, 'start', e.target.value)} disabled={saved[i]} aria-label={t('pipe.in')} className="w-16 rounded border border-zinc-200 bg-white px-2 py-1 text-center text-zinc-800 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
                          <span>→</span>
                          <input value={c.end} onChange={(e) => adjust(i, 'end', e.target.value)} disabled={saved[i]} aria-label={t('pipe.out')} className="w-16 rounded border border-zinc-200 bg-white px-2 py-1 text-center text-zinc-800 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
                          <span className="text-zinc-400 dark:text-zinc-500">· {c.aspect_ratio}</span>
                        </div>
                      </div>
                      <span className="order-1 shrink-0 self-start rounded-full bg-zinc-100 px-2.5 py-1 text-[12px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 sm:order-2">{c.score}</span>
                    </div>
                    {c.hook && <p className="mt-2 text-[13px] font-semibold text-amber-600 dark:text-amber-400">“{c.hook}”</p>}
                    {c.reason && <p className="mt-1.5 text-[12px] text-zinc-600 dark:text-zinc-300"><span className="font-semibold text-zinc-800 dark:text-zinc-100">{t('clip.why')}:</span> {c.reason}</p>}
                    {c.fit && c.fit.trim() && <p className="mt-1.5 text-[12px] text-violet-600 dark:text-violet-400"><span className="font-semibold text-violet-700 dark:text-violet-300">{t('clip.fit')}:</span> {c.fit}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button onClick={() => saveClip(c, i)} disabled={saved[i]} className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
                        {saved[i] ? <><Check size={13} className="text-emerald-600 dark:text-emerald-400" /> {t('clip.saved')}</> : <><Save size={13} className="text-violet-600 dark:text-violet-400" /> {t('clip.save')}</>}
                      </button>
                      <button onClick={() => genCopy(c, i)} disabled={copyBusy != null} className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
                        <MessageSquare size={13} className="text-violet-600 dark:text-violet-400" /> {copyBusy === i ? t('clip.finding') : t('clip.genCopy')}
                      </button>
                      {animatedTpl && (
                        <button onClick={() => makeCaption(c)} className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
                          <Wand2 size={13} className="text-violet-600 dark:text-violet-400" /> {t('clip.makeCaption')}
                        </button>
                      )}
                      {!saved[i] && (
                        <button onClick={() => reject(i)} className="ml-auto inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
                          <X size={13} /> {t('clip.reject')}
                        </button>
                      )}
                    </div>
                    {socialCopy[i] && socialCopy[i].length > 0 && (
                      <div className="mt-3 space-y-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                        {socialCopy[i].map((v) => {
                          const full = (v.text || '') + (v.hashtags?.length ? '\n\n' + v.hashtags.join(' ') : '');
                          const key = `${i}-${v.platform}`;
                          return (
                            <div key={key} className="rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-800/50">
                              <div className="mb-1 flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300">{v.platform}</span>
                                <button onClick={() => copyToClipboard(key, full)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                                  {copied === key ? <><Check size={11} className="text-emerald-600 dark:text-emerald-400" /> {t('clip.copied')}</> : <><Copy size={11} /> {t('clip.copy')}</>}
                                </button>
                              </div>
                              <p className="whitespace-pre-wrap text-[12px] text-zinc-800 dark:text-zinc-200">{v.text}</p>
                              {v.hashtags?.length ? <p className="mt-1 text-[12px] text-violet-600 dark:text-violet-400">{v.hashtags.join(' ')}</p> : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Panel>
                ))}
              </div>
            </>
          )}
        </Step>

        {/* 5 - Create assets */}
        <Step n={5} title={t('pipe.createTitle')} desc={t('pipe.createDesc')} done={false}>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate(`/brands/${brand.id}/create`)}><Sparkles size={15} /> {t('brand.createGraphic')}</Button>
            <Button variant="subtle" onClick={() => navigate(`/brands/${brand.id}`)}><Layers size={15} /> {t('pipe.viewClips')}</Button>
          </div>
        </Step>

        {/* 6 - Export */}
        <Step n={6} title={t('pipe.exportTitle')} desc={t('pipe.exportDesc')} done={false}>
          <p className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400"><Film size={13} /> {t('pipe.exportNote')}</p>
        </Step>
      </div>
    </div>
  );
}
