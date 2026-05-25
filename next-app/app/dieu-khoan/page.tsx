import Link from 'next/link';

import { SiteHeader } from '@/components/layout/site-header';

export default function TermsPage() {
  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/dieu-khoan" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
        <section className="rounded-xl bg-surface-container px-8 py-10 sm:px-12 sm:py-14">
          <span className="stitch-chip">Pháp lý</span>
          <p className="stitch-label-accent mt-5">Điều khoản · Trách nhiệm · Dữ liệu</p>
          <h1 className="stitch-headline text-4xl sm:text-5xl mt-2">Điều khoản</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-on-surface">
            Web app là nền tảng cộng đồng độc lập, dữ liệu được đồng bộ định kỳ và một số module
            có thể phụ thuộc tình trạng Mongo/scraper trong môi trường triển khai.
          </p>
        </section>
        <section className="rounded-xl bg-surface-container p-6 space-y-3 text-sm leading-7 text-on-surface">
          <p>
            Người dùng chịu trách nhiệm cho các build hoặc profile community được public từ phiên
            hiện tại.
          </p>
          <p>
            Không có nút hoặc action nào được giữ ở dạng trình diễn; nếu một flow không phù hợp
            scope sản phẩm, nó sẽ bị loại khỏi app thay vì để placeholder.
          </p>
          <p>
            Những thay đổi lớn về cadence dữ liệu sẽ được phản ánh tại trang Thông báo hệ thống.
          </p>
        </section>
        <Link
          href="/thong-bao"
          className="inline-flex rounded-lg border border-on-surface/10 bg-white/5 px-5 py-2 text-sm font-bold uppercase tracking-wider text-on-surface transition-all hover:bg-white/10"
        >
          Xem thông báo hệ thống
        </Link>
      </main>
    </div>
  );
}
