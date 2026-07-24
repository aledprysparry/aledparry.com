import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Star } from 'lucide-react';
import { useI18n } from '@engine/lib/i18n/I18nProvider';
import { useStore } from '@engine/lib/store/StoreProvider';
import { Panel, Button, Badge } from '@engine/components/ui';
import { campaignsEnabled } from '@engine/lib/campaigns/flags';
import type { CampaignEntry, EntryStatus } from '@engine/lib/campaigns/types';

// Moderation queue (spec §7, §15 moderator controls). Reviews the entries a
// campaign has collected (synced from Supabase into the Store). Human override
// is always available; approve / reject / feature / archive update the entry
// status and persist like any collection. Flag-gated. cy copy machine-draft.
const COPY = {
  en: {
    back: 'Campaigns', title: 'Entries', none: 'No entries yet.',
    approve: 'Approve', reject: 'Reject', shortlist: 'Shortlist',
    caption: 'Caption', anon: 'Anonymous entry',
  },
  cy: {
    back: 'Ymgyrchoedd', title: 'Ceisiadau', none: 'Dim ceisiadau eto.',
    approve: 'Cymeradwyo', reject: 'Gwrthod', shortlist: 'Rhestr fer',
    caption: 'Capsiwn', anon: 'Cais dienw',
  },
} as const;

function parseEntry(e: CampaignEntry): { caption: string; photo: string | null } {
  try {
    const d = JSON.parse(e.submittedDataEncrypted) as { caption?: string; photo?: string | null };
    return { caption: d.caption ?? '', photo: d.photo ?? null };
  } catch {
    return { caption: '', photo: null };
  }
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export default function CampaignModeration() {
  const { campaignId } = useParams();
  const { lang } = useI18n();
  const store = useStore();

  if (!campaignsEnabled()) return <Navigate to="/" replace />;
  const campaign = campaignId ? store.getCampaign(campaignId) : undefined;
  if (!campaign) return <Navigate to="/campaigns" replace />;

  const c = COPY[lang] ?? COPY.en;
  const entries = [...store.entriesByCampaign(campaign.id)].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const setStatus = (e: CampaignEntry, status: EntryStatus) => store.saveCampaignEntry({ ...e, status });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Link
        to="/campaigns"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <ArrowLeft size={14} /> {c.back}
      </Link>

      <div className="flex items-center gap-2">
        <h1 className="text-[22px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[26px]">
          {campaign.name[lang] || campaign.name.en}
        </h1>
        <Badge tone="muted">{c.title}: {entries.length}</Badge>
      </div>

      {entries.length === 0 ? (
        <p className="mt-6 text-[13px] text-zinc-500 dark:text-zinc-400">{c.none}</p>
      ) : (
        <div className="mt-6 space-y-3">
          {entries.map((e) => {
            const { caption, photo } = parseEntry(e);
            return (
              <Panel key={e.id} className="p-4">
                <div className="flex gap-3">
                  {photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge tone={e.status === 'approved' || e.status === 'shortlisted' ? 'accent' : 'muted'}>{e.status}</Badge>
                      <span className="text-[12px] text-zinc-400">{fmtDate(e.submittedAt)}</span>
                    </div>
                    <p className="mt-1 text-[13px] text-zinc-700 dark:text-zinc-200">
                      {caption || <span className="text-zinc-400">{c.anon}</span>}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="subtle" onClick={() => setStatus(e, 'approved')} disabled={e.status === 'approved'}>
                    <Check size={13} /> {c.approve}
                  </Button>
                  <Button variant="subtle" onClick={() => setStatus(e, 'rejected')} disabled={e.status === 'rejected'}>
                    <X size={13} /> {c.reject}
                  </Button>
                  <Button variant="subtle" onClick={() => setStatus(e, 'shortlisted')} disabled={e.status === 'shortlisted'}>
                    <Star size={13} /> {c.shortlist}
                  </Button>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
