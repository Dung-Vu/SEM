import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level") ?? undefined;
    const modeKey = searchParams.get("mode") ?? undefined;

    const prompts = await prisma.conversationPrompt.findMany({
      where: {
        ...(level ? { level } : {}),
        ...(modeKey ? { modeKey } : {}),
      },
      orderBy: [{ level: "asc" }, { title: "asc" }],
    });

    return NextResponse.json({ prompts });
  } catch {
    return NextResponse.json({ prompts: [] });
  }
}
