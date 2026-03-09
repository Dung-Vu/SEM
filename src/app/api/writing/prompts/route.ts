import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCustomPrompt } from "@/lib/writing-grader";

// GET /api/writing/prompts — List prompts with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const level = searchParams.get("level");
    const topic = searchParams.get("topic");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (level) where.level = level;
    if (topic) where.topic = topic;

    const prompts = await prisma.writingPrompt.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error("GET /api/writing/prompts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/writing/prompts — Generate a custom prompt via AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, level, topic, focusSkill } = body as {
      type: string;
      level: string;
      topic?: string;
      focusSkill?: string;
    };

    if (!type || !level) {
      return NextResponse.json({ error: "type and level are required" }, { status: 400 });
    }

    const generated = await generateCustomPrompt({ type, level, topic, focusSkill });

    // Save to DB
    const prompt = await prisma.writingPrompt.create({
      data: {
        title: generated.title,
        instruction: generated.instruction,
        type,
        level,
        topic: topic || null,
        minWords: generated.minWords,
        maxWords: generated.maxWords,
        timeLimit: generated.timeLimit,
        isAiGenerated: true,
      },
    });

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error("POST /api/writing/prompts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
