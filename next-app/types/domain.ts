export type PlayerStats = Record<string, number>;

export type BuildCategory =
  | 'shooting'
  | 'passing'
  | 'dribbling'
  | 'dexterity'
  | 'lowerBodyStrength'
  | 'aerialStrength'
  | 'defending'
  | 'gk1'
  | 'gk2'
  | 'gk3';

export type Player = {
  efhubId: string;
  slug: string;
  name: string;
  shortName: string;
  nationality: string;
  club: string;
  league: string;
  positions: string[];
  cardType: string;
  rarity: string;
  overall: {
    base: number;
    max: number;
  };
  levels: {
    current: number;
    max: number;
  };
  stats: {
    level1: PlayerStats;
    maxLevel: PlayerStats;
    perLevel: Array<{
      level: number;
      overall?: number;
      stats: PlayerStats;
    }>;
  };
  skills: string[];
  playstyles: string[];
  condition: {
    form: string;
    injuryResistance: number;
  };
  build: {
    pointsCap: number;
  };
  positionRatings: Record<string, number>;
  images: {
    card: string;
    portrait: string;
    thumbnail: string;
  };
  source: {
    site: string;
    playerUrl: string;
    scrapedAt: string;
  };
  bio?: {
    age?: number;
    heightCm?: number;
    weightKg?: number;
    foot?: string;
  };
  extra?: {
    additionalSkills: string[];
    comPlayingStyles: string[];
    playerModel: Record<string, number>;
    physics: Record<string, number>;
    otherStats: Record<string, number | string>;
  };
};

export type Pack = {
  id: string;
  slug: string;
  name: string;
  type: string;
  bannerImage: string;
  startsAt: string;
  endsAt: string;
  playerIds: string[];
  source: {
    site: string;
    packUrl: string;
    scrapedAt: string;
  };
};

export type CommunityProfile = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  region: 'Europe' | 'Americas' | 'Asia & Pacific' | 'Middle East & Africa';
  country: string;
  following: number;
  followers: number;
  buildsCount: number;
  favoritePlayerId?: string;
  isFollowing?: boolean;
};

export type LeagueTeam = {
  id: string;
  name: string;
  logoUrl: string;
  members: number;
  points: number;
  mode: 'mobile_coop' | 'crossplay_coop';
  updatedAt: string;
  trend?: {
    pointsDelta24h: number;
    rankDelta24h: number;
    history: Array<{
      timestamp: string;
      points: number;
      rank?: number;
    }>;
  };
};

export type Manager = {
  efhubId: string;
  name: string;
  shortName: string;
  nationality: string;
  team: string;
  formation: string;
  playstyleProficiency: {
    quickCounter: number;
    possessionGame: number;
    longBallCounter: number;
    outWide: number;
    longBall: number;
  };
  affinity: {
    attack: number;
    midfield: number;
    defense: number;
  };
  imageUrl: string;
  source: {
    site: string;
    managerUrl: string;
    scrapedAt: string;
  };
};

export type PlayerBuild = {
  id: string;
  playerId: string;
  name: string;
  level: number;
  condition: string;
  allocations: Record<BuildCategory, number>;
  pointsUsed: number;
  likes: number;
  visibility: 'public' | 'private';
  authorId: string;
  authorName: string;
  authorCountry?: string;
  source: 'community' | 'user';
  createdAt: string;
  updatedAt: string;
};
