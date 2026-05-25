import { NextRequest, NextResponse } from 'next/server';

import {
  parseEnum,
  parseOptionalNumberInRange,
  parseOptionalText,
  parsePositiveInt
} from '@/lib/api/query';
import { buildApiCacheKey, withApiCache } from '@/lib/api/response-cache';
import { listManagers } from '@/lib/data/repository';

const MANAGERS_LIST_TTL_MS = 20_000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sortBy = parseEnum(
    searchParams.get('sortBy'),
    [
      'style_desc',
      'style_asc',
      'name_asc',
      'name_desc',
      'team_asc',
      'team_desc',
      'updated_desc'
    ] as const,
    'style_desc'
  );

  const page = parsePositiveInt(searchParams.get('page'), 1, 10_000);
  const limit = parsePositiveInt(searchParams.get('limit'), 20, 100);

  const cacheKey = buildApiCacheKey(request.url, 'managers:list');
  const { value, cache } = await withApiCache(cacheKey, MANAGERS_LIST_TTL_MS, async () =>
    listManagers({
      q: parseOptionalText(searchParams.get('q'), { maxLength: 120 }),
      formation: parseOptionalText(searchParams.get('formation'), { maxLength: 16 }),
      playstyle: parseOptionalText(searchParams.get('playstyle'), { maxLength: 24 }),
      nationality: parseOptionalText(searchParams.get('nationality'), { maxLength: 48 }),
      minStyleProficiency: parseOptionalNumberInRange(searchParams.get('minStyleProficiency'), 1, 100),
      sortBy,
      page,
      limit
    })
  );

  const response = NextResponse.json(value);
  response.headers.set('X-Cache', cache);
  return response;
}
