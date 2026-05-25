'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  calculatePlayerProjection,
  emptyBuildAllocations
} from '@/lib/gameplay/player-calculation';
import type { Player } from '@/types/domain';
import { translatePosition, translateStat } from '@/lib/utils/translations';

type PlayerApiResult = {
  data?: Player;
};

type PlayerListApiResult = {
  data: Player[];
};

const STAT_ROWS = [
  ['Attacking Prowess', 'offensiveAwareness'],
  ['Ball Control', 'ballControl'],
  ['Dribbling', 'dribbling'],
  ['Tight Possession', 'tightPossession'],
  ['Finishing', 'finishing'],
  ['Low Pass', 'lowPass'],
  ['Lofted Pass', 'loftedPass'],
  ['Speed', 'speed'],
  ['Acceleration', 'acceleration'],
  ['Kicking Power', 'kickingPower'],
  ['Defensive Awareness', 'defensiveAwareness'],
  ['Ball Winning', 'ballWinning'],
  ['Aggression', 'aggression'],
  ['Stamina', 'stamina'],
  ['Physical Contact', 'physicalContact']
] as const;

const CONDITION_VALUES = ['A', 'B', 'C', 'D', 'E'] as const;

function statValue(stats: Record<string, number>, key: string) {
  const parsed = Number(stats[key]);
  return Number.isFinite(parsed) ? parsed : 0;
}

type CompareSlot = 'left' | 'right';

export function PlayerCompareClient({
  initialLeftId,
  initialRightId
}: {
  initialLeftId?: string;
  initialRightId?: string;
}) {
  const [leftQuery, setLeftQuery] = useState(initialLeftId || '');
  const [rightQuery, setRightQuery] = useState(initialRightId || '');

  const [leftPlayer, setLeftPlayer] = useState<Player | null>(null);
  const [rightPlayer, setRightPlayer] = useState<Player | null>(null);

  const [leftResults, setLeftResults] = useState<Player[]>([]);
  const [rightResults, setRightResults] = useState<Player[]>([]);
  const [loadingSlot, setLoadingSlot] = useState<CompareSlot | null>(null);
  const [error, setError] = useState('');

  const [leftLevel, setLeftLevel] = useState(1);
  const [rightLevel, setRightLevel] = useState(1);
  const [leftCondition, setLeftCondition] = useState('C');
  const [rightCondition, setRightCondition] = useState('C');

  const leftProjection = useMemo(() => {
    if (!leftPlayer) {
      return null;
    }
    return calculatePlayerProjection({
      player: leftPlayer,
      level: leftLevel,
      condition: leftCondition,
      allocations: emptyBuildAllocations(),
      applyBuildBonuses: true,
      applyConditionEffect: true
    });
  }, [leftCondition, leftLevel, leftPlayer]);

  const rightProjection = useMemo(() => {
    if (!rightPlayer) {
      return null;
    }
    return calculatePlayerProjection({
      player: rightPlayer,
      level: rightLevel,
      condition: rightCondition,
      allocations: emptyBuildAllocations(),
      applyBuildBonuses: true,
      applyConditionEffect: true
    });
  }, [rightCondition, rightLevel, rightPlayer]);

  useEffect(() => {
    if (leftPlayer) {
      return;
    }
    if (!initialLeftId?.trim()) {
      return;
    }
    void resolveById(initialLeftId, 'left');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLeftId]);

  useEffect(() => {
    if (rightPlayer) {
      return;
    }
    if (!initialRightId?.trim()) {
      return;
    }
    void resolveById(initialRightId, 'right');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRightId]);

  const applyPlayer = (slot: CompareSlot, player: Player) => {
    if (slot === 'left') {
      setLeftPlayer(player);
      setLeftLevel(Math.max(1, Math.min(player.levels.max, player.levels.current || player.levels.max)));
      setLeftCondition('C');
      return;
    }
    setRightPlayer(player);
    setRightLevel(Math.max(1, Math.min(player.levels.max, player.levels.current || player.levels.max)));
    setRightCondition('C');
  };

  const resolveById = async (idOrSlug: string, slot: CompareSlot) => {
    const keyword = idOrSlug.trim();
    if (!keyword) {
      return;
    }
    setLoadingSlot(slot);
    setError('');
    try {
      const response = await fetch(`/api/players/${encodeURIComponent(keyword)}`, {
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as PlayerApiResult;
      if (!payload.data) {
        throw new Error('empty player');
      }
      applyPlayer(slot, payload.data);
      if (slot === 'left') {
        setLeftResults([payload.data]);
      } else {
        setRightResults([payload.data]);
      }
    } catch {
      setError('Không tìm thấy cầu thủ theo ID/slug.');
      if (slot === 'left') {
        setLeftResults([]);
      } else {
        setRightResults([]);
      }
    } finally {
      setLoadingSlot(null);
    }
  };

  const searchByQuery = async (slot: CompareSlot) => {
    const query = (slot === 'left' ? leftQuery : rightQuery).trim();
    if (!query) {
      setError('Vui lòng nhập tên hoặc ID cầu thủ để so sánh.');
      return;
    }

    setLoadingSlot(slot);
    setError('');
    try {
      const params = new URLSearchParams({
        q: query,
        page: '1',
        limit: '10',
        minOvr: '1'
      });
      const response = await fetch(`/api/players?${params.toString()}`, {
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as PlayerListApiResult;
      const candidates = Array.isArray(payload.data) ? payload.data : [];

      if (candidates.length === 0) {
        await resolveById(query, slot);
        return;
      }

      if (slot === 'left') {
        setLeftResults(candidates);
      } else {
        setRightResults(candidates);
      }

      applyPlayer(slot, candidates[0]);
    } catch {
      setError('Không thể tìm kiếm cầu thủ để so sánh.');
      if (slot === 'left') {
        setLeftResults([]);
      } else {
        setRightResults([]);
      }
    } finally {
      setLoadingSlot(null);
    }
  };

  const swapSides = () => {
    const nextLeftPlayer = rightPlayer;
    const nextRightPlayer = leftPlayer;
    const nextLeftLevel = rightLevel;
    const nextRightLevel = leftLevel;
    const nextLeftCondition = rightCondition;
    const nextRightCondition = leftCondition;
    const nextLeftQuery = rightQuery;
    const nextRightQuery = leftQuery;
    const nextLeftResults = rightResults;
    const nextRightResults = leftResults;

    setLeftPlayer(nextLeftPlayer);
    setRightPlayer(nextRightPlayer);
    setLeftLevel(nextLeftLevel);
    setRightLevel(nextRightLevel);
    setLeftCondition(nextLeftCondition);
    setRightCondition(nextRightCondition);
    setLeftQuery(nextLeftQuery);
    setRightQuery(nextRightQuery);
    setLeftResults(nextLeftResults);
    setRightResults(nextRightResults);
  };

  const resetCompare = () => {
    setLeftPlayer(null);
    setRightPlayer(null);
    setLeftQuery('');
    setRightQuery('');
    setLeftResults([]);
    setRightResults([]);
    setLeftLevel(1);
    setRightLevel(1);
    setLeftCondition('C');
    setRightCondition('C');
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={swapSides}
          variant="secondary"
          className="rounded-xl border-on-surface/10 bg-white/5 text-on-surface hover:bg-white/10"
          disabled={!leftPlayer && !rightPlayer}
        >
          Đảo Vị Trí So Sánh
        </Button>
        <Button onClick={resetCompare} variant="secondary" className="rounded-xl border-on-surface/10 bg-white/5 text-on-surface hover:bg-white/10">
          Đặt Lại So Sánh
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive-foreground">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <ComparePanel
          slot="left"
          title="Cầu Thủ A"
          query={leftQuery}
          setQuery={setLeftQuery}
          loading={loadingSlot === 'left'}
          player={leftPlayer}
          results={leftResults}
          level={leftLevel}
          onLevelChange={setLeftLevel}
          condition={leftCondition}
          onConditionChange={setLeftCondition}
          onSearch={() => searchByQuery('left')}
          onPick={(player) => applyPlayer('left', player)}
        />
        <ComparePanel
          slot="right"
          title="Cầu Thủ B"
          query={rightQuery}
          setQuery={setRightQuery}
          loading={loadingSlot === 'right'}
          player={rightPlayer}
          results={rightResults}
          level={rightLevel}
          onLevelChange={setRightLevel}
          condition={rightCondition}
          onConditionChange={setRightCondition}
          onSearch={() => searchByQuery('right')}
          onPick={(player) => applyPlayer('right', player)}
        />
      </div>

      <section className="rounded-xl bg-surface-container p-6">
          <p className="stitch-label-accent">Compare</p>
          <h2 className="stitch-section-title mt-2">Bảng so sánh chỉ số</h2>
          {!leftProjection || !rightProjection ? (
            <div className="rounded-md border border-on-surface/10 bg-white/5 p-3 text-sm text-on-surface-variant">
              Chọn đủ 2 cầu thủ để hiển thị bảng so sánh chi tiết.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-2 rounded-md border border-on-surface/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase text-on-surface">
                <div>Stat</div>
                <div className="text-right">{leftProjection.overall} OVR</div>
                <div className="text-right">{rightProjection.overall} OVR</div>
                <div className="text-right">Chênh Lệch</div>
              </div>
              {STAT_ROWS.map(([label, statKey]) => {
                const left = statValue(leftProjection.stats, statKey);
                const right = statValue(rightProjection.stats, statKey);
                const diff = left - right;
                return (
                  <div
                    key={label}
                    className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-2 rounded-md border border-on-surface/10 bg-white/5 px-3 py-2 text-sm"
                  >
                    <div className="text-on-surface-variant">{translateStat(label)}</div>
                    <div className="text-right font-semibold text-on-surface">{left}</div>
                    <div className="text-right font-semibold text-on-surface">{right}</div>
                    <div
                      className={`text-right font-semibold ${
                        diff > 0 ? 'text-primary' : diff < 0 ? 'text-error' : 'text-on-surface-variant'
                      }`}
                    >
                      {diff > 0 ? `+${diff}` : diff}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </section>
    </div>
  );
}

function ComparePanel({
  slot,
  title,
  query,
  setQuery,
  loading,
  player,
  results,
  level,
  onLevelChange,
  condition,
  onConditionChange,
  onSearch,
  onPick
}: {
  slot: CompareSlot;
  title: string;
  query: string;
  setQuery: (value: string) => void;
  loading: boolean;
  player: Player | null;
  results: Player[];
  level: number;
  onLevelChange: (value: number) => void;
  condition: string;
  onConditionChange: (value: string) => void;
  onSearch: () => void;
  onPick: (player: Player) => void;
}) {
  const maxLevel = Math.max(1, Number(player?.levels.max || 1));
  const boundedLevel = Math.max(1, Math.min(maxLevel, level));

  useEffect(() => {
    if (boundedLevel !== level) {
      onLevelChange(boundedLevel);
    }
  }, [boundedLevel, level, onLevelChange]);

  return (
    <section className="rounded-xl bg-surface-container p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="stitch-section-title">{title}</h2>
          <span className="stitch-chip text-[10px] px-2 py-0.5">{slot.toUpperCase()}</span>
        </div>

        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onSearch();
              }
            }}
            placeholder="Nhập tên hoặc ID/slug cầu thủ"
            className="h-11 border-on-surface/10 bg-white/5 text-on-surface placeholder:text-outline"
          />
          <Button onClick={onSearch} className="rounded-xl" disabled={loading}>
            {loading ? 'Đang tìm...' : 'Tìm'}
          </Button>
        </div>

        {player ? (
          <div className="rounded-lg bg-surface-container-high/60 p-4">
            <div className="mb-3 flex gap-3">
              <div className="relative h-24 w-20 overflow-hidden rounded-md bg-secondary">
                <Image src={player.images.card} alt={player.name} fill className="object-cover" />
              </div>
              <div className="space-y-1">
                <div className="text-lg font-black text-on-surface">{player.name}</div>
                <div className="text-xs text-on-surface-variant">
                  {translatePosition(player.positions[0])} | {player.club}
                </div>
                <Link
                  href={`/cau-thu/${player.efhubId}`}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Mở trang chi tiết
                </Link>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-on-surface/10 bg-white/5 p-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">
                  Level {boundedLevel}/{maxLevel}
                </span>
              </div>
              <Slider
                min={1}
                max={maxLevel}
                step={1}
                value={[boundedLevel]}
                onValueChange={(values) => onLevelChange(values[0] || 1)}
              />
              <div className="grid grid-cols-5 gap-1">
                {CONDITION_VALUES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onConditionChange(item)}
                    className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                      condition === item
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-on-surface/10 bg-white/5 text-on-surface-variant'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-on-surface/10 bg-white/5 p-3 text-sm text-on-surface-variant">
            Chưa chọn cầu thủ cho cột so sánh này.
          </div>
        )}

        {results.length > 0 ? (
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {results.map((candidate) => (
              <button
                key={`${slot}-${candidate.efhubId}`}
                type="button"
                className={`w-full rounded-xl border p-2 text-left text-sm ${
                  player?.efhubId === candidate.efhubId
                    ? 'border-primary bg-primary/10'
                    : 'border-on-surface/10 bg-white/5 hover:border-primary/60'
                }`}
                onClick={() => onPick(candidate)}
              >
                <div className="font-semibold text-on-surface">{candidate.name}</div>
                <div className="text-xs text-on-surface-variant">
                  {translatePosition(candidate.positions[0])} | OVR {candidate.overall.max} | {candidate.club}
                </div>
              </button>
            ))}
          </div>
        ) : null}
    </section>
  );
}
