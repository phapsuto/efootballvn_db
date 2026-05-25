import { SiteHeader } from '@/components/layout/site-header';
import { ManagersListClient } from '@/components/managers/managers-list-client';

export default function ManagersPage() {
  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/hlv" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        <ManagersListClient />
      </main>
    </div>
  );
}
