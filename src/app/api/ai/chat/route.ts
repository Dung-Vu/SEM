import { NextResponse } from "next/server";
import { chatCompletion, generateSessionSummary, CONVERSATION_MODES, type ConversationMode } from "@/lib/ai-client";
import { getCurrentUser } from "@/lib/current-user";
import { consumeRateLimit, rateLimitKeyFromRequest } from "@/lib/rate-limit";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const rl = consumeRateLimit(rateLimitKeyFromRequest(request, user?.id ?? null), {
      bucket: "ai-chat",
      // 20/min, 600/day. Generous for normal study, blocks runaway loops.
      perMinute: 20,
      perDay: 600,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfterSec: rl.retryAfterSec },
        {
          status: 429,
          headers: {
            "Retry-After": String(rl.retryAfterSec),
            "X-RateLimit-Remaining-Minute": String(rl.remainingMinute),
            "X-RateLimit-Remaining-Day": String(rl.remainingDay),
          },
        }
      );
    }

    const body = await request.json();
    const { action, messages, mode, durationMinutes } = body;

    if (action === "chat") {
      const clientMessages = normalizeMessages(messages);
      if (!clientMessages) {
        return NextResponse.json({ error: "messages must be an array of chat messages" }, { status: 400 });
      }

      // Regular chat. If the caller supplies its own system prompt, respect it
      // instead of prepending a conversation-mode prompt that can override task intent.
      const modeConfig = CONVERSATION_MODES[mode as ConversationMode];
      const hasCustomSystemPrompt = clientMessages.some((m) => m.role === "system");
      if (!hasCustomSystemPrompt && !modeConfig) {
        return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
      }

      const allMessages: ChatMessage[] = hasCustomSystemPrompt
        ? clientMessages
        : [{ role: "system", content: modeConfig.systemPrompt }, ...clientMessages];

      try {
        const reply = await chatCompletion(allMessages);
        return NextResponse.json({ reply });
      } catch (aiError) {
        const errorMessage = aiError instanceof Error ? aiError.message : "AI service unavailable";
        console.error("AI chat completion error:", aiError);
        return NextResponse.json({
          error: "AI service unavailable",
          details: errorMessage,
          fallback: "⚠️ Cannot connect to AI. Please check your internet connection or API key."
        }, { status: 503 });
      }
    }

    if (action === "summary") {
      // Generate session summary
      try {
        const summary = await generateSessionSummary(
          messages || [],
          mode || "free_talk",
          durationMinutes || 0
        );
        return NextResponse.json({ summary });
      } catch (aiError) {
        console.error("AI summary generation error:", aiError);
        return NextResponse.json({
          summary: "Could not generate AI summary. Your session has been saved!",
          error: "Summary generation failed"
        });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("AI API error:", error);
    const message = error instanceof Error ? error.message : "AI service unavailable";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function normalizeMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value)) return null;

  const messages: ChatMessage[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const { role, content } = item as Record<string, unknown>;
    if (role !== "system" && role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    messages.push({ role, content });
  }
  return messages;
}
