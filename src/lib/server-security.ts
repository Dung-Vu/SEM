import { NextResponse } from "next/server";

/**
 * Assert that a request is authorized as an internal/cron caller.
 *
 * Accepts EITHER `INTERNAL_API_SECRET` OR `CRON_SECRET` — both are checked
 * independently so cron handlers and admin handlers can use distinct secrets.
 *
 * Accepted credential transports:
 *  - `Authorization: Bearer <secret>`
 *  - `x-internal-secret: <secret>` or `x-cron-secret: <secret>` headers
 *  - `?secret=<secret>` query parameter (used by Vercel Cron and ad-hoc curls)
 *
 * Returns a `NextResponse` to short-circuit with when the request is not allowed,
 * or `null` when the caller has supplied a valid credential.
 *
 * Status codes:
 *  - 503 when neither secret env var is configured (security-positive refusal).
 *  - 401 when a secret IS configured but the supplied credential doesn't match.
 */
export function assertInternalRequest(
  request: { headers: Headers; url?: string } | Request
): NextResponse | null {
  const internalSecret = process.env.INTERNAL_API_SECRET;
  const cronSecret = process.env.CRON_SECRET;
  const allowedSecrets = [internalSecret, cronSecret].filter(
    (s): s is string => typeof s === "string" && s.length > 0
  );

  if (allowedSecrets.length === 0) {
    return NextResponse.json(
      { error: "Internal API secret is not configured" },
      { status: 503 }
    );
  }

  const headers = request.headers;

  // 1. Authorization: Bearer <secret>
  const authHeader = headers.get("authorization");
  let bearer: string | null = null;
  if (authHeader && /^Bearer\s+\S+/i.test(authHeader)) {
    bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
  }

  // 2. x-internal-secret / x-cron-secret
  const headerSecret =
    headers.get("x-internal-secret") || headers.get("x-cron-secret");

  // 3. ?secret=... query param
  let querySecret: string | null = null;
  if (request.url) {
    try {
      const u = new URL(request.url);
      const s = u.searchParams.get("secret");
      if (s) querySecret = s;
    } catch {
      // ignore — request.url may be relative or malformed; headers already checked
    }
  }

  const supplied = bearer || headerSecret || querySecret;
  if (!supplied || !allowedSecrets.includes(supplied)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
