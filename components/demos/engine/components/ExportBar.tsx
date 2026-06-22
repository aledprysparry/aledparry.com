import { Download } from 'lucide-react';

interface Props {
  format: string;
  onFormat: (mime: string) => void;
  onExportZip: () => void;
  exporting: boolean;
  disabled: boolean;
}

export default function ExportBar({ format, onFormat, onExportZip, exporting, disabled }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-zinc-500 font-semibold uppercase tracking-wide">Fformat</span>
        <div className="inline-flex rounded-lg border border-zinc-200 overflow-hidden">
          {['image/png', 'image/jpeg'].map((m) => (
            <button
              key={m}
              onClick={() => onFormat(m)}
              className={
                'px-4 py-1.5 text-[13px] font-semibold transition-colors ' +
                (format === m ? 'bg-violet-600 text-white' : 'bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100')
              }
            >
              {m === 'image/png' ? 'PNG' : 'JPEG'}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onExportZip}
        disabled={exporting || disabled}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-600 text-white text-[13px] font-bold hover:bg-violet-700 transition disabled:opacity-50"
      >
        <Download size={15} /> {exporting ? 'Wrthi...' : 'Lawrlwytho popeth (ZIP)'}
      </button>

      <span className="text-[12px] text-zinc-500">1080 × 1350 · carwsél portread Instagram</span>
    </div>
  );
}
