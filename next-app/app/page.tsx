import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { SiteHeader } from '@/components/layout/site-header';
import { getSyncPipelineStatus } from '@/lib/sync/status';
import { listLeagueTeams, listManagers, listPacks, listPlayers, listGuides } from '@/lib/data/repository';
import { getPackTiming } from '@/lib/packs/pack-timing';

export default async function HomePage() {
  const [playersResult, managersResult, packsResult, leagueResult, pipeline, guides] = await Promise.all([
    listPlayers({ page: 1, limit: 4, minOvr: 90, sortBy: 'overall_desc' }),
    listManagers({ page: 1, limit: 4, sortBy: 'style_desc' }),
    listPacks({ page: 1, limit: 3 }),
    listLeagueTeams({ page: 1, limit: 3, sortBy: 'points_desc', mode: 'all' }),
    getSyncPipelineStatus(),
    listGuides()
  ]);

  const syncFinishedAt = pipeline.sync.lastRun?.finishedAt || pipeline.scrape.lastSuccess?.finishedAt;
  const syncLabel =
    typeof syncFinishedAt === 'string' && syncFinishedAt.trim() ? syncFinishedAt : 'Chưa có lịch sử sync';

  const quickLinks = [
    {
      title: 'Trung tâm công cụ',
      description: 'Giả lập tăng chỉ số, so sánh đối đầu và phân tích chuyên sâu.',
      href: '/cong-cu',
      kicker: 'Tools'
    },
    {
      title: 'Từ điển Skills',
      description: 'Player Skills, GK Skills và Playstyles song ngữ trực quan.',
      href: '/tinh-nang',
      kicker: 'Codex'
    },
    {
      title: 'Thông báo hệ thống',
      description: 'Cập nhật tình trạng dữ liệu và lịch hoạt động eFootball.',
      href: '/thong-bao',
      kicker: 'Status'
    },
    {
      title: 'Phân tích meta',
      description: 'Đánh giá chi tiết về phong cách cầu thủ, HLV và bảng xếp hạng.',
      href: '/phan-tich',
      kicker: 'Insights'
    }
  ];

  const stats = [
    {
      label: 'Cầu thủ',
      value: playersResult.meta.total.toLocaleString('vi-VN'),
      hint: playersResult.meta.source === 'mongo' ? 'Dữ liệu trực tiếp' : 'Dữ liệu hệ thống'
    },
    {
      label: 'Huấn luyện viên',
      value: managersResult.meta.total.toLocaleString('vi-VN'),
      hint: 'Thông tin chi tiết'
    },
    {
      label: 'Packs thẻ',
      value: packsResult.meta.total.toLocaleString('vi-VN'),
      hint: 'Cập nhật trực tiếp'
    },
    {
      label: 'Đồng bộ',
      value: syncLabel === 'Chưa có lịch sử sync' ? 'Tự động' : 'Đang chạy',
      hint: 'Cập nhật múi giờ VN'
    }
  ];

  const latestGuides = JSON.parse(JSON.stringify(guides.slice(0, 3)));

  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/" />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-on-surface/5 bg-gradient-to-br from-background via-surface-container to-background">
          <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-20 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="max-w-screen-2xl mx-auto px-6 py-16 lg:py-20 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-center">
            <div>
              <span className="stitch-chip stitch-chip-emerald mb-4">Cộng Đồng Việt Nam</span>
              <h1 className="stitch-headline text-5xl sm:text-6xl leading-[0.9] max-w-3xl">
                eFootball Hub VN
                <br />
                <span className="text-primary text-3xl sm:text-4xl block mt-2 font-medium tracking-wide">Cơ sở dữ liệu &amp; Công cụ chuyên sâu</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-on-surface">
                Tra cứu thông tin cầu thủ chi tiết, giả lập tăng chỉ số tối đa (lv max), xây dựng đội hình chiến thuật và so sánh đối đầu eFootball chuyên nghiệp.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/cau-thu" className="stitch-cta">
                  Khám phá cầu thủ
                </Link>
                <Link
                  href="/doi-hinh"
                  className="rounded-lg border border-on-surface/10 bg-white/5 px-5 py-2 text-sm font-bold uppercase tracking-wider text-on-surface transition-all hover:bg-white/10"
                >
                  Xây đội hình
                </Link>
                <Link
                  href="/cam-nang"
                  className="rounded-lg border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary/20"
                >
                  Mở cẩm nang
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl bg-surface-container/70 p-5 backdrop-blur-sm transition-all hover:bg-surface-container"
                >
                  <p className="stitch-label">{item.label}</p>
                  <p className="mt-3 text-4xl font-black italic text-primary leading-none">
                    {item.value}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs text-outline">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick links */}
        <section className="max-w-screen-2xl mx-auto px-6 py-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="stitch-label-accent">Shortcut</p>
              <h2 className="stitch-section-title mt-2">Điểm vào nhanh</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-xl bg-surface-container p-5 transition-all hover:bg-surface-container-high hover:shadow-lg hover:shadow-primary/5"
              >
                <p className="stitch-label">{item.kicker}</p>
                <p className="mt-3 text-lg font-black text-on-surface group-hover:text-primary transition-colors">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{item.description}</p>
                <p className="mt-5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                  Mở ngay
                  <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured players + rankings */}
        <section className="max-w-screen-2xl mx-auto px-6 pb-12 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-xl bg-surface-container p-6">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="stitch-label-accent">Top OVR</p>
                <h2 className="stitch-section-title mt-2">Cầu thủ nổi bật</h2>
              </div>
              <Link
                href="/cau-thu"
                className="text-xs font-bold uppercase tracking-wider text-primary hover:text-primary"
              >
                Xem tất cả →
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {playersResult.data.map((player) => (
                <Link
                  key={player.efhubId}
                  href={`/cau-thu/${encodeURIComponent(player.efhubId)}`}
                  className="group relative rounded-lg bg-surface-container-high/60 p-4 transition-all hover:bg-surface-container-high hover:ring-1 hover:ring-primary/40"
                >
                  <div className="absolute top-3 right-3 text-right">
                    <div className="text-3xl font-black italic text-primary leading-none">
                      {player.overall.max}
                    </div>
                    <div className="stitch-stat-label mt-0.5">OVR</div>
                  </div>
                  <p className="pr-14 text-base font-bold text-on-surface uppercase group-hover:text-primary transition-colors">
                    {player.name}
                  </p>
                  <p className="mt-1 text-xs text-outline uppercase tracking-wider">{player.club}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {player.positions.slice(0, 3).map((pos) => (
                      <span
                        key={`${player.efhubId}-${pos}`}
                        className="stitch-chip stitch-chip-emerald text-[10px] px-2 py-0.5"
                      >
                        {pos}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </article>

          <article className="rounded-xl bg-surface-container p-6">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="stitch-label-accent">Bảng xếp hạng</p>
                <h2 className="stitch-section-title mt-2">Ranking</h2>
              </div>
              <Link
                href="/tournaments"
                className="text-xs font-bold uppercase tracking-wider text-primary hover:text-primary"
              >
                Xem tất cả →
              </Link>
            </div>
            <div className="space-y-2">
              {leagueResult.data.map((team, idx) => (
                <Link
                  key={team.id}
                  href={`/tournaments/${encodeURIComponent(team.id)}`}
                  className="flex items-center justify-between rounded-lg bg-surface-container-high/60 px-4 py-3 transition-all hover:bg-surface-container-high"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black italic text-outline w-6">#{idx + 1}</span>
                    <div>
                      <p className="text-sm font-bold text-on-surface">{team.name}</p>
                      <p className="text-[10px] uppercase tracking-wider text-outline">
                        {team.members} thành viên
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-black text-primary">{team.points}</span>
                </Link>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-on-surface/5">
              <p className="stitch-label mb-3">Top HLV</p>
              <div className="grid gap-2">
                {managersResult.data.slice(0, 2).map((manager) => (
                  <Link
                    key={manager.efhubId}
                    href={`/hlv/${encodeURIComponent(manager.efhubId)}`}
                    className="rounded-lg bg-surface-container-high/60 p-3 transition-all hover:bg-surface-container-high"
                  >
                    <p className="text-sm font-bold text-on-surface">{manager.name}</p>
                    <p className="text-xs text-outline">{manager.team}</p>
                  </Link>
                ))}
              </div>
            </div>
          </article>
        </section>

        {/* Latest Guides & Meta Updates */}
        <section className="max-w-screen-2xl mx-auto px-6 pb-12 border-t border-white/5 pt-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="stitch-label-accent">Học viện &amp; Chiến thuật</p>
              <h2 className="stitch-section-title mt-2">Cẩm nang &amp; Phân tích Meta mới</h2>
            </div>
            <Link
              href="/cam-nang"
              className="text-xs font-bold uppercase tracking-wider text-primary hover:text-primary"
            >
              Mở học viện →
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {latestGuides.map((guide) => (
              <Link
                key={guide.id}
                href="/cam-nang#thuat-ngu"
                className="group flex flex-col justify-between p-6 bg-surface-container/60 hover:bg-surface-container-high/80 border border-white/5 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`stitch-chip text-[10px] uppercase font-bold tracking-wider ${
                        guide.category === 'Chỉ số & Thuật ngữ'
                          ? 'stitch-chip-emerald'
                          : guide.category === 'Lối chơi đồng đội'
                          ? 'stitch-chip-amber'
                          : 'stitch-chip-sky'
                      }`}
                    >
                      {guide.category}
                    </span>
                    <span className="text-[10px] text-outline font-bold">
                      {guide.createdAt ? new Date(guide.createdAt).toLocaleDateString('vi-VN') : 'Mới'}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                    {guide.title}
                  </h3>
                  <p className="text-xs leading-5 text-on-surface-variant/80 line-clamp-3">
                    {guide.summary}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary group-hover:underline">
                    Chi tiết cẩm nang →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Packs */}
        <section className="max-w-screen-2xl mx-auto px-6 pb-16 border-t border-white/5 pt-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="stitch-label-accent">Nhịp cập nhật</p>
              <h2 className="stitch-section-title mt-2">Packs đang diễn ra</h2>
            </div>
            <Link
              href="/chuyen-nhuong"
              className="text-xs font-bold uppercase tracking-wider text-tertiary hover:text-tertiary"
            >
              Chuyển nhượng →
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {packsResult.data.map((pack) => {
              const timing = getPackTiming(pack);
              return (
                <Link
                  key={pack.id}
                  href={`/packs/${encodeURIComponent(pack.id)}`}
                  className="group relative overflow-hidden rounded-xl bg-surface-container p-6 transition-all hover:bg-surface-container-high"
                >
                  <span className="stitch-chip stitch-chip-amber">{pack.type}</span>
                  <h3 className="mt-4 text-xl font-black text-on-surface group-hover:text-tertiary transition-colors">
                    {pack.name}
                  </h3>
                  <p className="mt-3 text-sm text-on-surface-variant">{timing.timeWindowLabel}</p>
                  <p className="mt-2 text-sm font-bold text-primary">{timing.countdownLabel}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
