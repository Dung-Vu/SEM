// /api/cron/anki-reminder
//
// Vercel Cron schedule: "0 1 * * *"  (01:00 UTC ≈ 08:00 Asia/Ho_Chi_Minh)
// Triggers: src/lib/notifications/anki-reminder.ts → checkAndSendAnkiReminder
//
// Auth: Bearer ${CRON_SECRET}  (or ?secret= / x-cron-secret)

import { NextRequest, NextResponse } from "next/server";
import { assertInternalRequest } from "@/lib/server-security";
import { runAnkiReminderCron } from "@/lib/notifications/cron-runner";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const unauthorized = assertInternalRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await runAnkiReminderCron();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("GET /api/cron/anki-reminder:", error);
    return NextResponse.json(
      { error: "Failed to run anki reminder cron" },
      { status: 500 }
    );
  }
}
