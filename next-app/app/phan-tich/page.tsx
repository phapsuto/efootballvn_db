import Link from 'next/link';

import { SiteHeader } from '@/components/layout/site-header';
import { listLeagueTeams, listManagers, listPlayers } from '@/lib/data/repository';

const SECTION_LINKS = [
  { href: '#tan-cong', label: 'Tấn công' },
  { href: '#phong-ngu', label: 'Phòng ngự' },
  { href: '#chi-so', label: 'Chỉ số HLV' },
  { href: '#phan-tich', label: 'Phân tích ranking' }
] as const;

export default async function AnalyticsPage() {
  const [attackers, defenders, managersResult, teamsResult] = await Promise.all([
    listPlayers({ page: 1, limit: 4, position: 'CF', sortBy: 'overall_desc', minOvr: 1 }),
    listPlayers({ page: 1, limit: 4, position: 'CB', sortBy: 'overall_desc', minOvr: 1 }),
    listManagers({ page: 1, limit: 4, sortBy: 'style_desc' }),
    listLeagueTeams({ page: 1, limit: 4, sortBy: 'points_desc', mode: 'all' })
  ]);

  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/phan-tich" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8 xl:grid xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-8">
        <aside className="hidden xl:block">
          <div className="sticky top-24 rounded-xl bg-surface-container p-5">
            <p className="stitch-label-accent">Bản đồ</p>
            <h3 className="mt-2 text-sm font-black uppercase tracking-wider text-on-surface">
              Tactical Hub
            </h3>
            <nav className="mt-5 flex flex-col gap-2">
              {SECTION_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg bg-surface-container-high/60 px-4 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high hover:text-on-surface"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <div className="space-y-10">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-xl bg-surface-container px-8 py-10 sm:px-12 sm:py-14">
            <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary/10 to-transparent" />
            <span className="stitch-chip stitch-chip-emerald">Tactical Hub</span>
            <p className="stitch-label-accent mt-5">Tấn công · Phòng ngự · Độ hợp · Xu hướng</p>
            <h1 className="stitch-headline text-4xl sm:text-5xl mt-2">Phân tích meta</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface">
              Side navigation giữ cấu trúc tactical hub của Stitch. Mỗi section nối sang dữ liệu
              player, manager và rankings thật đang có trong app.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/so-sanh" className="stitch-cta">Bắt đầu so sánh</Link>
              <Link
                href="/doi-hinh"
                className="rounded-lg border border-on-surface/10 bg-white/5 px-5 py-2 text-sm font-bold uppercase tracking-wider text-on-surface transition-all hover:bg-white/10"
              >
                Tạo đội hình
              </Link>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {[
                {
                  label: 'Mũi nhọn',
                  value: attackers.data[0]?.overall.max ?? '--',
                  hint: attackers.data[0]?.name ?? 'Chưa có dữ liệu'
                },
                {
                  label: 'Chốt chặn',
                  value: defenders.data[0]?.overall.max ?? '--',
                  hint: defenders.data[0]?.name ?? 'Chưa có dữ liệu'
                },
                {
                  label: 'Độ hợp HLV',
                  value: managersResult.data.length,
                  hint: 'HLV test influence'
                },
                {
                  label: 'Đội đang tăng',
                  value: teamsResult.data.length,
                  hint: 'Nhóm đội top theo dõi'
                }
              ].map((item) => (
                <article key={item.label} className="rounded-lg bg-surface-container-high/60 p-4">
                  <p className="stitch-label">{item.label}</p>
                  <p className="mt-2 text-2xl font-black text-on-surface">{item.value}</p>
                  <p className="mt-2 text-sm text-on-surface-variant">{item.hint}</p>
                </article>
              ))}
            </div>
          </section>

          {/* Attackers */}
          <section id="tan-cong">
            <div className="mb-5">
              <p className="stitch-label-accent">Attack</p>
              <h2 className="stitch-section-title mt-2">Tấn công</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Nhóm cầu thủ có profile dứt điểm và xuyên phá nổi bật.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {attackers.data.map((player) => (
                <Link
                  key={player.efhubId}
                  href={`/cau-thu/${encodeURIComponent(player.efhubId)}`}
                  className="group rounded-xl bg-surface-container p-5 transition-all hover:bg-surface-container-high"
                >
                  <p className="text-base font-black text-on-surface group-hover:text-primary">
                    {player.name}
                  </p>
                  <p className="mt-1 text-sm text-on-surface-variant">{player.club}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="stitch-label">OVR</span>
                    <span className="text-2xl font-black text-primary">{player.overall.max}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Defenders */}
          <section id="phong-ngu">
            <div className="mb-5">
              <p className="stitch-label-accent">Defense</p>
              <h2 className="stitch-section-title mt-2">Phòng ngự</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Điểm vào nhanh cho trung vệ và lớp che chắn phía sau.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {defenders.data.map((player) => (
                <Link
                  key={player.efhubId}
                  href={`/cau-thu/${encodeURIComponent(player.efhubId)}`}
                  className="group rounded-xl bg-surface-container p-5 transition-all hover:bg-surface-container-high"
                >
                  <p className="text-base font-black text-on-surface group-hover:text-primary">
                    {player.name}
                  </p>
                  <p className="mt-1 text-sm text-on-surface-variant">{player.club}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="stitch-label">OVR</span>
                    <span className="text-2xl font-black text-primary">{player.overall.max}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Managers + rankings */}
          <section id="chi-so" className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-xl bg-surface-container p-6">
              <p className="stitch-label-accent">Managers</p>
              <h2 className="stitch-section-title mt-2">Chỉ số HLV</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Manager influence model đã bind vào player calculation và lineup metrics.
              </p>
              <div className="mt-5 space-y-3">
                {managersResult.data.map((manager) => (
                  <Link
                    key={manager.efhubId}
                    href={`/hlv/${encodeURIComponent(manager.efhubId)}`}
                    className="block rounded-lg bg-surface-container-high/60 p-4 transition-all hover:bg-surface-container-high"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-on-surface">{manager.name}</p>
                        <p className="mt-1 text-sm text-on-surface-variant">{manager.team}</p>
                      </div>
                      <span className="stitch-chip stitch-chip-emerald text-[10px] px-2 py-0.5">
                        {manager.formation}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </article>

            <article id="phan-tich" className="rounded-xl bg-surface-container p-6">
              <p className="stitch-label-accent">Ranking</p>
              <h2 className="stitch-section-title mt-2">Phân tích ranking</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Đọc nhịp dịch chuyển của đội top qua trend/delta/history.
              </p>
              <div className="mt-5 space-y-3">
                {teamsResult.data.map((team) => (
                  <Link
                    key={team.id}
                    href={`/tournaments/${encodeURIComponent(team.id)}`}
                    className="flex items-center justify-between rounded-lg bg-surface-container-high/60 p-4 transition-all hover:bg-surface-container-high"
                  >
                    <div>
                      <p className="text-sm font-black text-on-surface">{team.name}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-outline">
                        {team.members} thành viên
                      </p>
                    </div>
                    <span className="text-lg font-black text-primary">{team.points}</span>
                  </Link>
                ))}
              </div>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}
