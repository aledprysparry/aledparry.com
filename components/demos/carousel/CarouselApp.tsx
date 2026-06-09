'use client';

import { useEffect, useMemo, useState } from 'react';
import { parseLeaderboardText, SAMPLE_CSV } from '@carousel/lib/parseLeaderboard';
import { SLIDES, DEFAULT_COPY } from '@carousel/lib/template';
import { exportSlide, exportZip } from '@carousel/lib/exportCarousel';
import type { CarouselCopy } from '@carousel/lib/types';
import DataInput from '@carousel/ui/DataInput';
import CopyEditor from '@carousel/ui/CopyEditor';
import ExportBar from '@carousel/ui/ExportBar';
import SlideCanvas from '@carousel/ui/SlideCanvas';

// The canvas templates draw with real "Inter"/"Bitter" families. The
// site loads Inter via next/font (hashed name) and not Bitter at all,
// so we inject the real-named webfonts ourselves.
const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Bitter:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800;900&display=swap';

export default function App() {
  const [rawText, setRawText] = useState(SAMPLE_CSV);
  const [copy, setCopy] = useState<CarouselCopy>(DEFAULT_COPY);
  const [format, setFormat] = useState('image/png');
  const [exporting, setExporting] = useState(false);
  const [busySlide, setBusySlide] = useState<number | null>(null);

  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);

  const { rows, warnings, error } = useMemo(() => parseLeaderboardText(rawText), [rawText]);
  const setCopyField = (key: keyof CarouselCopy, value: string) => setCopy((c) => ({ ...c, [key]: value }));

  const downloadSlide = async (i: number) => {
    setBusySlide(i);
    try {
      await exportSlide(SLIDES[i], i, rows, copy, SLIDES.length, format);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Methwyd allforio');
    } finally {
      setBusySlide(null);
    }
  };

  const downloadZip = async () => {
    setExporting(true);
    try {
      await exportZip(SLIDES, rows, copy, format, `cwis-${copy.weekLabel}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Methwyd allforio');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c1322] text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="max-w-[1320px] mx-auto px-6 py-8">
        <header className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-bold tracking-[3px] uppercase text-[#fecf0a]">
              <span className="w-2 h-2 rounded-full bg-[#fecf0a]" /> Carousel Generator
            </div>
            <h1 className="text-[28px] font-extrabold tracking-tight mt-1" style={{ fontFamily: 'Bitter, serif' }}>
              Sgorfwrdd Wythnosol · 10 Uchaf
            </h1>
            <p className="text-[13px] text-white/45 mt-0.5">
              Gludwch sgorau'r wythnos → rhagolwg → allforio sleidiau parod i Instagram.
            </p>
          </div>
          <span className="shrink-0 text-[12px] px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/60">
            Prototeip
          </span>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
          <div className="flex flex-col gap-6">
            <section className="rounded-2xl border border-white/10 bg-[#141d30] p-5">
              <DataInput
                value={rawText}
                onChange={setRawText}
                warnings={warnings}
                error={error}
                rowCount={rows.length}
                onLoadSample={() => setRawText(SAMPLE_CSV)}
              />
            </section>
            <section className="rounded-2xl border border-white/10 bg-[#141d30] p-5">
              <CopyEditor copy={copy} onChange={setCopyField} />
            </section>
          </div>

          <div className="flex flex-col gap-5 min-w-0">
            <section className="rounded-2xl border border-white/10 bg-[#141d30] p-5">
              <ExportBar
                format={format}
                onFormat={setFormat}
                onExportZip={downloadZip}
                exporting={exporting}
                disabled={!!error}
              />
            </section>
            <section className="rounded-2xl border border-white/10 bg-[#0f1626] p-5">
              <div className="flex gap-5 overflow-x-auto pb-4 -mx-1 px-1 snap-x">
                {SLIDES.map((slide, i) => (
                  <div key={slide.id} className="shrink-0 snap-start" style={{ width: 300 }}>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-white/45 mb-2">
                      {i + 1}. {slide.label}
                    </div>
                    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl shadow-black/40">
                      <SlideCanvas slide={slide} index={i} rows={rows} copy={copy} slideCount={SLIDES.length} />
                    </div>
                    <button
                      onClick={() => downloadSlide(i)}
                      disabled={busySlide != null}
                      className="mt-2 w-full text-[12px] font-semibold rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 py-2 transition-colors disabled:opacity-50"
                    >
                      {busySlide === i ? 'Wrthi...' : 'Lawrlwytho'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
