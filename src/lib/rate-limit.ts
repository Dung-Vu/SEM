/**
 * In-memory token bucket rate limiter for AI endpoints.
 *
 * Purpose: protect the upstream AI provider (and our wallet) from a single
 * caller (real user, buggy client, or attacker) driving the cost of an
 * entire deployment into the stratosphere. See audit C4 / C6.
 *
 * Design:
 *  - Per-key (per-userId, per-route) bucket.
 *  - Two windows: per-minute (burst) and per-day (budget).
 *  - Fail-open on extremely large maps (we cap at 10k keys with LRU eviction).
 *
 * Caveats:
 *  - This is per-process. On a multi-instance deploy, each replica has its own
 *    bucket. That is acceptable here because the limits are conservative and
 *    the bootstrap cost of a misconfiguration is low (we'd merely serve a few
 *    extra requests, not run away).
 *  - Vercel Edge runtime does not support module-level state across requests
 *    the same way; this helper is intended for "nodejs" runtime routes.
 */
import { captureRateLimitHit } from "@/lib/sentry-helpers";

const MAX_KEYS = 10_000;

interface Bucket {
  minute: number;
  minuteResetAt: number;
  day: number;
  dayResetAt: number;
}

const buckets = new Map<string, Bucket>();

function nowMs(): number {
  return Date.now();
}

function evictIfFull(): void {
  if (buckets.size <= MAX_KEYS) return;
  // Drop the oldest-inserted ~10% of keys. Maps iterate in insertion order.
  const toRemove = Math.ceil(MAX_KEYS * 0.1);
  let removed = 0;
  for (const key of buckets.keys()) {
    buckets.delete(key);
    if (++removed >= toRemove) break;
  }
}

export interface RateLimitConfig {
  /** Maximum requests per minute. */
  perMinute: number;
  /** Maximum requests per day. */
  perDay: number;
  /** Identifier for the bucket (e.g. "ai-chat-stream"). */
  bucket: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingMinute: number;
  remainingDay: number;
  retryAfterSec: number;
}

/**
 * Reserve one slot in the named bucket for `key`. Returns `allowed: false`
 * with a retry hint if either the per-minute or per-day window is exhausted.
 */
export function consumeRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const minuteWindow = 60_000;
  const dayWindow = 24 * 60 * 60_000;
  const composite = `${config.bucket}:${key}`;
  const t = nowMs();

  let bucket = buckets.get(composite);
  if (!bucket) {
    bucket = { minute: 0, minuteResetAt: t + minuteWindow, day: 0, dayResetAt: t + dayWindow };
    buckets.set(composite, bucket);
    evictIfFull();
  }

  if (t >= bucket.minuteResetAt) {
    bucket.minute = 0;
    bucket.minuteResetAt = t + minuteWindow;
  }
  if (t >= bucket.dayResetAt) {
    bucket.day = 0;
    bucket.dayResetAt = t + dayWindow;
  }

  if (bucket.minute >= config.perMinute) {
    captureRateLimitHit(config.bucket, key, `${config.bucket}:minute`);
    return {
      allowed: false,
      remainingMinute: 0,
      remainingDay: Math.max(0, config.perDay - bucket.day),
      retryAfterSec: Math.max(1, Math.ceil((bucket.minuteResetAt - t) / 1000)),
    };
  }
  if (bucket.day >= config.perDay) {
    captureRateLimitHit(config.bucket, key, `${config.bucket}:day`);
    return {
      allowed: false,
      remainingMinute: Math.max(0, config.perMinute - bucket.minute),
      remainingDay: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.dayResetAt - t) / 1000)),
    };
  }

  bucket.minute += 1;
  bucket.day += 1;

  return {
    allowed: true,
    remainingMinute: Math.max(0, config.perMinute - bucket.minute),
    remainingDay: Math.max(0, config.perDay - bucket.day),
    retryAfterSec: 0,
  };
}

/**
 * Convenience: extract a per-user rate-limit key from a request.
 * Falls back to the caller's IP if no user is identified.
 */
export function rateLimitKeyFromRequest(request: Request, userId: string | null): string {
  if (userId) return `u:${userId}`;
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return `ip:${fwd.split(",")[0]?.trim() ?? "unknown"}`;
  return `ip:${request.headers.get("x-real-ip") ?? "unknown"}`;
}
