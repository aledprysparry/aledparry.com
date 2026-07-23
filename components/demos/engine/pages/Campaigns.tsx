import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { Panel } from '@engine/components/ui';
import { campaignsEnabled } from '@engine/lib/campaigns/flags';

// Interactive Campaigns section (flag-gated, spec
// components/demos/engine/POSTIO_CAMPAIGN_MICROSITES.md; tracker #140, #142).
// This is the first UI wiring: a placeholder landing that the builder surfaces
// grow out of. It renders only when the campaigns flag is on; otherwise it
// redirects home, so the shipped app is unchanged while the flag is off.
//
// Copy is kept local (not in the shared typed strings) while this is a
// placeholder. The `cy` lines are machine-draft and MUST have a native Welsh
// review before the flag ships on.
const COPY = {
  en: {
    back: 'Dashboard',
    title: 'Interactive Campaigns',
    lead: 'Turn a social post into a branded, interactive campaign: the post is the doorway, the experience lives here in Postio.',
    body: 'Photo competitions, quizzes, polls and more, with entry, moderation, winner selection and reporting built in.',
    status: 'In development',
  },
  cy: {
    back: 'Dangosfwrdd',
    title: 'Ymgyrchoedd Rhyngweithiol',
    lead: 'Troi post cymdeithasol yn ymgyrch ryngweithiol wedi ei brandio: y post yw’r drws, ac mae’r profiad yn byw yma yn Postio.',
    body: 'Cystadlaethau lluniau, cwisiau, pleidleisiau a mwy, gyda cheisiadau, cymedroli, dewis enillwyr ac adrodd yn rhan ohono.',
    status: 'Yn cael ei ddatblygu',
  },
} as const;

export default function Campaigns() {
  const { lang } = useI18n();

  // Gate co-located with the page so registering the route stays a one-liner.
  if (!campaignsEnabled()) return <Navigate to="/" replace />;

  const c = COPY[lang] ?? COPY.en;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Link
        to="/"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft size={14} /> {c.back}
      </Link>

      <div className="flex items-center gap-2">
        <h1 className="text-[22px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[26px]">
          {c.title}
        </h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
          <Sparkles size={12} /> {c.status}
        </span>
      </div>

      <Panel className="mt-6 p-5">
        <p className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-200">{c.lead}</p>
        <p className="mt-3 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">{c.body}</p>
      </Panel>
    </div>
  );
}
