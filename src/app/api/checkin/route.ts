import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { isToday, isYesterday, getLocalDateKey, getLocalMonthInfo, getLocalStartOfDay, getLocalStartOfMonth } from "@/lib/streak";
import { awardExp } from "@/lib/exp";
import { logEvent } from "@/lib/analytics";
import type { Prisma } from "@prisma/client";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const current = await tx.user.findUnique({ where: { id: user.id } });
      if (!current) return { kind: "not_found" as const };

      if (current.lastCheckIn && isToday(current.lastCheckIn)) {
        return {
          kind: "already" as const,
          streak: current.streak,
          exp: current.exp,
        };
      }

      let newStreak = 1;
      let freezeUsed = false;
      let minimumDayUsed = false;

      if (current.lastCheckIn && isYesterday(current.lastCheckIn)) {
        newStreak = current.streak + 1;
      } else if (current.lastCheckIn && current.streak > 0) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getLocalDateKey(yesterday);
        const mainQuestKeys = ["anki_review", "listen_15min", "speak_practice", "read_article"];

        const completedMainQuests = await tx.questProgress.count({
          where: {
            userId: current.id,
            date: yesterdayStr,
            completed: true,
            questKey: { in: mainQuestKeys },
          },
        });

        if (completedMainQuests > 0) {
          newStreak = current.streak + 1;
          minimumDayUsed = true;
        } else {
          const { month, year } = getLocalMonthInfo();
          const monthKey = `${year}-${month}`;
          const monthStart = getLocalStartOfMonth();
          const freezeCount = await tx.activityLog.count({
            where: {
              userId: current.id,
              source: "streak-freeze",
              createdAt: { gte: monthStart },
            },
          });

          if (freezeCount < 2) {
            newStreak = current.streak + 1;
            freezeUsed = true;
            await tx.activityLog.create({
              data: {
                userId: current.id,
                source: "streak-freeze",
                amount: 0,
                description: `Streak freeze used (${freezeCount + 1}/2 this month: ${monthKey})`,
              },
            });
          }
        }
      }

      const todayStart = getLocalStartOfDay();
      const alreadyLogged = await tx.activityLog.findFirst({
        where: { userId: current.id, source: "check-in", createdAt: { gte: todayStart } },
      });
      if (alreadyLogged) {
        return {
          kind: "already" as const,
          streak: current.streak,
          exp: current.exp,
        };
      }

      const expGain = 10;
      const awarded = await awardExp(tx, current.id, expGain);
      const updated = await tx.user.update({
        where: { id: current.id },
        data: {
          streak: newStreak,
          lastCheckIn: new Date(),
        },
      });

      await tx.activityLog.create({
        data: {
          userId: current.id,
          source: "check-in",
          amount: expGain,
          description: `Daily check-in - Streak ${newStreak}${freezeUsed ? " (freeze used)" : ""}`,
        },
      });

      return {
        kind: "checked" as const,
        updated,
        expGain,
        leveledUp: awarded.leveledUp,
        level: awarded.level,
        freezeUsed,
        minimumDayUsed,
        newStreak,
      };
    });

    if (result.kind === "not_found") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (result.kind === "already") {
      return NextResponse.json({
        success: false,
        message: "Already checked in today",
        streak: result.streak,
        exp: result.exp,
      });
    }

    void logEvent(user.id, "daily_checkin", undefined, undefined, undefined, {
      streak_day: result.newStreak,
    });

    return NextResponse.json({
      success: true,
      streak: result.updated.streak,
      exp: result.updated.exp,
      level: result.level,
      expGain: result.expGain,
      leveledUp: result.leveledUp,
      freezeUsed: result.freezeUsed,
      minimumDayUsed: result.minimumDayUsed,
      message: result.minimumDayUsed
        ? `Minimum Day! Quest completed -> Streak ${result.newStreak} saved! +${result.expGain} EXP`
        : result.freezeUsed
          ? `Streak Freeze! Streak ${result.newStreak} saved! +${result.expGain} EXP`
          : result.leveledUp
            ? `Level Up! You're now Level ${result.level}!`
            : `+${result.expGain} EXP - Streak ${result.newStreak}`,
    });
  } catch (error) {
    console.error("POST /api/checkin error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
