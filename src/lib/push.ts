// server-side web-push helper — Phase 12.5
// Only call this from API routes (server-side only)
import webPush from "web-push";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY!;
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:admin@bonstu.site";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webPush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

/** Returns true on success, false on failure, "expired" when browser has unsubscribed (410 Gone) */
export async function sendPushToSubscription(
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  payload: PushPayload
): Promise<boolean | "expired"> {
  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (err: unknown) {
    // 410 Gone = browser has unsubscribed — signal caller to cleanup
    if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 410) {
      return "expired";
    }
    console.error("Push send failed:", err);
    return false;
  }
}

/** Send to multiple subscriptions; auto-removes expired (410) endpoints from DB */
export async function sendPushToSubscriptions(
  subscriptions: { id: string; endpoint: string; p256dh: string; auth: string }[],
  payload: PushPayload,
  onExpired?: (id: string) => Promise<void>
): Promise<void> {
  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const result = await sendPushToSubscription(sub, payload);
      if (result === "expired" && onExpired) {
        await onExpired(sub.id);
      }
    })
  );
}

