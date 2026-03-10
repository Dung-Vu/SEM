import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLevelFromExp, getKingdomInfo } from "@/lib/exp";
import { sendLevelUpNotification } from "@/lib/notifications/level-up";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, amount, description } = body as {
      source: string;
      amount: number;
      description?: string;
    };

    if (!source || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid source or amount" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newExp = user.exp + amount;
    const newLevel = getLevelFromExp(newExp);
    const leveledUp = newLevel > user.level;

    // Use transaction for atomic update
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          exp: newExp,
          level: newLevel,
        },
      }),
    ]);

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        source,
        amount,
        description: description ?? `+${amount} EXP from ${source}`,
      },
    });

    if (leveledUp) {
      const info = getKingdomInfo(newLevel);
      await sendLevelUpNotification(user.id, newLevel, info.title).catch(err => {
        console.error("Failed to send level up notification:", err);
      });
    }

    return NextResponse.json({
      success: true,
      exp: newExp,
      level: newLevel,
      leveledUp,
      expGain: amount,
    });
  } catch (error) {
    console.error("POST /api/exp error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
