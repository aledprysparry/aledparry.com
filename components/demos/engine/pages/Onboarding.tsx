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
    <div className="flex gap-4">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-[12px] font-bold text-white/55">{step}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-bold text-white/90">{title}</h2>
          {optional && <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/40">{t('onb.optional')}</span>}
        </div>
        <p className="mt-0.5 text-[12.5px] leading-snug text-white/45">{hint}</p>
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
    <div className="mx-auto max-w-2xl px-8 py-12">
      <button onClick={() => navigate('/')} className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-white/45 hover:text-white">
        <ArrowLeft size={14} /> {t('nav.dashboard')}
      </button>

      <header className="mb-8">
        <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-indigo-300">{t('onb.kicker')}</div>
        <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">{t('onb.title')}</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-white/50">{t('onb.subtitle')}</p>
      </header>

      <Panel className="space-y-7 p-7">
        <Field step={1} title={t('onb.nameLabel')} hint={t('onb.nameHint')}>
          <TextInput
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') create(); }}
            placeholder={t('onb.namePlaceholder')}
          />
        </Field>

        <div className="border-t border-white/[0.06]" />

        <Field step={2} title={t('onb.linkLabel')} hint={t('onb.linkHint')} optional>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="pointer-events-none -mr-1 text-white/30"><Link2 size={15} /></span>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as SocialAccount['platform'])}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[13px] text-white/90 focus:outline-none"
            >
              {SOCIAL_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <div className="min-w-[200px] flex-1"><TextInput value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://instagram.com/yourbrand" /></div>
          </div>
        </Field>

        <div className="border-t border-white/[0.06]" />

        <Field step={3} title={t('onb.logoLabel')} hint={t('onb.logoHint')} optional>
          {logo ? (
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-black/30">
                <img src={logo.url} alt="" className="max-h-full max-w-full object-contain" />
              </span>
              <span className="inline-flex items-center gap-1.5 text-[12.5px] text-white/70"><Check size={14} className="text-emerald-400" /> {t('onb.logoReady')}</span>
              <button onClick={() => setLogo(null)} className="ml-auto inline-flex items-center gap-1 text-[12px] font-semibold text-white/45 hover:text-white"><X size={13} /> {t('onb.remove')}</button>
            </div>
          ) : (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-[13px] font-semibold text-white/85 hover:bg-white/10">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onLogo(e.target.files?.[0])} />
              <ImagePlus size={15} /> {t('onb.logoCta')}
            </label>
          )}
        </Field>

        <div className="border-t border-white/[0.06]" />

        <Field step={4} title={t('onb.postsLabel')} hint={t('onb.postsHint')} optional>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-[13px] font-semibold text-white/85 hover:bg-white/10">
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onPosts(e.target.files)} />
              <ImagePlus size={15} /> {t('onb.postsCta')}
            </label>
            {posts.length > 0 && <span className="text-[12px] text-white/45">{t('onb.postsCount', { n: posts.length })}</span>}
          </div>
          {posts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {posts.map((p, i) => (
                <span key={i} className="group relative h-14 w-14 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => setPosts((arr) => arr.filter((_, j) => j !== i))} className="absolute inset-0 grid place-items-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100" title={t('onb.remove')}><X size={15} /></button>
                </span>
              ))}
            </div>
          )}
        </Field>
      </Panel>

      <div className="mt-6 flex items-center justify-between gap-4">
        <button onClick={() => navigate('/')} className="text-[13px] font-semibold text-white/45 hover:text-white">{t('onb.cancel')}</button>
        <Button onClick={create} disabled={!name.trim() || busy}>
          <Sparkles size={15} /> {busy ? t('onb.creating') : t('onb.create')} <ArrowRight size={15} />
        </Button>
      </div>
    </div>
  );
}
