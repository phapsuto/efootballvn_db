import Link from 'next/link';
import { Bell, Search, User } from 'lucide-react';

import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Trang Chủ' },
  { href: '/cau-thu', label: 'Cầu Thủ' },
  { href: '/hlv', label: 'HLV' },
  { href: '/doi-hinh', label: 'Đội Hình' },
  { href: '/so-sanh', label: 'So Sánh' },
  { href: '/packs', label: 'Packs' },
  { href: '/community', label: 'Cộng Đồng' },
  { href: '/tournaments', label: 'Xếp Hạng' },
  { href: '/cam-nang', label: 'Cẩm Nang' },
  { href: '/cong-cu', label: 'Công Cụ' }
];

type SiteHeaderProps = {
  activeHref?: string;
};

export function SiteHeader({ activeHref }: SiteHeaderProps) {
  return (
    <header className="stitch-nav">
      <div className="stitch-nav-inner">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-2xl font-black italic tracking-tighter text-on-surface">
              eFootball.vn
            </span>
            <span className="hidden text-[10px] font-bold uppercase tracking-[0.25em] text-primary/80 md:inline">
              Community
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {navItems.slice(0, 5).map((item) => {
              const active = activeHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    active ? 'stitch-nav-link-active' : 'stitch-nav-link',
                    'text-sm'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <form
            action="/ket-qua-tim-kiem-nang-cao"
            method="get"
            className="relative hidden xl:block"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
            <input
              name="q"
              aria-label="Tìm nhanh"
              placeholder="Tìm cầu thủ, HLV..."
              className="stitch-filter-input h-9 w-56 pl-9"
            />
          </form>
          <div className="flex items-center gap-1 text-on-surface-variant">
            <Link
              href="/ket-qua-tim-kiem-nang-cao"
              aria-label="Tìm kiếm"
              className="rounded-lg p-2 hover:bg-white/5 hover:text-primary transition-colors xl:hidden"
            >
              <Search className="h-5 w-5" />
            </Link>
            <Link
              href="/thong-bao"
              aria-label="Thông báo"
              className="rounded-lg p-2 hover:bg-white/5 hover:text-primary transition-colors"
            >
              <Bell className="h-5 w-5" />
            </Link>
            <Link
              href="/ho-so"
              aria-label="Hồ sơ"
              className="rounded-lg p-2 hover:bg-white/5 hover:text-primary transition-colors"
            >
              <User className="h-5 w-5" />
            </Link>
          </div>
          <Link href="/ho-so" className="stitch-cta">
            Tham Gia
          </Link>
        </div>
      </div>
      {/* Secondary row for overflow nav items */}
      <div className="max-w-screen-2xl mx-auto hidden md:flex items-center gap-6 px-6 pb-2 text-xs text-outline">
        {navItems.slice(5).map((item) => {
          const active = activeHref === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'uppercase tracking-[0.18em] font-bold transition-colors',
                active ? 'text-primary' : 'hover:text-primary'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      {/* Mobile horizontal nav */}
      <nav className="flex gap-4 overflow-x-auto px-4 pb-2 md:hidden">
        {navItems.map((item) => {
          const active = activeHref === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                active
                  ? 'bg-primary/15 text-primary ring-1 ring-primary/40'
                  : 'text-on-surface hover:bg-white/5 hover:text-on-surface'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
