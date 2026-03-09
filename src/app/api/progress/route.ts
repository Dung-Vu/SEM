import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLevelFromExp, getExpForNextLevel, getKingdomInfo } from "@/lib/exp";

export async function GET() {
  try {
    const user = await prisma.user.findFirst({
      include: { stats: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const level = getLevelFromExp(user.exp);
    const levelProgress = getExpForNextLevel(level);
    const kingdom = getKingdomInfo(level);

    // Words stats
    const totalWords = await prisma.word.count();
    const srsCards = await prisma.srsCard.findMany({ where: { userId: user.id } });
    const masteredCount = srsCards.filter((c) => c.intervalDays >= 30).length;
    const learningCount: number = srsCards.filter((c) => c.intervalDays > 0 && c.intervalDays < 30).length;
    const newCount = srsCards.filter((c) => c.intervalDays === 0).length;

    // Activity stats
    const activities = await prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    const daysActive = new Set(activities.map((a) => a.createdAt.toISOString().slice(0, 10))).size;
    const daysSinceStart = Math.max(1, Math.ceil((Date.now() - user.createdAt.getTime()) / 86400000));

    // EXP by week (last 12 weeks)
    const expByWeek: { week: string; exp: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7 + weekStart.getDay()));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekExp = activities
        .filter((a) => a.createdAt >= weekStart && a.createdAt < weekEnd)
        .reduce((s, a) => s + a.amount, 0);
      expByWeek.push({
        week: `W${12 - i}`,
        exp: weekExp,
      });
    }

    // Heatmap — last 365 days
    const heatmapData: Record<string, number> = {};
    for (const a of activities) {
      const date = a.createdAt.toISOString().slice(0, 10);
      heatmapData[date] = (heatmapData[date] || 0) + a.amount;
    }

    // Weekly stats history
    const weeklyStats = await prisma.weeklyStatsLog.findMany({
      where: { userId: user.id },
      orderBy: [{ year: "desc" }, { weekNumber: "desc" }],
      take: 12,
    });

    // Journal stats
    const journalCount = await prisma.journalEntry.count({ where: { userId: user.id } });

    // Resources done
    const resourcesDone = await prisma.resource.count({ where: { userId: user.id, status: "done" } });

    // Quests completed today
    const today = new Date().toISOString().slice(0, 10);
    const questsDoneToday = await prisma.questProgress.count({
      where: { userId: user.id, date: today, completed: true },
    });

    return NextResponse.json({
      user: { ...user, createdAt: user.createdAt.toISOString(), lastCheckIn: user.lastCheckIn?.toISOString() ?? null },
      level, levelProgress, kingdom,
      words: { total: totalWords, mastered: masteredCount, learning: learningCount, new: newCount },
      activity: { daysActive, daysSinceStart, totalExp: user.exp },
      expByWeek,
      heatmapData,
      weeklyStats,
      stats: user.stats,
      journalCount,
      resourcesDone,
      questsDoneToday,
    });
  } catch (error) {
    console.error("GET /api/progress error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
