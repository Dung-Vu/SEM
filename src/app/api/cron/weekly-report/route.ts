// /api/cron/weekly-report
//
// Vercel Cron schedule: "0 1 * * 1" (01:00 UTC Monday ≈ 08:00 ICT Monday)
// Triggers: src/lib/notifications/weekly-report-notif.ts → checkAndSendWeeklyReport
// (also generates the weekly report row via generateWeeklyReport()).
//
// Auth: Bearer ${CRON_SECRET}  (or ?secret= / x-cron-secret)

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
