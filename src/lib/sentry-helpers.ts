// Thin Sentry wrappers for the SEM project.
//
// Why this file exists:
//   `@sentry/nextjs` is tree-shakeable. When no DSN is set, none of the SDK
//   code is ever loaded at runtime, but we still want every callsite to feel
//   the same — a single function call regardless of whether telemetry is
//   actually configured.
//
// Contract:
//   Every export in this module is a no-op if Sentry has not been initialised
//   (i.e. DSN env vars are empty / the SDK never ran `init()`). The export
//   signatures are designed so callers can sprinkle the helpers in without
//   having to gate on env vars themselves.

import * as Sentry from "@sentry/nextjs";
import type { Span } from "@sentry/nextjs";

// ─── Init detection ───────────────────────────────────────────────────────
//
// `Sentry.getClient()` returns `undefined` when no client has been created,
// which is the case whenever the SDK never ran `init()`. We use that as the
// single source of truth for "is telemetry live?".
function isSentryLive(): boolean {
  try {
    return typeof Sentry.getClient === "function" && !!Sentry.getClient();
  } catch {
    return false;
  }
}

// ─── Error capture ────────────────────────────────────────────────────────

/**
 * Capture an AI-path error. Use this from the AI HTTP client, the AI guard,
 * insight generators, etc. Pass a stable `scope` string (e.g. "ai-call",
 * "ai-guard") so Sentry issues can be filtered by surface.
 */
export function captureAiError(
  scope: string,
  err: unknown,
  extra?: Record<string, unknown>
): void {
  if (!isSentryLive()) return;
  Sentry.withScope((sentryScope) => {
    sentryScope.setTag("ai.scope", scope);
    if (extra) sentryScope.setExtras(extra);
    Sentry.captureException(err);
  });
}

/**
 * Capture a rate-limit denial so we can spot abuse patterns in Sentry
 * without flooding it (we still log every denial via console — this is a
 * sampled signal). Called from `consumeRateLimit` once per denial.
 */
export function captureRateLimitHit(
  route: string,
  key: string,
  bucket: string
): void {
  if (!isSentryLive()) return;
  Sentry.withScope((sentryScope) => {
    sentryScope.setTag("ratelimit.bucket", bucket);
    sentryScope.setTag("ratelimit.route", route);
    // The key is per-user / per-IP and is already a hash on the push side; on
    // other routes it's a userId. Either way it's safe to surface.
    sentryScope.setExtra("ratelimit.key", key);
    // Use a message event (not captureException) so we don't pollute the
    // "errors" feed with expected denials.
    Sentry.captureMessage(`Rate limit hit: ${route} (${bucket})`, "warning");
  });
}

/**
 * Capture a web-push failure. The `endpoint` is the device's push endpoint
 * URL — which is opaque + reasonably safe to surface, but we still record
 * only the host so Sentry never sees a full subscription URL in issue data.
 */
export function capturePushFailure(
  endpoint: string,
  reason: string,
  status?: number
): void {
  if (!isSentryLive()) return;
  let host = "unknown";
  try {
    host = new URL(endpoint).host;
  } catch {
    /* not a URL — leave host as "unknown" */
  }
  Sentry.withScope((sentryScope) => {
    sentryScope.setTag("push.host", host);
    sentryScope.setExtra("push.reason", reason);
    if (typeof status === "number") sentryScope.setExtra("push.status", status);
    Sentry.captureMessage(`Push send failed: ${host} — ${reason}`, "error");
  });
}

// ─── Tracing ──────────────────────────────────────────────────────────────

/**
 * Start a non-recording-or-recording span by name. Returns the span (or a
 * non-recording span if the SDK is disabled / the trace is not sampled) so
 * callers can `span.end()` it. Returns `null` only when Sentry is not even
 * initialised — callers can then skip the entire span bookkeeping.
 */
export function startAiSpan(
  name: string,
  attrs?: Record<string, string>
): Span | null {
  if (!isSentryLive()) return null;
  const span = Sentry.startInactiveSpan({ name });
  if (!span) return null;
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      span.setAttribute(k, v);
    }
  }
  return span;
}
