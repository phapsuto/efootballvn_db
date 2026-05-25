import { SiteHeader } from '@/components/layout/site-header';
import { ProfileHubClient } from '@/components/profile/profile-hub-client';
import { ViewerIdentityCard } from '@/components/profile/viewer-identity-card';

export default function ProfilePage() {
  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/ho-so" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
        <header>
          <p className="stitch-label-accent">Tài khoản · Build đã lưu</p>
          <h1 className="stitch-headline text-4xl sm:text-5xl mt-2">Hồ sơ cá nhân</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
            Trung tâm tài khoản: xem build của bạn, theo dõi các user khác và quản lý thông báo.
          </p>
        </header>
        <ProfileHubClient />
        <ViewerIdentityCard />
      </main>
    </div>
  );
}
