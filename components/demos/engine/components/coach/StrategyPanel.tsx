// ═══ Postio Coach: Strategy / Playbook ═══
// A per-brand business brief drives seven generative plays. Outputs are saved,
// structured artifacts (sections / pillars / calendar / post), never chat.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Save, Copy, Compass, Brain, Crown, Columns3, CalendarDays, Megaphone, BadgePoundSterling, PenLine, FileDown, Mic, RefreshCw,
} from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { useOverlay } from '@engine/components/primitives';
import { Button, Panel, Badge, TextInput } from '@engine/components/ui';
import { STRATEGY_PLAYS, runStrategy, briefIsReady } from '@engine/lib/coach/strategy';
import { createDraftFromIdea } from '@engine/lib/coach/actions';
import { exportStrategyReport } from '@engine/lib/coach/report';
import { refineVoiceProfile, voiceSummary } from '@engine/lib/coach/voice';
import { extractPostText } from '@engine/lib/coach/analysis';
import type { CoachBrief, StrategyData, StrategyPlayId } from '@engine/lib/model/types';
import type { StringKey } from '@engine/lib/i18n/strings';
import { CoachProgress } from './shared';

const PLAY_ICON: Record<StrategyPlayId, JSX.Element> = {
  full_strategy: <Compass size={16} />, audience_psychology: <Brain size={16} />,
  authority_positioning: <Crown size={16} />, content_pillars: <Columns3 size={16} />,
  thirty_day_plan: <CalendarDays size={16} />, scroll_post: <Megaphone size={16} />,
  monetization: <BadgePoundSterling size={16} />,
};

const EXAMPLE_BRIEF: { niche: string; audience: string; goals: string; businessModel: string; competitors: string; notes: string } = {
  niche: 'Welsh-language social media coaching for small businesses',
  audience: 'Owners of small Welsh businesses who want to grow online but feel time-poor and unsure where to start',
  goals: 'Grow to 10k engaged followers and book 5 coaching clients a month within 6 months',
  businessModel: '1:1 coaching plus a low-cost monthly membership',
  competitors: 'Generic English-only marketing coaches',
  notes: 'Warm, encouraging, bilingual tone',
};

export default function StrategyPanel({ brandId }: { brandId: string }) {
  const store = useStore();
  const { t } = useI18n();
  const { toast } = useOverlay();
  const navigate = useNavigate();
  const brand = store.getBrand(brandId);

  const createDraft = (headline: string, support?: string) => {
    const id = createDraftFromIdea(store, brandId, headline, { support });
    if (id) { toast({ message: t('coach.strategy.draftCreated') }); navigate(`/graphics/${id}`); }
  };
  const refs = store.referenceAccountsByBrand(brandId);
  const perf = store.performanceByBrand(brandId);

  const saved = store.getBrief(brandId);
  const [brief, setBriefState] = useState({
    niche: saved?.niche ?? '', audience: saved?.audience ?? '', goals: saved?.goals ?? '',
    businessModel: saved?.businessModel ?? '', competitors: saved?.competitors ?? '', notes: saved?.notes ?? '',
  });
  const [running, setRunning] = useState<StrategyPlayId | null>(null);
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<{ play: StrategyPlayId; data: StrategyData; usedAI: boolean } | null>(null);
  const voice = store.getVoiceProfile(brandId);
  const [learningVoice, setLearningVoice] = useState(false);

  const learnVoice = async () => {
    // Only posts with extractable copy can teach a voice - image-only/freeform
    // posts with no text would store a bogus 0-sample profile (Codex #97).
    const graphics = store.graphicsByBrand(brandId).filter((g) => extractPostText(g).joined.trim());
    if (!graphics.length) { toast({ message: t('coach.voice.noPosts') }); return; }
    setLearningVoice(true);
    const { profile, usedAI } = await refineVoiceProfile(graphics, brand);
    store.setVoiceProfile(brandId, profile);
    setLearningVoice(false);
    toast({ message: usedAI ? t('coach.voice.learnedAI') : t('coach.voice.learnedOffline') });
  };

  const ready = briefIsReady({ ...brief, id: brandId, brandId, updatedAt: '' });
  const set = (k: keyof typeof brief, v: string) => setBriefState((b) => ({ ...b, [k]: v }));
  const persistBrief = (): CoachBrief => store.setBrief(brandId, brief);

  const saveBrief = () => { persistBrief(); toast({ message: t('coach.strategy.briefSaved') }); };
  const loadExample = () => { setBriefState(EXAMPLE_BRIEF); store.setBrief(brandId, EXAMPLE_BRIEF); toast({ message: t('coach.strategy.exampleLoaded') }); };

  const run = async (play: StrategyPlayId) => {
    const savedBrief = persistBrief();
    setRunning(play); setResult(null);
    const pillarsArtifact = store.latestStrategy(brandId, 'content_pillars');
    const pillars = pillarsArtifact?.data.kind === 'pillars' ? pillarsArtifact.data.pillars.map((x) => x.name) : undefined;
    const r = await runStrategy({ play, brief: savedBrief, brand, referenceAccounts: refs, performanceEntries: perf, topic: play === 'scroll_post' ? topic : undefined, pillars, voice: voiceSummary(voice) });
    store.saveStrategy({ brandId, play, title: t(`coach.play.${play}` as StringKey), data: r.data, modelUsed: r.usedAI ? 'claude' : 'deterministic' });
    setResult({ play, data: r.data, usedAI: r.usedAI });
    setRunning(null);
    toast({ message: r.usedAI ? t('coach.strategy.builtAI') : t('coach.strategy.builtOffline') });
  };

  const field = (k: keyof typeof brief, rows = 2) => (
    <label className="block">
      <span className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-200">{t(`coach.strategy.${k}` as StringKey)}</span>
      <textarea value={brief[k]} onChange={(e) => set(k, e.target.value)} rows={rows} placeholder={t(`coach.strategy.${k}Ph` as StringKey)}
        className="mt-1 w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500" />
    </label>
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-3 text-[12px] leading-relaxed text-zinc-600 dark:border-violet-500/20 dark:bg-violet-500/[0.07] dark:text-zinc-300">{t('coach.strategy.intro')}</div>

      {/* business brief */}
      <Panel className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('coach.strategy.brief')}</p>
          <Button variant="ghost" onClick={loadExample}><Sparkles size={13} /> {t('coach.strategy.loadExample')}</Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {field('niche')}
          {field('audience')}
          {field('goals')}
          {field('businessModel')}
          {field('competitors')}
          {field('notes')}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <Button variant="subtle" onClick={saveBrief}><Save size={14} /> {t('coach.strategy.saveBrief')}</Button>
          {!ready && <span className="text-[12px] text-amber-600 dark:text-amber-400">{t('coach.strategy.fillBrief')}</span>}
        </div>
      </Panel>

      {/* brand voice (learned from past posts) */}
      <Panel className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-zinc-900 dark:text-zinc-50"><Mic size={15} className="text-violet-600 dark:text-violet-400" /> {t('coach.voice.title')}</span>
          <Button variant="subtle" disabled={learningVoice} onClick={learnVoice}><RefreshCw size={13} /> {learningVoice ? t('coach.voice.learning') : voice ? t('coach.voice.refresh') : t('coach.voice.learn')}</Button>
        </div>
        {voice ? (
          <div className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {voice.toneAdjectives.map((a, i) => <Badge key={i} tone="accent">{a}</Badge>)}
              <Badge tone="muted">{voice.language === 'cy' ? 'Cymraeg' : voice.language === 'bilingual' ? 'Cymraeg + English' : 'English'}</Badge>
              <Badge tone="muted">~{voice.avgWordsPerPost} {t('coach.voice.words')}</Badge>
              <Badge tone="muted">{t('coach.voice.emoji')}: {voice.emojiUsage}</Badge>
            </div>
            {voice.signaturePhrases.length > 0 && (
              <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{t('coach.voice.phrases')}: {voice.signaturePhrases.map((p) => `"${p}"`).join(', ')}</p>
            )}
            <ul className="space-y-1">
              {voice.doList.slice(0, 4).map((d, i) => <li key={i} className="flex items-start gap-1.5 text-[12.5px] leading-relaxed text-zinc-700 dark:text-zinc-200"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-500" /> {d}</li>)}
            </ul>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{t('coach.voice.basis', { n: voice.sampleCount })} {voice.modelUsed === 'deterministic' ? t('coach.offlineShort') : 'AI'}. {t('coach.voice.fedIn')}</p>
          </div>
        ) : (
          <p className="mt-2 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">{t('coach.voice.intro')}</p>
        )}
      </Panel>

      {/* plays */}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {STRATEGY_PLAYS.map((play) => (
          <div key={play.id} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">{PLAY_ICON[play.id]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">{t(`coach.play.${play.id}` as StringKey)}</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">{t(`coach.play.${play.id}.d` as StringKey)}</p>
              </div>
            </div>
            {play.id === 'scroll_post' && (
              <div className="mt-2"><TextInput value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={t('coach.strategy.topicPlaceholder')} /></div>
            )}
            <div className="mt-2.5 flex items-center gap-2">
              <Button variant="subtle" disabled={running !== null} onClick={() => run(play.id)}>
                <Sparkles size={13} /> {running === play.id ? t('coach.strategy.building') : store.latestStrategy(brandId, play.id) ? t('coach.strategy.regenerate') : t('coach.strategy.generate')}
              </Button>
              {store.latestStrategy(brandId, play.id) && result?.play !== play.id && (
                <button onClick={() => { const a = store.latestStrategy(brandId, play.id)!; setResult({ play: play.id, data: a.data, usedAI: a.modelUsed !== 'deterministic' }); }} className="text-[12px] font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400">{t('coach.strategy.viewLast')}</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {running && <CoachProgress steps={[t('coach.progress.s1'), t('coach.progress.s2'), t('coach.progress.s3'), t('coach.progress.s4')]} />}

      {result && (
        <Panel className="p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-[14px] font-bold text-zinc-900 dark:text-zinc-50">{PLAY_ICON[result.play]} {t(`coach.play.${result.play}` as StringKey)}</p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => exportStrategyReport(t, brand?.name || 'Postio', t(`coach.play.${result.play}` as StringKey), result.data)}><FileDown size={13} /> {t('coach.exportReport')}</Button>
              <Badge tone="muted">{result.usedAI ? t('coach.modelAI') : t('coach.modelOffline')}</Badge>
            </div>
          </div>
          <StrategyView data={result.data} onCreate={createDraft} />
        </Panel>
      )}
    </div>
  );
}

function StrategyView({ data, onCreate }: { data: StrategyData; onCreate: (headline: string, support?: string) => void }) {
  const { t } = useI18n();
  const { toast } = useOverlay();
  const copy = (s: string) => { navigator.clipboard?.writeText(s); toast({ message: t('coach.copied') }); };

  if (data.kind === 'sections') {
    return (
      <div className="space-y-3">
        {data.summary && <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">{data.summary}</p>}
        {data.sections.map((s, i) => (
          <div key={i} className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/30">
            <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">{s.heading}</p>
            {s.body && <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-600 dark:text-zinc-300">{s.body}</p>}
            {s.bullets && s.bullets.length > 0 && (
              <ul className="mt-1.5 space-y-1">
                {s.bullets.map((b, j) => <li key={j} className="flex items-start gap-1.5 text-[12.5px] leading-relaxed text-zinc-700 dark:text-zinc-200"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-500" /> {b}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (data.kind === 'pillars') {
    return (
      <div className="space-y-3">
        {data.summary && <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">{data.summary}</p>}
        <div className="grid gap-2.5 sm:grid-cols-2">
          {data.pillars.map((p, i) => (
            <div key={i} className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/30">
              <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">{i + 1}. {p.name}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">{p.why}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">{t('coach.strategy.topics')}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">{p.topics.map((x, j) => <span key={j} className="rounded-md bg-white px-2 py-0.5 text-[11.5px] text-zinc-700 ring-1 ring-inset ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700">{x}</span>)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.kind === 'calendar') {
    const goalTone = (g: string) => /sell/i.test(g) ? 'accent' : 'muted';
    return (
      <div className="space-y-2">
        {data.summary && <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">{data.summary}</p>}
        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {data.days.map((d) => (
              <div key={d.day} className="flex items-start gap-3 px-3.5 py-2.5">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-violet-50 text-[11px] font-bold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">{d.day}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-medium text-zinc-900 dark:text-zinc-50">{d.idea}</p>
                  <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400">{d.angle}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge tone="muted">{d.format}</Badge>
                  <Badge tone={goalTone(d.goal)}>{d.goal}</Badge>
                </div>
                <button onClick={() => onCreate(d.idea, d.angle)} title={t('coach.strategy.createPost')} aria-label={t('coach.strategy.createPost')} className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-500/10 dark:hover:text-violet-300"><PenLine size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // post
  const row = (label: string, value: string, copyable = true) => value ? (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/30">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
        {copyable && <button onClick={() => copy(value)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"><Copy size={12} /></button>}
      </div>
      <p className="mt-1 text-[13px] leading-relaxed text-zinc-800 dark:text-zinc-100">{value}</p>
    </div>
  ) : null;
  return (
    <div className="space-y-2.5">
      <div><Button variant="subtle" onClick={() => onCreate(data.hook, data.insight)}><PenLine size={14} /> {t('coach.strategy.createPost')}</Button></div>
      {row(t('coach.strategy.hook'), data.hook)}
      {row(t('coach.strategy.insight'), data.insight)}
      {row(t('coach.strategy.cta'), data.cta)}
      {data.caption && row(t('coach.strategy.caption'), data.caption)}
      {data.hashtags && data.hashtags.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/30">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('ai.hashtags')}</p>
          <p className="mt-1 text-[12.5px] text-violet-600 dark:text-violet-400">{data.hashtags.join(' ')}</p>
        </div>
      )}
    </div>
  );
}
