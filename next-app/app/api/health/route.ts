import { NextResponse } from 'next/server';

import { getApiCacheStats } from '@/lib/api/response-cache';
import { getDataSourceStatus } from '@/lib/data/repository';
import { getSyncPipelineStatus } from '@/lib/sync/status';

export async function GET() {
  const [dataSource, pipeline] = await Promise.all([
    getDataSourceStatus(),
    getSyncPipelineStatus()
  ]);
  const apiCache = getApiCacheStats();

  return NextResponse.json({
    status: 'ok',
    service: 'efootball-vn-next',
    stack: 'nextjs-tailwind-shadcn',
    checkedAt: new Date().toISOString(),
    database: {
      connected: dataSource.connected,
      mode: dataSource.mode,
      name: dataSource.database,
      collections: dataSource.collections,
      error: dataSource.error
    },
    cache: apiCache,
    pipeline
  });
}
