import type { Manager, Player } from '@/types/domain';
import { calculatePlayerProjection, emptyBuildAllocations } from '@/lib/gameplay/player-calculation';
import {
  MANAGER_STYLE_TO_STATS,
  evaluateManagerInfluenceForPlayer,
  getManagerTopStyle
} from '@/lib/gameplay/manager-influence';

type SlotRole = 'gk' | 'defense' | 'midfield' | 'attack';

export type LineupMetricSlot = {
  slotId: string;
  preferredPositions: string[];
  player: Player | null;
};

export type LineupMetricsResult = {
  playerCount: number;
  teamOvr: number;
  attack: number;
  defense: number;
  stamina: number;
  chemistry: number;
  positionalFit: number;
  styleFit: number;
  managerTacticalFit: number;
  balance: number;
};

const ATTACK_KEYS = ['offensiveAwareness', 'finishing', 'kickingPower', 'speed', 'dribbling'];
const DEFENSE_KEYS = ['defensiveAwareness', 'ballWinning', 'trackingBack', 'physicalContact', 'speed'];
const STAMINA_KEYS = ['stamina', 'balance', 'physicalContact'];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function detectSlotRole(preferredPositions: string[]): SlotRole {
  if (preferredPositions.includes('GK')) {
    return 'gk';
  }
  if (preferredPositions.some((position) => ['CB', 'LB', 'RB'].includes(position))) {
    return 'defense';
  }
  if (preferredPositions.some((position) => ['DMF', 'CMF', 'AMF', 'LMF', 'RMF'].includes(position))) {
    return 'midfield';
  }
  return 'attack';
}

function detectPlayerRole(player: Player): SlotRole {
  const primary = String(player.positions?.[0] || '').toUpperCase();
  if (primary === 'GK') {
    return 'gk';
  }
  if (['CB', 'LB', 'RB'].includes(primary)) {
    return 'defense';
  }
  if (['DMF', 'CMF', 'AMF', 'LMF', 'RMF'].includes(primary)) {
    return 'midfield';
  }
  return 'attack';
}

function averageStats(stats: Record<string, number>, keys: string[]) {
  let sum = 0;
  let count = 0;
  keys.forEach((key) => {
    const value = Number(stats[key] || 0);
    if (Number.isFinite(value) && value > 0) {
      sum += value;
      count += 1;
    }
  });
  if (count <= 0) {
    return 0;
  }
  return sum / count;
}

function positionalFitScore(slot: LineupMetricSlot, player: Player) {
  const normalizedPreferred = slot.preferredPositions.map((item) => String(item || '').toUpperCase());
  const playerPositions = (player.positions || []).map((item) => String(item || '').toUpperCase());

  if (normalizedPreferred.some((position) => playerPositions.includes(position))) {
    return 1;
  }

  const slotRole = detectSlotRole(normalizedPreferred);
  const playerRole = detectPlayerRole(player);
  if (slotRole === playerRole) {
    return 0.6;
  }
  return 0.2;
}

export function calculateLineupMetrics(options: {
  lineupSlots: LineupMetricSlot[];
  manager: Manager | null;
}): LineupMetricsResult {
  const selected = options.lineupSlots.filter((entry) => Boolean(entry.player));
  if (selected.length === 0) {
    return {
      playerCount: 0,
      teamOvr: 0,
      attack: 0,
      defense: 0,
      stamina: 0,
      chemistry: 0,
      positionalFit: 0,
      styleFit: 0,
      managerTacticalFit: 0,
      balance: 0
    };
  }

  const manager = options.manager || null;
  const projections = selected.map((entry) => {
    const player = entry.player as Player;
    const projection = calculatePlayerProjection({
      player,
      level: player.levels.max,
      condition: 'C',
      allocations: emptyBuildAllocations(),
      manager,
      applyBuildBonuses: false,
      applyConditionEffect: false
    });
    return {
      slot: entry,
      player,
      projection
    };
  });

  const playerCount = projections.length;
  const teamOvr = clamp(
    Math.round(
      projections.reduce((sum, item) => sum + Number(item.projection.overall || 0), 0) / playerCount
    ),
    0,
    120
  );

  const attack = clamp(
    Math.round(
      projections.reduce((sum, item) => sum + averageStats(item.projection.stats, ATTACK_KEYS), 0) / playerCount
    ),
    0,
    100
  );
  const defense = clamp(
    Math.round(
      projections.reduce((sum, item) => sum + averageStats(item.projection.stats, DEFENSE_KEYS), 0) / playerCount
    ),
    0,
    100
  );
  const stamina = clamp(
    Math.round(
      projections.reduce((sum, item) => sum + averageStats(item.projection.stats, STAMINA_KEYS), 0) / playerCount
    ),
    0,
    100
  );

  const fitScores = projections.map((item) => positionalFitScore(item.slot, item.player));
  const positionalFitRaw = fitScores.reduce((sum, value) => sum + value, 0);
  const positionalFit = fitScores.filter((value) => value >= 0.99).length;
  const positionalFitRatio = positionalFitRaw / 11;
  const managerStyleKey = manager ? getManagerTopStyle(manager) : null;

  const styleFit = manager && managerStyleKey
    ? clamp(
        Math.round(
          projections.reduce(
            (sum, item) => sum + averageStats(item.projection.stats, MANAGER_STYLE_TO_STATS[managerStyleKey]),
            0
          ) / playerCount
        ),
        0,
        100
      )
    : 70;

  const managerTacticalFit = manager
    ? clamp(
        Math.round(
          projections.reduce((sum, item) => {
            const influence = evaluateManagerInfluenceForPlayer({
              player: item.player,
              stats: item.projection.stats,
              manager
            });
            return sum + influence.tacticalFitScore;
          }, 0) / playerCount
        ),
        0,
        100
      )
    : 65;

  const balance = clamp(Math.round(100 - Math.abs(attack - defense) * 1.2), 0, 100);
  const coverageRatio = playerCount / 11;
  const chemistryRaw =
    coverageRatio * 36 +
    positionalFitRatio * 24 +
    styleFit * 0.16 +
    managerTacticalFit * 0.16 +
    balance * 0.08;
  const chemistry = clamp(Math.round(chemistryRaw), 0, 100);

  return {
    playerCount,
    teamOvr,
    attack,
    defense,
    stamina,
    chemistry,
    positionalFit,
    styleFit,
    managerTacticalFit,
    balance
  };
}
