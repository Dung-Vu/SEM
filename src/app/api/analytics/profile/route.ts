import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateLearningProfile, detectWeaknesses, predictLevelUp } from "@/lib/profile-engine";
import { countEventsByDay } from "@/lib/analytics";

// GET /api/analytics/profile — full analytics data for dashboard
export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Get or recalculate profile
    let profile = await prisma.learningProfile.findUnique({ where: { userId: user.id } });
    if (!profile) {
      await calculateLearningProfile(user.id);
      profile = await prisma.learningProfile.findUnique({ where: { userId: user.id } });
    }
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    // Weaknesses
    const weaknesses = detectWeaknesses(profile);

    // Level prediction — target next CEFR level
    const currentLevel = determineCurrentCEFR(profile);
    const nextLevel = getNextLevel(currentLevel);
    const scores = { vocab: profile.vocabScore, speaking: profile.speakingScore, listening: profile.listeningScore, writing: profile.writingScore, grammar: profile.grammarScore };
    const velocities = { vocab: profile.vocabVelocity, speaking: profile.speakingVelocity, listening: profile.listeningVelocity, writing: profile.writingVelocity, grammar: profile.grammarVelocity };
    const prediction = predictLevelUp(scores, velocities, nextLevel);

    // Activity heatmap — 90 days
    const heatmap = await countEventsByDay(user.id, 90);

    // Weekly activity bar chart — 7 days
    const weeklyActivity = await countEventsByDay(user.id, 7);

    // Total EXP this week
    const since7 = new Date(Date.now() - 7 * 864e5);
    const weeklyLogs = await prisma.activityLog.findMany({
      where: { userId: user.id, createdAt: { gte: since7 } },
      select: { amount: true, createdAt: true },
    });
    const weeklyExp = weeklyLogs.reduce((s, l) => s + l.amount, 0);

    // Recent activity stream (10 events)
    const recentEvents = await prisma.learningEvent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Skill velocity history (14 days — from ReviewLog/JournalEntry counts by day)
    const velocityHistory = await buildVelocityHistory(user.id);

    return NextResponse.json({
      profile: {
        ...profile,
        commonErrorTypes: JSON.parse(profile.commonErrorTypes || "[]"),
      },
      weaknesses,
      prediction,
      heatmap,
      weeklyActivity,
      weeklyExp,
      recentEvents,
      velocityHistory,
      updatedAt: profile.updatedAt,
    });
  } catch (error) {
    console.error("GET /api/analytics/profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function determineCurrentCEFR(profile: { vocabScore: number; speakingScore: number; listeningScore: number; writingScore: number; grammarScore: number }): string {
  const avg = (profile.vocabScore + profile.speakingScore + profile.listeningScore + profile.writingScore + profile.grammarScore) / 5;
  if (avg >= 90) return "C2";
  if (avg >= 80) return "C1";
  if (avg >= 65) return "B2";
  if (avg >= 50) return "B1";
  if (avg >= 35) return "A2";
  return "A1";
}

function getNextLevel(current: string): string {
  const order = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const idx = order.indexOf(current);
  return idx < order.length - 1 ? order[idx + 1] : "C2";
}

async function buildVelocityHistory(userId: string) {
  // Return 14 daily data points for vocab (from ReviewLog) and writing (from JournalEntry)
  const result: { date: string; anki: number; journal: number; speak: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const dateKey = dayStart.toISOString().slice(0, 10);

    const [anki, journal, speak] = await Promise.all([
      prisma.reviewLog.count({ where: { userId, reviewedAt: { gte: dayStart, lte: dayEnd } } }),
      prisma.journalEntry.count({ where: { userId, createdAt: { gte: dayStart, lte: dayEnd } } }),
      prisma.conversationSession.count({ where: { userId, createdAt: { gte: dayStart, lte: dayEnd } } }),
    ]);

    result.push({ date: dateKey, anki, journal, speak });
  }
  return result;
}
