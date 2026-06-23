// ═══ Postio Coach: Presets (built-in + saved) ═══

import { Check, Trash2, Layers } from 'lucide-react';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useOverlay } from '@engine/components/primitives';
import { Button, Panel, Badge } from '@engine/components/ui';
import { BUILTIN_PRESETS } from '@engine/lib/coach/presets';
import { sanitiseBenchmarkIds } from '@engine/lib/coach/benchmarks';
import type { StringKey } from '@engine/lib/i18n/strings';
import { useBm, useCoachConfig } from './shared';

export default function PresetsPanel({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const { label } = useBm();
  const store = useStore();
  const { confirm, toast } = useOverlay();
  const { enabledIds, setEnabled, activePresetId } = useCoachConfig(brandId);
  const userPresets = store.presetsByBrand(brandId).filter((p) => !p.builtIn);

  const apply = (id: string, ids: string[], name: string) => {
    setEnabled(ids, id);
    toast({ message: t('coach.presetApplied', { name }) });
  };
  const remove = async (id: string, name: string) => {
    if (await confirm({ title: t('coach.deletePresetTitle', { name }), confirmLabel: t('coach.delete'), cancelLabel: t('coach.cancel'), danger: true })) {
      store.deletePreset(id);
    }
  };

  const sameSet = (ids: string[]) => {
    const a = sanitiseBenchmarkIds(ids).slice().sort().join(',');
    const b = enabledIds.slice().sort().join(',');
    return a === b;
  };

  const Row = ({ id, name, ids, builtIn }: { id: string; name: string; ids: string[]; builtIn?: boolean }) => {
    const active = activePresetId === id || sameSet(ids);
    return (
      <div className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 ${active ? 'border-violet-400 bg-violet-50/60 dark:border-violet-500/40 dark:bg-violet-500/10' : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'}`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">{name}</span>
            {builtIn && <Badge tone="muted">{t('coach.builtIn')}</Badge>}
            {active && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400"><Check size={12} /> {t('coach.active')}</span>}
          </div>
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {sanitiseBenchmarkIds(ids).map((x) => label(x)).join(' · ')}
          </p>
          <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">{t('coach.modulesCount', { n: sanitiseBenchmarkIds(ids).length })}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button variant="subtle" onClick={() => apply(id, ids, name)} disabled={active}>{t('coach.apply')}</Button>
          {!builtIn && (
            <button onClick={() => remove(id, name)} aria-label={t('coach.delete')} className="grid h-9 w-9 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-rose-600 dark:hover:bg-zinc-800"><Trash2 size={14} /></button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-zinc-500 dark:text-zinc-400">{t('coach.presetsIntro')}</p>

      <div>
        <p className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"><Layers size={13} /> {t('coach.builtInPresets')}</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {BUILTIN_PRESETS.map((p) => (
            <Row key={p.id} id={p.id} name={t(`coach.preset.${p.id}` as StringKey) || p.name} ids={p.enabledBenchmarkIds} builtIn />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('coach.yourPresets')}</p>
        {userPresets.length ? (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {userPresets.map((p) => <Row key={p.id} id={p.id} name={p.name} ids={p.enabledBenchmarkIds} />)}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-5 text-center text-[12px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">{t('coach.noUserPresets')}</p>
        )}
      </div>
    </div>
  );
}
