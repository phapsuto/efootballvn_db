import { NextRequest, NextResponse } from 'next/server';

import { parseEnum, parseOptionalText, parsePositiveInt } from '@/lib/api/query';
import { buildApiCacheKey, withApiCache } from '@/lib/api/response-cache';
import { listCommunityProfiles } from '@/lib/data/repository';
import { commitViewerSession, getViewerSession } from '@/lib/security/viewer-session';

const COMMUNITY_LIST_TTL_MS = 30_000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const viewerSession = await getViewerSession(request);
  const viewerId = viewerSession.viewerId;
  const tab = parseEnum(
    searchParams.get('tab'),
    ['discover', 'following', 'followers'] as const,
    'discover'
  );
  const sortBy = parseEnum(
    searchParams.get('sortBy'),
    ['tab_default', 'builds_desc', 'followers_desc', 'following_desc', 'name_asc', 'name_desc'] as const,
    'tab_default'
  );

  const cacheKey = buildApiCacheKey(request.url, 'community:profiles', [viewerId]);
  const { value, cache } = await withApiCache(cacheKey, COMMUNITY_LIST_TTL_MS, async () =>
    listCommunityProfiles({
      q: parseOptionalText(searchParams.get('q'), { maxLength: 120 }),
      region: parseOptionalText(searchParams.get('region'), { maxLength: 48 }),
      country: parseOptionalText(searchParams.get('country'), { maxLength: 48 }),
      viewerId,
      tab,
      sortBy,
      page: parsePositiveInt(searchParams.get('page'), 1, 10_000),
      limit: parsePositiveInt(searchParams.get('limit'), 20, 100)
    })
  );

  const response = NextResponse.json(value);
  response.headers.set('X-Cache', cache);
  return commitViewerSession(request, response, viewerSession);
}
