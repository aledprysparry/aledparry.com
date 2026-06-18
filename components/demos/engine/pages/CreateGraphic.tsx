import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, Check } from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { Button, Panel, EmptyState } from '@engine/components/ui';
import { getKind } from '@engine/lib/templates/registry';
import { PLATFORM_PRESETS } from '@engine/lib/platforms/presets';
import type { PlatformId } from '@engine/lib/model/types';

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

  if (!brand) return <div className="mx-auto max-w-3xl px-8 py-10"><EmptyState title={t('brand.notFound')} /></div>;

  const create = () => {
    if (!template) return;
    const g = store.createGraphic(brandId, template.id, { platform, folderId: folderId || undefined });
    if (g) navigate(`/graphics/${g.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <Link to={`/brands/${brandId}`} className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-white/45 hover:text-white">
        <ArrowLeft size={14} /> {brand.name}
      </Link>
      <h1 className="font-serif text-[26px] font-extrabold tracking-tight" style={{ fontFamily: 'Bitter, serif' }}>{t('create.title')}</h1>
      <p className="mt-1 text-[13px] text-white/45">{t('create.subtitle')}</p>

      {templates.length === 0 ? (
        <div className="mt-6"><EmptyState title={t('create.noTemplates')} hint={t('create.noTemplatesHint')} action={<Link to={`/brands/${brandId}`}><Button variant="subtle">{t('create.goToBrand')}</Button></Link>} /></div>
      ) : (
        <>
          <section className="mt-7">
            <h2 className="mb-3 text-[12px] font-bold uppercase tracking-wide text-white/45">{t('create.template')}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((t) => {
                const active = t.id === templateId;
                return (
                  <button key={t.id} onClick={() => { setTemplateId(t.id); setPlatform(t.supportedPlatforms[0] || 'instagram-carousel'); }} className="text-left">
                    <Panel className={`p-4 transition-colors ${active ? 'border-indigo-400/70 ring-1 ring-indigo-400/40' : 'hover:border-white/25'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-[15px] font-bold" style={{ fontFamily: 'Bitter, serif' }}>{t.name}</span>
                        {active && <Check size={16} className="text-indigo-300" />}
                      </div>
                      <p className="mt-1 text-[12px] text-white/45">{getKind(t.kind)?.description}</p>
                    </Panel>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-7">
            <h2 className="mb-3 text-[12px] font-bold uppercase tracking-wide text-white/45">{t('create.platform')}</h2>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => {
                const preset = PLATFORM_PRESETS[p];
                const active = p === platform;
                return (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`rounded-lg border px-3.5 py-2 text-left transition-colors ${active ? 'border-indigo-400/70 bg-indigo-500/10' : 'border-white/10 bg-white/[0.02] hover:border-white/25'}`}
                  >
                    <div className="text-[13px] font-semibold">{preset.name}</div>
                    <div className="text-[11px] text-white/40">{preset.width}×{preset.height} · {preset.aspectRatio}</div>
                  </button>
                );
              })}
            </div>
            {kind && <p className="mt-3 text-[12px] text-white/40">{t('create.seedNote', { type: kind.type })}</p>}
          </section>

          {folders.length > 0 && (
            <section className="mt-7">
              <h2 className="mb-3 text-[12px] font-bold uppercase tracking-wide text-white/45">{t('create.folder')}</h2>
              <select value={folderId} onChange={(e) => setFolderId(e.target.value)} className="rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-[13px] text-white/90 focus:outline-none">
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
