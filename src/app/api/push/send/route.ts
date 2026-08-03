import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import {
  sendPushToSubscription,
  shouldSendNotification,
  type NotificationKind,
  type PushPayload,
} from "@/lib/push";
import { assertInternalRequest } from "@/lib/server-security";
import { consumeRateLimit, rateLimitKeyFromRequest } from "@/lib/rate-limit";
import { createHash } from "crypto";

const MAX_FIELD_LENGTH = 200;

// Per-device push throttle. One quota per push endpoint (not per user) so a
// user with several devices can't all hammer us at once, and a noisy endpoint
// can be singled out without blocking sibling devices. Limits are intentionally
// conservative — push notifications should feel rare.
const PER_DEVICE_PUSH_LIMIT = {
  bucket: "push-per-device",
  perMinute: 3,
  perDay: 30,
} as const;

function endpointKey(endpoint: string): string {
  // Endpoints are long opaque URLs; hash so the bucket key is bounded.
  return createHash("sha256").update(endpoint).digest("hex").slice(0, 32);
}

/**
 * Filter a subscription list through the per-device (per-endpoint) push
 * throttle. Returns the subscriptions that still have quota, plus the IDs of
 * any that were throttled so the caller can report a `deviceThrottled` count.
 *
 * Note: this consumes one slot per endpoint whether or not the push is
 * eventually sent, matching the spec "per device, not per user".
 */
function applyPerDeviceThrottle<
  T extends { id: string; endpoint: string }
>(subs: T[]): { allowed: T[]; throttled: string[] } {
  const allowed: T[] = [];
  const throttled: string[] = [];
  for (const sub of subs) {
    const rl = consumeRateLimit(endpointKey(sub.endpoint), PER_DEVICE_PUSH_LIMIT);
    if (rl.allowed) allowed.push(sub);
    else throttled.push(sub.id);
  }
  return { allowed, throttled };
}

function sanitizePayload(payload: PushPayload): PushPayload | null {
  if (!payload || typeof payload !== "object") return null;
  if (typeof payload.title !== "string" || payload.title.length === 0 || payload.title.length > MAX_FIELD_LENGTH) return null;
  if (typeof payload.body !== "string" || payload.body.length === 0 || payload.body.length > MAX_FIELD_LENGTH) return null;
  const url = payload.url === undefined ? undefined : (typeof payload.url === "string" && payload.url.length <= MAX_FIELD_LENGTH ? payload.url : null);
  const tag = payload.tag === undefined ? undefined : (typeof payload.tag === "string" && payload.tag.length <= MAX_FIELD_LENGTH ? payload.tag : null);
  if (url === null || tag === null) return null;
  return { title: payload.title, body: payload.body, url, tag };
}

// Map the {type,name} pair used internally by /api/push/send onto the canonical
// NotificationKind used by the per-user settings toggle. Falls back to
// "dailyReminder" so existing payloads that don't pick a specific kind are
// still gated by the user-level default-on behaviour.
const TAG_TO_KIND: Record<string, NotificationKind> = {
  "daily-reminder": "dailyReminder",
  "streak-alert": "streakWarning",
  "boss-alert": "bossAvailable",
  "weakness-alert": "aiInsight",
  "strength-highlight": "aiInsight",
  "weekly-report": "weeklyReport",
  "neglect-alert": "questReminder",
};

function kindForPayload(payload: PushPayload, fallback: NotificationKind): NotificationKind {
  if (payload.tag && TAG_TO_KIND[payload.tag]) return TAG_TO_KIND[payload.tag];
  if (payload.type && (TAG_TO_KIND[payload.type] || payload.type in TAG_TO_KIND)) {
    return (TAG_TO_KIND[payload.type] ?? fallback) as NotificationKind;
  }
  return fallback;
}

// POST /api/push/send — send push notification to all user subscriptions
// Body: { title, body, url, tag }
// Used internally by cron/reminder logic
export async function POST(req: NextRequest) {
  try {
    const unauthorized = assertInternalRequest(req);
    if (unauthorized) return unauthorized;

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const payload: PushPayload = await req.json();
    const safe = sanitizePayload(payload);
    if (!safe) {
      return NextResponse.json({ error: "title and body required" }, { status: 400 });
    }

    // Sprint 2: skip push if the target user has disabled this kind or is in
    // quiet hours. Runs BEFORE rate-limit so disabled users don't burn quota.
    const kind = kindForPayload(safe, "dailyReminder");
    const allowed = await shouldSendNotification(user.id, kind);
    if (!allowed) {
      return NextResponse.json({
        sent: 0,
        skipped: true,
        reason: `notifications disabled or quiet hours (kind=${kind})`,
      });
    }

    const rl = consumeRateLimit(rateLimitKeyFromRequest(req, user.id), {
      bucket: "push-send",
      perMinute: 10,
      perDay: 100,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfterSec: rl.retryAfterSec },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    // Get all subscriptions for this user
    const subs = await prisma.pushSubscription.findMany({
      where: { userId: user.id },
      select: { id: true, endpoint: true, p256dh: true, auth: true },
    });

    if (subs.length === 0) {
      return NextResponse.json({ sent: 0, message: "No subscriptions found" });
    }

    // Apply per-device throttle (one quota per endpoint, not per user). Runs
    // AFTER the global push-send rate-limit so the global limit is the first
    // gate, but BEFORE we start hitting the upstream push provider.
    const { allowed: allowedSubs, throttled: throttledDeviceIds } =
      applyPerDeviceThrottle(subs);

    let sent = 0;
    const failed: string[] = [];

    for (const sub of allowedSubs) {
      const ok = await sendPushToSubscription(sub, safe);
      if (ok === true) sent++;
      else if (ok === "expired") failed.push(sub.id);
    }

    // Clean up only subscriptions confirmed expired by the push provider.
    if (failed.length > 0) {
      await prisma.pushSubscription.deleteMany({ where: { id: { in: failed } } });
    }

    return NextResponse.json({
      sent,
      failed: failed.length,
      deviceThrottled: throttledDeviceIds.length,
    });
  } catch (error) {
    console.error("POST /api/push/send:", error);
    return NextResponse.json({ error: "Failed to send push" }, { status: 500 });
  }
}

// GET /api/push/send?type=reminder — send daily reminder (call from cron or test)
export async function GET(req: NextRequest) {
  const unauthorized = assertInternalRequest(req);
  if (unauthorized) return unauthorized;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

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
  const kind = kindForPayload(payload, "dailyReminder");

  // Sprint 2: gated by user preferences. Runs before rate-limit so users who
  // opted out don't consume rate budget.
  const allowed = await shouldSendNotification(user.id, kind);
  if (!allowed) {
    return NextResponse.json({
      sent: 0,
      skipped: true,
      reason: `notifications disabled or quiet hours (kind=${kind})`,
    });
  }

  const rl = consumeRateLimit(rateLimitKeyFromRequest(req, user.id), {
    bucket: "push-send-get",
    perMinute: 5,
    perDay: 30,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: user.id },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  // Per-device throttle (one quota per endpoint, not per user). Runs after
  // the global get-bucket limit and before we hit the upstream push provider.
  const { allowed: allowedSubs, throttled: throttledDeviceIds } =
    applyPerDeviceThrottle(subs);

  let sent = 0;
  const expired: string[] = [];
  for (const sub of allowedSubs) {
    const result = await sendPushToSubscription(sub, payload);
    if (result === true) sent++;
    if (result === "expired") expired.push(sub.id);
  }
  if (expired.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: expired } } });
  }
  return NextResponse.json({
    sent,
    failed: expired.length,
    deviceThrottled: throttledDeviceIds.length,
  });
}
