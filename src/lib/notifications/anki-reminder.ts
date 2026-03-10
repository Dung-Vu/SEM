import { prisma } from "@/lib/prisma";
import { shouldSendNotification } from "./scheduler";
import { sendUserPushNotification } from "./push-handler";

export async function checkAndSendAnkiReminder(userId: string) {
  if (!(await shouldSendNotification(userId, "anki_reminder"))) {
    return;
  }

  // Đếm số cards due hôm nay
  const dueCount = await getDueCardCount(userId);
  if (dueCount === 0) return; // Không có gì để review

  const daysSinceReview = await getDaysSinceLastAnkiReview(userId);

  const content = buildAnkiReminderContent(dueCount, daysSinceReview);
  await sendUserPushNotification(userId, "anki_reminder", content);
}

async function getDueCardCount(userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Example logic (adapt based on exactly how Anki due is calculated in Phase 5)
  // Usually where nextReview <= now
  return prisma.srsCard.count({
    where: {
      userId,
      nextReview: { lte: new Date() },
    },
  });
}

async function getDaysSinceLastAnkiReview(userId: string): Promise<number> {
  const lastReview = await prisma.reviewLog.findFirst({
    where: { userId },
    orderBy: { reviewedAt: "desc" },
    select: { reviewedAt: true },
  });

  if (!lastReview) return 999;

  const msSince = Date.now() - lastReview.reviewedAt.getTime();
  return Math.floor(msSince / (1000 * 60 * 60 * 24));
}

function buildAnkiReminderContent(dueCards: number, daysSinceReview: number) {
  if (daysSinceReview >= 3) {
    return {
      title: `📚 ${dueCards} cards đang chờ bạn lâu rồi`,
      body: `${daysSinceReview} ngày chưa review. Cards overdue sẽ khó hơn!`,
      data: { url: '/anki' }
    };
  }
  if (dueCards >= 20) {
    return {
      title: `📚 ${dueCards} cards cần review hôm nay`,
      body: 'Nhiều đấy — bắt đầu sớm để không bị dồn nhé',
      data: { url: '/anki' }
    };
  }
  return {
    title: `📚 ${dueCards} cards đang chờ review`,
    body: 'Review nhanh thôi, khoảng 10 phút là xong',
    data: { url: '/anki' }
  };
}
