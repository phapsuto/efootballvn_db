import { NextRequest, NextResponse } from 'next/server';

import {
  EFVN_VIEWER_COOKIE_NAME,
  commitViewerSession,
  getViewerSession,
  normalizeViewerId
} from '@/lib/security/viewer-session';

// GET returns the current bare viewer id (creating one if missing) so the user
// can copy it as a "restore code" for their anonymous profile.
export async function GET(request: NextRequest) {
  const viewerSession = await getViewerSession(request);
  const response = NextResponse.json({ viewerId: viewerSession.viewerId });
  return commitViewerSession(request, response, viewerSession);
}

// POST allows the user to restore a previously exported viewer id. Accepts a
// bare id; we re-sign and rotate the cookie. Cross-origin protection is
// enforced by the middleware CSRF check.
export async function POST(request: NextRequest) {
  let body: { viewerId?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const nextId = normalizeViewerId(typeof body.viewerId === 'string' ? body.viewerId.trim() : '');
  if (!nextId) {
    return NextResponse.json(
      { message: 'Mã viewer không hợp lệ. Hãy dán đúng mã đã lưu trước đó.' },
      { status: 400 }
    );
  }

  const response = NextResponse.json({ viewerId: nextId });
  return commitViewerSession(
    request,
    response,
    { viewerId: nextId, created: true, needsRefresh: true }
  );
}

// DELETE clears the cookie so the next request issues a fresh anonymous id.
export async function DELETE() {
  const response = NextResponse.json({ cleared: true });
  response.cookies.set({
    name: EFVN_VIEWER_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
  return response;
}
