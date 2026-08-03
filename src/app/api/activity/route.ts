import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { getLocalDateKey } from "@/lib/streak";

// GET — Activity log (recent activity)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const logs = await prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Group by date
    const grouped: Record<string, typeof logs> = {};
    for (const log of logs) {
      const date = getLocalDateKey(log.createdAt);
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(log);
    }

    // Daily totals for heatmap (last 90 days)
    const heatmapStart = new Date();
    heatmapStart.setDate(heatmapStart.getDate() - 90);

    const allLogs = await prisma.activityLog.findMany({
      where: { userId: user.id, createdAt: { gte: heatmapStart } },
      select: { amount: true, createdAt: true },
    });

    const dailyTotals: Record<string, number> = {};
    for (const log of allLogs) {
      const date = getLocalDateKey(log.createdAt);
      dailyTotals[date] = (dailyTotals[date] || 0) + log.amount;
    }

    return NextResponse.json({
      logs: logs.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      })),
      grouped,
      dailyTotals,
    });
  } catch (error) {
    console.error("GET /api/activity error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
