import { Link } from 'react-router-dom';
import { Sun, Moon, Monitor, HardDrive, Download, ExternalLink, ArrowLeft } from 'lucide-react';
import { useStore } from '@engine/lib/store/StoreProvider';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { useSettings } from '@engine/lib/settings/SettingsProvider';
import { Button, Panel } from '@engine/components/ui';
import { SegmentedControl } from '@engine/components/primitives';

// The marketing site (front door). App lives at /app/postio; this links back.
const MARKETING_URL = 'https://postio-site.vercel.app';

// Dedicated settings page: appearance (theme + density), language, local
// storage / backup and the link back to the marketing site. These used to live
// crammed into the sidebar footer + a mobile sheet; they now have their own
// page, reachable from the Settings nav item.
export default function Settings() {
  const { t, lang, setLang } = useI18n();
  const { density, setDensity, theme, setTheme } = useSettings();
  const { exportAll } = useStore();

  const backup = () => {
    const blob = new Blob([exportAll()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `postio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-200">{label}</span>
      {children}
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Link to="/" className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
        <ArrowLeft size={14} /> {t('nav.dashboard')}
      </Link>
      <h1 className="text-[22px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[26px]">{t('shell.settings')}</h1>

      <div className="mt-6 space-y-4">
        {/* Appearance */}
        <Panel className="p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{t('shell.appearance')}</h2>
          <div className="mt-4 space-y-4">
            <Row label={t('shell.theme')}>
              <SegmentedControl
                label={t('shell.theme')}
                value={theme}
                onChange={setTheme}
                options={[
                  { value: 'light', label: <Sun size={15} />, title: t('shell.themeLight') },
                  { value: 'dark', label: <Moon size={15} />, title: t('shell.themeDark') },
                  { value: 'system', label: <Monitor size={15} />, title: t('shell.themeSystem') },
                ]}
              />
            </Row>
            <Row label={t('shell.density')}>
              <SegmentedControl
                label={t('shell.density')}
                value={density}
                onChange={setDensity}
                options={[
                  { value: 'compact', label: t('shell.densityCompact') },
                  { value: 'comfortable', label: t('shell.densityComfortable') },
                  { value: 'touch', label: t('shell.densityTouch') },
                ]}
              />
            </Row>
          </div>
        </Panel>

        {/* Language */}
        <Panel className="p-5">
          <Row label={t('shell.language')}>
            <SegmentedControl
              label={t('shell.language')}
              value={lang}
              onChange={setLang}
              options={[
                // Native language name carries its own lang so screen readers
                // pronounce it correctly (WCAG 3.1.2). No EN/CY abbreviations.
                { value: 'en', label: <span lang="en">English</span> },
                { value: 'cy', label: <span lang="cy">Cymraeg</span> },
              ]}
            />
          </Row>
        </Panel>

        {/* Storage + backup */}
        <Panel className="p-5">
          <div className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-700 dark:text-zinc-200">
            <HardDrive size={14} /> {t('shell.storageTitle')}
          </div>
          <p className="mt-1.5 text-[12px] leading-snug text-zinc-500 dark:text-zinc-400">{t('shell.storageBody')}</p>
          <Button variant="subtle" className="mt-3" onClick={backup}>
            <Download size={14} /> {t('shell.backup')}
          </Button>
        </Panel>

        <a
          href={MARKETING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-[12px] font-medium text-zinc-400 transition-colors hover:text-violet-700 dark:text-zinc-500 dark:hover:text-violet-300"
        >
          {t('shell.aboutPostio')} <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
