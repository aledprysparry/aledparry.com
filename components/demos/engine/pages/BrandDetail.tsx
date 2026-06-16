import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Plus, Trash2, ImagePlus, Sparkles, Copy, ExternalLink, ArrowLeft, Wand2,
} from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { Button, Panel, Badge, TextInput, EmptyState } from '@engine/components/ui';
import { TEMPLATE_KIND_LIST, getKind } from '@engine/lib/templates/registry';
import { PLATFORM_PRESETS } from '@engine/lib/platforms/presets';
import { analyseImages, deriveSuggestions } from '@engine/lib/audit/analyseImages';
import { fileToStoredDataURL } from '@engine/lib/util/imageScale';
import { LAYOUTS, type GenStyle } from '@engine/lib/freeform/layouts';
import ElementPreview from '@engine/components/ElementPreview';
import type { AssetType, SocialAccount, GraphicElement } from '@engine/lib/model/types';

type Tab = 'overview' | 'templates' | 'graphics' | 'assets' | 'social';
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'templates', label: 'Templates' },
  { id: 'graphics', label: 'Graphics' },
  { id: 'assets', label: 'Assets' },
  { id: 'social', label: 'Social' },
];

const ASSET_TYPES: AssetType[] = ['logo', 'background', 'font', 'gif', 'image', 'icon', 'product', 'reference', 'social-post'];
const SOCIAL_PLATFORMS: SocialAccount['platform'][] = ['instagram', 'tiktok', 'facebook', 'linkedin', 'x'];

export default function BrandDetail() {
  const { brandId = '' } = useParams();
  const store = useStore();
  const navigate = useNavigate();
  const brand = store.getBrand(brandId);
  const [tab, setTab] = useState<Tab>('overview');

  if (!brand) {
    return (
      <div className="mx-auto max-w-6xl px-8 py-10">
        <EmptyState title="Brand not found" action={<Link to="/"><Button variant="subtle">Back to dashboard</Button></Link>} />
      </div>
    );
  }

  const templates = store.templatesByBrand(brandId);
  const graphics = store.graphicsByBrand(brandId);
  const assets = store.assetsByBrand(brandId);

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <Link to="/" className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-white/45 hover:text-white">
        <ArrowLeft size={14} /> Dashboard
      </Link>

      <header className="mb-6 flex items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl text-[20px] font-bold" style={{ background: brand.colours[0] || '#6366f1' }}>
            {brand.name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <h1 className="font-serif text-[26px] font-extrabold tracking-tight" style={{ fontFamily: 'Bitter, serif' }}>{brand.name}</h1>
            <p className="text-[12px] text-white/40">{templates.length} templates · {graphics.length} graphics · {assets.length} assets</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/brands/${brandId}/create`)}><Sparkles size={15} /> Create graphic</Button>
      </header>

      {/* tabs */}
      <div className="mb-6 flex gap-1 border-b border-white/10">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3.5 py-2.5 text-[13px] font-semibold transition-colors ${
              tab === t.id ? 'border-indigo-400 text-white' : 'border-transparent text-white/45 hover:text-white/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab brandId={brandId} />}
      {tab === 'templates' && <TemplatesTab brandId={brandId} />}
      {tab === 'graphics' && <GraphicsTab brandId={brandId} />}
      {tab === 'assets' && <AssetsTab brandId={brandId} />}
      {tab === 'social' && <SocialTab brandId={brandId} />}

      <div className="mt-10 flex justify-center border-t border-white/10 pt-8">
        <Button onClick={() => navigate(`/brands/${brandId}/create`)}><Sparkles size={15} /> Create graphic</Button>
      </div>
    </div>
  );
}

// ── Overview ──
function OverviewTab({ brandId }: { brandId: string }) {
  const store = useStore();
  const navigate = useNavigate();
  const brand = store.getBrand(brandId)!;
  const [newColour, setNewColour] = useState('#6366f1');

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Panel className="p-5">
        <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-white/55">Identity</h3>
        <label className="mb-1 block text-[11px] uppercase tracking-wide text-white/40">Name</label>
        <TextInput value={brand.name} onChange={(e) => store.updateBrand(brandId, { name: e.target.value })} />
        <label className="mb-1 mt-4 block text-[11px] uppercase tracking-wide text-white/40">Fonts (comma separated)</label>
        <TextInput value={brand.fonts.join(', ')} onChange={(e) => store.updateBrand(brandId, { fonts: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
        <label className="mb-1 mt-4 block text-[11px] uppercase tracking-wide text-white/40">Tone notes</label>
        <textarea
          value={brand.toneNotes ?? ''}
          onChange={(e) => store.updateBrand(brandId, { toneNotes: e.target.value })}
          className="w-full h-24 resize-y rounded-lg bg-black/30 border border-white/10 focus:border-indigo-400/60 focus:outline-none px-3 py-2 text-[13px] text-white/90"
        />
      </Panel>

      <Panel className="p-5">
        <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-white/55">Colours</h3>
        <div className="flex flex-wrap gap-2">
          {brand.colours.map((c, i) => (
            <div key={i} className="group relative">
              <span className="block h-12 w-12 rounded-xl border border-white/10" style={{ background: c }} />
              <button
                onClick={() => store.updateBrand(brandId, { colours: brand.colours.filter((_, j) => j !== i) })}
                className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 place-items-center rounded-full bg-black text-white/70 group-hover:grid"
                title="Remove"
              >
                <Trash2 size={11} />
              </button>
              <span className="mt-1 block text-center text-[9px] text-white/35">{c}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <input type="color" value={newColour} onChange={(e) => setNewColour(e.target.value)} className="h-9 w-12 rounded bg-transparent" />
          <Button variant="subtle" onClick={() => store.updateBrand(brandId, { colours: [...brand.colours, newColour] })}>
            <Plus size={14} /> Add colour
          </Button>
        </div>
        <p className="mt-5 text-[12px] text-white/40">Brand colours feed template styles and the canvas palette.</p>
        <Button className="mt-3" onClick={() => navigate(`/brands/${brandId}/create`)}><Sparkles size={15} /> Create a graphic</Button>
      </Panel>
    </div>
  );
}

// ── Template Style Generator ──
function StyleGenerator({ brandId }: { brandId: string }) {
  const store = useStore();
  const brand = store.getBrand(brandId)!;
  const refImages = store
    .assetsByBrand(brandId)
    .filter((a) => ['reference', 'social-post', 'product'].includes(a.type) && a.url.startsWith('data:image'))
    .map((a) => a.url);
  const fonts = Array.from(new Set([...(brand.fonts ?? []), 'Inter', 'Bitter']));

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [style, setStyle] = useState<GenStyle | null>(null);
  const [layoutId, setLayoutId] = useState('cover');
  const [name, setName] = useState('Generated style');

  const onRefs = async (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) {
      const url = await fileToStoredDataURL(f, 1200);
      store.addAsset(brandId, { type: 'reference', name: f.name, url });
    }
  };

  const generate = async () => {
    setBusy(true);
    try {
      const r = await analyseImages(refImages);
      setStyle({
        palette: r.palette.length ? r.palette : brand.colours,
        theme: r.theme,
        heading: brand.fonts[0] || 'Bitter',
        body: brand.fonts[1] || 'Inter',
      });
    } finally {
      setBusy(false);
    }
  };

  const elementsFor = (s: GenStyle, id: string) => (LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0]).build(s);

  const save = (applyToBrand: boolean) => {
    if (!style) return;
    store.addTemplateStyle(brandId, {
      name,
      colours: style.palette,
      typography: { heading: style.heading, body: style.body },
      spacing: {},
      logoRules: {},
      layoutPatterns: { layout: layoutId },
      visualTone: style.theme,
    });
    store.createTemplate(brandId, 'freeform-post', name, { seedElements: elementsFor(style, layoutId) });
    if (applyToBrand) store.updateBrand(brandId, { colours: style.palette });
    setStyle(null);
    setOpen(false);
  };

  return (
    <Panel className="mb-4 p-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
        <span className="inline-flex items-center gap-2 text-[14px] font-bold"><Wand2 size={15} className="text-indigo-300" /> Generate a template from your posts</span>
        <span className="text-[12px] text-white/40">{open ? 'Hide' : 'Open'}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
            <p className="text-[12px] text-white/45">{refImages.length} reference post{refImages.length === 1 ? '' : 's'} ready. We extract the palette + theme from these.</p>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onRefs(e.target.files)} />
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/85 hover:bg-white/10"><ImagePlus size={14} /> Add posts</span>
              </label>
              <Button onClick={generate} disabled={busy || refImages.length === 0}><Wand2 size={14} /> {busy ? 'Analysing…' : 'Analyse & generate'}</Button>
            </div>
          </div>

          {style && (
            <div className="grid gap-5 md:grid-cols-[260px_1fr]">
              {/* controls */}
              <div className="space-y-4">
                <div>
                  <p className="mb-1.5 text-[11px] uppercase tracking-wide text-white/40">Palette</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {style.palette.map((c, i) => (
                      <span key={i} className="group relative">
                        <input type="color" value={c.startsWith('#') ? c : '#888888'} onChange={(e) => setStyle({ ...style, palette: style.palette.map((x, j) => (j === i ? e.target.value : x)) })} className="h-7 w-7 rounded bg-transparent" />
                      </span>
                    ))}
                    <button onClick={() => setStyle({ ...style, palette: [...style.palette, '#6366f1'] })} className="grid h-7 w-7 place-items-center rounded border border-white/15 text-white/50"><Plus size={13} /></button>
                  </div>
                </div>
                <label className="block"><span className="mb-1 block text-[11px] uppercase tracking-wide text-white/40">Theme</span>
                  <div className="flex gap-1">
                    {(['dark', 'light'] as const).map((t) => (
                      <button key={t} onClick={() => setStyle({ ...style, theme: t })} className={`flex-1 rounded-lg border px-2 py-1.5 text-[12px] capitalize ${style.theme === t ? 'border-indigo-400/70 bg-indigo-500/10 text-white' : 'border-white/10 text-white/60'}`}>{t}</button>
                    ))}
                  </div>
                </label>
                <label className="block"><span className="mb-1 block text-[11px] uppercase tracking-wide text-white/40">Heading font</span>
                  <select value={style.heading} onChange={(e) => setStyle({ ...style, heading: e.target.value })} className="w-full rounded-lg bg-black/30 border border-white/10 px-2 py-1.5 text-[13px] text-white/90 focus:outline-none">{fonts.map((f) => <option key={f} value={f}>{f}</option>)}</select>
                </label>
                <label className="block"><span className="mb-1 block text-[11px] uppercase tracking-wide text-white/40">Body font</span>
                  <select value={style.body} onChange={(e) => setStyle({ ...style, body: e.target.value })} className="w-full rounded-lg bg-black/30 border border-white/10 px-2 py-1.5 text-[13px] text-white/90 focus:outline-none">{fonts.map((f) => <option key={f} value={f}>{f}</option>)}</select>
                </label>
                <label className="block"><span className="mb-1 block text-[11px] uppercase tracking-wide text-white/40">Template name</span>
                  <TextInput value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <div className="flex flex-col gap-2 pt-1">
                  <Button onClick={() => save(false)}><Sparkles size={14} /> Save as template</Button>
                  <Button variant="subtle" onClick={() => save(true)}>Save + apply palette to brand</Button>
                </div>
              </div>

              {/* layout variant previews */}
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-wide text-white/40">Layout (pick one)</p>
                <div className="grid grid-cols-3 gap-3">
                  {LAYOUTS.map((l) => (
                    <button key={l.id} onClick={() => setLayoutId(l.id)} className={`overflow-hidden rounded-xl border text-left transition-colors ${layoutId === l.id ? 'border-indigo-400/70 ring-1 ring-indigo-400/40' : 'border-white/10 hover:border-white/25'}`}>
                      <ElementPreview elements={elementsFor(style, l.id)} />
                      <div className="px-2 py-1.5 text-[12px] font-semibold text-white/80">{l.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

// ── Templates ──
function TemplatesTab({ brandId }: { brandId: string }) {
  const store = useStore();
  const navigate = useNavigate();
  const templates = store.templatesByBrand(brandId);

  return (
    <div>
      <StyleGenerator brandId={brandId} />
      <div className="mb-4 flex flex-wrap gap-2">
        {TEMPLATE_KIND_LIST.map((k) => (
          <Button key={k.id} variant="subtle" onClick={() => store.createTemplate(brandId, k.id)}>
            <Plus size={14} /> {k.name}
          </Button>
        ))}
      </div>
      {templates.length === 0 ? (
        <EmptyState title="No templates yet" hint="Add a template kind above to start generating graphics." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Panel key={t.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between">
                <Badge tone="accent">{t.type}</Badge>
                <button onClick={() => store.deleteTemplate(t.id)} className="text-white/30 hover:text-red-300"><Trash2 size={14} /></button>
              </div>
              <h3 className="mt-3 font-serif text-[16px] font-bold" style={{ fontFamily: 'Bitter, serif' }}>{t.name}</h3>
              <p className="mt-1 text-[12px] text-white/45">{getKind(t.kind)?.description ?? t.kind}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {t.supportedPlatforms.slice(0, 4).map((p) => (
                  <span key={p} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40">{PLATFORM_PRESETS[p].name}</span>
                ))}
              </div>
              <Button className="mt-4" onClick={() => navigate(`/brands/${brandId}/create?template=${t.id}`)}>
                <Sparkles size={14} /> Use template
              </Button>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Graphics ──
function GraphicsTab({ brandId }: { brandId: string }) {
  const store = useStore();
  const navigate = useNavigate();
  const graphics = store.graphicsByBrand(brandId);

  if (graphics.length === 0)
    return <EmptyState title="No saved graphics" hint="Create one from a template." action={<Button onClick={() => navigate(`/brands/${brandId}/create`)}><Sparkles size={15} /> Create graphic</Button>} />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {graphics.map((g) => {
        const platform = g.platformPresetId ? PLATFORM_PRESETS[g.platformPresetId] : undefined;
        return (
          <Panel key={g.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between">
              <Badge>{platform?.name ?? 'Graphic'}</Badge>
              <div className="flex gap-1">
                <button onClick={() => store.duplicateGraphic(g.id)} className="text-white/30 hover:text-white" title="Duplicate"><Copy size={14} /></button>
                <button onClick={() => store.deleteGraphic(g.id)} className="text-white/30 hover:text-red-300" title="Delete"><Trash2 size={14} /></button>
              </div>
            </div>
            <h3 className="mt-3 truncate font-semibold">{g.name}</h3>
            <p className="text-[12px] text-white/40">Updated {new Date(g.updatedAt).toLocaleDateString('en-GB')}</p>
            <Button className="mt-4" variant="subtle" onClick={() => navigate(`/graphics/${g.id}`)}>Open editor</Button>
          </Panel>
        );
      })}
    </div>
  );
}

// ── Assets ──
function AssetsTab({ brandId }: { brandId: string }) {
  const store = useStore();
  const assets = store.assetsByBrand(brandId);
  const [type, setType] = useState<AssetType>('logo');

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const url = await fileToStoredDataURL(file, type === 'logo' ? 512 : 1400);
    store.addAsset(brandId, { type, name: file.name, url });
  };

  return (
    <div>
      <Panel className="mb-5 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={type} onChange={(e) => setType(e.target.value as AssetType)} className="rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-[13px] text-white/90 focus:outline-none">
            {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <label className="cursor-pointer">
            <input type="file" accept="image/*,.woff,.woff2,.ttf,.otf" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <span className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3.5 py-2 text-[13px] font-semibold text-white/90 hover:bg-white/10"><ImagePlus size={15} /> Upload {type}</span>
          </label>
          <span className="text-[12px] text-white/35">Stored locally for the POC.</span>
        </div>
      </Panel>

      {assets.length === 0 ? (
        <EmptyState title="No assets yet" hint="Upload logos, backgrounds, icons or reference posts." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map((a) => (
            <Panel key={a.id} className="group overflow-hidden">
              <div className="relative grid h-28 place-items-center bg-black/30">
                {/image|logo|background|icon|product|reference|social-post/.test(a.type) && a.url.startsWith('data:image') ? (
                  <img src={a.url} alt={a.name} className="max-h-full max-w-full object-contain p-2" />
                ) : (
                  <span className="text-[11px] text-white/40">{a.type}</span>
                )}
                <button onClick={() => store.removeAsset(a.id)} className="absolute right-2 top-2 hidden rounded-md bg-black/70 p-1 text-white/70 group-hover:block hover:text-red-300"><Trash2 size={13} /></button>
              </div>
              <div className="p-2.5">
                <p className="truncate text-[12px] text-white/80">{a.name}</p>
                <Badge tone="muted">{a.type}</Badge>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Social ──
// ── Live Instagram (beta) ── pulls real posts ranked by engagement via
// the Meta Graph API. Dormant until a Meta app is configured (env vars +
// META_SETUP.md); degrades to a clear "needs setup" state otherwise.
interface LivePost { id: string; caption: string; mediaUrl: string; permalink: string; likes: number; comments: number; engagement: number }

function LiveInstagram() {
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'notconf' | 'notconn' | 'err'>('idle');
  const [posts, setPosts] = useState<LivePost[]>([]);
  const [igStatus, setIgStatus] = useState<string | null>(null);

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('ig');
    if (s) setIgStatus(s);
  }, []);

  const pull = async () => {
    setState('loading');
    try {
      const res = await fetch('/api/social/instagram/insights');
      if (res.status === 503) return setState('notconf');
      if (res.status === 401) return setState('notconn');
      if (!res.ok) return setState('err');
      const data = await res.json();
      setPosts(data.posts || []);
      setState('ok');
    } catch {
      setState('err');
    }
  };

  const connectHref = `/api/social/instagram/connect?return=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/app/carousel')}`;

  return (
    <Panel className="mb-5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-[14px] font-bold"><Wand2 size={15} className="text-indigo-300" /> Live Instagram <Badge tone="accent">beta</Badge></p>
          <p className="mt-0.5 text-[12px] text-white/45">Connect a business account to pull recent posts ranked by engagement - "what performed well".</p>
        </div>
        <div className="flex items-center gap-2">
          <a href={connectHref} className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3.5 py-2 text-[13px] font-semibold text-white/90 hover:bg-white/10">Connect Instagram</a>
          <Button variant="subtle" onClick={pull} disabled={state === 'loading'}>{state === 'loading' ? 'Pulling…' : 'Pull recent posts'}</Button>
        </div>
      </div>

      {igStatus === 'connected' && <p className="mt-3 text-[12px] text-[#4ade80]">✓ Account connected. Pull your recent posts.</p>}
      {igStatus && igStatus !== 'connected' && <p className="mt-3 text-[12px] text-[#f87171]">Connect failed ({igStatus}).</p>}
      {state === 'notconf' && <p className="mt-3 text-[12px] text-white/55">Not configured yet - this needs a Meta app (see <span className="text-white/80">META_SETUP.md</span>). The upload-based audit + style generator above work without it.</p>}
      {state === 'notconn' && <p className="mt-3 text-[12px] text-white/55">Not connected - hit "Connect Instagram" first.</p>}
      {state === 'err' && <p className="mt-3 text-[12px] text-[#f87171]">Could not pull posts - try again.</p>}

      {state === 'ok' && (
        posts.length === 0 ? (
          <p className="mt-3 text-[12px] text-white/45">No posts returned for this account.</p>
        ) : (
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">Top performers</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {posts.slice(0, 8).map((p, i) => (
                <a key={p.id} href={p.permalink} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-white/10 bg-black/30">
                  <div className="relative aspect-square">
                    {p.mediaUrl && <img src={p.mediaUrl} alt="" className="h-full w-full object-cover" />}
                    {i < 3 && <span className="absolute left-2 top-2 rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-bold">#{i + 1}</span>}
                  </div>
                  <div className="px-2 py-1.5 text-[11px] text-white/60">♥ {p.likes.toLocaleString()} · 💬 {p.comments.toLocaleString()}</div>
                </a>
              ))}
            </div>
          </div>
        )
      )}
    </Panel>
  );
}

function SocialTab({ brandId }: { brandId: string }) {
  const store = useStore();
  const socials = store.socialByBrand(brandId);
  const [platform, setPlatform] = useState<SocialAccount['platform']>('instagram');
  const [url, setUrl] = useState('');
  const [auditing, setAuditing] = useState<string | null>(null);

  // The realistic "real audit": analyse the reference posts uploaded for
  // this brand (live-account fetching isn't possible - login walls/ToS).
  const refImages = store
    .assetsByBrand(brandId)
    .filter((a) => ['reference', 'social-post', 'product'].includes(a.type) && a.url.startsWith('data:image'))
    .map((a) => a.url);

  const add = () => {
    if (!url.trim()) return;
    store.addSocialAccount(brandId, { platform, url: url.trim() });
    setUrl('');
  };

  const onPosts = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const url = await fileToStoredDataURL(file, 1200);
      store.addAsset(brandId, { type: 'social-post', name: file.name, url });
    }
  };

  const runAudit = async (id: string) => {
    setAuditing(id);
    store.updateSocialAudit(id, { auditStatus: 'pending' });
    try {
      const result = await analyseImages(refImages);
      store.updateSocialAudit(id, { auditStatus: 'complete', auditResult: result, auditSuggestions: deriveSuggestions(result) });
    } catch {
      store.updateSocialAudit(id, { auditStatus: 'failed' });
    } finally {
      setAuditing(null);
    }
  };

  return (
    <div>
      <LiveInstagram />
      <Panel className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={platform} onChange={(e) => setPlatform(e.target.value as SocialAccount['platform'])} className="rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-[13px] text-white/90 focus:outline-none">
            {SOCIAL_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="flex-1 min-w-[220px]"><TextInput placeholder="https://instagram.com/yourbrand" value={url} onChange={(e) => setUrl(e.target.value)} /></div>
          <Button onClick={add}><Plus size={14} /> Add account</Button>
        </div>
      </Panel>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <p className="text-[12px] text-white/45">
          Audits analyse the <span className="text-white/70">reference posts you upload</span> for this brand ({refImages.length} ready) - live-account scraping isn&apos;t available.
        </p>
        <label className="cursor-pointer">
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onPosts(e.target.files)} />
          <span className="inline-flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/85 hover:bg-white/10"><ImagePlus size={14} /> Add post images</span>
        </label>
      </div>

      {socials.length === 0 ? (
        <EmptyState title="No social accounts" hint="Add an account, upload a few of its posts, then audit to extract the real palette + formats." />
      ) : (
        <div className="space-y-3">
          {socials.map((s) => {
            const busy = auditing === s.id || s.auditStatus === 'pending';
            const r = s.auditResult;
            return (
              <Panel key={s.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge tone="accent">{s.platform}</Badge>
                    <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 truncate text-[13px] text-white/70 hover:text-white">
                      {s.url} <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="subtle" disabled={busy} onClick={() => runAudit(s.id)}>
                      <Wand2 size={14} /> {busy ? 'Analysing…' : s.auditStatus === 'complete' ? 'Re-audit' : 'Audit posts'}
                    </Button>
                    <button onClick={() => store.removeSocialAccount(s.id)} className="text-white/30 hover:text-red-300"><Trash2 size={14} /></button>
                  </div>
                </div>

                {s.auditStatus === 'complete' && r && (
                  <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
                    {r.count === 0 ? (
                      <p className="text-[12px] text-white/45">No reference posts to analyse yet - add some post images above, then re-audit.</p>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-4">
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-white/40">Palette ({r.count} post{r.count === 1 ? '' : 's'})</p>
                            <div className="mt-1 flex gap-1.5">
                              {r.palette.map((c, i) => <span key={i} className="h-6 w-6 rounded-md border border-white/15" style={{ background: c }} title={c} />)}
                            </div>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-white/40">Theme</p>
                            <p className="mt-1 text-[13px] capitalize text-white/80">{r.theme}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-white/40">Format mix</p>
                            <p className="mt-1 text-[13px] text-white/80">{r.aspects.portrait}P · {r.aspects.square}Sq · {r.aspects.landscape}L</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Suggestions</p>
                          {s.auditSuggestions?.map((sug, i) => (
                            <div key={i} className="rounded-lg bg-white/[0.03] px-3 py-2">
                              <p className="text-[13px] font-semibold text-white/85">{sug.title}</p>
                              <p className="text-[12px] text-white/45">{sug.rationale}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 border-t border-white/10 pt-3">
                          <Button onClick={() => store.updateBrand(brandId, { colours: r.palette })}><Sparkles size={14} /> Update brand to match this account</Button>
                          <span className="text-[12px] text-white/40">Applies the extracted palette to the brand identity.</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {s.auditStatus === 'failed' && <p className="mt-3 border-t border-white/10 pt-3 text-[12px] text-red-300">Audit failed - try again.</p>}
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
