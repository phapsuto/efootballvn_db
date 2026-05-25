import Link from 'next/link';

import { SiteHeader } from '@/components/layout/site-header';
import { getSyncPipelineStatus } from '@/lib/sync/status';
import { listLeagueTeams, listPacks } from '@/lib/data/repository';
import { getPackTiming } from '@/lib/packs/pack-timing';

export default async function NotificationsPage() {
  const [pipeline, packsResult, leagueResult] = await Promise.all([
    getSyncPipelineStatus(),
    listPacks({ page: 1, limit: 4 }),
    listLeagueTeams({ page: 1, limit: 4, sortBy: 'updated_desc', mode: 'all' })
  ]);

  const lastRun = pipeline.sync.lastRun as
    | {
        running?: boolean | null;
        ok?: boolean | null;
        message?: string | null;
        importTotals?: unknown;
      }
    | null
    | undefined;
  const importTotals = lastRun?.importTotals as
    | { newCount?: number; updatedCount?: number; unchangedCount?: number }
    | null
    | undefined;

  const statusLabel = lastRun?.running
    ? 'Đang chạy'
    : lastRun?.ok
      ? 'Ổn định'
      : 'Chờ lần chạy mới';

  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/thong-bao" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-xl bg-surface-container px-8 py-10 sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary/10 to-transparent" />
          <span className="stitch-chip stitch-chip-sky">Trung tâm thông báo</span>
          <p className="stitch-label-accent mt-5">Hệ thống · Đồng bộ · Nhịp chạy</p>
          <h1 className="stitch-headline text-4xl sm:text-5xl mt-2">Thông báo hệ thống</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface">
            Card nào cũng kéo dữ liệu thật từ health, packs hoặc rankings – không còn nút notification trống.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="stitch-chip stitch-chip-sky">Trạng thái sync</span>
            <span className="stitch-chip stitch-chip-amber">Pack theo HCMC</span>
            <span className="stitch-chip stitch-chip-emerald">Biến động xếp hạng</span>
          </div>
        </section>

        {/* Sync status + nhịp cập nhật */}
        <section className="grid gap-4 lg:grid-cols-3">
          <article className="lg:col-span-2 rounded-xl bg-surface-container p-6">
            <p className="stitch-label-accent">Pipeline</p>
            <h2 className="stitch-section-title mt-2">Trạng thái sync</h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Đọc trực tiếp từ status scraper/import trong workspace.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-surface-container-high/60 p-4">
                <p className="stitch-label">Trạng thái</p>
                <p className="mt-2 text-xl font-black text-on-surface">{statusLabel}</p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {lastRun?.message || 'Chưa có message mới.'}
                </p>
              </div>
              <div className="rounded-lg bg-surface-container-high/60 p-4">
                <p className="stitch-label">New / Updated</p>
                <p className="mt-2 text-xl font-black text-on-surface">
                  {(importTotals?.newCount || 0) + (importTotals?.updatedCount || 0)}
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {importTotals?.newCount || 0} mới · {importTotals?.updatedCount || 0} cập nhật
                </p>
              </div>
              <div className="rounded-lg bg-surface-container-high/60 p-4">
                <p className="stitch-label">Nhịp chạy</p>
                <p className="mt-2 text-xl font-black text-on-surface">HCMC</p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Tối thứ 2 & thứ 5, plus check định kỳ hàng giờ.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-xl bg-surface-container p-6">
            <p className="stitch-label-accent">Nhịp cập nhật</p>
            <h2 className="stitch-section-title mt-2">Khi nào có nội dung mới</h2>
            <div className="mt-4 space-y-3 text-sm text-on-surface leading-6">
              <p>
                Konami và cộng đồng thường thay đổi nội dung chiều tối thứ 2 và thứ 5 theo giờ
                Hồ Chí Minh.
              </p>
              <p>Scraper/sync đã chuẩn hóa theo khung giờ này để giảm độ trễ.</p>
              <Link
                href="/chuyen-nhuong"
                className="stitch-cta mt-2 inline-flex"
              >
                Mở pack watch
              </Link>
            </div>
          </article>
        </section>

        {/* Packs + teams biến động */}
        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-xl bg-surface-container p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="stitch-label-accent">Pack watch</p>
                <h2 className="stitch-section-title mt-2">Packs đang theo dõi</h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Đi thẳng sang detail pack hoặc module chuyển nhượng.
                </p>
              </div>
              <Link
                href="/packs"
                className="text-xs font-bold uppercase tracking-wider text-tertiary hover:text-tertiary-fixed"
              >
                Mở packs →
              </Link>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {packsResult.data.map((pack) => {
                const timing = getPackTiming(pack);
                return (
                  <Link
                    key={pack.id}
                    href={`/packs/${encodeURIComponent(pack.id)}`}
                    className="group rounded-lg bg-surface-container-high/60 p-4 transition-all hover:bg-surface-container-high"
                  >
                    <p className="stitch-chip stitch-chip-amber text-[10px] px-2 py-0.5">
                      {pack.type}
                    </p>
                    <p className="mt-3 text-base font-black text-on-surface group-hover:text-tertiary-fixed">
                      {pack.name}
                    </p>
                    <p className="mt-2 text-sm text-on-surface-variant">{timing.timeWindowLabel}</p>
                    <p className="mt-2 text-sm font-bold text-primary">
                      {timing.countdownLabel}
                    </p>
                  </Link>
                );
              })}
            </div>
          </article>

          <article className="rounded-xl bg-surface-container p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="stitch-label-accent">Rankings</p>
                <h2 className="stitch-section-title mt-2">Đội vừa biến động</h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Nối thẳng sang team detail thay cho badge trống.
                </p>
              </div>
              <Link
                href="/tournaments"
                className="text-xs font-bold uppercase tracking-wider text-primary hover:text-primary-fixed"
              >
                Mở rankings →
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {leagueResult.data.map((team) => (
                <Link
                  key={team.id}
                  href={`/tournaments/${encodeURIComponent(team.id)}`}
                  className="flex items-center justify-between rounded-lg bg-surface-container-high/60 p-4 transition-all hover:bg-surface-container-high"
                >
                  <div>
                    <p className="text-sm font-black text-on-surface">{team.name}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-outline">
                      {team.updatedAt}
                    </p>
                  </div>
                  <span className="text-lg font-black text-primary">{team.points}</span>
                </Link>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
