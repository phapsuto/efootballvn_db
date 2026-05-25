import { NextRequest, NextResponse } from 'next/server';

import { buildApiCacheKey, withApiCache } from '@/lib/api/response-cache';
import { getLeagueTeamById } from '@/lib/data/repository';

type RouteParams = { id: string };
const LEAGUE_TEAM_DETAIL_TTL_MS = 30_000;

export async function GET(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { id } = await context.params;
  const cacheKey = buildApiCacheKey(request.url, 'league:rankings:detail', [id]);
  const { value: team, cache } = await withApiCache(cacheKey, LEAGUE_TEAM_DETAIL_TTL_MS, () =>
    getLeagueTeamById(id)
  );

  if (!team) {
    return NextResponse.json({ message: 'Không tìm thấy đội xếp hạng.' }, { status: 404 });
  }

  const response = NextResponse.json({ data: team });
  response.headers.set('X-Cache', cache);
  return response;
}
