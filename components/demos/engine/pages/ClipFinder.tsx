import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Film, Sparkles, Wand2 } from 'lucide-react';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { useStore } from '@engine/lib/store/StoreProvider';
import { Button, Panel, EmptyState } from '@engine/components/ui';

// Postio M2b — the intelligence core: paste a transcript, AI ranks the
// strongest moments for short-form clips. No backend/upload yet — that
// (video ingest + Capsiynau transcription + FFmpeg cut) is the next slice.
interface Clip {
  start: string; end: string; duration_seconds: number;
  title: string; hook: string; reason: string; caption: string;
  platforms: string[]; aspect_ratio: string; score: number;
}

function scoreTone(s: number): string {
  if (s >= 80) return 'bg-emerald-500/15 text-emerald-300';
  if (s >= 60) return 'bg-amber-500/15 text-amber-300';
  return 'bg-white/10 text-white/55';
}

export default function ClipFinder() {
  const { t } = useI18n();
  const store = useStore();
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState('');
  const [clips, setClips] = useState<Clip[] | null>(null);
  const [summary, setSummary] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const find = async () => {
    if (!transcript.trim() || busy) return;
    setBusy(true); setErr(null); setClips(null); setSummary('');
    try {
      const res = await fetch('/api/ai/social', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ task: 'clip-analysis', transcript }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.message || data.error || 'Clip analysis failed.'); return; }
      const r = (data.result || {}) as { summary?: string; clips?: Clip[] };
      setSummary(r.summary || '');
      setClips(Array.isArray(r.clips) ? r.clips : []);
    } catch {
      setErr('Clip analysis failed.');
    } finally {
      setBusy(false);
    }
  };

  // Intelligence → creation loop: turn a clip's hook straight into an
  // animated-caption asset, reusing the M2a kind. Uses the first brand that
  // has an Animated caption template (every brand gets one via migration).
  const brand = store.brands.find((b) => store.templatesByBrand(b.id).some((tp) => tp.kind === 'animated-caption'));
  const makeCaption = (c: Clip) => {
    if (!brand) return;
    const tpl = store.templatesByBrand(brand.id).find((tp) => tp.kind === 'animated-caption');
    if (!tpl) return;
    const g = store.createGraphic(brand.id, tpl.id, { name: c.title || 'Clip caption' });
    if (!g) return;
    store.updateGraphic(g.id, {
      inputs: { ...g.inputs, copyOverrides: { ...((g.inputs?.copyOverrides as Record<string, string>) || {}), caption: c.hook || c.title || '', sub: c.caption || '' } },
    });
    navigate(`/graphics/${g.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-white/45 hover:text-white">
        <ArrowLeft size={14} /> {t('nav.dashboard')}
      </Link>
      <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-indigo-300"><Film size={13} /> Postio · beta</div>
      <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">{t('clip.title')}</h1>
      <p className="mt-1 text-[13px] text-white/45">{t('clip.subtitle')}</p>

      <Panel className="mt-6 p-5">
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={7}
          placeholder={t('clip.placeholder')}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[13px] leading-relaxed text-white placeholder:text-white/30 focus:border-indigo-400/60 focus:outline-none"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[12px] text-white/35">{t('clip.hint')}</span>
          <Button onClick={find} disabled={busy || !transcript.trim()}><Sparkles size={15} /> {busy ? t('clip.finding') : t('clip.find')}</Button>
        </div>
      </Panel>

      {err && <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-200">{err}</p>}
      {summary && <p className="mt-5 text-[13px] text-white/70">{summary}</p>}

      {clips && clips.length === 0 && <div className="mt-5"><EmptyState title={t('clip.none')} /></div>}

      {clips && clips.length > 0 && (
        <div className="mt-5 space-y-3">
          {clips.map((c, i) => (
            <Panel key={i} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-bold">{c.title || `Clip ${i + 1}`}</p>
                  <p className="mt-0.5 text-[12px] text-white/45">{c.start}–{c.end} · {c.duration_seconds}s · {c.aspect_ratio}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold ${scoreTone(c.score)}`}>{c.score}</span>
              </div>
              {c.hook && <p className="mt-2 text-[14px] font-semibold text-amber-300">“{c.hook}”</p>}
              {c.reason && <p className="mt-1.5 text-[12px] text-white/55"><span className="font-semibold text-white/70">{t('clip.why')}:</span> {c.reason}</p>}
              {c.caption && <p className="mt-1.5 text-[12px] text-white/75"><span className="font-semibold text-white/55">{t('clip.caption')}:</span> {c.caption}</p>}
              {Array.isArray(c.platforms) && c.platforms.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.platforms.map((p) => <span key={p} className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/60">{p}</span>)}
                </div>
              )}
              {brand && (
                <button onClick={() => makeCaption(c)} className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] font-semibold text-white/85 hover:bg-white/10">
                  <Wand2 size={13} className="text-indigo-300" /> {t('clip.makeCaption')}
                </button>
              )}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
