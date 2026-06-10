import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Type, Square, ImageIcon, Download, ShieldCheck, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { Button } from '@engine/components/ui';
import Stage from '@engine/components/Stage';
import { makeText, makeShape, makeImage, reorder } from '@engine/lib/freeform/elements';
import { exportElements } from '@engine/lib/freeform/renderElements';
import { platformToRatio } from '@engine/lib/templates/registry';
import { PLATFORM_PRESETS } from '@engine/lib/platforms/presets';
import type { GeneratedGraphic, GraphicElement, PlatformId } from '@engine/lib/model/types';

const FONTS = ['Inter', 'Bitter'];

export default function FreeformEditor({ graphic }: { graphic: GeneratedGraphic }) {
  const store = useStore();
  const brand = store.getBrand(graphic.brandId);
  const assets = store.assetsByBrand(graphic.brandId);
  const fontOptions = useMemo(() => Array.from(new Set([...(brand?.fonts ?? []), ...FONTS])), [brand]);

  const [elements, setElements] = useState<GraphicElement[]>(graphic.slides?.[0]?.elements ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [format, setFormat] = useState('image/png');
  const [showSafe, setShowSafe] = useState(false);
  const [exporting, setExporting] = useState(false);

  const platform = (graphic.platformPresetId ?? 'instagram-feed') as PlatformId;
  const preset = PLATFORM_PRESETS[platform];
  const ratio = platformToRatio(platform);
  // CanvasRenderer ratio dims (for stage aspect + font scaling)
  const dims = ratio === 'story' ? { w: 1080, h: 1920 } : ratio === 'landscape' ? { w: 1920, h: 1080 } : { w: 1080, h: 1350 };

  const commit = (els: GraphicElement[] = elements) =>
    store.updateGraphic(graphic.id, { slides: [{ id: graphic.slides?.[0]?.id ?? 'slide_0', order: 0, elements: els }] });

  // persist when selection-affecting structural ops happen (add/delete/reorder handled inline)
  useEffect(() => { setElements(graphic.slides?.[0]?.elements ?? []); /* eslint-disable-next-line */ }, [graphic.id]);

  const selected = elements.find((e) => e.id === selectedId) || null;

  const update = (els: GraphicElement[]) => { setElements(els); commit(els); };
  const addEl = (el: GraphicElement) => { update([...elements, el]); setSelectedId(el.id); };
  const patchStyle = (patch: Record<string, unknown>) =>
    selected && update(elements.map((e) => (e.id === selected.id ? { ...e, style: { ...e.style, ...patch } } : e)));
  const patchEl = (patch: Partial<GraphicElement>) =>
    selected && update(elements.map((e) => (e.id === selected.id ? { ...e, ...patch } : e)));
  const del = () => { if (selected) { update(elements.filter((e) => e.id !== selected.id)); setSelectedId(null); } };

  const safeInsets = {
    top: `${(preset.safeArea.top / preset.height) * 100}%`,
    bottom: `${(preset.safeArea.bottom / preset.height) * 100}%`,
    left: `${(preset.safeArea.left / preset.width) * 100}%`,
    right: `${(preset.safeArea.right / preset.width) * 100}%`,
  };

  const doExport = async () => {
    setExporting(true);
    try { await exportElements(elements, graphic.name, format, ratio); }
    finally { setExporting(false); }
  };

  const sStyle = (selected?.style ?? {}) as Record<string, unknown>;

  return (
    <div className="mx-auto max-w-[1320px] px-8 py-8">
      <Link to={`/brands/${graphic.brandId}`} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-white/45 hover:text-white"><ArrowLeft size={14} /> Back to brand</Link>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <input value={graphic.name} onChange={(e) => store.updateGraphic(graphic.id, { name: e.target.value })} className="bg-transparent text-[22px] font-extrabold tracking-tight focus:outline-none" style={{ fontFamily: 'Bitter, serif' }} />
        <div className="flex items-center gap-3">
          <select value={platform} onChange={(e) => store.updateGraphic(graphic.id, { platformPresetId: e.target.value as PlatformId })} className="rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-[13px] text-white/90 focus:outline-none">
            {(Object.keys(PLATFORM_PRESETS) as PlatformId[]).map((p) => <option key={p} value={p}>{PLATFORM_PRESETS[p].name}</option>)}
          </select>
          <button onClick={() => setShowSafe((v) => !v)} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold ${showSafe ? 'bg-indigo-500/20 text-indigo-200' : 'text-white/50 hover:bg-white/5'}`}><ShieldCheck size={14} /> Safe</button>
          <div className="inline-flex overflow-hidden rounded-lg border border-white/10">
            {['image/png', 'image/jpeg'].map((m) => <button key={m} onClick={() => setFormat(m)} className={`px-3 py-1.5 text-[13px] font-semibold ${format === m ? 'bg-indigo-500 text-white' : 'text-white/60 hover:bg-white/5'}`}>{m === 'image/png' ? 'PNG' : 'JPEG'}</button>)}
          </div>
          <Button onClick={doExport} disabled={exporting}><Download size={15} /> {exporting ? 'Exporting…' : 'Export'}</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* stage */}
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Button variant="subtle" onClick={() => addEl(makeText('New text'))}><Type size={14} /> Text</Button>
            <Button variant="subtle" onClick={() => addEl(makeShape())}><Square size={14} /> Shape</Button>
            <select
              onChange={(e) => {
                const a = assets.find((x) => x.id === e.target.value);
                if (a) addEl(makeImage(a.id, a.url, a.type === 'logo' ? 'logo' : 'image'));
                e.target.value = '';
              }}
              className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-[13px] text-white/90 focus:outline-none"
              defaultValue=""
            >
              <option value="" disabled>+ Image / logo from assets</option>
              {assets.filter((a) => a.url.startsWith('data:image')).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {assets.length === 0 && <span className="self-center text-[12px] text-white/35 inline-flex items-center gap-1"><ImageIcon size={13} /> Upload assets in the brand to place them</span>}
          </div>
          <div className="mx-auto" style={{ maxWidth: ratio === 'landscape' ? 720 : ratio === 'story' ? 380 : 520 }}>
            <Stage elements={elements} width={dims.w} height={dims.h} selectedId={selectedId} onSelect={setSelectedId} onChange={setElements} onCommit={() => commit()} showSafe={showSafe} safeInsets={safeInsets} />
          </div>
          <p className="mt-3 text-center text-[12px] text-white/35">Click to select · drag to move · corner to resize · double-click text to edit</p>
        </div>

        {/* inspector */}
        <div className="rounded-2xl border border-white/10 bg-[#141d30] p-4">
          {!selected ? (
            <p className="text-[13px] text-white/45">Select an element to edit its properties, or add one from the toolbar.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wide text-white/55">{selected.type}</span>
                <div className="flex gap-1">
                  <button onClick={() => update(reorder(elements, selected.id, 1))} className="text-white/40 hover:text-white" title="Bring forward"><ChevronUp size={16} /></button>
                  <button onClick={() => update(reorder(elements, selected.id, -1))} className="text-white/40 hover:text-white" title="Send back"><ChevronDown size={16} /></button>
                  <button onClick={del} className="text-white/40 hover:text-red-300" title="Delete"><Trash2 size={15} /></button>
                </div>
              </div>

              {selected.type === 'text' && (
                <>
                  <textarea value={selected.content ?? ''} onChange={(e) => patchEl({ content: e.target.value })} className="w-full h-20 resize-y rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-[13px] text-white/90 focus:outline-none" />
                  <Field label="Font">
                    <select value={(sStyle.fontFamily as string) ?? 'Inter'} onChange={(e) => patchStyle({ fontFamily: e.target.value })} className="w-full rounded-lg bg-black/30 border border-white/10 px-2 py-1.5 text-[13px] text-white/90 focus:outline-none">
                      {fontOptions.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </Field>
                  <Field label={`Size ${Math.round(((sStyle.fontSize as number) ?? 0.05) * 1000) / 10}`}>
                    <input type="range" min={20} max={160} value={Math.round(((sStyle.fontSize as number) ?? 0.05) * 1000)} onChange={(e) => patchStyle({ fontSize: Number(e.target.value) / 1000 })} className="w-full" />
                  </Field>
                  <Field label="Weight">
                    <select value={(sStyle.fontWeight as string) ?? '700'} onChange={(e) => patchStyle({ fontWeight: e.target.value })} className="w-full rounded-lg bg-black/30 border border-white/10 px-2 py-1.5 text-[13px] text-white/90 focus:outline-none">
                      {['400', '500', '600', '700', '800', '900'].map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </Field>
                  <Field label="Align">
                    <div className="flex gap-1">
                      {(['left', 'center', 'right'] as const).map((a) => (
                        <button key={a} onClick={() => patchStyle({ align: a })} className={`flex-1 rounded-lg border px-2 py-1.5 text-[12px] capitalize ${(sStyle.align ?? 'left') === a ? 'border-indigo-400/70 bg-indigo-500/10 text-white' : 'border-white/10 text-white/60'}`}>{a}</button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Colour"><ColourInput value={(sStyle.color as string) ?? '#ffffff'} onChange={(c) => patchStyle({ color: c })} /></Field>
                </>
              )}

              {selected.type === 'shape' && (
                <>
                  <Field label="Fill"><ColourInput value={(sStyle.fill as string) ?? '#6366f1'} onChange={(c) => patchStyle({ fill: c })} /></Field>
                  <Field label={`Corner ${Math.round(((sStyle.radius as number) ?? 0) * 100)}`}>
                    <input type="range" min={0} max={20} value={Math.round(((sStyle.radius as number) ?? 0) * 100)} onChange={(e) => patchStyle({ radius: Number(e.target.value) / 100 })} className="w-full" />
                  </Field>
                </>
              )}

              {selected.type === 'background' && (
                <Field label="Background"><ColourInput value={(sStyle.fill as string) ?? '#0c1322'} onChange={(c) => patchStyle({ fill: c })} /></Field>
              )}

              {(selected.type === 'image' || selected.type === 'logo') && (
                <Field label="Fit">
                  <div className="flex gap-1">
                    {(['contain', 'cover'] as const).map((f) => (
                      <button key={f} onClick={() => patchStyle({ fit: f })} className={`flex-1 rounded-lg border px-2 py-1.5 text-[12px] capitalize ${(sStyle.fit ?? 'contain') === f ? 'border-indigo-400/70 bg-indigo-500/10 text-white' : 'border-white/10 text-white/60'}`}>{f}</button>
                    ))}
                  </div>
                </Field>
              )}

              {brand && brand.colours.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] uppercase tracking-wide text-white/40">Brand colours</p>
                  <div className="flex flex-wrap gap-1.5">
                    {brand.colours.map((c, i) => (
                      <button key={i} onClick={() => patchStyle(selected.type === 'text' ? { color: c } : { fill: c })} className="h-6 w-6 rounded-full border border-white/15" style={{ background: c }} title={c} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-white/40">{label}</span>
      {children}
    </label>
  );
}

function ColourInput({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value.startsWith('#') ? value : '#ffffff'} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 rounded bg-transparent" />
      <input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded-lg bg-black/30 border border-white/10 px-2 py-1.5 text-[12px] text-white/90 focus:outline-none" />
    </div>
  );
}
