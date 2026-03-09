import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLevelFromExp } from "@/lib/exp";

// GET — list all achievements with unlock status
export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const achievements = await prisma.achievement.findMany({ orderBy: { id: "asc" } });
    const userAchievements = await prisma.userAchievement.findMany({ where: { userId: user.id } });
    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

    // Compute progress for progress-type achievements
    const srsCards = await prisma.srsCard.findMany({ where: { userId: user.id } });
    const masteredCount = srsCards.filter((c) => c.intervalDays >= 30).length;
    const journalCount = await prisma.journalEntry.count({ where: { userId: user.id } });
    const resourcesDone = await prisma.resource.count({ where: { userId: user.id, status: "done" } });

    const progressMap: Record<string, { current: number; target: number }> = {
      word_collector_1: { current: srsCards.length, target: 100 },
      word_collector_2: { current: srsCards.length, target: 500 },
      master_1: { current: masteredCount, target: 50 },
      master_2: { current: masteredCount, target: 200 },
      journal_1: { current: journalCount, target: 7 },
      journal_2: { current: journalCount, target: 30 },
      streak_7: { current: user.streak, target: 7 },
      streak_30: { current: user.streak, target: 30 },
      streak_100: { current: user.streak, target: 100 },
      resource_1: { current: resourcesDone, target: 5 },
      resource_2: { current: resourcesDone, target: 15 },
      exp_1000: { current: user.exp, target: 1000 },
      exp_5000: { current: user.exp, target: 5000 },
      exp_20000: { current: user.exp, target: 20000 },
      first_checkin: { current: user.streak > 0 ? 1 : 0, target: 1 },
    };

    const enriched = achievements.map((a) => ({
      ...a,
      unlocked: unlockedIds.has(a.id),
      unlockedAt: userAchievements.find((ua) => ua.achievementId === a.id)?.unlockedAt?.toISOString() ?? null,
      progress: progressMap[a.key] ?? null,
    }));

    // Auto-unlock achievements with transaction
    const newlyUnlocked: string[] = [];
    for (const a of enriched) {
      if (!a.unlocked && a.progress && a.progress.current >= a.progress.target) {
        const bonusExp = 50;
        const newExp = user.exp + bonusExp;
        const newLevel = getLevelFromExp(newExp);

        await prisma.$transaction([
          prisma.userAchievement.create({
            data: { userId: user.id, achievementId: a.id },
          }),
          prisma.user.update({
            where: { id: user.id },
            data: { exp: newExp, level: newLevel },
          }),
          prisma.activityLog.create({
            data: { userId: user.id, source: "achievement", amount: bonusExp, description: `🏆 ${a.name}` },
          }),
        ]);

        a.unlocked = true;
        newlyUnlocked.push(a.name);
      }
    }

    return NextResponse.json({
      achievements: enriched,
      total: achievements.length,
      unlocked: enriched.filter((a) => a.unlocked).length,
      newlyUnlocked,
    });
  } catch (error) {
    console.error("GET /api/achievements error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
