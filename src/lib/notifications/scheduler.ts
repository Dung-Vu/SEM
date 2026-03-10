import type { NotificationType } from "./types";
import {
  getNotifSettings,
  isQuietHours,
  getNotifCountToday,
  getLastNotifTime,
  hasReviewedAnkiToday,
  hasCheckedInToday,
  hasCompletedAllQuests,
} from "./helpers";

export async function shouldSendNotification(
  userId: string,
  type: NotificationType
): Promise<boolean> {
  const settings = await getNotifSettings(userId);
  const now = new Date();
  const hour = now.getHours();

  // 1. Quiet hours check
  if (isQuietHours(hour, settings)) {
    return false;
  }

  // 2. Max per day check
  const todayCount = await getNotifCountToday(userId);
  if (todayCount >= settings.maxPerDay) {
    return false;
  }

  // 3. Duplicate / Cooldown check
  const cooldowns: Record<NotificationType, number> = {
    streak_warning: 24 * 60, // 1 lần/ngày
    streak_milestone: 24 * 60,
    anki_reminder: 24 * 60, // 1 lần/ngày
    anki_overdue: 24 * 60,
    quest_reminder: 24 * 60, // 1 lần/ngày
    quest_almost_done: 24 * 60,
    level_up: 0, // Gửi ngay, không cooldown
    weekly_report: 7 * 24 * 60, // 1 lần/tuần
    ai_insight: 7 * 24 * 60, // 1 lần/tuần
    personal_best: 24 * 60, // 1 lần/ngày
    milestone_unlocked: 60, // 1 lần/giờ
  };

  const lastSent = await getLastNotifTime(userId, type);
  const cooldown = cooldowns[type];
  if (lastSent && cooldown > 0) {
    const minutesSince = (Date.now() - lastSent.getTime()) / 60_000;
    if (minutesSince < cooldown) return false;
  }

  // 4. Skip if already done (context-aware)
  if (settings.skipIfAlreadyDone) {
    if (type === "anki_reminder" && await hasReviewedAnkiToday(userId)) return false;
    if (type === "quest_reminder" && await hasCompletedAllQuests(userId)) return false;
    if (type === "streak_warning" && await hasCheckedInToday(userId)) return false;
  }

  return true;
}
