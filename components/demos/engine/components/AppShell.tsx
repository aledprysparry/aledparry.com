import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutGrid, Search, Plus, Sparkles, Download, HardDrive } from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { Button } from './ui';

export default function AppShell() {
  const { brands, createBrand, exportAll } = useStore();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const filtered = brands.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()));

  const addBrand = () => {
    const name = prompt(t('dash.brandNamePrompt'));
    if (!name) return;
    const b = createBrand(name);
    navigate(`/brands/${b.id}`);
  };

  const backup = () => {
    const blob = new Blob([exportAll()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graphics-engine-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0c1322] text-white flex">
      {/* sidebar */}
      <aside className="w-64 shrink-0 border-r border-white/10 bg-[#0b1120] flex flex-col">
        <Link to="/" className="flex items-center gap-2 px-5 h-16 border-b border-white/10">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-500">
            <Sparkles size={16} />
          </span>
          <span className="font-bold tracking-tight">{t('shell.title')}</span>
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
            <LayoutGrid size={16} /> {t('nav.dashboard')}
          </NavLink>
        </nav>

        <div className="px-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('shell.searchBrands')}
              className="w-full rounded-lg bg-black/30 border border-white/10 focus:border-indigo-400/60 focus:outline-none pl-8 pr-3 py-1.5 text-[12px] text-white/90 placeholder:text-white/25"
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between px-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/35">{t('shell.brands')}</span>
          <button onClick={addBrand} className="text-white/40 hover:text-white" title={t('shell.newBrand')}>
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
            <p className="px-3 py-2 text-[12px] text-white/30">{t('shell.noBrands')}</p>
          )}
        </div>

        <div className="space-y-3 p-3 border-t border-white/10">
          <Button variant="subtle" className="w-full" onClick={addBrand}>
            <Plus size={15} /> {t('shell.newBrand')}
          </Button>

          {/* storage notice + backup */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/55">
              <HardDrive size={12} /> {t('shell.storageTitle')}
            </div>
            <p className="mt-1 text-[11px] leading-snug text-white/35">{t('shell.storageBody')}</p>
            <button onClick={backup} className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-indigo-300 hover:text-indigo-200">
              <Download size={12} /> {t('shell.backup')}
            </button>
          </div>

          {/* language toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/35">{t('shell.language')}</span>
            <div className="inline-flex overflow-hidden rounded-lg border border-white/10" role="group" aria-label={t('shell.language')}>
              {(['en', 'cy'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`px-2.5 py-1 text-[11px] font-bold uppercase ${lang === l ? 'bg-indigo-500 text-white' : 'text-white/50 hover:bg-white/5'}`}
                >
                  {l === 'en' ? 'EN' : 'CY'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* main */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
