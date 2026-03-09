import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateSrs } from "@/lib/srs";
import { getLevelFromExp } from "@/lib/exp";
import { logEvent } from "@/lib/analytics";

// GET — Get cards due for review today + new cards
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Front-end sends the user's setting from localStorage (default 15, max 50)
    const dailyNewLimit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") ?? "15", 10) || 15)
    );

    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const now = new Date();

    // Cards due for review (nextReview <= now, not new)
    const dueCards = await prisma.srsCard.findMany({
      where: {
        userId: user.id,
        nextReview: { lte: now },
        status: { not: "new" },
      },
      include: { word: true },
      orderBy: { nextReview: "asc" },
    });

    // New cards — respect user's daily limit setting
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const newCardsReviewedToday = await prisma.reviewLog.count({
      where: {
        userId: user.id,
        reviewedAt: { gte: todayStart },
        intervalBefore: 0,
      },
    });

    const newCardLimit = Math.max(0, dailyNewLimit - newCardsReviewedToday);

    const newCards = await prisma.srsCard.findMany({
      where: { userId: user.id, status: "new" },
      include: { word: true },
      take: newCardLimit,
      orderBy: { createdAt: "asc" },
    });

    // Total counts — single groupBy instead of 4 separate count() queries (N+1 fix)
    const statusCounts = await prisma.srsCard.groupBy({
      by: ["status"],
      where: { userId: user.id },
      _count: { id: true },
    });
    const countMap = Object.fromEntries(statusCounts.map((r) => [r.status, r._count.id]));
    const totalNew      = countMap["new"]      ?? 0;
    const totalLearning = countMap["learning"] ?? 0;
    const totalReview   = countMap["review"]   ?? 0;
    const totalMastered = countMap["mastered"] ?? 0;

    const cards = [...dueCards, ...newCards].map((c) => ({
      id: c.id,
      wordId: c.wordId,
      english: c.word.english,
      vietnamese: c.word.vietnamese,
      definition: c.word.definition,
      exampleSentence: c.word.exampleSentence,
      level: c.word.level,
      tags: c.word.tags,
      status: c.status,
      intervalDays: c.intervalDays,
      reviewsCount: c.reviewsCount,
    }));

    // Forecast: run concurrently
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);

    const [dueTomorrow, dueThisWeek] = await Promise.all([
      prisma.srsCard.count({
        where: { userId: user.id, nextReview: { lte: tomorrow }, status: { not: "new" } },
      }),
      prisma.srsCard.count({
        where: { userId: user.id, nextReview: { lte: endOfWeek }, status: { not: "new" } },
      }),
    ]);

    return NextResponse.json({
      cards,
      counts: {
        due: dueCards.length,
        new: newCards.length,
        totalNew,
        totalLearning,
        totalReview,
        totalMastered,
        total: totalNew + totalLearning + totalReview + totalMastered,
      },
      forecast: {
        tomorrow: dueTomorrow,
        thisWeek: dueThisWeek,
      },
    });
  } catch (error) {
    console.error("GET /api/anki/review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — Submit a review rating
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cardId, rating } = body as { cardId: string; rating: number };

    if (!cardId || !rating || rating < 1 || rating > 4) {
      return NextResponse.json({ error: "Invalid cardId or rating (1-4)" }, { status: 400 });
    }

    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const card = await prisma.srsCard.findUnique({
      where: { id: cardId },
      include: { word: true },
    });

    if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

    const result = calculateSrs({
      intervalDays: card.intervalDays,
      easeFactor: card.easeFactor,
      reviewsCount: card.reviewsCount,
      lapseCount: card.lapseCount,
      status: card.status,
    }, rating);

    // Update SRS card
    await prisma.srsCard.update({
      where: { id: cardId },
      data: {
        intervalDays: result.intervalDays,
        easeFactor: result.easeFactor,
        nextReview: result.nextReview,
        reviewsCount: result.reviewsCount,
        lapseCount: result.lapseCount,
        status: result.status,
      },
    });

    // Log the review
    await prisma.reviewLog.create({
      data: {
        userId: user.id,
        wordId: card.wordId,
        rating,
        intervalBefore: card.intervalDays,
        intervalAfter: result.intervalDays,
      },
    });

    // Phase 14: log analytics event (non-blocking)
    void logEvent(user.id, "anki_card_reviewed", "vocab", rating * 25, undefined, {
      rating,
      wordId: card.wordId,
      level: card.word.level,
      status: result.status,
    });

    // Award EXP per review and update level
    const expGain = rating >= 3 ? 5 : 2;
    const currentUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (currentUser) {
      const newExp = currentUser.exp + expGain;
      const newLevel = getLevelFromExp(newExp);
      await prisma.user.update({
        where: { id: user.id },
        data: { exp: newExp, level: newLevel },
      });
    }

    // Auto-tick anki_review quest after ≥10 reviews today
    let autoQuestExp = 0;
    const todayStart2 = new Date();
    todayStart2.setHours(0, 0, 0, 0);
    const todayReviewCount = await prisma.reviewLog.count({
      where: { userId: user.id, reviewedAt: { gte: todayStart2 } },
    });
    if (todayReviewCount >= 10) {
      const { autoTickQuest } = await import("@/lib/auto-quest");
      autoQuestExp = await autoTickQuest(user.id, "anki_review");

      // Log anki_session_complete at the 10-card milestone (once daily)
      // Dedup: check if already logged today
      const alreadyLogged = await prisma.learningEvent.findFirst({
        where: {
          userId: user.id,
          eventType: "anki_session_complete",
          createdAt: { gte: todayStart2 },
        },
      });
      if (!alreadyLogged) {
        const todayReviews = await prisma.reviewLog.findMany({
          where: { userId: user.id, reviewedAt: { gte: todayStart2 } },
          select: { rating: true },
        });
        const mastered = todayReviews.filter((r) => r.rating >= 3).length;
        void logEvent(user.id, "anki_session_complete", "vocab", undefined, undefined, {
          cards_total: todayReviewCount,
          cards_mastered: mastered,
          retention: Math.round((mastered / todayReviewCount) * 100),
        });

        // Phase 15: sync vocab to SENSEI tutor memory
        import("@/lib/vocab-memory").then(({ syncVocabMemory }) => {
          void syncVocabMemory(user.id);
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      expGain,
      autoQuestExp,
      nextReview: result.nextReview.toISOString(),
      intervalDays: result.intervalDays,
      status: result.status,
    });
  } catch (error) {
    console.error("POST /api/anki/review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
