import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/exam/answer — Save a single answer
export async function PATCH(request: NextRequest) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const { examId, questionId, userAnswer, timeSpent, flagged } = body as {
      examId: string;
      questionId: string;
      userAnswer?: string | null;
      timeSpent?: number;
      flagged?: boolean;
    };

    if (!examId || !questionId) {
      return NextResponse.json({ error: "examId and questionId required" }, { status: 400 });
    }

    // Verify exam belongs to user and is in progress
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam || exam.userId !== user.id) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }
    if (exam.status !== "in_progress") {
      return NextResponse.json({ error: "Exam is not in progress" }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (userAnswer !== undefined) update.userAnswer = userAnswer;
    if (timeSpent !== undefined) update.timeSpent = timeSpent;
    if (flagged !== undefined) update.flagged = flagged;

    await prisma.examAnswer.update({
      where: { examId_questionId: { examId, questionId } },
      data: update,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/exam/answer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
