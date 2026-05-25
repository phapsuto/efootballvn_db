'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import type { Player } from '@/types/domain';

type PlayerApiResult = {
  data: Player[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    source: 'mock' | 'mongo';
  };
};

const PAGE_SIZE = 24;
const POSITION_OPTIONS = ['GK', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'LMF', 'RMF', 'AMF', 'LWF', 'RWF', 'SS', 'CF'];
const CARD_TYPE_OPTIONS = ['Standard', 'Highlight', 'Featured', 'Epic', 'Big Time', 'Show Time', 'Legendary'];
const PLAYSTYLE_OPTIONS = [
  'Goal Poacher',
  'Fox in the Box',
  'Deep-Lying Forward',
  'Creative Playmaker',
  'Box To Box',
  'The Destroyer',
  'Build Up',
  'Offensive Full-back',
  'Cross Specialist'
];

function stat(player: Player, keys: string[]) {
  for (const key of keys) {
    const value = Number(player.stats.maxLevel[key]);
    if (Number.isFinite(value)) {
      return value;
    }
  }
  return 0;
}

type FetchParams = {
  q: string;
  minOvr: number;
  position: string;
  cardType: string;
  playstyle: string;
  skill: string;
  nationality: string;
  club: string;
  foot: string;
  minHeight: string;
  maxHeight: string;
  sortBy: 'overall_desc' | 'overall_asc' | 'name_asc' | 'name_desc' | 'updated_desc';
  page: number;
};

const DEFAULT_FETCH_PARAMS: FetchParams = {
  q: '',
  minOvr: 70,
  position: '',
  cardType: '',
  playstyle: '',
  skill: '',
  nationality: '',
  club: '',
  foot: '',
  minHeight: '',
  maxHeight: '',
  sortBy: 'overall_desc',
  page: 1
};

type PlayersListClientProps = {
  initialFilters?: Partial<FetchParams>;
  syncUrl?: boolean;
  routeBase?: string;
};

function normalizeSortBy(
  value: string | undefined
): FetchParams['sortBy'] {
  const valid = new Set<FetchParams['sortBy']>([
    'overall_desc',
    'overall_asc',
    'name_asc',
    'name_desc',
    'updated_desc'
  ]);
  return valid.has(value as FetchParams['sortBy'])
    ? (value as FetchParams['sortBy'])
    : 'overall_desc';
}

function sanitizeInitialFilters(initialFilters?: Partial<FetchParams>): FetchParams {
  const minOvrValue = Number(initialFilters?.minOvr);
  const pageValue = Number(initialFilters?.page);

  return {
    q: typeof initialFilters?.q === 'string' ? initialFilters.q : DEFAULT_FETCH_PARAMS.q,
    minOvr: Number.isFinite(minOvrValue) ? Math.max(1, Math.round(minOvrValue)) : DEFAULT_FETCH_PARAMS.minOvr,
    position:
      typeof initialFilters?.position === 'string' ? initialFilters.position : DEFAULT_FETCH_PARAMS.position,
    cardType:
      typeof initialFilters?.cardType === 'string' ? initialFilters.cardType : DEFAULT_FETCH_PARAMS.cardType,
    playstyle:
      typeof initialFilters?.playstyle === 'string' ? initialFilters.playstyle : DEFAULT_FETCH_PARAMS.playstyle,
    skill:
      typeof initialFilters?.skill === 'string' ? initialFilters.skill : DEFAULT_FETCH_PARAMS.skill,
    nationality:
      typeof initialFilters?.nationality === 'string'
        ? initialFilters.nationality
        : DEFAULT_FETCH_PARAMS.nationality,
    club: typeof initialFilters?.club === 'string' ? initialFilters.club : DEFAULT_FETCH_PARAMS.club,
    foot: typeof initialFilters?.foot === 'string' ? initialFilters.foot : DEFAULT_FETCH_PARAMS.foot,
    minHeight:
      typeof initialFilters?.minHeight === 'string'
        ? initialFilters.minHeight
        : DEFAULT_FETCH_PARAMS.minHeight,
    maxHeight:
      typeof initialFilters?.maxHeight === 'string'
        ? initialFilters.maxHeight
        : DEFAULT_FETCH_PARAMS.maxHeight,
    sortBy: normalizeSortBy(initialFilters?.sortBy),
    page: Number.isFinite(pageValue) ? Math.max(1, Math.round(pageValue)) : DEFAULT_FETCH_PARAMS.page
  };
}

function buildUrl(routeBase: string, params: FetchParams) {
  const search = new URLSearchParams();
  if (params.q.trim()) search.set('q', params.q.trim());
  if (params.position) search.set('position', params.position);
  if (params.cardType) search.set('cardType', params.cardType);
  if (params.playstyle) search.set('playstyle', params.playstyle);
  if (params.skill) search.set('skill', params.skill);
  if (params.nationality.trim()) search.set('nationality', params.nationality.trim());
  if (params.club.trim()) search.set('club', params.club.trim());
  if (params.foot) search.set('foot', params.foot);
  if (params.minHeight.trim()) search.set('minHeight', params.minHeight.trim());
  if (params.maxHeight.trim()) search.set('maxHeight', params.maxHeight.trim());
  if (params.minOvr !== DEFAULT_FETCH_PARAMS.minOvr) {
    search.set('minOvr', String(params.minOvr));
  }
  if (params.sortBy !== DEFAULT_FETCH_PARAMS.sortBy) {
    search.set('sortBy', params.sortBy);
  }
  if (params.page > 1) {
    search.set('page', String(params.page));
  }

  const query = search.toString();
  return query ? `${routeBase}?${query}` : routeBase;
}

export function PlayersListClient({
  initialFilters,
  syncUrl = false,
  routeBase = '/cau-thu'
}: PlayersListClientProps) {
  const router = useRouter();
  const resolvedInitial = useMemo(
    () => sanitizeInitialFilters(initialFilters),
    [initialFilters]
  );

  const [query, setQuery] = useState(resolvedInitial.q);
  const [minOvr, setMinOvr] = useState(resolvedInitial.minOvr);
  const [position, setPosition] = useState(resolvedInitial.position);
  const [cardType, setCardType] = useState(resolvedInitial.cardType);
  const [playstyle, setPlaystyle] = useState(resolvedInitial.playstyle);
  const [skill, setSkill] = useState(resolvedInitial.skill);
  const [nationality, setNationality] = useState(resolvedInitial.nationality);
  const [club, setClub] = useState(resolvedInitial.club);
  const [foot, setFoot] = useState(resolvedInitial.foot);
  const [minHeight, setMinHeight] = useState(resolvedInitial.minHeight);
  const [maxHeight, setMaxHeight] = useState(resolvedInitial.maxHeight);
  const [sortBy, setSortBy] = useState<FetchParams['sortBy']>(resolvedInitial.sortBy);
  const [page, setPage] = useState(resolvedInitial.page);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PlayerApiResult | null>(null);

  const totalText = useMemo(() => {
    if (loading) return 'Đang tải dữ liệu cầu thủ...';
    if (error) return 'Lỗi tải dữ liệu cầu thủ.';
    if (!result) return 'Chưa có dữ liệu.';
    const sourceLabel = result.meta.source === 'mongo' ? 'Dữ liệu trực tiếp' : 'Dữ liệu hệ thống';
    return `Tìm thấy ${result.meta.total.toLocaleString('vi-VN')} cầu thủ · Nguồn: ${sourceLabel}`;
  }, [loading, error, result]);

  const fetchPlayers = async (params: FetchParams) => {
    setLoading(true);
    setError('');
    try {
      const search = new URLSearchParams({
        page: String(params.page),
        limit: String(PAGE_SIZE),
        minOvr: String(params.minOvr)
      });
      if (params.q.trim()) search.set('q', params.q.trim());
      if (params.position) search.set('position', params.position);
      if (params.cardType) search.set('cardType', params.cardType);
      if (params.playstyle) search.set('playstyle', params.playstyle);
      if (params.skill) search.set('skill', params.skill);
      if (params.nationality.trim()) search.set('nationality', params.nationality.trim());
      if (params.club.trim()) search.set('club', params.club.trim());
      if (params.foot) search.set('foot', params.foot);
      if (params.minHeight.trim()) search.set('minHeight', params.minHeight.trim());
      if (params.maxHeight.trim()) search.set('maxHeight', params.maxHeight.trim());
      search.set('sortBy', params.sortBy);

      const response = await fetch(`/api/players?${search.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload: PlayerApiResult = await response.json();
      setResult(payload);
      setPage(payload.meta.page);
    } catch {
      setError('Không thể tải dữ liệu từ API.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setQuery(resolvedInitial.q);
    setMinOvr(resolvedInitial.minOvr);
    setPosition(resolvedInitial.position);
    setCardType(resolvedInitial.cardType);
    setPlaystyle(resolvedInitial.playstyle);
    setSkill(resolvedInitial.skill);
    setNationality(resolvedInitial.nationality);
    setClub(resolvedInitial.club);
    setFoot(resolvedInitial.foot);
    setMinHeight(resolvedInitial.minHeight);
    setMaxHeight(resolvedInitial.maxHeight);
    setSortBy(resolvedInitial.sortBy);
    setPage(resolvedInitial.page);
    void fetchPlayers(resolvedInitial);
  }, [resolvedInitial]);

  const syncRoute = (params: FetchParams) => {
    if (!syncUrl) {
      return;
    }
    router.replace(buildUrl(routeBase, params), { scroll: false });
  };

  const applyFilters = () => {
    setPage(1);
    const nextParams = {
      q: query,
      minOvr,
      position,
      cardType,
      playstyle,
      skill,
      nationality,
      club,
      foot,
      minHeight,
      maxHeight,
      sortBy,
      page: 1
    } satisfies FetchParams;
    syncRoute(nextParams);
    void fetchPlayers(nextParams);
  };

  const resetFilters = () => {
    setQuery(''); setMinOvr(70); setPosition(''); setCardType(''); setPlaystyle('');
    setSkill(''); setNationality(''); setClub(''); setFoot(''); setMinHeight(''); setMaxHeight('');
    setSortBy('overall_desc'); setPage(1);
    syncRoute(DEFAULT_FETCH_PARAMS);
    void fetchPlayers(DEFAULT_FETCH_PARAMS);
  };

  const gotoPage = (nextPage: number) => {
    if (!result) return;
    const bounded = Math.max(1, Math.min(result.meta.totalPages, nextPage));
    setPage(bounded);
    const nextParams = {
      q: query,
      minOvr,
      position,
      cardType,
      playstyle,
      skill,
      nationality,
      club,
      foot,
      minHeight,
      maxHeight,
      sortBy,
      page: bounded
    } satisfies FetchParams;
    syncRoute(nextParams);
    void fetchPlayers(nextParams);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      {/* Filter Sidebar */}
      <aside className="xl:w-72 xl:flex-shrink-0">
        <div className="rounded-xl bg-surface-container/60 backdrop-blur-lg p-6 xl:sticky xl:top-28">
          <h2 className="stitch-label-accent mb-6">Bộ lọc nâng cao</h2>
          <div className="space-y-5">
            <div>
              <label className="stitch-label mb-2 block">Tên cầu thủ</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm tên..."
                className="stitch-filter-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="stitch-label mb-2 block">Quốc gia</label>
                <input
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="Argentina"
                  className="stitch-filter-input"
                />
              </div>
              <div>
                <label className="stitch-label mb-2 block">CLB</label>
                <input
                  value={club}
                  onChange={(e) => setClub(e.target.value)}
                  placeholder="Barcelona"
                  className="stitch-filter-input"
                />
              </div>
            </div>

            <div>
              <label className="stitch-label mb-2 block">Vị trí</label>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPosition('')}
                  className={
                    position === ''
                      ? 'stitch-position-chip stitch-position-chip-active'
                      : 'stitch-position-chip'
                  }
                >
                  ALL
                </button>
                {POSITION_OPTIONS.map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setPosition(pos)}
                    className={
                      position === pos
                        ? 'stitch-position-chip stitch-position-chip-active'
                        : 'stitch-position-chip'
                    }
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="stitch-label mb-2 flex items-center justify-between">
                <span>OVR tối thiểu</span>
                <span className="text-primary">{minOvr}+</span>
              </label>
              <input
                type="range"
                min={70}
                max={105}
                step={1}
                value={minOvr}
                onChange={(e) => setMinOvr(Number(e.target.value))}
                className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="mt-1 flex justify-between text-[10px] font-bold text-outline-variant">
                <span>70</span>
                <span>90</span>
                <span>105</span>
              </div>
            </div>

            <div>
              <label className="stitch-label mb-2 block">Loại thẻ</label>
              <select
                className="stitch-filter-select"
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
              >
                <option value="">Tất cả</option>
                {CARD_TYPE_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="stitch-label mb-2 block">Phong cách chơi</label>
              <select
                className="stitch-filter-select"
                value={playstyle}
                onChange={(e) => setPlaystyle(e.target.value)}
              >
                <option value="">Tất cả</option>
                {PLAYSTYLE_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="stitch-label mb-2 block">Chân thuận</label>
              <select
                className="stitch-filter-select"
                value={foot}
                onChange={(e) => setFoot(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="Right">Phải</option>
                <option value="Left">Trái</option>
                <option value="Both">Cả hai</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="stitch-label mb-2 block">Cao tối thiểu (cm)</label>
                <input
                  type="number"
                  min={120}
                  max={240}
                  value={minHeight}
                  onChange={(e) => setMinHeight(e.target.value)}
                  placeholder="175"
                  className="stitch-filter-input"
                />
              </div>
              <div>
                <label className="stitch-label mb-2 block">Cao tối đa (cm)</label>
                <input
                  type="number"
                  min={120}
                  max={240}
                  value={maxHeight}
                  onChange={(e) => setMaxHeight(e.target.value)}
                  placeholder="195"
                  className="stitch-filter-input"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={applyFilters}
              className="w-full py-3 bg-primary text-background font-black uppercase text-xs tracking-wider rounded-lg hover:bg-primary transition-all shadow-lg shadow-primary/10 active:scale-95"
            >
              Áp dụng bộ lọc
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="w-full py-2 bg-surface-container-high text-on-surface font-bold uppercase text-xs tracking-wider rounded-lg hover:bg-surface-variant transition-all"
            >
              Đặt lại
            </button>
          </div>
        </div>
      </aside>

      {/* Main list */}
      <main className="flex-1 min-w-0">
        <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="stitch-headline text-3xl sm:text-4xl">Kết quả tìm kiếm</h2>
            <p className="stitch-subtle mt-2">{totalText}</p>
          </div>
          <div className="flex gap-2">
            <label htmlFor="sort-players" className="sr-only">
              Sắp xếp cầu thủ
            </label>
            <select
              id="sort-players"
              className="stitch-filter-select w-48"
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as
                    | 'overall_desc'
                    | 'overall_asc'
                    | 'name_asc'
                    | 'name_desc'
                    | 'updated_desc'
                )
              }
            >
              <option value="overall_desc">OVR cao nhất</option>
              <option value="overall_asc">OVR thấp nhất</option>
              <option value="name_asc">Tên A → Z</option>
              <option value="name_desc">Tên Z → A</option>
              <option value="updated_desc">Mới cập nhật</option>
            </select>
          </div>
        </header>

        {error ? (
          <div className="rounded-lg bg-error/10 p-4 text-sm text-error">{error}</div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {(result?.data || []).map((player) => (
            <Link
              key={player.efhubId}
              href={`/cau-thu/${player.efhubId}`}
              className="group relative bg-surface-container p-4 rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 ring-1 ring-white/5 hover:ring-primary/50"
            >
              <div className="absolute top-4 right-4 z-10 text-right">
                <div className="text-4xl font-black italic text-primary leading-none">
                  {player.overall.max}
                </div>
                <div className="stitch-stat-label mt-0.5">OVR</div>
              </div>
              <div className="relative w-full aspect-[4/5] mb-4 bg-surface-container-high rounded-lg overflow-hidden">
                <Image
                  src={player.images.card}
                  alt={player.name}
                  fill
                  sizes="(max-width:768px) 100vw, 25vw"
                  className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-surface-container to-transparent">
                  <span className="stitch-chip stitch-chip-amber">
                    {player.cardType || 'Standard'}
                  </span>
                </div>
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-bold text-base text-on-surface uppercase group-hover:text-primary transition-colors">
                    {player.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="stitch-chip stitch-chip-emerald text-[10px] px-2 py-0.5">
                      {player.positions[0]}
                    </span>
                    <span className="text-[10px] text-outline uppercase tracking-wider truncate">
                      {player.club}
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline-variant group-hover:text-tertiary transition-colors text-xl">
                  star
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-on-surface/5">
                <div className="stitch-stat">
                  <div className="stitch-stat-value">{stat(player, ['speed'])}</div>
                  <div className="stitch-stat-label">SPD</div>
                </div>
                <div className="stitch-stat">
                  <div className="stitch-stat-value">
                    {stat(player, ['dribbling', 'ballControl', 'tightPossession'])}
                  </div>
                  <div className="stitch-stat-label">DRI</div>
                </div>
                <div className="stitch-stat">
                  <div className="stitch-stat-value">
                    {stat(player, ['lowPass', 'loftedPass'])}
                  </div>
                  <div className="stitch-stat-label">PAS</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {result && result.meta.totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => gotoPage(page - 1)}
              className="stitch-ghost-btn disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Trước
            </button>
            <span className="text-sm text-on-surface-variant">
              Trang <span className="font-bold text-on-surface">{page}</span> / {result.meta.totalPages}
            </span>
            <button
              type="button"
              disabled={loading || page >= result.meta.totalPages}
              onClick={() => gotoPage(page + 1)}
              className="stitch-ghost-btn disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sau →
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
}
