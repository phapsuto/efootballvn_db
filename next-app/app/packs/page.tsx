import { SiteHeader } from '@/components/layout/site-header';
import { PacksListClient } from '@/components/packs/packs-list-client';

export default function PacksPage() {
  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/packs" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        <header className="mb-8">
          <p className="stitch-label-accent">Cửa sổ mở · Countdown</p>
          <h1 className="stitch-headline text-4xl sm:text-5xl mt-2">Gói cầu thủ</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
            Kho pack chính của app với trạng thái mở, countdown theo múi giờ Asia/Ho_Chi_Minh.
            Bấm vào pack để xem danh sách cầu thủ bên trong.
          </p>
        </header>
        <PacksListClient />
      </main>
    </div>
  );
}
