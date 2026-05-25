import { NextRequest, NextResponse } from 'next/server';

import {
  parseEnum,
  parseOptionalNumberInRange,
  parseOptionalText,
  parsePositiveInt
} from '@/lib/api/query';
import { buildApiCacheKey, withApiCache } from '@/lib/api/response-cache';
import { listPlayers } from '@/lib/data/repository';

const PLAYERS_LIST_TTL_MS = 15_000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const page = parsePositiveInt(searchParams.get('page'), 1, 10_000);
  const limit = parsePositiveInt(searchParams.get('limit'), 24, 100);
  const minOvr = parseOptionalNumberInRange(searchParams.get('minOvr'), 0, 150);
  const minHeight = parseOptionalNumberInRange(searchParams.get('minHeight'), 120, 240);
  const maxHeight = parseOptionalNumberInRange(searchParams.get('maxHeight'), 120, 240);
  const sortBy = parseEnum(
    searchParams.get('sortBy'),
    ['overall_desc', 'overall_asc', 'name_asc', 'name_desc', 'updated_desc'] as const,
    'overall_desc'
  );

  const cacheKey = buildApiCacheKey(request.url, 'players:list');
  const { value, cache } = await withApiCache(cacheKey, PLAYERS_LIST_TTL_MS, async () =>
    listPlayers({
      q: parseOptionalText(searchParams.get('q'), { maxLength: 120 }),
      position: parseOptionalText(searchParams.get('position'), { maxLength: 8 }),
      cardType: parseOptionalText(searchParams.get('cardType'), { maxLength: 32 }),
      playstyle: parseOptionalText(searchParams.get('playstyle'), { maxLength: 40 }),
      skill: parseOptionalText(searchParams.get('skill'), { maxLength: 80 }),
      nationality: parseOptionalText(searchParams.get('nationality'), { maxLength: 64 }),
      club: parseOptionalText(searchParams.get('club'), { maxLength: 80 }),
      foot: parseOptionalText(searchParams.get('foot'), { maxLength: 16 }),
      minHeight,
      maxHeight,
      minOvr,
      sortBy,
      page,
      limit
    })
  );

  const response = NextResponse.json(value);
  response.headers.set('X-Cache', cache);
  return response;
}
