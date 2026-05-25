import type { Manager, Player } from '@/types/domain';

type ManagerRoleKey = 'goalkeeper' | 'defense' | 'midfield' | 'attack';

export type ManagerStyleKey = keyof Manager['playstyleProficiency'];

export const MANAGER_STYLE_LABEL: Record<ManagerStyleKey, string> = {
  quickCounter: 'Quick Counter',
  possessionGame: 'Possession Game',
  longBallCounter: 'Long Ball Counter',
  outWide: 'Out Wide',
  longBall: 'Long Ball'
};

export const MANAGER_STYLE_TO_STATS: Record<ManagerStyleKey, string[]> = {
  quickCounter: ['speed', 'acceleration', 'offensiveAwareness', 'stamina'],
  possessionGame: ['ballControl', 'tightPossession', 'lowPass', 'loftedPass'],
  longBallCounter: [
    'defensiveAwareness',
    'ballWinning',
    'trackingBack',
    'physicalContact',
    'loftedPass'
  ],
  outWide: ['speed', 'dribbling', 'loftedPass', 'curl'],
  longBall: ['physicalContact', 'heading', 'kickingPower', 'jump']
};

const MANAGER_STYLE_PLAYSTYLE_HINTS: Record<ManagerStyleKey, string[]> = {
  quickCounter: ['counter', 'goal poacher', 'dummy runner'],
  possessionGame: ['creative', 'orchestrator', 'hole player', 'possession'],
  longBallCounter: ['destroyer', 'anchor man', 'build up'],
  outWide: ['cross specialist', 'out wide', 'roaming flank'],
  longBall: ['target man', 'fox in the box', 'long ball']
};

const STYLE_PRIORITY: ManagerStyleKey[] = [
  'quickCounter',
  'possessionGame',
  'longBallCounter',
  'outWide',
  'longBall'
];

const ROLE_POSITIONS: Record<ManagerRoleKey, Set<string>> = {
  goalkeeper: new Set(['GK']),
  defense: new Set(['CB', 'LB', 'RB']),
  midfield: new Set(['DMF', 'CMF', 'AMF', 'LMF', 'RMF']),
  attack: new Set(['CF', 'SS', 'LWF', 'RWF'])
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeKey(key: string) {
  return String(key || '').trim().toLowerCase();
}

function averageKnownStats(stats: Record<string, number>, keys: string[]) {
  let total = 0;
  let count = 0;

  keys.forEach((key) => {
    const value = Number(stats[key] || 0);
    if (Number.isFinite(value) && value > 0) {
      total += value;
      count += 1;
    }
  });

  if (count === 0) {
    return 0;
  }
  return total / count;
}

function styleTier(styleLevel: number) {
  if (styleLevel >= 96) {
    return 4;
  }
  if (styleLevel >= 90) {
    return 3;
  }
  if (styleLevel >= 83) {
    return 2;
  }
  if (styleLevel >= 76) {
    return 1;
  }
  return 0;
}

function fitTier(fitScore: number) {
  if (fitScore >= 90) {
    return 2;
  }
  if (fitScore >= 82) {
    return 1;
  }
  return 0;
}

function affinityTier(roleAffinity: number) {
  if (roleAffinity >= 90) {
    return 2;
  }
  if (roleAffinity >= 82) {
    return 1;
  }
  return 0;
}

function inferPlayerRole(player: Player): ManagerRoleKey {
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

function resolveRoleAffinity(manager: Manager, role: ManagerRoleKey) {
  if (role === 'goalkeeper') {
    return Number(manager.affinity.defense || 0);
  }
  if (role === 'defense') {
    return Number(manager.affinity.defense || 0);
  }
  if (role === 'midfield') {
    return Number(manager.affinity.midfield || 0);
  }
  return Number(manager.affinity.attack || 0);
}

function isHintFitWithPlayer(player: Player, styleKey: ManagerStyleKey) {
  const hints = MANAGER_STYLE_PLAYSTYLE_HINTS[styleKey];
  if (!hints || hints.length === 0) {
    return false;
  }

  const styles = (player.playstyles || []).map((item) => normalizeKey(item));
  return hints.some((hint) => {
    const needle = normalizeKey(hint);
    return styles.some((style) => style.includes(needle));
  });
}

export function getManagerTopStyle(manager: Manager): ManagerStyleKey {
  let bestStyle: ManagerStyleKey = STYLE_PRIORITY[0];
  let bestValue = Number(manager.playstyleProficiency[bestStyle] || 0);

  STYLE_PRIORITY.forEach((styleKey) => {
    const candidate = Number(manager.playstyleProficiency[styleKey] || 0);
    if (candidate > bestValue) {
      bestStyle = styleKey;
      bestValue = candidate;
    }
  });

  return bestStyle;
}

export type ManagerInfluenceForPlayer = {
  styleKey: ManagerStyleKey;
  styleLevel: number;
  role: ManagerRoleKey;
  roleAffinity: number;
  fitScore: number;
  styleBonus: number;
  affinityBonus: number;
  fitBonus: number;
  hintBonus: number;
  totalBonus: number;
  hintFit: boolean;
  tacticalFitScore: number;
};

export function evaluateManagerInfluenceForPlayer(options: {
  player: Player;
  stats: Record<string, number>;
  manager: Manager;
}): ManagerInfluenceForPlayer {
  const { player, stats, manager } = options;
  const styleKey = getManagerTopStyle(manager);
  const styleLevel = Number(manager.playstyleProficiency[styleKey] || 0);
  const role = inferPlayerRole(player);
  const roleAffinity = clamp(resolveRoleAffinity(manager, role), 0, 100);
  const fitScore = clamp(Math.round(averageKnownStats(stats, MANAGER_STYLE_TO_STATS[styleKey])), 0, 100);
  const hintFit = isHintFitWithPlayer(player, styleKey);

  const styleBonus = styleTier(styleLevel);
  const affinityBonus = affinityTier(roleAffinity);
  const fitBonus = fitTier(fitScore);
  const hintBonus = hintFit && fitScore >= 75 ? 1 : 0;
  const totalBonus = clamp(styleBonus + affinityBonus + fitBonus + hintBonus, 0, 8);
  const tacticalFitScore = clamp(
    Math.round(styleLevel * 0.45 + roleAffinity * 0.35 + fitScore * 0.2),
    0,
    100
  );

  return {
    styleKey,
    styleLevel,
    role,
    roleAffinity,
    fitScore,
    styleBonus,
    affinityBonus,
    fitBonus,
    hintBonus,
    totalBonus,
    hintFit,
    tacticalFitScore
  };
}
