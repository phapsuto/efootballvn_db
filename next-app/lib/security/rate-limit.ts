/**
 * Rate limit adapter.
 *
 * The default implementation uses an in-process Map. This is fine for a single
 * long-running Node server, but on serverless / edge platforms (Vercel, Cloud
 * Run, Fly.io machines scaled > 1) each instance has its own counter, so a
 * motivated attacker can simply fan out requests across cold-started instances.
 *
 * To migrate to a shared store:
 *   1. `npm install @upstash/ratelimit @upstash/redis`
 *   2. Add to env: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
 *   3. Replace the `createMemoryRateLimiter()` call in middleware.ts with
 *      `createUpstashRateLimiter()` — see the commented example at the bottom
 *      of this file.
 *
 * The adapter surface is deliberately small (increment + read) so either
 * backend fits.
 */

export type RateLimitResult = {
  count: number;
  resetAt: number;
  limited: boolean;
};

export type RateLimiter = {
  increment(key: string, now: number): Promise<RateLimitResult> | RateLimitResult;
};

export type MemoryRateLimiterOptions = {
  windowMs: number;
  maxRequests: number;
  maxTrackedKeys?: number;
};

type Counter = {
  count: number;
  resetAt: number;
};

export function createMemoryRateLimiter(options: MemoryRateLimiterOptions): RateLimiter {
  const { windowMs, maxRequests, maxTrackedKeys = 20_000 } = options;
  const counters = new Map<string, Counter>();

  function cleanup(now: number) {
    for (const [key, value] of counters.entries()) {
      if (value.resetAt <= now) {
        counters.delete(key);
      }
    }
  }

  function trim() {
    while (counters.size > maxTrackedKeys) {
      const oldestKey = counters.keys().next().value;
      if (!oldestKey) break;
      counters.delete(oldestKey);
    }
  }

  return {
    increment(key, now) {
      cleanup(now);
      const existing = counters.get(key);
      const next: Counter =
        !existing || existing.resetAt <= now
          ? { count: 1, resetAt: now + windowMs }
          : { count: existing.count + 1, resetAt: existing.resetAt };
      counters.set(key, next);
      trim();
      return {
        count: next.count,
        resetAt: next.resetAt,
        limited: next.count > maxRequests
      };
    }
  };
}

/*
 * Example Upstash implementation (uncomment and install deps when ready):
 *
 * import { Ratelimit } from '@upstash/ratelimit';
 * import { Redis } from '@upstash/redis';
 *
 * export function createUpstashRateLimiter(options: {
 *   windowMs: number;
 *   maxRequests: number;
 * }): RateLimiter {
 *   const redis = Redis.fromEnv();
 *   const limiter = new Ratelimit({
 *     redis,
 *     limiter: Ratelimit.slidingWindow(options.maxRequests, `${options.windowMs} ms`),
 *     prefix: 'efvn:ratelimit'
 *   });
 *
 *   return {
 *     async increment(key, now) {
 *       const result = await limiter.limit(key);
 *       return {
 *         count: options.maxRequests - result.remaining,
 *         resetAt: result.reset,
 *         limited: !result.success
 *       };
 *     }
 *   };
 * }
 */
