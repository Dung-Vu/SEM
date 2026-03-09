import { NextResponse } from "next/server";
import { chatCompletion, generateSessionSummary, CONVERSATION_MODES, type ConversationMode } from "@/lib/ai-client";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, messages, mode, durationMinutes } = body;

    if (action === "chat") {
      // Regular chat
      const modeConfig = CONVERSATION_MODES[mode as ConversationMode];
      if (!modeConfig) {
        return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
      }

      const systemMessage: ChatMessage = {
        role: "system",
        content: modeConfig.systemPrompt,
      };

      const allMessages: ChatMessage[] = [systemMessage, ...messages];

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
