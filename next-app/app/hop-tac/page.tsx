import Link from 'next/link';

import { SiteHeader } from '@/components/layout/site-header';

const PARTNERSHIP_AREAS = [
  'Giải đấu cộng đồng: điều hướng người chơi sang rankings và team detail.',
  'Nội dung chiến thuật: phối hợp cùng Cẩm nang và Phân tích để đẩy bài viết hoặc video.',
  'Dữ liệu & công cụ: đưa cầu thủ, HLV, packs và glossary vào một flow thống nhất.'
];

export default function PartnershipPage() {
  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/hop-tac" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
        <section className="rounded-xl bg-surface-container px-8 py-10 sm:px-12 sm:py-14">
          <span className="stitch-chip stitch-chip-sky">Partnership</span>
          <p className="stitch-label-accent mt-5">Giải đấu · Nội dung · Dữ liệu</p>
          <h1 className="stitch-headline text-4xl sm:text-5xl mt-2">Hợp tác</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-on-surface">
            Kết nối giải đấu, cộng đồng build, nội dung hướng dẫn và các chiến dịch truyền thông
            xoay quanh eFootball.vn.
          </p>
        </section>
        <div className="grid gap-4 md:grid-cols-3">
          {PARTNERSHIP_AREAS.map((item) => (
            <article
              key={item}
              className="rounded-xl bg-surface-container p-6 text-sm leading-6 text-on-surface"
            >
              {item}
            </article>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/community" className="stitch-cta">Mở cộng đồng</Link>
          <Link
            href="/cam-nang"
            className="rounded-lg border border-on-surface/10 bg-white/5 px-5 py-2 text-sm font-bold uppercase tracking-wider text-on-surface transition-all hover:bg-white/10"
          >
            Xem cẩm nang
          </Link>
        </div>
      </main>
    </div>
  );
}
