import { notFound } from 'next/navigation';

import { SiteHeader } from '@/components/layout/site-header';
import { ManagerDetail } from '@/components/managers/manager-detail';
import { getManagerById } from '@/lib/data/repository';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ManagerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const manager = await getManagerById(id);

  if (!manager) {
    notFound();
  }

  return (
    <div className="stitch-page">
      <SiteHeader activeHref="/hlv" />
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        <ManagerDetail manager={manager} />
      </main>
    </div>
  );
}
