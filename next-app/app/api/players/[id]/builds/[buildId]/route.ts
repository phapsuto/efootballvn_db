import { NextRequest, NextResponse } from 'next/server';

import {
  parseEnum,
  parseOptionalNumberInRange,
  parseOptionalText
} from '@/lib/api/query';
import { invalidateApiCacheByNamespace } from '@/lib/api/response-cache';
import {
  deletePlayerBuild,
  getPlayerById,
  updatePlayerBuild
} from '@/lib/data/repository';
import { commitViewerSession, getViewerSession } from '@/lib/security/viewer-session';
import type { BuildCategory } from '@/types/domain';

type RouteParams = {
  id: string;
  buildId: string;
};

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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { id, buildId } = await context.params;
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

  const authorId = viewerSession.viewerId;
  if (!authorId) {
    return NextResponse.json({ message: 'Không thể tạo phiên người dùng ẩn danh.' }, { status: 400 });
  }

  const condition = parseOptionalText(String(body.condition ?? ''), { maxLength: 1 }) || undefined;
  const visibility = body.visibility
    ? parseEnum(
        parseOptionalText(String(body.visibility ?? ''), { maxLength: 12 }) || null,
        ['public', 'private'] as const,
        'public'
      )
    : undefined;
  const pointsUsed = body.pointsUsed
    ? parseOptionalNumberInRange(String(body.pointsUsed ?? ''), 0, 500)
    : undefined;
  const level = body.level
    ? parseOptionalNumberInRange(
        String(body.level ?? ''),
        1,
        Math.max(1, Number(player.levels.max || 1))
      )
    : undefined;
  const allocations =
    body.allocations && typeof body.allocations === 'object' && !Array.isArray(body.allocations)
      ? parseAllocations(body.allocations)
      : undefined;

  const updated = await updatePlayerBuild({
    playerId: player.efhubId,
    buildId,
    authorId,
    name: parseOptionalText(String(body.name ?? ''), { maxLength: 120 }) || undefined,
    level: typeof level === 'number' ? level : undefined,
    condition,
    allocations,
    pointsUsed: typeof pointsUsed === 'number' ? pointsUsed : undefined,
    visibility
  });

  if (!updated) {
    return NextResponse.json(
      { message: 'Không tìm thấy build hoặc bạn không có quyền cập nhật.' },
      { status: 404 }
    );
  }

  invalidateApiCacheByNamespace('players:builds');
  return commitViewerSession(request, NextResponse.json({ data: updated }), viewerSession);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  const { id, buildId } = await context.params;
  const viewerSession = await getViewerSession(request);
  const player = await getPlayerById(id);
  if (!player) {
    return NextResponse.json({ message: 'Không tìm thấy cầu thủ.' }, { status: 404 });
  }

  const authorId = viewerSession.viewerId;
  if (!authorId) {
    return NextResponse.json({ message: 'Không thể tạo phiên người dùng ẩn danh.' }, { status: 400 });
  }

  const removed = await deletePlayerBuild({
    playerId: player.efhubId,
    buildId,
    authorId
  });

  if (!removed) {
    return NextResponse.json(
      { message: 'Không tìm thấy build hoặc bạn không có quyền xoá.' },
      { status: 404 }
    );
  }

  invalidateApiCacheByNamespace('players:builds');
  return commitViewerSession(request, NextResponse.json({ ok: true }), viewerSession);
}
