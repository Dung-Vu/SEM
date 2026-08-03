import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { logEvent } from "@/lib/analytics";
import { processSessionEnd } from "@/lib/session-debrief";
import { awardExp } from "@/lib/exp";
import { consumeRateLimit, rateLimitKeyFromRequest } from "@/lib/rate-limit";
import type { Prisma } from "@prisma/client";

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

    const rl = consumeRateLimit(rateLimitKeyFromRequest(request, user.id), {
      bucket: "ai-conversations",
      // A user can complete many sessions per day but should not be able to
      // replay this endpoint to farm EXP.
      perMinute: 5,
      perDay: 100,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfterSec: rl.retryAfterSec },
        {
          status: 429,
          headers: {
            "Retry-After": String(rl.retryAfterSec),
          },
        }
      );
    }

    const body = await request.json();
    const { mode, title, duration, summary, messages } = body as {
      mode: string;
      title: string;
      duration: number;
      expGained: number;
      summary: string;
      messages: { role: string; content: string }[];
    };
    // Note: `expGained` is intentionally not read — we compute EXP server-side
    // from the validated duration (see safeExp below) to prevent client fraud.
    void (body as { expGained?: number }).expGained;

    // Cap volume to prevent DB bloat / DoS via huge payloads.
    if (Array.isArray(messages) && messages.length > 500) {
      return NextResponse.json({ error: "Too many messages" }, { status: 413 });
    }
    if (typeof summary === "string" && summary.length > 8000) {
      return NextResponse.json({ error: "Summary too long" }, { status: 413 });
    }

    // Compute EXP server-side from validated duration so the client cannot
    // inflate it. We keep a small cap (15/min) with a 500 ceiling, matching
    // the previous maximum.
    const safeDuration = Math.max(0, Math.min(60 * 60 * 4, Math.round(Number(duration) || 0)));
    const safeExp = Math.min(500, Math.round(safeDuration / 60) * 15);
    const session = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.conversationSession.create({
        data: {
          userId: user.id,
          mode,
          title: title || `${mode} conversation`,
          duration: safeDuration,
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
            description: `AI Conversation (${title || mode}, ${Math.floor(safeDuration / 60)} min)`,
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
      safeDuration,
      {
        mode,
        message_count: messages.length,
        duration_sec: safeDuration,
      }
    );

    // Phase 15: SENSEI post-session processing
    let debrief = null;
    try {
      debrief = await processSessionEnd(user.id, session.id, {
        mode,
        durationSec: safeDuration,
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
