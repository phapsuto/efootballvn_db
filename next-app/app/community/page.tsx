import { SiteHeader } from '@/components/layout/site-header';
import { CommunityListClient } from '@/components/community/community-list-client';

export default function CommunityPage() {
  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/community" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        <header className="mb-8">
          <p className="stitch-label-accent">Hồ sơ · Tương tác · Build</p>
          <h1 className="stitch-headline text-4xl sm:text-5xl mt-2">Cộng đồng</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
            Nơi kết nối hồ sơ người chơi, quan sát build nổi bật, theo dõi nhau và đi sâu từ
            cộng đồng sang chi tiết cầu thủ.
          </p>
        </header>
        <CommunityListClient />
      </main>
    </div>
  );
}
