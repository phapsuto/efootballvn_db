'use client';

import { BookOpen, Goal, Shield, Sparkles, X, Loader2, ArrowRight, ChevronRight } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import type { Player } from '@/types/domain';

type GlossaryCategory = 'player_skill' | 'playstyle' | 'gk_skill';

type GlossaryItem = {
  id: string;
  name: string;
  category: GlossaryCategory;
  description: string;
  tags: string[];
};

type GlossaryLibraryClientProps = {
  items: GlossaryItem[];
};

type FilterTab = 'all' | GlossaryCategory;

const FILTERS: Array<{ key: FilterTab; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'player_skill', label: 'Player Skills' },
  { key: 'playstyle', label: 'Playstyles' },
  { key: 'gk_skill', label: 'GK Skills' }
];

function getCategoryMeta(category: GlossaryCategory) {
  if (category === 'playstyle') {
    return {
      label: 'Playstyle',
      icon: Goal,
      chipClass: 'stitch-chip stitch-chip-amber'
    };
  }

  if (category === 'gk_skill') {
    return {
      label: 'GK Skill',
      icon: Shield,
      chipClass: 'stitch-chip stitch-chip-sky'
    };
  }

  return {
    label: 'Player Skill',
    icon: Sparkles,
    chipClass: 'stitch-chip stitch-chip-emerald'
  };
}

export function GlossaryLibraryClient({ items }: GlossaryLibraryClientProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [selectedItem, setSelectedItem] = useState<GlossaryItem | null>(null);
  const [relatedPlayers, setRelatedPlayers] = useState<Player[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  useEffect(() => {
    if (!selectedItem) {
      setRelatedPlayers([]);
      return;
    }

    const currentItem = selectedItem;
    let isCancelled = false;
    async function fetchPlayers() {
      setLoadingRelated(true);
      try {
        const param = currentItem.category === 'playstyle' ? 'playstyle' : 'skill';
        const url = `/api/players?limit=6&sortBy=overall_desc&${param}=${encodeURIComponent(currentItem.name)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch');
        const result = await res.json();
        if (!isCancelled) {
          setRelatedPlayers(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching glossary players:', error);
      } finally {
        if (!isCancelled) {
          setLoadingRelated(false);
        }
      }
    }

    fetchPlayers();
    return () => {
      isCancelled = true;
    };
  }, [selectedItem]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter !== 'all' && item.category !== filter) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      const haystack = [item.name, item.description, ...item.tags].join(' ').toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [filter, items, query]);

  return (
    <div className="space-y-8">
      {/* Search + filters */}
      <section className="rounded-xl bg-surface-container p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <span className="stitch-chip stitch-chip-emerald">Thư viện tra cứu</span>
            <div className="mt-4">
              <p className="stitch-label-accent">Skills · Playstyles · GK</p>
              <p className="mt-2 text-sm leading-6 text-on-surface">
                Toàn bộ nhãn UI đã Việt hóa, nhưng tên kỹ thuật như Skills, Playstyles và Stats
                vẫn giữ đúng thuật ngữ English để cộng đồng dễ tra cứu.
              </p>
            </div>
          </div>

          <div className="w-full max-w-md">
            <label className="stitch-label">Tìm kiếm nhanh</label>
            <div className="relative mt-2">
              <BookOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm Double Touch, Goal Poacher, Build Up..."
                className="h-11 w-full rounded-lg border border-on-surface/10 bg-surface-container-high/60 pl-10 pr-3 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={[
                  'rounded-lg px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-colors',
                  active
                    ? 'bg-primary text-background'
                    : 'bg-surface-container-high/60 text-on-surface hover:bg-surface-container-high hover:text-on-surface'
                ].join(' ')}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex items-center justify-between">
        <p className="text-sm text-on-surface-variant">
          Hiển thị <span className="font-black text-on-surface">{filteredItems.length}</span> mục tra
          cứu.
        </p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
          Không có control trưng bày
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((item) => {
          const meta = getCategoryMeta(item.category);
          const Icon = meta.icon;
          return (
            <article
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group rounded-xl bg-surface-container p-5 transition-all hover:bg-surface-container-high cursor-pointer hover:ring-1 hover:ring-primary/30 active:scale-[0.99] select-none flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-container-high/60 text-on-surface group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-on-surface group-hover:text-primary transition-colors flex items-center gap-1">
                        {item.name}
                        <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
                      </h2>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
                        {meta.label}
                      </span>
                    </div>
                  </div>
                  <span className={`${meta.chipClass} text-[10px] px-2 py-0.5`}>{meta.label}</span>
                </div>

                <p className="mt-4 text-sm leading-6 text-on-surface line-clamp-3">{item.description}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span
                    key={`${item.id}-${tag}`}
                    className="stitch-chip text-[10px] px-2 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      {/* Modern responsive detailed modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-surface-container border border-outline-variant rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
          >
            
            {/* Absolute Close button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute right-4 top-4 z-50 text-on-surface-variant hover:text-on-surface p-2 rounded-lg bg-surface-container-high/60 hover:bg-surface-container-high transition-all"
              aria-label="Đóng"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header section with category color gradient background */}
            <div className={`p-6 sm:p-8 border-b border-outline-variant relative overflow-hidden ${
              selectedItem.category === 'playstyle' 
                ? 'bg-gradient-to-r from-amber-500/10 via-transparent to-transparent'
                : selectedItem.category === 'gk_skill'
                ? 'bg-gradient-to-r from-sky-500/10 via-transparent to-transparent'
                : 'bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                {(() => {
                  const meta = getCategoryMeta(selectedItem.category);
                  const Icon = meta.icon;
                  return (
                    <>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high/80 text-on-surface">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={`${meta.chipClass} text-[9px] px-2 py-0.5`}>
                        {meta.label}
                      </span>
                    </>
                  );
                })()}
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-on-surface uppercase tracking-tight italic">
                {selectedItem.name}
              </h2>
              
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedItem.tags.map((tag) => (
                  <span key={tag} className="stitch-chip text-[9px] px-2 py-0.5 bg-surface-container-high/40">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="overflow-y-auto p-6 sm:p-8 custom-scrollbar space-y-6 flex-1">
              
              {/* Description Section */}
              <div className="space-y-2">
                <h3 className="stitch-label text-outline">Chi tiết tính năng</h3>
                <p className="text-sm leading-6 text-on-surface font-medium bg-surface-container-low/40 p-4 rounded-xl border border-outline-variant/40">
                  {selectedItem.description}
                </p>
              </div>

              {/* Dynamic Players list possessing this skill/playstyle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="stitch-label text-outline">Top cầu thủ sở hữu</h3>
                  <span className="text-[10px] text-outline font-medium">Sắp xếp theo OVR Max</span>
                </div>

                {loadingRelated ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-xs text-on-surface-variant font-medium">Đang tải danh sách cầu thủ...</p>
                  </div>
                ) : relatedPlayers.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {relatedPlayers.map((player) => (
                      <Link
                        key={player.efhubId}
                        href={`/cau-thu/${player.efhubId}`}
                        onClick={() => setSelectedItem(null)}
                        className="flex items-center gap-3 p-3 bg-surface-container-low/60 hover:bg-surface-container-high/80 border border-outline-variant hover:border-primary/30 rounded-xl transition-all duration-300 group"
                      >
                        <div className="relative h-11 w-11 rounded-lg bg-surface-container-lowest/80 border border-outline-variant/60 overflow-hidden flex-shrink-0">
                          <img
                            src={player.images.thumbnail}
                            alt={player.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/128x128?text=PV';
                            }}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                            {player.name}
                          </h4>
                          <p className="text-[10px] text-outline truncate mt-0.5">
                            {player.club} • {player.nationality}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-container-highest border border-outline-variant/40">
                            {player.positions[0]}
                          </span>
                          <span className="text-xs font-black text-primary bg-primary/15 border border-primary/20 px-1.5 py-0.5 rounded">
                            {player.overall.max}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-surface-container-low/30 rounded-xl border border-dashed border-outline-variant p-6">
                    <p className="text-sm text-outline">Chưa tìm thấy cầu thủ nổi bật nào sở hữu tính năng này trong hệ thống dữ liệu.</p>
                  </div>
                )}
              </div>
            </div>

             {/* Modal Footer with interactive CTA button */}
            <div className="p-4 sm:p-6 bg-surface-container-low border-t border-outline-variant flex justify-end flex-shrink-0">
              <Link
                href={
                  selectedItem.category === 'playstyle'
                    ? `/cau-thu?playstyle=${encodeURIComponent(selectedItem.name)}`
                    : `/cau-thu?skill=${encodeURIComponent(selectedItem.name)}`
                }
                onClick={() => setSelectedItem(null)}
                className="stitch-cta flex items-center gap-2 text-xs uppercase tracking-wider bg-primary hover:bg-primary/90 text-background px-4 py-2.5 rounded-lg font-bold"
              >
                <span>Khám phá thêm</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

