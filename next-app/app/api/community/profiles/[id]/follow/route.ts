import { NextRequest, NextResponse } from 'next/server';

import { invalidateApiCacheByNamespace } from '@/lib/api/response-cache';
import { setCommunityFollowState } from '@/lib/data/repository';
import { commitViewerSession, getViewerSession } from '@/lib/security/viewer-session';

type RouteParams = { id: string };

async function mutateFollowState(
  request: NextRequest,
  context: { params: Promise<RouteParams> },
  follow: boolean
) {
  const { id } = await context.params;
  const viewerSession = await getViewerSession(request);
  const viewerId = viewerSession.viewerId;
  if (!viewerId) {
    return NextResponse.json(
      { message: 'Không thể tạo phiên người dùng ẩn danh.' },
      { status: 400 }
    );
  }

  const updated = await setCommunityFollowState({
    viewerId,
    profileId: id,
    follow
  });

  if (!updated) {
    return NextResponse.json(
      { message: 'Không thể cập nhật trạng thái theo dõi.' },
      { status: 400 }
    );
  }

  invalidateApiCacheByNamespace('community:profiles');
  invalidateApiCacheByNamespace('community:profiles:detail');

  const response = NextResponse.json({
    data: updated.profile,
    changed: updated.changed
  });
  return commitViewerSession(request, response, viewerSession);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  return mutateFollowState(request, context, true);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  return mutateFollowState(request, context, false);
}
