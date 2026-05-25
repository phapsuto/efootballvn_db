import { notFound } from 'next/navigation';

import { SiteHeader } from '@/components/layout/site-header';
import { LeagueTeamDetail } from '@/components/league/league-team-detail';
import { getLeagueTeamById } from '@/lib/data/repository';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LeagueTeamDetailPage({ params }: PageProps) {
  const { id } = await params;
  const team = await getLeagueTeamById(id);

  if (!team) {
    notFound();
  }

  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/tournaments" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        <LeagueTeamDetail team={team} />
      </main>
    </div>
  );
}
