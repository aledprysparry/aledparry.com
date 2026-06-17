import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type CopyField = { key: string; label: string };

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
  const FIELDS = fields ?? DEFAULT_FIELDS;
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-[13px] font-semibold text-white/80"
      >
        <span>Golygu testun</span>
        <ChevronDown size={16} className={`text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="grid grid-cols-1 gap-3 mt-4">
          {FIELDS.map((f) => (
            <label key={f.key} className="flex flex-col gap-1">
              <span className="text-[11px] uppercase tracking-wide text-white/40">{f.label}</span>
              <input
                value={copy[f.key] ?? ''}
                onChange={(e) => onChange(f.key, e.target.value)}
                className="rounded-lg bg-black/30 border border-white/10 focus:border-[#fecf0a]/60 focus:outline-none px-3 py-2 text-[13px] text-white/90"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
