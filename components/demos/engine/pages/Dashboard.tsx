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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">{t('dash.kicker')}</div>
          <h1 className="mt-1 text-[26px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[28px]">{t('dash.title')}</h1>
          <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
            {count(brands.length, 'brand')} · {count(store.templates.length, 'template')} · {count(store.graphics.length, 'graphic')}
          </p>
        </div>
        {brands.length > 0 && <Button className="self-start sm:self-auto" onClick={addBrand}><Plus size={15} /> {t('shell.newBrand')}</Button>}
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
              <Panel key={b.id} className="group relative h-full p-5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-zinc-300 hover:-translate-y-0.5 hover:shadow-md dark:hover:border-zinc-700">
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
                    <span className="grid h-10 w-10 place-items-center rounded-xl text-[15px] font-bold text-white" style={{ background: b.colours[0] || '#7c3aed' }}>
                      {b.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 pr-6">
                      <h2 className="truncate text-[17px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{b.name}</h2>
                      <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{count(tc, 'template')} · {count(g, 'graphic')}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5">
                    {b.colours.slice(0, 5).map((c, i) => (
                      <span key={i} className="h-5 w-5 rounded-full border border-zinc-200 dark:border-zinc-700" style={{ background: c }} />
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-[13px] font-semibold text-zinc-500 transition-colors group-hover:text-violet-700 dark:text-zinc-400 dark:group-hover:text-violet-300">
                    {t('common.open')} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </Panel>
            );
          })}

          <button onClick={addBrand} className="rounded-2xl border border-dashed border-zinc-300 bg-white p-5 text-left transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"><Plus size={18} /></span>
            <h2 className="mt-3 text-[17px] font-bold tracking-tight text-zinc-800 dark:text-zinc-100">{t('shell.newBrand')}</h2>
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{t('dash.newBrandCardBody')}</p>
          </button>
        </div>
      )}
    </div>
  );
}
