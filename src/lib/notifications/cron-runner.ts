// Shared helpers used by /api/cron/* routes. The previous in-process node-cron
// scheduler has been split into per-kind handlers that Vercel Cron invokes as
// HTTP requests — see vercel.json for the schedule table.
//
// Each runner is idempotent at the user level so that Vercel Cron retries (or
// overlapping manual triggers) cannot double-send notifications.

import { prisma } from "@/lib/prisma";
import { checkAndSendAnkiReminder } from "./anki-reminder";
import { checkAndSendQuestReminder } from "./quest-reminder";
import { checkAndSendStreakWarning } from "./streak-warning";
import { checkAndSendWeeklyReport } from "./weekly-report-notif";
import { checkAndSendInsightAlert } from "./ai-insight";

type CronKind =
  | "anki_reminder"
  | "quest_reminder"
  | "streak_warning"
  | "weekly_report"
  | "ai_insight";

async function getActiveUsers(): Promise<{ id: string }[]> {
  return prisma.user.findMany({
    where: { PushSubscription: { some: {} } },
    select: { id: true },
  });
}

async function runForAllUsers(
  label: CronKind,
  fn: (userId: string) => Promise<void>
): Promise<{ users: number; failed: number }> {
  const users = await getActiveUsers();
  console.info(`[cron:${label}] running for ${users.length} active user(s)`);
  const results = await Promise.allSettled(users.map((u) => fn(u.id)));
  const failed = results.filter((r) => r.status === "rejected").length;
  console.info(`[cron:${label}] done — users=${users.length} failed=${failed}`);
  return { users: users.length, failed };
}

export interface CronResult {
  kind: CronKind;
  users: number;
  failed: number;
  durationMs: number;
}

async function timedRun(
  kind: CronKind,
  fn: (userId: string) => Promise<void>
): Promise<CronResult> {
  const started = Date.now();
  console.info(`[cron:${kind}] start`);
  try {
    const { users, failed } = await runForAllUsers(kind, fn);
    const durationMs = Date.now() - started;
    console.info(`[cron:${kind}] end durationMs=${durationMs}`);
    return { kind, users, failed, durationMs };
  } catch (err) {
    const durationMs = Date.now() - started;
    console.error(`[cron:${kind}] error after ${durationMs}ms`, err);
    throw err;
  }
}

export function runAnkiReminderCron() {
  return timedRun("anki_reminder", checkAndSendAnkiReminder);
}
export function runQuestReminderCron() {
  return timedRun("quest_reminder", checkAndSendQuestReminder);
}
export function runStreakWarningCron() {
  return timedRun("streak_warning", checkAndSendStreakWarning);
}
export function runWeeklyReportCron() {
  return timedRun("weekly_report", checkAndSendWeeklyReport);
}
export function runAiInsightCron() {
  return timedRun("ai_insight", checkAndSendInsightAlert);
}
