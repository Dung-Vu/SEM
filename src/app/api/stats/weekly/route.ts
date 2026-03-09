import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLevelFromExp } from "@/lib/exp";
import { getWeekNumber } from "@/lib/streak";

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const logs = await prisma.weeklyStatsLog.findMany({
      where: { userId: user.id },
      orderBy: [{ year: "desc" }, { weekNumber: "desc" }],
      take: 20,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("GET /api/stats/weekly error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vocab, grammar, listening, speaking, writing, highlight, struggle, focus } = body as {
      vocab: number;
      grammar: number;
      listening: number;
      speaking: number;
      writing: number;
      highlight: string;
      struggle: string;
      focus: string;
    };

    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    // Check if already submitted this week
    const existing = await prisma.weeklyStatsLog.findUnique({
      where: { userId_weekNumber_year: { userId: user.id, weekNumber, year } },
    });

    if (existing) {
      return NextResponse.json({
        success: false,
        message: "Already submitted stats for this week",
      });
    }

    // Add EXP for weekly assessment with transaction
    const expGain = 50;
    const newExp = user.exp + expGain;
    const newLevel = getLevelFromExp(newExp);

    await prisma.$transaction([
      prisma.weeklyStatsLog.create({
        data: {
          userId: user.id,
          weekNumber,
          year,
          vocab,
          grammar,
          listening,
          speaking,
          writing,
          totalExp: newExp,
          highlight: highlight ?? "",
          struggle: struggle ?? "",
          focus: focus ?? "",
        },
      }),
      prisma.stats.upsert({
        where: { userId: user.id },
        update: { vocab, grammar, listening, speaking, writing },
        create: { userId: user.id, vocab, grammar, listening, speaking, writing },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { exp: newExp, level: newLevel },
      }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          source: "weekly-stats",
          amount: expGain,
          description: `Weekly self-assessment W${weekNumber}`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      expGain,
      message: `+${expGain} EXP · Weekly stats saved!`,
    });
  } catch (error) {
    console.error("POST /api/stats/weekly error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
