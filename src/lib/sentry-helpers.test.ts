// Verifies the Sentry helper contract: when Sentry is not initialised
// (no DSN), every helper is a no-op. This is the safety guarantee the
// SEM build relies on for the "DSN-empty = no overhead" behaviour.
//
// Run with: `npx tsx --test src/lib/sentry-helpers.test.ts`
//
// The existing `npm test` script only globs `tests/**/*.test.ts`; this
// file is intentionally placed under `src/lib/` so it lives next to the
// module it tests and can be picked up by future Vitest / Node test
// runners without depending on the legacy glob.

import test from "node:test";
import assert from "node:assert/strict";

import {
  captureAiError,
  capturePushFailure,
  captureRateLimitHit,
  startAiSpan,
} from "./sentry-helpers";

// Sanity check: SDK should be importable even without a DSN. The
// tree-shake test happens at build time; at runtime the helpers detect
// "no client" via `Sentry.getClient()` and short-circuit.
test("helpers are importable when Sentry is not configured", () => {
  assert.equal(typeof captureAiError, "function");
  assert.equal(typeof captureRateLimitHit, "function");
  assert.equal(typeof capturePushFailure, "function");
  assert.equal(typeof startAiSpan, "function");
});

test("captureAiError is a no-op when Sentry is not initialised", () => {
  assert.doesNotThrow(() => {
    captureAiError("test", new Error("boom"), { foo: "bar" });
  });
});

test("captureRateLimitHit is a no-op when Sentry is not initialised", () => {
  assert.doesNotThrow(() => {
    captureRateLimitHit("/api/ai/chat", "u:user-1", "ai-chat");
  });
});

test("capturePushFailure is a no-op when Sentry is not initialised", () => {
  assert.doesNotThrow(() => {
    capturePushFailure(
      "https://fcm.googleapis.com/fcm/send/abc",
      "web-push returned false",
      500
    );
  });
  // And the malformed-endpoint path should not throw either.
  assert.doesNotThrow(() => {
    capturePushFailure("not a url", "boom");
  });
});

test("startAiSpan returns null when Sentry is not initialised", () => {
  const span = startAiSpan("ai.test.span", { "ai.route": "/api/ai/chat" });
  assert.equal(span, null);
});
