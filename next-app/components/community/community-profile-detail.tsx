'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type { CommunityProfile, Player } from '@/types/domain';

type CommunityDetailApiResult = {
  data?: CommunityProfile;
};

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString('vi-VN');
}

export function CommunityProfileDetail({
  profile,
  favoritePlayer
}: {
  profile: CommunityProfile;
  favoritePlayer: Player | null;
}) {
  const [profileState, setProfileState] = useState(profile);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    setProfileState(profile);
  }, [profile]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(
          `/api/community/profiles/${encodeURIComponent(profile.id)}`,
          {
            cache: 'no-store'
          }
        );
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as CommunityDetailApiResult;
        if (payload.data) {
          setProfileState(payload.data);
        }
      } catch {
        // ignore hydration errors
      }
    };

    void loadProfile();
  }, [profile.id]);

  const followerRatio = useMemo(
    () =>
      profileState.following > 0
        ? profileState.followers / profileState.following
        : profileState.followers,
    [profileState.followers, profileState.following]
  );
  const ratioText = followerRatio.toFixed(2);

  const toggleFollow = async () => {
    if (loadingFollow) {
      return;
    }

    const nextFollow = !Boolean(profileState.isFollowing);
    setLoadingFollow(true);
    setActionMessage('');

    try {
      const response = await fetch(
        `/api/community/profiles/${encodeURIComponent(profileState.id)}/follow`,
        {
          method: nextFollow ? 'POST' : 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as CommunityDetailApiResult;
      if (payload.data) {
        setProfileState(payload.data);
      } else {
        setProfileState((previous) => ({
          ...previous,
          isFollowing: nextFollow,
          followers: Math.max(0, previous.followers + (nextFollow ? 1 : -1))
        }));
      }

      setActionMessage(
        nextFollow
          ? `Bạn đã theo dõi ${profileState.displayName}.`
          : `Bạn đã bỏ theo dõi ${profileState.displayName}.`
      );
    } catch {
      setActionMessage('Không thể cập nhật trạng thái theo dõi.');
    } finally {
      setLoadingFollow(false);
    }
  };

  const shareProfile = async () => {
    if (typeof window === 'undefined') {
      return;
    }
    const shareUrl = `${window.location.origin}/community/${encodeURIComponent(profileState.id)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setActionMessage('Đã sao chép link hồ sơ.');
    } catch {
      window.prompt('Sao chép link hồ sơ', shareUrl);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile card */}
      <section className="rounded-xl bg-surface-container p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-container-high">
            <Image
              src={profileState.avatarUrl}
              alt={profileState.displayName}
              fill
              className="object-cover"
            />
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="stitch-chip stitch-chip-sky text-[10px] px-2 py-0.5">
                {profileState.region}
              </span>
              <span className="stitch-chip text-[10px] px-2 py-0.5">
                {profileState.country}
              </span>
              <span className="stitch-chip text-[10px] px-2 py-0.5">
                @{profileState.username}
              </span>
            </div>

            <h1 className="stitch-headline text-3xl sm:text-4xl">
              {profileState.displayName}
            </h1>

            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Build" value={formatNumber(profileState.buildsCount)} />
              <StatCard label="Following" value={formatNumber(profileState.following)} />
              <StatCard label="Followers" value={formatNumber(profileState.followers)} />
            </div>

            <div className="rounded-lg bg-surface-container-high/60 p-3 text-sm text-on-surface">
              Tỷ lệ tương tác:{' '}
              <span className="font-bold text-on-surface">{ratioText}</span> (followers / following)
            </div>

            {actionMessage ? (
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-2 text-xs text-primary-fixed">
                {actionMessage}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={toggleFollow}
                disabled={loadingFollow}
                className={
                  profileState.isFollowing
                    ? 'rounded-lg border border-on-surface/10 bg-white/5 px-5 py-2 text-sm font-bold uppercase tracking-wider text-on-surface transition-all hover:bg-white/10 disabled:opacity-60'
                    : 'stitch-cta disabled:opacity-60'
                }
              >
                {loadingFollow
                  ? 'Đang xử lý...'
                  : profileState.isFollowing
                    ? 'Bỏ theo dõi'
                    : 'Theo dõi'}
              </button>
              <button
                type="button"
                onClick={shareProfile}
                className="rounded-lg border border-on-surface/10 bg-white/5 px-5 py-2 text-sm font-bold uppercase tracking-wider text-on-surface transition-all hover:bg-white/10"
              >
                Chia sẻ
              </button>
              <Link
                href="/community"
                className="rounded-lg border border-on-surface/10 bg-white/5 px-5 py-2 text-sm font-bold uppercase tracking-wider text-on-surface transition-all hover:bg-white/10"
              >
                ← Cộng đồng
              </Link>
              <Link
                href="/doi-hinh"
                className="rounded-lg border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-bold uppercase tracking-wider text-primary-fixed transition-all hover:bg-primary/20"
              >
                Tạo đội hình
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Favorite player */}
      <section className="rounded-xl bg-surface-container p-6">
        <p className="stitch-label-accent">Favorite</p>
        <h2 className="stitch-section-title mt-2">Cầu thủ yêu thích</h2>

        {favoritePlayer ? (
          <Link href={`/cau-thu/${favoritePlayer.efhubId}`} className="mt-4 block">
            <div className="rounded-lg bg-surface-container-high/60 p-4 transition-all hover:bg-surface-container-high">
              <div className="flex gap-4">
                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-surface-container">
                  <Image
                    src={favoritePlayer.images.card}
                    alt={favoritePlayer.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-lg font-black text-on-surface">{favoritePlayer.name}</div>
                  <div className="text-sm text-on-surface-variant">
                    {favoritePlayer.positions[0]} | {favoritePlayer.club}
                  </div>
                  <span className="stitch-chip stitch-chip-emerald text-[10px] px-2 py-0.5">
                    OVR {favoritePlayer.overall.max}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <div className="mt-4 rounded-lg bg-surface-container-high/60 p-4 text-sm text-on-surface-variant">
            Hồ sơ này chưa có cầu thủ yêu thích trong dữ liệu hiện tại.
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-container-high/60 p-3 text-center">
      <div className="text-lg font-black text-on-surface">{value}</div>
      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-outline">
        {label}
      </div>
    </div>
  );
}
