import Link from 'next/link';

import { SiteHeader } from '@/components/layout/site-header';
import { GuidesClient } from '@/components/guides/guides-client';
import glossaryData from './glossary-data.json';

const GUIDE_CARDS = [
  {
    title: 'Hướng dẫn nhập môn',
    summary: 'Lộ trình làm quen nhanh từ tra cứu cầu thủ, chọn HLV cho tới build đội hình đầu tiên.',
    href: '/cau-thu',
    tags: ['Cơ bản', 'Đội hình', 'Khởi đầu']
  },
  {
    title: 'Chiến thuật meta',
    summary: 'Đi thẳng sang màn phân tích để đọc meta attack, defense, manager fit và trend ranking.',
    href: '/phan-tich',
    tags: ['Meta', 'Phân tích', 'Xếp hạng']
  },
  {
    title: 'Build nhanh hơn',
    summary: 'Mở lineup builder và tự điền đội hình theo HLV, rồi chốt các chỉ số quan trọng.',
    href: '/doi-hinh',
    tags: ['Đội hình', 'HLV', 'Tối ưu']
  },
  {
    title: 'So sánh thông minh',
    summary: 'So sánh 2 cầu thủ với cùng level, condition và build để chốt phương án dùng thật.',
    href: '/so-sanh',
    tags: ['Compare', 'Decision', 'OVR']
  },
  {
    title: 'Luồng cộng đồng',
    summary: 'Xem hồ sơ cộng đồng, theo dõi người chơi và học từ build đã được publish.',
    href: '/community',
    tags: ['Cộng đồng', 'Tương tác', 'Build']
  },
  {
    title: 'Skills & Playstyles',
    summary: 'Tra cứu Player Skills, Playstyles và GK Skills bằng thư viện tiếng Việt.',
    href: '/tinh-nang',
    tags: ['Thư viện', 'Skills', 'Playstyles']
  }
] as const;

const UPDATE_FEED = [
  { title: 'Kiểm tra pack mới theo nhịp cập nhật hệ thống', category: 'Tin hệ thống', href: '/thong-bao' },
  { title: 'Phân tích top team đang tăng tốc ở ranking 24h', category: 'Phân tích', href: '/tournaments' },
  { title: 'Theo dõi pack và cửa sổ chuyển nhượng hiện tại', category: 'Theo dõi pack', href: '/chuyen-nhuong' },
  { title: 'Mở chi tiết HLV để chốt playstyle phù hợp', category: 'HLV', href: '/hlv' }
] as const;

export default function GuideLibraryPage() {
  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/cam-nang" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-xl bg-surface-container px-8 py-10 sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary/10 to-transparent" />
          <span className="stitch-chip stitch-chip-emerald">Học viện eFootball</span>
          <p className="stitch-label-accent mt-5">Thư viện · Hướng dẫn</p>
          <h1 className="stitch-headline text-4xl sm:text-5xl mt-2">
            Cẩm nang cho từng nhịp chơi
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface">
            Cung cấp cẩm nang và tài liệu bổ ích để bạn hiểu rõ lối chơi, chiến thuật và cách tối ưu hóa cầu thủ.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="#noi-bat" className="stitch-cta">Khám phá</Link>
            <Link
              href="/tinh-nang"
              className="rounded-lg border border-on-surface/10 bg-white/5 px-5 py-2 text-sm font-bold uppercase tracking-wider text-on-surface transition-all hover:bg-white/10"
            >
              Từ điển Skills
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-lg bg-surface-container-high/60 p-5">
              <p className="stitch-label">Lộ trình mới</p>
              <p className="mt-2 text-lg font-black text-on-surface">Từ tra cứu sang build thật</p>
              <p className="mt-2 text-sm text-on-surface-variant">
                Cung cấp kiến thức từ căn bản đến nâng cao.
              </p>
            </article>
            <article className="rounded-lg bg-surface-container-high/60 p-5">
              <p className="stitch-label">Cẩm nang eFootball</p>
              <p className="mt-2 text-lg font-black text-on-surface">Phân tích chuyên sâu</p>
              <p className="mt-2 text-sm text-on-surface-variant">
                Giúp bạn nắm bắt nhanh các xu hướng chiến thuật mới.
              </p>
            </article>
            <article className="rounded-lg bg-surface-container-high/60 p-5">
              <p className="stitch-label">Dễ dàng áp dụng</p>
              <p className="mt-2 text-lg font-black text-on-surface">Trải nghiệm trực quan</p>
              <p className="mt-2 text-sm text-on-surface-variant">
                Tra cứu và áp dụng trực tiếp cho đội hình của bạn.
              </p>
            </article>
          </div>
        </section>

        <section id="noi-bat">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="stitch-label-accent">Featured</p>
              <h2 className="stitch-section-title mt-2">Nội dung nổi bật</h2>
            </div>
            <Link
              href="/cong-cu"
              className="text-xs font-bold uppercase tracking-wider text-primary hover:text-primary"
            >
              Trung tâm công cụ →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {GUIDE_CARDS.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group rounded-xl bg-surface-container p-6 transition-all hover:bg-surface-container-high hover:shadow-lg hover:shadow-primary/5"
              >
                <p className="stitch-label">{card.tags[0]}</p>
                <h3 className="mt-3 text-xl font-black text-on-surface group-hover:text-primary transition-colors">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-on-surface-variant">{card.summary}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {card.tags.map((tag) => (
                    <span key={`${card.title}-${tag}`} className="stitch-chip text-[10px] px-2 py-0.5">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="thuat-ngu" className="border-t border-white/5 pt-10">
          <div className="mb-6">
            <p className="stitch-label-accent">Học viện eFootball</p>
            <h2 className="stitch-section-title mt-2">Cẩm nang Thuật ngữ & Kỹ thuật chơi đỉnh cao</h2>
            <p className="mt-2 text-sm text-on-surface-variant max-w-3xl">
              Tra cứu các chỉ số cốt lõi, cơ chế ẩn, phong độ và học cách thực hiện các kỹ thuật điều khiển nâng cao từ tay cầm cùng mẹo thực chiến của các game thủ eFootball chuyên nghiệp.
            </p>
          </div>
          <GuidesClient initialGuides={glossaryData} />
        </section>

        <section className="border-t border-white/5 pt-10">
          <div className="mb-6">
            <p className="stitch-label-accent">Cập nhật</p>
            <h2 className="stitch-section-title mt-2">Nhịp cập nhật</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {UPDATE_FEED.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-xl bg-surface-container p-5 transition-all hover:bg-surface-container-high"
              >
                <p className="stitch-chip stitch-chip-sky text-[10px] px-2 py-0.5">{item.category}</p>
                <h3 className="mt-3 text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="mt-4 text-xs font-bold uppercase tracking-wider text-outline">
                  Đi tới module →
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
