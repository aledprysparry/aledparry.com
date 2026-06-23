// ═══ Postio Voice AI - the intent bar (M-V1 thin slice) ═══
// The new front door: describe an OUTCOME, the AI proposes formats, you pick,
// it drafts using existing generators, and you approve. Nothing publishes.
// This is the smallest end-to-end proof; voice/image/url/clips + Coach scoring
// are later milestones (see POSTIO_VOICE_AI.md).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { Button, Panel, Badge } from '@engine/components/ui';
import { Sparkles, ArrowRight, Check, X, Pencil, Download, RotateCcw } from 'lucide-react';
import { useOrchestrator } from '@engine/lib/voiceai/orchestrator';
import type { IntentCandidate } from '@engine/lib/voiceai/types';

export default function VoiceAIPanel() {
  const store = useStore();
  const { t } = useI18n();
  const { brands } = store;
  const [brandId, setBrandId] = useState<string>(brands[0]?.id ?? '');
  const [text, setText] = useState('');
  const { view, detect, pick, applyOption, approve, reject, exportDraft, reset } = useOrchestrator(brandId);
  const navigate = useNavigate();

  if (!brands.length) return null; // brand-first: nothing to scope intent to yet
  const brand = store.getBrand(brandId) ?? brands[0];
  const busy = view.state === 'detecting' || view.state === 'planning';
  const noteText = view.notice === 'offline-locked' ? t('va.note.offlineLocked') : view.notice === 'offline' ? t('va.note.offline') : '';

  const openEditor = () => view.graphicId && navigate(`/graphics/${view.graphicId}`);
  const startOver = () => { reset(); setText(''); };

  return (
    <Panel className="mb-8 overflow-hidden">
      <div className="border-b border-zinc-100 bg-gradient-to-br from-violet-50/70 to-transparent px-5 py-4 dark:border-zinc-800 dark:from-violet-500/10">
        <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-400">
          <Sparkles size={14} /> {t('va.kicker')}
        </div>
        <p className="mt-0.5 text-[13px] text-zinc-500 dark:text-zinc-400">{t('va.nothingPublishes')}</p>
      </div>

      <div className="p-5">
        {/* ── 1. INTENT BAR ── */}
        {(view.state === 'idle' || view.state === 'detecting') && (
          <div>
            <label className="block text-[15px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{t('va.title')}</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) detect(text); }}
              rows={2}
              disabled={busy}
              placeholder={t('va.placeholder')}
              className="mt-3 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-[15px] text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-[13px] text-zinc-500 dark:text-zinc-400">
                {t('va.brand')}
                <select
                  value={brandId}
                  onChange={(e) => { setBrandId(e.target.value); }}
                  className="eng-control rounded-lg border border-zinc-200 bg-white px-2 text-[13px] font-semibold text-zinc-800 focus:border-violet-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </label>
              <Button onClick={() => detect(text)} disabled={!text.trim() || busy}>
                {busy ? t('va.thinking') : <>{t('va.continue')} <ArrowRight size={15} /></>}
              </Button>
            </div>
          </div>
        )}

        {/* ── 2. CANDIDATE PICKER (approval gate #1) ── */}
        {(view.state === 'awaiting-pick' || view.state === 'planning' || view.state === 'generating') && view.detected && (
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-zinc-400">{t('va.goalLabel')}</p>
            <p className="mt-0.5 text-[17px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{view.detected.goal}</p>
            {view.detected.reasoning && <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">{view.detected.reasoning}</p>}
            {noteText && <p className="mt-2 text-[12px] font-medium text-amber-600 dark:text-amber-400">{noteText}</p>}

            <p className="mt-4 mb-2 text-[13px] text-zinc-500 dark:text-zinc-400">{t('va.pickHint')}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {view.detected.candidates.map((c: IntentCandidate) => (
                <button
                  key={c.id}
                  onClick={() => view.state === 'awaiting-pick' && pick(c)}
                  disabled={view.state !== 'awaiting-pick'}
                  className="group rounded-xl border border-zinc-200 bg-white p-4 text-left transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-violet-500/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[15px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{c.format}</span>
                    <Badge tone="muted">{c.confidence}%</Badge>
                  </div>
                  <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">{c.why}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-violet-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-violet-400">
                    {t('va.make')} <ArrowRight size={13} />
                  </span>
                </button>
              ))}
            </div>
            {(view.state === 'planning' || view.state === 'generating') && <p className="mt-4 text-[13px] font-medium text-violet-600 dark:text-violet-400">{t('va.planning')}</p>}
            <button onClick={startOver} className="mt-4 text-[12px] text-zinc-400 underline-offset-2 hover:underline">{t('va.again')}</button>
          </div>
        )}

        {/* ── 3. REVIEW (approval gate #2) ── */}
        {view.state === 'reviewing' && view.plan && (
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-zinc-400">{t('va.reviewKicker')}</p>
              <Badge tone={view.usedAI ? 'accent' : 'muted'}>{view.usedAI ? t('va.aiBadge') : t('va.offlineBadge')}</Badge>
            </div>
            <p className="mt-1 text-[17px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{view.plan.copy.title || brand.name}</p>

            <div className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
              <p className="text-[12px] font-semibold text-zinc-400">{t('va.why')}</p>
              <p className="mt-0.5 text-[13px] text-zinc-600 dark:text-zinc-300">{view.plan.reasoning}</p>
            </div>

            {/* the generated copy fields, read-only preview */}
            <dl className="mt-3 space-y-1.5">
              {Object.entries(view.plan.copy).slice(0, 6).map(([k, v]) => (
                <div key={k} className="flex gap-3 text-[13px]">
                  <dt className="w-24 shrink-0 text-zinc-400">{k}</dt>
                  <dd className="text-zinc-700 dark:text-zinc-200">{v}</dd>
                </div>
              ))}
            </dl>

            {view.plan.options.length > 0 && (
              <div className="mt-4">
                <p className="text-[12px] font-semibold text-zinc-400">{t('va.alternatives')}</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {view.plan.options.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => applyOption(o.id)}
                      className={`rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors ${view.chosenOptionId === o.id ? 'border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300'}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {noteText && <p className="mt-3 text-[12px] font-medium text-amber-600 dark:text-amber-400">{noteText}</p>}

            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => { approve(); openEditor(); }}><Check size={15} /> {t('va.approveOpen')}</Button>
              <Button variant="subtle" onClick={exportDraft}><Download size={15} /> {t('va.export')}</Button>
              <Button variant="subtle" onClick={openEditor}><Pencil size={15} /> {t('va.openEditor')}</Button>
              <Button variant="danger" onClick={reject}><X size={15} /> {t('va.reject')}</Button>
            </div>
          </div>
        )}

        {/* ── terminal states ── */}
        {(view.state === 'approved' || view.state === 'rejected' || view.state === 'error') && (
          <div className="py-2">
            <p className="text-[15px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {view.state === 'approved' ? t('va.approvedTitle') : view.state === 'rejected' ? t('va.rejectedTitle') : (view.error || 'Error')}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {view.state === 'approved' && view.graphicId && <Button variant="subtle" onClick={openEditor}><Pencil size={15} /> {t('va.openEditor')}</Button>}
              <Button onClick={startOver}><RotateCcw size={15} /> {t('va.again')}</Button>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
