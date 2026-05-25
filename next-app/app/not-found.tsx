import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="stitch-page flex min-h-screen items-center justify-center px-6">
      <div className="max-w-xl rounded-xl bg-surface-container p-10 text-center">
        <p className="stitch-label-accent">Error · 404</p>
        <h1 className="stitch-headline text-6xl sm:text-7xl mt-4">404</h1>
        <p className="mt-4 text-sm text-on-surface-variant leading-6">
          Không tìm thấy nội dung bạn đang tìm. Hãy quay lại thư viện cầu thủ hoặc mở trung tâm
          công cụ để tiếp tục.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/cau-thu" className="stitch-cta">
            Quay về cầu thủ
          </Link>
          <Link
            href="/cong-cu"
            className="rounded-lg border border-on-surface/10 bg-white/5 px-5 py-2 text-sm font-bold uppercase tracking-wider text-on-surface transition-all hover:bg-white/10"
          >
            Trung tâm công cụ
          </Link>
        </div>
      </div>
    </main>
  );
}
