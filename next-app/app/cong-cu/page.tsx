import Link from 'next/link';

import { SiteHeader } from '@/components/layout/site-header';

const TOOL_ITEMS: Array<{
  title: string;
  description: string;
  href: string;
  status: 'ready' | 'in_progress';
  accent: 'emerald' | 'sky' | 'amber';
}> = [
  {
    title: 'Xây dựng đội hình',
    description: 'Tối ưu đội hình theo HLV, tự điền slot và gợi ý theo playstyle.',
    href: '/doi-hinh',
    status: 'ready',
    accent: 'emerald'
  },
  {
    title: 'So sánh cầu thủ',
    description: 'So sánh trực tiếp 2 cầu thủ theo level và condition trong bảng diff chi tiết.',
    href: '/so-sanh',
    status: 'ready',
    accent: 'sky'
  },
  {
    title: 'Tra cứu HLV',
    description: 'Phân tích playstyle HLV và mở thẳng vào đội hình phù hợp.',
    href: '/hlv',
    status: 'ready',
    accent: 'emerald'
  },
  {
    title: 'Bảng xếp hạng',
    description: 'Theo dõi đội xếp hạng và điều hướng sang hồ sơ cộng đồng.',
    href: '/tournaments',
    status: 'ready',
    accent: 'amber'
  },
  {
    title: 'Cộng đồng build',
    description: 'Theo dõi hồ sơ, xem build cộng đồng và mở nhanh sang chi tiết cầu thủ.',
    href: '/community',
    status: 'ready',
    accent: 'sky'
  },
  {
    title: 'Cẩm nang',
    description: 'Kho hướng dẫn, meta summary và lộ trình học nhanh cho cộng đồng Việt Nam.',
    href: '/cam-nang',
    status: 'ready',
    accent: 'emerald'
  },
  {
    title: 'Từ điển Skills',
    description: 'Tra cứu Player Skills, GK Skills và Playstyles trong UI tiếng Việt.',
    href: '/tinh-nang',
    status: 'ready',
    accent: 'sky'
  },
  {
    title: 'Phân tích meta',
    description: 'Màn phân tích sâu cho attack, defense, manager fit và team trend.',
    href: '/phan-tich',
    status: 'ready',
    accent: 'emerald'
  },
  {
    title: 'Chuyển nhượng',
    description: 'Theo dõi packs, cửa sổ mở thẻ và cầu thủ đáng chú ý theo nhịp cập nhật.',
    href: '/chuyen-nhuong',
    status: 'ready',
    accent: 'amber'
  },
  {
    title: 'Thông báo hệ thống',
    description: 'Xem tiến độ đồng bộ dữ liệu và lịch hoạt động eFootball Việt Nam.',
    href: '/thong-bao',
    status: 'ready',
    accent: 'sky'
  }
];

const STATS = [
  { label: 'Công cụ sẵn sàng', value: (TOOL_ITEMS.filter((item) => item.status === 'ready').length).toString(), hint: 'Đầy đủ tính năng phân tích.' },
  { label: 'Điểm mạnh', value: 'Đội hình', hint: 'HLV, build, compare, tactical.' },
  { label: 'Giao diện', value: 'Đồng nhất', hint: 'Trải nghiệm tối ưu trên di động.' }
];

export default function ToolsPage() {
  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/cong-cu" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-xl bg-surface-container px-8 py-10 sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary/10 to-transparent" />
          <span className="stitch-chip stitch-chip-emerald">Tool Hub</span>
          <p className="stitch-label-accent mt-5">Build · So sánh · Tối ưu · Khám phá</p>
          <h1 className="stitch-headline text-4xl sm:text-5xl mt-2">Trung tâm công cụ</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface">
            Hệ thống công cụ đắc lực hỗ trợ tối ưu hóa đội hình, tính toán chỉ số và phân tích chiến thuật eFootball chuyên sâu.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STATS.map((stat) => (
              <article key={stat.label} className="rounded-lg bg-surface-container-high/60 p-4">
                <p className="stitch-label">{stat.label}</p>
                <p className="mt-2 text-2xl font-black text-on-surface">{stat.value}</p>
                <p className="mt-2 text-sm text-on-surface-variant">{stat.hint}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Tool grid */}
        <section>
          <div className="mb-6">
            <p className="stitch-label-accent">Toolbox</p>
            <h2 className="stitch-section-title mt-2">Tất cả công cụ</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {TOOL_ITEMS.map((item) => {
              const chipClass =
                item.accent === 'emerald'
                  ? 'stitch-chip stitch-chip-emerald'
                  : item.accent === 'sky'
                    ? 'stitch-chip stitch-chip-sky'
                    : 'stitch-chip stitch-chip-amber';
              const hoverText =
                item.accent === 'emerald'
                  ? 'group-hover:text-primary'
                  : item.accent === 'sky'
                    ? 'group-hover:text-primary'
                    : 'group-hover:text-tertiary';
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex h-full flex-col rounded-xl bg-surface-container p-6 transition-all hover:bg-surface-container-high"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className={`text-lg font-black text-on-surface transition-colors ${hoverText}`}>
                      {item.title}
                    </h3>
                    <span className={`${chipClass} text-[10px] px-2 py-0.5`}>
                      {item.status === 'ready' ? 'Sẵn sàng' : 'Hoàn thiện'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-on-surface-variant">{item.description}</p>
                  <div className="mt-auto pt-5 text-xs font-bold uppercase tracking-wider text-primary">
                    Mở công cụ →
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
