// /api/cron/ai-insight
//
// Vercel Cron schedule: "0 2 * * 3" (02:00 UTC Wednesday ≈ 09:00 ICT Wednesday)
// Triggers: src/lib/notifications/ai-insight.ts → checkAndSendInsightAlert
//
// Auth: Bearer ${CRON_SECRET}  (or ?secret= / x-cron-secret)

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
