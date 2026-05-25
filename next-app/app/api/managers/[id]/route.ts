import { NextRequest, NextResponse } from 'next/server';

import { buildApiCacheKey, withApiCache } from '@/lib/api/response-cache';
import { getManagerById } from '@/lib/data/repository';

type RouteParams = { id: string };
const MANAGER_DETAIL_TTL_MS = 20_000;

export async function GET(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { id } = await context.params;
  const cacheKey = buildApiCacheKey(request.url, 'managers:detail', [id]);
  const { value: manager, cache } = await withApiCache(cacheKey, MANAGER_DETAIL_TTL_MS, () =>
    getManagerById(id)
  );

  if (!manager) {
    return NextResponse.json({ message: 'Không tìm thấy HLV.' }, { status: 404 });
  }

  const response = NextResponse.json({ data: manager });
  response.headers.set('X-Cache', cache);
  return response;
}
