import { NextRequest, NextResponse } from 'next/server';

import { parseOptionalText, parsePositiveInt } from '@/lib/api/query';
import { buildApiCacheKey, withApiCache } from '@/lib/api/response-cache';
import { listPacks } from '@/lib/data/repository';
import { getPackTiming } from '@/lib/packs/pack-timing';

const PACKS_LIST_TTL_MS = 30_000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const cacheKey = buildApiCacheKey(request.url, 'packs:list');
  const { value, cache } = await withApiCache(cacheKey, PACKS_LIST_TTL_MS, async () =>
    listPacks({
      q: parseOptionalText(searchParams.get('q'), { maxLength: 120 }),
      type: parseOptionalText(searchParams.get('type'), { maxLength: 32 }),
      page: parsePositiveInt(searchParams.get('page'), 1, 10_000),
      limit: parsePositiveInt(searchParams.get('limit'), 20, 100)
    })
  );

  const payload = {
    ...value,
    data: value.data.map((pack) => ({
      ...pack,
      timing: getPackTiming(pack)
    }))
  };

  const response = NextResponse.json(payload);
  response.headers.set('X-Cache', cache);
  return response;
}
