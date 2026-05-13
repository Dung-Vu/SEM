import { NextResponse } from "next/server";
import { getLevelFromExp, getExpForNextLevel, getKingdomInfo, getStreakBonus } from "@/lib/exp";
import { calculateStreak } from "@/lib/streak";
import { getCurrentUser } from "@/lib/current-user";

export async function GET() {
  try {
    const user = await getCurrentUser({
      id: true,
      username: true,
      level: true,
      exp: true,
      streak: true,
      lastCheckIn: true,
      createdAt: true,
      stats: true,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const streak = calculateStreak(user.lastCheckIn, user.streak);
    const level = getLevelFromExp(user.exp);
    const levelProgress = getExpForNextLevel(level);
    const kingdom = getKingdomInfo(level);
    const streakBonus = getStreakBonus(streak);

    // Whitelist returned fields — never spread raw DB record
    return NextResponse.json({
      id: user.id,
      username: user.username,
      level,
      exp: user.exp,
      streak,
      lastCheckIn: user.lastCheckIn?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      stats: user.stats,
      levelProgress,
      kingdom,
      streakBonus,
      aiModel: process.env.AI_MODEL || "qwen3.5-plus",
      aiConfigured: Boolean(process.env.AI_API_KEY),
    });
  } catch (error) {
    console.error("GET /api/user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
