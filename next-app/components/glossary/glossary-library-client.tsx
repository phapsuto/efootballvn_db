'use client';

import { BookOpen, Goal, Shield, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';

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
              className="group rounded-xl bg-surface-container p-5 transition-all hover:bg-surface-container-high"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-container-high/60 text-on-surface">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-on-surface">{item.name}</h2>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
                      {meta.label}
                    </span>
                  </div>
                </div>
                <span className={`${meta.chipClass} text-[10px] px-2 py-0.5`}>{meta.label}</span>
              </div>

              <p className="mt-4 text-sm leading-6 text-on-surface">{item.description}</p>

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
    </div>
  );
}
