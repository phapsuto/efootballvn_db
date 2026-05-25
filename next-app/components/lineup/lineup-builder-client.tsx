'use client';

import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { calculateLineupMetrics } from '@/lib/gameplay/lineup-metrics';
import {
  MANAGER_STYLE_LABEL,
  MANAGER_STYLE_TO_STATS,
  getManagerTopStyle,
  type ManagerStyleKey
} from '@/lib/gameplay/manager-influence';
import type { Manager, Player } from '@/types/domain';

type FormationKey = '4-3-3' | '4-2-3-1' | '4-4-2';

type SlotDefinition = {
  id: string;
  short: string;
  preferredPositions: string[];
  x: number;
  y: number;
};

type PlayersApiResponse = {
  data: Player[];
  meta: {
    source: 'mock' | 'mongo';
  };
};

type ManagersApiResponse = {
  data: Manager[];
};

type PersistedState = {
  formation: FormationKey;
  managerId: string;
  lineup: Record<string, Player | null>;
};

type SlotRole = 'gk' | 'defense' | 'midfield' | 'attack';

const STORAGE_KEY = 'efvn_lineup_builder_v2';

const ROLE_STATS: Record<SlotRole, string[]> = {
  gk: ['gkAwareness', 'gkReflexes', 'gkCatching', 'gkReach'],
  defense: ['defensiveAwareness', 'ballWinning', 'physicalContact', 'speed'],
  midfield: ['ballControl', 'tightPossession', 'lowPass', 'stamina'],
  attack: ['offensiveAwareness', 'finishing', 'speed', 'dribbling']
};

const FORMATIONS: Record<FormationKey, SlotDefinition[]> = {
  '4-3-3': [
    { id: 'GK', short: 'GK', preferredPositions: ['GK'], x: 50, y: 91 },
    { id: 'LB', short: 'LB', preferredPositions: ['LB'], x: 16, y: 75 },
    { id: 'CB1', short: 'CB', preferredPositions: ['CB'], x: 38, y: 76 },
    { id: 'CB2', short: 'CB', preferredPositions: ['CB'], x: 62, y: 76 },
    { id: 'RB', short: 'RB', preferredPositions: ['RB'], x: 84, y: 75 },
    { id: 'DMF', short: 'DMF', preferredPositions: ['DMF', 'CMF'], x: 50, y: 59 },
    { id: 'CMF1', short: 'CMF', preferredPositions: ['CMF', 'DMF'], x: 36, y: 50 },
    { id: 'CMF2', short: 'CMF', preferredPositions: ['CMF', 'AMF'], x: 64, y: 50 },
    { id: 'LWF', short: 'LWF', preferredPositions: ['LWF', 'LMF', 'SS'], x: 20, y: 31 },
    { id: 'CF', short: 'CF', preferredPositions: ['CF', 'SS'], x: 50, y: 24 },
    { id: 'RWF', short: 'RWF', preferredPositions: ['RWF', 'RMF', 'SS'], x: 80, y: 31 }
  ],
  '4-2-3-1': [
    { id: 'GK', short: 'GK', preferredPositions: ['GK'], x: 50, y: 91 },
    { id: 'LB', short: 'LB', preferredPositions: ['LB'], x: 16, y: 75 },
    { id: 'CB1', short: 'CB', preferredPositions: ['CB'], x: 38, y: 76 },
    { id: 'CB2', short: 'CB', preferredPositions: ['CB'], x: 62, y: 76 },
    { id: 'RB', short: 'RB', preferredPositions: ['RB'], x: 84, y: 75 },
    { id: 'DMF1', short: 'DMF', preferredPositions: ['DMF', 'CMF'], x: 40, y: 59 },
    { id: 'DMF2', short: 'DMF', preferredPositions: ['DMF', 'CMF'], x: 60, y: 59 },
    { id: 'LWF', short: 'LWF', preferredPositions: ['LWF', 'LMF', 'AMF'], x: 22, y: 37 },
    { id: 'AMF', short: 'AMF', preferredPositions: ['AMF', 'SS', 'CMF'], x: 50, y: 42 },
    { id: 'RWF', short: 'RWF', preferredPositions: ['RWF', 'RMF', 'AMF'], x: 78, y: 37 },
    { id: 'CF', short: 'CF', preferredPositions: ['CF', 'SS'], x: 50, y: 24 }
  ],
  '4-4-2': [
    { id: 'GK', short: 'GK', preferredPositions: ['GK'], x: 50, y: 91 },
    { id: 'LB', short: 'LB', preferredPositions: ['LB'], x: 16, y: 75 },
    { id: 'CB1', short: 'CB', preferredPositions: ['CB'], x: 38, y: 76 },
    { id: 'CB2', short: 'CB', preferredPositions: ['CB'], x: 62, y: 76 },
    { id: 'RB', short: 'RB', preferredPositions: ['RB'], x: 84, y: 75 },
    { id: 'LMF', short: 'LMF', preferredPositions: ['LMF', 'LWF', 'CMF'], x: 20, y: 50 },
    { id: 'CMF1', short: 'CMF', preferredPositions: ['CMF', 'DMF'], x: 40, y: 53 },
    { id: 'CMF2', short: 'CMF', preferredPositions: ['CMF', 'AMF'], x: 60, y: 53 },
    { id: 'RMF', short: 'RMF', preferredPositions: ['RMF', 'RWF', 'CMF'], x: 80, y: 50 },
    { id: 'CF1', short: 'CF', preferredPositions: ['CF', 'SS'], x: 42, y: 26 },
    { id: 'CF2', short: 'CF', preferredPositions: ['CF', 'SS'], x: 58, y: 26 }
  ]
};

function pickStat(player: Player, keys: string[]) {
  for (const key of keys) {
    const value = Number(player.stats.maxLevel[key] ?? player.stats.level1[key]);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function detectSlotRole(slot: SlotDefinition): SlotRole {
  if (slot.preferredPositions.includes('GK')) {
    return 'gk';
  }
  if (slot.preferredPositions.some((position) => ['CB', 'LB', 'RB'].includes(position))) {
    return 'defense';
  }
  if (slot.preferredPositions.some((position) => ['DMF', 'CMF', 'AMF', 'LMF', 'RMF'].includes(position))) {
    return 'midfield';
  }
  return 'attack';
}

function averageStat(player: Player, keys: string[]) {
  let total = 0;
  let count = 0;
  for (const key of keys) {
    const value = pickStat(player, [key]);
    if (Number.isFinite(value) && value > 0) {
      total += value;
      count += 1;
    }
  }
  if (count === 0) {
    return 0;
  }
  return total / count;
}

function scoreCandidateByManagerStyle(
  player: Player,
  slot: SlotDefinition,
  styleKey: ManagerStyleKey
) {
  const role = detectSlotRole(slot);
  const styleScore = averageStat(player, MANAGER_STYLE_TO_STATS[styleKey]);
  const roleScore = averageStat(player, ROLE_STATS[role]);
  const fitBonus = slot.preferredPositions.some((position) => player.positions.includes(position)) ? 14 : 0;
  const ovrBonus = Number(player.overall.max || 0) * 0.75;
  return styleScore * 0.65 + roleScore * 0.45 + ovrBonus + fitBonus;
}

function isFormationKey(value: string): value is FormationKey {
  return value === '4-3-3' || value === '4-2-3-1' || value === '4-4-2';
}

export function LineupBuilderClient() {
  const [formation, setFormation] = useState<FormationKey>('4-3-3');
  const [lineup, setLineup] = useState<Record<string, Player | null>>({});
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [minOvr, setMinOvr] = useState(75);
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [managerRecommendLoading, setManagerRecommendLoading] = useState(false);
  const [prefillPlayerId, setPrefillPlayerId] = useState('');
  const [prefillApplied, setPrefillApplied] = useState(false);

  const slots = useMemo(() => FORMATIONS[formation], [formation]);

  useEffect(() => {
    setLineup((previous) => {
      const next: Record<string, Player | null> = {};
      slots.forEach((slot) => {
        next[slot.id] = previous[slot.id] ?? null;
      });
      return next;
    });

    setActiveSlotId((previous) => {
      if (previous && slots.some((slot) => slot.id === previous)) {
        return previous;
      }
      return slots[0]?.id ?? null;
    });
  }, [slots]);

  useEffect(() => {
    const loadManagers = async () => {
      try {
        const response = await fetch('/api/managers?page=1&limit=200');
        if (!response.ok) {
          return;
        }

        const payload: ManagersApiResponse = await response.json();
        const list = Array.isArray(payload.data) ? payload.data : [];
        setManagers(list);
        setSelectedManagerId((previous) => {
          if (previous && list.some((manager) => manager.efhubId === previous)) {
            return previous;
          }
          return list[0]?.efhubId || '';
        });
      } catch {
        setManagers([]);
      }
    };

    void loadManagers();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const managerFromQuery = String(params.get('managerId') || '').trim();
    const formationFromQuery = String(params.get('formation') || '').trim();
    const playerFromQuery = String(params.get('playerId') || '').trim();

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as PersistedState;
        if (parsed.formation && isFormationKey(parsed.formation) && !formationFromQuery) {
          setFormation(parsed.formation);
        }
        if (parsed.managerId && !managerFromQuery) {
          setSelectedManagerId(parsed.managerId);
        }
        if (parsed.lineup && typeof parsed.lineup === 'object') {
          setLineup(parsed.lineup);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    if (formationFromQuery && isFormationKey(formationFromQuery)) {
      setFormation(formationFromQuery);
    }
    if (managerFromQuery) {
      setSelectedManagerId(managerFromQuery);
    }
    if (playerFromQuery) {
      setPrefillPlayerId(playerFromQuery);
      setPrefillApplied(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const payload: PersistedState = {
      formation,
      managerId: selectedManagerId,
      lineup
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [formation, selectedManagerId, lineup]);

  const selectedManager = useMemo(
    () => managers.find((manager) => manager.efhubId === selectedManagerId) || null,
    [managers, selectedManagerId]
  );

  useEffect(() => {
    if (!prefillPlayerId || prefillApplied) {
      return;
    }

    const applyPrefill = async () => {
      try {
        const response = await fetch(`/api/players/${encodeURIComponent(prefillPlayerId)}`);
        if (!response.ok) {
          setPrefillApplied(true);
          return;
        }

        const payload = (await response.json()) as { data?: Player };
        const player = payload.data;
        if (!player) {
          setPrefillApplied(true);
          return;
        }

        setLineup((previous) => {
          const alreadyInLineup = Object.values(previous).some(
            (item) => item?.efhubId === player.efhubId
          );
          if (alreadyInLineup) {
            return previous;
          }

          const bestEmptySlot = slots.find(
            (slot) =>
              !previous[slot.id] &&
              slot.preferredPositions.some((position) => player.positions.includes(position))
          );
          const fallbackEmptySlot = slots.find((slot) => !previous[slot.id]);
          const targetSlot = bestEmptySlot || fallbackEmptySlot;

          if (!targetSlot) {
            return previous;
          }

          return {
            ...previous,
            [targetSlot.id]: player
          };
        });

        setInfoMessage(`Đã thêm ${player.name} vào đội hình từ trang cầu thủ.`);
      } catch {
        // Ignore prefill errors to avoid blocking builder.
      } finally {
        setPrefillApplied(true);
      }
    };

    void applyPrefill();
  }, [prefillApplied, prefillPlayerId, slots]);

  const lineupEntries = useMemo(
    () =>
      slots.map((slot) => ({
        slot,
        player: lineup[slot.id] || null
      })),
    [lineup, slots]
  );

  const activeSlot = useMemo(
    () => slots.find((slot) => slot.id === activeSlotId) || null,
    [activeSlotId, slots]
  );

  const teamMetrics = useMemo(() => {
    return calculateLineupMetrics({
      lineupSlots: lineupEntries.map((entry) => ({
        slotId: entry.slot.id,
        preferredPositions: entry.slot.preferredPositions,
        player: entry.player
      })),
      manager: selectedManager
    });
  }, [lineupEntries, selectedManager]);

  const fetchPlayersForActiveSlot = async (searchText: string) => {
    if (!activeSlot) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setInfoMessage('');

    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '40',
        minOvr: String(minOvr),
        position: activeSlot.preferredPositions[0]
      });

      const trimmed = searchText.trim();
      if (trimmed) {
        params.set('q', trimmed);
      }

      const response = await fetch(`/api/players?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload: PlayersApiResponse = await response.json();
      setSearchResults(Array.isArray(payload.data) ? payload.data : []);
    } catch {
      setSearchError('Không thể tải danh sách cầu thủ cho vị trí này.');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (!activeSlot) {
      return;
    }
    void fetchPlayersForActiveSlot('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlotId, minOvr]);

  const assignPlayerToSlot = (slotId: string, player: Player) => {
    setLineup((previous) => {
      const next = { ...previous };
      const duplicateSlot = Object.entries(previous).find(
        ([key, value]) => value?.efhubId === player.efhubId && key !== slotId
      )?.[0];

      if (duplicateSlot) {
        next[duplicateSlot] = null;
      }

      next[slotId] = player;
      return next;
    });

    setInfoMessage(`Đã gán ${player.name} vào vị trí ${slotId}.`);
  };

  const clearActiveSlot = () => {
    if (!activeSlotId) {
      return;
    }
    setLineup((previous) => ({ ...previous, [activeSlotId]: null }));
    setInfoMessage(`Đã xoá cầu thủ ở vị trí ${activeSlotId}.`);
  };

  const clearAllSlots = () => {
    setLineup((previous) =>
      Object.keys(previous).reduce<Record<string, Player | null>>((acc, key) => {
        acc[key] = null;
        return acc;
      }, {})
    );
    setInfoMessage('Đã xoá toàn bộ đội hình.');
  };

  const autoFillLineup = async () => {
    setAutoFillLoading(true);
    setSearchError('');
    setInfoMessage('');

    try {
      const used = new Set(
        Object.values(lineup)
          .filter((player): player is Player => Boolean(player))
          .map((player) => player.efhubId)
      );

      const next: Record<string, Player | null> = { ...lineup };
      const uniquePositions = Array.from(
        new Set(slots.flatMap((slot) => slot.preferredPositions.map((position) => position.trim())))
      ).filter(Boolean);

      const positionPools = await Promise.all(
        uniquePositions.map(async (position) => {
          const params = new URLSearchParams({
            page: '1',
            limit: '40',
            minOvr: String(minOvr),
            position
          });
          const response = await fetch(`/api/players?${params.toString()}`);
          if (!response.ok) {
            return [position, [] as Player[]] as [string, Player[]];
          }
          const payload: PlayersApiResponse = await response.json();
          return [position, Array.isArray(payload.data) ? payload.data : []] as [
            string,
            Player[]
          ];
        })
      );

      const poolByPosition = new Map<string, Player[]>();
      positionPools.forEach(([position, pool]) => {
        poolByPosition.set(position, pool);
      });

      let insertedCount = 0;
      for (const slot of slots) {
        if (next[slot.id]) {
          continue;
        }

        let candidate: Player | undefined;
        for (const position of slot.preferredPositions) {
          const pool = poolByPosition.get(position) || [];
          candidate = pool.find((player) => !used.has(player.efhubId));
          if (candidate) {
            break;
          }
        }

        if (!candidate) {
          continue;
        }

        next[slot.id] = candidate;
        used.add(candidate.efhubId);
        insertedCount += 1;
      }

      setLineup(next);
      if (insertedCount === 0) {
        setInfoMessage('Không tìm được cầu thủ phù hợp theo bộ lọc hiện tại.');
      } else {
        setInfoMessage(`Đã tự điền thêm ${insertedCount} vị trí theo OVR cao nhất.`);
      }
    } catch {
      setSearchError('Không thể auto-fill đội hình.');
    } finally {
      setAutoFillLoading(false);
    }
  };

  const recommendLineupByManager = async () => {
    if (!selectedManager) {
      setInfoMessage('Vui lòng chọn HLV trước khi chạy gợi ý.');
      return;
    }

    setManagerRecommendLoading(true);
    setSearchError('');
    setInfoMessage('');

    try {
      const used = new Set(
        Object.values(lineup)
          .filter((player): player is Player => Boolean(player))
          .map((player) => player.efhubId)
      );

      const next: Record<string, Player | null> = { ...lineup };
      const styleKey = getManagerTopStyle(selectedManager);
      const uniquePositions = Array.from(
        new Set(slots.flatMap((slot) => slot.preferredPositions.map((position) => position.trim())))
      ).filter(Boolean);

      const positionPools = await Promise.all(
        uniquePositions.map(async (position) => {
          const params = new URLSearchParams({
            page: '1',
            limit: '80',
            minOvr: String(minOvr),
            sortBy: 'overall_desc',
            position
          });
          const response = await fetch(`/api/players?${params.toString()}`);
          if (!response.ok) {
            return [position, [] as Player[]] as [string, Player[]];
          }
          const payload: PlayersApiResponse = await response.json();
          return [position, Array.isArray(payload.data) ? payload.data : []] as [
            string,
            Player[]
          ];
        })
      );

      const poolByPosition = new Map<string, Player[]>();
      positionPools.forEach(([position, pool]) => {
        poolByPosition.set(position, pool);
      });

      let insertedCount = 0;
      for (const slot of slots) {
        if (next[slot.id]) {
          continue;
        }

        const candidatesById = new Map<string, Player>();
        for (const position of slot.preferredPositions) {
          const pool = poolByPosition.get(position) || [];
          pool.forEach((player) => {
            if (!used.has(player.efhubId)) {
              candidatesById.set(player.efhubId, player);
            }
          });
        }

        const candidates = Array.from(candidatesById.values());
        if (candidates.length === 0) {
          continue;
        }

        candidates.sort(
          (a, b) => scoreCandidateByManagerStyle(b, slot, styleKey) - scoreCandidateByManagerStyle(a, slot, styleKey)
        );

        const selected = candidates[0];
        next[slot.id] = selected;
        used.add(selected.efhubId);
        insertedCount += 1;
      }

      setLineup(next);
      if (insertedCount === 0) {
        setInfoMessage(
          `Không có cầu thủ phù hợp thêm theo ${MANAGER_STYLE_LABEL[styleKey]} với bộ lọc hiện tại.`
        );
      } else {
        setInfoMessage(
          `Đã gợi ý thêm ${insertedCount} vị trí theo HLV (${MANAGER_STYLE_LABEL[styleKey]}).`
        );
      }
    } catch {
      setSearchError('Không thể chạy gợi ý theo HLV.');
    } finally {
      setManagerRecommendLoading(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-12">
      <Card className="xl:col-span-8">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-2xl font-black">Xây Dựng Đội Hình</h2>
              <p className="text-sm text-muted-foreground">
                Chọn formation, gán cầu thủ theo vị trí và theo dõi độ gắn kết đội hình.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={formation}
                onChange={(event) => setFormation(event.target.value as FormationKey)}
              >
                {Object.keys(FORMATIONS).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <Button variant="secondary" onClick={clearActiveSlot} disabled={!activeSlotId}>
                Xoá Vị Trí
              </Button>
              <Button variant="secondary" onClick={clearAllSlots}>
                Xoá Tất Cả
              </Button>
              <Button onClick={autoFillLineup} disabled={autoFillLoading}>
                {autoFillLoading ? 'Đang Tự Điền...' : 'Tự Điền'}
              </Button>
              <Button
                variant="secondary"
                onClick={recommendLineupByManager}
                disabled={managerRecommendLoading || !selectedManager}
              >
                {managerRecommendLoading ? 'Đang Gợi Ý...' : 'Gợi Ý Theo HLV'}
              </Button>
            </div>
          </div>

          <div className="pitch-gradient pitch-lines relative h-[720px] overflow-hidden rounded-xl border border-outline-variant">
            <div className="absolute inset-[4%] rounded-xl border border-on-surface/30" />
            <div className="absolute left-1/2 top-[6%] h-[88%] w-px -translate-x-1/2 bg-white/20" />
            <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-on-surface/20" />

            {lineupEntries.map(({ slot, player }) => {
              const active = activeSlotId === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setActiveSlotId(slot.id)}
                  className={`absolute w-32 -translate-x-1/2 -translate-y-1/2 rounded-lg border px-2 py-2 text-center shadow-lg transition ${
                    active
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-on-surface/35 bg-black/45 text-on-surface hover:bg-black/60'
                  }`}
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wide opacity-85">
                    {slot.short}
                  </div>
                  <div className="line-clamp-1 text-xs font-semibold">
                    {player ? player.shortName : 'Trống'}
                  </div>
                  <div className="text-[11px] opacity-75">{player ? `OVR ${player.overall.max}` : slot.id}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6 xl:col-span-4">
        <Card>
          <CardContent className="space-y-3 p-4">
            <h3 className="text-lg font-bold">Chỉ Số Đội Hình</h3>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Cầu Thủ" value={`${teamMetrics.playerCount}/11`} />
              <Metric label="OVR Đội" value={String(teamMetrics.teamOvr)} />
              <Metric label="Tấn Công" value={String(teamMetrics.attack)} />
              <Metric label="Phòng Ngự" value={String(teamMetrics.defense)} />
              <Metric label="Thể Lực" value={String(teamMetrics.stamina)} />
              <Metric label="Độ Gắn Kết" value={`${teamMetrics.chemistry}%`} />
              <Metric label="Độ Hợp Style" value={`${teamMetrics.styleFit}%`} />
              <Metric label="Độ Hợp Chiến Thuật" value={`${teamMetrics.managerTacticalFit}%`} />
              <Metric label="Cân Bằng" value={`${teamMetrics.balance}%`} />
            </div>

            <div className="rounded-md border p-2 text-xs text-muted-foreground">
              Độ khớp vị trí: {teamMetrics.positionalFit}/11
            </div>
            {selectedManager ? (
              <div className="rounded-md border p-2 text-xs text-muted-foreground">
                Playstyle ưu tiên của HLV: {MANAGER_STYLE_LABEL[getManagerTopStyle(selectedManager)]}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <h3 className="text-lg font-bold">HLV</h3>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={selectedManagerId}
              onChange={(event) => setSelectedManagerId(event.target.value)}
            >
              {managers.map((manager) => (
                <option key={manager.efhubId} value={manager.efhubId}>
                  {manager.name} ({manager.formation})
                </option>
              ))}
            </select>

            {selectedManager ? (
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <StatBadge label="QC" value={selectedManager.playstyleProficiency.quickCounter} />
                <StatBadge label="POS" value={selectedManager.playstyleProficiency.possessionGame} />
                <StatBadge label="LBC" value={selectedManager.playstyleProficiency.longBallCounter} />
                <StatBadge label="OW" value={selectedManager.playstyleProficiency.outWide} />
                <StatBadge label="LB" value={selectedManager.playstyleProficiency.longBall} />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <h3 className="text-lg font-bold">Tìm & Gán Cầu Thủ</h3>
            <div className="text-xs text-muted-foreground">
              Slot đang chọn:{' '}
              <span className="font-semibold text-foreground">
                {activeSlot ? `${activeSlot.id} (${activeSlot.short})` : 'Chưa chọn'}
              </span>
            </div>

            <div className="space-y-2">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo tên cầu thủ..."
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Min OVR</label>
                <Input
                  type="number"
                  min={40}
                  max={110}
                  value={minOvr}
                  onChange={(event) =>
                    setMinOvr(clamp(Number.parseInt(event.target.value || '0', 10) || 75, 40, 110))
                  }
                />
              </div>

                <Button
                  className="w-full"
                  disabled={!activeSlot || searchLoading}
                  onClick={() => void fetchPlayersForActiveSlot(query)}
                >
                  {searchLoading ? 'Đang Tìm...' : 'Tìm Cầu Thủ'}
                </Button>
            </div>

            {searchError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive-foreground">
                {searchError}
              </div>
            ) : null}
            {infoMessage ? (
              <div className="rounded-md border border-primary/30 bg-primary/10 p-2 text-xs text-primary">
                {infoMessage}
              </div>
            ) : null}

            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {searchResults.map((player) => (
                <button
                  key={player.efhubId}
                  type="button"
                  className="w-full rounded-md border p-2 text-left hover:border-primary/60"
                  onClick={() => activeSlotId && assignPlayerToSlot(activeSlotId, player)}
                  disabled={!activeSlotId}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="line-clamp-1 text-sm font-semibold">{player.name}</div>
                    <Badge>OVR {player.overall.max}</Badge>
                  </div>
                  <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {player.positions.join(' / ')} | {player.club}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-2 p-4">
            <h3 className="text-lg font-bold">Danh Sách Đội Hình</h3>
            <div className="space-y-1 text-sm">
              {lineupEntries.map(({ slot, player }) => (
                <div key={slot.id} className="flex items-center justify-between rounded-md border px-2 py-1">
                  <span className="text-muted-foreground">{slot.id}</span>
                  <span className="line-clamp-1 max-w-[70%] text-right font-semibold">
                    {player ? `${player.shortName} (${player.overall.max})` : 'Trống'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background px-2 py-2 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-base font-bold">{value}</div>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background px-2 py-1">
      <div className="font-bold">{value}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
}
