import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gradeSubmission, getPreviousScore, checkPersonalBest, syncWritingToMemory } from "@/lib/writing-grader";
import { logEvent } from "@/lib/analytics";
import type { GrammarError } from "@/lib/writing-grader";

// POST /api/writing/submit — Submit writing → grade → save → integrations
export async function POST(request: NextRequest) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const { promptId, customPrompt, content, timeSpentSec } = body as {
      promptId?: string;
      customPrompt?: string;
      content: string;
      timeSpentSec?: number;
    };

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    // Get prompt info
    let promptInstruction = customPrompt || "Write about the given topic.";
    let promptType = "essay";
    let userLevel = "B1";

    if (promptId) {
      const prompt = await prisma.writingPrompt.findUnique({ where: { id: promptId } });
      if (prompt) {
        promptInstruction = prompt.instruction;
        promptType = prompt.type;
        userLevel = prompt.level;
      }
    }

    // Get previous score for comparison
    const previousScore = await getPreviousScore(user.id, promptType);

    // Grade with AI
    const gradingResult = await gradeSubmission(content, promptInstruction, userLevel, previousScore);

    const wordCount = content.trim().split(/\s+/).length;

    // Save submission
    const submission = await prisma.writingSubmission.create({
      data: {
        userId: user.id,
        promptId: promptId || null,
        customPrompt: customPrompt || null,
        content,
        wordCount,
        timeSpentSec: timeSpentSec || 0,
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
        improvementVsLast: gradingResult.improvementVsLast,
      },
    });

    // Check personal best
    const isPB = await checkPersonalBest(user.id, submission.id, gradingResult.overallScore, promptType);
    gradingResult.isPersonalBest = isPB;

    // Log analytics event
    void logEvent(user.id, "writing_submitted", "writing", gradingResult.overallScore, timeSpentSec || 0, {
      type: promptType,
      level: userLevel,
      wordCount,
      score: gradingResult.overallScore,
    });

    // Auto-tick quest (fire-and-forget)
    void (async () => {
      try {
        const { autoTickQuest } = await import("@/lib/auto-quest");
        await autoTickQuest(user.id, "writing_lab");
        if (gradingResult.improvementVsLast != null && gradingResult.improvementVsLast > 0) {
          await autoTickQuest(user.id, "writing_improvement");
        }
      } catch { /* non-blocking */ }
    })();

    // Sync writing errors to tutor memory (fire-and-forget)
    void syncWritingToMemory(user.id, gradingResult.grammarErrors as GrammarError[]);

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      result: gradingResult,
    });
  } catch (error) {
    console.error("POST /api/writing/submit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
