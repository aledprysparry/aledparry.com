import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Type, Square, Download, ShieldCheck, Trash2, ChevronUp, ChevronDown, ImagePlus, Pencil } from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { Button, Panel } from '@engine/components/ui';
import Stage from '@engine/components/Stage';
import AiPanel from '@engine/components/AiPanel';
import { makeText, makeShape, makeImage, reorder } from '@engine/lib/freeform/elements';
import { exportElements } from '@engine/lib/freeform/renderElements';
import { registerFontAssets, fontAssetFamilies, fontFamilyFor } from '@engine/lib/freeform/fonts';
import { fileToStoredDataURL } from '@engine/lib/util/imageScale';
import { platformToRatio } from '@engine/lib/templates/registry';
import { PLATFORM_PRESETS } from '@engine/lib/platforms/presets';
import type { AssetType, BrandAsset, GeneratedGraphic, GraphicElement, PlatformId } from '@engine/lib/model/types';

const FONTS = ['Inter', 'Bitter'];

export default function FreeformEditor({ graphic }: { graphic: GeneratedGraphic }) {
  const store = useStore();
  const { t } = useI18n();
  const brand = store.getBrand(graphic.brandId);
  const assets = store.assetsByBrand(graphic.brandId);
  const fontOptions = useMemo(() => Array.from(new Set([...fontAssetFamilies(assets), ...(brand?.fonts ?? []), ...FONTS])), [assets, brand]);

  const [elements, setElements] = useState<GraphicElement[]>(graphic.slides?.[0]?.elements ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [format, setFormat] = useState('image/png');
  const [showSafe, setShowSafe] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Same Design / Animation / Export shell as the other editors (Issue 1).
  const [tab, setTab] = useState<'design' | 'animation' | 'export'>('design');

  const platform = (graphic.platformPresetId ?? 'instagram-feed') as PlatformId;
  const preset = PLATFORM_PRESETS[platform];
  const ratio = platformToRatio(platform);
  // CanvasRenderer ratio dims (for stage aspect + font scaling)
  const dims = ratio === 'story' ? { w: 1080, h: 1920 } : ratio === 'landscape' ? { w: 1920, h: 1080 } : { w: 1080, h: 1350 };

  const commit = (els: GraphicElement[] = elements) =>
    store.updateGraphic(graphic.id, { slides: [{ id: graphic.slides?.[0]?.id ?? 'slide_0', order: 0, elements: els }] });

  // persist when selection-affecting structural ops happen (add/delete/reorder handled inline)
  useEffect(() => { setElements(graphic.slides?.[0]?.elements ?? []); /* eslint-disable-next-line */ }, [graphic.id]);
  // register uploaded brand fonts so text elements can use + export them
  useEffect(() => { registerFontAssets(assets).then(() => setElements((e) => [...e])); /* eslint-disable-next-line */ }, [assets]);

  const selected = elements.find((e) => e.id === selectedId) || null;

  const update = (els: GraphicElement[]) => { setElements(els); commit(els); };
  const addEl = (el: GraphicElement) => { update([...elements, el]); setSelectedId(el.id); };
  const patchStyle = (patch: Record<string, unknown>) =>
    selected && update(elements.map((e) => (e.id === selected.id ? { ...e, style: { ...e.style, ...patch } } : e)));
  const patchEl = (patch: Partial<GraphicElement>) =>
    selected && update(elements.map((e) => (e.id === selected.id ? { ...e, ...patch } : e)));
  const del = () => { if (selected) { update(elements.filter((e) => e.id !== selected.id)); setSelectedId(null); } };

  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

  const setBackgroundImage = (url: string) => {
    const bg = elements.find((e) => e.type === 'background');
    if (bg) update(elements.map((e) => (e.id === bg.id ? { ...e, content: url, style: { ...e.style, fit: 'cover' } } : e)));
    else update([{ id: `el_${Math.random().toString(36).slice(2)}`, type: 'background', position: { x: 0, y: 0 }, size: { width: 1, height: 1 }, content: url, style: { fit: 'cover', fill: '#0c1322' } }, ...elements]);
  };

  const placeAsset = (payload: { assetId: string; type: string; url: string }, x = 0.3, y = 0.3) => {
    if (payload.type === 'background') return setBackgroundImage(payload.url);
    const isLogo = payload.type === 'logo';
    const w = isLogo ? 0.3 : 0.45;
    addEl(makeImage(payload.assetId, payload.url, isLogo ? 'logo' : 'image', { position: { x: clamp01(x - w / 2), y: clamp01(y - w / 2) }, size: { width: w, height: w } }));
  };

  const setElementContent = (id: string, text: string) => update(elements.map((e) => (e.id === id ? { ...e, content: text } : e)));
  const textElements = elements.filter((e) => e.type === 'text').map((e) => ({ id: e.id, content: e.content ?? '' }));

  const onUploadAsset = async (file?: File) => {
    if (!file) return;
    const type: AssetType = file.type === 'image/gif' ? 'gif'
      : file.type.startsWith('image/') ? 'image'
      : (file.type.includes('font') || /\.(woff2?|ttf|otf)$/i.test(file.name)) ? 'font'
      : 'image';
    const url = await fileToStoredDataURL(file, 1200);
    store.addAsset(graphic.brandId, { type, name: file.name, url });
  };

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
      <Link to={`/brands/${graphic.brandId}`} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-white/45 hover:text-white"><ArrowLeft size={14} /> {t('editor.backToBrand')}</Link>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <label className="group inline-flex items-center gap-2 rounded-lg px-1 -mx-1 hover:bg-white/5 focus-within:bg-white/5" title={t('editor.renameHint')}>
          <input value={graphic.name} onChange={(e) => store.updateGraphic(graphic.id, { name: e.target.value })} aria-label={t('common.rename')} className="bg-transparent text-[22px] font-extrabold tracking-tight focus:outline-none" style={{ fontFamily: 'Bitter, serif' }} />
          <Pencil size={15} className="text-white/30 transition-colors group-hover:text-white/60" />
        </label>
        <div className="flex items-center gap-3">
          <select value={platform} onChange={(e) => store.updateGraphic(graphic.id, { platformPresetId: e.target.value as PlatformId })} className="rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-[13px] text-white/90 focus:outline-none">
            {(Object.keys(PLATFORM_PRESETS) as PlatformId[]).map((p) => <option key={p} value={p}>{PLATFORM_PRESETS[p].name}</option>)}
          </select>
          <button onClick={() => setShowSafe((v) => !v)} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold ${showSafe ? 'bg-indigo-500/20 text-indigo-200' : 'text-white/50 hover:bg-white/5'}`}><ShieldCheck size={14} /> {t('editor.safeAreas')}</button>
          <Button onClick={() => setTab('export')}><Download size={15} /> {t('editor.exportImage')}</Button>
        </div>
      </header>

      {/* Design · Animation · Export — one editor across all template kinds. */}
      <div className="mb-6 flex gap-1 border-b border-white/10">
        {(['design', 'animation', 'export'] as const).map((tb) => (
          <button key={tb} onClick={() => setTab(tb)} className={`-mb-px border-b-2 px-3.5 py-2.5 text-[13px] font-semibold transition-colors ${tab === tb ? 'border-indigo-400 text-white' : 'border-transparent text-white/45 hover:text-white/80'}`}>
            {t(`editor.tab.${tb}` as const)}
          </button>
        ))}
      </div>

      {tab === 'animation' && (
        <div className="mx-auto max-w-2xl"><Panel className="p-6"><h3 className="text-[15px] font-bold">{t('editor.anim.title')}</h3><p className="mt-1 text-[13px] text-white/50">{t('ff.noAnimation')}</p></Panel></div>
      )}

      {tab === 'export' && (
        <div className="mx-auto max-w-2xl"><Panel className="p-6">
          <h3 className="text-[15px] font-bold">{t('editor.export.stillTitle')}</h3>
          <label className="mt-4 mb-1 block text-[11px] uppercase tracking-wide text-white/40">{t('editor.export.format')}</label>
          <div className="inline-flex overflow-hidden rounded-lg border border-white/10">
            {['image/png', 'image/jpeg'].map((m) => <button key={m} onClick={() => setFormat(m)} className={`px-4 py-2 text-[13px] font-semibold ${format === m ? 'bg-indigo-500 text-white' : 'text-white/60 hover:bg-white/5'}`}>{m === 'image/png' ? 'PNG' : 'JPEG'}</button>)}
          </div>
          <div className="mt-5 border-t border-white/10 pt-4"><Button onClick={doExport} disabled={exporting}><Download size={15} /> {exporting ? t('editor.exporting') : t('editor.exportImage')}</Button></div>
        </Panel></div>
      )}

      {tab === 'design' && (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* stage */}
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Button variant="subtle" onClick={() => addEl(makeText('New text'))}><Type size={14} /> {t('ff.text')}</Button>
            <Button variant="subtle" onClick={() => addEl(makeShape())}><Square size={14} /> {t('ff.shape')}</Button>
            <label className="cursor-pointer">
              <input type="file" accept="image/*,.woff,.woff2,.ttf,.otf" className="hidden" onChange={(e) => onUploadAsset(e.target.files?.[0])} />
              <span className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3.5 py-2 text-[13px] font-semibold text-white/90 hover:bg-white/10"><ImagePlus size={14} /> {t('ff.uploadAsset')}</span>
            </label>
          </div>
          <div className="mx-auto" style={{ maxWidth: ratio === 'landscape' ? 720 : ratio === 'story' ? 380 : 520 }}>
            <Stage elements={elements} width={dims.w} height={dims.h} selectedId={selectedId} onSelect={setSelectedId} onChange={setElements} onCommit={() => commit()} onDropAsset={placeAsset} showSafe={showSafe} safeInsets={safeInsets} />
          </div>
          <p className="mt-3 text-center text-[12px] text-white/35">{t('ff.dragHint')}</p>
        </div>

        {/* assets + inspector */}
        <div className="flex flex-col gap-4">
          <AiPanel
            brand={brand}
            platform={preset.name}
            textElements={textElements}
            onApply={setElementContent}
            onAddText={(t) => addEl(makeText(t))}
          />
          <AssetPanel
            assets={assets}
            onPlace={(a) => placeAsset({ assetId: a.id, type: a.type, url: a.url })}
            onSetBg={(a) => setBackgroundImage(a.url)}
            onApplyFont={(a) => selected?.type === 'text' && patchStyle({ fontFamily: fontFamilyFor(a) })}
          />
        <div className="rounded-2xl border border-white/10 bg-[#141d30] p-4">
          {!selected ? (
            <p className="text-[13px] text-white/45">{t('ff.selectPrompt')}</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wide text-white/55">{selected.type}</span>
                <div className="flex gap-1">
                  <button onClick={() => update(reorder(elements, selected.id, 1))} className="text-white/40 hover:text-white" title={t('ff.bringForward')}><ChevronUp size={16} /></button>
                  <button onClick={() => update(reorder(elements, selected.id, -1))} className="text-white/40 hover:text-white" title={t('ff.sendBack')}><ChevronDown size={16} /></button>
                  <button onClick={del} className="text-white/40 hover:text-red-300" title={t('common.delete')}><Trash2 size={15} /></button>
                </div>
              </div>

              {selected.type === 'text' && (
                <>
                  <textarea value={selected.content ?? ''} onChange={(e) => patchEl({ content: e.target.value })} className="w-full h-20 resize-y rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-[13px] text-white/90 focus:outline-none" />
                  <Field label={t('ff.font')}>
                    <select value={(sStyle.fontFamily as string) ?? 'Inter'} onChange={(e) => patchStyle({ fontFamily: e.target.value })} className="w-full rounded-lg bg-black/30 border border-white/10 px-2 py-1.5 text-[13px] text-white/90 focus:outline-none">
                      {fontOptions.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </Field>
                  <Field label={`${t('ff.size')} ${Math.round(((sStyle.fontSize as number) ?? 0.05) * 1000) / 10}`}>
                    <input type="range" min={20} max={160} value={Math.round(((sStyle.fontSize as number) ?? 0.05) * 1000)} onChange={(e) => patchStyle({ fontSize: Number(e.target.value) / 1000 })} className="w-full" />
                  </Field>
                  <Field label={t('ff.weight')}>
                    <select value={(sStyle.fontWeight as string) ?? '700'} onChange={(e) => patchStyle({ fontWeight: e.target.value })} className="w-full rounded-lg bg-black/30 border border-white/10 px-2 py-1.5 text-[13px] text-white/90 focus:outline-none">
                      {['400', '500', '600', '700', '800', '900'].map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </Field>
                  <Field label={t('ff.align')}>
                    <div className="flex gap-1">
                      {(['left', 'center', 'right'] as const).map((a) => (
                        <button key={a} onClick={() => patchStyle({ align: a })} className={`flex-1 rounded-lg border px-2 py-1.5 text-[12px] capitalize ${(sStyle.align ?? 'left') === a ? 'border-indigo-400/70 bg-indigo-500/10 text-white' : 'border-white/10 text-white/60'}`}>{a}</button>
                      ))}
                    </div>
                  </Field>
                  <Field label={t('ff.colour')}><ColourInput value={(sStyle.color as string) ?? '#ffffff'} onChange={(c) => patchStyle({ color: c })} /></Field>
                </>
              )}

              {selected.type === 'shape' && (
                <>
                  <Field label={t('ff.fill')}><ColourInput value={(sStyle.fill as string) ?? '#6366f1'} onChange={(c) => patchStyle({ fill: c })} /></Field>
                  <Field label={`${t('ff.corner')} ${Math.round(((sStyle.radius as number) ?? 0) * 100)}`}>
                    <input type="range" min={0} max={20} value={Math.round(((sStyle.radius as number) ?? 0) * 100)} onChange={(e) => patchStyle({ radius: Number(e.target.value) / 100 })} className="w-full" />
                  </Field>
                </>
              )}

              {selected.type === 'background' && (
                <Field label={t('ff.background')}><ColourInput value={(sStyle.fill as string) ?? '#0c1322'} onChange={(c) => patchStyle({ fill: c })} /></Field>
              )}

              {(selected.type === 'image' || selected.type === 'logo') && (
                <Field label={t('ff.fit')}>
                  <div className="flex gap-1">
                    {(['contain', 'cover'] as const).map((f) => (
                      <button key={f} onClick={() => patchStyle({ fit: f })} className={`flex-1 rounded-lg border px-2 py-1.5 text-[12px] capitalize ${(sStyle.fit ?? 'contain') === f ? 'border-indigo-400/70 bg-indigo-500/10 text-white' : 'border-white/10 text-white/60'}`}>{f}</button>
                    ))}
                  </div>
                </Field>
              )}

              {brand && brand.colours.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] uppercase tracking-wide text-white/40">{t('ff.brandColours')}</p>
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
      )}
    </div>
  );
}

// ── Asset panel: grouped, draggable assets you drop onto the stage ──
function AssetPanel({ assets, onPlace, onSetBg, onApplyFont }: {
  assets: BrandAsset[];
  onPlace: (a: BrandAsset) => void;
  onSetBg: (a: BrandAsset) => void;
  onApplyFont: (a: BrandAsset) => void;
}) {
  const { t } = useI18n();
  const imgOf = (types: AssetType[]) => assets.filter((a) => types.includes(a.type) && a.url.startsWith('data:'));
  const logos = imgOf(['logo']);
  const backgrounds = imgOf(['background']);
  const others = imgOf(['image', 'gif', 'icon', 'product', 'reference', 'social-post']);
  const fonts = assets.filter((a) => a.type === 'font');

  const Thumb = ({ a, onClick }: { a: BrandAsset; onClick: () => void }) => (
    <button
      draggable
      onDragStart={(e) => e.dataTransfer.setData('application/x-asset', JSON.stringify({ assetId: a.id, type: a.type, url: a.url }))}
      onClick={onClick}
      title={a.name}
      className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-black/30 hover:border-indigo-400/60"
    >
      <img src={a.url} alt={a.name} className="h-full w-full object-contain p-1" draggable={false} />
    </button>
  );

  const Group = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <p className="mb-1.5 text-[11px] uppercase tracking-wide text-white/40">{label}</p>
      {children}
    </div>
  );

  if (assets.length === 0) {
    return <div className="rounded-2xl border border-white/10 bg-[#141d30] p-4 text-[12px] text-white/45">{t('ff.assetsEmpty')}</div>;
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-[#141d30] p-4">
      <p className="text-[12px] font-bold uppercase tracking-wide text-white/55">{t('ff.assets')} <span className="font-normal text-white/35">· {t('ff.dragOntoStage')}</span></p>
      {logos.length > 0 && <Group label={t('ff.logos')}><div className="grid grid-cols-4 gap-2">{logos.map((a) => <Thumb key={a.id} a={a} onClick={() => onPlace(a)} />)}</div></Group>}
      {backgrounds.length > 0 && <Group label={t('ff.backgroundsApply')}><div className="grid grid-cols-4 gap-2">{backgrounds.map((a) => <Thumb key={a.id} a={a} onClick={() => onSetBg(a)} />)}</div></Group>}
      {others.length > 0 && <Group label={t('ff.imagesGifs')}><div className="grid grid-cols-4 gap-2">{others.map((a) => <Thumb key={a.id} a={a} onClick={() => onPlace(a)} />)}</div></Group>}
      {fonts.length > 0 && (
        <Group label={t('ff.fontsApply')}>
          <div className="flex flex-wrap gap-1.5">
            {fonts.map((a) => <button key={a.id} onClick={() => onApplyFont(a)} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[12px] text-white/80 hover:border-indigo-400/60" style={{ fontFamily: `${fontFamilyFor(a)}, sans-serif` }}>{fontFamilyFor(a)}</button>)}
          </div>
        </Group>
      )}
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
