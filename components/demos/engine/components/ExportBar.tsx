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
        <span className="text-[12px] text-white/45 font-semibold uppercase tracking-wide">Fformat</span>
        <div className="inline-flex rounded-lg border border-white/10 overflow-hidden">
          {['image/png', 'image/jpeg'].map((m) => (
            <button
              key={m}
              onClick={() => onFormat(m)}
              className={
                'px-4 py-1.5 text-[13px] font-semibold transition-colors ' +
                (format === m ? 'bg-[#fecf0a] text-[#002C6A]' : 'bg-transparent text-white/60 hover:text-white hover:bg-white/5')
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
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#fecf0a] text-[#002C6A] text-[13px] font-bold hover:brightness-95 transition disabled:opacity-50"
      >
        <Download size={15} /> {exporting ? 'Wrthi...' : 'Lawrlwytho popeth (ZIP)'}
      </button>

      <span className="text-[12px] text-white/40">1080 × 1350 · carwsél portread Instagram</span>
    </div>
  );
}
