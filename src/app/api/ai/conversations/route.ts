import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { logEvent } from "@/lib/analytics";
import { processSessionEnd } from "@/lib/session-debrief";
import { awardExp } from "@/lib/exp";

// GET — List all conversation sessions
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const conversations = await prisma.conversationSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 1,
          where: { role: "assistant" },
        },
      },
    });

    return NextResponse.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        mode: c.mode,
        title: c.title,
        duration: c.duration,
        expGained: c.expGained,
        summary: c.summary,
        preview: c.messages[0]?.content.slice(0, 100) ?? "",
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/ai/conversations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — Save a conversation session
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const { mode, title, duration, expGained, summary, messages } = body as {
      mode: string;
      title: string;
      duration: number;
      expGained: number;
      summary: string;
      messages: { role: string; content: string }[];
    };

    const safeExp = Math.max(0, Math.min(500, Math.round(Number(expGained) || 0)));
    const session = await prisma.$transaction(async (tx) => {
      const created = await tx.conversationSession.create({
        data: {
          userId: user.id,
          mode,
          title: title || `${mode} conversation`,
          duration: duration || 0,
          expGained: safeExp,
          summary: summary || "",
          messages: {
            create: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          },
        },
        include: { messages: true },
      });

      if (safeExp > 0) {
        await awardExp(tx, user.id, safeExp);
        await tx.activityLog.create({
          data: {
            userId: user.id,
            source: "ai_conversation",
            amount: safeExp,
            description: `AI Conversation (${title || mode}, ${Math.floor((duration || 0) / 60)} min)`,
          },
        });
      }

      return created;
    });

    // Phase 14: log analytics event
    void logEvent(
      user.id,
      "speak_session_end",
      "speaking",
      undefined,
      duration || 0,
      {
        mode,
        message_count: messages.length,
        duration_sec: duration || 0,
      }
    );

    // Phase 15: SENSEI post-session processing
    let debrief = null;
    try {
      debrief = await processSessionEnd(user.id, session.id, {
        mode,
        durationSec: duration || 0,
        messages,
      });
    } catch (err) {
      console.error("SENSEI processSessionEnd error:", err);
    }

    return NextResponse.json({ success: true, id: session.id, debrief });
  } catch (error) {
    console.error("POST /api/ai/conversations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
