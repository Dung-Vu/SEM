import { CONVERSATION_MODES, type ConversationMode } from "@/lib/ai-client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { logEvent } from "@/lib/analytics";
import { buildSenseiSystemPrompt } from "@/lib/sensei-prompt";
import { consumeRateLimit, rateLimitKeyFromRequest } from "@/lib/rate-limit";
import { aiCallStream } from "@/lib/ai-call";
import { sanitizeUserContentWrapped, TRUST_BOUNDARY_REMINDER } from "@/lib/ai-guard";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const rl = consumeRateLimit(rateLimitKeyFromRequest(request, user?.id ?? null), {
      bucket: "ai-chat-stream",
      // Streaming is the heaviest path. Cap lower than chat.
      perMinute: 10,
      perDay: 300,
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
    const { messages, mode } = body as {
      messages: ChatMessage[];
      mode: string;
    };

    const apiKey = process.env.AI_API_KEY || "";

    if (!apiKey) {
      return NextResponse.json({ error: "AI_API_KEY not configured" }, { status: 500 });
    }

    const modeConfig = CONVERSATION_MODES[mode as ConversationMode];
    if (!modeConfig) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    // Sanitize user-supplied content before it reaches the model. Wraps
    // injection-shaped lines in <user_input> delimiters and clamps length.
    const safeMessages: ChatMessage[] = Array.isArray(messages)
      ? messages.map((m) =>
          m.role === "user"
            ? { ...m, content: sanitizeUserContentWrapped(m.content).content }
            : m
        )
      : [];
    let injectionSuspected = false;
    for (const m of safeMessages) {
      if (m.role !== "user") continue;
      const r = sanitizeUserContentWrapped(m.content);
      if (r.injectionSuspected) injectionSuspected = true;
    }

    // Log speak_session_start when this is the first user message
    if (user && safeMessages.length === 1 && safeMessages[0].role === "user") {
      void logEvent(user.id, "speak_session_start", "speaking", undefined, undefined, { mode });
    }

    // Phase 15: SENSEI memory-aware system prompt
    let systemContent: string = modeConfig.systemPrompt;
    if (user) {
      try {
        systemContent = await buildSenseiSystemPrompt(user.id, mode);
      } catch {
        // Fallback to static prompt if SENSEI fails
      }
    }

    if (injectionSuspected) {
      systemContent = `${systemContent}\n\n${TRUST_BOUNDARY_REMINDER}`;
    }

    const systemMessage: ChatMessage = {
      role: "system",
      content: systemContent,
    };

    const allMessages: ChatMessage[] = [systemMessage, ...safeMessages];

    // Delegate to aiCallStream — handles timeout, retries, and SSE proxy.
    const stream = aiCallStream({
      messages: allMessages,
      maxTokens: 1000,
      temperature: 0.8,
      userId: user?.id ?? null,
      route: "ai-chat-stream",
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Streaming API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
