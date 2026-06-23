// ═══ Postio Coach: Reference (aspirational) accounts ═══
// Add accounts you admire; extract reusable PATTERNS (manual/model, never
// scraped). Framed as "inspired by", never "copy this account".

import { useState } from 'react';
import { Plus, Trash2, Sparkles, Wand2, Lightbulb, FlaskConical } from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { useOverlay } from '@engine/components/primitives';
import { Button, Panel, Badge, TextInput, EmptyState } from '@engine/components/ui';
import { callCoach } from '@engine/lib/coach/analysis';
import { SAMPLE_ACCOUNTS, sampleAccountProfile } from '@engine/lib/coach/mock';
import type { AccountBenchmarkProfile, AspirationalAccount, SocialPlatform } from '@engine/lib/model/types';

const PLATFORMS: SocialPlatform[] = ['instagram', 'tiktok', 'facebook', 'linkedin', 'youtube', 'x'];

export default function ReferenceAccountsPanel({ brandId }: { brandId: string }) {
  const store = useStore();
  const { t } = useI18n();
  const { confirm, toast } = useOverlay();
  const accounts = store.referenceAccountsByBrand(brandId);

  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const add = () => {
    if (!handle.trim()) return;
    store.addReferenceAccount(brandId, { platform, handle, displayName: displayName.trim() || undefined, notes: notes.trim() || undefined });
    setHandle(''); setDisplayName(''); setNotes('');
  };

  const loadSamples = () => {
    for (const s of SAMPLE_ACCOUNTS) {
      const acc = store.addReferenceAccount(brandId, { platform: s.platform, handle: s.handle, displayName: s.displayName, notes: s.notes });
      store.setReferenceProfile(acc.id, sampleAccountProfile(acc.id, s.platform, s.handle, s.notes));
    }
    toast({ message: t('coach.samplesLoaded') });
  };

  const extract = async (acc: AspirationalAccount) => {
    setBusy(acc.id);
    const { result, error } = await callCoach<Omit<AccountBenchmarkProfile, 'accountId' | 'platform'>>('coach-account', {
      account: { platform: acc.platform, handle: acc.handle, displayName: acc.displayName, notes: acc.notes },
    });
    const profile: AccountBenchmarkProfile = result
      ? { accountId: acc.id, platform: acc.platform, commonFormats: arr(result.commonFormats), toneOfVoice: arr(result.toneOfVoice), visualStyle: arr(result.visualStyle), postingPatterns: arr(result.postingPatterns), recurringHooks: arr(result.recurringHooks), captionPatterns: arr(result.captionPatterns), ctaPatterns: arr(result.ctaPatterns), highPerformingThemes: arr(result.highPerformingThemes), contentPillars: arr(result.contentPillars), lessonsForUser: arr(result.lessonsForUser) }
      : sampleAccountProfile(acc.id, acc.platform, acc.handle, acc.notes);
    store.setReferenceProfile(acc.id, profile);
    setBusy(null);
    toast({ message: result ? t('coach.patternsExtractedAI') : t('coach.patternsExtractedOffline') });
    if (error && error !== 'not_configured' && error !== 'unauthorized') { /* offline path already used */ }
  };

  const remove = async (acc: AspirationalAccount) => {
    if (await confirm({ title: t('coach.removeAccountTitle', { name: acc.displayName || acc.handle }), confirmLabel: t('coach.delete'), cancelLabel: t('coach.cancel'), danger: true })) {
      store.removeReferenceAccount(acc.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-3 text-[12px] leading-relaxed text-zinc-600 dark:border-violet-500/20 dark:bg-violet-500/[0.07] dark:text-zinc-300">
        {t('coach.refIntro')}
      </div>

      <Panel className="p-4">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('coach.addReferenceAccount')}</p>
        <div className="flex flex-wrap items-center gap-2">
          <select value={platform} onChange={(e) => setPlatform(e.target.value as SocialPlatform)} className="eng-control rounded-lg border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="min-w-0 flex-1 sm:min-w-[140px]"><TextInput value={handle} onChange={(e) => setHandle(e.target.value)} placeholder={t('coach.handlePlaceholder')} /></div>
          <div className="min-w-0 flex-1 sm:min-w-[140px]"><TextInput value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t('coach.displayNamePlaceholder')} /></div>
        </div>
        <div className="mt-2"><TextInput value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('coach.refNotesPlaceholder')} /></div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <Button onClick={add} disabled={!handle.trim()}><Plus size={14} /> {t('coach.addAccount')}</Button>
          {!accounts.length && <Button variant="ghost" onClick={loadSamples}><Sparkles size={13} /> {t('coach.loadSamples')}</Button>}
        </div>
      </Panel>

      {accounts.length === 0 ? (
        <EmptyState title={t('coach.noRefAccountsTitle')} hint={t('coach.noRefAccountsHint')} />
      ) : (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <Panel key={acc.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <Badge tone="accent">{acc.platform}</Badge>
                  <span className="truncate text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">{acc.displayName || `@${acc.handle}`}</span>
                  <span className="truncate text-[12px] text-zinc-400 dark:text-zinc-500">@{acc.handle}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="subtle" disabled={busy === acc.id} onClick={() => extract(acc)}>
                    <Wand2 size={14} /> {busy === acc.id ? t('coach.extracting') : acc.profile ? t('coach.reExtract') : t('coach.extractPatterns')}
                  </Button>
                  <button onClick={() => remove(acc)} aria-label={t('coach.delete')} className="grid h-9 w-9 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-rose-600 dark:hover:bg-zinc-800"><Trash2 size={14} /></button>
                </div>
              </div>
              {acc.notes && <p className="mt-2 text-[12px] italic text-zinc-500 dark:text-zinc-400">“{acc.notes}”</p>}
              {acc.profile && <Profile profile={acc.profile} />}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

function Profile({ profile }: { profile: AccountBenchmarkProfile }) {
  const { t } = useI18n();
  const chips = (title: string, items: string[]) => items.length ? (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{title}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">{items.map((it, i) => <span key={i} className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11.5px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">{it}</span>)}</div>
    </div>
  ) : null;

  return (
    <div className="mt-3 space-y-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
      <div className="rounded-xl bg-violet-50 p-3 dark:bg-violet-500/10">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300"><Lightbulb size={12} /> {t('coach.lessonsForYou')}</p>
        <ul className="mt-1.5 space-y-1">
          {profile.lessonsForUser.map((l, i) => <li key={i} className="flex items-start gap-1.5 text-[12.5px] leading-relaxed text-zinc-700 dark:text-zinc-200"><FlaskConical size={12} className="mt-0.5 shrink-0 text-violet-500" /> {l}</li>)}
        </ul>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {chips(t('coach.contentPillars'), profile.contentPillars)}
        {chips(t('coach.commonFormats'), profile.commonFormats)}
        {chips(t('coach.toneOfVoice'), profile.toneOfVoice)}
        {chips(t('coach.recurringHooks'), profile.recurringHooks)}
        {chips(t('coach.ctaPatterns'), profile.ctaPatterns)}
        {chips(t('coach.highPerformingThemes'), profile.highPerformingThemes)}
      </div>
    </div>
  );
}

const arr = (x: unknown): string[] => (Array.isArray(x) ? x.filter((v) => typeof v === 'string') : []);
