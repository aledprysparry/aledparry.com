import { useState } from 'react';
import { Sparkles, Wand2, Check, Copy, AlertTriangle } from 'lucide-react';
import { Button } from '@engine/components/ui';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import type { Brand } from '@engine/lib/model/types';

type Task = 'improve' | 'autofill' | 'captions' | 'critique';

interface Props {
  brand?: Brand;
  platform: string;
  textElements: { id: string; content: string }[];
  onApply: (id: string, text: string) => void;
  onAddText: (text: string) => void;
}

async function callAgent(task: Task, payload: Record<string, unknown>): Promise<{ result?: Record<string, unknown>; error?: string }> {
  try {
    const res = await fetch('/api/ai/social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, ...payload }),
    });
    if (res.status === 503) return { error: 'not_configured' };
    const data = await res.json();
    if (!res.ok) return { error: data.error || 'error' };
    return { result: data.result };
  } catch {
    return { error: 'network' };
  }
}

export default function AiPanel({ brand, platform, textElements, onApply, onAddText }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [improve, setImprove] = useState<{ original: string; suggestion: string }[] | null>(null);
  const [autofill, setAutofill] = useState<{ headline?: string; subheading?: string; cta?: string } | null>(null);
  const [captions, setCaptions] = useState<{ caption?: string; hashtags?: string[] } | null>(null);
  const [critique, setCritique] = useState<{ title: string; detail: string }[] | null>(null);

  const brandPayload = { name: brand?.name, toneNotes: brand?.toneNotes, colours: brand?.colours, fonts: brand?.fonts };
  const texts = textElements.map((el) => el.content).filter(Boolean);

  const run = async (task: Task, extra: Record<string, unknown> = {}) => {
    setBusy(task); setError(null);
    const { result, error } = await callAgent(task, { brand: brandPayload, platform, texts, ...extra });
    setBusy(null);
    if (error) { setError(error); return; }
    if (task === 'improve') setImprove((result?.items as { original: string; suggestion: string }[]) ?? []);
    if (task === 'autofill') setAutofill(result ?? {});
    if (task === 'captions') setCaptions(result ?? {});
    if (task === 'critique') setCritique((result?.issues as { title: string; detail: string }[]) ?? []);
  };

  const copy = (s: string) => navigator.clipboard?.writeText(s);

  return (
    <div className="rounded-2xl border border-indigo-400/20 bg-indigo-500/5 p-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
        <span className="inline-flex items-center gap-2 text-[14px] font-bold"><Sparkles size={15} className="text-indigo-300" /> {t('ai.title')}</span>
        <span className="text-[12px] text-white/40">{open ? t('common.hide') : t('common.open')}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {error === 'not_configured' && <p className="text-[12px] text-white/55">{t('ai.notConfigured')}</p>}
          {error && error !== 'not_configured' && <p className="inline-flex items-center gap-1.5 text-[12px] text-[#f87171]"><AlertTriangle size={13} /> {t('ai.failed', { error })}</p>}

          {/* auto-fill */}
          <div>
            <div className="flex gap-2">
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={t('ai.topicPlaceholder')} className="flex-1 rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-[13px] text-white/90 focus:outline-none" />
              <Button variant="subtle" disabled={busy !== null || !topic.trim()} onClick={() => run('autofill', { topic })}><Wand2 size={14} /> {busy === 'autofill' ? '…' : t('ai.draft')}</Button>
            </div>
            {autofill && (
              <div className="mt-2 space-y-1.5">
                {(['headline', 'subheading', 'cta'] as const).map((k) => autofill[k] && (
                  <div key={k} className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5">
                    <span className="text-[12px] text-white/80">{autofill[k]}</span>
                    <button onClick={() => onAddText(autofill[k] as string)} className="shrink-0 text-[11px] font-semibold text-indigo-300 hover:text-indigo-200">{t('ai.add')}</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="subtle" disabled={busy !== null || texts.length === 0} onClick={() => run('improve')}>{busy === 'improve' ? '…' : t('ai.improveCopy')}</Button>
            <Button variant="subtle" disabled={busy !== null || texts.length === 0} onClick={() => run('captions')}>{busy === 'captions' ? '…' : t('ai.captionHashtags')}</Button>
            <Button variant="subtle" disabled={busy !== null || texts.length === 0} onClick={() => run('critique')}>{busy === 'critique' ? '…' : t('ai.critique')}</Button>
          </div>

          {improve && improve.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">{t('ai.improvedCopy')}</p>
              {improve.map((it, i) => (
                <div key={i} className="rounded-lg bg-white/[0.03] px-3 py-2">
                  <p className="text-[12px] text-white/80">{it.suggestion}</p>
                  <p className="mt-0.5 text-[11px] text-white/35 line-through">{it.original}</p>
                  {textElements[i] && <button onClick={() => onApply(textElements[i].id, it.suggestion)} className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-300 hover:text-indigo-200"><Check size={12} /> {t('ai.apply')}</button>}
                </div>
              ))}
            </div>
          )}

          {captions && (
            <div className="space-y-2">
              <div className="rounded-lg bg-white/[0.03] px-3 py-2">
                <div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wide text-white/40">{t('ai.caption')}</span><button onClick={() => copy(captions.caption || '')} className="text-white/40 hover:text-white"><Copy size={12} /></button></div>
                <p className="mt-1 text-[12px] text-white/80">{captions.caption}</p>
              </div>
              {captions.hashtags && captions.hashtags.length > 0 && (
                <div className="rounded-lg bg-white/[0.03] px-3 py-2">
                  <div className="flex items-center justify-between"><span className="text-[11px] font-semibold uppercase tracking-wide text-white/40">{t('ai.hashtags')}</span><button onClick={() => copy((captions.hashtags || []).join(' '))} className="text-white/40 hover:text-white"><Copy size={12} /></button></div>
                  <p className="mt-1 text-[12px] text-indigo-200">{captions.hashtags.join(' ')}</p>
                </div>
              )}
            </div>
          )}

          {critique && critique.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">{t('ai.critique')}</p>
              {critique.map((c, i) => (
                <div key={i} className="rounded-lg bg-white/[0.03] px-3 py-2">
                  <p className="text-[12px] font-semibold text-white/85">{c.title}</p>
                  <p className="text-[12px] text-white/45">{c.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
