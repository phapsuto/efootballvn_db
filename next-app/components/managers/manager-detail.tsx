import Image from 'next/image';
import Link from 'next/link';

import type { Manager } from '@/types/domain';

function grade(value: number) {
  if (value >= 90) {
    return 'S';
  }
  if (value >= 85) {
    return 'A';
  }
  if (value >= 80) {
    return 'B';
  }
  return 'C';
}

function styleLabel(key: keyof Manager['playstyleProficiency']) {
  if (key === 'quickCounter') {
    return 'Quick Counter';
  }
  if (key === 'possessionGame') {
    return 'Possession Game';
  }
  if (key === 'longBallCounter') {
    return 'Long Ball Counter';
  }
  if (key === 'outWide') {
    return 'Out Wide';
  }
  return 'Long Ball';
}

export function ManagerDetail({ manager }: { manager: Manager }) {
  const styles = Object.entries(manager.playstyleProficiency) as Array<
    [keyof Manager['playstyleProficiency'], number]
  >;
  const topStyle = [...styles].sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="rounded-xl bg-surface-container p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-container-high">
            <Image src={manager.imageUrl} alt={manager.name} fill className="object-cover" />
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="stitch-chip stitch-chip-emerald text-[10px] px-2 py-0.5">
                {manager.formation}
              </span>
              <span className="stitch-chip text-[10px] px-2 py-0.5">{manager.team}</span>
              <span className="stitch-chip text-[10px] px-2 py-0.5">{manager.nationality}</span>
            </div>
            <h1 className="stitch-headline text-3xl sm:text-4xl">{manager.name}</h1>
            <p className="text-sm text-on-surface-variant">
              Playstyle cao nhất: {topStyle ? styleLabel(topStyle[0]) : 'Không có'}{' '}
              {topStyle ? `(Lv ${topStyle[1]})` : ''}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={`/doi-hinh?managerId=${encodeURIComponent(manager.efhubId)}&formation=${encodeURIComponent(
                  manager.formation
                )}`}
                className="stitch-cta"
              >
                Vào đội hình
              </Link>
              <Link
                href="/hlv"
                className="rounded-lg border border-on-surface/10 bg-white/5 px-5 py-2 text-sm font-bold uppercase tracking-wider text-on-surface transition-all hover:bg-white/10"
              >
                Quay lại HLV
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Playstyle proficiency */}
        <section className="rounded-xl bg-surface-container p-6">
          <p className="stitch-label-accent">Proficiency</p>
          <h2 className="stitch-section-title mt-2">Độ thuần thục playstyle</h2>
          <div className="mt-5 space-y-4">
            {styles.map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">{styleLabel(key)}</span>
                  <span className="font-bold text-on-surface">
                    {value} <span className="text-primary">({grade(value)})</span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Affinity */}
        <section className="rounded-xl bg-surface-container p-6">
          <p className="stitch-label-accent">Affinity</p>
          <h2 className="stitch-section-title mt-2">Độ hợp đội hình</h2>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <AffinityItem label="Tấn công" value={manager.affinity.attack} />
            <AffinityItem label="Tuyến giữa" value={manager.affinity.midfield} />
            <AffinityItem label="Phòng ngự" value={manager.affinity.defense} />
          </div>
          <p className="mt-5 rounded-lg bg-surface-container-high/60 p-4 text-sm text-on-surface leading-6">
            Gợi ý: ưu tiên chọn cầu thủ đúng role theo formation{' '}
            <span className="font-bold text-on-surface">{manager.formation}</span> để tối ưu độ gắn
            kết đội và hiệu quả vận hành chiến thuật.
          </p>
        </section>
      </div>
    </div>
  );
}

function AffinityItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-surface-container-high/60 p-4 text-center">
      <div className="text-2xl font-black text-on-surface">{value}</div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-outline">
        {label}
      </div>
    </div>
  );
}
