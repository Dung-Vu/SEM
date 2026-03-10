import { prisma } from "@/lib/prisma";
import { shouldSendNotification } from "./scheduler";
import { sendUserPushNotification } from "./push-handler";

export async function checkAndSendStreakWarning(userId: string) {
  // Check scheduling logic
  if (!(await shouldSendNotification(userId, "streak_warning"))) {
    return;
  }

  // Get current streak
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streak: true }
  });

  if (!user) return;

  const streak = user.streak || 0;
  
  if (streak === 0) return; // No streak to lose

  const content = buildStreakWarningContent(streak);
  await sendUserPushNotification(userId, "streak_warning", content);
}

function buildStreakWarningContent(streak: number) {
  if (streak >= 30) {
    return {
      title: `🔥 ${streak} ngày streak sắp mất!`,
      body: `Đừng để mất ${streak} ngày nỗ lực. Check-in ngay!`,
      icon: '/icons/streak-fire.png',
      data: { url: '/', action: 'checkin' },
      vibrate: [200, 100, 200, 100, 200], // urgent
    };
  }
  if (streak >= 7) {
    return {
      title: `⚡ Streak ${streak} ngày của bạn`,
      body: 'Còn vài tiếng nữa là hết ngày. Check-in để giữ streak!',
      data: { url: '/', action: 'checkin' }
    };
  }
  return {
    title: '🔥 Đừng quên check-in hôm nay',
    body: `Streak ${streak} ngày — giữ đà đi!`,
    data: { url: '/', action: 'checkin' }
  };
}
