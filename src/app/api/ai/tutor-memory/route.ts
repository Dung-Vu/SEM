import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTutorMemory, updateTutorMemory } from "@/lib/tutor-memory";
import { recommendNextSession } from "@/lib/topic-recommendation";

// GET — Fetch tutor memory + recommendations
export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const [memory, recommendations] = await Promise.all([
      getTutorMemory(user.id),
      recommendNextSession(user.id),
    ]);

    // Recent sessions (last 5)
    const recentSessions = await prisma.tutorSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        mode: true,
        durationSec: true,
        performanceScore: true,
        difficultyUsed: true,
        vocabUsed: true,
        aiDebrief: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      memory: {
        currentDifficulty: memory.currentDifficulty,
        autoAdjust: memory.autoAdjust,
        totalSessions: memory.totalSessions,
        lastSessionAt: memory.lastSessionAt?.toISOString() ?? null,
        lastSessionMode: memory.lastSessionMode,
        lastSessionSummary: memory.lastSessionSummary,
        responseStyle: memory.responseStyle,
        journeySummary: memory.journeySummary,
        strengths: memory.strengths,
        persistentWeaknesses: memory.persistentWeaknesses,
        strictnessLevel: memory.strictnessLevel,
        explanationLanguage: memory.explanationLanguage,
        vocabReinforce: memory.vocabReinforce,
        errorPatterns: memory.errorPatterns.slice(0, 10),
        activeVocabTargets: memory.activeVocabTargets.slice(0, 15),
        knownVocab: memory.knownVocab.slice(0, 20),
        difficultyHistory: memory.difficultyHistory.slice(-10),
      },
      recommendations,
      recentSessions,
    });
  } catch (error) {
    console.error("GET /api/ai/tutor-memory error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH — Update tutor settings (personality config)
export async function PATCH(request: Request) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const { strictnessLevel, explanationLanguage, autoAdjust, vocabReinforce } = body as {
      strictnessLevel?: string;
      explanationLanguage?: string;
      autoAdjust?: boolean;
      vocabReinforce?: boolean;
    };

    const update: Record<string, unknown> = {};
    if (strictnessLevel !== undefined) update.strictnessLevel = strictnessLevel;
    if (explanationLanguage !== undefined) update.explanationLanguage = explanationLanguage;
    if (autoAdjust !== undefined) update.autoAdjust = autoAdjust;
    if (vocabReinforce !== undefined) update.vocabReinforce = vocabReinforce;

    await updateTutorMemory(user.id, update);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/ai/tutor-memory error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
