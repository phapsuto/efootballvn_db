import { notFound } from 'next/navigation';

import { CommunityProfileDetail } from '@/components/community/community-profile-detail';
import { SiteHeader } from '@/components/layout/site-header';
import { getCommunityProfileById, getPlayerById } from '@/lib/data/repository';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CommunityProfileDetailPage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getCommunityProfileById(id);
  if (!profile) {
    notFound();
  }

  const favoritePlayer = profile.favoritePlayerId
    ? await getPlayerById(profile.favoritePlayerId)
    : null;

  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/community" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        <CommunityProfileDetail profile={profile} favoritePlayer={favoritePlayer} />
      </main>
    </div>
  );
}
