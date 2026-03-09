import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/writing/stats — Aggregated writing statistics
export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const submissions = await prisma.writingSubmission.findMany({
      where: { userId: user.id, overallScore: { not: null } },
      orderBy: { submittedAt: "desc" },
      include: { prompt: { select: { type: true, level: true, title: true } } },
    });

    if (submissions.length === 0) {
      return NextResponse.json({
        totalSubmissions: 0,
        avgScore: 0,
        bestScore: 0,
        improvementTrend: 0,
        strongestSkill: null,
        weakestSkill: null,
        commonErrors: [],
        scoreHistory: [],
        recentSubmissions: [],
      });
    }

    const totalSubmissions = submissions.length;
    const scores = submissions.map(s => s.overallScore!);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const bestScore = Math.max(...scores);

    // Improvement trend: avg of last 3 vs avg of 3 before that
    let improvementTrend = 0;
    if (submissions.length >= 4) {
      const recent3 = scores.slice(0, 3);
      const prev3 = scores.slice(3, 6);
      const recentAvg = recent3.reduce((a, b) => a + b, 0) / recent3.length;
      const prevAvg = prev3.reduce((a, b) => a + b, 0) / prev3.length;
      improvementTrend = Math.round(recentAvg - prevAvg);
    }

    // Strongest/weakest skill
    const skillAvgs = {
      grammar: avg(submissions.map(s => s.grammarScore).filter(nonNull)),
      vocabulary: avg(submissions.map(s => s.vocabScore).filter(nonNull)),
      coherence: avg(submissions.map(s => s.coherenceScore).filter(nonNull)),
      task: avg(submissions.map(s => s.taskScore).filter(nonNull)),
    };

    const skillEntries = Object.entries(skillAvgs).filter(([, v]) => v > 0);
    const strongestSkill = skillEntries.length > 0
      ? skillEntries.reduce((a, b) => a[1] > b[1] ? a : b)
      : null;
    const weakestSkill = skillEntries.length > 0
      ? skillEntries.reduce((a, b) => a[1] < b[1] ? a : b)
      : null;

    // Common errors (aggregate from all submissions)
    const errorCounts: Record<string, number> = {};
    for (const sub of submissions) {
      const errors = sub.grammarErrors as Array<{ type?: string }> | null;
      if (Array.isArray(errors)) {
        for (const e of errors) {
          const t = e.type ?? "other";
          errorCounts[t] = (errorCounts[t] ?? 0) + 1;
        }
      }
    }
    const commonErrors = Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    // Score history for chart (last 20)
    const scoreHistory = submissions.slice(0, 20).reverse().map(s => ({
      date: s.submittedAt.toISOString().slice(0, 10),
      overall: s.overallScore,
      grammar: s.grammarScore,
      vocab: s.vocabScore,
      coherence: s.coherenceScore,
      task: s.taskScore,
      type: s.prompt?.type ?? "custom",
    }));

    // Recent submissions (last 10)
    const recentSubmissions = submissions.slice(0, 10).map(s => ({
      id: s.id,
      title: s.prompt?.title ?? "Custom",
      type: s.prompt?.type ?? "custom",
      level: s.prompt?.level ?? "?",
      overallScore: s.overallScore,
      isPersonalBest: s.isPersonalBest,
      submittedAt: s.submittedAt.toISOString(),
    }));

    return NextResponse.json({
      totalSubmissions,
      avgScore,
      bestScore,
      improvementTrend,
      strongestSkill: strongestSkill ? { skill: strongestSkill[0], score: strongestSkill[1] } : null,
      weakestSkill: weakestSkill ? { skill: weakestSkill[0], score: weakestSkill[1] } : null,
      commonErrors,
      scoreHistory,
      recentSubmissions,
    });
  } catch (error) {
    console.error("GET /api/writing/stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────

function nonNull(v: number | null): v is number {
  return v !== null;
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}
