import type { BuildCategory, Manager, Player } from '@/types/domain';
import {
  MANAGER_STYLE_TO_STATS,
  evaluateManagerInfluenceForPlayer
} from '@/lib/gameplay/manager-influence';

export const BUILD_ORDER: BuildCategory[] = [
  'shooting',
  'passing',
  'dribbling',
  'dexterity',
  'lowerBodyStrength',
  'aerialStrength',
  'defending',
  'gk1',
  'gk2',
  'gk3'
];

export const BUILD_EFFECTS: Record<BuildCategory, Array<[string, number]>> = {
  shooting: [
    ['finishing', 1.6],
    ['offensiveAwareness', 1.2],
    ['kickingPower', 0.8]
  ],
  passing: [
    ['lowPass', 1.5],
    ['loftedPass', 1.3],
    ['setPieceTaking', 0.8]
  ],
  dribbling: [
    ['ballControl', 1.4],
    ['dribbling', 1.4],
    ['tightPossession', 1.3]
  ],
  dexterity: [
    ['offensiveAwareness', 1.1],
    ['acceleration', 1.2],
    ['balance', 1.1]
  ],
  lowerBodyStrength: [
    ['speed', 1.2],
    ['acceleration', 0.9],
    ['kickingPower', 1.2],
    ['stamina', 0.8]
  ],
  aerialStrength: [
    ['jump', 1.3],
    ['physicalContact', 1.1],
    ['heading', 1.3]
  ],
  defending: [
    ['defensiveAwareness', 1.4],
    ['ballWinning', 1.4],
    ['trackingBack', 1.2],
    ['aggression', 0.7]
  ],
  gk1: [
    ['gkAwareness', 1.5],
    ['gkCatching', 1.2]
  ],
  gk2: [
    ['gkReflexes', 1.5],
    ['gkReach', 1.2]
  ],
  gk3: [
    ['gkClearing', 1.5],
    ['gkAwareness', 1]
  ]
};

export const CONDITION_DELTA: Record<string, number> = {
  A: 2,
  B: 1,
  C: 0,
  D: -1,
  E: -2
};

export const PARITY_FORMULA_VERSION = '2026-04-17.v3';

const CONDITION_GRADES = ['A', 'B', 'C', 'D', 'E'] as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function interpolate(start: number, end: number, ratio: number) {
  return Math.round(start + (end - start) * ratio);
}

function normalizeKey(key: string) {
  return String(key || '').trim().toLowerCase();
}

const GK_STATS = new Set(
  ['gkAwareness', 'gkCatching', 'gkClearing', 'gkReflexes', 'gkReach'].map(normalizeKey)
);

const PHYSICAL_STATS = new Set(
  ['speed', 'acceleration', 'stamina', 'physicalContact', 'jump', 'balance'].map(normalizeKey)
);

const TECHNICAL_STATS = new Set(
  [
    'offensiveAwareness',
    'ballControl',
    'dribbling',
    'tightPossession',
    'finishing',
    'lowPass',
    'loftedPass',
    'kickingPower',
    'defensiveAwareness',
    'trackingBack',
    'ballWinning',
    'aggression',
    'heading',
    'setPieceTaking',
    'curl'
  ].map(normalizeKey)
);

type ConditionGroup = 'technical' | 'physical' | 'goalkeeping';
type PlayerRole = 'goalkeeper' | 'defense' | 'midfield' | 'attack';

const CONDITION_PERCENT_BY_GROUP: Record<
  string,
  Record<ConditionGroup, number>
> = {
  A: { technical: 0.03, physical: 0.025, goalkeeping: 0.02 },
  B: { technical: 0.015, physical: 0.012, goalkeeping: 0.01 },
  C: { technical: 0, physical: 0, goalkeeping: 0 },
  D: { technical: -0.015, physical: -0.012, goalkeeping: -0.01 },
  E: { technical: -0.03, physical: -0.025, goalkeeping: -0.02 }
};

const OVERALL_IMPACT_STATS: Record<PlayerRole, string[]> = {
  goalkeeper: ['gkAwareness', 'gkReflexes', 'gkCatching', 'gkReach', 'gkClearing'],
  defense: ['defensiveAwareness', 'ballWinning', 'trackingBack', 'physicalContact', 'speed'],
  midfield: ['ballControl', 'tightPossession', 'lowPass', 'loftedPass', 'stamina', 'dribbling'],
  attack: ['offensiveAwareness', 'finishing', 'speed', 'acceleration', 'dribbling', 'kickingPower']
};

const ROLE_POSITIONS: Record<PlayerRole, Set<string>> = {
  goalkeeper: new Set(['GK']),
  defense: new Set(['CB', 'LB', 'RB']),
  midfield: new Set(['DMF', 'CMF', 'AMF', 'LMF', 'RMF']),
  attack: new Set(['CF', 'SS', 'LWF', 'RWF'])
};

type ManagerStyleKey = keyof Manager['playstyleProficiency'];

function resolveConditionGroup(statKey: string): ConditionGroup {
  const key = normalizeKey(statKey);
  if (GK_STATS.has(key)) {
    return 'goalkeeping';
  }
  if (PHYSICAL_STATS.has(key)) {
    return 'physical';
  }
  if (TECHNICAL_STATS.has(key)) {
    return 'technical';
  }
  return 'technical';
}

function calculateConditionDeltaForStat(
  statKey: string,
  value: number,
  conditionGrade: string
) {
  const group = resolveConditionGroup(statKey);
  const percent = CONDITION_PERCENT_BY_GROUP[conditionGrade]?.[group] ?? 0;
  if (percent === 0) {
    return 0;
  }

  const rawDelta = value * percent;
  if (rawDelta > 0) {
    return Math.max(1, Math.round(rawDelta));
  }
  return Math.min(-1, Math.round(rawDelta));
}

function growthRatioByGain(level: number, maxLevel: number, gain: number) {
  if (maxLevel <= 1) {
    return 0;
  }

  const raw = clamp((level - 1) / (maxLevel - 1), 0, 1);
  if (gain <= 4) {
    return raw;
  }

  const exponent = gain >= 18 ? 0.82 : gain >= 12 ? 0.88 : 0.94;
  const eased = Math.pow(raw, exponent);
  const lateBoost = raw > 0.85 ? (raw - 0.85) * 0.08 : 0;
  return clamp(eased + lateBoost, 0, 1);
}

function perPointBuildMultiplier(pointIndex: number) {
  if (pointIndex <= 4) {
    return 1;
  }
  if (pointIndex <= 8) {
    return 0.9;
  }
  if (pointIndex <= 12) {
    return 0.8;
  }
  if (pointIndex <= 16) {
    return 0.65;
  }
  return 0.5;
}

function effectiveBuildPoints(points: number) {
  const count = Math.max(0, Math.round(points));
  let total = 0;
  for (let index = 1; index <= count; index += 1) {
    total += perPointBuildMultiplier(index);
  }
  return total;
}

function applyManagerStyleBoost(
  stats: Record<string, number>,
  player: Player,
  manager: Manager | null | undefined
) {
  if (!manager) {
    return {
      stats: { ...stats },
      styleKey: null as ManagerStyleKey | null,
      styleLevel: 0,
      bonus: 0,
      fit: false,
      fitScore: 0,
      roleAffinity: 0,
      influenceScore: 0,
      positionBonus: 0
    };
  }

  const influence = evaluateManagerInfluenceForPlayer({
    player,
    stats,
    manager
  });
  const boosted = { ...stats };
  const fit = influence.fitBonus > 0 || influence.hintFit;
  const effectiveBonus = influence.totalBonus;
  const positionBonus = clamp(
    influence.styleBonus + influence.affinityBonus + (influence.fitBonus > 0 ? 1 : 0),
    0,
    8
  );

  if (effectiveBonus > 0) {
    MANAGER_STYLE_TO_STATS[influence.styleKey].forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(boosted, key)) {
        return;
      }
      boosted[key] = clamp(Math.round(Number(boosted[key] || 0) + effectiveBonus), 0, 120);
    });
  }

  return {
    stats: boosted,
    styleKey: influence.styleKey,
    styleLevel: influence.styleLevel,
    bonus: effectiveBonus,
    fit,
    fitScore: influence.fitScore,
    roleAffinity: influence.roleAffinity,
    influenceScore: influence.tacticalFitScore,
    positionBonus
  };
}

function detectPlayerRole(player: Player): PlayerRole {
  const primary = String(player.positions?.[0] || '').toUpperCase();
  if (ROLE_POSITIONS.goalkeeper.has(primary)) {
    return 'goalkeeper';
  }
  if (ROLE_POSITIONS.defense.has(primary)) {
    return 'defense';
  }
  if (ROLE_POSITIONS.midfield.has(primary)) {
    return 'midfield';
  }
  if (ROLE_POSITIONS.attack.has(primary)) {
    return 'attack';
  }
  return 'midfield';
}

function averageKnownStats(stats: Record<string, number>, keys: string[]) {
  let total = 0;
  let count = 0;
  keys.forEach((key) => {
    const value = Number(stats[key]);
    if (Number.isFinite(value)) {
      total += value;
      count += 1;
    }
  });

  if (count > 0) {
    return total / count;
  }

  const values = Object.values(stats).map((item) => Number(item)).filter(Number.isFinite);
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function emptyBuildAllocations(): Record<BuildCategory, number> {
  return {
    shooting: 0,
    passing: 0,
    dribbling: 0,
    dexterity: 0,
    lowerBodyStrength: 0,
    aerialStrength: 0,
    defending: 0,
    gk1: 0,
    gk2: 0,
    gk3: 0
  };
}

export function normalizeBuildAllocations(
  raw: Partial<Record<BuildCategory, number>> | undefined
): Record<BuildCategory, number> {
  const output = emptyBuildAllocations();

  BUILD_ORDER.forEach((category) => {
    const value = Number(raw?.[category] ?? 0);
    output[category] = Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
  });

  return output;
}

export function encodeBuildAllocations(allocations: Record<BuildCategory, number>) {
  return BUILD_ORDER.map((key) => String(Math.max(0, allocations[key] || 0))).join('-');
}

export function decodeBuildAllocations(raw: string): Record<BuildCategory, number> {
  const values = String(raw || '')
    .split('-')
    .map((item) => Number.parseInt(item, 10));
  const output = emptyBuildAllocations();

  BUILD_ORDER.forEach((key, index) => {
    const value = values[index];
    output[key] = Number.isFinite(value) && value > 0 ? value : 0;
  });

  return output;
}

export function normalizeConditionGrade(raw: string | undefined) {
  const upper = String(raw || 'C').trim().toUpperCase();
  return CONDITION_GRADES.includes(upper as (typeof CONDITION_GRADES)[number]) ? upper : 'C';
}

export function deriveStatsAtLevel(player: Player, level: number) {
  const maxLevel = Math.max(1, Number(player.levels.max || 1));
  const safeLevel = clamp(Math.round(Number(level || 1)), 1, maxLevel);
  const perLevelEntry = player.stats.perLevel.find((entry) => entry.level === safeLevel);

  const stats: Record<string, number> = {};
  const keys = new Set([
    ...Object.keys(player.stats.level1 || {}),
    ...Object.keys(player.stats.maxLevel || {}),
    ...(perLevelEntry ? Object.keys(perLevelEntry.stats || {}) : [])
  ]);

  keys.forEach((key) => {
    const perLevelValue = Number(perLevelEntry?.stats?.[key]);
    if (Number.isFinite(perLevelValue)) {
      stats[key] = Math.round(perLevelValue);
      return;
    }

    const lv1 = Number(player.stats.level1[key] || 0);
    const max = Number(player.stats.maxLevel[key] || lv1);
    const gain = max - lv1;
    const ratio = growthRatioByGain(safeLevel, maxLevel, gain);
    stats[key] = interpolate(lv1, max, ratio);
  });

  const overallFromPerLevel = Number(perLevelEntry?.overall);
  const overallGain = Number(player.overall.max || 0) - Number(player.overall.base || 0);
  const overallRatio = growthRatioByGain(safeLevel, maxLevel, overallGain);
  const overall = Number.isFinite(overallFromPerLevel)
    ? Math.round(overallFromPerLevel)
    : interpolate(player.overall.base, player.overall.max, overallRatio);

  return {
    level: safeLevel,
    maxLevel,
    stats,
    overall
  };
}

export function applyBuildBonuses(
  baseStats: Record<string, number>,
  allocations: Record<BuildCategory, number>
) {
  const output = { ...baseStats };

  BUILD_ORDER.forEach((category) => {
    const amount = Math.max(0, Number(allocations[category] || 0));
    if (amount <= 0) {
      return;
    }

    const effectivePoints = effectiveBuildPoints(amount);
    BUILD_EFFECTS[category].forEach(([stat, weight]) => {
      if (!Object.prototype.hasOwnProperty.call(output, stat)) {
        return;
      }
      const current = Number(output[stat] || 0);
      output[stat] = clamp(Math.round(current + effectivePoints * weight), 0, 120);
    });
  });

  return output;
}

export function applyCondition(stats: Record<string, number>, conditionGrade: string) {
  const condition = normalizeConditionGrade(conditionGrade);
  if (condition === 'C') {
    return { ...stats };
  }

  const output: Record<string, number> = {};
  Object.keys(stats).forEach((key) => {
    const value = Number(stats[key] || 0);
    const delta = calculateConditionDeltaForStat(key, value, condition);
    output[key] = clamp(value + delta, 0, 120);
  });
  return output;
}

export type BuildPreset = 'smart' | 'attack' | 'creative' | 'defense' | 'goalkeeper';

const FORWARD_POSITIONS = new Set(['CF', 'SS', 'LWF', 'RWF']);
const MIDFIELD_POSITIONS = new Set(['AMF', 'CMF', 'DMF', 'LMF', 'RMF']);
const DEFENSE_POSITIONS = new Set(['CB', 'LB', 'RB']);

function allocateByWeights(
  pointsCap: number,
  weightedCategories: Array<[BuildCategory, number]>,
  perCategoryCap = 20
) {
  const cap = Math.max(0, Math.round(pointsCap));
  const allocations = emptyBuildAllocations();

  const normalized = weightedCategories
    .map(([category, weight]) => [category, Math.max(0, Number(weight || 0))] as const)
    .filter((entry) => entry[1] > 0);

  if (cap <= 0 || normalized.length === 0) {
    return allocations;
  }

  const totalWeight = normalized.reduce((sum, [, weight]) => sum + weight, 0);
  if (totalWeight <= 0) {
    return allocations;
  }

  let used = 0;
  normalized.forEach(([category, weight]) => {
    const target = Math.floor((cap * weight) / totalWeight);
    const applied = clamp(target, 0, perCategoryCap);
    allocations[category] = applied;
    used += applied;
  });

  if (used >= cap) {
    return allocations;
  }

  // Fill remaining points by priority order while respecting per-category caps.
  while (used < cap) {
    let changed = false;
    for (const [category] of normalized) {
      if (used >= cap) {
        break;
      }
      if (allocations[category] >= perCategoryCap) {
        continue;
      }
      allocations[category] += 1;
      used += 1;
      changed = true;
    }
    if (!changed) {
      break;
    }
  }

  return allocations;
}

function smartWeightsByPosition(player: Player): Array<[BuildCategory, number]> {
  const primary = String(player.positions?.[0] || '').toUpperCase();

  if (primary === 'GK') {
    return [
      ['gk1', 5],
      ['gk2', 4],
      ['gk3', 4],
      ['passing', 2],
      ['aerialStrength', 2]
    ];
  }

  if (FORWARD_POSITIONS.has(primary)) {
    return [
      ['shooting', 5],
      ['dexterity', 4],
      ['dribbling', 4],
      ['lowerBodyStrength', 3],
      ['passing', 2],
      ['aerialStrength', 2]
    ];
  }

  if (MIDFIELD_POSITIONS.has(primary)) {
    return [
      ['passing', 5],
      ['dribbling', 4],
      ['dexterity', 4],
      ['lowerBodyStrength', 3],
      ['defending', 3],
      ['shooting', 2]
    ];
  }

  if (DEFENSE_POSITIONS.has(primary)) {
    return [
      ['defending', 5],
      ['lowerBodyStrength', 4],
      ['aerialStrength', 4],
      ['passing', 3],
      ['dexterity', 2]
    ];
  }

  return [
    ['passing', 4],
    ['dribbling', 4],
    ['dexterity', 4],
    ['lowerBodyStrength', 3],
    ['defending', 3],
    ['shooting', 2]
  ];
}

export function generateBuildPreset(
  player: Player,
  preset: BuildPreset,
  pointsCap?: number
): Record<BuildCategory, number> {
  const cap = Math.max(0, Math.round(pointsCap ?? player.build?.pointsCap ?? 0));

  if (preset === 'smart') {
    return allocateByWeights(cap, smartWeightsByPosition(player));
  }
  if (preset === 'attack') {
    return allocateByWeights(cap, [
      ['shooting', 6],
      ['dexterity', 4],
      ['dribbling', 4],
      ['lowerBodyStrength', 3],
      ['passing', 2],
      ['aerialStrength', 2]
    ]);
  }
  if (preset === 'creative') {
    return allocateByWeights(cap, [
      ['passing', 6],
      ['dribbling', 5],
      ['dexterity', 4],
      ['lowerBodyStrength', 3],
      ['shooting', 2]
    ]);
  }
  if (preset === 'defense') {
    return allocateByWeights(cap, [
      ['defending', 6],
      ['aerialStrength', 4],
      ['lowerBodyStrength', 4],
      ['passing', 2],
      ['dexterity', 2]
    ]);
  }

  return allocateByWeights(cap, [
    ['gk1', 5],
    ['gk2', 4],
    ['gk3', 4],
    ['passing', 2],
    ['aerialStrength', 2]
  ]);
}

export type CalculatePlayerProjectionOptions = {
  player: Player;
  level: number;
  condition: string;
  allocations?: Partial<Record<BuildCategory, number>>;
  manager?: Manager | null;
  applyBuildBonuses?: boolean;
  applyConditionEffect?: boolean;
};

export function calculatePlayerProjection(options: CalculatePlayerProjectionOptions) {
  const player = options.player;
  const normalizedAllocations = normalizeBuildAllocations(options.allocations);
  const applyBuild = options.applyBuildBonuses ?? true;
  const applyConditionEffect = options.applyConditionEffect ?? true;
  const condition = normalizeConditionGrade(options.condition);

  const raw = deriveStatsAtLevel(player, options.level);
  const withBuild = applyBuild ? applyBuildBonuses(raw.stats, normalizedAllocations) : raw.stats;
  const managerApplied = applyManagerStyleBoost(withBuild, player, options.manager);
  const withManager = managerApplied.stats;
  const stats = applyConditionEffect ? applyCondition(withManager, condition) : withManager;

  const pointsUsed = BUILD_ORDER.reduce(
    (sum, category) => sum + Math.max(0, Number(normalizedAllocations[category] || 0)),
    0
  );
  const pointsCap = Math.max(0, Number(player.build?.pointsCap || (raw.maxLevel - 1) * 2));

  const managerBonus = managerApplied.positionBonus;
  const positionRatings = Object.keys(player.positionRatings || {}).reduce<Record<string, number>>(
    (acc, positionKey) => {
      const base = Number(player.positionRatings[positionKey] || 0);
      acc[positionKey] = clamp(base + managerBonus, 40, 120);
      return acc;
    },
    {}
  );

  const role = detectPlayerRole(player);
  const impactKeys = OVERALL_IMPACT_STATS[role];
  const baselineAvg = averageKnownStats(raw.stats, impactKeys);
  const projectedAvg = averageKnownStats(stats, impactKeys);
  const statDelta = projectedAvg - baselineAvg;
  const statImpact = clamp(Math.round(statDelta / 2.8), -8, 12);
  const managerImpact = clamp(Math.round(managerApplied.positionBonus / 3), 0, 2);
  const fitImpact = managerApplied.fitScore >= 88 ? 1 : 0;
  const affinityImpact = managerApplied.roleAffinity >= 90 ? 1 : 0;
  const conditionImpact = applyConditionEffect ? Math.sign(CONDITION_DELTA[condition] || 0) : 0;
  const overall = clamp(
    raw.overall + statImpact + managerImpact + fitImpact + affinityImpact + conditionImpact,
    1,
    120
  );

  return {
    level: raw.level,
    maxLevel: raw.maxLevel,
    stats,
    overall,
    pointsUsed,
    pointsCap,
    positionRatings,
    managerBonus,
    managerStyleKey: managerApplied.styleKey,
    managerStyleLevel: managerApplied.styleLevel,
    managerStatsBonus: managerApplied.bonus,
    managerStyleFit: managerApplied.fit,
    managerFitScore: managerApplied.fitScore,
    managerRoleAffinity: managerApplied.roleAffinity,
    managerInfluenceScore: managerApplied.influenceScore,
    parityVersion: PARITY_FORMULA_VERSION,
    condition,
    allocations: normalizedAllocations
  };
}
