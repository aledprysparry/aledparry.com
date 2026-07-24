import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { campaignsEnabled } from '@engine/lib/campaigns/flags';
import { getPublicCampaign } from '@engine/lib/campaigns/serverStore';
import CampaignExperience from '@/components/campaign/CampaignExperience';

// Public campaign experience (spec §2). Server-rendered, anonymous, reads the
// published campaign from Supabase. Dark by default: gated on the same
// NEXT_PUBLIC_POSTIO_CAMPAIGNS flag as the builder, and 404s when Supabase is
// unconfigured or the campaign is not found, so nothing spurious is public.
export const dynamic = 'force-dynamic';

interface PageProps {
  params: { brand: string; campaign: string };
  searchParams?: { lang?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!campaignsEnabled()) return { title: 'Campaign' };
  const res = await getPublicCampaign(params.brand, params.campaign);
  if (!res) return { title: 'Campaign' };
  const title = res.campaign.name.en || 'Campaign';
  return {
    title,
    openGraph: { title, type: 'website' },
    twitter: { card: 'summary_large_image', title },
  };
}

export default async function CampaignPage({ params, searchParams }: PageProps) {
  if (!campaignsEnabled()) notFound();
  const res = await getPublicCampaign(params.brand, params.campaign);
  if (!res) notFound();

  const lang: 'en' | 'cy' = searchParams?.lang === 'cy' ? 'cy' : 'en';
  return (
    <CampaignExperience
      campaign={res.campaign}
      brandName={res.brand?.name ?? ''}
      accent={res.accent}
      brandSlug={params.brand}
      lang={lang}
    />
  );
}
