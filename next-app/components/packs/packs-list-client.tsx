'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { getPackTiming } from '@/lib/packs/pack-timing';
import type { Pack } from '@/types/domain';

type PackApiResult = {
  data: Pack[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    source: string;
  };
};

export function PacksListClient() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<PackApiResult | null>(null);

  const summaryText = useMemo(() => {
    if (loading) {
      return 'Đang tải gói cầu thủ...';
    }
    if (error) {
      return 'Lỗi tải gói cầu thủ.';
    }
    return `Tìm thấy ${(result?.meta.total || 0).toLocaleString('vi-VN')} gói cầu thủ`;
  }, [error, loading, result]);

  const loadPacks = async (q: string) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ page: '1', limit: '24' });
      if (q.trim()) {
        params.set('q', q.trim());
      }
      const response = await fetch(`/api/packs?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload: PackApiResult = await response.json();
      setResult(payload);
    } catch {
      setError('Không thể tải dữ liệu pack từ API.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPacks('');
  }, []);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="rounded-xl bg-surface-container p-5 sm:p-6">
        <label className="stitch-label">Tìm gói cầu thủ</label>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void loadPacks(query);
            }
          }}
          placeholder="Ví dụ: Epic, Highlight..."
          className="mt-2 h-12 w-full rounded-lg border border-on-surface/10 bg-surface-container-high/60 px-4 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
        />
      </div>

      <p className="text-sm text-on-surface-variant">{summaryText}</p>

      {error ? (
        <div className="rounded-lg border border-error/30 bg-error/10 p-4 text-sm text-error">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {(result?.data || []).map((pack) => {
          const timing = getPackTiming(pack);
          const statusChip =
            timing.status === 'active'
              ? 'stitch-chip stitch-chip-emerald'
              : 'stitch-chip';

          return (
            <Link
              key={pack.id}
              href={`/packs/${pack.id}`}
              className="group overflow-hidden rounded-xl bg-surface-container transition-all hover:bg-surface-container-high"
            >
              <div className="relative h-44 w-full bg-surface-container-high">
                <Image
                  src={pack.bannerImage}
                  alt={pack.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/30 to-transparent" />
              </div>
              <div className="space-y-2 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="stitch-chip stitch-chip-amber text-[10px] px-2 py-0.5">
                    {pack.type}
                  </span>
                  <span className={`${statusChip} text-[10px] px-2 py-0.5`}>
                    {timing.statusLabel}
                  </span>
                </div>
                <h3 className="text-lg font-black text-on-surface group-hover:text-tertiary-fixed transition-colors">
                  {pack.name}
                </h3>
                <p className="text-sm text-on-surface-variant">{timing.timeWindowLabel}</p>
                <p className="text-xs font-bold text-primary">{timing.countdownLabel}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
                  {timing.timezoneLabel} · {pack.playerIds.length} cầu thủ
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
