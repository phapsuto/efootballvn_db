import Link from 'next/link';

import { SiteHeader } from '@/components/layout/site-header';
import { PlayersListClient } from '@/components/players/players-list-client';

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    position?: string;
    cardType?: string;
    playstyle?: string;
    minOvr?: string;
    nationality?: string;
    club?: string;
    foot?: string;
    minHeight?: string;
    maxHeight?: string;
    sortBy?: string;
    page?: string;
  }>;
};

type ActiveFilter = {
  key: string;
  label: string;
  value: string;
  removeHref: string;
};

function withoutParam(params: URLSearchParams, key: string) {
  const next = new URLSearchParams(params);
  next.delete(key);
  const query = next.toString();
  return query ? `/ket-qua-tim-kiem-nang-cao?${query}` : '/ket-qua-tim-kiem-nang-cao';
}

/**
 * Stitch parity route: advanced search results. Mirrors the layout of
 * stitch/k_t_qu_t_m_ki_m_n_ng_cao/code.html — active filter chips over the
 * existing player list component, with a "clear all" fallback link back to
 * the plain /cau-thu listing.
 */
export default async function AdvancedSearchResultsPage({ searchParams }: PageProps) {
  const resolved = (await searchParams) || {};
  const params = new URLSearchParams();

  const q = typeof resolved.q === 'string' ? resolved.q.trim() : '';
  const position = typeof resolved.position === 'string' ? resolved.position.trim() : '';
  const cardType = typeof resolved.cardType === 'string' ? resolved.cardType.trim() : '';
  const playstyle = typeof resolved.playstyle === 'string' ? resolved.playstyle.trim() : '';
  const minOvr = typeof resolved.minOvr === 'string' ? resolved.minOvr.trim() : '';
  const nationality = typeof resolved.nationality === 'string' ? resolved.nationality.trim() : '';
  const club = typeof resolved.club === 'string' ? resolved.club.trim() : '';
  const foot = typeof resolved.foot === 'string' ? resolved.foot.trim() : '';
  const minHeight = typeof resolved.minHeight === 'string' ? resolved.minHeight.trim() : '';
  const maxHeight = typeof resolved.maxHeight === 'string' ? resolved.maxHeight.trim() : '';
  const sortBy = typeof resolved.sortBy === 'string' ? resolved.sortBy.trim() : '';
  const page = typeof resolved.page === 'string' ? resolved.page.trim() : '';

  if (q) params.set('q', q);
  if (position) params.set('position', position);
  if (cardType) params.set('cardType', cardType);
  if (playstyle) params.set('playstyle', playstyle);
  if (minOvr) params.set('minOvr', minOvr);
  if (nationality) params.set('nationality', nationality);
  if (club) params.set('club', club);
  if (foot) params.set('foot', foot);
  if (minHeight) params.set('minHeight', minHeight);
  if (maxHeight) params.set('maxHeight', maxHeight);
  if (sortBy) params.set('sortBy', sortBy);
  if (page) params.set('page', page);

  const activeFilters: ActiveFilter[] = [];
  if (q) {
    activeFilters.push({
      key: 'q',
      label: 'Từ khoá',
      value: q,
      removeHref: withoutParam(params, 'q')
    });
  }
  if (position) {
    activeFilters.push({
      key: 'position',
      label: 'Vị trí',
      value: position,
      removeHref: withoutParam(params, 'position')
    });
  }
  if (cardType) {
    activeFilters.push({
      key: 'cardType',
      label: 'Loại thẻ',
      value: cardType,
      removeHref: withoutParam(params, 'cardType')
    });
  }
  if (playstyle) {
    activeFilters.push({
      key: 'playstyle',
      label: 'Playstyle',
      value: playstyle,
      removeHref: withoutParam(params, 'playstyle')
    });
  }
  if (minOvr) {
    activeFilters.push({
      key: 'minOvr',
      label: 'OVR tối thiểu',
      value: minOvr,
      removeHref: withoutParam(params, 'minOvr')
    });
  }
  if (nationality) {
    activeFilters.push({
      key: 'nationality',
      label: 'Quốc gia',
      value: nationality,
      removeHref: withoutParam(params, 'nationality')
    });
  }
  if (club) {
    activeFilters.push({
      key: 'club',
      label: 'CLB',
      value: club,
      removeHref: withoutParam(params, 'club')
    });
  }
  if (foot) {
    activeFilters.push({
      key: 'foot',
      label: 'Chân thuận',
      value: foot,
      removeHref: withoutParam(params, 'foot')
    });
  }
  if (minHeight) {
    activeFilters.push({
      key: 'minHeight',
      label: 'Chiều cao tối thiểu',
      value: minHeight,
      removeHref: withoutParam(params, 'minHeight')
    });
  }
  if (maxHeight) {
    activeFilters.push({
      key: 'maxHeight',
      label: 'Chiều cao tối đa',
      value: maxHeight,
      removeHref: withoutParam(params, 'maxHeight')
    });
  }

  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/cau-thu" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-6">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-1">
                Kết quả Tìm kiếm Nâng cao
              </h1>
              <p className="text-sm text-on-surface-variant">
                {activeFilters.length === 0
                  ? 'Chưa có bộ lọc nào – hiển thị toàn bộ cầu thủ phù hợp tiêu chí mặc định.'
                  : `Đang áp dụng ${activeFilters.length} bộ lọc. Bỏ chip để nới lỏng tiêu chí.`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/cau-thu"
                className="bg-surface-container-high px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-surface-bright transition-colors text-on-surface"
              >
                <span className="material-symbols-outlined text-sm">tune</span>
                Bộ lọc cơ bản
              </Link>
              <Link
                href="/so-sanh"
                className="bg-secondary text-on-secondary px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-sm">compare_arrows</span>
                So sánh
              </Link>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <Link
                  key={filter.key}
                  href={filter.removeHref}
                  className="bg-primary-container/40 text-on-primary-container px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 border border-primary-container hover:bg-primary-container/60 transition-colors"
                  prefetch={false}
                >
                  {filter.label}: {filter.value}
                  <span className="material-symbols-outlined text-xs">close</span>
                </Link>
              ))}
              <Link
                href="/ket-qua-tim-kiem-nang-cao"
                className="bg-error-container/20 text-error px-3 py-1.5 rounded-full text-xs font-medium hover:bg-error-container/30 transition-colors"
                prefetch={false}
              >
                Xoá tất cả
              </Link>
            </div>
          )}
        </section>

        <PlayersListClient
          initialFilters={{
            q,
            position,
            cardType,
            playstyle,
            minOvr: minOvr ? Number(minOvr) : undefined,
            nationality,
            club,
            foot,
            minHeight,
            maxHeight,
            sortBy: (sortBy || undefined) as 'overall_desc' | 'overall_asc' | 'name_asc' | 'name_desc' | 'updated_desc' | undefined,
            page: page ? Number(page) : undefined
          }}
          syncUrl
          routeBase="/ket-qua-tim-kiem-nang-cao"
        />
      </main>
    </div>
  );
}
