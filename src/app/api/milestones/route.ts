import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/analytics";

// Auto-initialize Phase 12 milestone tables on first call
async function ensureMilestoneTables() {
  // Create Milestone table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Milestone" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "key" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "targetType" TEXT NOT NULL,
      "targetValue" INTEGER NOT NULL,
      "rewardDesc" TEXT NOT NULL DEFAULT '',
      "expReward" INTEGER NOT NULL DEFAULT 0,
      "order" INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Milestone_key_key" UNIQUE ("key")
    )
  `);

  // Create UserMilestone table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UserMilestone" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "userId" TEXT NOT NULL,
      "milestoneId" TEXT NOT NULL,
      "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "UserMilestone_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "UserMilestone_userId_milestoneId_key" UNIQUE ("userId","milestoneId")
    )
  `);

  // Seed milestones if table is empty
  const res = await prisma.$queryRaw<{ count: string }[]>`SELECT COUNT(*)::text as count FROM "Milestone"`;
  if (parseInt(res[0].count) === 0) {
    const milestones = [
      { key: "M01", title: "First Steps", desc: "Complete your first Anki review session", type: "anki_sessions", val: 1, reward: "Scholar's Badge", exp: 100, ord: 1 },
      { key: "M02", title: "Word Collector", desc: "Master 25 vocabulary cards", type: "cards_mastered", val: 25, reward: "Lexicon Badge", exp: 200, ord: 2 },
      { key: "M03", title: "First Conversation", desc: "Complete your first AI speaking session", type: "ai_sessions", val: 1, reward: "Speaker's Badge", exp: 150, ord: 3 },
      { key: "M04", title: "Streak Starter", desc: "Maintain a 3-day learning streak", type: "streak", val: 3, reward: "Flame Badge I", exp: 200, ord: 4 },
      { key: "M05", title: "Journal Keeper", desc: "Write 5 journal entries", type: "journal_entries", val: 5, reward: "Scribe's Badge", exp: 250, ord: 5 },
      { key: "M06", title: "Word Master I", desc: "Master 100 vocabulary cards", type: "cards_mastered", val: 100, reward: "Centurion Badge", exp: 500, ord: 6 },
      { key: "M07", title: "Weekly Champion", desc: "Complete your first Weekly Challenge", type: "boss_completions", val: 1, reward: "Boss Slayer Badge", exp: 300, ord: 7 },
      { key: "M08", title: "Polyglot Streak", desc: "Maintain a 7-day learning streak", type: "streak", val: 7, reward: "Flame Badge II", exp: 400, ord: 8 },
      { key: "M09", title: "Level Up", desc: "Reach Level 5", type: "level", val: 5, reward: "Knight's Badge", exp: 500, ord: 9 },
      { key: "M10", title: "Word Master II", desc: "Master 250 vocabulary cards", type: "cards_mastered", val: 250, reward: "Elite Lexicon Badge", exp: 750, ord: 10 },
      { key: "M11", title: "Iron Streak", desc: "Maintain a 30-day learning streak", type: "streak", val: 30, reward: "Iron Will Badge", exp: 1000, ord: 11 },
      { key: "M12", title: "Legend", desc: "Reach Level 10 — True Language Master", type: "level", val: 10, reward: "Legendary Crown", exp: 2000, ord: 12 },
    ];
    for (const m of milestones) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Milestone" ("id","key","title","description","targetType","targetValue","rewardDesc","expReward","order")
         SELECT gen_random_uuid()::text,$1,$2,$3,$4,$5,$6,$7,$8
         WHERE NOT EXISTS (SELECT 1 FROM "Milestone" WHERE "key" = $1)`,
        m.key, m.title, m.desc, m.type, m.val, m.reward, m.exp, m.ord
      );
    }
  }
}

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await ensureMilestoneTables();

    const milestones = await prisma.$queryRaw<{
      id: string; key: string; title: string; description: string;
      targetType: string; targetValue: number; rewardDesc: string;
      expReward: number; order: number;
    }[]>`SELECT * FROM "Milestone" ORDER BY "order" ASC`;

    const userMilestones = await prisma.$queryRaw<{
      milestoneId: string; achievedAt: Date;
    }[]>`SELECT "milestoneId", "achievedAt" FROM "UserMilestone" WHERE "userId" = ${user.id}`;

    const unlockedMap = new Map(userMilestones.map((um) => [um.milestoneId, um.achievedAt]));

    return NextResponse.json({
      milestones: milestones.map((m) => ({
        ...m,
        unlocked: unlockedMap.has(m.id),
        achievedAt: unlockedMap.get(m.id) ?? null,
      })),
    });
  } catch (error) {
    console.error("GET /api/milestones error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await ensureMilestoneTables();

    const userId = user.id;
    const milestones = await prisma.$queryRaw<{
      id: string; key: string; title: string; rewardDesc: string;
      expReward: number; targetType: string; targetValue: number;
    }[]>`SELECT * FROM "Milestone" ORDER BY "order" ASC`;

    const existing = await prisma.$queryRaw<{ milestoneId: string }[]>`
      SELECT "milestoneId" FROM "UserMilestone" WHERE "userId" = ${userId}
    `;
    const existingIds = new Set(existing.map((e) => e.milestoneId));

    const [cardsMastered, aiSessions, journalCount, ankiSessions] = await Promise.all([
      prisma.srsCard.count({ where: { userId, status: "mastered" } }),
      prisma.conversationSession.count({ where: { userId } }),
      prisma.journalEntry.count({ where: { userId } }),
      prisma.activityLog.count({ where: { userId, source: "anki" } }),
    ]);
    // Boss completions — table may not exist, default to 0
    const bossCount = 0;

    const newlyUnlocked: typeof milestones = [];

    for (const m of milestones) {
      if (existingIds.has(m.id)) continue;

      let achieved = false;
      switch (m.targetType) {
        case "streak": achieved = (user.streak ?? 0) >= m.targetValue; break;
        case "cards_mastered": achieved = cardsMastered >= m.targetValue; break;
        case "ai_sessions": achieved = aiSessions >= m.targetValue; break;
        case "journal_entries": achieved = journalCount >= m.targetValue; break;
        case "boss_completions": achieved = bossCount >= m.targetValue; break;
        case "anki_sessions": achieved = ankiSessions >= 1; break;
        case "level": achieved = (user.level ?? 1) >= m.targetValue; break;
      }

      if (achieved) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "UserMilestone" ("userId","milestoneId") VALUES ($1,$2) ON CONFLICT ("userId","milestoneId") DO NOTHING`,
          userId, m.id
        );
        await prisma.user.update({
          where: { id: userId },
          data: { exp: { increment: m.expReward } },
        });
        // Phase 14: log milestone_unlocked event
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
        key: m.key, title: m.title, rewardDesc: m.rewardDesc, expReward: m.expReward,
      })),
      count: newlyUnlocked.length,
    });
  } catch (error) {
    console.error("POST /api/milestones error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
