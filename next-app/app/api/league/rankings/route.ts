import { NextRequest, NextResponse } from 'next/server';

import { parseEnum, parseOptionalText, parsePositiveInt } from '@/lib/api/query';
import { buildApiCacheKey, withApiCache } from '@/lib/api/response-cache';
import { listLeagueTeams } from '@/lib/data/repository';

const LEAGUE_RANKINGS_TTL_MS = 30_000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = parseEnum(
    searchParams.get('mode'),
    ['all', 'mobile_coop', 'crossplay_coop'] as const,
    'all'
  );
  const sortBy = parseEnum(
    searchParams.get('sortBy'),
    ['points_desc', 'points_asc', 'members_desc', 'members_asc', 'updated_desc', 'name_asc', 'name_desc'] as const,
    'points_desc'
  );

  const cacheKey = buildApiCacheKey(request.url, 'league:rankings');
  const { value, cache } = await withApiCache(cacheKey, LEAGUE_RANKINGS_TTL_MS, async () =>
    listLeagueTeams({
      q: parseOptionalText(searchParams.get('q'), { maxLength: 120 }),
      mode,
      sortBy,
      page: parsePositiveInt(searchParams.get('page'), 1, 10_000),
      limit: parsePositiveInt(searchParams.get('limit'), 50, 100)
    })
  );

  const response = NextResponse.json(value);
  response.headers.set('X-Cache', cache);
  return response;
}
