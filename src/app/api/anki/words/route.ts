import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { awardExp } from "@/lib/exp";
import { logEvent } from "@/lib/analytics";
import { getLocalStartOfDay } from "@/lib/streak";

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

    // Check if word already exists
    const existing = await prisma.word.findUnique({ where: { english } });
    if (existing) {
      return NextResponse.json({ error: "Word already exists", word: existing }, { status: 409 });
    }

    const word = await prisma.word.create({
      data: {
        english,
        vietnamese,
        definition: definition?.trim() ?? "",
        exampleSentence: exampleSentence?.trim() ?? "",
        level: level ?? "A1",
        tags: tags ?? "",
      },
    });

    // Auto-create SRS card
    await prisma.srsCard.create({
      data: {
        userId: user.id,
        wordId: word.id,
        intervalDays: 0,
        easeFactor: 2.5,
        nextReview: new Date(),
        status: "new",
      },
    });

    // EXP for adding a word with transaction
    const expGain = 2;
    await awardExp(prisma, user.id, expGain);

    // Auto-tick learn_10_words quest after ≥10 words added today
    let autoQuestExp = 0;
    const todayStart = getLocalStartOfDay();
    const todayWordCount = await prisma.word.count({
      where: { createdAt: { gte: todayStart } },
    });
    if (todayWordCount >= 10) {
      const { autoTickQuest } = await import("@/lib/auto-quest");
      autoQuestExp = await autoTickQuest(user.id, "learn_10_words");
    }

    // Phase 14: log word added event
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
