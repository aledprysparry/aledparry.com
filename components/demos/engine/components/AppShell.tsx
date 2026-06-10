import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutGrid, Search, Plus, Sparkles } from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { Button } from './ui';

export default function AppShell() {
  const { brands, createBrand } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const filtered = brands.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()));

  const addBrand = () => {
    const name = prompt('New brand name');
    if (!name) return;
    const b = createBrand(name);
    navigate(`/brands/${b.id}`);
  };

  return (
    <div className="min-h-screen bg-[#0c1322] text-white flex">
      {/* sidebar */}
      <aside className="w-64 shrink-0 border-r border-white/10 bg-[#0b1120] flex flex-col">
        <Link to="/" className="flex items-center gap-2 px-5 h-16 border-b border-white/10">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-500">
            <Sparkles size={16} />
          </span>
          <span className="font-bold tracking-tight">Graphics Engine</span>
        </Link>

        <nav className="p-3">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
                isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <LayoutGrid size={16} /> Dashboard
          </NavLink>
        </nav>

        <div className="px-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search brands"
              className="w-full rounded-lg bg-black/30 border border-white/10 focus:border-indigo-400/60 focus:outline-none pl-8 pr-3 py-1.5 text-[12px] text-white/90 placeholder:text-white/25"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between px-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/35">Brands</span>
          <button onClick={addBrand} className="text-white/40 hover:text-white" title="New brand">
            <Plus size={15} />
          </button>
        </div>
        <div className="mt-1 flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
          {filtered.map((b) => (
            <NavLink
              key={b.id}
              to={`/brands/${b.id}`}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                  isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <span className="grid h-5 w-5 place-items-center rounded text-[10px] font-bold" style={{ background: b.colours[0] || '#6366f1' }}>
                {b.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="truncate">{b.name}</span>
            </NavLink>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-[12px] text-white/30">No brands.</p>
          )}
        </div>

        <div className="p-3 border-t border-white/10">
          <Button variant="subtle" className="w-full" onClick={addBrand}>
            <Plus size={15} /> New brand
          </Button>
        </div>
      </aside>

      {/* main */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
