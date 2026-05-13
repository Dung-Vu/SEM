import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { addLocalDays, getLocalStartOfWeek, getLocalWeekInfo } from "@/lib/streak";

// GET - Boss history
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ history: [], stats: { total: 0, consecutiveWeeks: 0 } });

    const completions = await prisma.weeklyBossCompletion.findMany({
      where: { userId: user.id },
      orderBy: [{ year: "desc" }, { weekNumber: "desc" }],
    });

    let consecutiveWeeks = 0;
    const currentWeekStart = getLocalStartOfWeek();
    const { weekNumber: currentWeek, year: currentYear } = getLocalWeekInfo(new Date());
    const completedWeeks = new Set(completions.map((c) => `${c.year}-${c.weekNumber}`));

    for (let i = 0; i < completions.length; i++) {
      const expected = getLocalWeekInfo(addLocalDays(currentWeekStart, -(i * 7)));
      if (completedWeeks.has(`${expected.year}-${expected.weekNumber}`)) consecutiveWeeks++;
      else break;
    }

    return NextResponse.json({
      history: completions.map((c) => ({
        id: c.id,
        weekNumber: c.weekNumber,
        year: c.year,
        challengeKey: c.challengeKey,
        challengeName: c.note || c.challengeKey,
        completedAt: c.completedAt,
      })),
      stats: {
        total: completions.length,
        consecutiveWeeks,
        currentWeek,
        currentYear,
      },
    });
  } catch (error) {
    console.error("GET /api/boss-history error:", error);
    return NextResponse.json({ history: [], stats: { total: 0, consecutiveWeeks: 0 } });
  }
}
