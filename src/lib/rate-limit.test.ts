import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/sentry-helpers", () => ({
  captureRateLimitHit: vi.fn(),
}));

import { consumeRateLimit } from "./rate-limit";

const config = {
  perMinute: 2,
  perDay: 10,
  bucket: "rate-limit-test",
};

afterEach(() => {
  vi.useRealTimers();
});

describe("consumeRateLimit", () => {
  it("allows the first request and reports the remaining limits", () => {
    const result = consumeRateLimit("first-request", config);

    expect(result).toEqual({
      allowed: true,
      remainingMinute: 1,
      remainingDay: 9,
      retryAfterSec: 0,
    });
  });

  it("denies the request after the per-minute burst is exhausted", () => {
    const key = "bursting-request";
    const first = consumeRateLimit(key, { ...config, perMinute: 3 });
    const second = consumeRateLimit(key, { ...config, perMinute: 3 });
    const third = consumeRateLimit(key, { ...config, perMinute: 3 });
    const fourth = consumeRateLimit(key, { ...config, perMinute: 3 });

    expect([first.allowed, second.allowed, third.allowed]).toEqual([true, true, true]);
    expect(fourth.allowed).toBe(false);
    expect(fourth.remainingMinute).toBe(0);
    expect(fourth.retryAfterSec).toBeGreaterThan(0);
  });

  it("keeps distinct keys in separate buckets", () => {
    const firstKey = consumeRateLimit("key-a", { ...config, perMinute: 1 });
    const secondKey = consumeRateLimit("key-b", { ...config, perMinute: 1 });
    const firstKeyRetry = consumeRateLimit("key-a", { ...config, perMinute: 1 });

    expect(firstKey.allowed).toBe(true);
    expect(secondKey.allowed).toBe(true);
    expect(firstKeyRetry.allowed).toBe(false);
  });

  it("allows a request again after the minute window resets", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-03T10:00:00.000Z"));
    const windowConfig = { ...config, perMinute: 1 };

    expect(consumeRateLimit("retry-after-window", windowConfig).allowed).toBe(true);
    expect(consumeRateLimit("retry-after-window", windowConfig).allowed).toBe(false);

    vi.advanceTimersByTime(60_000);

    const retry = consumeRateLimit("retry-after-window", windowConfig);
    expect(retry.allowed).toBe(true);
    expect(retry.remainingMinute).toBe(0);
  });
});
