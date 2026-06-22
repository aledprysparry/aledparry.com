// ═══ Postio Coach: Benchmarks (enable/disable + save preset) ═══

import { useState } from 'react';
import { RotateCcw, Save, Info } from 'lucide-react';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useOverlay } from '@engine/components/primitives';
import { Button, Panel, TextInput } from '@engine/components/ui';
import { BENCHMARK_MODULES, DEFAULT_BENCHMARK_IDS } from '@engine/lib/coach/benchmarks';
import { useBm, useCoachConfig } from './shared';

function Switch({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={onClick}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${on ? 'bg-violet-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
      <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? 'translate-x-4' : ''}`} />
    </button>
  );
}

export default function BenchmarksPanel({ brandId }: { brandId: string }) {
  const { t } = useI18n();
  const { label, desc } = useBm();
  const store = useStore();
  const { toast } = useOverlay();
  const { enabledIds, setEnabled, toggle } = useCoachConfig(brandId);
  const [presetName, setPresetName] = useState('');

  const refs = store.referenceAccountsByBrand(brandId).some((a) => a.enabled);
  const perf = store.performanceByBrand(brandId).length > 0;

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    store.addPreset({ name, brandId, enabledBenchmarkIds: enabledIds });
    setPresetName('');
    toast({ message: t('coach.presetSaved', { name }) });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400">{t('coach.benchmarksIntro')}</p>
        <Button variant="ghost" onClick={() => setEnabled(DEFAULT_BENCHMARK_IDS)}><RotateCcw size={13} /> {t('coach.resetDefaults')}</Button>
      </div>

      <Panel className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {BENCHMARK_MODULES.map((m) => {
          const on = enabledIds.includes(m.id);
          const missing = (m.needs === 'accounts' && !refs) || (m.needs === 'performance' && !perf);
          return (
            <div key={m.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">{label(m.id)}</span>
                <p className="mt-0.5 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">{desc(m.id)}</p>
                {on && missing && (
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                    <Info size={11} /> {m.needs === 'accounts' ? t('coach.needsAccounts') : t('coach.needsPerformance')}
                  </p>
                )}
              </div>
              <Switch on={on} onClick={() => toggle(m.id)} label={label(m.id)} />
            </div>
          );
        })}
      </Panel>

      <Panel className="p-4">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('coach.saveAsPreset')}</p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1 sm:min-w-[220px]"><TextInput value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder={t('coach.presetNamePlaceholder')} /></div>
          <Button variant="subtle" onClick={savePreset} disabled={!presetName.trim()}><Save size={14} /> {t('coach.save')}</Button>
        </div>
        <p className="mt-2 text-[12px] text-zinc-500 dark:text-zinc-400">{t('coach.presetHint', { n: enabledIds.length })}</p>
      </Panel>
    </div>
  );
}
