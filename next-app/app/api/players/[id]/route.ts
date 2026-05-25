import { NextRequest, NextResponse } from 'next/server';

import { buildApiCacheKey, withApiCache } from '@/lib/api/response-cache';
import { getPlayerById } from '@/lib/data/repository';

type RouteParams = { id: string };
const PLAYER_DETAIL_TTL_MS = 15_000;

export async function GET(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { id } = await context.params;
  const cacheKey = buildApiCacheKey(request.url, 'players:detail', [id]);
  const { value: player, cache } = await withApiCache(cacheKey, PLAYER_DETAIL_TTL_MS, () =>
    getPlayerById(id)
  );

  if (!player) {
    return NextResponse.json(
      { message: 'Không tìm thấy cầu thủ.' },
      { status: 404 }
    );
  }

  const response = NextResponse.json({ data: player });
  response.headers.set('X-Cache', cache);
  return response;
}
