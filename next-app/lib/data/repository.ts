import 'server-only';

import { Collection, Document, Filter, ObjectId } from 'mongodb';

import { MOCK_COMMUNITY_PROFILES } from '@/lib/data/mockCommunity';
import { MOCK_PLAYER_BUILDS } from '@/lib/data/mockBuilds';
import { MOCK_LEAGUE_TEAMS } from '@/lib/data/mockLeague';
import { MOCK_MANAGERS } from '@/lib/data/mockManagers';
import { MOCK_PACKS } from '@/lib/data/mockPacks';
import { MOCK_PLAYERS } from '@/lib/data/mockPlayers';
import { normalizeViewerId } from '@/lib/security/viewer-session';
import { getMongoDatabase, isMongoConfigured } from '@/lib/data/mongo';
import { normalizeBuildAllocations } from '@/lib/gameplay/player-calculation';
import type {
  BuildCategory,
  CommunityProfile,
  LeagueTeam,
  Manager,
  Pack,
  PlayerBuild,
  Player
} from '@/types/domain';

type PlayerListOptions = {
  q?: string;
  position?: string;
  cardType?: string;
  playstyle?: string;
  nationality?: string;
  club?: string;
  foot?: string;
  minHeight?: number;
  maxHeight?: number;
  minOvr?: number;
  sortBy?:
    | 'overall_desc'
    | 'overall_asc'
    | 'name_asc'
    | 'name_desc'
    | 'updated_desc';
  page?: number;
  limit?: number;
};

type ManagerListOptions = {
  q?: string;
  formation?: string;
  playstyle?: string;
  nationality?: string;
  minStyleProficiency?: number;
  sortBy?:
    | 'style_desc'
    | 'style_asc'
    | 'name_asc'
    | 'name_desc'
    | 'team_asc'
    | 'team_desc'
    | 'updated_desc';
  page?: number;
  limit?: number;
};

type PackListOptions = {
  q?: string;
  type?: string;
  page?: number;
  limit?: number;
};

type CommunityListOptions = {
  q?: string;
  region?: string;
  country?: string;
  tab?: 'discover' | 'following' | 'followers';
  viewerId?: string;
  sortBy?:
    | 'tab_default'
    | 'builds_desc'
    | 'followers_desc'
    | 'following_desc'
    | 'name_asc'
    | 'name_desc';
  page?: number;
  limit?: number;
};

type LeagueListOptions = {
  q?: string;
  mode?: LeagueTeam['mode'] | 'all';
  sortBy?:
    | 'points_desc'
    | 'points_asc'
    | 'members_desc'
    | 'members_asc'
    | 'updated_desc'
    | 'name_asc'
    | 'name_desc';
  page?: number;
  limit?: number;
};

type PlayerBuildListOptions = {
  playerId: string;
  scope?: 'community' | 'mine';
  authorId?: string;
  page?: number;
  limit?: number;
};

type CreatePlayerBuildInput = {
  playerId: string;
  name: string;
  level: number;
  condition: string;
  allocations: Partial<Record<BuildCategory, number>>;
  pointsUsed?: number;
  visibility?: PlayerBuild['visibility'];
  authorId?: string;
  authorName?: string;
  authorCountry?: string;
  source?: PlayerBuild['source'];
};

type UpdatePlayerBuildInput = {
  playerId: string;
  buildId: string;
  authorId: string;
  name?: string;
  level?: number;
  condition?: string;
  allocations?: Partial<Record<BuildCategory, number>>;
  pointsUsed?: number;
  visibility?: PlayerBuild['visibility'];
};

type DeletePlayerBuildInput = {
  playerId: string;
  buildId: string;
  authorId: string;
};

type ListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  source: 'mock' | 'mongo';
};

type DataSourceStatus = {
  connected: boolean;
  mode: 'mock' | 'mongo';
  database: string | null;
  collections: {
    players: number;
    managers: number;
    packs: number;
    communityProfiles: number;
    leagueRankings: number;
    playerBuilds: number;
    communityFollows: number;
  } | null;
  error: string | null;
};

type CommunityFollowMutationInput = {
  viewerId: string;
  profileId: string;
  follow: boolean;
};

type CommunityFollowMutationResult = {
  profile: CommunityProfile | null;
  changed: boolean;
};

const normalize = (value: string) => value.trim().toLowerCase();
const PLAYERS_COLLECTION = process.env.PLAYERS_COLLECTION?.trim() || 'players';
const MANAGERS_COLLECTION = process.env.MANAGERS_COLLECTION?.trim() || 'managers';
const PACKS_COLLECTION = process.env.PACKS_COLLECTION?.trim() || 'packs';
const COMMUNITY_COLLECTION = process.env.COMMUNITY_COLLECTION?.trim() || 'community_profiles';
const LEAGUE_COLLECTION = process.env.LEAGUE_COLLECTION?.trim() || 'league_rankings';
const PLAYER_BUILDS_COLLECTION =
  process.env.PLAYER_BUILDS_COLLECTION?.trim() || 'player_builds';
const COMMUNITY_FOLLOWS_COLLECTION =
  process.env.COMMUNITY_FOLLOWS_COLLECTION?.trim() || 'community_follows';
const DEFAULT_PLAYER_CARD = 'https://placehold.co/512x640?text=Player+Card';
const DEFAULT_MANAGER_AVATAR = 'https://placehold.co/320x320?text=Manager';
const DEFAULT_PACK_BANNER = 'https://placehold.co/1200x420/0f172a/93c5fd?text=Player+Pack';
const DEFAULT_AVATAR = 'https://placehold.co/96x96/1f2937/93c5fd?text=U';
const DEFAULT_TEAM_LOGO = 'https://placehold.co/80x80/0f172a/22d3ee?text=TEAM';

const POSITION_KEYS = [
  'GK',
  'CB',
  'LB',
  'RB',
  'DMF',
  'CMF',
  'LMF',
  'RMF',
  'AMF',
  'LWF',
  'RWF',
  'SS',
  'CF'
] as const;

const CORE_PLAYER_STAT_KEYS = new Set(
  [
    'offensiveAwareness',
    'ballControl',
    'dribbling',
    'tightPossession',
    'finishing',
    'lowPass',
    'loftedPass',
    'speed',
    'acceleration',
    'kickingPower',
    'defensiveAwareness',
    'trackingBack',
    'ballWinning',
    'aggression',
    'jump',
    'physicalContact',
    'balance',
    'stamina',
    'heading',
    'setPieceTaking',
    'curl',
    'gkAwareness',
    'gkCatching',
    'gkClearing',
    'gkReflexes',
    'gkReach'
  ].map((item) => item.toLowerCase())
);

let lastMongoQueryErrorLogAt = 0;
const inMemoryPlayerBuilds: PlayerBuild[] = MOCK_PLAYER_BUILDS.map((item) => ({ ...item }));
const inMemoryCommunityProfiles: CommunityProfile[] = MOCK_COMMUNITY_PROFILES.map((item) => ({
  ...item
}));
const inMemoryCommunityFollowPairs = new Set<string>();

function maybeLogMongoQueryError(scope: string, error: unknown) {
  const now = Date.now();
  if (now - lastMongoQueryErrorLogAt < 30_000) {
    return;
  }
  lastMongoQueryErrorLogAt = now;
  const message = error instanceof Error ? error.message : 'Unknown MongoDB query error';
  // eslint-disable-next-line no-console
  console.error(`[mongo] ${scope} failed: ${message}`);
}

function toObject(value: unknown): Record<string, unknown> {
  if (!value) {
    return {};
  }
  if (value instanceof Map) {
    return Object.fromEntries(value.entries());
  }
  if (typeof value === 'object') {
    return value as Record<string, unknown>;
  }
  return {};
}

function toStringValue(value: unknown, fallback = '') {
  if (typeof value === 'string') {
    const output = value.trim();
    return output || fallback;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
}

function toIdValue(value: unknown) {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'object' && 'toString' in (value as object)) {
    const raw = String(value);
    return raw === '[object Object]' ? '' : raw.trim();
  }
  return '';
}

function toNumberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNumberRecord(value: unknown): Record<string, number> {
  const output: Record<string, number> = {};
  const objectValue = toObject(value);

  Object.entries(objectValue).forEach(([key, raw]) => {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      output[key] = parsed;
    }
  });

  return output;
}

function toLooseNumber(value: unknown) {
  const direct = Number(value);
  if (Number.isFinite(direct)) {
    return direct;
  }

  if (typeof value !== 'string') {
    return Number.NaN;
  }

  const normalized = value.replace(',', '.');
  const match = normalized.match(/-?\d+(\.\d+)?/);
  if (!match) {
    return Number.NaN;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function toStringOrNumberRecord(value: unknown): Record<string, number | string> {
  const output: Record<string, number | string> = {};
  const objectValue = toObject(value);

  Object.entries(objectValue).forEach(([key, raw]) => {
    if (typeof raw === 'string') {
      const text = raw.trim();
      if (text) {
        output[key] = text;
      }
      return;
    }

    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      output[key] = parsed;
    }
  });

  return output;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => toStringValue(item))
    .filter((item) => item.length > 0);
}

function toIsoDate(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  const parsed = Date.parse(toStringValue(value));
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toISOString();
  }
  return new Date().toISOString();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toCaseInsensitiveExactRegex(value: string) {
  return new RegExp(`^${escapeRegex(value.trim())}$`, 'i');
}

function toPositions(value: unknown) {
  return toStringArray(value).map((item) => item.toUpperCase());
}

function normalizePositionRatings(
  raw: Record<string, unknown>,
  positions: string[],
  overallMax: number
) {
  const fromDocument = {
    ...toNumberRecord(raw.positionRatings),
    ...toNumberRecord(raw.ratingsByPosition),
    ...toNumberRecord(raw.positionMap)
  };

  const directEntries = Object.entries(fromDocument);
  if (directEntries.length > 0) {
    return directEntries.reduce<Record<string, number>>((acc, [key, rating]) => {
      acc[key.toUpperCase()] = clamp(Math.round(rating), 40, 120);
      return acc;
    }, {});
  }

  const positionSet = new Set(positions.map((item) => item.toUpperCase()));
  const fallbackPeak = clamp(Math.round(overallMax), 40, 120);
  const fallbackOther = clamp(fallbackPeak - 20, 40, 120);

  return POSITION_KEYS.reduce<Record<string, number>>((acc, position) => {
    acc[position] = positionSet.has(position) ? fallbackPeak : fallbackOther;
    return acc;
  }, {});
}

function normalizePlayerDocument(document: Document): Player {
  const raw = toObject(document);
  const name = toStringValue(raw.name, 'Unknown Player');
  const overall = toObject(raw.overall);
  const levels = toObject(raw.levels);
  const stats = toObject(raw.stats);
  const source = toObject(raw.source);
  const images = toObject(raw.images);
  const condition = toObject(raw.condition);
  const build = toObject(raw.build);
  const positionOrientedLevels = Math.max(
    1,
    Math.round(toNumberValue(levels.max, toNumberValue(raw.maxLevel, 1)))
  );

  let level1Stats = toNumberRecord(stats.level1);
  let maxLevelStats = toNumberRecord(stats.maxLevel);

  const flatStats = toNumberRecord(stats);
  if (Object.keys(level1Stats).length === 0 && Object.keys(maxLevelStats).length === 0) {
    level1Stats = { ...flatStats };
    maxLevelStats = { ...flatStats };
  }
  if (Object.keys(level1Stats).length === 0) {
    level1Stats = { ...maxLevelStats };
  }
  if (Object.keys(maxLevelStats).length === 0) {
    maxLevelStats = { ...level1Stats };
  }

  const perLevelSource = Array.isArray(stats.perLevel) ? stats.perLevel : [];
  const perLevel = perLevelSource
    .map((entry) => {
      const item = toObject(entry);
      const level = Math.round(toNumberValue(item.level, 0));
      if (level <= 0) {
        return null;
      }
      const overallValue = toNumberValue(item.overall, Number.NaN);
      return {
        level,
        overall: Number.isFinite(overallValue) ? Math.round(overallValue) : undefined,
        stats: toNumberRecord(item.stats)
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const positions = toPositions(raw.positions);
  const overallBase = clamp(
    Math.round(toNumberValue(overall.base, toNumberValue(raw.overallBase, 1))),
    1,
    120
  );
  const overallMax = clamp(
    Math.round(toNumberValue(overall.max, toNumberValue(raw.overallMax, overallBase))),
    1,
    120
  );

  const efhubId =
    toStringValue(raw.efhubId) ||
    toStringValue(raw.id) ||
    toIdValue(raw._id) ||
    `${slugify(name)}-${overallMax}`;
  const generatedSlug = slugify(name) || efhubId.toLowerCase();

  const normalizedForm = toStringValue(condition.form, 'C').toUpperCase();
  const form = ['A', 'B', 'C', 'D', 'E'].includes(normalizedForm) ? normalizedForm : 'C';
  const details = toObject(raw.details);
  const profile = toObject(raw.profile);
  const bioSource = toObject(raw.bio);
  const playerInfo = toObject(raw.playerInfo);

  const ageRaw = toLooseNumber(
    bioSource.age ?? profile.age ?? details.age ?? playerInfo.age ?? raw.age
  );
  const heightRaw = toLooseNumber(
    bioSource.heightCm ??
      bioSource.height ??
      profile.heightCm ??
      profile.height ??
      details.height ??
      playerInfo.height ??
      raw.heightCm ??
      raw.height
  );
  const weightRaw = toLooseNumber(
    bioSource.weightKg ??
      bioSource.weight ??
      profile.weightKg ??
      profile.weight ??
      details.weight ??
      playerInfo.weight ??
      raw.weightKg ??
      raw.weight
  );
  const foot = toStringValue(
    bioSource.foot ||
      bioSource.strongFoot ||
      bioSource.preferredFoot ||
      profile.foot ||
      profile.strongFoot ||
      profile.preferredFoot ||
      details.foot ||
      details.strongFoot ||
      playerInfo.foot ||
      raw.foot ||
      raw.strongFoot ||
      raw.preferredFoot
  );

  const bio: Player['bio'] = {};
  if (Number.isFinite(ageRaw) && ageRaw > 0) {
    bio.age = Math.round(ageRaw);
  }
  if (Number.isFinite(heightRaw) && heightRaw > 0) {
    bio.heightCm = Math.round(heightRaw);
  }
  if (Number.isFinite(weightRaw) && weightRaw > 0) {
    bio.weightKg = Math.round(weightRaw);
  }
  if (foot) {
    bio.foot = foot;
  }

  const additionalSkills = Array.from(
    new Set([
      ...toStringArray(raw.additionalSkills),
      ...toStringArray(raw.extraSkills),
      ...toStringArray(profile.additionalSkills),
      ...toStringArray(details.additionalSkills)
    ])
  );

  const comPlayingStyles = Array.from(
    new Set([
      ...toStringArray(raw.comPlayingStyles),
      ...toStringArray(raw.comSkills),
      ...toStringArray(raw.comStyles),
      ...toStringArray(profile.comPlayingStyles),
      ...toStringArray(details.comPlayingStyles)
    ])
  );

  const playerModel = {
    ...toNumberRecord(raw.playerModel),
    ...toNumberRecord(raw.modelStats),
    ...toNumberRecord(profile.playerModel),
    ...toNumberRecord(details.playerModel)
  };

  const physics = {
    ...toNumberRecord(raw.physics),
    ...toNumberRecord(raw.physicalModel),
    ...toNumberRecord(profile.physics),
    ...toNumberRecord(details.physics)
  };

  const derivedOtherStats = Object.entries(maxLevelStats).reduce<Record<string, number>>(
    (acc, [key, value]) => {
      if (CORE_PLAYER_STAT_KEYS.has(key.trim().toLowerCase())) {
        return acc;
      }
      acc[key] = Math.round(value);
      return acc;
    },
    {}
  );

  const otherStats = {
    ...derivedOtherStats,
    ...toStringOrNumberRecord(raw.otherStats),
    ...toStringOrNumberRecord(profile.otherStats),
    ...toStringOrNumberRecord(details.otherStats)
  };

  const hasExtra =
    additionalSkills.length > 0 ||
    comPlayingStyles.length > 0 ||
    Object.keys(playerModel).length > 0 ||
    Object.keys(physics).length > 0 ||
    Object.keys(otherStats).length > 0;
  const hasBio = Object.keys(bio).length > 0;

  return {
    efhubId,
    slug: toStringValue(raw.slug, generatedSlug),
    name,
    shortName: toStringValue(raw.shortName, name),
    nationality: toStringValue(raw.nationality, 'Unknown'),
    club: toStringValue(raw.club, 'Unknown Club'),
    league: toStringValue(raw.league, 'Unknown League'),
    positions: positions.length > 0 ? positions : ['CF'],
    cardType: toStringValue(raw.cardType, 'Standard'),
    rarity: toStringValue(raw.rarity, toStringValue(raw.cardType, 'Standard')),
    overall: {
      base: overallBase,
      max: overallMax
    },
    levels: {
      current: clamp(Math.round(toNumberValue(levels.current, 1)), 1, positionOrientedLevels),
      max: positionOrientedLevels
    },
    stats: {
      level1: level1Stats,
      maxLevel: maxLevelStats,
      perLevel
    },
    skills: toStringArray(raw.skills),
    playstyles: toStringArray(raw.playstyles),
    condition: {
      form,
      injuryResistance: clamp(
        Math.round(toNumberValue(condition.injuryResistance, 2)),
        0,
        3
      )
    },
    build: {
      pointsCap: Math.max(
        0,
        Math.round(
          toNumberValue(
            build.pointsCap,
            toNumberValue(raw.progressionPointsCap, (positionOrientedLevels - 1) * 2)
          )
        )
      )
    },
    positionRatings: normalizePositionRatings(raw, positions, overallMax),
    images: {
      card:
        toStringValue(images.card) ||
        toStringValue(images.portrait) ||
        toStringValue(raw.cardImageUrl) ||
        DEFAULT_PLAYER_CARD,
      portrait:
        toStringValue(images.portrait) ||
        toStringValue(images.card) ||
        toStringValue(raw.cardImageUrl) ||
        DEFAULT_PLAYER_CARD,
      thumbnail:
        toStringValue(images.thumbnail) ||
        toStringValue(images.card) ||
        toStringValue(raw.cardImageUrl) ||
        DEFAULT_PLAYER_CARD
    },
    source: {
      site: toStringValue(source.site, 'mongo'),
      playerUrl: toStringValue(source.playerUrl),
      scrapedAt: toIsoDate(source.scrapedAt || raw.updatedAt || raw.createdAt)
    },
    bio: hasBio ? bio : undefined,
    extra: hasExtra
      ? {
          additionalSkills,
          comPlayingStyles,
          playerModel,
          physics,
          otherStats
        }
      : undefined
  };
}

function normalizeManagerDocument(document: Document): Manager {
  const raw = toObject(document);
  const source = toObject(raw.source);
  const proficiency = toObject(raw.playstyleProficiency);
  const affinity = toObject(raw.affinity);
  const name = toStringValue(raw.name, 'Unknown Manager');

  return {
    efhubId: toStringValue(raw.efhubId, toStringValue(raw.id, toIdValue(raw._id) || slugify(name))),
    name,
    shortName: toStringValue(raw.shortName, name),
    nationality: toStringValue(raw.nationality, 'Unknown'),
    team: toStringValue(raw.team, 'Unknown Team'),
    formation: toStringValue(raw.formation, '4-3-3'),
    playstyleProficiency: {
      quickCounter: clamp(Math.round(toNumberValue(proficiency.quickCounter, 0)), 0, 100),
      possessionGame: clamp(Math.round(toNumberValue(proficiency.possessionGame, 0)), 0, 100),
      longBallCounter: clamp(Math.round(toNumberValue(proficiency.longBallCounter, 0)), 0, 100),
      outWide: clamp(Math.round(toNumberValue(proficiency.outWide, 0)), 0, 100),
      longBall: clamp(Math.round(toNumberValue(proficiency.longBall, 0)), 0, 100)
    },
    affinity: {
      attack: clamp(Math.round(toNumberValue(affinity.attack, 0)), 0, 100),
      midfield: clamp(Math.round(toNumberValue(affinity.midfield, 0)), 0, 100),
      defense: clamp(Math.round(toNumberValue(affinity.defense, 0)), 0, 100)
    },
    imageUrl: toStringValue(raw.imageUrl, DEFAULT_MANAGER_AVATAR),
    source: {
      site: toStringValue(source.site, 'mongo'),
      managerUrl: toStringValue(source.managerUrl),
      scrapedAt: toIsoDate(source.scrapedAt || raw.updatedAt || raw.createdAt)
    }
  };
}

function managerStylePeak(manager: Manager) {
  return Math.max(
    Number(manager.playstyleProficiency.quickCounter || 0),
    Number(manager.playstyleProficiency.possessionGame || 0),
    Number(manager.playstyleProficiency.longBallCounter || 0),
    Number(manager.playstyleProficiency.outWide || 0),
    Number(manager.playstyleProficiency.longBall || 0)
  );
}

function managerStyleValue(manager: Manager, playstyle?: string) {
  if (!playstyle) {
    return managerStylePeak(manager);
  }
  const key = playstyle as keyof Manager['playstyleProficiency'];
  return Number(manager.playstyleProficiency[key] || 0);
}

function normalizeCommunityRegion(value: unknown): CommunityProfile['region'] {
  const raw = normalize(toStringValue(value, 'Asia & Pacific'));
  if (raw === 'europe') {
    return 'Europe';
  }
  if (raw === 'americas') {
    return 'Americas';
  }
  if (raw === 'middle east & africa' || raw === 'middle east and africa') {
    return 'Middle East & Africa';
  }
  return 'Asia & Pacific';
}

function normalizeLeagueMode(value: unknown): LeagueTeam['mode'] {
  const raw = normalize(toStringValue(value, 'mobile_coop'));
  return raw === 'crossplay_coop' ? 'crossplay_coop' : 'mobile_coop';
}

function hashSeed(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 1_000_000_007;
  }
  return hash;
}

function parseLeagueTrendHistory(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const parsed = value
    .map((item) => {
      const entry = toObject(item);
      const points = Math.round(toNumberValue(entry.points, Number.NaN));
      if (!Number.isFinite(points)) {
        return null;
      }

      const timestamp = toIsoDate(
        entry.timestamp || entry.at || entry.date || entry.updatedAt || entry.time
      );
      const rankRaw = toLooseNumber(entry.rank);
      const rank = Number.isFinite(rankRaw) ? Math.max(1, Math.round(rankRaw)) : undefined;
      const output: {
        timestamp: string;
        points: number;
        rank?: number;
      } = {
        timestamp,
        points: Math.max(0, points)
      };
      if (typeof rank === 'number') {
        output.rank = rank;
      }
      return output;
    })
    .filter((item): item is { timestamp: string; points: number; rank?: number } => item !== null)
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

  if (parsed.length <= 8) {
    return parsed;
  }

  return parsed.slice(parsed.length - 8);
}

function buildSyntheticLeagueHistory(team: Pick<LeagueTeam, 'id' | 'points' | 'updatedAt'>) {
  const seed = hashSeed(team.id || String(team.points));
  const currentAt = Date.parse(team.updatedAt);
  const safeUpdatedAt = Number.isFinite(currentAt) ? currentAt : Date.now();
  const stepMs = 4 * 60 * 60 * 1000;
  const baseVariance = Math.max(6, Math.round(team.points * 0.012));
  const trendBias = (seed % 7) - 3;

  const history = Array.from({ length: 7 }, (_, index) => {
    const distance = 6 - index;
    const oscillation = ((seed + index * 11) % (baseVariance + 3)) - Math.floor(baseVariance / 2);
    const adjusted = Math.max(
      0,
      Math.round(team.points - trendBias * distance - oscillation * 0.4)
    );
    const timestamp = new Date(safeUpdatedAt - distance * stepMs).toISOString();
    return {
      timestamp,
      points: index === 6 ? team.points : adjusted
    };
  });

  return history;
}

function enrichLeagueTeamTrend(
  team: LeagueTeam,
  raw?: Record<string, unknown>
): LeagueTeam {
  const trendObject = toObject(raw?.trend);
  const rawHistory =
    parseLeagueTrendHistory(trendObject.history).length > 0
      ? parseLeagueTrendHistory(trendObject.history)
      : parseLeagueTrendHistory(raw?.history);

  const history =
    rawHistory.length > 0
      ? rawHistory
      : team.trend?.history && team.trend.history.length > 0
        ? parseLeagueTrendHistory(team.trend.history)
        : buildSyntheticLeagueHistory(team);

  const normalizedHistory: Array<{ timestamp: string; points: number; rank?: number }> =
    history.length > 0
      ? [...history]
      : buildSyntheticLeagueHistory(team);

  if (normalizedHistory.length === 0) {
    normalizedHistory.push({
      timestamp: team.updatedAt,
      points: team.points
    });
  }

  const last = normalizedHistory[normalizedHistory.length - 1];
  if (last.points !== team.points || last.timestamp !== team.updatedAt) {
    normalizedHistory.push({
      timestamp: team.updatedAt,
      points: team.points,
      rank: last.rank
    });
  } else {
    last.points = team.points;
    last.timestamp = team.updatedAt;
  }

  const baseline = normalizedHistory[0];
  const explicitPointsDelta = toLooseNumber(trendObject.pointsDelta24h ?? raw?.pointsDelta24h);
  const pointsDelta24h = Number.isFinite(explicitPointsDelta)
    ? Math.round(explicitPointsDelta)
    : Math.round(team.points - baseline.points);

  const explicitRankDelta = toLooseNumber(trendObject.rankDelta24h ?? raw?.rankDelta24h);
  const rankDelta24h = Number.isFinite(explicitRankDelta)
    ? Math.round(explicitRankDelta)
    : typeof baseline.rank === 'number' && typeof last.rank === 'number'
      ? baseline.rank - last.rank
      : pointsDelta24h >= 15
        ? 1
        : pointsDelta24h <= -15
          ? -1
          : 0;

  return {
    ...team,
    trend: {
      pointsDelta24h,
      rankDelta24h,
      history: normalizedHistory
    }
  };
}

function normalizeBuildVisibility(value: unknown): PlayerBuild['visibility'] {
  const raw = normalize(toStringValue(value, 'public'));
  return raw === 'private' ? 'private' : 'public';
}

function normalizeBuildSource(value: unknown): PlayerBuild['source'] {
  const raw = normalize(toStringValue(value, 'community'));
  return raw === 'user' ? 'user' : 'community';
}

function normalizePackDocument(document: Document): Pack {
  const raw = toObject(document);
  const source = toObject(raw.source);
  const name = toStringValue(raw.name, 'Unknown Pack');
  const startsAt = toIsoDate(raw.startsAt || raw.startAt || raw.createdAt);
  const endsAt = toIsoDate(raw.endsAt || raw.endAt || raw.updatedAt || startsAt);
  const id = toStringValue(raw.id, toStringValue(raw.packId, toStringValue(raw.efhubId, toIdValue(raw._id))));

  return {
    id: id || slugify(name) || 'pack',
    slug: toStringValue(raw.slug, slugify(name) || id || 'pack'),
    name,
    type: toStringValue(raw.type, toStringValue(raw.cardType, 'Unknown')),
    bannerImage: toStringValue(raw.bannerImage, DEFAULT_PACK_BANNER),
    startsAt,
    endsAt,
    playerIds: toStringArray(raw.playerIds),
    source: {
      site: toStringValue(source.site, 'mongo'),
      packUrl: toStringValue(source.packUrl, toStringValue(raw.packUrl)),
      scrapedAt: toIsoDate(source.scrapedAt || raw.updatedAt || raw.createdAt || startsAt)
    }
  };
}

function normalizeCommunityProfileDocument(document: Document): CommunityProfile {
  const raw = toObject(document);
  const username = toStringValue(raw.username, toStringValue(raw.handle, 'user'));
  const displayName = toStringValue(raw.displayName, username || 'Unknown');

  return {
    id: toStringValue(raw.id, toStringValue(raw.profileId, toStringValue(raw.efhubId, toIdValue(raw._id)))),
    username,
    displayName,
    avatarUrl: toStringValue(raw.avatarUrl, DEFAULT_AVATAR),
    region: normalizeCommunityRegion(raw.region),
    country: toStringValue(raw.country, 'Unknown'),
    following: Math.max(0, Math.round(toNumberValue(raw.following, 0))),
    followers: Math.max(0, Math.round(toNumberValue(raw.followers, 0))),
    buildsCount: Math.max(0, Math.round(toNumberValue(raw.buildsCount, 0))),
    favoritePlayerId: toStringValue(raw.favoritePlayerId) || undefined
  };
}

function normalizeLeagueTeamDocument(document: Document): LeagueTeam {
  const raw = toObject(document);
  const name = toStringValue(raw.name, 'Unknown Team');
  const base: LeagueTeam = {
    id: toStringValue(raw.id, toStringValue(raw.teamId, toStringValue(raw.efhubId, toIdValue(raw._id)))),
    name,
    logoUrl: toStringValue(raw.logoUrl, DEFAULT_TEAM_LOGO),
    members: Math.max(1, Math.round(toNumberValue(raw.members, 1))),
    points: Math.max(0, Math.round(toNumberValue(raw.points, 0))),
    mode: normalizeLeagueMode(raw.mode),
    updatedAt: toIsoDate(raw.updatedAt || raw.lastUpdated || raw.createdAt)
  };

  return enrichLeagueTeamTrend(base, raw);
}

function normalizePlayerBuildDocument(document: Document): PlayerBuild {
  const raw = toObject(document);
  const playerId = toStringValue(raw.playerId);
  const id = toStringValue(raw.id, toIdValue(raw._id));

  return {
    id: id || `${playerId}-${Date.now()}`,
    playerId,
    name: toStringValue(raw.name, 'Build'),
    level: clamp(Math.round(toNumberValue(raw.level, 1)), 1, 150),
    condition: ['A', 'B', 'C', 'D', 'E'].includes(toStringValue(raw.condition, 'C').toUpperCase())
      ? toStringValue(raw.condition, 'C').toUpperCase()
      : 'C',
    allocations: normalizeBuildAllocations(
      toObject(raw.allocations) as Partial<Record<BuildCategory, number>>
    ),
    pointsUsed: Math.max(0, Math.round(toNumberValue(raw.pointsUsed, 0))),
    likes: Math.max(0, Math.round(toNumberValue(raw.likes, 0))),
    visibility: normalizeBuildVisibility(raw.visibility),
    authorId: toStringValue(raw.authorId, 'guest'),
    authorName: toStringValue(raw.authorName, 'Anonymous'),
    authorCountry: toStringValue(raw.authorCountry) || undefined,
    source: normalizeBuildSource(raw.source),
    createdAt: toIsoDate(raw.createdAt),
    updatedAt: toIsoDate(raw.updatedAt || raw.createdAt)
  };
}

async function getCollection(name: string): Promise<Collection<Document> | null> {
  const db = await getMongoDatabase();
  return db ? db.collection<Document>(name) : null;
}

function buildCommunityFollowPairKey(followerId: string, followingId: string) {
  return `${followerId}::${followingId}`;
}

type CommunityFollowSets = {
  followingIds: Set<string>;
  followerIds: Set<string>;
};

async function loadMongoCommunityFollowSets(viewerId: string): Promise<CommunityFollowSets> {
  const followsCollection = await getCollection(COMMUNITY_FOLLOWS_COLLECTION);
  if (!followsCollection) {
    return {
      followingIds: new Set<string>(),
      followerIds: new Set<string>()
    };
  }

  try {
    const [outgoing, incoming] = await Promise.all([
      followsCollection.find({ followerId: viewerId }).project({ followingId: 1 }).toArray(),
      followsCollection.find({ followingId: viewerId }).project({ followerId: 1 }).toArray()
    ]);

    return {
      followingIds: new Set(
        outgoing
          .map((item) => toStringValue(item.followingId))
          .filter(Boolean)
      ),
      followerIds: new Set(
        incoming
          .map((item) => toStringValue(item.followerId))
          .filter(Boolean)
      )
    };
  } catch (error) {
    maybeLogMongoQueryError('loadMongoCommunityFollowSets', error);
    return {
      followingIds: new Set<string>(),
      followerIds: new Set<string>()
    };
  }
}

function loadMockCommunityFollowSets(viewerId: string): CommunityFollowSets {
  const followingIds = new Set<string>();
  const followerIds = new Set<string>();

  inMemoryCommunityFollowPairs.forEach((pair) => {
    const [followerId, followingId] = pair.split('::');
    if (!followerId || !followingId) {
      return;
    }
    if (followerId === viewerId) {
      followingIds.add(followingId);
    }
    if (followingId === viewerId) {
      followerIds.add(followerId);
    }
  });

  return { followingIds, followerIds };
}

function applyCommunityFollowFlags(
  profiles: CommunityProfile[],
  followingIds: Set<string>
) {
  return profiles.map((profile) => ({
    ...profile,
    isFollowing: followingIds.has(profile.id)
  }));
}

function updateMockCommunityCounters(
  viewerId: string,
  profileId: string,
  delta: 1 | -1
) {
  const targetProfile = inMemoryCommunityProfiles.find((item) => item.id === profileId);
  if (targetProfile) {
    targetProfile.followers = Math.max(0, targetProfile.followers + delta);
  }

  const viewerProfile = inMemoryCommunityProfiles.find((item) => item.id === viewerId);
  if (viewerProfile) {
    viewerProfile.following = Math.max(0, viewerProfile.following + delta);
  }
}

function communitySortByTab(
  tab: CommunityListOptions['tab']
): 'builds_desc' | 'followers_desc' | 'following_desc' {
  if (tab === 'following') {
    return 'following_desc';
  }
  if (tab === 'followers') {
    return 'followers_desc';
  }
  return 'builds_desc';
}

function buildPlayerMockResponse(options: PlayerListOptions) {
  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.min(100, Math.max(1, Number(options.limit || 24)));
  const sortBy = options.sortBy || 'overall_desc';

  const filtered = MOCK_PLAYERS.filter((player) => {
    if (options.q) {
      const q = normalize(options.q);
      const hit = [player.name, player.shortName, player.club]
        .filter(Boolean)
        .some((item) => normalize(item).includes(q));
      if (!hit) {
        return false;
      }
    }

    if (options.position) {
      const position = options.position.toUpperCase();
      if (!player.positions.includes(position)) {
        return false;
      }
    }

    if (options.cardType) {
      if (normalize(player.cardType) !== normalize(options.cardType)) {
        return false;
      }
    }

    if (options.nationality) {
      const nationality = normalize(options.nationality);
      if (!normalize(player.nationality || '').includes(nationality)) {
        return false;
      }
    }

    if (options.club) {
      const club = normalize(options.club);
      if (!normalize(player.club || '').includes(club)) {
        return false;
      }
    }

    if (options.foot) {
      const foot = normalize(options.foot);
      const playerFoot = normalize(player.bio?.foot || '');
      if (!playerFoot || !playerFoot.includes(foot)) {
        return false;
      }
    }

    if (typeof options.minHeight === 'number' && Number.isFinite(options.minHeight)) {
      const height = Number(player.bio?.heightCm);
      if (!Number.isFinite(height) || height < options.minHeight) {
        return false;
      }
    }

    if (typeof options.maxHeight === 'number' && Number.isFinite(options.maxHeight)) {
      const height = Number(player.bio?.heightCm);
      if (!Number.isFinite(height) || height > options.maxHeight) {
        return false;
      }
    }

    if (options.playstyle) {
      const style = normalize(options.playstyle);
      if (!player.playstyles.some((item) => normalize(item) === style)) {
        return false;
      }
    }

    if (typeof options.minOvr === 'number' && Number.isFinite(options.minOvr)) {
      if (player.overall.max < options.minOvr) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'overall_asc') {
      return a.overall.max - b.overall.max || a.name.localeCompare(b.name);
    }
    if (sortBy === 'name_asc') {
      return a.name.localeCompare(b.name) || b.overall.max - a.overall.max;
    }
    if (sortBy === 'name_desc') {
      return b.name.localeCompare(a.name) || b.overall.max - a.overall.max;
    }
    if (sortBy === 'updated_desc') {
      const aTime = Date.parse(a.source?.scrapedAt || '');
      const bTime = Date.parse(b.source?.scrapedAt || '');
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    }
    return b.overall.max - a.overall.max || a.name.localeCompare(b.name);
  });

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const data = filtered.slice(offset, offset + limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      source: 'mock' as const
    }
  };
}

function buildManagerMockResponse(options: ManagerListOptions) {
  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.min(100, Math.max(1, Number(options.limit || 20)));
  const sortBy = options.sortBy || 'style_desc';
  const minStyle =
    typeof options.minStyleProficiency === 'number' && Number.isFinite(options.minStyleProficiency)
      ? options.minStyleProficiency
      : undefined;

  const filtered = MOCK_MANAGERS.filter((manager) => {
    if (options.q) {
      const q = normalize(options.q);
      const hit = [manager.name, manager.shortName, manager.team, manager.nationality]
        .filter(Boolean)
        .some((item) => normalize(item).includes(q));
      if (!hit) {
        return false;
      }
    }

    if (options.formation) {
      if (normalize(manager.formation) !== normalize(options.formation)) {
        return false;
      }
    }

    if (options.nationality) {
      const nation = normalize(options.nationality);
      if (!normalize(manager.nationality || '').includes(nation)) {
        return false;
      }
    }

    if (options.playstyle) {
      const key = options.playstyle as keyof Manager['playstyleProficiency'];
      const value = Number(manager.playstyleProficiency[key] || 0);
      if (value <= 0) {
        return false;
      }
    }

    if (typeof minStyle === 'number') {
      const styleValue = managerStyleValue(manager, options.playstyle);
      if (styleValue < minStyle) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'style_asc') {
      return managerStyleValue(a, options.playstyle) - managerStyleValue(b, options.playstyle);
    }
    if (sortBy === 'name_asc') {
      return a.name.localeCompare(b.name) || managerStyleValue(b, options.playstyle) - managerStyleValue(a, options.playstyle);
    }
    if (sortBy === 'name_desc') {
      return b.name.localeCompare(a.name) || managerStyleValue(b, options.playstyle) - managerStyleValue(a, options.playstyle);
    }
    if (sortBy === 'team_asc') {
      return a.team.localeCompare(b.team) || a.name.localeCompare(b.name);
    }
    if (sortBy === 'team_desc') {
      return b.team.localeCompare(a.team) || a.name.localeCompare(b.name);
    }
    if (sortBy === 'updated_desc') {
      const aTime = Date.parse(a.source?.scrapedAt || '');
      const bTime = Date.parse(b.source?.scrapedAt || '');
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    }
    return managerStyleValue(b, options.playstyle) - managerStyleValue(a, options.playstyle);
  });

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const data = filtered.slice(offset, offset + limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      source: 'mock' as const
    }
  };
}

export async function listPlayers(options: PlayerListOptions = {}) {
  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.min(100, Math.max(1, Number(options.limit || 24)));
  const sortBy = options.sortBy || 'overall_desc';
  const sort: Record<string, 1 | -1> =
    sortBy === 'overall_asc'
      ? { 'overall.max': 1, updatedAt: -1, name: 1 }
      : sortBy === 'name_asc'
        ? { name: 1, 'overall.max': -1, updatedAt: -1 }
        : sortBy === 'name_desc'
          ? { name: -1, 'overall.max': -1, updatedAt: -1 }
          : sortBy === 'updated_desc'
            ? { updatedAt: -1, 'overall.max': -1, name: 1 }
            : { 'overall.max': -1, updatedAt: -1, name: 1 };

  const playersCollection = await getCollection(PLAYERS_COLLECTION);
  if (playersCollection) {
    try {
      const conditions: Filter<Document>[] = [];
      const q = options.q?.trim();

      if (q) {
        const queryRegex = new RegExp(escapeRegex(q), 'i');
        conditions.push({
          $or: [{ name: queryRegex }, { shortName: queryRegex }, { club: queryRegex }]
        });
      }

      if (options.position?.trim()) {
        conditions.push({ positions: options.position.trim().toUpperCase() });
      }

      if (options.cardType?.trim()) {
        conditions.push({ cardType: toCaseInsensitiveExactRegex(options.cardType) });
      }

      if (options.nationality?.trim()) {
        conditions.push({ nationality: new RegExp(escapeRegex(options.nationality), 'i') });
      }

      if (options.club?.trim()) {
        conditions.push({ club: new RegExp(escapeRegex(options.club), 'i') });
      }

      if (options.foot?.trim()) {
        const footRegex = new RegExp(escapeRegex(options.foot), 'i');
        conditions.push({
          $or: [
            { 'bio.foot': footRegex },
            { foot: footRegex },
            { preferredFoot: footRegex },
            { strongFoot: footRegex }
          ]
        });
      }

      if (typeof options.minHeight === 'number' && Number.isFinite(options.minHeight)) {
        conditions.push({
          $or: [
            { 'bio.heightCm': { $gte: options.minHeight } },
            { heightCm: { $gte: options.minHeight } },
            { height: { $gte: options.minHeight } }
          ]
        });
      }

      if (typeof options.maxHeight === 'number' && Number.isFinite(options.maxHeight)) {
        conditions.push({
          $or: [
            { 'bio.heightCm': { $lte: options.maxHeight } },
            { heightCm: { $lte: options.maxHeight } },
            { height: { $lte: options.maxHeight } }
          ]
        });
      }

      if (options.playstyle?.trim()) {
        conditions.push({ playstyles: toCaseInsensitiveExactRegex(options.playstyle) });
      }

      if (typeof options.minOvr === 'number' && Number.isFinite(options.minOvr)) {
        conditions.push({
          $or: [{ 'overall.max': { $gte: options.minOvr } }, { overallMax: { $gte: options.minOvr } }]
        });
      }

      const filter =
        conditions.length === 0 ? {} : conditions.length === 1 ? conditions[0] : { $and: conditions };

      const [documents, total] = await Promise.all([
        playersCollection
          .find(filter)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray(),
        playersCollection.countDocuments(filter)
      ]);

      const data = documents.map(normalizePlayerDocument);
      const meta: ListMeta = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        source: 'mongo'
      };

      return { data, meta };
    } catch (error) {
      maybeLogMongoQueryError('listPlayers', error);
    }
  }

  return buildPlayerMockResponse(options);
}

export async function getPlayerById(idOrSlug: string): Promise<Player | null> {
  const target = String(idOrSlug || '').trim();
  if (!target) {
    return null;
  }

  const playersCollection = await getCollection(PLAYERS_COLLECTION);
  if (playersCollection) {
    try {
      const candidates: Filter<Document>[] = [{ efhubId: target }, { slug: target }];
      if (/^[a-f\d]{24}$/i.test(target)) {
        candidates.push({ _id: new ObjectId(target) });
      }
      const document = await playersCollection.findOne({ $or: candidates });
      return document ? normalizePlayerDocument(document) : null;
    } catch (error) {
      maybeLogMongoQueryError('getPlayerById', error);
    }
  }

  return (
    MOCK_PLAYERS.find((player) => player.efhubId === target || player.slug === target) || null
  );
}

export async function listManagers(options: ManagerListOptions = {}) {
  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.min(100, Math.max(1, Number(options.limit || 20)));
  const sortBy = options.sortBy || 'style_desc';
  const selectedStyle = options.playstyle?.trim() || 'quickCounter';
  const minStyle =
    typeof options.minStyleProficiency === 'number' && Number.isFinite(options.minStyleProficiency)
      ? options.minStyleProficiency
      : undefined;

  const sort: Record<string, 1 | -1> =
    sortBy === 'style_asc'
      ? { [`playstyleProficiency.${selectedStyle}`]: 1, updatedAt: -1, name: 1 }
      : sortBy === 'name_asc'
        ? { name: 1, [`playstyleProficiency.${selectedStyle}`]: -1, updatedAt: -1 }
        : sortBy === 'name_desc'
          ? { name: -1, [`playstyleProficiency.${selectedStyle}`]: -1, updatedAt: -1 }
          : sortBy === 'team_asc'
            ? { team: 1, name: 1, updatedAt: -1 }
            : sortBy === 'team_desc'
              ? { team: -1, name: 1, updatedAt: -1 }
              : sortBy === 'updated_desc'
                ? { updatedAt: -1, [`playstyleProficiency.${selectedStyle}`]: -1, name: 1 }
                : { [`playstyleProficiency.${selectedStyle}`]: -1, updatedAt: -1, name: 1 };

  const managersCollection = await getCollection(MANAGERS_COLLECTION);
  if (managersCollection) {
    try {
      const conditions: Filter<Document>[] = [];
      const q = options.q?.trim();

      if (q) {
        const queryRegex = new RegExp(escapeRegex(q), 'i');
        conditions.push({
          $or: [{ name: queryRegex }, { shortName: queryRegex }, { team: queryRegex }]
        });
      }

      if (options.formation?.trim()) {
        conditions.push({ formation: toCaseInsensitiveExactRegex(options.formation) });
      }

      if (options.nationality?.trim()) {
        conditions.push({ nationality: new RegExp(escapeRegex(options.nationality), 'i') });
      }

      if (options.playstyle?.trim()) {
        conditions.push({
          [`playstyleProficiency.${options.playstyle}`]: { $gte: 1 }
        });
      }

      if (typeof minStyle === 'number') {
        conditions.push({
          [`playstyleProficiency.${selectedStyle}`]: { $gte: minStyle }
        });
      }

      const filter =
        conditions.length === 0 ? {} : conditions.length === 1 ? conditions[0] : { $and: conditions };

      const [documents, total] = await Promise.all([
        managersCollection
          .find(filter)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray(),
        managersCollection.countDocuments(filter)
      ]);

      const data = documents.map(normalizeManagerDocument);
      const meta: ListMeta = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        source: 'mongo'
      };

      return { data, meta };
    } catch (error) {
      maybeLogMongoQueryError('listManagers', error);
    }
  }

  return buildManagerMockResponse(options);
}

export async function getManagerById(id: string): Promise<Manager | null> {
  const target = String(id || '').trim();
  if (!target) {
    return null;
  }

  const managersCollection = await getCollection(MANAGERS_COLLECTION);
  if (managersCollection) {
    try {
      const candidates: Filter<Document>[] = [{ efhubId: target }];
      if (/^[a-f\d]{24}$/i.test(target)) {
        candidates.push({ _id: new ObjectId(target) });
      }
      const document = await managersCollection.findOne({ $or: candidates });
      return document ? normalizeManagerDocument(document) : null;
    } catch (error) {
      maybeLogMongoQueryError('getManagerById', error);
    }
  }

  return MOCK_MANAGERS.find((manager) => manager.efhubId === target) || null;
}

export async function listPacks(options: PackListOptions = {}) {
  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.min(100, Math.max(1, Number(options.limit || 20)));

  const packsCollection = await getCollection(PACKS_COLLECTION);
  if (packsCollection) {
    try {
      const conditions: Filter<Document>[] = [];
      const q = options.q?.trim();

      if (q) {
        const queryRegex = new RegExp(escapeRegex(q), 'i');
        conditions.push({
          $or: [{ name: queryRegex }, { slug: queryRegex }, { type: queryRegex }]
        });
      }

      if (options.type?.trim()) {
        conditions.push({ type: toCaseInsensitiveExactRegex(options.type) });
      }

      const filter =
        conditions.length === 0 ? {} : conditions.length === 1 ? conditions[0] : { $and: conditions };

      const [documents, total] = await Promise.all([
        packsCollection
          .find(filter)
          .sort({ startsAt: -1, updatedAt: -1, name: 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray(),
        packsCollection.countDocuments(filter)
      ]);

      const data = documents.map(normalizePackDocument);
      const meta: ListMeta = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        source: 'mongo'
      };

      return { data, meta };
    } catch (error) {
      maybeLogMongoQueryError('listPacks', error);
    }
  }

  const filtered = MOCK_PACKS.filter((pack) => {
    if (options.q) {
      const q = normalize(options.q);
      const hit = [pack.name, pack.slug, pack.type]
        .filter(Boolean)
        .some((item) => normalize(item).includes(q));
      if (!hit) {
        return false;
      }
    }

    if (options.type && normalize(pack.type) !== normalize(options.type)) {
      return false;
    }

    return true;
  }).sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt));

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const data = filtered.slice(offset, offset + limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      source: 'mock' as const
    }
  };
}

export async function getPackById(idOrSlug: string): Promise<Pack | null> {
  const target = String(idOrSlug || '').trim();
  if (!target) {
    return null;
  }

  const packsCollection = await getCollection(PACKS_COLLECTION);
  if (packsCollection) {
    try {
      const candidates: Filter<Document>[] = [{ id: target }, { slug: target }];
      if (/^[a-f\d]{24}$/i.test(target)) {
        candidates.push({ _id: new ObjectId(target) });
      }
      const document = await packsCollection.findOne({ $or: candidates });
      return document ? normalizePackDocument(document) : null;
    } catch (error) {
      maybeLogMongoQueryError('getPackById', error);
    }
  }

  return MOCK_PACKS.find((pack) => pack.id === target || pack.slug === target) || null;
}

export async function listCommunityProfiles(options: CommunityListOptions = {}) {
  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.min(100, Math.max(1, Number(options.limit || 20)));
  const viewerId = normalizeViewerId(options.viewerId || '');
  const sortBy =
    options.sortBy && options.sortBy !== 'tab_default'
      ? options.sortBy
      : communitySortByTab(options.tab);

  const communityCollection = await getCollection(COMMUNITY_COLLECTION);
  if (communityCollection) {
    try {
      const followSets = viewerId
        ? await loadMongoCommunityFollowSets(viewerId)
        : { followingIds: new Set<string>(), followerIds: new Set<string>() };

      const conditions: Filter<Document>[] = [];
      const q = options.q?.trim();

      if (q) {
        const queryRegex = new RegExp(escapeRegex(q), 'i');
        conditions.push({
          $or: [{ username: queryRegex }, { displayName: queryRegex }, { country: queryRegex }]
        });
      }

      if (options.region?.trim()) {
        conditions.push({ region: toCaseInsensitiveExactRegex(options.region) });
      }

      if (options.country?.trim()) {
        conditions.push({ country: toCaseInsensitiveExactRegex(options.country) });
      }

      if (options.tab === 'following') {
        if (!viewerId || followSets.followingIds.size === 0) {
          return {
            data: [],
            meta: {
              page,
              limit,
              total: 0,
              totalPages: 1,
              source: 'mongo' as const
            }
          };
        }
        const relatedIds = [...followSets.followingIds];
        conditions.push({
          $or: [
            { id: { $in: relatedIds } },
            { profileId: { $in: relatedIds } },
            { efhubId: { $in: relatedIds } }
          ]
        });
      } else if (options.tab === 'followers') {
        if (!viewerId || followSets.followerIds.size === 0) {
          return {
            data: [],
            meta: {
              page,
              limit,
              total: 0,
              totalPages: 1,
              source: 'mongo' as const
            }
          };
        }
        const relatedIds = [...followSets.followerIds];
        conditions.push({
          $or: [
            { id: { $in: relatedIds } },
            { profileId: { $in: relatedIds } },
            { efhubId: { $in: relatedIds } }
          ]
        });
      }

      const filter =
        conditions.length === 0 ? {} : conditions.length === 1 ? conditions[0] : { $and: conditions };

      const sort: Record<string, 1 | -1> =
        sortBy === 'following_desc'
          ? { following: -1, updatedAt: -1, displayName: 1 }
          : sortBy === 'followers_desc'
            ? { followers: -1, updatedAt: -1, displayName: 1 }
            : sortBy === 'name_asc'
              ? { displayName: 1, followers: -1, updatedAt: -1 }
              : sortBy === 'name_desc'
                ? { displayName: -1, followers: -1, updatedAt: -1 }
                : { buildsCount: -1, updatedAt: -1, displayName: 1 };

      const [documents, total] = await Promise.all([
        communityCollection
          .find(filter)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray(),
        communityCollection.countDocuments(filter)
      ]);

      const data = applyCommunityFollowFlags(
        documents.map(normalizeCommunityProfileDocument),
        followSets.followingIds
      );
      const meta: ListMeta = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        source: 'mongo'
      };

      return { data, meta };
    } catch (error) {
      maybeLogMongoQueryError('listCommunityProfiles', error);
    }
  }

  const followSets = viewerId
    ? loadMockCommunityFollowSets(viewerId)
    : { followingIds: new Set<string>(), followerIds: new Set<string>() };

  let filtered = inMemoryCommunityProfiles.filter((profile) => {
    if (options.q) {
      const q = normalize(options.q);
      const hit = [profile.username, profile.displayName, profile.country]
        .filter(Boolean)
        .some((item) => normalize(item).includes(q));
      if (!hit) {
        return false;
      }
    }

    if (options.region && normalize(profile.region) !== normalize(options.region)) {
      return false;
    }

    if (options.country && normalize(profile.country) !== normalize(options.country)) {
      return false;
    }

    return true;
  });

  if (options.tab === 'following') {
    if (!viewerId || followSets.followingIds.size === 0) {
      filtered = [];
    } else {
      filtered = filtered.filter((profile) => followSets.followingIds.has(profile.id));
    }
  } else if (options.tab === 'followers') {
    if (!viewerId || followSets.followerIds.size === 0) {
      filtered = [];
    } else {
      filtered = filtered.filter((profile) => followSets.followerIds.has(profile.id));
    }
  }

  filtered = filtered.sort((a, b) => {
    if (sortBy === 'following_desc') {
      return b.following - a.following || b.followers - a.followers;
    }
    if (sortBy === 'followers_desc') {
      return b.followers - a.followers || b.buildsCount - a.buildsCount;
    }
    if (sortBy === 'name_asc') {
      return a.displayName.localeCompare(b.displayName) || b.followers - a.followers;
    }
    if (sortBy === 'name_desc') {
      return b.displayName.localeCompare(a.displayName) || b.followers - a.followers;
    }
    return b.buildsCount - a.buildsCount || b.followers - a.followers;
  });

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const data = applyCommunityFollowFlags(
    filtered.slice(offset, offset + limit).map((profile) => ({ ...profile })),
    followSets.followingIds
  );

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      source: 'mock' as const
    }
  };
}

export async function listLeagueTeams(options: LeagueListOptions = {}) {
  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.min(100, Math.max(1, Number(options.limit || 50)));
  const sortBy = options.sortBy || 'points_desc';

  const sort: Record<string, 1 | -1> =
    sortBy === 'points_asc'
      ? { points: 1, updatedAt: -1, name: 1 }
      : sortBy === 'members_desc'
        ? { members: -1, points: -1, updatedAt: -1 }
        : sortBy === 'members_asc'
          ? { members: 1, points: -1, updatedAt: -1 }
          : sortBy === 'updated_desc'
            ? { updatedAt: -1, points: -1, name: 1 }
            : sortBy === 'name_asc'
              ? { name: 1, points: -1, updatedAt: -1 }
              : sortBy === 'name_desc'
                ? { name: -1, points: -1, updatedAt: -1 }
                : { points: -1, updatedAt: -1, name: 1 };

  const leagueCollection = await getCollection(LEAGUE_COLLECTION);
  if (leagueCollection) {
    try {
      const conditions: Filter<Document>[] = [];
      const q = options.q?.trim();

      if (q) {
        const queryRegex = new RegExp(escapeRegex(q), 'i');
        conditions.push({
          $or: [{ name: queryRegex }, { id: queryRegex }, { teamId: queryRegex }]
        });
      }

      if (options.mode && options.mode !== 'all') {
        conditions.push({ mode: options.mode });
      }

      const filter: Filter<Document> =
        conditions.length === 0 ? {} : conditions.length === 1 ? conditions[0] : { $and: conditions };

      const [documents, total] = await Promise.all([
        leagueCollection
          .find(filter)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray(),
        leagueCollection.countDocuments(filter)
      ]);

      const data = documents.map(normalizeLeagueTeamDocument);
      const meta: ListMeta = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        source: 'mongo'
      };

      return { data, meta };
    } catch (error) {
      maybeLogMongoQueryError('listLeagueTeams', error);
    }
  }

  const filtered = MOCK_LEAGUE_TEAMS.filter((team) => {
    if (options.q) {
      const q = normalize(options.q);
      const hit = [team.name, team.id].filter(Boolean).some((item) => normalize(item).includes(q));
      if (!hit) {
        return false;
      }
    }

    if (!options.mode || options.mode === 'all') {
      return true;
    }
    return team.mode === options.mode;
  }).sort((a, b) => {
    if (sortBy === 'points_asc') {
      return a.points - b.points || a.name.localeCompare(b.name);
    }
    if (sortBy === 'members_desc') {
      return b.members - a.members || b.points - a.points;
    }
    if (sortBy === 'members_asc') {
      return a.members - b.members || b.points - a.points;
    }
    if (sortBy === 'updated_desc') {
      const aTime = Date.parse(a.updatedAt || '');
      const bTime = Date.parse(b.updatedAt || '');
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    }
    if (sortBy === 'name_asc') {
      return a.name.localeCompare(b.name) || b.points - a.points;
    }
    if (sortBy === 'name_desc') {
      return b.name.localeCompare(a.name) || b.points - a.points;
    }
    return b.points - a.points || a.name.localeCompare(b.name);
  });

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const data = filtered
    .slice(offset, offset + limit)
    .map((team) => enrichLeagueTeamTrend({ ...team }));

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      source: 'mock' as const
    }
  };
}

export async function getPlayersByIds(ids: string[]): Promise<Player[]> {
  const normalizedIds = ids.map((id) => String(id || '').trim()).filter(Boolean);
  if (normalizedIds.length === 0) {
    return [];
  }

  const playersCollection = await getCollection(PLAYERS_COLLECTION);
  if (playersCollection) {
    try {
      const documents = await playersCollection
        .find({
          $or: [{ efhubId: { $in: normalizedIds } }, { slug: { $in: normalizedIds } }]
        })
        .toArray();

      const mapped = documents.map(normalizePlayerDocument);
      const byAnyId = new Map<string, Player>();
      mapped.forEach((player) => {
        byAnyId.set(player.efhubId, player);
        byAnyId.set(player.slug, player);
      });

      return normalizedIds.map((id) => byAnyId.get(id)).filter((player): player is Player => Boolean(player));
    } catch (error) {
      maybeLogMongoQueryError('getPlayersByIds', error);
    }
  }

  const wanted = new Set(normalizedIds);
  return MOCK_PLAYERS.filter((player) => wanted.has(player.efhubId) || wanted.has(player.slug));
}

export async function getCommunityProfileById(
  id: string,
  options: { viewerId?: string } = {}
): Promise<CommunityProfile | null> {
  const target = String(id || '').trim();
  if (!target) {
    return null;
  }
  const viewerId = normalizeViewerId(options.viewerId || '');

  const communityCollection = await getCollection(COMMUNITY_COLLECTION);
  if (communityCollection) {
    try {
      const candidates: Filter<Document>[] = [{ id: target }, { username: target }];
      if (/^[a-f\d]{24}$/i.test(target)) {
        candidates.push({ _id: new ObjectId(target) });
      }

      const document = await communityCollection.findOne({ $or: candidates });
      if (!document) {
        return null;
      }
      const profile = normalizeCommunityProfileDocument(document);
      if (!viewerId) {
        return profile;
      }

      const followSets = await loadMongoCommunityFollowSets(viewerId);
      return {
        ...profile,
        isFollowing: followSets.followingIds.has(profile.id)
      };
    } catch (error) {
      maybeLogMongoQueryError('getCommunityProfileById', error);
    }
  }

  const profile =
    inMemoryCommunityProfiles.find((item) => item.id === target || item.username === target) || null;
  if (!profile) {
    return null;
  }

  if (!viewerId) {
    return { ...profile };
  }

  const followSets = loadMockCommunityFollowSets(viewerId);
  return {
    ...profile,
    isFollowing: followSets.followingIds.has(profile.id)
  };
}

export async function setCommunityFollowState(
  input: CommunityFollowMutationInput
): Promise<CommunityFollowMutationResult | null> {
  const viewerId = normalizeViewerId(input.viewerId);
  const profileId = String(input.profileId || '').trim();
  if (!viewerId || !profileId || viewerId === profileId) {
    return null;
  }
  const targetProfile = await getCommunityProfileById(profileId, { viewerId });
  if (!targetProfile) {
    return null;
  }

  const followsCollection = await getCollection(COMMUNITY_FOLLOWS_COLLECTION);
  const communityCollection = await getCollection(COMMUNITY_COLLECTION);

  if (followsCollection && communityCollection) {
    try {
      const pairFilter = { followerId: viewerId, followingId: profileId };
      const now = new Date();
      let changed = false;

      if (input.follow) {
        const upsertResult = await followsCollection.updateOne(
          pairFilter,
          {
            $setOnInsert: {
              followerId: viewerId,
              followingId: profileId,
              createdAt: now
            },
            $set: {
              updatedAt: now
            }
          },
          { upsert: true }
        );

        changed = upsertResult.upsertedCount > 0;
      } else {
        const deleteResult = await followsCollection.deleteOne(pairFilter);
        changed = deleteResult.deletedCount > 0;
      }

      // Reconcile counters from the pairs collection (source of truth) instead
      // of using $inc. This avoids race conditions where a crash between the
      // upsert/delete and the $inc would leave the counter permanently drifted,
      // and makes the state self-healing on each mutation.
      if (changed) {
        const [actualFollowers, actualFollowing] = await Promise.all([
          followsCollection.countDocuments({ followingId: profileId }),
          followsCollection.countDocuments({ followerId: viewerId })
        ]);

        await Promise.all([
          communityCollection.updateOne(
            { id: profileId },
            { $set: { followers: actualFollowers, updatedAt: now } }
          ),
          communityCollection.updateOne(
            { id: viewerId },
            { $set: { following: actualFollowing, updatedAt: now } }
          )
        ]);
      }

      return {
        profile: await getCommunityProfileById(profileId, { viewerId }),
        changed
      };
    } catch (error) {
      maybeLogMongoQueryError('setCommunityFollowState', error);
    }
  }

  const pairKey = buildCommunityFollowPairKey(viewerId, profileId);
  const hadPair = inMemoryCommunityFollowPairs.has(pairKey);
  let changed = false;

  if (input.follow) {
    if (!hadPair) {
      inMemoryCommunityFollowPairs.add(pairKey);
      updateMockCommunityCounters(viewerId, profileId, 1);
      changed = true;
    }
  } else if (hadPair) {
    inMemoryCommunityFollowPairs.delete(pairKey);
    updateMockCommunityCounters(viewerId, profileId, -1);
    changed = true;
  }

  return {
    profile: await getCommunityProfileById(profileId, { viewerId }),
    changed
  };
}

export async function getLeagueTeamById(id: string): Promise<LeagueTeam | null> {
  const target = String(id || '').trim();
  if (!target) {
    return null;
  }

  const leagueCollection = await getCollection(LEAGUE_COLLECTION);
  if (leagueCollection) {
    try {
      const candidates: Filter<Document>[] = [{ id: target }, { teamId: target }, { efhubId: target }];
      if (/^[a-f\d]{24}$/i.test(target)) {
        candidates.push({ _id: new ObjectId(target) });
      }

      const document = await leagueCollection.findOne({ $or: candidates });
      return document ? normalizeLeagueTeamDocument(document) : null;
    } catch (error) {
      maybeLogMongoQueryError('getLeagueTeamById', error);
    }
  }

  const item = MOCK_LEAGUE_TEAMS.find((team) => team.id === target);
  return item ? enrichLeagueTeamTrend({ ...item }) : null;
}

export async function listPlayerBuilds(options: PlayerBuildListOptions) {
  const playerId = String(options.playerId || '').trim();
  if (!playerId) {
    return {
      data: [],
      meta: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1,
        source: 'mock' as const
      }
    };
  }

  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.min(100, Math.max(1, Number(options.limit || 20)));
  const scope = options.scope || 'community';
  const authorId = String(options.authorId || '').trim();
  if (scope === 'mine' && !authorId) {
    return {
      data: [],
      meta: {
        page,
        limit,
        total: 0,
        totalPages: 1,
        source: 'mock' as const
      }
    };
  }

  const playerBuildsCollection = await getCollection(PLAYER_BUILDS_COLLECTION);
  if (playerBuildsCollection) {
    try {
      const conditions: Filter<Document>[] = [{ playerId }];

      if (scope === 'community') {
        conditions.push({ visibility: 'public' });
      } else if (scope === 'mine' && authorId) {
        conditions.push({ authorId });
      }

      const filter =
        conditions.length === 0 ? {} : conditions.length === 1 ? conditions[0] : { $and: conditions };
      const sort: Record<string, 1 | -1> =
        scope === 'mine' ? { updatedAt: -1, createdAt: -1 } : { likes: -1, updatedAt: -1, createdAt: -1 };

      const [documents, total] = await Promise.all([
        playerBuildsCollection
          .find(filter)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray(),
        playerBuildsCollection.countDocuments(filter)
      ]);

      return {
        data: documents.map(normalizePlayerBuildDocument),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          source: 'mongo' as const
        }
      };
    } catch (error) {
      maybeLogMongoQueryError('listPlayerBuilds', error);
    }
  }

  const filtered = inMemoryPlayerBuilds
    .filter((item) => item.playerId === playerId)
    .filter((item) => {
      if (scope === 'community') {
        return item.visibility === 'public';
      }
      if (scope === 'mine' && authorId) {
        return item.authorId === authorId;
      }
      return true;
    })
    .sort((a, b) => {
      if (scope === 'mine') {
        return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
      }
      if (b.likes !== a.likes) {
        return b.likes - a.likes;
      }
      return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    });

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const data = filtered.slice(offset, offset + limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      source: 'mock' as const
    }
  };
}

export async function createPlayerBuild(input: CreatePlayerBuildInput): Promise<PlayerBuild | null> {
  const playerId = String(input.playerId || '').trim();
  if (!playerId) {
    return null;
  }

  const name = toStringValue(input.name, 'Build');
  const level = clamp(Math.round(toNumberValue(input.level, 1)), 1, 150);
  const condition = ['A', 'B', 'C', 'D', 'E'].includes(toStringValue(input.condition, 'C').toUpperCase())
    ? toStringValue(input.condition, 'C').toUpperCase()
    : 'C';
  const allocations = normalizeBuildAllocations(input.allocations);
  const pointsUsed =
    typeof input.pointsUsed === 'number' && Number.isFinite(input.pointsUsed)
      ? Math.max(0, Math.round(input.pointsUsed))
      : Object.values(allocations).reduce((sum, value) => sum + Math.max(0, Number(value || 0)), 0);

  const now = new Date();
  const id = `build_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`;
  const visibility = normalizeBuildVisibility(input.visibility);
  const authorId = toStringValue(input.authorId, 'guest');
  const authorName = toStringValue(input.authorName, 'Anonymous');
  const authorCountry = toStringValue(input.authorCountry) || undefined;
  const source = normalizeBuildSource(input.source);

  const doc = {
    id,
    playerId,
    name,
    level,
    condition,
    allocations,
    pointsUsed,
    likes: 0,
    visibility,
    authorId,
    authorName,
    authorCountry,
    source,
    createdAt: now,
    updatedAt: now
  };

  const playerBuildsCollection = await getCollection(PLAYER_BUILDS_COLLECTION);
  if (playerBuildsCollection) {
    try {
      await playerBuildsCollection.insertOne(doc);
      return normalizePlayerBuildDocument(doc);
    } catch (error) {
      maybeLogMongoQueryError('createPlayerBuild', error);
    }
  }

  const fallback = normalizePlayerBuildDocument(doc);
  inMemoryPlayerBuilds.unshift(fallback);
  return fallback;
}

export async function updatePlayerBuild(
  input: UpdatePlayerBuildInput
): Promise<PlayerBuild | null> {
  const playerId = String(input.playerId || '').trim();
  const buildId = String(input.buildId || '').trim();
  const authorId = String(input.authorId || '').trim();

  if (!playerId || !buildId || !authorId) {
    return null;
  }

  const updateDoc: Record<string, unknown> = {
    updatedAt: new Date()
  };

  if (typeof input.name === 'string') {
    updateDoc.name = toStringValue(input.name, 'Build');
  }
  if (typeof input.level === 'number' && Number.isFinite(input.level)) {
    updateDoc.level = clamp(Math.round(input.level), 1, 150);
  }
  if (typeof input.condition === 'string') {
    const nextCondition = toStringValue(input.condition, 'C').toUpperCase();
    updateDoc.condition = ['A', 'B', 'C', 'D', 'E'].includes(nextCondition) ? nextCondition : 'C';
  }
  if (input.allocations && typeof input.allocations === 'object') {
    const allocations = normalizeBuildAllocations(input.allocations);
    updateDoc.allocations = allocations;
    updateDoc.pointsUsed =
      typeof input.pointsUsed === 'number' && Number.isFinite(input.pointsUsed)
        ? Math.max(0, Math.round(input.pointsUsed))
        : Object.values(allocations).reduce(
            (sum, value) => sum + Math.max(0, Number(value || 0)),
            0
          );
  } else if (typeof input.pointsUsed === 'number' && Number.isFinite(input.pointsUsed)) {
    updateDoc.pointsUsed = Math.max(0, Math.round(input.pointsUsed));
  }
  if (typeof input.visibility === 'string') {
    updateDoc.visibility = normalizeBuildVisibility(input.visibility);
  }

  const playerBuildsCollection = await getCollection(PLAYER_BUILDS_COLLECTION);
  if (playerBuildsCollection) {
    try {
      const result = await playerBuildsCollection.findOneAndUpdate(
        {
          id: buildId,
          playerId,
          authorId
        },
        {
          $set: updateDoc
        },
        {
          returnDocument: 'after'
        }
      );

      return result ? normalizePlayerBuildDocument(result) : null;
    } catch (error) {
      maybeLogMongoQueryError('updatePlayerBuild', error);
    }
  }

  const index = inMemoryPlayerBuilds.findIndex(
    (item) => item.id === buildId && item.playerId === playerId && item.authorId === authorId
  );
  if (index < 0) {
    return null;
  }

  const next = normalizePlayerBuildDocument({
    ...inMemoryPlayerBuilds[index],
    ...updateDoc
  });
  inMemoryPlayerBuilds[index] = next;
  return next;
}

export async function deletePlayerBuild(input: DeletePlayerBuildInput): Promise<boolean> {
  const playerId = String(input.playerId || '').trim();
  const buildId = String(input.buildId || '').trim();
  const authorId = String(input.authorId || '').trim();

  if (!playerId || !buildId || !authorId) {
    return false;
  }

  const playerBuildsCollection = await getCollection(PLAYER_BUILDS_COLLECTION);
  if (playerBuildsCollection) {
    try {
      const result = await playerBuildsCollection.deleteOne({
        id: buildId,
        playerId,
        authorId
      });
      return result.deletedCount > 0;
    } catch (error) {
      maybeLogMongoQueryError('deletePlayerBuild', error);
    }
  }

  const index = inMemoryPlayerBuilds.findIndex(
    (item) => item.id === buildId && item.playerId === playerId && item.authorId === authorId
  );
  if (index < 0) {
    return false;
  }
  inMemoryPlayerBuilds.splice(index, 1);
  return true;
}

export async function getDataSourceStatus(): Promise<DataSourceStatus> {
  if (!isMongoConfigured()) {
    return {
      connected: false,
      mode: 'mock',
      database: null,
      collections: null,
      error: null
    };
  }

  const db = await getMongoDatabase();
  if (!db) {
    return {
      connected: false,
      mode: 'mock',
      database: null,
      collections: null,
      error: 'Không thể kết nối MongoDB. API đang fallback sang mock data.'
    };
  }

  try {
    const [
      playersCount,
      managersCount,
      packsCount,
      communityCount,
      leagueCount,
      playerBuildsCount,
      communityFollowsCount
    ] = await Promise.all([
      db
        .collection(PLAYERS_COLLECTION)
        .estimatedDocumentCount()
        .catch(() => 0),
      db
        .collection(MANAGERS_COLLECTION)
        .estimatedDocumentCount()
        .catch(() => 0),
      db
        .collection(PACKS_COLLECTION)
        .estimatedDocumentCount()
        .catch(() => 0),
      db
        .collection(COMMUNITY_COLLECTION)
        .estimatedDocumentCount()
        .catch(() => 0),
      db
        .collection(LEAGUE_COLLECTION)
        .estimatedDocumentCount()
        .catch(() => 0),
      db
        .collection(PLAYER_BUILDS_COLLECTION)
        .estimatedDocumentCount()
        .catch(() => 0),
      db
        .collection(COMMUNITY_FOLLOWS_COLLECTION)
        .estimatedDocumentCount()
        .catch(() => 0)
    ]);

    return {
      connected: true,
      mode: 'mongo',
      database: db.databaseName,
      collections: {
        players: playersCount,
        managers: managersCount,
        packs: packsCount,
        communityProfiles: communityCount,
        leagueRankings: leagueCount,
        playerBuilds: playerBuildsCount,
        communityFollows: communityFollowsCount
      },
      error: null
    };
  } catch (error) {
    maybeLogMongoQueryError('getDataSourceStatus', error);
    return {
      connected: false,
      mode: 'mock',
      database: db.databaseName,
      collections: null,
      error: 'Không đọc được thống kê collection từ MongoDB.'
    };
  }
}
