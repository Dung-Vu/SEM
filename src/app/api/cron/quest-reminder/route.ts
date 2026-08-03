// /api/cron/quest-reminder
// Trigger schedule: daily at 13:00 UTC (20:00 Asia/Ho_Chi_Minh).
// Idempotency: notification log cooldown and daily per-user send limits suppress duplicates.
// Expected runtime: <60 seconds for the current single-user deployment.

import { NextRequest, NextResponse } from "next/server";
import { assertInternalRequest } from "@/lib/server-security";
import { runQuestReminderCron } from "@/lib/notifications/cron-runner";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const unauthorized = assertInternalRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await runQuestReminderCron();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("GET /api/cron/quest-reminder:", error);
    return NextResponse.json(
      { error: "Failed to run quest reminder cron" },
      { status: 500 }
    );
  }
}
