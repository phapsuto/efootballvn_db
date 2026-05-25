import { NextRequest, NextResponse } from 'next/server';

import { buildApiCacheKey, withApiCache } from '@/lib/api/response-cache';
import { getPackById, getPlayersByIds } from '@/lib/data/repository';
import { getPackTiming } from '@/lib/packs/pack-timing';

type RouteParams = { id: string };
const PACK_DETAIL_TTL_MS = 30_000;

export async function GET(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { id } = await context.params;
  const cacheKey = buildApiCacheKey(request.url, 'packs:detail', [id]);
  const { value, cache } = await withApiCache(cacheKey, PACK_DETAIL_TTL_MS, async () => {
    const pack = await getPackById(id);
    if (!pack) {
      return null;
    }
    const players = await getPlayersByIds(pack.playerIds);
    return {
      ...pack,
      timing: getPackTiming(pack),
      players
    };
  });

  if (!value) {
    return NextResponse.json(
      { message: 'Không tìm thấy gói cầu thủ.' },
      { status: 404 }
    );
  }

  const response = NextResponse.json({ data: value });
  response.headers.set('X-Cache', cache);
  return response;
}
