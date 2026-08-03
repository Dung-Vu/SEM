import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { awardExp } from "@/lib/exp";
import { logEvent } from "@/lib/analytics";
import { getLocalStartOfDay } from "@/lib/streak";
import { Prisma } from "@prisma/client";

// GET — List all words (or countToday)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Return today's word count for the word hunt counter
    if (searchParams.get("countToday") === "true") {
      const todayStart = getLocalStartOfDay();
      const todayCount = await prisma.word.count({
        where: { createdAt: { gte: todayStart } },
      });
      return NextResponse.json({ todayCount });
    }

    const words = await prisma.word.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ words });
  } catch (error) {
    console.error("GET /api/anki/words error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — Add a new word
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { english: rawEnglish, vietnamese: rawVietnamese, definition, exampleSentence, level, tags } = body as {
      english: unknown;
      vietnamese: unknown;
      definition?: string;
      exampleSentence?: string;
      level?: string;
      tags?: string;
    };

    // Type guards — prevent runtime errors from malformed requests
    if (typeof rawEnglish !== "string" || rawEnglish.trim().length === 0) {
      return NextResponse.json({ error: "english must be a non-empty string" }, { status: 400 });
    }
    if (typeof rawVietnamese !== "string" || rawVietnamese.trim().length === 0) {
      return NextResponse.json({ error: "vietnamese must be a non-empty string" }, { status: 400 });
    }
    const english = rawEnglish.toLowerCase().trim();
    const vietnamese = rawVietnamese.trim();

    if (!english || !vietnamese) {
      return NextResponse.json({ error: "English and Vietnamese are required" }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Cap SRS data sizes to prevent DoS via huge payloads.
    const safeEnglish = english.slice(0, 200);
    const safeVietnamese = vietnamese.slice(0, 200);
    const safeDefinition = (definition?.trim() ?? "").slice(0, 1000);
    const safeExample = (exampleSentence?.trim() ?? "").slice(0, 1000);
    const safeTags = (tags ?? "").slice(0, 500);
    const safeLevel = (level ?? "A1").slice(0, 8);

    const expGain = 2;

    // Atomic: word + SRS card + EXP must all succeed or none.
    // Handles P2002 (unique word) race by returning 409 instead of 500.
    let word;
    try {
      word = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const w = await tx.word.create({
          data: {
            english: safeEnglish,
            vietnamese: safeVietnamese,
            definition: safeDefinition,
            exampleSentence: safeExample,
            level: safeLevel,
            tags: safeTags,
          },
        });

        await tx.srsCard.create({
          data: {
            userId: user.id,
            wordId: w.id,
            intervalDays: 0,
            easeFactor: 2.5,
            nextReview: new Date(),
            status: "new",
          },
        });

        await awardExp(tx, user.id, expGain);

        return w;
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const existing = await prisma.word.findUnique({ where: { english: safeEnglish } });
        return NextResponse.json(
          { error: "Word already exists", word: existing },
          { status: 409 }
        );
      }
      throw err;
    }

    // Auto-tick learn_10_words quest after ≥10 words added today.
    // Note: today's count is a global Word counter (not user-scoped), see Agent 1 find
    // "Global words corrupt per-user activity semantics" — preserved here to avoid
    // silently changing business logic; tracked separately for follow-up.
    let autoQuestExp = 0;
    const todayStart = getLocalStartOfDay();
    const todayWordCount = await prisma.word.count({
      where: { createdAt: { gte: todayStart } },
    });
    if (todayWordCount >= 10) {
      const { autoTickQuest } = await import("@/lib/auto-quest");
      autoQuestExp = await autoTickQuest(user.id, "learn_10_words");
    }

    void logEvent(user.id, "anki_word_added", "vocab", undefined, undefined, {
      word: word.english,
      level: word.level,
    });

    return NextResponse.json({ success: true, word, expGain: 2, autoQuestExp });
  } catch (error) {
    console.error("POST /api/anki/words error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
