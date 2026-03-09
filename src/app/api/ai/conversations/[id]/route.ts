import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — Get a single conversation with all messages
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const conversation = await prisma.conversationSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: conversation.id,
      mode: conversation.mode,
      title: conversation.title,
      duration: conversation.duration,
      expGained: conversation.expGained,
      summary: conversation.summary,
      createdAt: conversation.createdAt.toISOString(),
      messages: conversation.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/ai/conversations/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
