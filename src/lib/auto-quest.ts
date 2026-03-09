import { prisma } from "@/lib/prisma";
import { getLevelFromExp } from "@/lib/exp";

/**
 * Auto-tick a quest if not already completed today.
 * Returns the EXP gained, or 0 if already done.
 */
export async function autoTickQuest(userId: string, questKey: string): Promise<number> {
  try {
    const today = new Date().toISOString().slice(0, 10);

    // Check if already completed
    const existing = await prisma.questProgress.findUnique({
      where: { userId_questKey_date: { userId, questKey, date: today } },
    });

    if (existing?.completed) return 0;

    const template = await prisma.dailyQuestTemplate.findUnique({
      where: { key: questKey },
    });

    if (!template) return 0;

    // Get current user for EXP calculation
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return 0;

    const newExp = user.exp + template.expReward;
    const newLevel = getLevelFromExp(newExp);

    // Use transaction for atomicity
    await prisma.$transaction([
      prisma.questProgress.upsert({
        where: { userId_questKey_date: { userId, questKey, date: today } },
        update: { completed: true, completedAt: new Date() },
        create: { userId, questKey, date: today, completed: true, completedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { exp: newExp, level: newLevel },
      }),
      prisma.activityLog.create({
        data: {
          userId,
          source: "quest-auto",
          amount: template.expReward,
          description: `🤖 Auto-completed: ${template.icon} ${template.name}`,
        },
      }),
    ]);

    return template.expReward;
  } catch (error) {
    console.error("autoTickQuest error:", error);
    return 0;
  }
}
