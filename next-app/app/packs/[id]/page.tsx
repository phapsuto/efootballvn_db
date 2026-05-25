import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SiteHeader } from '@/components/layout/site-header';
import { getPackById, getPlayersByIds } from '@/lib/data/repository';
import { getPackTiming } from '@/lib/packs/pack-timing';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PackDetailPage({ params }: PageProps) {
  const { id } = await params;
  const pack = await getPackById(id);
  if (!pack) {
    notFound();
  }

  const players = await getPlayersByIds(pack.playerIds);
  const timing = getPackTiming(pack);

  const averageOvr =
    players.length > 0
      ? Math.round(
          players.reduce((sum, player) => sum + Number(player.overall.max || 0), 0) /
            players.length
        )
      : 0;
  const topOvr = players.reduce(
    (max, player) => Math.max(max, Number(player.overall.max || 0)),
    0
  );
  const positionCount = players.reduce<Record<string, number>>((acc, player) => {
    const position = String(player.positions?.[0] || 'N/A');
    acc[position] = (acc[position] || 0) + 1;
    return acc;
  }, {});
  const topPositions = Object.entries(positionCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const statusChip =
    timing.status === 'active'
      ? 'stitch-chip stitch-chip-emerald'
      : 'stitch-chip';

  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/packs" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
        {/* Hero pack */}
        <section className="overflow-hidden rounded-xl bg-surface-container">
          <div className="relative h-56 w-full bg-surface-container-high sm:h-72">
            <Image src={pack.bannerImage} alt={pack.name} fill className="object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/40 to-transparent" />
          </div>
          <div className="space-y-3 p-6 sm:p-8">
            <div className="flex flex-wrap gap-2">
              <span className="stitch-chip stitch-chip-amber text-[10px] px-2 py-0.5">
                {pack.type}
              </span>
              <span className={`${statusChip} text-[10px] px-2 py-0.5`}>
                {timing.statusLabel}
              </span>
            </div>
            <h1 className="stitch-headline text-3xl sm:text-4xl">{pack.name}</h1>
            <p className="text-sm text-on-surface-variant">{timing.timeWindowLabel}</p>
            <p className="text-sm font-bold text-primary">{timing.countdownLabel}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
              {timing.timezoneLabel}
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Trạng thái', value: timing.statusLabel },
            { label: 'Số cầu thủ', value: String(players.length) },
            { label: 'OVR trung bình', value: String(averageOvr) },
            { label: 'Top OVR', value: String(topOvr) }
          ].map((stat) => (
            <article key={stat.label} className="rounded-lg bg-surface-container p-4">
              <p className="stitch-label">{stat.label}</p>
              <p className="mt-2 text-2xl font-black text-on-surface">{stat.value}</p>
            </article>
          ))}
        </section>

        {/* Phân bố vị trí */}
        {topPositions.length > 0 ? (
          <section className="rounded-xl bg-surface-container p-6">
            <p className="stitch-label-accent">Position Mix</p>
            <h2 className="stitch-section-title mt-2">Phân bố vị trí</h2>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {topPositions.map(([position, count]) => (
                <span
                  key={position}
                  className="stitch-chip text-xs px-3 py-1"
                >
                  {position} · {count}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {/* Players grid */}
        <section>
          <div className="mb-5">
            <p className="stitch-label-accent">Pack Roster</p>
            <h2 className="stitch-section-title mt-2">Cầu thủ trong pack</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {players.map((player) => (
              <Link
                key={player.efhubId}
                href={`/cau-thu/${player.efhubId}`}
                className="group rounded-xl bg-surface-container p-3 transition-all hover:bg-surface-container-high"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-surface-container-high">
                  <Image
                    src={player.images.card}
                    alt={player.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute right-2 top-2 rounded bg-background/80 px-2 py-0.5 text-xs font-black text-primary">
                    {player.overall.max}
                  </span>
                </div>
                <p className="mt-3 line-clamp-1 text-sm font-black uppercase text-on-surface group-hover:text-primary transition-colors">
                  {player.name}
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-outline">
                  {player.positions[0] || '--'}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
