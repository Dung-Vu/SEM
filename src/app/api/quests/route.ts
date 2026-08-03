import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { awardExp } from "@/lib/exp";
import { logEvent } from "@/lib/analytics";
import { getLocalDateKey, getLocalDayOfWeek, getLocalWeekInfo } from "@/lib/streak";
import type { Prisma } from "@prisma/client";

function getTodayString(): string {
  return getLocalDateKey();
}

function isWeeklyDay(): boolean {
  return getLocalDayOfWeek() === 0; // Sunday in configured local timezone
}

// GET — Today's quests with completion status
export async function GET() {
  try {
    const user = await getCurrentUser();
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

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const template = await prisma.dailyQuestTemplate.findUnique({ where: { key: questKey } });
    if (!template) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    const today = getTodayString();

    const awarded = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.questProgress.updateMany({
        where: { userId: user.id, questKey, date: today, completed: false },
        data: { completed: true, completedAt: new Date() },
      });
      let shouldAward = updated.count > 0;

      if (!shouldAward) {
        const created = await tx.questProgress.createMany({
          data: { userId: user.id, questKey, date: today, completed: true, completedAt: new Date() },
          skipDuplicates: true,
        });
        shouldAward = created.count > 0;
      }

      if (!shouldAward) return false;

      await awardExp(tx, user.id, template.expReward);
      await tx.activityLog.create({
        data: {
          userId: user.id,
          source: "quest",
          amount: template.expReward,
          description: `${template.icon} ${template.name}`,
        },
      });
      return true;
    });

    if (!awarded) {
      return NextResponse.json({ success: false, message: "Already completed today" });
    }

    // Phase 14: log analytics event
    void logEvent(user.id, "quest_completed", undefined, undefined, undefined, {
      quest_id: questKey,
      quest_type: template.type,
      exp_gained: template.expReward,
    });

    // Log weekly quest completion to boss history
    if (template.type === "weekly") {

      const { weekNumber, year } = getLocalWeekInfo(new Date());
      try {
        await prisma.weeklyBossCompletion.createMany({
          data: {
            userId: user.id,
            weekNumber,
            year,
            challengeKey: template.key,
            note: template.name,
          },
          skipDuplicates: true,
        });
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
