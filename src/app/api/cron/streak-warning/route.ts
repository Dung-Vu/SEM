// /api/cron/streak-warning
//
// Vercel Cron schedule: "0 14 * * *" (14:00 UTC ≈ 21:00 Asia/Ho_Chi_Minh)
// Triggers: src/lib/notifications/streak-warning.ts → checkAndSendStreakWarning
//
// Auth: Bearer ${CRON_SECRET}  (or ?secret= / x-cron-secret)

import { NextRequest, NextResponse } from "next/server";
import { assertInternalRequest } from "@/lib/server-security";
import { runStreakWarningCron } from "@/lib/notifications/cron-runner";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const unauthorized = assertInternalRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await runStreakWarningCron();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("GET /api/cron/streak-warning:", error);
    return NextResponse.json(
      { error: "Failed to run streak warning cron" },
      { status: 500 }
    );
  }
}
