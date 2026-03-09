import { CONVERSATION_MODES, type ConversationMode } from "@/lib/ai-client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/analytics";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, mode } = body as {
      messages: ChatMessage[];
      mode: string;
    };

    const baseUrl =
      process.env.AI_BASE_URL ||
      "https://coding-intl.dashscope.aliyuncs.com/v1";
    const apiKey = process.env.AI_API_KEY || "";
    const model = process.env.AI_MODEL || "qwen3.5-plus";

    if (!apiKey) {
      return NextResponse.json({ error: "AI_API_KEY not configured" }, { status: 500 });
    }

    const modeConfig = CONVERSATION_MODES[mode as ConversationMode];
    if (!modeConfig) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    // Log speak_session_start when this is the first user message
    if (messages.length === 1 && messages[0].role === "user") {
      void (async () => {
        try {
          const user = await prisma.user.findFirst();
          if (user) {
            await logEvent(user.id, "speak_session_start", "speaking", undefined, undefined, { mode });
          }
        } catch { /* non-blocking */ }
      })();
    }

    const systemMessage: ChatMessage = {
      role: "system",
      content: modeConfig.systemPrompt,
    };

    const allMessages: ChatMessage[] = [systemMessage, ...messages];

    // Call upstream API with stream: true
    const upstream = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: allMessages,
        max_tokens: 500,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!upstream.ok) {
      const error = await upstream.text();
      return NextResponse.json(
        { error: `AI API error: ${upstream.status}`, details: error },
        { status: 503 }
      );
    }

    if (!upstream.body) {
      return NextResponse.json({ error: "No stream body" }, { status: 500 });
    }

    // Pipe the SSE stream directly to the client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              break;
            }
            // Forward raw SSE chunks as-is
            controller.enqueue(value);
          }
        } catch (err) {
          controller.error(err);
        }
      },
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
