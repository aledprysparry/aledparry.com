import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { useStore } from '@engine/lib/store/StoreProvider';
import { Button, Panel, EmptyState } from '@engine/components/ui';

// Clip-finding now lives inside the brand-scoped pipeline (one coherent
// journey, not a separate tool). This launcher is the global entry point:
// pick a brand → its pipeline. One brand → straight in.
export default function PipelineLauncher() {
  const { t } = useI18n();
  const store = useStore();
  const navigate = useNavigate();
  const brands = store.brands;

  if (brands.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 sm:py-12">
        <EmptyState title={t('dash.emptyTitle')} hint={t('dash.emptyHint')} action={<Link to="/new"><Button><Sparkles size={15} /> {t('shell.newBrand')}</Button></Link>} />
      </div>
    );
  }
  if (brands.length === 1) return <Navigate to={`/brands/${brands[0].id}/pipeline`} replace />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
      <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400"><Sparkles size={13} /> Postio</div>
      <h1 className="mt-1 text-[26px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[28px]">{t('pipe.title')}</h1>
      <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">{t('launch.pickBrand')}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {brands.map((b) => (
          <button key={b.id} onClick={() => navigate(`/brands/${b.id}/pipeline`)} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm shadow-zinc-900/[0.04] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none dark:hover:border-zinc-700">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[16px] font-bold text-white" style={{ background: b.colours[0] || '#7c3aed' }}>{b.name.slice(0, 1).toUpperCase()}</span>
            <span className="truncate text-[14px] font-semibold text-zinc-800 dark:text-zinc-100">{b.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Old brand-scoped /clips route → the brand's pipeline (clip-finding is step 3-4).
export function BrandClipsRedirect() {
  const { brandId = '' } = useParams();
  return <Navigate to={`/brands/${brandId}/pipeline`} replace />;
}
