import { notFound } from 'next/navigation';

import { SiteHeader } from '@/components/layout/site-header';
import { PlayerDetailClient } from '@/components/players/player-detail-client';
import { getPlayerById } from '@/lib/data/repository';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlayerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const player = await getPlayerById(id);

  if (!player) {
    notFound();
  }

  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/cau-thu" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        <PlayerDetailClient player={player} />
      </main>
    </div>
  );
}
