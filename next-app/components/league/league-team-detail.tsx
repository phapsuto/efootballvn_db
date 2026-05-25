import Image from 'next/image';
import Link from 'next/link';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

import type { LeagueTeam } from '@/types/domain';

function modeLabel(mode: LeagueTeam['mode']) {
  return mode === 'crossplay_coop' ? 'Co-op Crossplay' : 'Co-op Mobile';
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function signedValue(value: number) {
  const rounded = Math.round(Number(value || 0));
  if (rounded > 0) {
    return `+${rounded}`;
  }
  return String(rounded);
}

function trendIcon(value: number) {
  if (value > 0) {
    return <TrendingUp className="h-4 w-4" />;
  }
  if (value < 0) {
    return <TrendingDown className="h-4 w-4" />;
  }
  return <Minus className="h-4 w-4" />;
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

export function LeagueTeamDetail({ team }: { team: LeagueTeam }) {
  const pointsPerMember = team.members > 0 ? (team.points / team.members).toFixed(2) : '0.00';
  const history = (team.trend?.history || []).slice(-8);
  const pointsDelta24h = team.trend?.pointsDelta24h || 0;
  const rankDelta24h = team.trend?.rankDelta24h || 0;
  const pointValues = history.map((item) => item.points);
  const maxPoints = pointValues.length > 0 ? Math.max(...pointValues) : team.points;
  const minPoints = pointValues.length > 0 ? Math.min(...pointValues) : team.points;
  const range = Math.max(1, maxPoints - minPoints);

  return (
    <div className="space-y-8">
      {/* Team hero */}
      <section className="rounded-xl bg-surface-container p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-container-high">
            <Image src={team.logoUrl} alt={team.name} fill className="object-cover" />
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="stitch-chip stitch-chip-emerald text-[10px] px-2 py-0.5">
                {modeLabel(team.mode)}
              </span>
              <span className="stitch-chip text-[10px] px-2 py-0.5">
                Cập nhật: {new Date(team.updatedAt).toLocaleString('vi-VN')}
              </span>
            </div>

            <h1 className="stitch-headline text-3xl sm:text-4xl">{team.name}</h1>

            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Điểm" value={formatNumber(team.points)} />
              <StatCard label="Thành viên" value={formatNumber(team.members)} />
              <StatCard label="Điểm/TV" value={pointsPerMember} />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className={`rounded-lg px-3 py-3 text-sm ${trendClass(pointsDelta24h)}`}>
                <div className="flex items-center justify-center gap-1 font-bold">
                  {trendIcon(pointsDelta24h)}
                  <span>{signedValue(pointsDelta24h)}</span>
                </div>
                <div className="mt-1 text-center text-[10px] font-bold uppercase tracking-wider">
                  Điểm 24h
                </div>
              </div>
              <div className={`rounded-lg px-3 py-3 text-sm ${trendClass(rankDelta24h)}`}>
                <div className="flex items-center justify-center gap-1 font-bold">
                  {trendIcon(rankDelta24h)}
                  <span>{signedValue(rankDelta24h)}</span>
                </div>
                <div className="mt-1 text-center text-[10px] font-bold uppercase tracking-wider">
                  Hạng 24h
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-surface-container-high/60 p-3 text-sm text-on-surface">
              Chế độ <span className="font-bold text-on-surface">{modeLabel(team.mode)}</span> với
              tổng <span className="font-bold text-on-surface">{formatNumber(team.points)}</span>{' '}
              điểm.
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/tournaments"
                className="rounded-lg border border-on-surface/10 bg-white/5 px-5 py-2 text-sm font-bold uppercase tracking-wider text-on-surface transition-all hover:bg-white/10"
              >
                ← Bảng xếp hạng
              </Link>
              <Link href="/community" className="stitch-cta">
                Xem cộng đồng
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* History */}
      <section className="rounded-xl bg-surface-container p-6">
        <p className="stitch-label-accent">Delta</p>
        <h2 className="stitch-section-title mt-2">Biến động 24h</h2>

        {history.length > 0 ? (
          <>
            <div className="mt-5 grid grid-cols-8 items-end gap-2 rounded-lg bg-surface-container-high/60 p-4">
              {history.map((item) => {
                const normalized = Math.round(((item.points - minPoints) / range) * 100);
                const heightPercent = Math.max(12, normalized);
                return (
                  <div
                    key={`${item.timestamp}-${item.points}`}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full rounded-sm bg-primary/80"
                      style={{ height: `${heightPercent}px` }}
                    />
                    <div className="text-[10px] text-outline">
                      {new Date(item.timestamp).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 space-y-2">
              {history
                .slice()
                .reverse()
                .map((item) => (
                  <div
                    key={`${item.timestamp}-row`}
                    className="grid grid-cols-[1fr_auto_auto] gap-2 rounded-lg bg-surface-container-high/60 px-4 py-2 text-sm"
                  >
                    <div className="text-on-surface-variant">
                      {new Date(item.timestamp).toLocaleString('vi-VN')}
                    </div>
                    <div className="font-bold text-on-surface">{formatNumber(item.points)} đ</div>
                    <div className="text-xs text-outline">
                      {typeof item.rank === 'number' ? `Hạng ${item.rank}` : '—'}
                    </div>
                  </div>
                ))}
            </div>
          </>
        ) : (
          <div className="mt-5 rounded-lg bg-surface-container-high/60 p-4 text-sm text-on-surface-variant">
            Chưa có dữ liệu lịch sử điểm trong 24h.
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
