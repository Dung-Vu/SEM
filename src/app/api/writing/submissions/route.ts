import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/writing/submissions — List user submissions or get single
export async function GET(request: NextRequest) {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // Single submission detail
    if (id) {
      const submission = await prisma.writingSubmission.findUnique({
        where: { id },
        include: {
          prompt: true,
          parentSubmission: { select: { id: true, overallScore: true, content: true } },
          rewrites: {
            select: { id: true, overallScore: true, submittedAt: true },
            orderBy: { submittedAt: "desc" },
          },
        },
      });

      if (!submission || submission.userId !== user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json({
        submission: {
          ...submission,
          grammarErrors: submission.grammarErrors ?? [],
          vocabSuggestions: submission.vocabSuggestions ?? [],
          strengths: submission.strengths ?? [],
          improvements: submission.improvements ?? [],
        },
      });
    }

    // List with optional type filter
    const type = searchParams.get("type");
    const limit = Number(searchParams.get("limit")) || 20;

    const where: Record<string, unknown> = { userId: user.id };
    if (type) {
      where.prompt = { type };
    }

    const submissions = await prisma.writingSubmission.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      take: limit,
      include: {
        prompt: { select: { title: true, type: true, level: true } },
      },
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("GET /api/writing/submissions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
