// /api/cron/ai-insight
// Trigger schedule: Wednesday at 02:00 UTC (09:00 Asia/Ho_Chi_Minh).
// Idempotency: notification log cooldown and daily per-user send limits suppress duplicates.
// Expected runtime: <120 seconds for the current single-user deployment.

import { NextRequest, NextResponse } from "next/server";
import { assertInternalRequest } from "@/lib/server-security";
import { runAiInsightCron } from "@/lib/notifications/cron-runner";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const unauthorized = assertInternalRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await runAiInsightCron();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("GET /api/cron/ai-insight:", error);
    return NextResponse.json(
      { error: "Failed to run AI insight cron" },
      { status: 500 }
    );
  }
}
