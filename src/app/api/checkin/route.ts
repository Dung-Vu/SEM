import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isToday, isYesterday } from "@/lib/streak";
import { getLevelFromExp } from "@/lib/exp";
import { logEvent } from "@/lib/analytics";

export async function POST() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Already checked in today
    if (user.lastCheckIn && isToday(user.lastCheckIn)) {
      return NextResponse.json({
        success: false,
        message: "Already checked in today",
        streak: user.streak,
        exp: user.exp,
      });
    }

    // Calculate new streak with freeze + minimum day logic
    let newStreak = 1;
    let freezeUsed = false;
    let minimumDayUsed = false;
    if (user.lastCheckIn && isYesterday(user.lastCheckIn)) {
      newStreak = user.streak + 1;
    } else if (user.lastCheckIn && user.streak > 0) {
      // Check "minimum day" — did user complete at least 1 main quest on missed day?
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      const mainQuestKeys = ["anki_review", "listen_15min", "speak_practice", "read_article"];

      const completedMainQuests = await prisma.questProgress.count({
        where: {
          userId: user.id,
          date: yesterdayStr,
          completed: true,
          questKey: { in: mainQuestKeys },
        },
      });

      if (completedMainQuests > 0) {
        // Minimum day — keep streak!
        newStreak = user.streak + 1;
        minimumDayUsed = true;
      } else {
        // No main quests → try streak freeze
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const freezeCount = await prisma.activityLog.count({
          where: {
            userId: user.id,
            source: "streak-freeze",
            createdAt: { gte: monthStart },
          },
        });

        if (freezeCount < 2) {
          newStreak = user.streak + 1;
          freezeUsed = true;

          await prisma.activityLog.create({
            data: {
              userId: user.id,
              source: "streak-freeze",
              amount: 0,
              description: `Streak freeze used (${freezeCount + 1}/2 this month: ${monthKey})`,
            },
          });
        }
      }
    }

    const expGain = 10;
    const newExp = user.exp + expGain;
    const newLevel = getLevelFromExp(newExp);
    const leveledUp = newLevel > user.level;

    // Update user with transaction for atomicity
    const updated = await prisma.$transaction(async (tx) => {
      return tx.user.update({
        where: { id: user.id },
        data: {
          streak: newStreak,
          exp: newExp,
          level: newLevel,
          lastCheckIn: new Date(),
        },
      });
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        source: "check-in",
        amount: expGain,
        description: `Daily check-in · Streak ${newStreak}${freezeUsed ? " (freeze used)" : ""}`,
      },
    });

    // Phase 14: log analytics event
    void logEvent(user.id, "daily_checkin", undefined, undefined, undefined, {
      streak_day: newStreak,
    });

    return NextResponse.json({
      success: true,
      streak: updated.streak,
      exp: updated.exp,
      level: updated.level,
      expGain,
      leveledUp,
      freezeUsed,
      minimumDayUsed,
      message: minimumDayUsed
        ? `📋 Minimum Day! Quest completed → Streak ${newStreak} saved! +${expGain} EXP`
        : freezeUsed
          ? `🧊 Streak Freeze! Streak ${newStreak} saved! +${expGain} EXP`
          : leveledUp
            ? `🎉 Level Up! You're now Level ${newLevel}!`
            : `+${expGain} EXP · Streak ${newStreak} 🔥`,
    });
  } catch (error) {
    console.error("POST /api/checkin error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
