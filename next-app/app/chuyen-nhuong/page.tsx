import Link from 'next/link';

import { SiteHeader } from '@/components/layout/site-header';
import { getPlayerById, listPacks } from '@/lib/data/repository';
import { getPackTiming } from '@/lib/packs/pack-timing';

export default async function TransferWatchPage() {
  const packsResult = await listPacks({ page: 1, limit: 4 });
  const featuredPlayers = (
    await Promise.all(
      packsResult.data
        .flatMap((pack) => pack.playerIds.slice(0, 2))
        .slice(0, 6)
        .map((playerId) => getPlayerById(playerId))
    )
  ).filter((player): player is NonNullable<typeof player> => Boolean(player));

  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/chuyen-nhuong" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-xl bg-surface-container px-8 py-10 sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-tertiary/10 to-transparent" />
          <span className="stitch-chip stitch-chip-amber">Pack Watch</span>
          <p className="stitch-label-accent mt-5">Cửa sổ pack · Thẻ nổi bật · Thời điểm</p>
          <h1 className="stitch-headline text-4xl sm:text-5xl mt-2">
            Chuyển nhượng & pack watch
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface">
            Cổng thông tin chuyên biệt để theo dõi sát sao thời hạn mở các gói thẻ (Packs), danh sách cầu thủ nổi bật và thời gian đếm ngược chính xác.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/packs" className="stitch-cta">Xem tất cả packs</Link>
            <Link
              href="/thong-bao"
              className="rounded-lg border border-on-surface/10 bg-white/5 px-5 py-2 text-sm font-bold uppercase tracking-wider text-on-surface transition-all hover:bg-white/10"
            >
              Nhịp cập nhật
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-lg bg-surface-container-high/60 p-4">
              <p className="stitch-label">Gói thẻ hoạt động</p>
               <p className="mt-2 text-2xl font-black text-on-surface">{packsResult.data.length}</p>
               <p className="mt-2 text-sm text-on-surface-variant">
                Các gói thẻ mới nhất được cập nhật trực tiếp.
              </p>
            </article>
            <article className="rounded-lg bg-surface-container-high/60 p-4">
              <p className="stitch-label">Cầu thủ nổi bật</p>
               <p className="mt-2 text-2xl font-black text-on-surface">{featuredPlayers.length}</p>
               <p className="mt-2 text-sm text-on-surface-variant">
                Danh sách cầu thủ chất lượng cao từ các gói thẻ.
              </p>
            </article>
            <article className="rounded-lg bg-surface-container-high/60 p-4">
              <p className="stitch-label">Múi giờ</p>
               <p className="mt-2 text-2xl font-black text-on-surface">HCMC</p>
               <p className="mt-2 text-sm text-on-surface-variant">
                Đếm ngược thời gian chính xác theo giờ Việt Nam.
              </p>
            </article>
          </div>
        </section>

        {/* Cửa sổ pack */}
        <section>
          <div className="mb-5">
            <p className="stitch-label-accent">Pack Window</p>
            <h2 className="stitch-section-title mt-2">Cửa sổ pack</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Thời gian đếm ngược thực tế để bạn biết gói thẻ nào đang diễn ra.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {packsResult.data.map((pack) => {
              const timing = getPackTiming(pack);
              return (
                <Link
                  key={pack.id}
                  href={`/packs/${encodeURIComponent(pack.id)}`}
                  className="group rounded-xl bg-surface-container p-5 transition-all hover:bg-surface-container-high"
                >
                  <p className="stitch-chip stitch-chip-amber text-[10px] px-2 py-0.5">
                    {pack.type}
                  </p>
                  <h3 className="mt-3 text-lg font-black text-on-surface group-hover:text-tertiary-fixed">
                    {pack.name}
                  </h3>
                  <p className="mt-3 text-sm text-on-surface-variant">{timing.timeWindowLabel}</p>
                  <p className="mt-2 text-sm font-bold text-primary">
                    {timing.countdownLabel}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Featured players */}
        <section>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="stitch-label-accent">Featured</p>
              <h2 className="stitch-section-title mt-2">Cầu thủ đáng chú ý</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Danh sách các cầu thủ chất lượng cao có trong gói thẻ hiện tại.
              </p>
            </div>
            <Link
              href="/cau-thu"
              className="text-xs font-bold uppercase tracking-wider text-primary hover:text-primary"
            >
              Mở danh sách cầu thủ →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredPlayers.map((player) => (
              <Link
                key={player.efhubId}
                href={`/cau-thu/${encodeURIComponent(player.efhubId)}`}
                className="group rounded-xl bg-surface-container p-5 transition-all hover:bg-surface-container-high"
              >
                <p className="text-lg font-black text-on-surface group-hover:text-primary">
                  {player.name}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">{player.club}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="stitch-chip text-[10px] px-2 py-0.5">{player.cardType}</span>
                  <span className="text-2xl font-black text-primary">
                    {player.overall.max}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
