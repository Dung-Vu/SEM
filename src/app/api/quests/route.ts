import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLevelFromExp } from "@/lib/exp";
import { logEvent } from "@/lib/analytics";

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function isWeeklyDay(): boolean {
  return new Date().getDay() === 0; // Sunday
}

// GET — Today's quests with completion status
export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const today = getTodayString();
    const templates = await prisma.dailyQuestTemplate.findMany();

    // Get today's progress
    const progress = await prisma.questProgress.findMany({
      where: { userId: user.id, date: today },
    });

    const progressMap = new Map(progress.map((p) => [p.questKey, p]));

    const quests = templates
      .filter((t) => t.type !== "weekly" || isWeeklyDay())
      .map((t) => ({
        key: t.key,
        name: t.name,
        description: t.description,
        expReward: t.expReward,
        type: t.type,
        icon: t.icon,
        completed: progressMap.get(t.key)?.completed ?? false,
        completedAt: progressMap.get(t.key)?.completedAt?.toISOString() ?? null,
      }));

    const mainQuests = quests.filter((q) => q.type === "main");
    const sideQuests = quests.filter((q) => q.type === "side");
    const weeklyQuests = quests.filter((q) => q.type === "weekly");

    const completedCount = quests.filter((q) => q.completed).length;
    const totalCount = quests.length;

    return NextResponse.json({
      quests: { main: mainQuests, side: sideQuests, weekly: weeklyQuests },
      progress: { completed: completedCount, total: totalCount },
      date: today,
    });
  } catch (error) {
    console.error("GET /api/quests error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — Mark quest as completed
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questKey } = body as { questKey: string };

    if (!questKey) {
      return NextResponse.json({ error: "questKey is required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const template = await prisma.dailyQuestTemplate.findUnique({ where: { key: questKey } });
    if (!template) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    const today = getTodayString();

    // Check if already completed
    const existing = await prisma.questProgress.findUnique({
      where: { userId_questKey_date: { userId: user.id, questKey, date: today } },
    });

    if (existing?.completed) {
      return NextResponse.json({ success: false, message: "Already completed today" });
    }

    // Award EXP with transaction
    const newExp = user.exp + template.expReward;
    const newLevel = getLevelFromExp(newExp);

    await prisma.$transaction([
      prisma.questProgress.upsert({
        where: { userId_questKey_date: { userId: user.id, questKey, date: today } },
        update: { completed: true, completedAt: new Date() },
        create: { userId: user.id, questKey, date: today, completed: true, completedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { exp: newExp, level: newLevel },
      }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          source: "quest",
          amount: template.expReward,
          description: `${template.icon} ${template.name}`,
        },
      }),
    ]);

    // Phase 14: log analytics event
    void logEvent(user.id, "quest_completed", undefined, undefined, undefined, {
      quest_id: questKey,
      quest_type: template.type,
      exp_gained: template.expReward,
    });

    // Log weekly quest completion to boss history
    if (template.type === "weekly") {

      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "WeeklyBossCompletion" ("userId", "weekNumber", "year", "challengeKey", "challengeName", "completedAt")
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT ("userId", "weekNumber", "year") DO NOTHING`,
          user.id, weekNumber, now.getFullYear(), template.key, template.name,
        );
      } catch { /* table may not exist yet — that's ok */ }
    }

    return NextResponse.json({
      success: true,
      expGain: template.expReward,
      message: `+${template.expReward} EXP · ${template.name}`,
    });
  } catch (error) {
    console.error("POST /api/quests error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
