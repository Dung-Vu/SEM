import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — Activity log (recent activity)
export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const logs = await prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Group by date
    const grouped: Record<string, typeof logs> = {};
    for (const log of logs) {
      const date = log.createdAt.toISOString().slice(0, 10);
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
      const date = log.createdAt.toISOString().slice(0, 10);
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
