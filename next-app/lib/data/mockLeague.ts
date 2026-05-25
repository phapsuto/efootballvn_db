import type { LeagueTeam } from '@/types/domain';

export const MOCK_LEAGUE_TEAMS: LeagueTeam[] = [
  {
    id: 'team-001',
    name: 'SHEIKH UNITED',
    logoUrl: 'https://placehold.co/80x80/0f172a/22d3ee.png?text=SU',
    members: 4,
    points: 2564,
    mode: 'mobile_coop',
    updatedAt: '2026-04-14T00:00:00.000Z',
    trend: {
      pointsDelta24h: 42,
      rankDelta24h: 1,
      history: [
        { timestamp: '2026-04-13T00:00:00.000Z', points: 2522, rank: 2 },
        { timestamp: '2026-04-13T06:00:00.000Z', points: 2534, rank: 2 },
        { timestamp: '2026-04-13T12:00:00.000Z', points: 2541, rank: 2 },
        { timestamp: '2026-04-13T18:00:00.000Z', points: 2550, rank: 1 },
        { timestamp: '2026-04-14T00:00:00.000Z', points: 2564, rank: 1 }
      ]
    }
  },
  {
    id: 'team-002',
    name: 'The Nexus',
    logoUrl: 'https://placehold.co/80x80/0f172a/fde68a.png?text=NX',
    members: 2,
    points: 2199,
    mode: 'mobile_coop',
    updatedAt: '2026-04-14T00:00:00.000Z',
    trend: {
      pointsDelta24h: -11,
      rankDelta24h: -1,
      history: [
        { timestamp: '2026-04-13T00:00:00.000Z', points: 2210, rank: 1 },
        { timestamp: '2026-04-13T06:00:00.000Z', points: 2207, rank: 1 },
        { timestamp: '2026-04-13T12:00:00.000Z', points: 2202, rank: 2 },
        { timestamp: '2026-04-13T18:00:00.000Z', points: 2200, rank: 2 },
        { timestamp: '2026-04-14T00:00:00.000Z', points: 2199, rank: 2 }
      ]
    }
  },
  {
    id: 'team-003',
    name: 'Trouser GNG',
    logoUrl: 'https://placehold.co/80x80/0f172a/b6f09c.png?text=TG',
    members: 4,
    points: 1978,
    mode: 'mobile_coop',
    updatedAt: '2026-04-14T00:00:00.000Z',
    trend: {
      pointsDelta24h: 7,
      rankDelta24h: 0,
      history: [
        { timestamp: '2026-04-13T00:00:00.000Z', points: 1971, rank: 3 },
        { timestamp: '2026-04-13T06:00:00.000Z', points: 1972, rank: 3 },
        { timestamp: '2026-04-13T12:00:00.000Z', points: 1974, rank: 3 },
        { timestamp: '2026-04-13T18:00:00.000Z', points: 1975, rank: 3 },
        { timestamp: '2026-04-14T00:00:00.000Z', points: 1978, rank: 3 }
      ]
    }
  },
  {
    id: 'team-004',
    name: 'Crossplay Titans',
    logoUrl: 'https://placehold.co/80x80/0f172a/fca5a5.png?text=CT',
    members: 3,
    points: 1884,
    mode: 'crossplay_coop',
    updatedAt: '2026-04-14T00:00:00.000Z',
    trend: {
      pointsDelta24h: 25,
      rankDelta24h: 2,
      history: [
        { timestamp: '2026-04-13T00:00:00.000Z', points: 1859, rank: 6 },
        { timestamp: '2026-04-13T06:00:00.000Z', points: 1863, rank: 6 },
        { timestamp: '2026-04-13T12:00:00.000Z', points: 1870, rank: 5 },
        { timestamp: '2026-04-13T18:00:00.000Z', points: 1876, rank: 4 },
        { timestamp: '2026-04-14T00:00:00.000Z', points: 1884, rank: 4 }
      ]
    }
  }
];
