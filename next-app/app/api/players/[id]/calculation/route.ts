import { NextRequest, NextResponse } from 'next/server';

import { parseOptionalText, parsePositiveInt } from '@/lib/api/query';
import { buildApiCacheKey, withApiCache } from '@/lib/api/response-cache';
import { getManagerById, getPlayerById } from '@/lib/data/repository';
import {
  calculatePlayerProjection,
  decodeBuildAllocations,
  emptyBuildAllocations,
  normalizeConditionGrade
} from '@/lib/gameplay/player-calculation';

type RouteParams = {
  id: string;
};
const PLAYER_CALC_TTL_MS = 5_000;

function parseBooleanFlag(value: string | null, fallback: boolean) {
  if (value === null) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }
  return fallback;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { id } = await context.params;
  const cacheKey = buildApiCacheKey(request.url, 'players:calculation', [id]);
  const { value, cache } = await withApiCache(cacheKey, PLAYER_CALC_TTL_MS, async () => {
    const player = await getPlayerById(id);
    if (!player) {
      return null;
    }

    const { searchParams } = new URL(request.url);
    const level = parsePositiveInt(
      searchParams.get('level'),
      Math.max(1, Number(player.levels.current || 1)),
      Math.max(1, Number(player.levels.max || 1))
    );

    const condition = normalizeConditionGrade(
      parseOptionalText(searchParams.get('condition'), { maxLength: 1 }) || player.condition.form
    );

    const buildRaw = parseOptionalText(searchParams.get('build'), { maxLength: 80 });
    const allocations = buildRaw ? decodeBuildAllocations(buildRaw) : emptyBuildAllocations();

    const managerId = parseOptionalText(searchParams.get('managerId'), { maxLength: 80 });
    const manager = managerId ? await getManagerById(managerId) : null;

    const result = calculatePlayerProjection({
      player,
      level,
      condition,
      allocations,
      manager,
      applyBuildBonuses: parseBooleanFlag(searchParams.get('applyBuild'), true),
      applyConditionEffect: parseBooleanFlag(searchParams.get('applyCondition'), true)
    });

    return {
      data: result,
      meta: {
        managerApplied: Boolean(manager),
        managerId: manager?.efhubId || null
      }
    };
  });

  if (!value) {
    return NextResponse.json(
      { message: 'Không tìm thấy cầu thủ.' },
      { status: 404 }
    );
  }

  const response = NextResponse.json(value);
  response.headers.set('X-Cache', cache);
  return response;
}
