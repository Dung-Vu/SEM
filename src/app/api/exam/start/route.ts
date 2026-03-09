import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assembleFullExam, assembleQuickExam, assembleSectionExam, shouldUseAdaptive, buildAdaptiveExam } from "@/lib/exam-generator";

// POST /api/exam/start — Create a new exam
export async function POST(request: NextRequest) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const { level, mode, section } = body as {
      level: string;
      mode: string; // full | quick | section
      section?: string; // required if mode === 'section'
    };

    if (!level || !mode) {
      return NextResponse.json({ error: "level and mode are required" }, { status: 400 });
    }

    if (mode === "section" && !section) {
      return NextResponse.json({ error: "section is required for section mode" }, { status: 400 });
    }

    // Assemble questions based on mode
    let questions;
    let sections: string[] = [];
    let timeLimit = 60;

    switch (mode) {
      case "full": {
        const adaptive = await shouldUseAdaptive(user.id);
        questions = adaptive
          ? await buildAdaptiveExam(user.id, level)
          : await assembleFullExam(level, user.id);
        sections = ["grammar", "vocabulary", "reading", "listening"];
        timeLimit = 60;
        break;
      }
      case "quick":
        questions = await assembleQuickExam(level, user.id);
        sections = ["grammar", "vocabulary", "reading", "listening"];
        timeLimit = 30;
        break;
      case "section":
        questions = await assembleSectionExam(level, section!, user.id);
        sections = [section!];
        timeLimit = 15;
        break;
      default:
        return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    if (questions.length === 0) {
      return NextResponse.json({ error: "Could not assemble exam questions" }, { status: 500 });
    }

    // Create exam
    const exam = await prisma.exam.create({
      data: {
        userId: user.id,
        level,
        mode,
        sections,
        questionIds: questions.map(q => q.id),
        timeLimit,
        startedAt: new Date(),
        status: "in_progress",
      },
    });

    // Create answer rows (pre-populated, empty)
    await prisma.examAnswer.createMany({
      data: questions.map(q => ({
        examId: exam.id,
        questionId: q.id,
      })),
    });

    return NextResponse.json({
      examId: exam.id,
      timeLimit,
      totalQuestions: questions.length,
      questions: questions.map(q => ({
        id: q.id,
        section: q.section,
        level: q.level,
        topic: q.topic,
        passage: q.section === "listening" ? null : q.passage, // hide transcript for listening
        question: q.question,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        // DO NOT send correct answer or explanation
      })),
      // Send listening passages separately (for TTS only, not display)
      listeningPassages: questions
        .filter(q => q.section === "listening" && q.passage)
        .map(q => ({ questionId: q.id, transcript: q.passage })),
    });
  } catch (error) {
    console.error("POST /api/exam/start error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
