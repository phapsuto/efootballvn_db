import Link from 'next/link';

import { SiteHeader } from '@/components/layout/site-header';

const POLICY_ITEMS = [
  'Dữ liệu cầu thủ, huấn luyện viên và các gói thẻ được cập nhật trực tuyến và lưu trữ trực tiếp trên máy chủ.',
  'Các bản lưu đội hình và thông số build cá nhân được lưu trên trình duyệt của bạn để bạn tiếp tục nhanh mà không cần đăng nhập.',
  'Các thao tác chia sẻ build lên cộng đồng sử dụng phiên làm việc an toàn do hệ thống cấp, bảo vệ thông tin người dùng tối đa.'
];

export default function PolicyPage() {
  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/chinh-sach" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
        <section className="rounded-xl bg-surface-container px-8 py-10 sm:px-12 sm:py-14">
          <span className="stitch-chip stitch-chip-sky">Bảo mật</span>
          <p className="stitch-label-accent mt-5">Chính sách · Dữ liệu · Quyền riêng tư</p>
          <h1 className="stitch-headline text-4xl sm:text-5xl mt-2">Chính sách</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-on-surface">
            Hệ thống tối ưu hóa dữ liệu cộng đồng, lưu trữ dữ liệu thông minh trên trình duyệt và cách thức xử lý thông tin để mang lại trải nghiệm nhanh và an toàn nhất.
          </p>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          {POLICY_ITEMS.map((item) => (
            <article
              key={item}
              className="rounded-xl bg-surface-container p-6 text-sm leading-6 text-on-surface"
            >
              {item}
            </article>
          ))}
        </section>
        <Link href="/ho-tro" className="stitch-cta">
          Mở hỗ trợ
        </Link>
      </main>
    </div>
  );
}
