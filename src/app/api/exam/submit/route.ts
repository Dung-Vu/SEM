import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateExamResult, syncExamToMemory, logExamCompletion } from "@/lib/exam-grader";
import { getLevelRecommendation } from "@/lib/exam-generator";

// POST /api/exam/submit — Submit and grade exam
export async function POST(request: NextRequest) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const { examId, timeSpent } = body as {
      examId: string;
      timeSpent?: number;
    };

    if (!examId) {
      return NextResponse.json({ error: "examId is required" }, { status: 400 });
    }

    // Verify exam
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam || exam.userId !== user.id) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }
    if (exam.status === "submitted") {
      // Already submitted — return existing result
      const existing = await prisma.examResult.findUnique({ where: { examId } });
      return NextResponse.json({ result: existing });
    }

    // Mark exam as submitted
    await prisma.exam.update({
      where: { id: examId },
      data: {
        status: "submitted",
        submittedAt: new Date(),
        timeSpent: timeSpent ?? null,
      },
    });

    // Calculate result
    const resultData = await calculateExamResult(examId, user.id);

    // Save result
    const examResult = await prisma.examResult.create({
      data: {
        examId,
        userId: user.id,
        totalScore: resultData.totalScore,
        grammarScore: resultData.grammarScore,
        vocabScore: resultData.vocabScore,
        readingScore: resultData.readingScore,
        listeningScore: resultData.listeningScore,
        totalCorrect: resultData.totalCorrect,
        totalWrong: resultData.totalWrong,
        totalSkipped: resultData.totalSkipped,
        accuracyRate: resultData.accuracyRate,
        vsLastExam: resultData.vsLastExam,
        isPersonalBest: resultData.isPersonalBest,
        aiAnalysis: resultData.aiAnalysis,
        weakTopics: resultData.weakTopics,
        strongTopics: resultData.strongTopics,
      },
    });

    // Fire-and-forget integrations
    void logExamCompletion(user.id, resultData.totalScore, exam.mode, exam.level, resultData.isPersonalBest);
    void syncExamToMemory(user.id, resultData.weakTopics);

    // Auto-tick quests
    void (async () => {
      try {
        const { autoTickQuest } = await import("@/lib/auto-quest");
        await autoTickQuest(user.id, "exam_complete");
        if (resultData.vsLastExam != null && resultData.vsLastExam > 0) {
          await autoTickQuest(user.id, "exam_improvement");
        }
      } catch { /* non-blocking */ }
    })();

    // Level recommendation (16B.8)
    let levelRecommendation: string | null = null;
    try {
      levelRecommendation = await getLevelRecommendation(user.id, exam.level);
    } catch { /* non-blocking */ }

    return NextResponse.json({
      result: {
        ...examResult,
        sectionScores: resultData.sectionScores,
        levelRecommendation,
      },
    });
  } catch (error) {
    console.error("POST /api/exam/submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
