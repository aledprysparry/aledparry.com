import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Type, Square, Download, ShieldCheck, Trash2, ChevronUp, ChevronDown, ImagePlus, Pencil } from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { Button, Panel } from '@engine/components/ui';
import { Tabs } from '@engine/components/primitives';
import Stage from '@engine/components/Stage';
import AiPanel from '@engine/components/AiPanel';
import PreExportCheck from '@engine/components/coach/PreExportCheck';
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
  const dims = ratio === 'story' ? { w: 1080, h: 1920 } : ratio === 'landscape' ? { w: 1920, h: 1080 } : ratio === 'square' ? { w: 1080, h: 1080 } : { w: 1080, h: 1350 };

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
    <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Link to={`/brands/${graphic.brandId}`} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"><ArrowLeft size={14} /> {t('editor.backToBrand')}</Link>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <label className="group -mx-1 inline-flex min-w-0 items-center gap-2 rounded-lg px-1 hover:bg-zinc-100 focus-within:bg-zinc-100 dark:hover:bg-zinc-800 dark:focus-within:bg-zinc-800" title={t('editor.renameHint')}>
          <input value={graphic.name} onChange={(e) => store.updateGraphic(graphic.id, { name: e.target.value })} aria-label={t('common.rename')} className="min-w-0 bg-transparent text-[20px] font-bold tracking-tight text-zinc-900 focus:outline-none dark:text-zinc-50 sm:text-[22px]" />
          <Pencil size={15} className="shrink-0 text-zinc-400 transition-colors group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
        </label>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select value={platform} onChange={(e) => store.updateGraphic(graphic.id, { platformPresetId: e.target.value as PlatformId })} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-800 focus:border-violet-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
            {(Object.keys(PLATFORM_PRESETS) as PlatformId[]).map((p) => <option key={p} value={p}>{PLATFORM_PRESETS[p].name}</option>)}
          </select>
          <button onClick={() => setShowSafe((v) => !v)} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] font-semibold ${showSafe ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300' : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}><ShieldCheck size={14} /> {t('editor.safeAreas')}</button>
          <Button onClick={() => setTab('export')}><Download size={15} /> {t('editor.exportImage')}</Button>
        </div>
      </header>

      {/* Design, Animation, Export - one editor across all template kinds. */}
      <div className="mb-6">
        <Tabs value={tab} onChange={setTab} tabs={(['design', 'animation', 'export'] as const).map((tb) => ({ id: tb, label: t(`editor.tab.${tb}` as const) }))} />
      </div>

      {tab === 'animation' && (
        <div className="mx-auto max-w-2xl"><Panel className="p-5 sm:p-6"><h3 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50">{t('editor.anim.title')}</h3><p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">{t('ff.noAnimation')}</p></Panel></div>
      )}

      {tab === 'export' && (
        <div className="mx-auto max-w-2xl"><Panel className="p-5 sm:p-6">
          <h3 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-50">{t('editor.export.stillTitle')}</h3>
          <label className="mb-1 mt-4 block text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('editor.export.format')}</label>
          <div className="inline-flex overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
            {['image/png', 'image/jpeg'].map((m) => <button key={m} onClick={() => setFormat(m)} className={`px-4 py-2 text-[13px] font-semibold ${format === m ? 'bg-violet-600 text-white' : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'}`}>{m === 'image/png' ? 'PNG' : 'JPEG'}</button>)}
          </div>
          <div className="mt-5 border-t border-zinc-200 pt-4 dark:border-zinc-800"><Button onClick={doExport} disabled={exporting}><Download size={15} /> {exporting ? t('editor.exporting') : t('editor.exportImage')}</Button></div>
        </Panel></div>
      )}

      {tab === 'design' && (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* stage */}
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Button variant="subtle" onClick={() => addEl(makeText('New text'))}><Type size={14} /> {t('ff.text')}</Button>
            <Button variant="subtle" onClick={() => addEl(makeShape())}><Square size={14} /> {t('ff.shape')}</Button>
            <label className="cursor-pointer">
              <input type="file" accept="image/*,.woff,.woff2,.ttf,.otf" className="hidden" onChange={(e) => onUploadAsset(e.target.files?.[0])} />
              <span className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"><ImagePlus size={14} /> {t('ff.uploadAsset')}</span>
            </label>
          </div>
          <div className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800/40 sm:p-6">
            <div className="mx-auto w-full" style={{ maxWidth: `min(100%, ${ratio === 'landscape' ? 720 : ratio === 'story' ? 380 : ratio === 'square' ? 460 : 520}px)` }}>
              <Stage elements={elements} width={dims.w} height={dims.h} selectedId={selectedId} onSelect={setSelectedId} onChange={setElements} onCommit={() => commit()} onDropAsset={placeAsset} showSafe={showSafe} safeInsets={safeInsets} />
            </div>
          </div>
          <p className="mt-3 text-center text-[12px] text-zinc-400 dark:text-zinc-500">{t('ff.dragHint')}</p>
        </div>

        {/* assets + inspector */}
        <div className="flex flex-col gap-4">
          <AiPanel
            brand={brand}
            platform={preset.name}
            textElements={textElements}
            onApply={setElementContent}
            onAddText={(t) => addEl(makeText(t))}
            graphic={graphic}
          />
          <PreExportCheck graphic={graphic} brand={brand} platformName={preset.name} />
          <AssetPanel
            assets={assets}
            onPlace={(a) => placeAsset({ assetId: a.id, type: a.type, url: a.url })}
            onSetBg={(a) => setBackgroundImage(a.url)}
            onApplyFont={(a) => selected?.type === 'text' && patchStyle({ fontFamily: fontFamilyFor(a) })}
          />
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-zinc-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
          {!selected ? (
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400">{t('ff.selectPrompt')}</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">{selected.type}</span>
                <div className="flex gap-0.5">
                  <button onClick={() => update(reorder(elements, selected.id, 1))} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100" title={t('ff.bringForward')}><ChevronUp size={16} /></button>
                  <button onClick={() => update(reorder(elements, selected.id, -1))} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100" title={t('ff.sendBack')}><ChevronDown size={16} /></button>
                  <button onClick={del} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40" title={t('common.delete')}><Trash2 size={15} /></button>
                </div>
              </div>

              {selected.type === 'text' && (
                <>
                  <textarea value={selected.content ?? ''} onChange={(e) => patchEl({ content: e.target.value })} className="h-20 w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 focus:border-violet-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                  <Field label={t('ff.font')}>
                    <select value={(sStyle.fontFamily as string) ?? 'Inter'} onChange={(e) => patchStyle({ fontFamily: e.target.value })} className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-[13px] text-zinc-800 focus:border-violet-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100">
                      {fontOptions.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </Field>
                  <Field label={`${t('ff.size')} ${Math.round(((sStyle.fontSize as number) ?? 0.05) * 1000) / 10}`}>
                    <input type="range" min={20} max={160} value={Math.round(((sStyle.fontSize as number) ?? 0.05) * 1000)} onChange={(e) => patchStyle({ fontSize: Number(e.target.value) / 1000 })} className="w-full accent-violet-600" />
                  </Field>
                  <Field label={t('ff.weight')}>
                    <select value={(sStyle.fontWeight as string) ?? '700'} onChange={(e) => patchStyle({ fontWeight: e.target.value })} className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-2 text-[13px] text-zinc-800 focus:border-violet-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100">
                      {['400', '500', '600', '700', '800', '900'].map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </Field>
                  <Field label={t('ff.align')}>
                    <div className="flex gap-1">
                      {(['left', 'center', 'right'] as const).map((a) => (
                        <button key={a} onClick={() => patchStyle({ align: a })} className={`flex-1 rounded-lg border px-2 py-2 text-[12px] capitalize ${(sStyle.align ?? 'left') === a ? 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-500/15 dark:text-violet-300' : 'border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300'}`}>{a}</button>
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
                    <input type="range" min={0} max={20} value={Math.round(((sStyle.radius as number) ?? 0) * 100)} onChange={(e) => patchStyle({ radius: Number(e.target.value) / 100 })} className="w-full accent-violet-600" />
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
                      <button key={f} onClick={() => patchStyle({ fit: f })} className={`flex-1 rounded-lg border px-2 py-2 text-[12px] capitalize ${(sStyle.fit ?? 'contain') === f ? 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-500/15 dark:text-violet-300' : 'border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300'}`}>{f}</button>
                    ))}
                  </div>
                </Field>
              )}

              {brand && brand.colours.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t('ff.brandColours')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {brand.colours.map((c, i) => (
                      <button key={i} onClick={() => patchStyle(selected.type === 'text' ? { color: c } : { fill: c })} className="h-7 w-7 rounded-full border border-zinc-200 dark:border-zinc-600" style={{ background: c }} title={c} />
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
      className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-white hover:border-violet-400 dark:border-zinc-700 dark:bg-zinc-800"
    >
      <img src={a.url} alt={a.name} className="h-full w-full object-contain p-1" draggable={false} />
    </button>
  );

  const Group = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <p className="mb-1.5 text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
      {children}
    </div>
  );

  if (assets.length === 0) {
    return <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-[12px] text-zinc-500 shadow-sm shadow-zinc-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:shadow-none">{t('ff.assetsEmpty')}</div>;
  }

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm shadow-zinc-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
      <p className="text-[12px] font-bold uppercase tracking-wide text-zinc-600 dark:text-zinc-300">{t('ff.assets')} <span className="font-normal text-zinc-400 dark:text-zinc-500">· {t('ff.dragOntoStage')}</span></p>
      {logos.length > 0 && <Group label={t('ff.logos')}><div className="grid grid-cols-4 gap-2">{logos.map((a) => <Thumb key={a.id} a={a} onClick={() => onPlace(a)} />)}</div></Group>}
      {backgrounds.length > 0 && <Group label={t('ff.backgroundsApply')}><div className="grid grid-cols-4 gap-2">{backgrounds.map((a) => <Thumb key={a.id} a={a} onClick={() => onSetBg(a)} />)}</div></Group>}
      {others.length > 0 && <Group label={t('ff.imagesGifs')}><div className="grid grid-cols-4 gap-2">{others.map((a) => <Thumb key={a.id} a={a} onClick={() => onPlace(a)} />)}</div></Group>}
      {fonts.length > 0 && (
        <Group label={t('ff.fontsApply')}>
          <div className="flex flex-wrap gap-1.5">
            {fonts.map((a) => <button key={a.id} onClick={() => onApplyFont(a)} className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[12px] text-zinc-800 hover:border-violet-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100" style={{ fontFamily: `${fontFamilyFor(a)}, sans-serif` }}>{fontFamilyFor(a)}</button>)}
          </div>
        </Group>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

function ColourInput({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value.startsWith('#') ? value : '#ffffff'} onChange={(e) => onChange(e.target.value)} className="h-9 w-11 rounded bg-transparent" />
      <input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-[12px] text-zinc-800 focus:border-violet-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
    </div>
  );
}
