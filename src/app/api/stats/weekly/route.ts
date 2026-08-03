import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { awardExp } from "@/lib/exp";
import { getLocalWeekInfo } from "@/lib/streak";
import type { Prisma } from "@prisma/client";

export async function GET() {
  try {
    const user = await getCurrentUser();
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
    const vocab = parseRating(body?.vocab);
    const grammar = parseRating(body?.grammar);
    const listening = parseRating(body?.listening);
    const speaking = parseRating(body?.speaking);
    const writing = parseRating(body?.writing);

    if ([vocab, grammar, listening, speaking, writing].some((v) => v == null)) {
      return NextResponse.json({ error: "Skill ratings must be numbers from 1 to 10" }, { status: 400 });
    }

    const ratings = {
      vocab: vocab!,
      grammar: grammar!,
      listening: listening!,
      speaking: speaking!,
      writing: writing!,
    };

    const highlight = sanitizeText(body?.highlight);
    const struggle = sanitizeText(body?.struggle);
    const focus = sanitizeText(body?.focus);

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const { weekNumber, year } = getLocalWeekInfo(now);

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
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const awarded = await awardExp(tx, user.id, expGain);
      await tx.weeklyStatsLog.create({
        data: {
          userId: user.id,
          weekNumber,
          year,
          ...ratings,
          totalExp: awarded.exp,
          highlight: highlight ?? "",
          struggle: struggle ?? "",
          focus: focus ?? "",
        },
      });
      await tx.stats.upsert({
        where: { userId: user.id },
        update: ratings,
        create: { userId: user.id, ...ratings },
      });
      await tx.activityLog.create({
        data: {
          userId: user.id,
          source: "weekly-stats",
          amount: expGain,
          description: `Weekly self-assessment W${weekNumber}`,
        },
      });
    });

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

function parseRating(value: unknown): number | null {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return null;
  const rounded = Math.round(rating);
  if (rounded < 1 || rounded > 10) return null;
  return rounded;
}

function sanitizeText(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 1000) : "";
}
