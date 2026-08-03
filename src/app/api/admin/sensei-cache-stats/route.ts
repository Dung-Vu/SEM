// GET /api/admin/sensei-cache-stats — observability for the SENSEI prompt cache.
//
// Sprint 2: returns hit / miss / error counters and the current cache size.
// Auth: requires `INTERNAL_API_SECRET` (or `CRON_SECRET`) via
// `assertInternalRequest`. Accepted transports: Authorization Bearer,
// x-internal-secret / x-cron-secret headers, or ?secret= query.

import { NextRequest, NextResponse } from "next/server";
import { assertInternalRequest } from "@/lib/server-security";
import { getSenseiCacheStats } from "@/lib/sensei-prompt";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const unauthorized = assertInternalRequest(request);
  if (unauthorized) return unauthorized;

  const stats = getSenseiCacheStats();
  return NextResponse.json({
    hits: stats.hits,
    misses: stats.misses,
    errors: stats.errors,
    size: stats.size,
  });
}
