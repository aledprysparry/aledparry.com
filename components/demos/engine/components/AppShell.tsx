import { useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Search, Plus, Download, HardDrive, Film, ExternalLink,
  Layers, Menu as MenuIcon, Sun, Moon, Monitor, Settings as SettingsIcon,
} from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { useSettings } from '@engine/lib/settings/SettingsProvider';
import { Button } from './ui';
import { Drawer, SegmentedControl } from './primitives';

// The marketing site (front door). App lives at /app/postio; this links back.
const MARKETING_URL = 'https://postio-site.vercel.app';

// Postio wordmark + monogram, matching the marketing site's Logo.
function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm shadow-violet-600/30">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M6 19V6.5A2.5 2.5 0 0 1 8.5 4h4a4.5 4.5 0 0 1 0 9H10" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Postio</span>
    </span>
  );
}

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
    isActive
      ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300'
      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800'
  }`;

export default function AppShell() {
  const { brands } = useStore();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [brandsOpen, setBrandsOpen] = useState(false);

  const filtered = brands.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()));

  const addBrand = () => navigate('/new');

  // Search field, reused in the sidebar and the mobile brand drawer.
  const searchField = (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('shell.searchBrands')}
        className="eng-control w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 text-[12px] text-zinc-900 placeholder:text-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
      />
    </div>
  );

  // Brand list, reused in the sidebar and the mobile brand drawer.
  const brandList = (onNavigate?: () => void) => (
    <>
      {filtered.map((b) => (
        <NavLink
          key={b.id}
          to={`/brands/${b.id}`}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
              isActive
                ? 'bg-violet-50 text-violet-700 font-semibold dark:bg-violet-500/15 dark:text-violet-300'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800'
            }`
          }
        >
          <span className="grid h-6 w-6 place-items-center rounded text-[10px] font-bold text-white" style={{ background: b.colours[0] || '#7c3aed' }}>
            {b.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="truncate">{b.name}</span>
        </NavLink>
      ))}
      {filtered.length === 0 && (
        <p className="px-3 py-2 text-[12px] text-zinc-400 dark:text-zinc-500">{t('shell.noBrands')}</p>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 lg:flex">
      {/* ── Desktop sidebar (lg+) ── */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:flex lg:sticky lg:top-0 lg:h-screen">
        <Link to="/" className="flex h-16 items-center border-b border-zinc-200 px-5 dark:border-zinc-800">
          <Logo />
        </Link>

        <nav className="p-3">
          <NavLink to="/" end className={navItemClass}>
            <LayoutGrid size={16} /> {t('nav.dashboard')}
          </NavLink>
          <NavLink to="/clips" className={navItemClass}>
            <Film size={16} /> {t('pipe.start')}
          </NavLink>
        </nav>

        <div className="px-3">{searchField}</div>

        <div className="mt-3 flex items-center justify-between px-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{t('shell.brands')}</span>
          <button onClick={addBrand} className="grid h-7 w-7 place-items-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100" title={t('shell.newBrand')}>
            <Plus size={15} />
          </button>
        </div>
        <div className="mt-1 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">{brandList()}</div>

        <div className="space-y-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
          <Button variant="subtle" className="w-full" onClick={addBrand}>
            <Plus size={15} /> {t('shell.newBrand')}
          </Button>
          {/* Theme, density, language, backup + about now live on the Settings page. */}
          <NavLink to="/settings" className={navItemClass}>
            <SettingsIcon size={16} /> {t('shell.settings')}
          </NavLink>
        </div>
      </aside>

      {/* ── Content column ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-zinc-200 bg-white/90 px-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90 lg:hidden">
          <Link to="/" aria-label="Postio"><Logo /></Link>
          <button
            onClick={() => setBrandsOpen(true)}
            aria-label={t('shell.searchBrands')}
            className="grid h-10 w-10 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <Search size={18} />
          </button>
        </header>

        <main className="min-w-0 flex-1 pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile bottom nav (<lg) ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 lg:hidden" aria-label={t('shell.menu')}>
        <BottomTab to="/" end icon={<LayoutGrid size={20} />} label={t('nav.dashboard')} />
        <BottomTab to="/clips" icon={<Film size={20} />} label={t('nav.clips')} />
        <BottomButton onClick={() => setBrandsOpen(true)} active={brandsOpen} icon={<Layers size={20} />} label={t('nav.brands')} />
        <BottomButton onClick={addBrand} icon={<Plus size={20} />} label={t('nav.newBrand')} />
        <BottomTab to="/settings" icon={<SettingsIcon size={20} />} label={t('shell.settings')} />
      </nav>

      {/* ── Mobile brand drawer ── */}
      <Drawer open={brandsOpen} onClose={() => setBrandsOpen(false)} side="left" label={t('shell.brands')}>
        <div className="space-y-3 p-3">
          {searchField}
          <Button variant="subtle" className="w-full" onClick={() => { setBrandsOpen(false); addBrand(); }}>
            <Plus size={15} /> {t('shell.newBrand')}
          </Button>
          <div className="space-y-0.5">{brandList(() => setBrandsOpen(false))}</div>
        </div>
      </Drawer>

    </div>
  );
}

// ── Bottom-nav items ──
function BottomTab({ to, end, icon, label }: { to: string; end?: boolean; icon: ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-semibold transition-colors ${
          isActive ? 'text-violet-700 dark:text-violet-300' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
        }`
      }
    >
      {icon}
      <span className="leading-none">{label}</span>
    </NavLink>
  );
}

function BottomButton({ onClick, active, icon, label }: { onClick: () => void; active?: boolean; icon: ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-semibold transition-colors ${
        active ? 'text-violet-700 dark:text-violet-300' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
      }`}
    >
      {icon}
      <span className="leading-none">{label}</span>
    </button>
  );
}
