import Link from 'next/link';

import { SiteHeader } from '@/components/layout/site-header';

const SUPPORT_LINKS = [
  {
    title: 'Kiểm tra sync',
    href: '/thong-bao',
    description: 'Xem scrape/import status và cadence cập nhật.'
  },
  {
    title: 'Mở community',
    href: '/community',
    description: 'Theo dõi profile hoặc build vừa publish.'
  },
  {
    title: 'Mở công cụ',
    href: '/cong-cu',
    description: 'Đi nhanh vào compare, lineup, glossary hoặc analytics.'
  },
  {
    title: 'Xem cẩm nang',
    href: '/cam-nang',
    description: 'Tra hướng dẫn thao tác đúng cho từng module.'
  }
] as const;

export default function SupportPage() {
  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/ho-tro" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
        <section className="rounded-xl bg-surface-container px-8 py-10 sm:px-12 sm:py-14">
          <span className="stitch-chip stitch-chip-emerald">Trợ giúp</span>
          <p className="stitch-label-accent mt-5">Hỗ trợ · Hướng dẫn nhanh</p>
          <h1 className="stitch-headline text-4xl sm:text-5xl mt-2">Hỗ trợ</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-on-surface">
            Các lối đi thật đến nơi bạn cần kiểm tra đầu tiên khi web app có vấn đề hoặc khi
            muốn tiếp tục workflow – không còn nút trống.
          </p>
        </section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {SUPPORT_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-xl bg-surface-container p-5 transition-all hover:bg-surface-container-high"
            >
              <h2 className="text-lg font-black text-on-surface group-hover:text-primary transition-colors">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">{item.description}</p>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-primary">
                Đi tới →
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
