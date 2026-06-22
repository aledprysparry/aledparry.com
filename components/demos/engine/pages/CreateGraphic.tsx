import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, Check, Image as ImageIcon, Layers, Film, type LucideIcon } from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { Button, Panel, EmptyState } from '@engine/components/ui';
import { getKind } from '@engine/lib/templates/registry';
import { PLATFORM_PRESETS } from '@engine/lib/platforms/presets';
import type { PlatformId, TemplateType } from '@engine/lib/model/types';
import type { StringKey } from '@engine/lib/i18n/strings';

// Group templates by Asset kind so the create flow reads as
// "what are you making?" (the Postio Create Post → Choose Asset Type step).
const ASSET_GROUPS: { key: string; labelKey: StringKey; Icon: LucideIcon; types: TemplateType[] }[] = [
  { key: 'stills', labelKey: 'create.group.stills', Icon: ImageIcon, types: ['still', 'story-cover'] },
  { key: 'carousels', labelKey: 'create.group.carousels', Icon: Layers, types: ['carousel'] },
  { key: 'animated', labelKey: 'create.group.animated', Icon: Film, types: ['sequence'] },
];

export default function CreateGraphic() {
  const { brandId = '' } = useParams();
  const [params] = useSearchParams();
  const store = useStore();
  const navigate = useNavigate();
  const { t } = useI18n();
  const brand = store.getBrand(brandId);
  const templates = store.templatesByBrand(brandId);
  const folders = store.foldersByBrand(brandId);

  const [templateId, setTemplateId] = useState<string>(params.get('template') || templates[0]?.id || '');
  const template = templates.find((t) => t.id === templateId);
  const kind = template && getKind(template.kind);

  const platforms = useMemo<PlatformId[]>(
    () => (template ? template.supportedPlatforms : []),
    [template],
  );
  const [platform, setPlatform] = useState<PlatformId>(platforms[0] || 'instagram-carousel');
  const [folderId, setFolderId] = useState<string>(params.get('folder') || '');

  if (!brand) return <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8"><EmptyState title={t('brand.notFound')} /></div>;

  const create = () => {
    if (!template) return;
    const g = store.createGraphic(brandId, template.id, { platform, folderId: folderId || undefined });
    if (g) navigate(`/graphics/${g.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
      <Link to={`/brands/${brandId}`} className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
        <ArrowLeft size={14} /> {brand.name}
      </Link>
      <h1 className="text-[24px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[26px]">{t('create.title')}</h1>
      <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">{t('create.subtitle')}</p>

      {templates.length === 0 ? (
        <div className="mt-6"><EmptyState title={t('create.noTemplates')} hint={t('create.noTemplatesHint')} action={<Link to={`/brands/${brandId}`}><Button variant="subtle">{t('create.goToBrand')}</Button></Link>} /></div>
      ) : (
        <>
          <section className="mt-7">
            <h2 className="mb-3 text-[12px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('create.assetType')}</h2>
            <div className="space-y-5">
              {ASSET_GROUPS.map((g) => {
                const items = templates.filter((tp) => g.types.includes((getKind(tp.kind)?.type ?? 'still') as TemplateType));
                if (items.length === 0) return null;
                return (
                  <div key={g.key}>
                    <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      <g.Icon size={14} className="text-violet-600 dark:text-violet-400" /> {t(g.labelKey)}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {items.map((tp) => {
                        const active = tp.id === templateId;
                        return (
                          <button key={tp.id} onClick={() => { setTemplateId(tp.id); setPlatform(tp.supportedPlatforms[0] || 'instagram-carousel'); }} className="text-left">
                            <Panel className={`p-4 transition-colors ${active ? 'border-violet-400 ring-1 ring-violet-400/40 dark:border-violet-500' : 'hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
                              <div className="flex items-center justify-between">
                                <span className="text-[15px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{tp.name}</span>
                                {active && <Check size={16} className="text-violet-600 dark:text-violet-400" />}
                              </div>
                              <p className="mt-1 text-[12px] text-zinc-500 dark:text-zinc-400">{getKind(tp.kind)?.description}</p>
                            </Panel>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mt-7">
            <h2 className="mb-3 text-[12px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('create.platform')}</h2>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => {
                const preset = PLATFORM_PRESETS[p];
                const active = p === platform;
                return (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`rounded-lg border px-3.5 py-2 text-left transition-colors ${active ? 'border-violet-400 bg-violet-50 dark:border-violet-500 dark:bg-violet-500/15' : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'}`}
                  >
                    <div className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{preset.name}</div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{preset.width}×{preset.height} · {preset.aspectRatio}</div>
                  </button>
                );
              })}
            </div>
            {kind && <p className="mt-3 text-[12px] text-zinc-500 dark:text-zinc-400">{t('create.seedNote', { type: kind.type })}</p>}
          </section>

          {folders.length > 0 && (
            <section className="mt-7">
              <h2 className="mb-3 text-[12px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('create.folder')}</h2>
              <select value={folderId} onChange={(e) => setFolderId(e.target.value)} className="eng-control rounded-lg border border-zinc-200 bg-white px-3 text-zinc-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                <option value="">{t('create.noFolder')}</option>
                {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </section>
          )}

          <div className="mt-8">
            <Button onClick={create} disabled={!template}><Sparkles size={15} /> {t('create.cta')}</Button>
          </div>
        </>
      )}
    </div>
  );
}
