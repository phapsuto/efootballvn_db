import type { CommunityProfile } from '@/types/domain';

export const MOCK_COMMUNITY_PROFILES: CommunityProfile[] = [
  {
    id: 'u-1001',
    username: 'buildmaster_hieu',
    displayName: 'Buildmaster Hieu',
    avatarUrl: 'https://placehold.co/96x96/1f2937/93c5fd.png?text=BH',
    region: 'Asia & Pacific',
    country: 'Vietnam',
    following: 128,
    followers: 274,
    buildsCount: 66,
    favoritePlayerId: '88029951111111'
  },
  {
    id: 'u-1002',
    username: 'quickcounter_tuan',
    displayName: 'QuickCounter Tuan',
    avatarUrl: 'https://placehold.co/96x96/1f2937/fca5a5.png?text=QT',
    region: 'Asia & Pacific',
    country: 'Vietnam',
    following: 76,
    followers: 193,
    buildsCount: 41,
    favoritePlayerId: '88027772222222'
  },
  {
    id: 'u-1003',
    username: 'possession_andy',
    displayName: 'Possession Andy',
    avatarUrl: 'https://placehold.co/96x96/1f2937/a7f3d0.png?text=PA',
    region: 'Europe',
    country: 'United Kingdom',
    following: 221,
    followers: 502,
    buildsCount: 108,
    favoritePlayerId: '88041460859805'
  }
];
