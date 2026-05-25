import { SiteHeader } from '@/components/layout/site-header';
import { LeagueRankingsClient } from '@/components/league/league-rankings-client';

export default function TournamentsPage() {
  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/tournaments" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        <header className="mb-8">
          <p className="stitch-label-accent">Leaderboard · Giải cộng đồng</p>
          <h1 className="stitch-headline text-4xl sm:text-5xl mt-2">Xếp hạng</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
            Theo dõi bảng điểm các giải cộng đồng eFootball với biến động điểm 24h và lịch sử gần nhất.
          </p>
        </header>
        <LeagueRankingsClient />
      </main>
    </div>
  );
}
