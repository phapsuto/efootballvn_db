import type { NextRequest, NextResponse } from 'next/server';

const VIEWER_ID_PATTERN = /^[a-zA-Z0-9_-]{3,80}$/;

export const EFVN_VIEWER_COOKIE_NAME = 'efvn_viewer';

// 30 days rolling TTL — cookie is re-issued whenever the viewer browses,
// so regular visitors stay stable while abandoned sessions expire.
const VIEWER_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

// Refresh the signature/expiry when more than half the window has elapsed.
const VIEWER_COOKIE_REFRESH_THRESHOLD_SECONDS = VIEWER_COOKIE_MAX_AGE_SECONDS / 2;

type ViewerSession = {
  viewerId: string;
  created: boolean;
  // When true the cookie must be (re)written to the response — either because
  // it was just generated or because it is close to expiry and should roll.
  needsRefresh: boolean;
};

function getViewerSecret() {
  const secret = process.env.EFVN_VIEWER_COOKIE_SECRET;
  if (secret && secret.length >= 16) {
    return secret;
  }
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[efvn] EFVN_VIEWER_COOKIE_SECRET is missing or too short; using insecure default. Set a 32+ char secret in production.'
    );
  }
  return 'efvn-dev-secret-change-me-please__________________';
}

// Cache the imported CryptoKey — importKey is relatively expensive, and the
// secret doesn't change at runtime.
let cachedKey: CryptoKey | null = null;
let cachedSecret: string | null = null;

async function getHmacKey(): Promise<CryptoKey> {
  const secret = getViewerSecret();
  if (cachedKey && cachedSecret === secret) {
    return cachedKey;
  }
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  cachedKey = key;
  cachedSecret = secret;
  return key;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(b64url: string): Uint8Array | null {
  try {
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = (4 - (b64.length % 4)) % 4;
    const padded = b64 + '='.repeat(pad);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

async function sign(value: string, issuedAt: number): Promise<string> {
  const key = await getHmacKey();
  const data = new TextEncoder().encode(`${value}.${issuedAt}`);
  const signature = await crypto.subtle.sign('HMAC', key, data);
  return `${value}.${issuedAt}.${bufferToBase64Url(signature)}`;
}

async function verify(
  cookie: string
): Promise<{ viewerId: string; issuedAt: number } | null> {
  const parts = cookie.split('.');
  if (parts.length !== 3) {
    return null;
  }
  const [viewerId, issuedAtRaw, providedSig] = parts;
  if (!VIEWER_ID_PATTERN.test(viewerId)) {
    return null;
  }
  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt) || issuedAt <= 0) {
    return null;
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (issuedAt > nowSeconds + 60) {
    return null;
  }
  if (nowSeconds - issuedAt > VIEWER_COOKIE_MAX_AGE_SECONDS) {
    return null;
  }

  const sigBytes = base64UrlToBytes(providedSig);
  if (!sigBytes) {
    return null;
  }

  const key = await getHmacKey();
  const data = new TextEncoder().encode(`${viewerId}.${issuedAt}`);
  const ok = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes as BufferSource,
    data as BufferSource
  );
  if (!ok) {
    return null;
  }
  return { viewerId, issuedAt };
}

/**
 * Validates and returns a bare viewer id. Signed cookies (which contain dots)
 * are intentionally rejected here — callers that receive raw cookie values
 * should go through `getViewerSession` or `verifyViewerCookie` to extract the
 * inner id. This keeps this function synchronous for internal call sites that
 * already have a bare id.
 */
export function normalizeViewerId(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (!VIEWER_ID_PATTERN.test(trimmed)) {
    return '';
  }
  return trimmed;
}

/**
 * Async variant for extracting a viewer id from a cookie value that may or may
 * not be signed. Returns '' for invalid/tampered cookies.
 */
export async function extractViewerIdFromCookie(
  cookieValue: string | undefined
): Promise<string> {
  if (!cookieValue) {
    return '';
  }
  if (cookieValue.includes('.')) {
    const verified = await verify(cookieValue);
    return verified ? verified.viewerId : '';
  }
  return normalizeViewerId(cookieValue);
}

function generateViewerId() {
  return `efvn_${crypto.randomUUID().replace(/-/g, '')}`;
}

export async function getViewerSession(
  request: Pick<NextRequest, 'cookies'>
): Promise<ViewerSession> {
  const rawCookie = request.cookies.get(EFVN_VIEWER_COOKIE_NAME)?.value;
  if (rawCookie) {
    if (rawCookie.includes('.')) {
      const verified = await verify(rawCookie);
      if (verified) {
        const nowSeconds = Math.floor(Date.now() / 1000);
        const age = nowSeconds - verified.issuedAt;
        return {
          viewerId: verified.viewerId,
          created: false,
          needsRefresh: age >= VIEWER_COOKIE_REFRESH_THRESHOLD_SECONDS
        };
      }
    } else if (VIEWER_ID_PATTERN.test(rawCookie)) {
      // Legacy unsigned cookie: accept the id once, then upgrade by re-signing.
      return {
        viewerId: rawCookie,
        created: false,
        needsRefresh: true
      };
    }
    // Invalid / tampered — fall through and issue a fresh session.
  }

  return {
    viewerId: generateViewerId(),
    created: true,
    needsRefresh: true
  };
}

function shouldUseSecureCookie(request: Pick<NextRequest, 'headers'>) {
  const host = (request.headers.get('host') || '').toLowerCase();
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    return false;
  }

  const forwardedProto = (request.headers.get('x-forwarded-proto') || '').toLowerCase();
  return process.env.NODE_ENV === 'production' && forwardedProto === 'https';
}

export async function commitViewerSession(
  request: Pick<NextRequest, 'headers'>,
  response: NextResponse,
  session: ViewerSession
): Promise<NextResponse> {
  if (!session.needsRefresh) {
    return response;
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const signed = await sign(session.viewerId, issuedAt);

  response.cookies.set({
    name: EFVN_VIEWER_COOKIE_NAME,
    value: signed,
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(request),
    path: '/',
    maxAge: VIEWER_COOKIE_MAX_AGE_SECONDS
  });

  return response;
}
