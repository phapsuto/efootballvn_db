type CacheEntry<T> = {
  value: T;
  createdAt: number;
  expiresAt: number;
  hits: number;
};

const MAX_CACHE_ENTRIES = 2_000;
const cacheStore = new Map<string, CacheEntry<unknown>>();

let hitCount = 0;
let missCount = 0;
let evictCount = 0;

function nowMs() {
  return Date.now();
}

function cleanupExpired(now: number) {
  for (const [key, entry] of cacheStore.entries()) {
    if (entry.expiresAt <= now) {
      cacheStore.delete(key);
    }
  }
}

function trimOverflow() {
  if (cacheStore.size <= MAX_CACHE_ENTRIES) {
    return;
  }

  const overflow = cacheStore.size - MAX_CACHE_ENTRIES;
  const entries = [...cacheStore.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt);
  for (let index = 0; index < overflow; index += 1) {
    const key = entries[index]?.[0];
    if (!key) {
      break;
    }
    cacheStore.delete(key);
    evictCount += 1;
  }
}

function normalizeUrlForKey(url: URL) {
  const params = [...url.searchParams.entries()].sort((a, b) =>
    a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0])
  );
  const encodedParams = params.map(
    ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
  );
  return `${url.pathname}?${encodedParams.join('&')}`;
}

export function buildApiCacheKey(requestUrl: string, namespace: string, extraParts: string[] = []) {
  const url = new URL(requestUrl);
  const normalized = normalizeUrlForKey(url);
  const extra = extraParts.filter(Boolean).join('|');
  return extra ? `${namespace}::${normalized}::${extra}` : `${namespace}::${normalized}`;
}

export async function withApiCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<{ value: T; cache: 'HIT' | 'MISS' }> {
  const now = nowMs();
  cleanupExpired(now);

  const existing = cacheStore.get(key) as CacheEntry<T> | undefined;
  if (existing && existing.expiresAt > now) {
    existing.hits += 1;
    hitCount += 1;
    return {
      value: existing.value,
      cache: 'HIT'
    };
  }

  missCount += 1;
  const value = await loader();
  cacheStore.set(key, {
    value,
    createdAt: now,
    expiresAt: now + Math.max(0, ttlMs),
    hits: 0
  });
  trimOverflow();

  return {
    value,
    cache: 'MISS'
  };
}

export function getApiCacheStats() {
  const now = nowMs();
  cleanupExpired(now);
  const totalRequests = hitCount + missCount;

  return {
    entries: cacheStore.size,
    maxEntries: MAX_CACHE_ENTRIES,
    hitCount,
    missCount,
    evictCount,
    hitRate: totalRequests > 0 ? Number((hitCount / totalRequests).toFixed(4)) : 0
  };
}

export function invalidateApiCacheByNamespace(namespace: string) {
  const prefix = `${namespace}::`;
  let removed = 0;

  for (const key of cacheStore.keys()) {
    if (!key.startsWith(prefix)) {
      continue;
    }
    cacheStore.delete(key);
    removed += 1;
  }

  return removed;
}
