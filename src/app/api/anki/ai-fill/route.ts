import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST — AI fills word details (definition, example sentence, level)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { word } = body as { word: string };

    if (!word?.trim()) {
      return NextResponse.json({ error: "Word required" }, { status: 400 });
    }

    // Get AI configuration from settings
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const baseUrl = process.env.AI_BASE_URL;
    const apiKey = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL || "qwen-plus";

    if (!baseUrl || !apiKey) {
      return NextResponse.json({ error: "AI not configured" }, { status: 500 });
    }

    const systemPrompt = `You are an English vocabulary assistant helping Vietnamese learners.
Given an English word, respond with EXACTLY this JSON format (no markdown, no extra text):
{
  "vietnamese": "Vietnamese translation",
  "definition": "Clear English definition in 1 sentence",
  "exampleSentence": "A natural example sentence using the word",
  "level": "A1|A2|B1|B2|C1|C2",
  "tags": "comma,separated,tags"
}
Keep everything concise and helpful for a Vietnamese learner.`;

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Word: "${word.trim()}"` },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "";

    try {
      // Try to parse JSON from response
      const jsonMatch = reply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          success: true,
          vietnamese: parsed.vietnamese || "",
          definition: parsed.definition || "",
          exampleSentence: parsed.exampleSentence || "",
          level: parsed.level || "B1",
          tags: parsed.tags || "",
        });
      }
    } catch {
      // fallback
    }

    return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
  } catch (error) {
    console.error("POST /api/anki/ai-fill error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
