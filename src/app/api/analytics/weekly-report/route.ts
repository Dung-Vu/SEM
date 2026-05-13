import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { generateWeeklyReport } from "@/lib/weekly-report";
import { getLocalStartOfWeek } from "@/lib/streak";

// GET /api/analytics/weekly-report — get current week's report (generates if not exists)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if we already generated one this week
    const weekStart = getLocalStartOfWeek();

    const existing = await prisma.weeklyReport.findFirst({
      where: { userId: user.id, createdAt: { gte: weekStart } },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return NextResponse.json({
        report: {
          ...existing,
          skillStats: JSON.parse(existing.skillStats),
          vsLastWeek: JSON.parse(existing.vsLastWeek),
        },
      });
    }

    // Generate new report
    const data = await generateWeeklyReport(user.id);
    if (!data) return NextResponse.json({ error: "Could not generate report" }, { status: 500 });

    const saved = await prisma.weeklyReport.create({
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
