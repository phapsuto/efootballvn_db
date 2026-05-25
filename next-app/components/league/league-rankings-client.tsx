'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

import type { LeagueTeam } from '@/types/domain';

type LeagueApiResult = {
  data: LeagueTeam[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    source: string;
  };
};

type ModeValue = 'all' | 'mobile_coop' | 'crossplay_coop';
type LeagueSortValue =
  | 'points_desc'
  | 'points_asc'
  | 'members_desc'
  | 'members_asc'
  | 'updated_desc'
  | 'name_asc'
  | 'name_desc';

const LEAGUE_SORT_OPTIONS: Array<{ value: LeagueSortValue; label: string }> = [
  { value: 'points_desc', label: 'Điểm cao → thấp' },
  { value: 'points_asc', label: 'Điểm thấp → cao' },
  { value: 'members_desc', label: 'Thành viên nhiều → ít' },
  { value: 'members_asc', label: 'Thành viên ít → nhiều' },
  { value: 'updated_desc', label: 'Mới cập nhật' },
  { value: 'name_asc', label: 'Tên A → Z' },
  { value: 'name_desc', label: 'Tên Z → A' }
];

const MODE_TABS: Array<{ value: ModeValue; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'mobile_coop', label: 'Co-op Mobile' },
  { value: 'crossplay_coop', label: 'Co-op Crossplay' }
];

function signedValue(value: number) {
  const rounded = Math.round(Number(value || 0));
  if (rounded > 0) {
    return `+${rounded}`;
  }
  return String(rounded);
}

function trendIcon(value: number) {
  if (value > 0) {
    return <TrendingUp className="h-3.5 w-3.5" />;
  }
  if (value < 0) {
    return <TrendingDown className="h-3.5 w-3.5" />;
  }
  return <Minus className="h-3.5 w-3.5" />;
}

function trendClass(value: number) {
  if (value > 0) {
    return 'border border-primary/30 bg-primary/10 text-primary';
  }
  if (value < 0) {
    return 'border border-error/30 bg-error/10 text-error';
  }
  return 'border border-on-surface/10 bg-white/5 text-on-surface-variant';
}

export function LeagueRankingsClient() {
  const [mode, setMode] = useState<ModeValue>('all');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<LeagueSortValue>('points_desc');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<LeagueApiResult | null>(null);

  const summaryText = useMemo(() => {
    if (loading) {
      return 'Đang tải bảng xếp hạng...';
    }
    if (error) {
      return 'Lỗi tải bảng xếp hạng.';
    }
    return `${(result?.meta.total || 0).toLocaleString('vi-VN')} đội`;
  }, [error, loading, result]);

  const fetchRankings = async (
    nextMode: ModeValue,
    nextQuery: string,
    nextSortBy: LeagueSortValue,
    nextPage: number
  ) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: '50',
        mode: nextMode,
        sortBy: nextSortBy
      });
      if (nextQuery.trim()) {
        params.set('q', nextQuery.trim());
      }
      const response = await fetch(`/api/league/rankings?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload: LeagueApiResult = await response.json();
      setResult(payload);
      setPage(payload.meta.page);
    } catch {
      setError('Không thể tải dữ liệu giải đấu.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRankings('all', '', 'points_desc', 1);
  }, []);

  const gotoPage = (nextPage: number) => {
    if (!result) {
      return;
    }
    const bounded = Math.max(1, Math.min(result.meta.totalPages, nextPage));
    setPage(bounded);
    void fetchRankings(mode, query, sortBy, bounded);
  };

  const applyFilters = () => {
    setPage(1);
    void fetchRankings(mode, query, sortBy, 1);
  };

  const resetFilters = () => {
    setQuery('');
    setSortBy('points_desc');
    setPage(1);
    void fetchRankings(mode, '', 'points_desc', 1);
  };

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="rounded-xl bg-surface-container p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {MODE_TABS.map((tab) => {
            const active = mode === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setMode(tab.value);
                  setPage(1);
                  void fetchRankings(tab.value, query, sortBy, 1);
                }}
                className={[
                  'rounded-lg px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-colors',
                  active
                    ? 'bg-primary text-background'
                    : 'bg-surface-container-high/60 text-on-surface hover:bg-surface-container-high hover:text-on-surface'
                ].join(' ')}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                applyFilters();
              }
            }}
            placeholder="Tìm đội theo tên..."
            className="h-11 rounded-lg border border-on-surface/10 bg-surface-container-high/60 px-3 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none xl:col-span-2"
          />
          <select
            className="h-11 rounded-lg border border-on-surface/10 bg-surface-container-high/60 px-3 text-sm text-on-surface focus:border-primary focus:outline-none"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as LeagueSortValue)}
          >
            {LEAGUE_SORT_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyFilters}
              className="stitch-cta flex-1"
            >
              Áp dụng
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="flex-1 rounded-lg border border-on-surface/10 bg-white/5 px-3 py-2 text-sm font-bold uppercase tracking-wider text-on-surface transition-all hover:bg-white/10"
            >
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-on-surface-variant">{summaryText}</p>

      {error ? (
        <div className="rounded-lg border border-error/30 bg-error/10 p-4 text-sm text-error">
          {error}
        </div>
      ) : null}

      {/* Ranking list */}
      <div className="overflow-hidden rounded-xl bg-surface-container">
        <div className="divide-y divide-surface-container-high">
          {(result?.data || []).map((team, index) => (
            <Link
              key={team.id}
              href={`/tournaments/${team.id}`}
              className="group block transition-colors hover:bg-surface-container-high"
            >
              <div className="flex items-center gap-3 p-4">
                <div className="w-8 text-center text-sm font-black text-primary">
                  {(page - 1) * (result?.meta.limit || 50) + index + 1}
                </div>
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-surface-container-high">
                  <Image src={team.logoUrl} alt={team.name} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-bold text-on-surface group-hover:text-primary transition-colors">
                    {team.name}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                    <span className="text-outline">{team.members} thành viên</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 ${trendClass(
                        team.trend?.pointsDelta24h || 0
                      )}`}
                    >
                      {trendIcon(team.trend?.pointsDelta24h || 0)}
                      <span>24h điểm {signedValue(team.trend?.pointsDelta24h || 0)}</span>
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 ${trendClass(
                        team.trend?.rankDelta24h || 0
                      )}`}
                    >
                      {trendIcon(team.trend?.rankDelta24h || 0)}
                      <span>24h hạng {signedValue(team.trend?.rankDelta24h || 0)}</span>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-on-surface">
                    {team.points.toLocaleString('vi-VN')}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-outline">
                    điểm
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {result ? (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => gotoPage(page - 1)}
            className="rounded-lg border border-on-surface/10 bg-white/5 px-4 py-2 text-sm font-bold text-on-surface transition-all hover:bg-white/10 disabled:opacity-40"
          >
            ← Trước
          </button>
          <div className="text-sm text-on-surface-variant">
            Trang {page}/{result.meta.totalPages}
          </div>
          <button
            type="button"
            disabled={loading || page >= result.meta.totalPages}
            onClick={() => gotoPage(page + 1)}
            className="rounded-lg border border-on-surface/10 bg-white/5 px-4 py-2 text-sm font-bold text-on-surface transition-all hover:bg-white/10 disabled:opacity-40"
          >
            Sau →
          </button>
        </div>
      ) : null}
    </div>
  );
}
