import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Star, Trophy } from 'lucide-react';
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
    winnerSection: 'Winner selection', drawBtn: 'Random draw', winnerLabel: 'Winner',
    drawLog: 'Draw log', noEligible: 'No approved entries to draw from.', poolOf: 'pool of {n}',
  },
  cy: {
    back: 'Ymgyrchoedd', title: 'Ceisiadau', none: 'Dim ceisiadau eto.',
    approve: 'Cymeradwyo', reject: 'Gwrthod', shortlist: 'Rhestr fer',
    caption: 'Capsiwn', anon: 'Cais dienw',
    winnerSection: 'Dewis enillydd', drawBtn: 'Tynnu ar hap', winnerLabel: 'Enillydd',
    drawLog: 'Cofnod tynnu', noEligible: 'Dim ceisiadau wedi eu cymeradwyo i dynnu ohonynt.', poolOf: 'cronfa o {n}',
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

// An immutable random-draw record (spec §16.2), stored append-only on the
// campaign's winnerConfig.draws.
interface DrawRecord {
  id: string;
  at: string;
  algorithmVersion: string;
  candidateIds: string[];
  winnerId: string;
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

  const eligible = entries.filter((e) => e.status === 'approved' || e.status === 'shortlisted');
  const winners = entries.filter((e) => e.status === 'winner');
  const draws = (campaign.winnerConfig?.draws as DrawRecord[] | undefined) ?? [];

  // Cryptographically secure random draw over eligible entries only, recorded
  // in an immutable, append-only draw log (spec §16.2).
  const draw = () => {
    if (eligible.length === 0) return;
    const idx = crypto.getRandomValues(new Uint32Array(1))[0] % eligible.length;
    const winner = eligible[idx];
    store.saveCampaignEntry({ ...winner, status: 'winner' });
    const rec: DrawRecord = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      algorithmVersion: 'csprng-v1',
      candidateIds: eligible.map((e) => e.id),
      winnerId: winner.id,
    };
    store.saveCampaign({
      ...campaign,
      winnerConfig: { ...(campaign.winnerConfig ?? {}), draws: [rec, ...draws] },
      updatedAt: new Date().toISOString(),
    });
  };

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

      <Panel className="mt-6 p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{c.winnerSection}</h2>
        {winners.length > 0 && (
          <ul className="mt-3 space-y-1">
            {winners.map((w) => (
              <li key={w.id} className="flex items-center gap-2 text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">
                <Trophy size={14} className="text-amber-500" /> {c.winnerLabel}: {parseEntry(w).caption || w.id.slice(0, 8)}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <Button variant="subtle" onClick={draw} disabled={eligible.length === 0}>
            <Trophy size={13} /> {c.drawBtn}
          </Button>
          {eligible.length === 0 && winners.length === 0 && (
            <span className="ml-3 text-[12px] text-zinc-400">{c.noEligible}</span>
          )}
        </div>
        {draws.length > 0 && (
          <div className="mt-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{c.drawLog}</div>
            <ul className="mt-1 space-y-1">
              {draws.map((d) => (
                <li key={d.id} className="text-[12px] text-zinc-500 dark:text-zinc-400">
                  {fmtDate(d.at)} · {d.algorithmVersion} · {c.poolOf.replace('{n}', String(d.candidateIds.length))} · {d.winnerId.slice(0, 8)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>

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
