import { NextRequest, NextResponse } from 'next/server';

import {
  commitViewerSession,
  EFVN_VIEWER_COOKIE_NAME,
  extractViewerIdFromCookie,
  getViewerSession
} from '@/lib/security/viewer-session';
import { createMemoryRateLimiter } from '@/lib/security/rate-limit';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;
const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// NOTE: The in-memory limiter is per-instance. For multi-instance deployments
// (Vercel, multi-replica Fly.io, etc.) swap this for the Upstash adapter — see
// lib/security/rate-limit.ts for the migration path.
const rateLimiter = createMemoryRateLimiter({
  windowMs: WINDOW_MS,
  maxRequests: MAX_REQUESTS,
  maxTrackedKeys: 20_000
});

function extractIpFromHeader(value: string | null) {
  if (!value) {
    return null;
  }

  const first = value.split(',')[0]?.trim();
  if (!first || first.length > 64) {
    return null;
  }

  // Keep parsing strict enough to avoid header abuse with arbitrary keys.
  const isIpLike = /^[0-9a-fA-F:.]+$/.test(first);
  return isIpLike ? first : null;
}

async function getClientKey(request: NextRequest): Promise<string> {
  const requestWithIp = request as NextRequest & { ip?: string };
  const runtimeIp = extractIpFromHeader(requestWithIp.ip ?? null);
  if (runtimeIp) {
    return `ip:${runtimeIp}`;
  }

  const trustedProxyIp =
    extractIpFromHeader(request.headers.get('cf-connecting-ip')) ||
    extractIpFromHeader(request.headers.get('x-vercel-forwarded-for')) ||
    extractIpFromHeader(request.headers.get('fly-client-ip'));
  if (trustedProxyIp) {
    return `ip:${trustedProxyIp}`;
  }

  const viewerId = await extractViewerIdFromCookie(
    request.cookies.get(EFVN_VIEWER_COOKIE_NAME)?.value
  );
  if (viewerId) {
    return `viewer:${viewerId}`;
  }

  return 'unknown';
}

function getAllowedOriginHosts(request: NextRequest) {
  const hosts = new Set<string>();
  const requestHost = (request.headers.get('host') || '').toLowerCase();
  if (requestHost) {
    hosts.add(requestHost);
  }
  const forwardedHost = (request.headers.get('x-forwarded-host') || '').toLowerCase();
  if (forwardedHost) {
    hosts.add(forwardedHost);
  }
  const extra = process.env.EFVN_ALLOWED_ORIGINS;
  if (extra) {
    for (const entry of extra.split(',')) {
      const host = entry.trim().toLowerCase();
      if (host) {
        hosts.add(host);
      }
    }
  }
  return hosts;
}

function hostFromUrl(urlLike: string | null) {
  if (!urlLike) {
    return '';
  }
  try {
    return new URL(urlLike).host.toLowerCase();
  } catch {
    return '';
  }
}

function isSameOriginRequest(request: NextRequest) {
  const allowed = getAllowedOriginHosts(request);
  if (allowed.size === 0) {
    // Without a known host we cannot verify — fail closed.
    return false;
  }

  const originHost = hostFromUrl(request.headers.get('origin'));
  if (originHost) {
    return allowed.has(originHost);
  }

  const refererHost = hostFromUrl(request.headers.get('referer'));
  if (refererHost) {
    return allowed.has(refererHost);
  }

  // Neither header present — could be a same-origin fetch from a client that
  // stripped them, or a cross-origin attacker. Browsers send at least one of
  // these for cross-origin state-changing fetches, so reject when both are
  // missing on an /api write.
  return false;
}

function setRateLimitHeaders(response: NextResponse, count: number, resetAt: number, now: number) {
  const remaining = Math.max(0, MAX_REQUESTS - count);
  const resetSeconds = Math.max(0, Math.ceil((resetAt - now) / 1000));

  response.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(resetSeconds));
  if (count > MAX_REQUESTS) {
    response.headers.set('Retry-After', String(resetSeconds));
  }
}

export async function middleware(request: NextRequest) {
  const viewerSession = await getViewerSession(request);
  const pathname = request.nextUrl.pathname;
  const now = Date.now();
  const isApiRoute = pathname.startsWith('/api/');

  if (!isApiRoute) {
    return commitViewerSession(request, NextResponse.next(), viewerSession);
  }

  // CSRF protection for state-changing requests. Since the viewer cookie is
  // SameSite=Lax and HttpOnly, cross-origin fetches can still smuggle it on
  // some edge cases. Validate Origin/Referer against the request host to
  // block forged requests from third-party pages.
  if (STATE_CHANGING_METHODS.has(request.method) && !isSameOriginRequest(request)) {
    return NextResponse.json(
      { message: 'Yêu cầu bị chặn vì nguồn gốc không hợp lệ.' },
      { status: 403 }
    );
  }

  const key = await getClientKey(request);
  const result = await rateLimiter.increment(key, now);

  if (result.limited) {
    const response = NextResponse.json(
      { message: 'Bạn gửi quá nhiều request. Vui lòng thử lại sau.' },
      { status: 429 }
    );
    setRateLimitHeaders(response, result.count, result.resetAt, now);
    return response;
  }

  const response = NextResponse.next();
  setRateLimitHeaders(response, result.count, result.resetAt, now);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)']
};
