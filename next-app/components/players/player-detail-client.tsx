'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  BUILD_ORDER,
  calculatePlayerProjection,
  deriveStatsAtLevel,
  decodeBuildAllocations,
  emptyBuildAllocations,
  encodeBuildAllocations,
  generateBuildPreset
} from '@/lib/gameplay/player-calculation';
import type { BuildCategory, Manager, Player, PlayerBuild } from '@/types/domain';
import {
  translatePosition,
  translateSkill,
  translatePlaystyle,
  translateStat
} from '@/lib/utils/translations';

const STAT_ROWS = [
  ['Attacking Prowess', ['offensiveAwareness']],
  ['Ball Control', ['ballControl']],
  ['Dribbling', ['dribbling']],
  ['Tight Possession', ['tightPossession']],
  ['Finishing', ['finishing']],
  ['Low Pass', ['lowPass']],
  ['Lofted Pass', ['loftedPass']],
  ['Speed', ['speed']],
  ['Acceleration', ['acceleration']],
  ['Kicking Power', ['kickingPower']],
  ['Tackling', ['ballWinning']],
  ['Interception', ['trackingBack']],
  ['Defensive Awareness', ['defensiveAwareness']],
  ['Aggression', ['aggression']],
  ['Stamina', ['stamina']],
  ['Physical Contact', ['physicalContact']],
  ['Jump', ['jump']],
  ['Balance', ['balance']]
] as const;

const BUILD_LABELS: Record<BuildCategory, string> = {
  shooting: 'Shooting (Sút bóng)',
  passing: 'Passing (Chuyền bóng)',
  dribbling: 'Dribbling (Rê bóng)',
  dexterity: 'Dexterity (Khéo léo / Tăng tốc)',
  lowerBodyStrength: 'Lower Body Strength (Sức mạnh thân dưới / Lực chân)',
  aerialStrength: 'Aerial Strength (Không chiến / Tranh chấp)',
  defending: 'Defending (Phòng ngự)',
  gk1: 'GK 1 (Phản xạ / Bắt bóng)',
  gk2: 'GK 2 (Đoạt bóng / Tầm với)',
  gk3: 'GK 3 (Nhận thức / Cản phá)'
};

const CORE_STAT_KEYS = new Set(
  [
    ...STAT_ROWS.flatMap(([, keys]) => keys),
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

type SavedBuild = {
  id: string;
  name: string;
  level: number;
  condition: string;
  allocations: Record<BuildCategory, number>;
  createdAt: string;
};

type ManagersApiResult = {
  data: Manager[];
};

type PlayersApiResult = {
  data: Player[];
};

type PlayerBuildsApiResult = {
  data: PlayerBuild[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    source: 'mock' | 'mongo';
  };
};

function pickStat(stats: Record<string, number>, keys: readonly string[]) {
  for (const key of keys) {
    const value = Number(stats[key]);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return 0;
}

function managerStyleLabel(styleKey: string | null | undefined) {
  if (styleKey === 'quickCounter') {
    return 'Quick Counter';
  }
  if (styleKey === 'possessionGame') {
    return 'Possession Game';
  }
  if (styleKey === 'longBallCounter') {
    return 'Long Ball Counter';
  }
  if (styleKey === 'outWide') {
    return 'Out Wide';
  }
  if (styleKey === 'longBall') {
    return 'Long Ball';
  }
  return 'Không có';
}

export function PlayerDetailClient({ player }: { player: Player }) {
  const [level, setLevel] = useState(() => {
    const maxLevel = Math.max(1, player.levels.max);
    const currentLevel = Number(player.levels.current || player.levels.max);
    return Math.min(maxLevel, Math.max(1, currentLevel));
  });
  const [condition, setCondition] = useState(String(player.condition.form || 'C').toUpperCase());
  const [allocations, setAllocations] = useState<Record<BuildCategory, number>>(() =>
    emptyBuildAllocations()
  );
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>([]);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [myBuildsOpen, setMyBuildsOpen] = useState(false);
  const [publishedBuilds, setPublishedBuilds] = useState<PlayerBuild[]>([]);
  const [communityBuilds, setCommunityBuilds] = useState<PlayerBuild[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [communityError, setCommunityError] = useState('');
  const [publishedLoading, setPublishedLoading] = useState(false);
  const [publishedError, setPublishedError] = useState('');
  const [buildActionId, setBuildActionId] = useState('');
  const [buildActionMessage, setBuildActionMessage] = useState('');
  const [publishingBuild, setPublishingBuild] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [compareQuery, setCompareQuery] = useState('');
  const [comparePlayer, setComparePlayer] = useState<Player | null>(null);
  const [compareResults, setCompareResults] = useState<Player[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState('');
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [enableBuildBonuses, setEnableBuildBonuses] = useState(true);
  const [enableConditionEffect, setEnableConditionEffect] = useState(true);
  const selectedManager = useMemo(
    () => managers.find((item) => item.efhubId === selectedManagerId) || null,
    [managers, selectedManagerId]
  );

  const computed = useMemo(() => {
    return calculatePlayerProjection({
      player,
      level,
      condition,
      allocations,
      manager: selectedManager,
      applyBuildBonuses: enableBuildBonuses,
      applyConditionEffect: enableConditionEffect
    });
  }, [
    allocations,
    condition,
    enableBuildBonuses,
    enableConditionEffect,
    level,
    player,
    selectedManager
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const lv = Number.parseInt(String(params.get('lv') || ''), 10);
    if (Number.isFinite(lv) && lv > 0) {
      setLevel(lv);
    }

    const conditionRaw = String(params.get('condition') || '').toUpperCase();
    if (['A', 'B', 'C', 'D', 'E'].includes(conditionRaw)) {
      setCondition(conditionRaw);
    }

    const buildRaw = params.get('build');
    if (buildRaw) {
      setAllocations(decodeBuildAllocations(buildRaw));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const storageKey = `efvn_player_builds_${player.efhubId}`;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as SavedBuild[];
      if (Array.isArray(parsed)) {
        setSavedBuilds(parsed);
      }
    } catch {
      setSavedBuilds([]);
    }
  }, [player.efhubId]);

  useEffect(() => {
    const loadManagers = async () => {
      try {
        const response = await fetch('/api/managers?limit=200&page=1');
        if (!response.ok) {
          return;
        }
        const payload: ManagersApiResult = await response.json();
        const list = Array.isArray(payload.data) ? payload.data : [];
        setManagers(list);
        setSelectedManagerId((previous) =>
          previous && list.some((manager) => manager.efhubId === previous) ? previous : ''
        );
      } catch {
        setManagers([]);
        setSelectedManagerId('');
      }
    };
    void loadManagers();
  }, []);

  const fetchCommunityBuilds = async (forceRefresh = false) => {
    setCommunityLoading(true);
    setCommunityError('');
    try {
      const params = new URLSearchParams({
        scope: 'community',
        page: '1',
        limit: '20'
      });
      if (forceRefresh) {
        params.set('_', String(Date.now()));
      }

      const response = await fetch(
        `/api/players/${encodeURIComponent(player.efhubId)}/builds?${params.toString()}`,
        { cache: 'no-store' }
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as PlayerBuildsApiResult;
      setCommunityBuilds(Array.isArray(payload.data) ? payload.data : []);
    } catch {
      setCommunityBuilds([]);
      setCommunityError('Không thể tải build cộng đồng.');
    } finally {
      setCommunityLoading(false);
    }
  };

  const fetchPublishedBuilds = async (forceRefresh = false) => {
    setPublishedLoading(true);
    setPublishedError('');
    try {
      const params = new URLSearchParams({
        scope: 'mine',
        page: '1',
        limit: '20'
      });
      if (forceRefresh) {
        params.set('_', String(Date.now()));
      }

      const response = await fetch(
        `/api/players/${encodeURIComponent(player.efhubId)}/builds?${params.toString()}`,
        { cache: 'no-store' }
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as PlayerBuildsApiResult;
      setPublishedBuilds(Array.isArray(payload.data) ? payload.data : []);
    } catch {
      setPublishedBuilds([]);
      setPublishedError('Không thể tải build đã đăng của bạn.');
    } finally {
      setPublishedLoading(false);
    }
  };

  useEffect(() => {
    void fetchCommunityBuilds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.efhubId]);

  useEffect(() => {
    void fetchPublishedBuilds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.efhubId]);

  const extraStatEntries = useMemo(() => {
    const merged: Record<string, number | string> = {
      ...(player.extra?.otherStats || {})
    };

    Object.entries(computed.stats).forEach(([key, value]) => {
      if (CORE_STAT_KEYS.has(key.toLowerCase())) {
        return;
      }
      if (!(key in merged)) {
        merged[key] = value;
      }
    });

    return Object.entries(merged).sort((a, b) => a[0].localeCompare(b[0]));
  }, [computed.stats, player.extra]);

  const comparePreview = useMemo(() => {
    if (!comparePlayer) {
      return null;
    }
    const base = deriveStatsAtLevel(comparePlayer, level);
    return {
      name: comparePlayer.name,
      overall: base.overall,
      stats: base.stats
    };
  }, [comparePlayer, level]);

  const saveBuild = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const nextBuild: SavedBuild = {
      id: `build-${Date.now()}`,
      name: `Build ${savedBuilds.length + 1}`,
      level,
      condition,
      allocations,
      createdAt: new Date().toISOString()
    };

    const merged = [nextBuild, ...savedBuilds].slice(0, 20);
    setSavedBuilds(merged);
    window.localStorage.setItem(`efvn_player_builds_${player.efhubId}`, JSON.stringify(merged));
    setMyBuildsOpen(true);
  };

  const publishBuildToCommunity = async () => {
    setBuildActionMessage('');
    setPublishingBuild(true);
    try {
      const response = await fetch(`/api/players/${encodeURIComponent(player.efhubId)}/builds`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          name: `Build Cộng Đồng ${Date.now()}`,
          level,
          condition,
          allocations,
          pointsUsed: computed.pointsUsed,
          visibility: 'public',
          source: 'user',
          authorName: 'EFVN User',
          authorCountry: 'Vietnam'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await fetchCommunityBuilds(true);
      await fetchPublishedBuilds(true);
      setCommunityOpen(true);
      setMyBuildsOpen(true);
      setBuildActionMessage('Đã đăng build lên cộng đồng.');
    } catch {
      setCommunityError('Không thể đăng build lên cộng đồng.');
    } finally {
      setPublishingBuild(false);
    }
  };

  const updatePublishedBuildVisibility = async (build: PlayerBuild) => {
    if (buildActionId) {
      return;
    }

    setBuildActionId(build.id);
    setBuildActionMessage('');
    setPublishedError('');
    try {
      const nextVisibility = build.visibility === 'public' ? 'private' : 'public';
      const response = await fetch(
        `/api/players/${encodeURIComponent(player.efhubId)}/builds/${encodeURIComponent(build.id)}`,
        {
          method: 'PATCH',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            visibility: nextVisibility
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await fetchPublishedBuilds(true);
      await fetchCommunityBuilds(true);
      setBuildActionMessage(
        nextVisibility === 'public'
          ? 'Đã chuyển build sang công khai.'
          : 'Đã chuyển build sang riêng tư.'
      );
    } catch {
      setPublishedError('Không thể cập nhật trạng thái build đã đăng.');
    } finally {
      setBuildActionId('');
    }
  };

  const deletePublishedBuild = async (build: PlayerBuild) => {
    if (buildActionId) {
      return;
    }

    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(`Xoá build "${build.name}" khỏi cộng đồng?`);
      if (!confirmed) {
        return;
      }
    }

    setBuildActionId(build.id);
    setBuildActionMessage('');
    setPublishedError('');
    try {
      const response = await fetch(
        `/api/players/${encodeURIComponent(player.efhubId)}/builds/${encodeURIComponent(build.id)}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await fetchPublishedBuilds(true);
      await fetchCommunityBuilds(true);
      setBuildActionMessage('Đã xoá build đã đăng.');
    } catch {
      setPublishedError('Không thể xoá build đã đăng.');
    } finally {
      setBuildActionId('');
    }
  };

  const shareBuild = async () => {
    if (typeof window === 'undefined') {
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('lv', String(level));
    url.searchParams.set('condition', condition);
    url.searchParams.set('build', encodeBuildAllocations(allocations));

    try {
      await navigator.clipboard.writeText(url.toString());
    } catch {
      window.prompt('Sao chép link build', url.toString());
    }
  };

  const loadBuild = (build: SavedBuild) => {
    setLevel(build.level);
    setCondition(build.condition);
    setAllocations(build.allocations);
  };

  const loadCommunityBuild = (build: PlayerBuild) => {
    setLevel(Math.max(1, Math.min(computed.maxLevel, Number(build.level || 1))));
    setCondition(['A', 'B', 'C', 'D', 'E'].includes(build.condition) ? build.condition : 'C');
    setAllocations(build.allocations);
  };

  const changeAllocation = (category: BuildCategory, delta: number) => {
    setAllocations((prev) => {
      const nextValue = Math.max(0, Number(prev[category] || 0) + delta);
      const next = { ...prev, [category]: nextValue };
      const used = BUILD_ORDER.reduce((sum, key) => sum + Math.max(0, Number(next[key] || 0)), 0);
      if (used > computed.pointsCap) {
        return prev;
      }
      return next;
    });
  };

  const applyPreset = (
    preset: 'smart' | 'attack' | 'creative' | 'defense' | 'goalkeeper'
  ) => {
    const next = generateBuildPreset(player, preset, computed.pointsCap);
    setAllocations(next);
  };

  const searchComparePlayer = async () => {
    setCompareError('');
    setCompareResults([]);

    const keyword = compareQuery.trim();
    if (!keyword) {
      setCompareError('Nhập tên hoặc ID cầu thủ để so sánh.');
      return;
    }

    setCompareLoading(true);
    try {
      const params = new URLSearchParams({
        q: keyword,
        page: '1',
        limit: '8',
        minOvr: '1'
      });
      const listResponse = await fetch(`/api/players?${params.toString()}`);
      if (listResponse.ok) {
        const listPayload = (await listResponse.json()) as PlayersApiResult;
        const candidates = Array.isArray(listPayload.data) ? listPayload.data : [];

        if (candidates.length > 0) {
          setCompareResults(candidates);
          setComparePlayer(candidates[0]);
          return;
        }
      }

      const exactResponse = await fetch(`/api/players/${encodeURIComponent(keyword)}`);
      if (!exactResponse.ok) {
        setCompareError('Không tìm thấy cầu thủ để so sánh.');
        return;
      }

      const payload = (await exactResponse.json()) as { data?: Player };
      if (!payload.data) {
        setCompareError('Dữ liệu so sánh không hợp lệ.');
        return;
      }
      setComparePlayer(payload.data);
      setCompareResults([payload.data]);
    } catch {
      setCompareError('Lỗi kết nối khi tìm cầu thủ so sánh.');
    } finally {
      setCompareLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setCompareOpen((value) => !value)}>
          So Sánh
        </Button>
        <Link href={`/so-sanh?left=${encodeURIComponent(player.efhubId)}`}>
          <Button variant="secondary">Mở Trang So Sánh</Button>
        </Link>
        <Button variant="secondary" onClick={() => setMyBuildsOpen((value) => !value)}>
          Build Của Tôi
        </Button>
        <Button variant="secondary" onClick={() => setCommunityOpen((value) => !value)}>
          Build Cộng Đồng
        </Button>
        <Button onClick={saveBuild}>Lưu Build</Button>
        <Button variant="secondary" onClick={publishBuildToCommunity} disabled={publishingBuild}>
          {publishingBuild ? 'Đang Đăng...' : 'Đăng Lên Cộng Đồng'}
        </Button>
        <Button variant="secondary" onClick={shareBuild}>
          Chia Sẻ Link
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
          Chụp Ảnh
        </Button>
        <Button variant="secondary" onClick={() => setSettingsOpen((value) => !value)}>
          Tùy Chỉnh
        </Button>
        <Link href={`/doi-hinh?playerId=${encodeURIComponent(player.efhubId)}`}>
          <Button variant="secondary">Thêm Vào Đội Hình</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <CardContent className="p-4">
            <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-lg bg-secondary">
              <Image src={player.images.card} alt={player.name} fill className="object-cover" />
            </div>

            <Badge>{player.cardType}</Badge>
            <h1 className="mt-3 text-3xl font-black uppercase tracking-tight">{player.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {translatePosition(player.positions[0])} | {player.club}
            </p>

            <div className="mt-4 rounded-lg border bg-background p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cấp Độ</span>
                <span className="font-bold">
                  {computed.level}/{computed.maxLevel}
                </span>
              </div>
              <Slider
                min={1}
                max={computed.maxLevel}
                step={1}
                value={[computed.level]}
                onValueChange={(values) => setLevel(values[0] || 1)}
              />
            </div>

            <div className="mt-4 rounded-lg border bg-background p-4">
              <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                Tình Trạng
              </div>
              <div className="grid grid-cols-5 gap-2">
                {['A', 'B', 'C', 'D', 'E'].map((grade) => (
                  <ConditionPill
                    key={grade}
                    grade={grade}
                    active={condition === grade}
                    onClick={() => setCondition(grade)}
                  />
                ))}
              </div>
            </div>

            {player.bio ? (
              <div className="mt-4 rounded-lg border bg-background p-4">
                <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                  Thông Tin Cầu Thủ
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {player.bio.age ? <MetaPill label="Tuổi" value={String(player.bio.age)} /> : null}
                  {player.bio.heightCm ? (
                    <MetaPill label="Chiều cao" value={`${player.bio.heightCm} cm`} />
                  ) : null}
                  {player.bio.weightKg ? (
                    <MetaPill label="Cân nặng" value={`${player.bio.weightKg} kg`} />
                  ) : null}
                  {player.bio.foot ? <MetaPill label="Chân thuận" value={player.bio.foot} /> : null}
                  <MetaPill label="Form" value={player.condition.form} />
                  <MetaPill
                    label="Kháng chấn thương"
                    value={String(player.condition.injuryResistance)}
                  />
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-8">
          <CardContent className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Chỉ Số Cầu Thủ</h2>
              <div className="text-right">
                <div className="text-3xl font-black text-primary">{computed.overall}</div>
                <div className="text-xs text-muted-foreground">
                  Điểm Build: {computed.pointsUsed}/{computed.pointsCap}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {STAT_ROWS.map(([label, keys]) => {
                const value = pickStat(computed.stats, keys);
                const compareValue = comparePreview ? pickStat(comparePreview.stats, keys) : null;
                const diff =
                  compareValue !== null && Number.isFinite(compareValue)
                    ? value - compareValue
                    : null;

                return (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{translateStat(label)}</span>
                      <span className="font-semibold">
                        {value}
                        {diff !== null ? (
                          <span
                            className={`ml-2 text-xs ${
                              diff > 0
                                ? 'text-primary'
                                : diff < 0
                                  ? 'text-error'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border bg-background p-4">
                <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                  Skills
                </div>
                <div className="flex flex-wrap gap-2">
                  {player.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {translateSkill(skill)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border bg-background p-4">
                <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                  Playstyles
                </div>
                <div className="flex flex-wrap gap-2">
                  {player.playstyles.map((style) => (
                    <Badge key={style} variant="secondary">
                      {translatePlaystyle(style)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {(player.extra?.additionalSkills.length || 0) > 0 ||
            (player.extra?.comPlayingStyles.length || 0) > 0 ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {(player.extra?.additionalSkills.length || 0) > 0 ? (
                  <div className="rounded-lg border bg-background p-4">
                    <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                      Kỹ Năng Bổ Sung
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(player.extra?.additionalSkills || []).map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {translateSkill(skill)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {(player.extra?.comPlayingStyles.length || 0) > 0 ? (
                  <div className="rounded-lg border bg-background p-4">
                    <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                      Lối Chơi AI (Com)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(player.extra?.comPlayingStyles || []).map((style) => (
                        <Badge key={style} variant="secondary">
                          {translatePlaystyle(style)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {(player.extra?.playerModel && Object.keys(player.extra.playerModel).length > 0) ||
            (player.extra?.physics && Object.keys(player.extra.physics).length > 0) ||
            extraStatEntries.length > 0 ? (
              <div className="mt-4 grid gap-4 xl:grid-cols-3">
                {player.extra?.playerModel && Object.keys(player.extra.playerModel).length > 0 ? (
                  <div className="rounded-lg border bg-background p-4">
                    <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                      Mô Hình Cầu Thủ
                    </div>
                    <KeyValueGrid entries={Object.entries(player.extra.playerModel)} />
                  </div>
                ) : null}

                {player.extra?.physics && Object.keys(player.extra.physics).length > 0 ? (
                  <div className="rounded-lg border bg-background p-4">
                    <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                      Chỉ Số Thể Chất
                    </div>
                    <KeyValueGrid entries={Object.entries(player.extra.physics)} />
                  </div>
                ) : null}

                {extraStatEntries.length > 0 ? (
                  <div className="rounded-lg border bg-background p-4">
                    <div className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                      Chỉ Số Khác
                    </div>
                    <KeyValueGrid entries={extraStatEntries} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardContent className="space-y-3 p-4">
            <h3 className="text-lg font-bold">Phân Bổ Điểm</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary" onClick={() => applyPreset('smart')}>
                Tối Ưu Smart
              </Button>
              <Button size="sm" variant="secondary" onClick={() => applyPreset('attack')}>
                Tối Ưu Attack
              </Button>
              <Button size="sm" variant="secondary" onClick={() => applyPreset('creative')}>
                Tối Ưu Creative
              </Button>
              <Button size="sm" variant="secondary" onClick={() => applyPreset('defense')}>
                Tối Ưu Defense
              </Button>
              <Button size="sm" variant="secondary" onClick={() => applyPreset('goalkeeper')}>
                Tối Ưu GK
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setAllocations(emptyBuildAllocations())}>
                Đặt Lại
              </Button>
            </div>
            {BUILD_ORDER.map((category) => (
              <div key={category} className="flex items-center justify-between rounded-md border p-2">
                <span className="text-sm">{BUILD_LABELS[category]}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => changeAllocation(category, -1)}
                  >
                    -
                  </Button>
                  <span className="min-w-7 text-center text-sm font-bold">
                    {allocations[category] || 0}
                  </span>
                  <Button size="sm" onClick={() => changeAllocation(category, 1)}>
                    +
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <h3 className="text-lg font-bold">HLV & Bản Đồ Vị Trí</h3>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={selectedManagerId}
              onChange={(event) => setSelectedManagerId(event.target.value)}
            >
              <option value="">Không áp HLV</option>
              {managers.map((manager) => (
                <option key={manager.efhubId} value={manager.efhubId}>
                  {manager.name} ({manager.formation})
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Bonus HLV hiện tại: +{selectedManager ? computed.managerBonus : 0} cho điểm phù hợp vị trí.
            </p>
            {selectedManager ? (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  Boost theo style {managerStyleLabel(computed.managerStyleKey)}: +
                  {computed.managerStatsBonus} vào nhóm chỉ số phù hợp.
                </p>
                <p>
                  Độ hợp style: {computed.managerFitScore}% | Độ hợp vai trò:{' '}
                  {computed.managerRoleAffinity}% | Điểm chiến thuật: {computed.managerInfluenceScore}%
                </p>
              </div>
            ) : null}
            <div className="grid grid-cols-4 gap-2 text-xs">
              {Object.entries(computed.positionRatings).map(([position, rating]) => (
                <div key={position} className="rounded-md border p-2 text-center">
                  <div className="font-bold">{translatePosition(position)}</div>
                  <div className="text-primary">{rating}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <h3 className="text-lg font-bold">Công Cụ</h3>

            {settingsOpen ? (
              <div className="space-y-2 rounded-md border p-3 text-sm">
                <label className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Áp điểm Build vào chỉ số</span>
                  <input
                    type="checkbox"
                    checked={enableBuildBonuses}
                    onChange={(event) => setEnableBuildBonuses(event.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Áp Condition vào chỉ số</span>
                  <input
                    type="checkbox"
                    checked={enableConditionEffect}
                    onChange={(event) => setEnableConditionEffect(event.target.checked)}
                  />
                </label>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setAllocations(emptyBuildAllocations())}
                >
                  Đặt Lại Build
                </Button>
              </div>
            ) : null}

            {myBuildsOpen ? (
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase text-muted-foreground">Build Của Tôi</div>
                {savedBuilds.length === 0 ? (
                  <div className="rounded-md border p-3 text-sm text-muted-foreground">
                    Chưa có build đã lưu.
                  </div>
                ) : (
                  savedBuilds.map((build) => (
                    <button
                      type="button"
                      key={build.id}
                      className="w-full rounded-md border p-2 text-left text-sm hover:border-primary/60"
                      onClick={() => loadBuild(build)}
                    >
                      <div className="font-semibold">{build.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Lv {build.level} | Tình Trạng {build.condition}
                      </div>
                    </button>
                  ))
                )}

                <div className="pt-2 text-xs font-semibold uppercase text-muted-foreground">
                  Build Đã Đăng
                </div>
                {buildActionMessage ? (
                  <div className="rounded-md border border-primary/30 bg-primary/10 p-2 text-xs text-foreground">
                    {buildActionMessage}
                  </div>
                ) : null}
                {publishedLoading ? (
                  <div className="rounded-md border p-3 text-sm text-muted-foreground">
                    Đang tải build đã đăng...
                  </div>
                ) : publishedError ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive-foreground">
                    {publishedError}
                  </div>
                ) : publishedBuilds.length === 0 ? (
                  <div className="rounded-md border p-3 text-sm text-muted-foreground">
                    Bạn chưa đăng build nào cho cầu thủ này.
                  </div>
                ) : (
                  publishedBuilds.map((build) => (
                    <div key={build.id} className="space-y-2 rounded-md border p-2 text-sm">
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => loadCommunityBuild(build)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold">{build.name}</div>
                          <Badge variant={build.visibility === 'public' ? 'default' : 'secondary'}>
                            {build.visibility === 'public' ? 'Công Khai' : 'Riêng Tư'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Lv {build.level} | Tình Trạng {build.condition} | ♥ {build.likes}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {encodeBuildAllocations(build.allocations)}
                        </div>
                      </button>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => loadCommunityBuild(build)}
                        >
                          Áp Dụng
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={buildActionId === build.id}
                          onClick={() => updatePublishedBuildVisibility(build)}
                        >
                          {build.visibility === 'public' ? 'Chuyển Riêng Tư' : 'Chuyển Công Khai'}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={buildActionId === build.id}
                          onClick={() => deletePublishedBuild(build)}
                        >
                          Xoá
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : null}

            {communityOpen ? (
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase text-muted-foreground">
                  Build Cộng Đồng
                </div>
                {buildActionMessage ? (
                  <div className="rounded-md border border-primary/30 bg-primary/10 p-2 text-xs text-foreground">
                    {buildActionMessage}
                  </div>
                ) : null}
                {communityLoading ? (
                  <div className="rounded-md border p-3 text-sm text-muted-foreground">
                    Đang tải build cộng đồng...
                  </div>
                ) : communityError ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive-foreground">
                    {communityError}
                  </div>
                ) : communityBuilds.length === 0 ? (
                  <div className="rounded-md border p-3 text-sm text-muted-foreground">
                    Chưa có build cộng đồng cho cầu thủ này.
                  </div>
                ) : (
                  communityBuilds.map((build) => (
                    <button
                      type="button"
                      key={build.id}
                      className="w-full rounded-md border p-2 text-left text-sm hover:border-primary/60"
                      onClick={() => loadCommunityBuild(build)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold">{build.name}</div>
                        <div className="text-xs text-muted-foreground">♥ {build.likes}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Lv {build.level} | Tình Trạng {build.condition} | {build.authorName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {encodeBuildAllocations(build.allocations)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : null}

            {compareOpen ? (
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase text-muted-foreground">So Sánh</div>
                <div className="flex gap-2">
                  <input
                    className="h-10 flex-1 rounded-md border bg-background px-3 text-sm"
                    value={compareQuery}
                    onChange={(event) => setCompareQuery(event.target.value)}
                    placeholder="Nhập tên hoặc ID/slug cầu thủ"
                  />
                  <Button onClick={searchComparePlayer} disabled={compareLoading}>
                    {compareLoading ? 'Đang Tìm' : 'So Sánh'}
                  </Button>
                </div>
                {compareError ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive-foreground">
                    {compareError}
                  </div>
                ) : null}
                {compareResults.length > 0 ? (
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {compareResults.map((candidate) => (
                      <button
                        key={candidate.efhubId}
                        type="button"
                        className={`w-full rounded-md border p-2 text-left text-sm ${
                          comparePlayer?.efhubId === candidate.efhubId
                            ? 'border-primary bg-primary/10'
                            : 'hover:border-primary/60'
                        }`}
                        onClick={() => {
                          setComparePlayer(candidate);
                          setCompareError('');
                        }}
                      >
                        <div className="font-semibold">{candidate.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {candidate.positions[0]} | OVR {candidate.overall.max} | {candidate.club}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
                {comparePreview ? (
                  <div className="rounded-md border p-2 text-sm">
                    <div className="font-semibold">{comparePreview.name}</div>
                    <div className="text-xs text-muted-foreground">OVR {comparePreview.overall}</div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-secondary/30 px-2 py-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="line-clamp-1 text-xs font-semibold">{value}</div>
    </div>
  );
}

function KeyValueGrid({
  entries
}: {
  entries: Array<[string, number | string]>;
}) {
  return (
    <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center justify-between rounded-md border px-2 py-1 text-xs">
          <span className="truncate text-muted-foreground">{key}</span>
          <span className="ml-2 font-semibold">{String(value)}</span>
        </div>
      ))}
    </div>
  );
}

function ConditionPill({
  grade,
  active,
  onClick
}: {
  grade: string;
  active: boolean;
  onClick: () => void;
}) {
  const icon =
    grade === 'A' ? (
      <ArrowUp className="h-4 w-4" />
    ) : grade === 'B' ? (
      <ArrowUpRight className="h-4 w-4" />
    ) : grade === 'C' ? (
      <ArrowRight className="h-4 w-4" />
    ) : grade === 'D' ? (
      <ArrowDown className="h-4 w-4 rotate-45" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center rounded-md border p-2 text-xs ${
        active
          ? 'border-primary bg-primary/15 text-primary'
          : 'border-border bg-secondary/30 text-muted-foreground'
      }`}
    >
      {icon}
      <span className="mt-1 font-semibold">{grade}</span>
    </button>
  );
}
