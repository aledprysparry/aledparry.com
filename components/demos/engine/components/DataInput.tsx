import { useRef } from 'react';
import { Upload, FileSpreadsheet, Check } from 'lucide-react';
import { fileToText } from '@engine/lib/carousel/parseLeaderboard';
import { useI18n } from '@engine/lib/i18n/I18nProvider';

interface Props {
  value: string;
  onChange: (text: string) => void;
  warnings: string[];
  error: string | null;
  rowCount: number;
  onLoadSample: () => void;
}

export default function DataInput({ value, onChange, warnings, error, rowCount, onLoadSample }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      onChange(await fileToText(file));
    } catch {
      onChange('');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[12px] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">
          {t('data.label')}
        </label>
        <div className="flex items-center gap-1">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,.xlsx,.xls,text/csv"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <Upload size={13} /> {t('data.csv')}
          </button>
          <button
            onClick={onLoadSample}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-semibold text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <FileSpreadsheet size={13} /> {t('data.sample')}
          </button>
        </div>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder={t('data.placeholder')}
        className="h-56 w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 font-mono text-[13px] leading-relaxed text-zinc-800 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />

      <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{t('data.hint', { cols: t('data.cols') })}</p>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}
      {!error && warnings.length > 0 && (
        <div className="space-y-0.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-[13px] text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
          {warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
        </div>
      )}
      {!error && (
        <div className="inline-flex items-center gap-1.5 text-[12px] text-emerald-600 dark:text-emerald-400">
          <Check size={13} /> {t('data.ready', { n: rowCount })}
        </div>
      )}
    </div>
  );
}
