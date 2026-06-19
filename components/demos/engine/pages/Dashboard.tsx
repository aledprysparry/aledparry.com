import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { Button, Panel, EmptyState } from '@engine/components/ui';
import { Menu, useOverlay } from '@engine/components/primitives';
import { Plus, ArrowRight, Pencil, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const store = useStore();
  const navigate = useNavigate();
  const { t, count } = useI18n();
  const { confirm } = useOverlay();
  const { brands } = store;

  const addBrand = () => navigate('/new');

  const renameBrand = (id: string, current: string) => {
    const name = prompt(t('ov.name'), current);
    if (name && name.trim()) store.updateBrand(id, { name: name.trim() });
  };

  const deleteBrand = async (id: string, name: string) => {
    const tn = store.templatesByBrand(id).length;
    const gn = store.graphicsByBrand(id).length;
    const an = store.assetsByBrand(id).length;
    const ok = await confirm({
      title: t('brand.deleteConfirmTitle'),
      body: t('brand.deleteConfirmBody', { name, t: count(tn, 'template'), g: count(gn, 'graphic'), a: count(an, 'asset') }),
      confirmLabel: t('common.confirmDelete'),
      danger: true,
    });
    if (ok) store.deleteBrand(id);
  };

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-indigo-300">{t('dash.kicker')}</div>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">{t('dash.title')}</h1>
          <p className="mt-1 text-[13px] text-white/45">
            {count(brands.length, 'brand')} · {count(store.templates.length, 'template')} · {count(store.graphics.length, 'graphic')}
          </p>
        </div>
        {brands.length > 0 && <Button onClick={addBrand}><Plus size={15} /> {t('shell.newBrand')}</Button>}
      </header>

      {brands.length === 0 ? (
        <EmptyState
          title={t('dash.emptyTitle')}
          hint={t('dash.emptyHint')}
          action={<Button onClick={addBrand}><Plus size={15} /> {t('shell.newBrand')}</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {brands.map((b) => {
            const g = store.graphicsByBrand(b.id).length;
            const tc = store.templatesByBrand(b.id).length;
            return (
              <Panel key={b.id} className="group relative h-full p-5 transition-all duration-200 hover:border-white/25 hover:-translate-y-0.5">
                <div className="absolute right-3 top-3 z-10 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <Menu
                    label={t('common.actions')}
                    items={[
                      { label: t('common.rename'), icon: <Pencil size={14} />, onClick: () => renameBrand(b.id, b.name) },
                      { label: t('brand.deleteBrand'), icon: <Trash2 size={14} />, danger: true, onClick: () => deleteBrand(b.id, b.name) },
                    ]}
                  />
                </div>
                <Link to={`/brands/${b.id}`} className="block">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl text-[15px] font-bold" style={{ background: b.colours[0] || '#6366f1' }}>
                      {b.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 pr-6">
                      <h2 className="truncate font-serif text-[17px] font-bold" style={{ fontFamily: 'Bitter, serif' }}>{b.name}</h2>
                      <p className="text-[12px] text-white/40">{count(tc, 'template')} · {count(g, 'graphic')}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5">
                    {b.colours.slice(0, 5).map((c, i) => (
                      <span key={i} className="h-5 w-5 rounded-full border border-white/10" style={{ background: c }} />
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[13px] font-semibold text-white/45 group-hover:text-white transition-colors">
                    {t('common.open')} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </Panel>
            );
          })}

          <button onClick={addBrand} className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-5 text-left transition-colors hover:border-white/25 hover:bg-white/[0.04]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-white/50"><Plus size={18} /></span>
            <h2 className="mt-3 font-serif text-[17px] font-bold text-white/80" style={{ fontFamily: 'Bitter, serif' }}>{t('shell.newBrand')}</h2>
            <p className="text-[12px] text-white/40">{t('dash.newBrandCardBody')}</p>
          </button>
        </div>
      )}
    </div>
  );
}
