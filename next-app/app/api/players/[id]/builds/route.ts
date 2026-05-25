import { NextRequest, NextResponse } from 'next/server';

import {
  parseEnum,
  parseOptionalNumberInRange,
  parseOptionalText,
  parsePositiveInt
} from '@/lib/api/query';
import { buildApiCacheKey, withApiCache } from '@/lib/api/response-cache';
import {
  createPlayerBuild,
  getPlayerById,
  listPlayerBuilds
} from '@/lib/data/repository';
import { invalidateApiCacheByNamespace } from '@/lib/api/response-cache';
import { commitViewerSession, getViewerSession } from '@/lib/security/viewer-session';
import type { BuildCategory } from '@/types/domain';

type RouteParams = { id: string };
const PLAYER_BUILDS_LIST_TTL_MS = 10_000;

function parseAllocations(raw: unknown): Partial<Record<BuildCategory, number>> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  const source = raw as Record<string, unknown>;
  const keys: BuildCategory[] = [
    'shooting',
    'passing',
    'dribbling',
    'dexterity',
    'lowerBodyStrength',
    'aerialStrength',
    'defending',
    'gk1',
    'gk2',
    'gk3'
  ];

  const output: Partial<Record<BuildCategory, number>> = {};
  keys.forEach((key) => {
    const value = Number(source[key]);
    if (Number.isFinite(value) && value >= 0) {
      output[key] = Math.round(value);
    }
  });

  return output;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const viewerSession = await getViewerSession(request);

  const scope = parseEnum(
    searchParams.get('scope'),
    ['community', 'mine'] as const,
    'community'
  );
  const authorId = scope === 'mine' ? viewerSession.viewerId : undefined;
  const page = parsePositiveInt(searchParams.get('page'), 1, 10_000);
  const limit = parsePositiveInt(searchParams.get('limit'), 20, 100);

  const cacheKey = buildApiCacheKey(request.url, 'players:builds', [id, scope, authorId || '']);
  const { value, cache } = await withApiCache(cacheKey, PLAYER_BUILDS_LIST_TTL_MS, async () =>
    listPlayerBuilds({
      playerId: id,
      scope,
      authorId,
      page,
      limit
    })
  );

  const response = NextResponse.json(value);
  response.headers.set('X-Cache', cache);
  return commitViewerSession(request, response, viewerSession);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { id } = await context.params;
  const viewerSession = await getViewerSession(request);
  const player = await getPlayerById(id);
  if (!player) {
    return NextResponse.json({ message: 'Không tìm thấy cầu thủ.' }, { status: 404 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: 'Body JSON không hợp lệ.' }, { status: 400 });
  }

  const name = parseOptionalText(String(body.name ?? ''), { maxLength: 120 }) || 'Build';
  const condition = parseOptionalText(String(body.condition ?? ''), { maxLength: 1 }) || 'C';
  const visibility = parseEnum(
    parseOptionalText(String(body.visibility ?? ''), { maxLength: 12 }) || null,
    ['public', 'private'] as const,
    'public'
  );
  const source = parseEnum(
    parseOptionalText(String(body.source ?? ''), { maxLength: 12 }) || null,
    ['community', 'user'] as const,
    'user'
  );
  const level =
    parseOptionalNumberInRange(String(body.level ?? ''), 1, Math.max(1, Number(player.levels.max || 1))) || 1;
  const pointsUsed = parseOptionalNumberInRange(String(body.pointsUsed ?? ''), 0, 500);

  const created = await createPlayerBuild({
    playerId: player.efhubId,
    name,
    level,
    condition,
    allocations: parseAllocations(body.allocations),
    pointsUsed: typeof pointsUsed === 'number' ? Math.round(pointsUsed) : undefined,
    visibility,
    authorId: viewerSession.viewerId,
    authorName: parseOptionalText(String(body.authorName ?? ''), { maxLength: 80 }) || 'Anonymous',
    authorCountry: parseOptionalText(String(body.authorCountry ?? ''), { maxLength: 48 }),
    source
  });

  if (!created) {
    return NextResponse.json({ message: 'Không thể tạo build.' }, { status: 500 });
  }

  invalidateApiCacheByNamespace('players:builds');

  return commitViewerSession(
    request,
    NextResponse.json({ data: created }, { status: 201 }),
    viewerSession
  );
}
