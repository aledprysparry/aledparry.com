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
        <label className="text-[12px] font-semibold tracking-wide uppercase text-white/55">
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
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/70 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <Upload size={13} /> {t('data.csv')}
          </button>
          <button
            onClick={onLoadSample}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/70 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
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
        className="w-full h-56 resize-y rounded-xl bg-black/30 border border-white/10 focus:border-[#fecf0a]/60 focus:outline-none px-4 py-3 font-mono text-[13px] leading-relaxed text-white/90 placeholder:text-white/25"
      />

      <p className="text-[12px] text-white/40">{t('data.hint', { cols: t('data.cols') })}</p>

      {error && (
        <div className="rounded-lg border border-[#f87171]/40 bg-[#f87171]/10 px-4 py-2.5 text-[13px] text-[#fca5a5]">
          {error}
        </div>
      )}
      {!error && warnings.length > 0 && (
        <div className="rounded-lg border border-[#fecf0a]/30 bg-[#fecf0a]/10 px-4 py-2.5 text-[13px] text-[#fde68a] space-y-0.5">
          {warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
        </div>
      )}
      {!error && (
        <div className="inline-flex items-center gap-1.5 text-[12px] text-[#4ade80]">
          <Check size={13} /> {t('data.ready', { n: rowCount })}
        </div>
      )}
    </div>
  );
}
