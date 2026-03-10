import { prisma } from "@/lib/prisma";
import { shouldSendNotification } from "./scheduler";
import { sendUserPushNotification } from "./push-handler";

export async function checkAndSendQuestReminder(userId: string) {
  if (!(await shouldSendNotification(userId, "quest_reminder"))) {
    return;
  }

  const [completed, total] = await getQuestStats(userId);
  const remaining = total - completed;

  if (remaining <= 0) return; // Done

  const content = buildQuestReminderContent(completed, total, remaining);
  await sendUserPushNotification(userId, "quest_reminder", content);
}

async function getQuestStats(userId: string): Promise<[number, number]> {
  const dateStr = new Date().toISOString().split("T")[0];
  
  const templates = await prisma.dailyQuestTemplate.count({
    where: { type: "main" } // assuming Phase 10 structure
  });
  
  const completed = await prisma.questProgress.count({
    where: { userId, date: dateStr, completed: true }
  });
  
  return [completed, templates || 3];
}

function buildQuestReminderContent(completed: number, total: number, remaining: number) {
  if (remaining <= 2 && completed > 0) {
    return {
      title: `⚔️ Còn ${remaining} quest nữa là xong!`,
      body: `${completed}/${total} hoàn thành. Về đích thôi!`,
      data: { url: '/quests' }
    };
  }
  if (completed === 0) {
    return {
      title: '⚔️ Quest hôm nay chưa bắt đầu',
      body: `${total} nhiệm vụ đang chờ. Bắt đầu từ Anki Review nhé!`,
      data: { url: '/quests' }
    };
  }
  return {
    title: `⚔️ ${remaining} quest còn lại hôm nay`,
    body: `Đã xong ${completed}/${total}. Tiếp tục nào!`,
    data: { url: '/quests' }
  };
}
