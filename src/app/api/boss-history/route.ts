import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Auto-create table if not exists
async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "WeeklyBossCompletion" (
      "id" SERIAL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "weekNumber" INTEGER NOT NULL,
      "year" INTEGER NOT NULL,
      "challengeKey" TEXT NOT NULL,
      "challengeName" TEXT NOT NULL DEFAULT '',
      "completedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
      UNIQUE("userId", "weekNumber", "year")
    )
  `);
}

function getWeekNumber(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

// GET — Boss history
export async function GET() {
  try {
    await ensureTable();
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ history: [], stats: { total: 0, consecutiveWeeks: 0 } });

    const completions = await prisma.$queryRawUnsafe<
      Array<{
        id: number;
        weekNumber: number;
        year: number;
        challengeKey: string;
        challengeName: string;
        completedAt: Date;
      }>
    >(
      `SELECT * FROM "WeeklyBossCompletion" WHERE "userId" = $1 ORDER BY "year" DESC, "weekNumber" DESC`,
      user.id,
    );

    // Calculate consecutive weeks
    let consecutiveWeeks = 0;
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentYear = now.getFullYear();

    for (let i = 0; i < completions.length; i++) {
      const c = completions[i];
      const expectedWeek = currentWeek - i;
      const expectedYear = currentYear;

      if (expectedWeek <= 0) break; // Wrap-around for year boundary (simplified)

      if (c.weekNumber === expectedWeek && c.year === expectedYear) {
        consecutiveWeeks++;
      } else {
        break;
      }
    }

    return NextResponse.json({
      history: completions.map((c) => ({
        id: c.id,
        weekNumber: c.weekNumber,
        year: c.year,
        challengeKey: c.challengeKey,
        challengeName: c.challengeName,
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
