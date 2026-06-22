import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ImagePlus, Check, X, Link2, Sparkles } from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { Button, Panel, TextInput } from '@engine/components/ui';
import { fileToStoredDataURL } from '@engine/lib/util/imageScale';
import type { SocialAccount } from '@engine/lib/model/types';

const SOCIAL_PLATFORMS: SocialAccount['platform'][] = ['instagram', 'tiktok', 'facebook', 'linkedin', 'x'];

// Section wrapper: a numbered, titled block with an "Optional" affordance.
function Field({ step, title, hint, optional, children }: { step: number; title: string; hint: string; optional?: boolean; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex gap-3 sm:gap-4">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-50 text-[12px] font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">{step}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h2>
          {optional && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">{t('onb.optional')}</span>}
        </div>
        <p className="mt-0.5 text-[12.5px] leading-snug text-zinc-500 dark:text-zinc-400">{hint}</p>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

export default function Onboarding() {
  const store = useStore();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<SocialAccount['platform']>('instagram');
  const [link, setLink] = useState('');
  const [logo, setLogo] = useState<{ name: string; url: string } | null>(null);
  const [posts, setPosts] = useState<{ name: string; url: string }[]>([]);
  const [busy, setBusy] = useState(false);

  const onLogo = async (file: File | undefined) => {
    if (!file) return;
    setLogo({ name: file.name, url: await fileToStoredDataURL(file, 512) });
  };
  const onPosts = async (files: FileList | null) => {
    if (!files) return;
    const added = await Promise.all(Array.from(files).map(async (f) => ({ name: f.name, url: await fileToStoredDataURL(f, 1200) })));
    setPosts((p) => [...p, ...added]);
  };

  const create = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const brand = store.createBrand(name);
      if (link.trim()) store.addSocialAccount(brand.id, { platform, url: link.trim() });
      if (logo) store.addAsset(brand.id, { type: 'logo', name: logo.name, url: logo.url });
      for (const p of posts) store.addAsset(brand.id, { type: 'social-post', name: p.name, url: p.url });
      navigate(`/brands/${brand.id}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8 sm:py-12">
      <button onClick={() => navigate('/')} className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
        <ArrowLeft size={14} /> {t('nav.dashboard')}
      </button>

      <header className="mb-8">
        <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">{t('onb.kicker')}</div>
        <h1 className="mt-1 text-[26px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[28px]">{t('onb.title')}</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-300">{t('onb.subtitle')}</p>
      </header>

      <Panel className="space-y-7 p-5 sm:p-7">
        <Field step={1} title={t('onb.nameLabel')} hint={t('onb.nameHint')}>
          <TextInput
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') create(); }}
            placeholder={t('onb.namePlaceholder')}
          />
        </Field>

        <div className="border-t border-zinc-200 dark:border-zinc-800" />

        <Field step={2} title={t('onb.linkLabel')} hint={t('onb.linkHint')} optional>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="pointer-events-none -mr-1 text-zinc-400 dark:text-zinc-500"><Link2 size={15} /></span>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as SocialAccount['platform'])}
              className="eng-control rounded-lg border border-zinc-200 bg-white px-3 text-zinc-900 transition-colors focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {SOCIAL_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <div className="min-w-0 flex-1 sm:min-w-[200px]"><TextInput value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://instagram.com/yourbrand" /></div>
          </div>
        </Field>

        <div className="border-t border-zinc-200 dark:border-zinc-800" />

        <Field step={3} title={t('onb.logoLabel')} hint={t('onb.logoHint')} optional>
          {logo ? (
            <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-900">
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <img src={logo.url} alt="" className="max-h-full max-w-full object-contain" />
              </span>
              <span className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-600 dark:text-zinc-300"><Check size={14} className="text-emerald-600 dark:text-emerald-400" /> {t('onb.logoReady')}</span>
              <button onClick={() => setLogo(null)} className="ml-auto inline-flex items-center gap-1 text-[12px] font-semibold text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"><X size={13} /> {t('onb.remove')}</button>
            </div>
          ) : (
            <label className="eng-control inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 font-semibold text-zinc-800 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
              <ImagePlus size={15} /> {t('onb.logoCta')}
            </label>
          )}
        </Field>

        <div className="border-t border-zinc-200 dark:border-zinc-800" />

        <Field step={4} title={t('onb.postsLabel')} hint={t('onb.postsHint')} optional>
          <div className="flex flex-wrap items-center gap-3">
            <label className="eng-control inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 font-semibold text-zinc-800 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800">
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onPosts(e.target.files)} />
              <ImagePlus size={15} /> {t('onb.postsCta')}
            </label>
            {posts.length > 0 && <span className="text-[12px] text-zinc-500 dark:text-zinc-400">{t('onb.postsCount', { n: posts.length })}</span>}
          </div>
          {posts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {posts.map((p, i) => (
                <span key={i} className="group relative h-14 w-14 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => setPosts((arr) => arr.filter((_, j) => j !== i))} className="absolute inset-0 grid place-items-center bg-zinc-900/50 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100" title={t('onb.remove')}><X size={15} /></button>
                </span>
              ))}
            </div>
          )}
        </Field>
      </Panel>

      <div className="mt-6 flex items-center justify-between gap-4">
        <button onClick={() => navigate('/')} className="text-[13px] font-semibold text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">{t('onb.cancel')}</button>
        <Button onClick={create} disabled={!name.trim() || busy}>
          <Sparkles size={15} /> {busy ? t('onb.creating') : t('onb.create')} <ArrowRight size={15} />
        </Button>
      </div>
    </div>
  );
}
