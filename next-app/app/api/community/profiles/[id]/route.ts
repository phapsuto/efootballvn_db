import { NextRequest, NextResponse } from 'next/server';

import { buildApiCacheKey, withApiCache } from '@/lib/api/response-cache';
import { getCommunityProfileById } from '@/lib/data/repository';
import { commitViewerSession, getViewerSession } from '@/lib/security/viewer-session';

type RouteParams = { id: string };
const COMMUNITY_PROFILE_DETAIL_TTL_MS = 30_000;

export async function GET(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { id } = await context.params;
  const viewerSession = await getViewerSession(request);
  const viewerId = viewerSession.viewerId;
  const cacheKey = buildApiCacheKey(request.url, 'community:profiles:detail', [id, viewerId || '']);
  const { value: profile, cache } = await withApiCache(cacheKey, COMMUNITY_PROFILE_DETAIL_TTL_MS, () =>
    getCommunityProfileById(id, { viewerId })
  );

  if (!profile) {
    return NextResponse.json({ message: 'Không tìm thấy hồ sơ cộng đồng.' }, { status: 404 });
  }

  const response = NextResponse.json({ data: profile });
  response.headers.set('X-Cache', cache);
  return commitViewerSession(request, response, viewerSession);
}
