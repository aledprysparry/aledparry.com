import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import type { StringKey } from '@engine/lib/i18n/strings';

export type CopyField = { key: string; label: string; labelKey?: StringKey };

const DEFAULT_FIELDS: CopyField[] = [
  { key: 'brandLine', label: 'Brand' },
  { key: 'weekLabel', label: 'Wythnos / dyddiad' },
  { key: 'coverKicker', label: 'Clawr - is-bennawd' },
  { key: 'coverTitle', label: 'Clawr - teitl' },
  { key: 'coverSubtitle', label: 'Clawr - disgrifiad' },
  { key: 'coverCta', label: 'Clawr - galwad' },
  { key: 'listTitle', label: 'Pennawd rhestr' },
  { key: 'scoreUnit', label: 'Uned sgôr' },
  { key: 'winnerKicker', label: 'Enillydd - label' },
  { key: 'winnerSubtitle', label: 'Enillydd - disgrifiad' },
  { key: 'ctaHeadline', label: 'CTA - pennawd' },
  { key: 'ctaSub', label: 'CTA - disgrifiad' },
  { key: 'ctaAction', label: 'CTA - botwm' },
  { key: 'ctaLink', label: 'CTA - dolen' },
  { key: 'footer', label: 'Troedyn' },
];

interface Props {
  copy: Record<string, string | undefined>;
  onChange: (key: string, value: string) => void;
  fields?: CopyField[];
}

export default function CopyEditor({ copy, onChange, fields }: Props) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const FIELDS = fields ?? DEFAULT_FIELDS;
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-[13px] font-semibold text-zinc-800 dark:text-zinc-100"
      >
        <span>{t('copy.title')}</span>
        <ChevronDown size={16} className={`text-zinc-500 transition-transform dark:text-zinc-400 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-4 grid grid-cols-1 gap-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{f.labelKey ? t(f.labelKey) : f.label}</span>
              <input
                value={copy[f.key] ?? ''}
                onChange={(e) => onChange(f.key, e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-800 focus:border-violet-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
