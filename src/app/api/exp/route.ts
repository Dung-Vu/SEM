import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { awardExp, getKingdomInfo } from "@/lib/exp";
import { sendLevelUpNotification } from "@/lib/notifications/level-up";
import { assertInternalRequest } from "@/lib/server-security";
import type { Prisma } from "@prisma/client";

// EXP source allowlist. Anything outside this set is rejected so a leaked
// internal secret cannot be used to mint arbitrary EXP under arbitrary tags.
const EXP_SOURCE_ALLOWLIST = new Set<string>([
  "manual",
  "writing_submit",
  "writing_redraft",
  "speaking_session",
  "exam_complete",
  "anki_review",
  "quest_complete",
  "auto_quest",
  "level_up",
  "admin_grant",
  "test",
]);

const MAX_EXP_PER_REQUEST = 1000;

export async function POST(request: NextRequest) {
  try {
    const unauthorized = assertInternalRequest(request);
    if (unauthorized) return unauthorized;

    const body = await request.json();
    const { source, amount, description } = body as {
      source: string;
      amount: number;
      description?: string;
    };

    if (
      typeof source !== "string" ||
      !EXP_SOURCE_ALLOWLIST.has(source) ||
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > MAX_EXP_PER_REQUEST
    ) {
      return NextResponse.json(
        { error: "Invalid source or amount" },
        { status: 400 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await awardExp(tx, user.id, amount);
      await tx.activityLog.create({
        data: {
          userId: user.id,
          source,
          amount,
          description: description ?? `+${amount} EXP from ${source}`,
        },
      });
      return updated;
    });

    if (result.leveledUp) {
      const info = getKingdomInfo(result.level);
      await sendLevelUpNotification(user.id, result.level, info.title).catch(err => {
        console.error("Failed to send level up notification:", err);
      });
    }

    return NextResponse.json({
      success: true,
      exp: result.exp,
      level: result.level,
      leveledUp: result.leveledUp,
      expGain: amount,
    });
  } catch (error) {
    console.error("POST /api/exp error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
