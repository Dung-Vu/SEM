// /api/cron/weekly-report
// Trigger schedule: Monday at 01:00 UTC (08:00 Asia/Ho_Chi_Minh).
// Idempotency: the per-user/week/year report unique key and notification cooldown suppress duplicates.
// Expected runtime: <120 seconds for the current single-user deployment.

import { NextRequest, NextResponse } from "next/server";
import { assertInternalRequest } from "@/lib/server-security";
import { runWeeklyReportCron } from "@/lib/notifications/cron-runner";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const unauthorized = assertInternalRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await runWeeklyReportCron();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("GET /api/cron/weekly-report:", error);
    return NextResponse.json(
      { error: "Failed to run weekly report cron" },
      { status: 500 }
    );
  }
}
