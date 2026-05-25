'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type { CommunityProfile } from '@/types/domain';

type CommunityApiResult = {
  data: CommunityProfile[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    source: string;
  };
};

type FollowMutationResult = {
  data: CommunityProfile | null;
  changed: boolean;
};

type TabValue = 'discover' | 'following' | 'followers';
type CommunitySortValue =
  | 'tab_default'
  | 'builds_desc'
  | 'followers_desc'
  | 'following_desc'
  | 'name_asc'
  | 'name_desc';

const COMMUNITY_SORT_OPTIONS: Array<{ value: CommunitySortValue; label: string }> = [
  { value: 'tab_default', label: 'Theo tab hiện tại' },
  { value: 'builds_desc', label: 'Số bản build cao → thấp' },
  { value: 'followers_desc', label: 'Người theo dõi cao → thấp' },
  { value: 'following_desc', label: 'Đang theo dõi cao → thấp' },
  { value: 'name_asc', label: 'Tên A → Z' },
  { value: 'name_desc', label: 'Tên Z → A' }
];

const TABS: Array<{ value: TabValue; label: string }> = [
  { value: 'discover', label: 'Khám phá' },
  { value: 'following', label: 'Đang theo dõi' },
  { value: 'followers', label: 'Người theo dõi' }
];

export function CommunityListClient() {
  const [tab, setTab] = useState<TabValue>('discover');
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [sortBy, setSortBy] = useState<CommunitySortValue>('tab_default');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [followLoadingId, setFollowLoadingId] = useState('');
  const [result, setResult] = useState<CommunityApiResult | null>(null);

  const summaryText = useMemo(() => {
    if (loading) {
      return 'Đang tải cộng đồng...';
    }
    if (error) {
      return 'Lỗi tải dữ liệu cộng đồng.';
    }
    return `Tìm thấy ${(result?.meta.total || 0).toLocaleString('vi-VN')} hồ sơ`;
  }, [error, loading, result]);

  const fetchProfiles = async (
    nextTab: TabValue,
    q: string,
    nextRegion: string,
    nextCountry: string,
    nextSortBy: CommunitySortValue,
    nextPage: number
  ) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: '24',
        tab: nextTab,
        sortBy: nextSortBy
      });
      if (q.trim()) {
        params.set('q', q.trim());
      }
      if (nextRegion) {
        params.set('region', nextRegion);
      }
      if (nextCountry.trim()) {
        params.set('country', nextCountry.trim());
      }

      const response = await fetch(`/api/community/profiles?${params.toString()}`, {
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload: CommunityApiResult = await response.json();
      setResult(payload);
      setPage(payload.meta.page);
    } catch {
      setError('Không thể tải dữ liệu cộng đồng.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProfiles('discover', '', '', '', 'tab_default', 1);
  }, []);

  const gotoPage = (nextPage: number) => {
    if (!result) {
      return;
    }
    const bounded = Math.max(1, Math.min(result.meta.totalPages, nextPage));
    setPage(bounded);
    void fetchProfiles(tab, query, region, country, sortBy, bounded);
  };

  const applyFilters = () => {
    setPage(1);
    void fetchProfiles(tab, query, region, country, sortBy, 1);
  };

  const resetFilters = () => {
    setQuery('');
    setRegion('');
    setCountry('');
    setSortBy('tab_default');
    setPage(1);
    void fetchProfiles(tab, '', '', '', 'tab_default', 1);
  };

  const switchTab = (nextTab: TabValue) => {
    setTab(nextTab);
    setPage(1);
    void fetchProfiles(nextTab, query, region, country, sortBy, 1);
  };

  const toggleFollow = async (profile: CommunityProfile) => {
    if (!profile.id || followLoadingId) {
      return;
    }

    setActionMessage('');
    setFollowLoadingId(profile.id);
    const follow = !Boolean(profile.isFollowing);

    try {
      const response = await fetch(
        `/api/community/profiles/${encodeURIComponent(profile.id)}/follow`,
        {
          method: follow ? 'POST' : 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as FollowMutationResult;
      const nextName = payload.data?.displayName || profile.displayName;
      setActionMessage(
        follow ? `Đã theo dõi ${nextName}.` : `Đã bỏ theo dõi ${nextName}.`
      );
      await fetchProfiles(tab, query, region, country, sortBy, page);
    } catch {
      setActionMessage('Không thể cập nhật theo dõi. Vui lòng thử lại.');
    } finally {
      setFollowLoadingId('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters + tabs */}
      <div className="rounded-xl bg-surface-container p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {TABS.map((item) => {
            const active = tab === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => switchTab(item.value)}
                className={[
                  'rounded-lg px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-colors',
                  active
                    ? 'bg-primary text-background'
                    : 'bg-surface-container-high/60 text-on-surface hover:bg-surface-container-high hover:text-on-surface'
                ].join(' ')}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                applyFilters();
              }
            }}
            placeholder="Tìm theo tên hoặc quốc gia..."
            className="h-11 rounded-lg border border-on-surface/10 bg-surface-container-high/60 px-3 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
          />
          <input
            value={region}
            onChange={(event) => setRegion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                applyFilters();
              }
            }}
            placeholder="Khu vực: Châu Âu, Châu Á..."
            className="h-11 rounded-lg border border-on-surface/10 bg-surface-container-high/60 px-3 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
          />
          <input
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                applyFilters();
              }
            }}
            placeholder="Quốc gia: Việt Nam, Spain..."
            className="h-11 rounded-lg border border-on-surface/10 bg-surface-container-high/60 px-3 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
          />
          <select
            className="h-11 rounded-lg border border-on-surface/10 bg-surface-container-high/60 px-3 text-sm text-on-surface focus:border-primary focus:outline-none"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as CommunitySortValue)}
          >
            {COMMUNITY_SORT_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={applyFilters}
            className="stitch-cta"
          >
            Áp dụng bộ lọc
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-on-surface/10 bg-white/5 px-5 py-2 text-sm font-bold uppercase tracking-wider text-on-surface transition-all hover:bg-white/10"
          >
            Đặt lại
          </button>
        </div>
      </div>

      <p className="text-sm text-on-surface-variant">{summaryText}</p>

      {error ? (
        <div className="rounded-lg border border-error/30 bg-error/10 p-4 text-sm text-error">
          {error}
        </div>
      ) : null}

      {actionMessage ? (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-primary-fixed">
          {actionMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(result?.data || []).map((profile) => (
          <article
            key={profile.id}
            className="group space-y-4 rounded-xl bg-surface-container p-5 transition-all hover:bg-surface-container-high"
          >
            <div className="flex items-start justify-between gap-3">
              <Link href={`/community/${profile.id}`} className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-surface-container-high">
                    <Image
                      src={profile.avatarUrl}
                      alt={profile.displayName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-black text-on-surface group-hover:text-primary transition-colors">
                      {profile.displayName}
                    </h3>
                    <p className="truncate text-xs text-outline">@{profile.username}</p>
                  </div>
                </div>
              </Link>

              <button
                type="button"
                disabled={followLoadingId === profile.id}
                onClick={() => toggleFollow(profile)}
                className={
                  profile.isFollowing
                    ? 'rounded-lg border border-on-surface/10 bg-white/5 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-on-surface transition-all hover:bg-white/10 disabled:opacity-60'
                    : 'rounded-lg bg-primary px-3 py-2 text-[11px] font-black uppercase tracking-wider text-background transition-all hover:bg-primary disabled:opacity-60'
                }
              >
                {followLoadingId === profile.id
                  ? '...'
                  : profile.isFollowing
                    ? 'Bỏ theo dõi'
                    : 'Theo dõi'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="stitch-chip stitch-chip-sky text-[10px] px-2 py-0.5">
                {profile.region}
              </span>
              <span className="stitch-chip text-[10px] px-2 py-0.5">{profile.country}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-surface-container-high/60 p-2">
                <div className="text-base font-black text-on-surface">{profile.buildsCount}</div>
                <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-outline">
                  Build
                </div>
              </div>
              <div className="rounded-lg bg-surface-container-high/60 p-2">
                <div className="text-base font-black text-on-surface">{profile.following}</div>
                <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-outline">
                  Following
                </div>
              </div>
              <div className="rounded-lg bg-surface-container-high/60 p-2">
                <div className="text-base font-black text-on-surface">{profile.followers}</div>
                <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-outline">
                  Followers
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Link
                href={`/community/${profile.id}`}
                className="text-[11px] font-bold uppercase tracking-wider text-primary hover:text-primary"
              >
                Xem chi tiết →
              </Link>
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
                {profile.isFollowing ? 'Đang theo dõi' : 'Chưa theo dõi'}
              </span>
            </div>
          </article>
        ))}
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
