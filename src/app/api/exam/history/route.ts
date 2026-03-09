import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLevelRecommendation } from "@/lib/exam-generator";

// GET /api/exam/history — Exam history + stats + review data
export async function GET(request: NextRequest) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get("examId");

    // Single exam review (with full answers + explanations)
    if (examId) {
      const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: {
          answers: {
            include: {
              question: true,
            },
            orderBy: { question: { section: "asc" } },
          },
          result: true,
        },
      });

      if (!exam || exam.userId !== user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      // Level recommendation
      let levelRecommendation: string | null = null;
      try {
        levelRecommendation = await getLevelRecommendation(user.id, exam.level);
      } catch { /* non-blocking */ }

      return NextResponse.json({
        exam: {
          id: exam.id,
          level: exam.level,
          mode: exam.mode,
          sections: exam.sections,
          timeLimit: exam.timeLimit,
          timeSpent: exam.timeSpent,
          status: exam.status,
          startedAt: exam.startedAt?.toISOString() ?? null,
          submittedAt: exam.submittedAt?.toISOString() ?? null,
        },
        result: exam.result ? { ...exam.result, levelRecommendation } : null,
        answers: exam.answers.map(a => ({
          questionId: a.questionId,
          section: a.question.section,
          level: a.question.level,
          topic: a.question.topic,
          passage: a.question.passage,
          question: a.question.question,
          optionA: a.question.optionA,
          optionB: a.question.optionB,
          optionC: a.question.optionC,
          optionD: a.question.optionD,
          correct: a.question.correct,
          explanation: a.question.explanation,
          userAnswer: a.userAnswer,
          isCorrect: a.isCorrect,
          timeSpent: a.timeSpent,
          flagged: a.flagged,
        })),
      });
    }

    // List mode: recent exams + stats
    const results = await prisma.examResult.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        exam: { select: { level: true, mode: true, sections: true, timeSpent: true, createdAt: true } },
      },
    });

    // Section averages
    const sectionAvgs: Record<string, { sum: number; count: number }> = {};
    const allWeakTopics: Record<string, number> = {};

    for (const r of results) {
      if (r.grammarScore > 0) {
        if (!sectionAvgs.grammar) sectionAvgs.grammar = { sum: 0, count: 0 };
        sectionAvgs.grammar.sum += r.grammarScore;
        sectionAvgs.grammar.count++;
      }
      if (r.vocabScore > 0) {
        if (!sectionAvgs.vocabulary) sectionAvgs.vocabulary = { sum: 0, count: 0 };
        sectionAvgs.vocabulary.sum += r.vocabScore;
        sectionAvgs.vocabulary.count++;
      }
      if (r.readingScore > 0) {
        if (!sectionAvgs.reading) sectionAvgs.reading = { sum: 0, count: 0 };
        sectionAvgs.reading.sum += r.readingScore;
        sectionAvgs.reading.count++;
      }
      if (r.listeningScore > 0) {
        if (!sectionAvgs.listening) sectionAvgs.listening = { sum: 0, count: 0 };
        sectionAvgs.listening.sum += r.listeningScore;
        sectionAvgs.listening.count++;
      }

      for (const t of r.weakTopics) {
        allWeakTopics[t] = (allWeakTopics[t] ?? 0) + 1;
      }
    }

    const sectionPerformance = Object.entries(sectionAvgs).map(([section, { sum, count }]) => ({
      section,
      avg: Math.round(sum / count),
    }));

    const topWeakTopics = Object.entries(allWeakTopics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));

    // Score trend (last 10)
    const scoreTrend = results.slice(0, 10).reverse().map(r => ({
      date: r.createdAt.toISOString().slice(0, 10),
      score: r.totalScore,
      level: r.exam.level,
    }));

    return NextResponse.json({
      totalExams: results.length,
      avgScore: results.length > 0
        ? Math.round(results.reduce((s, r) => s + r.totalScore, 0) / results.length)
        : 0,
      bestScore: results.length > 0 ? Math.max(...results.map(r => r.totalScore)) : 0,
      sectionPerformance,
      topWeakTopics,
      scoreTrend,
      recentExams: results.slice(0, 10).map(r => ({
        id: r.examId,
        totalScore: r.totalScore,
        level: r.exam.level,
        mode: r.exam.mode,
        timeSpent: r.exam.timeSpent,
        isPersonalBest: r.isPersonalBest,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/exam/history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
