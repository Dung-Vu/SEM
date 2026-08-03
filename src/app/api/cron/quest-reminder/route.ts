// /api/cron/quest-reminder
//
// Vercel Cron schedule: "0 13 * * *" (13:00 UTC ≈ 20:00 Asia/Ho_Chi_Minh)
// Triggers: src/lib/notifications/quest-reminder.ts → checkAndSendQuestReminder
//
// Auth: Bearer ${CRON_SECRET}  (or ?secret= / x-cron-secret)

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
