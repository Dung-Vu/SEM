// server-side web-push helper — Phase 12.5
// Only call this from API routes (server-side only)
import webPush from "web-push";
import { prisma } from "@/lib/prisma";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:admin@bonstu.site";

// Only configure VAPID details when both keys are present. `sendPushToSubscription`
// guards on this and returns a clear error if push is not configured, instead of
// crashing at module load time.
let vapidConfigured = false;
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webPush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
  vapidConfigured = true;
}

export function isPushConfigured(): boolean {
  return vapidConfigured;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  type?: string;          // Phase 18
  image?: string;         // Phase 18
  vibrate?: number[];     // Phase 18
  data?: Record<string, string | number | boolean | null>; // Phase 18 custom data payload
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
  if (!vapidConfigured) {
    console.warn("Push not configured: set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY");
    return false;
  }
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

// ─── Sprint 2: NotificationSetting pre-flight guard ──────────────────────

/**
 * The set of notification kinds the guard understands. The strings are the
 * canonical "kind" identifiers used by callers; they map 1:1 onto the boolean
 * toggles on the `NotificationSetting` Prisma model.
 */
export type NotificationKind =
  | "streakWarning"
  | "ankiReminder"
  | "questReminder"
  | "levelUp"
  | "weeklyReport"
  | "aiInsight"
  | "dailyReminder"
  | "bossAvailable";

const SETTINGS_TTL_MS = 60_000; // ≤60s per user (spec)

interface CachedSettings {
  expiresAt: number;
  // Field-by-field cache so quiet-hours `now` can change without a refresh.
  settings:
    | null
    | {
        perKindEnabled: Record<NotificationKind, boolean>;
        quietHoursStart: number;
        quietHoursEnd: number;
      };
}

const settingsCache = new Map<string, CachedSettings>();

// LRU-ish eviction — cap the cache so a chatty test or scrape cannot blow it
// up. We delete the oldest-inserted entry; the new entry is re-inserted below.
const SETTINGS_CACHE_CAP = 5_000;
function rememberSettings(userId: string, entry: CachedSettings) {
  if (!settingsCache.has(userId) && settingsCache.size >= SETTINGS_CACHE_CAP) {
    const oldest = settingsCache.keys().next().value;
    if (oldest) settingsCache.delete(oldest);
  }
  settingsCache.set(userId, entry);
}

function withinQuietHours(now: Date, start: number, end: number): boolean {
  if (start === end) return false; // 0-length window → never quiet
  const hour = now.getHours();
  if (start > end) {
    // wraps midnight (e.g. 23 → 7)
    return hour >= start || hour < end;
  }
  return hour >= start && hour < end;
}

/** Forget the cached settings for a user (useful for tests / settings endpoints). */
export function invalidateNotificationSettings(userId: string): void {
  settingsCache.delete(userId);
}

/**
 * Pre-flight check: does this user want to receive a push of the given kind
 * right now? Combines:
 *   - per-kind toggle on `NotificationSetting`
 *   - quiet-hours window from the same row
 *
 * The result is cached for ≤60s per user to keep DB traffic low on hot push
 * endpoints. Callers should run this BEFORE `consumeRateLimit()` so users who
 * have disabled notifications do not burn rate-limit quota.
 *
 * Returns `true` (safe to send) when no settings row exists yet — that matches
 * the schema defaults, which have every per-kind flag = true on creation.
 */
export async function shouldSendNotification(
  userId: string,
  kind: NotificationKind
): Promise<boolean> {
  const cached = settingsCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.settings
      ? cached.settings.perKindEnabled[kind] &&
          !withinQuietHours(
            new Date(),
            cached.settings.quietHoursStart,
            cached.settings.quietHoursEnd
          )
      : true;
  }

  let row: Awaited<ReturnType<typeof prisma.notificationSetting.findUnique>> = null;
  try {
    row = await prisma.notificationSetting.findUnique({ where: { userId } });
  } catch (err) {
    console.warn(`[push] failed to load NotificationSetting for ${userId}:`, err);
    // Cache a permissive negative result briefly to avoid hot-loop DB hits if
    // the DB is having a bad day.
    rememberSettings(userId, {
      expiresAt: Date.now() + 10_000,
      settings: null,
    });
    return true;
  }

  if (!row) {
    // No settings row → user has not configured; treat as fully opted in.
    rememberSettings(userId, {
      expiresAt: Date.now() + SETTINGS_TTL_MS,
      settings: null,
    });
    return true;
  }

  const perKindEnabled: Record<NotificationKind, boolean> = {
    streakWarning: row.streakWarning,
    ankiReminder: row.ankiReminder,
    questReminder: row.questReminder,
    levelUp: row.levelUp,
    weeklyReport: row.weeklyReport,
    aiInsight: row.aiInsight,
    dailyReminder: true, // no dedicated toggle yet → default on
    bossAvailable: true, // no dedicated toggle yet → default on
  };

  rememberSettings(userId, {
    expiresAt: Date.now() + SETTINGS_TTL_MS,
    settings: {
      perKindEnabled,
      quietHoursStart: row.quietHoursStart,
      quietHoursEnd: row.quietHoursEnd,
    },
  });

  return (
    perKindEnabled[kind] &&
    !withinQuietHours(new Date(), row.quietHoursStart, row.quietHoursEnd)
  );
}
