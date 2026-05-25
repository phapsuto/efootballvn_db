'use client';

import Link from 'next/link';
import { Activity, BookMarked, LayoutTemplate, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type PersistedLineup = {
  formation?: string;
  managerId?: string;
  lineup?: Record<string, { efhubId?: string; name?: string } | null>;
};

type SavedBuild = {
  id: string;
  name: string;
  level: number;
  condition: string;
  createdAt: string;
};

type SavedBuildEntry = SavedBuild & {
  playerId: string;
};

type CommunityProfileLite = {
  id: string;
  displayName: string;
  country: string;
  followers: number;
};

const LINEUP_STORAGE_KEY = 'efvn_lineup_builder_v2';
const BUILD_STORAGE_PREFIX = 'efvn_player_builds_';

function formatRelativeDate(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return 'Không rõ thời gian';
  }

  const diffMs = Date.now() - timestamp;
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }
  const diffDays = Math.max(1, Math.round(diffHours / 24));
  return `${diffDays} ngày trước`;
}

export function ProfileHubClient() {
  const [savedFormation, setSavedFormation] = useState<string>('4-3-3');
  const [lineupFilledSlots, setLineupFilledSlots] = useState(0);
  const [savedBuilds, setSavedBuilds] = useState<SavedBuildEntry[]>([]);
  const [profiles, setProfiles] = useState<CommunityProfileLite[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const rawLineup = window.localStorage.getItem(LINEUP_STORAGE_KEY);
      if (rawLineup) {
        const parsed = JSON.parse(rawLineup) as PersistedLineup;
        const lineup = parsed.lineup && typeof parsed.lineup === 'object' ? parsed.lineup : {};
        const filled = Object.values(lineup).filter((item) => item?.efhubId).length;
        setSavedFormation(parsed.formation || '4-3-3');
        setLineupFilledSlots(filled);
      }
    } catch {
      setSavedFormation('4-3-3');
      setLineupFilledSlots(0);
    }

    try {
      const entries: SavedBuildEntry[] = [];
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (!key || !key.startsWith(BUILD_STORAGE_PREFIX)) {
          continue;
        }
        const playerId = key.slice(BUILD_STORAGE_PREFIX.length);
        const raw = window.localStorage.getItem(key);
        if (!raw) {
          continue;
        }
        const builds = JSON.parse(raw) as SavedBuild[];
        if (!Array.isArray(builds)) {
          continue;
        }
        builds.forEach((build) => {
          if (!build || typeof build !== 'object') {
            return;
          }
          entries.push({ ...build, playerId });
        });
      }
      entries.sort((a, b) => Date.parse(b.createdAt || '') - Date.parse(a.createdAt || ''));
      setSavedBuilds(entries);
    } catch {
      setSavedBuilds([]);
    }
  }, []);

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const response = await fetch('/api/community/profiles?page=1&limit=4&tab=discover', {
          cache: 'no-store'
        });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { data?: CommunityProfileLite[] };
        setProfiles(Array.isArray(payload.data) ? payload.data : []);
      } catch {
        setProfiles([]);
      }
    };

    void loadProfiles();
  }, []);

  const recentBuilds = useMemo(() => savedBuilds.slice(0, 5), [savedBuilds]);

  const kpiCards = [
    {
      label: 'Đội hình đã lưu',
      value: lineupFilledSlots > 0 ? '1' : '0',
      hint: `${lineupFilledSlots}/11 slot đã điền`,
      icon: LayoutTemplate,
      accent: 'text-primary'
    },
    {
      label: 'Formation hiện tại',
      value: savedFormation,
      hint: 'Đồng bộ từ localStorage',
      icon: ShieldCheck,
      accent: 'text-primary'
    },
    {
      label: 'Build cục bộ',
      value: String(savedBuilds.length),
      hint: 'Tất cả build bạn đã lưu',
      icon: BookMarked,
      accent: 'text-tertiary'
    },
    {
      label: 'Gợi ý cộng đồng',
      value: String(profiles.length),
      hint: 'Hồ sơ nổi bật để theo dõi',
      icon: Users,
      accent: 'text-violet-300'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-xl bg-surface-container p-6 sm:p-8">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary/10 to-transparent" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="stitch-chip stitch-chip-sky">Hồ sơ phiên ẩn danh</span>
            <div className="mt-4">
              <p className="stitch-label-accent">Trạng thái cục bộ · Build · Cộng đồng</p>
              <h1 className="stitch-headline text-3xl sm:text-4xl mt-2">
                Bảng điều khiển cá nhân
              </h1>
              <p className="mt-3 text-sm leading-6 text-on-surface">
                Nơi gom toàn bộ dữ liệu local của bạn: đội hình đang xây, build đã lưu và lối
                vào nhanh sang community.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/doi-hinh"
              className="rounded-lg border border-primary/30 bg-primary/10 px-5 py-4 text-sm font-bold uppercase tracking-wider text-primary-fixed transition-all hover:bg-primary/20"
            >
              Tiếp tục đội hình
            </Link>
            <Link
              href="/community"
              className="rounded-lg border border-primary/30 bg-primary/10 px-5 py-4 text-sm font-bold uppercase tracking-wider text-primary-fixed transition-all hover:bg-primary/20"
            >
              Khám phá cộng đồng
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="stitch-chip stitch-chip-sky">Ảnh chụp cục bộ</span>
          <span className="stitch-chip stitch-chip-emerald">Sẵn sàng cho cộng đồng</span>
          <span className="stitch-chip stitch-chip-amber">Luồng Stitch không có nút chết</span>
        </div>
      </section>

      {/* KPI grid */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="rounded-xl bg-surface-container p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="stitch-label">{item.label}</p>
                  <p className="mt-2 text-2xl font-black text-on-surface">{item.value}</p>
                </div>
                <Icon className={`h-6 w-6 ${item.accent}`} />
              </div>
              <p className="mt-3 text-sm text-on-surface-variant">{item.hint}</p>
            </article>
          );
        })}
      </section>

      {/* Đội hình gần nhất + build gần nhất */}
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-xl bg-surface-container p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="stitch-label-accent">Lineup</p>
              <h2 className="stitch-section-title mt-2">Đội hình gần nhất</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Mở lại lineup builder với trạng thái local gần nhất.
              </p>
            </div>
            <Activity className="h-5 w-5 text-primary" />
          </div>

          <div className="mt-5 rounded-lg bg-surface-container-high/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="stitch-label">Formation</p>
                <p className="mt-2 text-2xl font-black text-on-surface">{savedFormation}</p>
              </div>
              <div>
                <p className="stitch-label">Tiến độ</p>
                <p className="mt-2 text-2xl font-black text-on-surface">
                  {lineupFilledSlots}/11
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/doi-hinh" className="stitch-cta">
                Mở lineup builder
              </Link>
              <Link
                href="/cam-nang"
                className="rounded-lg border border-on-surface/10 bg-white/5 px-4 py-2 text-sm font-bold uppercase tracking-wider text-on-surface transition-all hover:bg-white/10"
              >
                Cẩm nang
              </Link>
            </div>
          </div>
        </article>

        <article className="rounded-xl bg-surface-container p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="stitch-label-accent">Builds</p>
              <h2 className="stitch-section-title mt-2">Build vừa lưu</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Danh sách build local mới nhất từ màn chi tiết cầu thủ.
              </p>
            </div>
            <BookMarked className="h-5 w-5 text-primary" />
          </div>

          <div className="mt-5 space-y-3">
            {recentBuilds.length === 0 ? (
              <div className="rounded-lg border border-dashed border-on-surface/10 bg-surface-container-high/40 p-5 text-sm text-on-surface-variant">
                Chưa có build local nào. Bạn có thể vào chi tiết cầu thủ và bấm{' '}
                <span className="font-bold text-on-surface">Lưu Build</span> để bắt đầu.
              </div>
            ) : (
              recentBuilds.map((build) => (
                <Link
                  key={`${build.playerId}-${build.id}`}
                  href={`/cau-thu/${encodeURIComponent(build.playerId)}`}
                  className="block rounded-lg bg-surface-container-high/60 p-4 transition-all hover:bg-surface-container-high"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-on-surface">{build.name}</h3>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-outline">
                        Player ID {build.playerId}
                      </p>
                    </div>
                    <span className="stitch-chip text-[10px] px-2 py-0.5">
                      Lv {build.level} · {build.condition}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-on-surface-variant">
                    Lưu {formatRelativeDate(build.createdAt)}
                  </p>
                </Link>
              ))
            )}
          </div>
        </article>
      </section>

      {/* Gợi ý cộng đồng */}
      <section className="rounded-xl bg-surface-container p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="stitch-label-accent">Community</p>
            <h2 className="stitch-section-title mt-2">Gợi ý cộng đồng</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Các hồ sơ nổi bật để bạn mở sâu hơn từ dashboard cá nhân.
            </p>
          </div>
          <Link
            href="/community"
            className="text-xs font-bold uppercase tracking-wider text-primary hover:text-primary"
          >
            Xem tất cả →
          </Link>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {profiles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-on-surface/10 bg-surface-container-high/40 p-5 text-sm text-on-surface-variant md:col-span-2 xl:col-span-4">
              Chưa tải được hồ sơ cộng đồng lúc này. Bạn vẫn có thể mở trực tiếp module cộng đồng
              để kiểm tra.
            </div>
          ) : (
            profiles.map((profile) => (
              <Link
                key={profile.id}
                href={`/community/${encodeURIComponent(profile.id)}`}
                className="group rounded-lg bg-surface-container-high/60 p-4 transition-all hover:bg-surface-container-high"
              >
                <p className="text-lg font-black text-on-surface group-hover:text-primary transition-colors">
                  {profile.displayName}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">{profile.country}</p>
                <p className="mt-4 stitch-label">Người theo dõi</p>
                <p className="mt-1 text-2xl font-black text-primary">
                  {profile.followers}
                </p>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
