import { prisma } from "@/lib/prisma";
import { awardExp } from "@/lib/exp";
import { getLocalDateKey } from "@/lib/streak";
import type { Prisma } from "@prisma/client";

/**
 * Auto-tick a quest if not already completed today.
 * Returns the EXP gained, or 0 if already done.
 */
export async function autoTickQuest(userId: string, questKey: string): Promise<number> {
  try {
    const today = getLocalDateKey();

    const template = await prisma.dailyQuestTemplate.findUnique({
      where: { key: questKey },
    });

    if (!template) return 0;

    const awarded = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.questProgress.updateMany({
        where: { userId, questKey, date: today, completed: false },
        data: { completed: true, completedAt: new Date() },
      });
      let shouldAward = updated.count > 0;

      if (!shouldAward) {
        const created = await tx.questProgress.createMany({
          data: { userId, questKey, date: today, completed: true, completedAt: new Date() },
          skipDuplicates: true,
        });
        shouldAward = created.count > 0;
      }

      if (!shouldAward) return false;

      await awardExp(tx, userId, template.expReward);
      await tx.activityLog.create({
        data: {
          userId,
          source: "quest-auto",
          amount: template.expReward,
          description: `Auto-completed: ${template.icon} ${template.name}`,
        },
      });
      return true;
    });

    return awarded ? template.expReward : 0;
  } catch (error) {
    console.error("autoTickQuest error:", error);
    return 0;
  }
}
