import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { generateWeeklyReport } from "@/lib/weekly-report";
import { getLocalStartOfWeek } from "@/lib/streak";
import { Prisma } from "@prisma/client";

// GET /api/analytics/weekly-report — get current week's report (generates if not exists)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const weekStart = getLocalStartOfWeek();

    const existing = await prisma.weeklyReport.findFirst({
      where: { userId: user.id, createdAt: { gte: weekStart } },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return NextResponse.json({
        report: {
          ...existing,
          skillStats: safeJsonParse(existing.skillStats, {}),
          vsLastWeek: safeJsonParse(existing.vsLastWeek, {}),
        },
      });
    }

    // Generate new report. Two concurrent requests used to race here:
    // both missed the existence check, both called generateWeeklyReport,
    // the second create() failed with P2002 (unique weekNumber+year+userId)
    // and the user saw a 500. Catch P2002 and re-read the winner.
    const data = await generateWeeklyReport(user.id);
    if (!data) return NextResponse.json({ error: "Could not generate report" }, { status: 500 });

    let saved;
    try {
      saved = await prisma.weeklyReport.create({
        data: {
          userId: user.id,
          weekNumber: data.weekNumber,
          year: data.year,
          period: data.period,
          totalStudyMinutes: data.totalStudyMinutes,
          totalExp: data.totalExp,
          questCompletionRate: data.questCompletionRate,
          summary: data.summary,
          topRecommendation: data.topRecommendation,
          bestDay: data.bestDay,
          topAchievement: data.topAchievement,
          biggestImprovement: data.biggestImprovement,
          skillStats: JSON.stringify(data.skillStats),
          vsLastWeek: JSON.stringify(data.vsLastWeek),
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const winner = await prisma.weeklyReport.findFirst({
          where: { userId: user.id, weekNumber: data.weekNumber, year: data.year },
          orderBy: { createdAt: "desc" },
        });
        if (winner) {
          return NextResponse.json({
            report: {
              ...winner,
              skillStats: safeJsonParse(winner.skillStats, {}),
              vsLastWeek: safeJsonParse(winner.vsLastWeek, {}),
            },
          });
        }
      }
      throw err;
    }

    return NextResponse.json({
      report: {
        ...saved,
        skillStats: data.skillStats,
        vsLastWeek: data.vsLastWeek,
      },
    });
  } catch (error) {
    console.error("GET /api/analytics/weekly-report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// PATCH /api/analytics/weekly-report — mark current week's report as read
export async function PATCH() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const weekStart = getLocalStartOfWeek();

    await prisma.weeklyReport.updateMany({
      where: { userId: user.id, createdAt: { gte: weekStart }, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/analytics/weekly-report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
