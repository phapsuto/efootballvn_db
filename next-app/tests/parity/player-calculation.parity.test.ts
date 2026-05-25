import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  calculatePlayerProjection,
  emptyBuildAllocations,
  encodeBuildAllocations,
  generateBuildPreset,
  PARITY_FORMULA_VERSION
} from '../../lib/gameplay/player-calculation';
import { calculateLineupMetrics } from '../../lib/gameplay/lineup-metrics';
import type { BuildCategory, Manager, Player } from '../../types/domain';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const SNAPSHOT_FILE = path.resolve(
  ROOT_DIR,
  'tests/parity/snapshots/player-calculation.parity.snapshot.json'
);

const REAL_DATA_DIRS = [
  path.resolve(ROOT_DIR, '../scraped-output'),
  path.resolve(ROOT_DIR, 'scraped-output')
];
const DEFAULT_PARITY_PLAYER_LIMIT = 12;
const DEFAULT_MIN_REAL_PLAYERS = 1;
const DEFAULT_SCAN_MAX_DEPTH = 5;
const DEFAULT_SCAN_MAX_FILES = 3000;

const TEST_MANAGERS: Manager[] = [
  {
    efhubId: 'mgr-parity-001',
    name: 'G. Zeitzler',
    shortName: 'G. Zeitzler',
    nationality: 'Germany',
    team: 'Liverpool R',
    formation: '4-3-3',
    playstyleProficiency: {
      quickCounter: 87,
      possessionGame: 78,
      longBallCounter: 71,
      outWide: 65,
      longBall: 59
    },
    affinity: { attack: 86, midfield: 80, defense: 74 },
    imageUrl: '',
    source: { site: 'test', managerUrl: '', scrapedAt: '2026-04-15T00:00:00.000Z' }
  },
  {
    efhubId: 'mgr-parity-002',
    name: 'L. Roman',
    shortName: 'L. Roman',
    nationality: 'Spain',
    team: 'Man Blue',
    formation: '4-2-3-1',
    playstyleProficiency: {
      quickCounter: 74,
      possessionGame: 88,
      longBallCounter: 68,
      outWide: 80,
      longBall: 62
    },
    affinity: { attack: 82, midfield: 88, defense: 70 },
    imageUrl: '',
    source: { site: 'test', managerUrl: '', scrapedAt: '2026-04-15T00:00:00.000Z' }
  }
];

const STAT_ALIASES: Record<string, string> = {
  goalkeeping: 'gkAwareness',
  gkawareness: 'gkAwareness',
  gkcatching: 'gkCatching',
  gkclearing: 'gkClearing',
  gkreflexes: 'gkReflexes',
  gkreach: 'gkReach',
  attackingprowess: 'offensiveAwareness',
  offensiveawareness: 'offensiveAwareness',
  defensiveawareness: 'defensiveAwareness',
  defensiveengagement: 'trackingBack',
  trackingback: 'trackingBack',
  ballwinning: 'ballWinning',
  lowpass: 'lowPass',
  loftedpass: 'loftedPass',
  tightpossession: 'tightPossession',
  setpiecetaking: 'setPieceTaking',
  kickingpower: 'kickingPower',
  physical: 'physicalContact',
  physicalcontact: 'physicalContact'
};

function toStringValue(value: unknown, fallback = '') {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
}

function toNumberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readPositiveIntegerEnv(name: string, fallback: number) {
  const parsed = Number.parseInt(toStringValue(process.env[name]), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

const PARITY_PLAYER_LIMIT = readPositiveIntegerEnv(
  'EFVN_PARITY_MAX_PLAYERS',
  DEFAULT_PARITY_PLAYER_LIMIT
);
const PARITY_MIN_REAL_PLAYERS = readPositiveIntegerEnv(
  'EFVN_PARITY_MIN_PLAYERS',
  DEFAULT_MIN_REAL_PLAYERS
);
const PARITY_SCAN_MAX_DEPTH = readPositiveIntegerEnv(
  'EFVN_PARITY_SCAN_MAX_DEPTH',
  DEFAULT_SCAN_MAX_DEPTH
);
const PARITY_SCAN_MAX_FILES = readPositiveIntegerEnv(
  'EFVN_PARITY_SCAN_MAX_FILES',
  DEFAULT_SCAN_MAX_FILES
);

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeCondition(value: unknown) {
  const upper = toStringValue(value, 'C').toUpperCase();
  return ['A', 'B', 'C', 'D', 'E'].includes(upper) ? upper : 'C';
}

function canonicalStatKey(rawKey: string) {
  const compact = rawKey.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const alias = STAT_ALIASES[compact];
  if (alias) {
    return alias;
  }

  const trimmed = rawKey.trim();
  if (!trimmed) {
    return '';
  }

  const tokens = trimmed.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (tokens.length === 0) {
    return '';
  }

  const [first, ...rest] = tokens;
  return `${first[0]?.toLowerCase() || ''}${first.slice(1)}${rest
    .map((token) => `${token[0]?.toUpperCase() || ''}${token.slice(1)}`)
    .join('')}`;
}

function normalizeStatsRecord(input: unknown) {
  const source =
    input && typeof input === 'object' && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  const output: Record<string, number> = {};

  Object.entries(source).forEach(([rawKey, rawValue]) => {
    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) {
      return;
    }
    const key = canonicalStatKey(rawKey);
    if (!key) {
      return;
    }
    output[key] = clamp(Math.round(numeric), 0, 120);
  });

  return output;
}

function normalizePerLevel(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => {
      const source =
        item && typeof item === 'object' && !Array.isArray(item)
          ? (item as Record<string, unknown>)
          : {};
      const level = Math.max(1, Math.round(toNumberValue(source.level, 1)));
      const stats = normalizeStatsRecord(source.stats);
      const overall = toNumberValue(source.overall, NaN);

      const normalized: { level: number; stats: Record<string, number>; overall?: number } = {
        level,
        stats
      };
      if (Number.isFinite(overall)) {
        normalized.overall = clamp(Math.round(overall), 1, 120);
      }
      return normalized;
    })
    .filter((entry) => Object.keys(entry.stats).length > 0)
    .sort((a, b) => a.level - b.level);
}

function normalizeRawPlayer(raw: unknown): Player | null {
  const source =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  if (!source) {
    return null;
  }

  const efhubId = toStringValue(source.efhubId) || toStringValue(source.id) || toStringValue(source.playerId);
  if (!efhubId) {
    return null;
  }

  const statsSource =
    source.stats && typeof source.stats === 'object' && !Array.isArray(source.stats)
      ? (source.stats as Record<string, unknown>)
      : {};
  const overallSource =
    source.overall && typeof source.overall === 'object' && !Array.isArray(source.overall)
      ? (source.overall as Record<string, unknown>)
      : {};
  const levelsSource =
    source.levels && typeof source.levels === 'object' && !Array.isArray(source.levels)
      ? (source.levels as Record<string, unknown>)
      : {};
  const conditionSource =
    source.condition && typeof source.condition === 'object' && !Array.isArray(source.condition)
      ? (source.condition as Record<string, unknown>)
      : {};
  const buildSource =
    source.build && typeof source.build === 'object' && !Array.isArray(source.build)
      ? (source.build as Record<string, unknown>)
      : {};
  const imageSource =
    source.images && typeof source.images === 'object' && !Array.isArray(source.images)
      ? (source.images as Record<string, unknown>)
      : {};
  const sourceMeta =
    source.source && typeof source.source === 'object' && !Array.isArray(source.source)
      ? (source.source as Record<string, unknown>)
      : {};

  const maxLevelStats = normalizeStatsRecord(statsSource.maxLevel);
  let level1Stats = normalizeStatsRecord(statsSource.level1);
  if (Object.keys(level1Stats).length === 0) {
    level1Stats = { ...maxLevelStats };
  }
  const perLevel = normalizePerLevel(statsSource.perLevel);

  const levelsMax = Math.max(
    1,
    Math.round(toNumberValue(levelsSource.max, perLevel[perLevel.length - 1]?.level || 1))
  );
  const levelsCurrent = clamp(Math.round(toNumberValue(levelsSource.current, 1)), 1, levelsMax);

  const overallBase = clamp(Math.round(toNumberValue(overallSource.base, 60)), 1, 120);
  const overallMax = clamp(
    Math.max(overallBase, Math.round(toNumberValue(overallSource.max, overallBase))),
    1,
    120
  );

  const positions = Array.isArray(source.positions)
    ? source.positions.map((item) => toStringValue(item).toUpperCase()).filter(Boolean)
    : [];
  const normalizedPositions = positions.length > 0 ? Array.from(new Set(positions)) : ['CF'];

  const positionRatingsSource =
    source.positionRatings &&
    typeof source.positionRatings === 'object' &&
    !Array.isArray(source.positionRatings)
      ? (source.positionRatings as Record<string, unknown>)
      : {};
  const positionRatings: Record<string, number> = {};
  Object.entries(positionRatingsSource).forEach(([key, value]) => {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      positionRatings[toStringValue(key)] = clamp(Math.round(numeric), 40, 120);
    }
  });
  if (Object.keys(positionRatings).length === 0) {
    normalizedPositions.forEach((position) => {
      positionRatings[position] = 80;
    });
  }

  const pointsCapRaw = Math.max(0, Math.round(toNumberValue(buildSource.pointsCap, 0)));
  const pointsCap = pointsCapRaw > 0 ? pointsCapRaw : Math.max(0, (levelsMax - 1) * 2);

  return {
    efhubId,
    slug: toStringValue(source.slug, efhubId),
    name: toStringValue(source.name, `Player ${efhubId}`),
    shortName: toStringValue(source.shortName, toStringValue(source.name, `Player ${efhubId}`)),
    nationality: toStringValue(source.nationality, 'Unknown'),
    club: toStringValue(source.club, 'Unknown Club'),
    league: toStringValue(source.league, 'Unknown League'),
    positions: normalizedPositions,
    cardType: toStringValue(source.cardType, 'Unknown'),
    rarity: toStringValue(source.rarity, toStringValue(source.cardType, 'Unknown')),
    overall: {
      base: overallBase,
      max: overallMax
    },
    levels: {
      current: levelsCurrent,
      max: levelsMax
    },
    stats: {
      level1: level1Stats,
      maxLevel: maxLevelStats,
      perLevel
    },
    skills: Array.isArray(source.skills) ? source.skills.map((item) => toStringValue(item)).filter(Boolean) : [],
    playstyles: Array.isArray(source.playstyles)
      ? source.playstyles.map((item) => toStringValue(item)).filter(Boolean)
      : [],
    condition: {
      form: normalizeCondition(conditionSource.form),
      injuryResistance: clamp(Math.round(toNumberValue(conditionSource.injuryResistance, 2)), 1, 3)
    },
    build: {
      pointsCap
    },
    positionRatings,
    images: {
      card: toStringValue(imageSource.card, 'https://placehold.co/300x400/png?text=Card'),
      portrait: toStringValue(imageSource.portrait, toStringValue(imageSource.card, '')),
      thumbnail: toStringValue(imageSource.thumbnail, toStringValue(imageSource.card, ''))
    },
    source: {
      site: toStringValue(sourceMeta.site, 'efhub.com'),
      playerUrl: toStringValue(sourceMeta.playerUrl),
      scrapedAt: toStringValue(sourceMeta.scrapedAt, new Date().toISOString())
    },
    bio: {
      age: Math.round(toNumberValue((source as Record<string, unknown>).age, NaN)),
      heightCm: Math.round(toNumberValue((source as Record<string, unknown>).heightCm, NaN)),
      weightKg: Math.round(toNumberValue((source as Record<string, unknown>).weightKg, NaN)),
      foot: toStringValue((source as Record<string, unknown>).foot)
    },
    extra: {
      additionalSkills: [],
      comPlayingStyles: [],
      playerModel: {},
      physics: {},
      otherStats: {}
    }
  };
}

function extractPlayersFromJson(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === 'object') {
    const objectPayload = payload as Record<string, unknown>;
    if (Array.isArray(objectPayload.players)) {
      return objectPayload.players;
    }
    if (Array.isArray(objectPayload.data)) {
      return objectPayload.data;
    }
  }
  return [];
}

async function fileExists(target: string) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function listJsonFilesFromDir(
  dir: string,
  maxDepth = PARITY_SCAN_MAX_DEPTH,
  maxFiles = PARITY_SCAN_MAX_FILES
) {
  if (!(await fileExists(dir))) {
    return [];
  }

  const files: string[] = [];
  const queue: Array<{ directory: string; depth: number }> = [{ directory: dir, depth: 0 }];

  while (queue.length > 0 && files.length < maxFiles) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    let entries: Array<import('node:fs').Dirent> = [];
    try {
      entries = await fs.readdir(current.directory, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const absolute = path.resolve(current.directory, entry.name);
      if (entry.isFile() && entry.name.toLowerCase().endsWith('.json')) {
        files.push(absolute);
        if (files.length >= maxFiles) {
          break;
        }
        continue;
      }

      if (entry.isDirectory() && current.depth < maxDepth) {
        queue.push({ directory: absolute, depth: current.depth + 1 });
      }
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function isStableParityDataFile(filePath: string) {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  const baseName = path.basename(normalized);

  if (normalized.includes('/status/')) {
    return false;
  }

  if (normalized.includes('/bootstrap/')) {
    return false;
  }

  if (baseName.endsWith('.latest.json')) {
    return false;
  }

  if (baseName.endsWith('.seed.json')) {
    return false;
  }

  return true;
}

async function collectRealDataFiles() {
  const envFiles = toStringValue(process.env.EFVN_PARITY_PLAYERS_JSON)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => path.resolve(process.cwd(), item));

  const directoryFiles = (
    await Promise.all(REAL_DATA_DIRS.map((dir) => listJsonFilesFromDir(dir)))
  )
    .flat()
    .filter((filePath) => isStableParityDataFile(filePath));

  return Array.from(new Set([...envFiles, ...directoryFiles])).sort();
}

async function loadRealPlayers() {
  const files = await collectRealDataFiles();
  const players: Player[] = [];
  const usedFiles = new Set<string>();

  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    const extracted = extractPlayersFromJson(parsed);
    if (extracted.length > 0) {
      usedFiles.add(file);
    }
    extracted.forEach((item) => {
      const player = normalizeRawPlayer(item);
      if (player) {
        players.push(player);
      }
    });
  }

  const deduped = new Map<string, Player>();
  players.forEach((player) => {
    if (!deduped.has(player.efhubId)) {
      deduped.set(player.efhubId, player);
    }
  });

  return {
    files: Array.from(usedFiles).sort(),
    players: Array.from(deduped.values()).slice(0, PARITY_PLAYER_LIMIT)
  };
}

function assertEnoughRealPlayers(playerCount: number, context: string) {
  assert.ok(
    playerCount >= PARITY_MIN_REAL_PLAYERS,
    `${context} Cần ít nhất ${PARITY_MIN_REAL_PLAYERS} player thật, hiện tại chỉ có ${playerCount}.`
  );
}

function selectKeyStats(player: Player, stats: Record<string, number>) {
  const primary = String(player.positions[0] || '').toUpperCase();
  const keys =
    primary === 'GK'
      ? ['gkAwareness', 'gkReflexes', 'gkCatching', 'gkReach', 'gkClearing']
      : ['offensiveAwareness', 'finishing', 'speed', 'acceleration', 'ballControl', 'dribbling', 'lowPass', 'defensiveAwareness'];

  const output: Record<string, number> = {};
  keys.forEach((key) => {
    const value = Number(stats[key]);
    if (Number.isFinite(value)) {
      output[key] = value;
    }
  });

  if (Object.keys(output).length === 0) {
    Object.keys(stats)
      .sort()
      .slice(0, 8)
      .forEach((key) => {
        output[key] = Number(stats[key] || 0);
      });
  }

  return output;
}

function scenarioAllocations(player: Player, preset: 'none' | 'smart' | 'attack') {
  if (preset === 'none') {
    return emptyBuildAllocations();
  }
  return generateBuildPreset(player, preset, player.build.pointsCap);
}

function scenarioLevel(player: Player, mode: 'min' | 'mid' | 'max') {
  if (mode === 'min') {
    return 1;
  }
  if (mode === 'max') {
    return Math.max(1, player.levels.max);
  }
  return Math.max(1, Math.ceil(player.levels.max / 2));
}

async function buildSnapshotPayload() {
  const { files, players } = await loadRealPlayers();

  const scenarios = [
    { name: 'lv_min_cond_c_no_build_no_manager', level: 'min', condition: 'C', preset: 'none', manager: null as Manager | null },
    { name: 'lv_mid_cond_a_smart_no_manager', level: 'mid', condition: 'A', preset: 'smart', manager: null as Manager | null },
    { name: 'lv_max_cond_c_smart_mgr_quick_counter', level: 'max', condition: 'C', preset: 'smart', manager: TEST_MANAGERS[0] as Manager | null },
    { name: 'lv_max_cond_e_attack_mgr_possession', level: 'max', condition: 'E', preset: 'attack', manager: TEST_MANAGERS[1] as Manager | null }
  ] as const;

  const cases = players.flatMap((player) =>
    scenarios.map((scenario) => {
      const level = scenarioLevel(player, scenario.level);
      const allocations = scenarioAllocations(player, scenario.preset);
      const result = calculatePlayerProjection({
        player,
        level,
        condition: scenario.condition,
        allocations,
        manager: scenario.manager
      });

      return {
        id: `${player.efhubId}__${scenario.name}`,
        player: {
          efhubId: player.efhubId,
          name: player.name,
          primaryPosition: player.positions[0] || 'N/A',
          levelMax: player.levels.max,
          overallBase: player.overall.base,
          overallMax: player.overall.max
        },
        scenario: {
          level,
          condition: scenario.condition,
          preset: scenario.preset,
          managerId: scenario.manager?.efhubId || null
        },
        output: {
          parityVersion: result.parityVersion,
          overall: result.overall,
          pointsUsed: result.pointsUsed,
          pointsCap: result.pointsCap,
          managerBonus: result.managerBonus,
          managerStatsBonus: result.managerStatsBonus,
          managerStyleKey: result.managerStyleKey,
          managerStyleFit: result.managerStyleFit,
          managerFitScore: result.managerFitScore,
          managerRoleAffinity: result.managerRoleAffinity,
          managerInfluenceScore: result.managerInfluenceScore,
          allocationCode: encodeBuildAllocations(allocations),
          keyStats: selectKeyStats(player, result.stats)
        }
      };
    })
  );

  return {
    meta: {
      schemaVersion: '1.0.0',
      parityFormulaVersion: PARITY_FORMULA_VERSION,
      files,
      playerCount: players.length,
      caseCount: cases.length
    },
    cases: cases.sort((a, b) => a.id.localeCompare(b.id))
  };
}

test('Parity snapshot matches baseline for real scraped players', async () => {
  const payload = await buildSnapshotPayload();
  assertEnoughRealPlayers(payload.meta.playerCount, 'Không đủ dữ liệu để tạo snapshot parity.');
  assert.ok(payload.meta.caseCount > 0, 'Không tạo được case parity nào.');

  if (process.env.EFVN_UPDATE_PARITY_SNAPSHOT === '1') {
    await fs.mkdir(path.dirname(SNAPSHOT_FILE), { recursive: true });
    await fs.writeFile(SNAPSHOT_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    return;
  }

  const expectedRaw = await fs.readFile(SNAPSHOT_FILE, 'utf8');
  const expected = JSON.parse(expectedRaw) as unknown;
  assert.deepStrictEqual(payload, expected);
});

test('Monotonic sanity check for baseline overall progression', async () => {
  const { players } = await loadRealPlayers();
  assertEnoughRealPlayers(players.length, 'Không đủ dữ liệu player cho monotonic test.');

  players.forEach((player) => {
    if (player.levels.max <= 1) {
      return;
    }

    const minProjection = calculatePlayerProjection({
      player,
      level: 1,
      condition: 'C',
      allocations: emptyBuildAllocations(),
      manager: null
    });
    const maxProjection = calculatePlayerProjection({
      player,
      level: player.levels.max,
      condition: 'C',
      allocations: emptyBuildAllocations(),
      manager: null
    });

    assert.ok(
      maxProjection.overall >= minProjection.overall,
      `OVR không tăng theo level cho ${player.efhubId} (${player.name}).`
    );
  });
});

test('Build allocation never exceeds points cap', async () => {
  const { players } = await loadRealPlayers();
  assertEnoughRealPlayers(players.length, 'Không đủ dữ liệu player cho points-cap test.');

  players.forEach((player) => {
    const presets: Array<'smart' | 'attack'> = ['smart', 'attack'];
    presets.forEach((preset) => {
      const allocations = generateBuildPreset(player, preset, player.build.pointsCap);
      const used = Object.values(allocations as Record<BuildCategory, number>).reduce(
        (sum, value) => sum + Math.max(0, Number(value || 0)),
        0
      );
      assert.ok(
        used <= player.build.pointsCap,
        `Preset ${preset} vượt points cap cho ${player.efhubId} (${used} > ${player.build.pointsCap}).`
      );
    });
  });
});

function createSyntheticPlayer(options: {
  id: string;
  name: string;
  position: string;
  overall: number;
  attack: number;
  defense: number;
  stamina: number;
  gk?: number;
}): Player {
  const gkValue = options.gk ?? 40;
  const stats = {
    offensiveAwareness: clamp(Math.round(options.attack), 40, 99),
    finishing: clamp(Math.round(options.attack - 2), 40, 99),
    speed: clamp(Math.round(options.attack - 3), 40, 99),
    acceleration: clamp(Math.round(options.attack - 2), 40, 99),
    ballControl: clamp(Math.round((options.attack + options.defense) / 2), 40, 99),
    dribbling: clamp(Math.round(options.attack - 1), 40, 99),
    lowPass: clamp(Math.round((options.attack + options.stamina) / 2), 40, 99),
    loftedPass: clamp(Math.round((options.attack + options.stamina) / 2), 40, 99),
    kickingPower: clamp(Math.round(options.attack - 1), 40, 99),
    defensiveAwareness: clamp(Math.round(options.defense), 40, 99),
    ballWinning: clamp(Math.round(options.defense - 2), 40, 99),
    trackingBack: clamp(Math.round(options.defense - 1), 40, 99),
    physicalContact: clamp(Math.round((options.defense + options.stamina) / 2), 40, 99),
    stamina: clamp(Math.round(options.stamina), 40, 99),
    jump: clamp(Math.round((options.defense + options.stamina) / 2), 40, 99),
    balance: clamp(Math.round((options.attack + options.stamina) / 2), 40, 99),
    heading: clamp(Math.round((options.attack + options.defense) / 2), 40, 99),
    setPieceTaking: clamp(Math.round(options.attack - 4), 40, 99),
    curl: clamp(Math.round(options.attack - 3), 40, 99),
    aggression: clamp(Math.round(options.defense - 3), 40, 99),
    gkAwareness: clamp(Math.round(gkValue), 40, 99),
    gkCatching: clamp(Math.round(gkValue), 40, 99),
    gkClearing: clamp(Math.round(gkValue), 40, 99),
    gkReflexes: clamp(Math.round(gkValue), 40, 99),
    gkReach: clamp(Math.round(gkValue), 40, 99)
  };

  return {
    efhubId: options.id,
    slug: options.id,
    name: options.name,
    shortName: options.name,
    nationality: 'Test',
    club: 'Parity FC',
    league: 'Parity League',
    positions: [options.position],
    cardType: 'Standard',
    rarity: 'Rare',
    overall: {
      base: clamp(Math.round(options.overall - 2), 1, 120),
      max: clamp(Math.round(options.overall), 1, 120)
    },
    levels: {
      current: 1,
      max: 1
    },
    stats: {
      level1: stats,
      maxLevel: stats,
      perLevel: []
    },
    skills: [],
    playstyles: [options.position === 'CF' ? 'Goal Poacher' : 'Orchestrator'],
    condition: {
      form: 'C',
      injuryResistance: 2
    },
    build: {
      pointsCap: 0
    },
    positionRatings: {
      [options.position]: clamp(Math.round(options.overall), 40, 120)
    },
    images: {
      card: '',
      portrait: '',
      thumbnail: ''
    },
    source: {
      site: 'test',
      playerUrl: '',
      scrapedAt: '2026-04-15T00:00:00.000Z'
    },
    bio: {},
    extra: {
      additionalSkills: [],
      comPlayingStyles: [],
      playerModel: {},
      physics: {},
      otherStats: {}
    }
  };
}

test('Manager influence scales with style + affinity + fit', async () => {
  const { players } = await loadRealPlayers();
  assertEnoughRealPlayers(players.length, 'Không đủ dữ liệu player cho manager influence test.');
  const candidate =
    players.find((player) => ['CF', 'SS', 'LWF', 'RWF'].includes(String(player.positions[0] || '').toUpperCase())) ||
    players[0];
  assert.ok(candidate, 'Không tìm thấy player để test manager influence.');

  const strongManager: Manager = {
    ...TEST_MANAGERS[0],
    efhubId: 'mgr-strong',
    playstyleProficiency: {
      quickCounter: 97,
      possessionGame: 72,
      longBallCounter: 70,
      outWide: 69,
      longBall: 62
    },
    affinity: {
      attack: 95,
      midfield: 80,
      defense: 66
    }
  };
  const weakManager: Manager = {
    ...TEST_MANAGERS[0],
    efhubId: 'mgr-weak',
    playstyleProficiency: {
      quickCounter: 74,
      possessionGame: 70,
      longBallCounter: 65,
      outWide: 64,
      longBall: 60
    },
    affinity: {
      attack: 68,
      midfield: 66,
      defense: 64
    }
  };

  const level = Math.max(1, candidate.levels.max);
  const baseline = calculatePlayerProjection({
    player: candidate,
    level,
    condition: 'C',
    allocations: emptyBuildAllocations(),
    manager: null
  });
  const boostedStrong = calculatePlayerProjection({
    player: candidate,
    level,
    condition: 'C',
    allocations: emptyBuildAllocations(),
    manager: strongManager
  });
  const boostedWeak = calculatePlayerProjection({
    player: candidate,
    level,
    condition: 'C',
    allocations: emptyBuildAllocations(),
    manager: weakManager
  });

  assert.ok(
    boostedStrong.managerStatsBonus >= boostedWeak.managerStatsBonus,
    'Manager mạnh phải có style bonus >= manager yếu.'
  );
  assert.ok(
    boostedStrong.managerRoleAffinity >= boostedWeak.managerRoleAffinity,
    'Manager mạnh phải có role affinity >= manager yếu.'
  );
  assert.ok(
    boostedStrong.managerInfluenceScore >= boostedWeak.managerInfluenceScore,
    'Manager mạnh phải có influence score >= manager yếu.'
  );
  assert.ok(
    boostedStrong.overall >= boostedWeak.overall,
    'OVR với manager mạnh không được thấp hơn manager yếu.'
  );
  assert.ok(
    boostedStrong.overall >= baseline.overall,
    'OVR với manager mạnh không được thấp hơn baseline không manager.'
  );
});

test('Lineup metrics chemistry rewards coverage + positional fit', () => {
  const players = {
    gk: createSyntheticPlayer({
      id: 'syn-gk',
      name: 'GK',
      position: 'GK',
      overall: 90,
      attack: 52,
      defense: 91,
      stamina: 82,
      gk: 95
    }),
    lb: createSyntheticPlayer({
      id: 'syn-lb',
      name: 'LB',
      position: 'LB',
      overall: 89,
      attack: 76,
      defense: 88,
      stamina: 86
    }),
    cb1: createSyntheticPlayer({
      id: 'syn-cb1',
      name: 'CB1',
      position: 'CB',
      overall: 91,
      attack: 70,
      defense: 92,
      stamina: 84
    }),
    cb2: createSyntheticPlayer({
      id: 'syn-cb2',
      name: 'CB2',
      position: 'CB',
      overall: 90,
      attack: 69,
      defense: 91,
      stamina: 84
    }),
    rb: createSyntheticPlayer({
      id: 'syn-rb',
      name: 'RB',
      position: 'RB',
      overall: 88,
      attack: 75,
      defense: 87,
      stamina: 85
    }),
    dmf: createSyntheticPlayer({
      id: 'syn-dmf',
      name: 'DMF',
      position: 'DMF',
      overall: 90,
      attack: 80,
      defense: 86,
      stamina: 88
    }),
    cmf1: createSyntheticPlayer({
      id: 'syn-cmf1',
      name: 'CMF1',
      position: 'CMF',
      overall: 91,
      attack: 85,
      defense: 84,
      stamina: 89
    }),
    cmf2: createSyntheticPlayer({
      id: 'syn-cmf2',
      name: 'CMF2',
      position: 'CMF',
      overall: 90,
      attack: 84,
      defense: 83,
      stamina: 88
    }),
    lwf: createSyntheticPlayer({
      id: 'syn-lwf',
      name: 'LWF',
      position: 'LWF',
      overall: 92,
      attack: 93,
      defense: 61,
      stamina: 86
    }),
    cf: createSyntheticPlayer({
      id: 'syn-cf',
      name: 'CF',
      position: 'CF',
      overall: 94,
      attack: 95,
      defense: 60,
      stamina: 85
    }),
    rwf: createSyntheticPlayer({
      id: 'syn-rwf',
      name: 'RWF',
      position: 'RWF',
      overall: 92,
      attack: 92,
      defense: 62,
      stamina: 86
    })
  };

  const slots = [
    { slotId: 'GK', preferredPositions: ['GK'], player: players.gk },
    { slotId: 'LB', preferredPositions: ['LB'], player: players.lb },
    { slotId: 'CB1', preferredPositions: ['CB'], player: players.cb1 },
    { slotId: 'CB2', preferredPositions: ['CB'], player: players.cb2 },
    { slotId: 'RB', preferredPositions: ['RB'], player: players.rb },
    { slotId: 'DMF', preferredPositions: ['DMF', 'CMF'], player: players.dmf },
    { slotId: 'CMF1', preferredPositions: ['CMF', 'DMF'], player: players.cmf1 },
    { slotId: 'CMF2', preferredPositions: ['CMF', 'AMF'], player: players.cmf2 },
    { slotId: 'LWF', preferredPositions: ['LWF', 'LMF', 'SS'], player: players.lwf },
    { slotId: 'CF', preferredPositions: ['CF', 'SS'], player: players.cf },
    { slotId: 'RWF', preferredPositions: ['RWF', 'RMF', 'SS'], player: players.rwf }
  ];

  const partialSlots = slots.map((slot, index) => ({
    ...slot,
    player: index >= 8 ? null : slot.player
  }));

  const mismatchedSlots = [
    { ...slots[0], player: players.cf },
    { ...slots[1], player: players.cmf1 },
    { ...slots[2], player: players.rwf },
    { ...slots[3], player: players.lwf },
    { ...slots[4], player: players.dmf },
    { ...slots[5], player: players.cb1 },
    { ...slots[6], player: players.cb2 },
    { ...slots[7], player: players.lb },
    { ...slots[8], player: players.gk },
    { ...slots[9], player: players.rb },
    { ...slots[10], player: players.cmf2 }
  ];

  const fullMetrics = calculateLineupMetrics({
    lineupSlots: slots,
    manager: TEST_MANAGERS[0]
  });
  const partialMetrics = calculateLineupMetrics({
    lineupSlots: partialSlots,
    manager: TEST_MANAGERS[0]
  });
  const mismatchedMetrics = calculateLineupMetrics({
    lineupSlots: mismatchedSlots,
    manager: TEST_MANAGERS[0]
  });

  assert.ok(fullMetrics.chemistry > partialMetrics.chemistry, 'Đủ người phải có chemistry cao hơn lineup thiếu.');
  assert.ok(
    fullMetrics.chemistry > mismatchedMetrics.chemistry,
    'Lineup đúng vị trí phải có chemistry cao hơn lineup lệch vị trí.'
  );
  assert.ok(
    fullMetrics.positionalFit > mismatchedMetrics.positionalFit,
    'Positional fit count phải cao hơn khi lineup đúng vị trí.'
  );
  assert.ok(fullMetrics.styleFit >= 0 && fullMetrics.styleFit <= 100, 'Style fit phải nằm trong [0, 100].');
  assert.ok(
    fullMetrics.managerTacticalFit >= 0 && fullMetrics.managerTacticalFit <= 100,
    'Manager tactical fit phải nằm trong [0, 100].'
  );
  assert.ok(fullMetrics.balance >= 0 && fullMetrics.balance <= 100, 'Balance phải nằm trong [0, 100].');
});
