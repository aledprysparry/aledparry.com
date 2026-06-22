import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Layers } from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { Button, Panel, EmptyState } from '@engine/components/ui';
import CopyEditor from '@engine/components/CopyEditor';
import SlideCanvas from '@engine/components/SlideCanvas';
import { getKind } from '@engine/lib/templates/registry';
import { effectiveCopy } from '@engine/lib/carousel/copy';
import type { CarouselCopy } from '@engine/lib/carousel/types';

// Edit a template's MASTER copy. Saving here updates every graphic that
// hasn't overridden the field. Preview renders the slides with the master
// copy + the kind's sample data.
export default function MasterEditor() {
  const { templateId = '' } = useParams();
  const store = useStore();
  const { t } = useI18n();
  const template = store.getTemplate(templateId);
  const kind = template && getKind(template.kind);

  const rows = useMemo(
    () => (kind?.parse ? kind.parse(kind.sampleData ?? '').rows : []),
    [kind],
  );

  if (!template || !kind) {
    return <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8"><EmptyState title={t('brand.notFound')} action={<Link to="/"><Button variant="subtle">{t('nav.dashboard')}</Button></Link>} /></div>;
  }

  const masterCopy = (template.master?.copy ?? {}) as Record<string, string>;
  const copy = effectiveCopy(kind.defaultCopy, masterCopy, {}) as unknown as CarouselCopy;
  const slides = kind.slides ?? [];
  const setField = (k: string, v: string) => store.updateTemplateMaster(template.id, { [k]: v });

  return (
    <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Link to={`/brands/${template.brandId}`} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
        <ArrowLeft size={14} /> {t('master.backToBrand')}
      </Link>
      <header className="mb-6 flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"><Layers size={18} /></span>
        <div className="min-w-0">
          <div className="text-[12px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400">{t('master.title')}</div>
          <h1 className="truncate text-[20px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[22px]">{template.name}</h1>
        </div>
      </header>

      {kind.editor === 'freeform' ? (
        <EmptyState title={t('master.title')} hint="Visual layout master editing for freeform templates arrives in the next phase." />
      ) : (
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-[360px_1fr]">
          <div className="flex flex-col gap-4">
            <Panel className="p-5"><CopyEditor copy={copy as unknown as Record<string, string | undefined>} onChange={setField} fields={kind.copyFields} /></Panel>
            <p className="text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">{t('master.note')}</p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{t('master.preview')}</p>
            <Panel className="bg-zinc-100 p-4 dark:bg-zinc-800/40 sm:p-5">
              <div className="flex snap-x gap-5 overflow-x-auto pb-3">
                {slides.map((slide, i) => (
                  <div key={slide.id} className="shrink-0 snap-start" style={{ width: 260 }}>
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{i + 1}. {slide.label}</div>
                    <div className="overflow-hidden rounded-xl border border-zinc-200 shadow-xl shadow-zinc-900/10 dark:border-zinc-700">
                      <SlideCanvas slide={slide} index={i} rows={rows} copy={copy} slideCount={slides.length} ratio="portrait" />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
