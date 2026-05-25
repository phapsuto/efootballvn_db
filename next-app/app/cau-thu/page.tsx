import { SiteHeader } from '@/components/layout/site-header';
import { PlayersListClient } from '@/components/players/players-list-client';

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    minOvr?: string;
    position?: string;
    cardType?: string;
    playstyle?: string;
    skill?: string;
    nationality?: string;
    club?: string;
    foot?: string;
    minHeight?: string;
    maxHeight?: string;
    sortBy?: string;
    page?: string;
  }>;
};

export default async function PlayersPage({ searchParams }: PageProps) {
  const resolved = (await searchParams) || {};

  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/cau-thu" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        <PlayersListClient
          initialFilters={{
            q: typeof resolved.q === 'string' ? resolved.q.trim() : '',
            minOvr: typeof resolved.minOvr === 'string' ? Number(resolved.minOvr) : undefined,
            position: typeof resolved.position === 'string' ? resolved.position.trim() : '',
            cardType: typeof resolved.cardType === 'string' ? resolved.cardType.trim() : '',
            playstyle: typeof resolved.playstyle === 'string' ? resolved.playstyle.trim() : '',
            skill: typeof resolved.skill === 'string' ? resolved.skill.trim() : '',
            nationality:
              typeof resolved.nationality === 'string' ? resolved.nationality.trim() : '',
            club: typeof resolved.club === 'string' ? resolved.club.trim() : '',
            foot: typeof resolved.foot === 'string' ? resolved.foot.trim() : '',
            minHeight:
              typeof resolved.minHeight === 'string' ? resolved.minHeight.trim() : '',
            maxHeight:
              typeof resolved.maxHeight === 'string' ? resolved.maxHeight.trim() : '',
            sortBy: typeof resolved.sortBy === 'string' ? (resolved.sortBy.trim() as 'overall_desc' | 'overall_asc' | 'name_asc' | 'name_desc' | 'updated_desc') : undefined,
            page: typeof resolved.page === 'string' ? Number(resolved.page) : undefined
          }}
        />
      </main>
    </div>
  );
}
