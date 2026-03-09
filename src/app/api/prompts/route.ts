import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get("level");
    const modeKey = searchParams.get("mode");

    // ConversationPrompt table uses raw SQL since it's managed outside Prisma schema
    const whereConditions: string[] = [];
    const params: string[] = [];

    if (level) {
      params.push(level);
      whereConditions.push(`"level" = $${params.length}`);
    }
    if (modeKey) {
      params.push(modeKey);
      whereConditions.push(`"modeKey" = $${params.length}`);
    }

    const where = whereConditions.length ? `WHERE ${whereConditions.join(" AND ")}` : "";
    const query = `SELECT * FROM "ConversationPrompt" ${where} ORDER BY "level" ASC, "title" ASC`;

    const prompts = await prisma.$queryRawUnsafe<{
      id: string; modeKey: string; title: string; level: string;
      systemPrompt: string; starterMessage: string; topic: string; tags: string;
    }[]>(query, ...params);

    return NextResponse.json({ prompts });
  } catch {
    // Table may not exist yet - return empty
    return NextResponse.json({ prompts: [] });
  }
}
