import { NextResponse } from "next/server";

/**
 * Assert that a request is authorized as an internal/cron caller.
 *
 * The shared secret is read from (in order): `INTERNAL_API_SECRET`, `CRON_SECRET`.
 *
 * Accepted credential transports:
 *  - `Authorization: Bearer <secret>`
 *  - `x-internal-secret: <secret>` or `x-cron-secret: <secret>` headers
 *  - `?secret=<secret>` query parameter (used by Vercel Cron and ad-hoc curls)
 *
 * Returns a `NextResponse` to short-circuit with when the request is not allowed,
 * or `null` when the caller has supplied a valid credential.
 */
export function assertInternalRequest(
  request: { headers: Headers; url?: string } | Request
): NextResponse | null {
  const secret = process.env.INTERNAL_API_SECRET || process.env.CRON_SECRET;
  if (!secret) {
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
  if (supplied !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
