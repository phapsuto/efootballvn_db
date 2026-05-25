import type { PlayerBuild } from '@/types/domain';

export const MOCK_PLAYER_BUILDS: PlayerBuild[] = [
  {
    id: 'build_seed_1',
    playerId: '88041460859805',
    name: 'Meta Cân Bằng',
    level: 35,
    condition: 'B',
    allocations: {
      shooting: 6,
      passing: 7,
      dribbling: 7,
      dexterity: 6,
      lowerBodyStrength: 4,
      aerialStrength: 2,
      defending: 3,
      gk1: 0,
      gk2: 0,
      gk3: 0
    },
    pointsUsed: 35,
    likes: 29,
    visibility: 'public',
    authorId: 'seed_user_vn_01',
    authorName: 'EFVN Pro',
    authorCountry: 'Vietnam',
    source: 'community',
    createdAt: '2026-04-14T02:00:00.000Z',
    updatedAt: '2026-04-14T02:00:00.000Z'
  },
  {
    id: 'build_seed_2',
    playerId: '88041460859805',
    name: 'Công Mạnh',
    level: 35,
    condition: 'A',
    allocations: {
      shooting: 9,
      passing: 4,
      dribbling: 7,
      dexterity: 7,
      lowerBodyStrength: 5,
      aerialStrength: 2,
      defending: 1,
      gk1: 0,
      gk2: 0,
      gk3: 0
    },
    pointsUsed: 35,
    likes: 17,
    visibility: 'public',
    authorId: 'seed_user_vn_02',
    authorName: 'CounterPress',
    authorCountry: 'Vietnam',
    source: 'community',
    createdAt: '2026-04-14T05:30:00.000Z',
    updatedAt: '2026-04-14T05:30:00.000Z'
  }
];
