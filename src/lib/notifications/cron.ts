// src/lib/notifications/cron.ts
// Phase 18: HERALD — Scheduled Notification Jobs
// Runs inside the Next.js server process using node-cron
// Timezone: Asia/Ho_Chi_Minh (UTC+7)

import cron from "node-cron";
import { prisma } from "@/lib/prisma";
import { checkAndSendStreakWarning } from "./streak-warning";
import { checkAndSendAnkiReminder } from "./anki-reminder";
import { checkAndSendQuestReminder } from "./quest-reminder";
import { checkAndSendWeeklyReport } from "./weekly-report-notif";
import { checkAndSendInsightAlert } from "./ai-insight";

let initialized = false;

export function initNotificationCron() {
  // Guard: only run once (Next.js can call this more than once in dev)
  if (initialized) return;
  initialized = true;

  console.log("[HERALD] Initializing notification cron jobs...");

  // Helper: get all users that have at least one push subscription
  async function getActiveUsers(): Promise<{ id: string }[]> {
    return prisma.user.findMany({
      where: {
        PushSubscription: { some: {} },
      },
      select: { id: true },
    });
  }

  // Helper: run a notification check for all active users
  async function runForAllUsers(
    label: string,
    fn: (userId: string) => Promise<void>
  ) {
    const users = await getActiveUsers();
    console.log(`[HERALD] Running '${label}' for ${users.length} user(s)`);
    await Promise.allSettled(users.map((u) => fn(u.id)));
  }

  // ── 08:00 every day — Anki Reminder ────────────────────────
  cron.schedule(
    "0 8 * * *",
    () => runForAllUsers("anki_reminder", checkAndSendAnkiReminder),
    { timezone: "Asia/Ho_Chi_Minh" }
  );

  // ── 20:00 every day — Quest Reminder ───────────────────────
  cron.schedule(
    "0 20 * * *",
    () => runForAllUsers("quest_reminder", checkAndSendQuestReminder),
    { timezone: "Asia/Ho_Chi_Minh" }
  );

  // ── 21:00 every day — Streak Warning ───────────────────────
  cron.schedule(
    "0 21 * * *",
    () => runForAllUsers("streak_warning", checkAndSendStreakWarning),
    { timezone: "Asia/Ho_Chi_Minh" }
  );

  // ── 08:00 every Monday — Weekly Report ─────────────────────
  cron.schedule(
    "0 8 * * 1",
    () => runForAllUsers("weekly_report", checkAndSendWeeklyReport),
    { timezone: "Asia/Ho_Chi_Minh" }
  );

  // ── 09:00 every Wednesday — AI Insight ─────────────────────
  cron.schedule(
    "0 9 * * 3",
    () => runForAllUsers("ai_insight", checkAndSendInsightAlert),
    { timezone: "Asia/Ho_Chi_Minh" }
  );

  console.log("[HERALD] Cron jobs registered ✅");
}
