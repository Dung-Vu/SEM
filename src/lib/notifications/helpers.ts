import { prisma } from "@/lib/prisma";
import type { NotificationType } from "./types";

export async function getNotifSettings(userId: string) {
  let settings = await prisma.notificationSetting.findUnique({ where: { userId } });
  if (!settings) {
    settings = await prisma.notificationSetting.create({ data: { userId } });
  }
  return settings;
}

export function isQuietHours(
  hour: number,
  settings: { quietHoursStart: number; quietHoursEnd: number }
): boolean {
  if (settings.quietHoursStart > settings.quietHoursEnd) {
    // e.g. 23:00 to 07:00
    return hour >= settings.quietHoursStart || hour < settings.quietHoursEnd;
  }
  // e.g. 01:00 to 05:00
  return hour >= settings.quietHoursStart && hour < settings.quietHoursEnd;
}

export async function getNotifCountToday(userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return prisma.notificationLog.count({
    where: {
      userId,
      sentAt: { gte: startOfDay },
    },
  });
}

export async function getLastNotifTime(
  userId: string,
  type: NotificationType
): Promise<Date | null> {
  const log = await prisma.notificationLog.findFirst({
    where: { userId, type },
    orderBy: { sentAt: "desc" },
    select: { sentAt: true },
  });
  return log?.sentAt || null;
}

export async function wasNotifSentToday(
  userId: string,
  type: NotificationType
): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = await prisma.notificationLog.count({
    where: {
      userId,
      type,
      sentAt: { gte: startOfDay },
    },
  });
  return count > 0;
}

export async function logNotification(
  userId: string,
  type: NotificationType,
  content: { title: string; body: string }
) {
  await prisma.notificationLog.create({
    data: {
      userId,
      type,
      title: content.title,
      body: content.body,
    },
  });
}

// ─── Context-Aware Checks ──────────────────────────────────────────────

export async function hasReviewedAnkiToday(userId: string): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const count = await prisma.reviewLog.count({
    where: { userId, reviewedAt: { gte: startOfDay } },
  });
  return count > 0;
}

export async function hasCheckedInToday(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastCheckIn: true },
  });
  if (!user?.lastCheckIn) return false;
  
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return user.lastCheckIn >= startOfDay;
}

export async function hasCompletedAllQuests(userId: string): Promise<boolean> {
  const dateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  
  // Total daily quests available (we assume 3 main daily quests typically, or query DailyQuestTemplate)
  const templates = await prisma.dailyQuestTemplate.count({
    where: { type: "main" }
  });
  
  const completed = await prisma.questProgress.count({
    where: { userId, date: dateStr, completed: true }
  });
  
  return completed >= templates && templates > 0;
}
