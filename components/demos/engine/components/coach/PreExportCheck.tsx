// ═══ Postio Coach: pre-export check (UI) ═══
// A deterministic gate shown in the editor before export.

import { useState } from 'react';
import { ShieldCheck, AlertTriangle, Info, XCircle, Check } from 'lucide-react';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { useStore } from '@engine/lib/store/StoreProvider';
import { effectiveCopyForGraphic } from '@engine/lib/carousel/copy';
import { Panel, Button } from '@engine/components/ui';
import { preExportCheck, severityRank, type CheckItem, type CheckSeverity } from '@engine/lib/coach/preExport';
import type { Brand, GeneratedGraphic } from '@engine/lib/model/types';
import type { StringKey } from '@engine/lib/i18n/strings';

const ICON: Record<CheckSeverity, JSX.Element> = {
  error: <XCircle size={13} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />,
  warn: <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />,
  info: <Info size={13} className="mt-0.5 shrink-0 text-zinc-400" />,
};

export default function PreExportCheck({ graphic, brand, platformName }: { graphic: GeneratedGraphic; brand?: Brand; platformName: string }) {
  const { t, lang } = useI18n();
  const store = useStore();
  const [items, setItems] = useState<CheckItem[] | null>(null);

  const run = () => {
    // Score the copy the post renders (kind defaults + master + overrides).
    const resolvedCopy = effectiveCopyForGraphic(graphic, store.getTemplate(graphic.templateId), lang);
    const out = preExportCheck(graphic, brand, platformName, resolvedCopy).sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
    setItems(out);
  };

  const blocking = items?.filter((i) => i.severity === 'error').length ?? 0;
  const warnings = items?.filter((i) => i.severity === 'warn').length ?? 0;

  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">
          <ShieldCheck size={15} className="text-violet-600 dark:text-violet-400" /> {t('review.preExport')}
        </span>
        <Button variant="subtle" onClick={run}>{t('review.preExportRun')}</Button>
      </div>

      {items && (
        <div className="mt-3">
          {blocking === 0 && warnings === 0 ? (
            <p className="inline-flex items-center gap-1.5 text-[12px] text-emerald-600 dark:text-emerald-400"><Check size={13} /> {t('review.preExportPass')}</p>
          ) : (
            <p className="mb-2 text-[12px] text-zinc-500 dark:text-zinc-400">
              {blocking > 0 ? t('review.preExportBlocking', { n: blocking }) : t('review.preExportWarnings', { n: warnings })}
            </p>
          )}
          <ul className="space-y-1.5">
            {items.map((it) => (
              <li key={it.id} className="flex items-start gap-1.5 text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                {ICON[it.severity]} {t(it.key as StringKey, it.vars)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
