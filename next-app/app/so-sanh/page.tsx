import { SiteHeader } from '@/components/layout/site-header';
import { PlayerCompareClient } from '@/components/players/player-compare-client';

type PageProps = {
  searchParams?: Promise<{
    left?: string;
    right?: string;
  }>;
};

export default async function ComparePage({ searchParams }: PageProps) {
  const resolved = (await searchParams) || {};
  const left = typeof resolved.left === 'string' ? resolved.left : '';
  const right = typeof resolved.right === 'string' ? resolved.right : '';

  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/so-sanh" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        <header className="mb-8">
          <p className="stitch-label-accent">A/B Test cầu thủ</p>
          <h1 className="stitch-headline text-4xl sm:text-5xl mt-2">So sánh cầu thủ</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
            Lấy hai cầu thủ, đặt cùng level và condition, rồi đọc bảng chênh lệch chỉ số theo đúng
            engine tính toán của app.
          </p>
        </header>
        <PlayerCompareClient initialLeftId={left} initialRightId={right} />
      </main>
    </div>
  );
}
