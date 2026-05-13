import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { logEvent } from "@/lib/analytics";
import { awardExp } from "@/lib/exp";

const DEFAULT_MILESTONES = [
  { key: "M01", title: "First Steps", description: "Complete your first Anki review session", targetType: "anki_sessions", targetValue: 1, rewardDesc: "Scholar's Badge", expReward: 100, order: 1 },
  { key: "M02", title: "Word Collector", description: "Master 25 vocabulary cards", targetType: "cards_mastered", targetValue: 25, rewardDesc: "Lexicon Badge", expReward: 200, order: 2 },
  { key: "M03", title: "First Conversation", description: "Complete your first AI speaking session", targetType: "ai_sessions", targetValue: 1, rewardDesc: "Speaker's Badge", expReward: 150, order: 3 },
  { key: "M04", title: "Streak Starter", description: "Maintain a 3-day learning streak", targetType: "streak", targetValue: 3, rewardDesc: "Flame Badge I", expReward: 200, order: 4 },
  { key: "M05", title: "Journal Keeper", description: "Write 5 journal entries", targetType: "journal_entries", targetValue: 5, rewardDesc: "Scribe's Badge", expReward: 250, order: 5 },
  { key: "M06", title: "Word Master I", description: "Master 100 vocabulary cards", targetType: "cards_mastered", targetValue: 100, rewardDesc: "Centurion Badge", expReward: 500, order: 6 },
  { key: "M07", title: "Weekly Champion", description: "Complete your first Weekly Challenge", targetType: "boss_completions", targetValue: 1, rewardDesc: "Boss Slayer Badge", expReward: 300, order: 7 },
  { key: "M08", title: "Polyglot Streak", description: "Maintain a 7-day learning streak", targetType: "streak", targetValue: 7, rewardDesc: "Flame Badge II", expReward: 400, order: 8 },
  { key: "M09", title: "Level Up", description: "Reach Level 5", targetType: "level", targetValue: 5, rewardDesc: "Knight's Badge", expReward: 500, order: 9 },
  { key: "M10", title: "Word Master II", description: "Master 250 vocabulary cards", targetType: "cards_mastered", targetValue: 250, rewardDesc: "Elite Lexicon Badge", expReward: 750, order: 10 },
  { key: "M11", title: "Iron Streak", description: "Maintain a 30-day learning streak", targetType: "streak", targetValue: 30, rewardDesc: "Iron Will Badge", expReward: 1000, order: 11 },
  { key: "M12", title: "Legend", description: "Reach Level 10 - True Language Master", targetType: "level", targetValue: 10, rewardDesc: "Legendary Crown", expReward: 2000, order: 12 },
] as const;

async function ensureDefaultMilestones() {
  const count = await prisma.milestone.count();
  if (count > 0) return;

  await prisma.$transaction(
    DEFAULT_MILESTONES.map((m) =>
      prisma.milestone.upsert({
        where: { key: m.key },
        update: {},
        create: m,
      })
    )
  );
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await ensureDefaultMilestones();

    const [milestones, userMilestones] = await Promise.all([
      prisma.milestone.findMany({ orderBy: { order: "asc" } }),
      prisma.userMilestone.findMany({
        where: { userId: user.id },
        select: { milestoneId: true, achievedAt: true, rewardClaimed: true },
      }),
    ]);

    const unlockedMap = new Map(userMilestones.map((um) => [um.milestoneId, um]));

    return NextResponse.json({
      milestones: milestones.map((m) => {
        const unlocked = unlockedMap.get(m.id);
        return {
          ...m,
          unlocked: Boolean(unlocked),
          achievedAt: unlocked?.achievedAt ?? null,
          rewardClaimed: unlocked?.rewardClaimed ?? false,
        };
      }),
    });
  } catch (error) {
    console.error("GET /api/milestones error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await ensureDefaultMilestones();

    const userId = user.id;
    const milestones = await prisma.milestone.findMany({ orderBy: { order: "asc" } });
    const existing = await prisma.userMilestone.findMany({
      where: { userId },
      select: { milestoneId: true },
    });
    const existingIds = new Set(existing.map((e) => e.milestoneId));

    const [cardsMastered, aiSessions, journalCount, ankiSessions, bossCount] = await Promise.all([
      prisma.srsCard.count({ where: { userId, status: "mastered" } }),
      prisma.conversationSession.count({ where: { userId } }),
      prisma.journalEntry.count({ where: { userId } }),
      prisma.learningEvent.count({ where: { userId, eventType: "anki_session_complete" } }),
      prisma.weeklyBossCompletion.count({ where: { userId } }),
    ]);

    const newlyUnlocked = [];

    for (const m of milestones) {
      if (existingIds.has(m.id)) continue;

      let achieved = false;
      switch (m.targetType) {
        case "streak": achieved = user.streak >= m.targetValue; break;
        case "cards_mastered": achieved = cardsMastered >= m.targetValue; break;
        case "ai_sessions": achieved = aiSessions >= m.targetValue; break;
        case "journal_entries": achieved = journalCount >= m.targetValue; break;
        case "boss_completions": achieved = bossCount >= m.targetValue; break;
        case "anki_sessions": achieved = ankiSessions >= m.targetValue; break;
        case "level": achieved = user.level >= m.targetValue; break;
      }

      if (!achieved) continue;

      const inserted = await prisma.$transaction(async (tx) => {
        const created = await tx.userMilestone.createMany({
          data: { userId, milestoneId: m.id, rewardClaimed: true },
          skipDuplicates: true,
        });
        if (created.count === 0) return false;
        await awardExp(tx, userId, m.expReward);
        await tx.activityLog.create({
          data: {
            userId,
            source: "milestone",
            amount: m.expReward,
            description: `Milestone unlocked: ${m.title}`,
          },
        });
        return true;
      });

      if (inserted) {
        void logEvent(userId, "milestone_unlocked", undefined, undefined, undefined, {
          milestone_id: m.key,
          title: m.title,
          exp_reward: m.expReward,
        });
        newlyUnlocked.push(m);
      }
    }

    return NextResponse.json({
      newlyUnlocked: newlyUnlocked.map((m) => ({
        key: m.key,
        title: m.title,
        rewardDesc: m.rewardDesc,
        expReward: m.expReward,
      })),
      count: newlyUnlocked.length,
    });
  } catch (error) {
    console.error("POST /api/milestones error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
