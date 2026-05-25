import { LineupBuilderClient } from '@/components/lineup/lineup-builder-client';
import { SiteHeader } from '@/components/layout/site-header';

export default function LineupPage() {
  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/doi-hinh" />
      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        <header className="mb-8">
          <p className="stitch-label-accent">Formation · Chemistry · Balance</p>
          <h1 className="stitch-headline text-4xl sm:text-5xl mt-2">Xây dựng đội hình</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
            Chọn sơ đồ, thêm cầu thủ, gắn HLV và đọc team metrics (chemistry, positional fit,
            độ phù hợp chiến thuật, balance) trong cùng một luồng làm việc.
          </p>
        </header>
        <LineupBuilderClient />
      </main>
    </div>
  );
}
