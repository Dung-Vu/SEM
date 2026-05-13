import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { sendPushToSubscription, type PushPayload } from "@/lib/push";
import { assertInternalRequest } from "@/lib/server-security";

// POST /api/push/send — send push notification to all user subscriptions
// Body: { title, body, url, tag }
// Used internally by cron/reminder logic
export async function POST(req: NextRequest) {
  try {
    const unauthorized = assertInternalRequest(req);
    if (unauthorized) return unauthorized;

    const payload: PushPayload = await req.json();

    if (!payload.title || !payload.body) {
      return NextResponse.json({ error: "title and body required" }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Get all subscriptions for this user
    const subs = await prisma.pushSubscription.findMany({
      where: { userId: user.id },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    });

    if (subs.length === 0) {
      return NextResponse.json({ sent: 0, message: "No subscriptions found" });
    }

    let sent = 0;
    const failed: string[] = [];

    for (const sub of subs) {
      const ok = await sendPushToSubscription(sub, payload);
      if (ok === true) sent++;
      else if (ok === "expired") failed.push(sub.id);
    }

    // Clean up only subscriptions confirmed expired by the push provider.
    if (failed.length > 0) {
      await prisma.pushSubscription.deleteMany({ where: { id: { in: failed } } });
    }

    return NextResponse.json({ sent, failed: failed.length });
  } catch (error) {
    console.error("POST /api/push/send:", error);
    return NextResponse.json({ error: "Failed to send push" }, { status: 500 });
  }
}

// GET /api/push/send?type=reminder — send daily reminder (call from cron or test)
export async function GET(req: NextRequest) {
  const unauthorized = assertInternalRequest(req);
  if (unauthorized) return unauthorized;

  const type = new URL(req.url).searchParams.get("type") || "reminder";

  const payloads: Record<string, PushPayload> = {
    reminder: {
      title: "English Quest",
      body: "Time to study! Keep your streak alive",
      url: "/anki",
      tag: "daily-reminder",
    },
    streak: {
      title: "Streak Alert!",
      body: "Your streak is at risk! Study now to keep it going.",
      url: "/",
      tag: "streak-alert",
    },
    boss: {
      title: "Weekly Boss Available!",
      body: "A new Weekly Challenge is ready. Accept the quest!",
      url: "/special-screens",
      tag: "boss-alert",
    },
    // Phase 14: Insight notifications
    weakness_alert: {
      title: "Speaking cần cải thiện",
      body: "Kiểm tra weakness analysis và luyện tập hôm nay?",
      url: "/analytics",
      tag: "weakness-alert",
    },
    strength_highlight: {
      title: "Vocab đang tăng mạnh!",
      body: "Duy trì đà này — xem tiến độ của bạn.",
      url: "/analytics",
      tag: "strength-highlight",
    },
    weekly_report: {
      title: "Báo cáo tuần của bạn",
      body: "Xem tiến độ học tập 7 ngày qua",
      url: "/analytics/weekly",
      tag: "weekly-report",
    },
    neglect_alert: {
      title: "Lâu rồi chưa viết Journal",
      body: "Writing score đang giảm dần. Viết vài dòng hôm nay nhé!",
      url: "/journal",
      tag: "neglect-alert",
    },
  };

  const payload = payloads[type] ?? payloads.reminder;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const subs = await prisma.pushSubscription.findMany({
    where: { userId: user.id },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
  let sent = 0;
  const expired: string[] = [];
  for (const sub of subs) {
    const result = await sendPushToSubscription(sub, payload);
    if (result === true) sent++;
    if (result === "expired") expired.push(sub.id);
  }
  if (expired.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: expired } } });
  }
  return NextResponse.json({ sent, failed: expired.length });
}
