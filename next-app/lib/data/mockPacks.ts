import type { Pack } from '@/types/domain';

export const MOCK_PACKS: Pack[] = [
  {
    id: 'pack-epic-2026-04',
    slug: 'epic-european-legends-apr-2026',
    name: 'Epic European Legends',
    type: 'Epic',
    bannerImage: 'https://placehold.co/1200x420/0f172a/93c5fd.png?text=Epic+European+Legends',
    startsAt: '2026-04-01T00:00:00.000Z',
    endsAt: '2026-04-30T23:59:59.000Z',
    playerIds: ['88041460993474', '88041460996837', '88042803039763'],
    source: {
      site: 'mock',
      packUrl: '',
      scrapedAt: '2026-04-14T00:00:00.000Z'
    }
  },
  {
    id: 'pack-highlight-2026-04',
    slug: 'highlight-premier-stars-apr-2026',
    name: 'Highlight Premier Stars',
    type: 'Highlight',
    bannerImage: 'https://placehold.co/1200x420/111827/f59e0b.png?text=Highlight+Premier+Stars',
    startsAt: '2026-04-01T00:00:00.000Z',
    endsAt: '2026-04-30T23:59:59.000Z',
    playerIds: ['106784429760291', '105862639181784', '105862639229509'],
    source: {
      site: 'mock',
      packUrl: '',
      scrapedAt: '2026-04-14T00:00:00.000Z'
    }
  }
];
