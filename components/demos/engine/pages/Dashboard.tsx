import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '@engine/lib/store/StoreProvider';
import { Button, Panel } from '@engine/components/ui';
import { Plus, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const store = useStore();
  const navigate = useNavigate();
  const { brands } = store;

  const totalGraphics = store.graphics.length;
  const totalTemplates = store.templates.length;

  const addBrand = () => {
    const name = prompt('New brand name');
    if (!name) return;
    navigate(`/brands/${store.createBrand(name).id}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-indigo-300">Dashboard</div>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">Your brands</h1>
          <p className="mt-1 text-[13px] text-white/45">
            {brands.length} brand{brands.length === 1 ? '' : 's'} · {totalTemplates} template{totalTemplates === 1 ? '' : 's'} · {totalGraphics} graphic{totalGraphics === 1 ? '' : 's'}
          </p>
        </div>
        <Button onClick={addBrand}><Plus size={15} /> New brand</Button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {brands.map((b) => {
          const g = store.graphicsByBrand(b.id).length;
          const t = store.templatesByBrand(b.id).length;
          return (
            <Link key={b.id} to={`/brands/${b.id}`} className="group">
              <Panel className="h-full p-5 transition-all duration-200 hover:border-white/25 hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl text-[15px] font-bold" style={{ background: b.colours[0] || '#6366f1' }}>
                    {b.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-serif text-[17px] font-bold" style={{ fontFamily: 'Bitter, serif' }}>{b.name}</h2>
                    <p className="text-[12px] text-white/40">{t} template{t === 1 ? '' : 's'} · {g} graphic{g === 1 ? '' : 's'}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5">
                  {b.colours.slice(0, 5).map((c, i) => (
                    <span key={i} className="h-5 w-5 rounded-full border border-white/10" style={{ background: c }} />
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-1 text-[13px] font-semibold text-white/45 group-hover:text-white transition-colors">
                  Open <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </Panel>
            </Link>
          );
        })}

        <button onClick={addBrand} className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-5 text-left transition-colors hover:border-white/25 hover:bg-white/[0.04]">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-white/50"><Plus size={18} /></span>
          <h2 className="mt-3 font-serif text-[17px] font-bold text-white/80" style={{ fontFamily: 'Bitter, serif' }}>New brand</h2>
          <p className="text-[12px] text-white/40">Add assets, templates and start generating graphics.</p>
        </button>
      </div>
    </div>
  );
}
