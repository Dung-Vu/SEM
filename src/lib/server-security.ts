import { NextResponse } from "next/server";

export function assertInternalRequest(request: { headers: Headers }): NextResponse | null {
  const secret = process.env.INTERNAL_API_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Internal API secret is not configured" }, { status: 503 });
  }

  const headerSecret = request.headers.get("x-internal-secret") || request.headers.get("x-cron-secret");
  if (headerSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
