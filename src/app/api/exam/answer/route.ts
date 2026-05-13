import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

// PATCH /api/exam/answer — Save a single answer
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const { examId, questionId, userAnswer, timeSpent, flagged } = body as {
      examId: string;
      questionId: string;
      userAnswer?: string | null;
      timeSpent?: number;
      flagged?: boolean;
    };

    if (typeof examId !== "string" || typeof questionId !== "string" || !examId || !questionId) {
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
    if (userAnswer !== undefined) {
      if (userAnswer !== null && !["A", "B", "C", "D"].includes(String(userAnswer).toUpperCase())) {
        return NextResponse.json({ error: "Invalid answer" }, { status: 400 });
      }
      update.userAnswer = userAnswer === null ? null : String(userAnswer).toUpperCase();
    }
    if (timeSpent !== undefined) {
      const safeTimeSpent = Number(timeSpent);
      if (!Number.isFinite(safeTimeSpent) || safeTimeSpent < 0) {
        return NextResponse.json({ error: "Invalid timeSpent" }, { status: 400 });
      }
      update.timeSpent = Math.min(24 * 60 * 60, Math.round(safeTimeSpent));
    }
    if (flagged !== undefined) {
      if (typeof flagged !== "boolean") {
        return NextResponse.json({ error: "Invalid flagged value" }, { status: 400 });
      }
      update.flagged = flagged;
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No answer update provided" }, { status: 400 });
    }

    const updated = await prisma.examAnswer.updateMany({
      where: { examId, questionId },
      data: update,
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "Question not found in exam" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/exam/answer error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
