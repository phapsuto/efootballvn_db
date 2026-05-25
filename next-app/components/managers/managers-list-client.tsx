'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import type { Manager } from '@/types/domain';

type ManagerApiResult = {
  data: Manager[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    source: 'mock' | 'mongo';
  };
};

const PAGE_SIZE = 20;
const FORMATION_OPTIONS = ['4-3-3', '4-2-3-1', '4-4-2', '3-4-3', '3-5-2', '5-2-1-2'];
const PLAYSTYLE_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'quickCounter', label: 'Quick Counter' },
  { value: 'possessionGame', label: 'Possession Game' },
  { value: 'longBallCounter', label: 'Long Ball Counter' },
  { value: 'outWide', label: 'Out Wide' },
  { value: 'longBall', label: 'Long Ball' }
];
const MANAGER_SORT_OPTIONS: Array<{ value: FetchParams['sortBy']; label: string }> = [
  { value: 'style_desc', label: 'Playstyle cao nhất' },
  { value: 'style_asc', label: 'Playstyle thấp nhất' },
  { value: 'name_asc', label: 'Tên A → Z' },
  { value: 'name_desc', label: 'Tên Z → A' },
  { value: 'team_asc', label: 'CLB A → Z' },
  { value: 'team_desc', label: 'CLB Z → A' },
  { value: 'updated_desc', label: 'Mới cập nhật' }
];

type FetchParams = {
  q: string;
  formation: string;
  playstyle: string;
  nationality: string;
  minStyleProficiency: string;
  sortBy:
    | 'style_desc'
    | 'style_asc'
    | 'name_asc'
    | 'name_desc'
    | 'team_asc'
    | 'team_desc'
    | 'updated_desc';
  page: number;
};

export function ManagersListClient() {
  const [query, setQuery] = useState('');
  const [formation, setFormation] = useState('');
  const [playstyle, setPlaystyle] = useState('');
  const [nationality, setNationality] = useState('');
  const [minStyleProficiency, setMinStyleProficiency] = useState('');
  const [sortBy, setSortBy] = useState<FetchParams['sortBy']>('style_desc');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ManagerApiResult | null>(null);

  const summaryText = useMemo(() => {
    if (loading) return 'Đang tải dữ liệu HLV...';
    if (error) return 'Lỗi tải dữ liệu HLV.';
    if (!result) return 'Chưa có dữ liệu.';
    const sourceLabel = result.meta.source === 'mongo' ? 'Dữ liệu trực tiếp' : 'Dữ liệu hệ thống';
    return `Tìm thấy ${result.meta.total.toLocaleString('vi-VN')} HLV · Nguồn: ${sourceLabel}`;
  }, [error, loading, result]);

  const fetchManagers = async (params: FetchParams) => {
    setLoading(true);
    setError('');
    try {
      const search = new URLSearchParams({ page: String(params.page), limit: String(PAGE_SIZE) });
      if (params.q.trim()) search.set('q', params.q.trim());
      if (params.formation) search.set('formation', params.formation);
      if (params.playstyle) search.set('playstyle', params.playstyle);
      if (params.nationality.trim()) search.set('nationality', params.nationality.trim());
      if (params.minStyleProficiency.trim()) {
        search.set('minStyleProficiency', params.minStyleProficiency.trim());
      }
      search.set('sortBy', params.sortBy);
      const response = await fetch(`/api/managers?${search.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload: ManagerApiResult = await response.json();
      setResult(payload);
      setPage(payload.meta.page);
    } catch {
      setError('Không thể tải dữ liệu HLV.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchManagers({
      q: '', formation: '', playstyle: '', nationality: '', minStyleProficiency: '',
      sortBy: 'style_desc', page: 1
    });
  }, []);

  const applyFilters = () => {
    setPage(1);
    void fetchManagers({ q: query, formation, playstyle, nationality, minStyleProficiency, sortBy, page: 1 });
  };

  const resetFilters = () => {
    setQuery(''); setFormation(''); setPlaystyle(''); setNationality('');
    setMinStyleProficiency(''); setSortBy('style_desc'); setPage(1);
    void fetchManagers({
      q: '', formation: '', playstyle: '', nationality: '', minStyleProficiency: '',
      sortBy: 'style_desc', page: 1
    });
  };

  const gotoPage = (nextPage: number) => {
    if (!result) return;
    const bounded = Math.max(1, Math.min(result.meta.totalPages, nextPage));
    setPage(bounded);
    void fetchManagers({ q: query, formation, playstyle, nationality, minStyleProficiency, sortBy, page: bounded });
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      <aside className="xl:w-72 xl:flex-shrink-0">
        <div className="rounded-xl bg-surface-container/60 backdrop-blur-lg p-6 xl:sticky xl:top-28">
          <h2 className="stitch-label-accent mb-6">Bộ lọc HLV</h2>
          <div className="space-y-5">
            <div>
              <label className="stitch-label mb-2 block">Tên HLV</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Zeitzler..."
                className="stitch-filter-input"
              />
            </div>
            <div>
              <label className="stitch-label mb-2 block">Sơ đồ</label>
              <select
                value={formation}
                onChange={(e) => setFormation(e.target.value)}
                className="stitch-filter-select"
              >
                <option value="">Tất cả</option>
                {FORMATION_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="stitch-label mb-2 block">Playstyle</label>
              <select
                value={playstyle}
                onChange={(e) => setPlaystyle(e.target.value)}
                className="stitch-filter-select"
              >
                {PLAYSTYLE_OPTIONS.map((p) => (
                  <option key={p.label} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="stitch-label mb-2 block">Quốc tịch</label>
              <input
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="Spain..."
                className="stitch-filter-input"
              />
            </div>
            <div>
              <label htmlFor="managers-min-style" className="stitch-label mb-2 block">
                Playstyle tối thiểu
              </label>
              <input
                id="managers-min-style"
                type="number"
                min={1}
                max={100}
                value={minStyleProficiency}
                onChange={(e) => setMinStyleProficiency(e.target.value)}
                placeholder="85"
                className="stitch-filter-input"
              />
            </div>
            <button
              type="button"
              onClick={applyFilters}
              className="w-full py-3 bg-primary text-background font-black uppercase text-xs tracking-wider rounded-lg hover:bg-primary transition-all shadow-lg shadow-primary/10 active:scale-95"
            >
              Áp dụng
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="w-full py-2 bg-surface-container-high text-on-surface font-bold uppercase text-xs tracking-wider rounded-lg hover:bg-surface-variant transition-all"
            >
              Đặt lại
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="stitch-headline text-3xl sm:text-4xl">Database HLV</h2>
            <p className="stitch-subtle mt-2">{summaryText}</p>
          </div>
          <div>
            <label htmlFor="sort-managers" className="sr-only">
              Sắp xếp HLV
            </label>
            <select
              id="sort-managers"
              className="stitch-filter-select w-56"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as FetchParams['sortBy'])}
            >
              {MANAGER_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </header>

        {error ? (
          <div className="rounded-lg bg-error/10 p-4 text-sm text-error">{error}</div>
        ) : null}

        <div className="space-y-3">
          {(result?.data || []).map((manager) => (
            <Link
              key={manager.efhubId}
              href={`/hlv/${manager.efhubId}`}
              className="group flex flex-col gap-4 md:flex-row md:items-center rounded-xl bg-surface-container p-4 transition-all hover:bg-surface-container-high hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-surface-container-high">
                <Image
                  src={manager.imageUrl}
                  alt={manager.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold uppercase text-on-surface group-hover:text-primary transition-colors">
                    {manager.name}
                  </h3>
                  <span className="stitch-chip stitch-chip-sky">{manager.team}</span>
                  <span className="stitch-chip">Sơ đồ · {manager.formation}</span>
                </div>
                <p className="mt-1 text-xs text-outline uppercase tracking-wider">
                  Xem chi tiết → / Style · Top {Math.max(...Object.values(manager.playstyleProficiency))}
                </p>
              </div>
              <div className="grid grid-cols-5 gap-2">
                <Stat label="QC" value={manager.playstyleProficiency.quickCounter} />
                <Stat label="POS" value={manager.playstyleProficiency.possessionGame} />
                <Stat label="LBC" value={manager.playstyleProficiency.longBallCounter} />
                <Stat label="OW" value={manager.playstyleProficiency.outWide} />
                <Stat label="LB" value={manager.playstyleProficiency.longBall} />
              </div>
            </Link>
          ))}
        </div>

        {result && result.meta.totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => gotoPage(page - 1)}
              className="stitch-ghost-btn disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Trước
            </button>
            <span className="text-sm text-on-surface-variant">
              Trang <span className="font-bold text-on-surface">{page}</span> / {result.meta.totalPages}
            </span>
            <button
              type="button"
              disabled={loading || page >= result.meta.totalPages}
              onClick={() => gotoPage(page + 1)}
              className="stitch-ghost-btn disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sau →
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const isHigh = value >= 85;
  return (
    <div
      className={
        'rounded-lg p-2 text-center ' +
        (isHigh ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-surface-container-high/70')
      }
    >
      <div className={'text-sm font-black ' + (isHigh ? 'text-primary' : 'text-on-surface')}>
        {value}
      </div>
      <div className="stitch-stat-label mt-0.5">{label}</div>
    </div>
  );
}
