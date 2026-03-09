import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gradeSubmission, compareVersions, checkPersonalBest, syncWritingToMemory, getPreviousScore } from "@/lib/writing-grader";
import { logEvent } from "@/lib/analytics";
import type { GrammarError } from "@/lib/writing-grader";

// POST /api/writing/rewrite — Submit a rewrite, grade + compare with original
export async function POST(request: NextRequest) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const { parentSubmissionId, content, timeSpentSec } = body as {
      parentSubmissionId: string;
      content: string;
      timeSpentSec?: number;
    };

    if (!parentSubmissionId || !content || content.trim().length === 0) {
      return NextResponse.json({ error: "parentSubmissionId and content are required" }, { status: 400 });
    }

    // Load original submission
    const parent = await prisma.writingSubmission.findUnique({
      where: { id: parentSubmissionId },
      include: { prompt: true },
    });

    if (!parent || parent.userId !== user.id) {
      return NextResponse.json({ error: "Original submission not found" }, { status: 404 });
    }

    const promptInstruction = parent.prompt?.instruction ?? parent.customPrompt ?? "";
    const promptType = parent.prompt?.type ?? "essay";
    const userLevel = parent.prompt?.level ?? "B1";

    // Grade the rewrite
    const previousScore = await getPreviousScore(user.id, promptType);
    const gradingResult = await gradeSubmission(content, promptInstruction, userLevel, previousScore);

    // Compare versions
    const comparison = await compareVersions(parent.content, content);

    const wordCount = content.trim().split(/\s+/).length;

    // Save rewrite submission
    const submission = await prisma.writingSubmission.create({
      data: {
        userId: user.id,
        promptId: parent.promptId,
        content,
        wordCount,
        timeSpentSec: timeSpentSec || 0,
        parentSubmissionId,
        overallScore: gradingResult.overallScore,
        grammarScore: gradingResult.grammarScore,
        vocabScore: gradingResult.vocabScore,
        coherenceScore: gradingResult.coherenceScore,
        taskScore: gradingResult.taskScore,
        aiFeedback: gradingResult.aiFeedback,
        grammarErrors: gradingResult.grammarErrors as unknown as import("@prisma/client").Prisma.InputJsonValue,
        vocabSuggestions: gradingResult.vocabSuggestions as unknown as import("@prisma/client").Prisma.InputJsonValue,
        rewriteSample: gradingResult.rewriteSample || null,
        strengths: gradingResult.strengths as unknown as import("@prisma/client").Prisma.InputJsonValue,
        improvements: gradingResult.improvements as unknown as import("@prisma/client").Prisma.InputJsonValue,
        improvementVsLast: parent.overallScore != null ? gradingResult.overallScore - parent.overallScore : null,
      },
    });

    // Check personal best
    const isPB = await checkPersonalBest(user.id, submission.id, gradingResult.overallScore, promptType);
    gradingResult.isPersonalBest = isPB;

    // Log event
    void logEvent(user.id, "writing_submitted", "writing", gradingResult.overallScore, timeSpentSec || 0, {
      type: promptType,
      level: userLevel,
      wordCount,
      score: gradingResult.overallScore,
      isRewrite: true,
    });

    // Sync errors (fire-and-forget)
    void syncWritingToMemory(user.id, gradingResult.grammarErrors as GrammarError[]);

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      result: gradingResult,
      comparison,
    });
  } catch (error) {
    console.error("POST /api/writing/rewrite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
