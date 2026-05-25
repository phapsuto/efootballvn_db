import Link from 'next/link';

const FOOTER_COLUMNS = [
  {
    title: 'Điều Hướng',
    links: [
      { href: '/', label: 'Trang chủ' },
      { href: '/cau-thu', label: 'Cầu thủ' },
      { href: '/hlv', label: 'HLV' },
      { href: '/doi-hinh', label: 'Đội hình' },
      { href: '/cong-cu', label: 'Công cụ' }
    ]
  },
  {
    title: 'Thư Viện',
    links: [
      { href: '/cam-nang', label: 'Cẩm nang' },
      { href: '/tinh-nang', label: 'Từ điển Skills & Playstyles' },
      { href: '/phan-tich', label: 'Phân tích' },
      { href: '/chuyen-nhuong', label: 'Chuyển nhượng' },
      { href: '/thong-bao', label: 'Thông báo' }
    ]
  },
  {
    title: 'Hệ Thống',
    links: [
      { href: '/community', label: 'Cộng đồng' },
      { href: '/packs', label: 'Gói cầu thủ' },
      { href: '/tournaments', label: 'Xếp hạng' },
      { href: '/ho-so', label: 'Hồ sơ' }
    ]
  },
  {
    title: 'Pháp Lý',
    links: [
      { href: '/chinh-sach', label: 'Chính sách' },
      { href: '/dieu-khoan', label: 'Điều khoản' },
      { href: '/hop-tac', label: 'Hợp tác' },
      { href: '/ho-tro', label: 'Hỗ trợ' }
    ]
  }
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-background/90 border-t border-on-surface/5">
      <div className="max-w-screen-2xl mx-auto px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))]">
          <div className="space-y-4">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="text-2xl font-black italic tracking-tighter text-on-surface">
                eFootball.vn
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary/80">
                Community
              </span>
            </Link>
            <p className="max-w-md text-sm leading-6 text-on-surface-variant">
              Cơ sở dữ liệu, công cụ và cẩm nang kiến thức chuyên sâu dành cho cộng đồng eFootball Việt Nam. Trải nghiệm mượt mà, đồng bộ và đầy đủ tính năng.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="stitch-chip stitch-chip-emerald">UI · Premium</span>
              <span className="stitch-chip stitch-chip-sky">Data · Live Sync</span>
              <span className="stitch-chip stitch-chip-amber">Cộng đồng VN</span>
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="stitch-label mb-4">{column.title}</h2>
              <div className="flex flex-col gap-3">
                {column.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-on-surface transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 pt-6 text-xs text-outline sm:flex-row sm:items-center sm:justify-between">
          <p>eFootball Hub VN – Tối ưu cho cả máy tính và di động.</p>
          <p>© 2026 eFootball Hub VN. Phiên bản tối ưu hóa cho cộng đồng.</p>
        </div>
      </div>
    </footer>
  );
}
