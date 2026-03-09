import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLevelFromExp } from "@/lib/exp";

// GET — List reading sessions
export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const sessions = await prisma.activityLog.findMany({
      where: {
        userId: user.id,
        source: "reading",
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      sessions: sessions.map((s) => {
        // Parse metadata from description format: "title|category|minutes|pages|notes"
        const parts = s.description.split("|");
        return {
          id: s.id,
          title: parts[0] || "",
          category: parts[1] || "book",
          minutes: parseInt(parts[2] || "0"),
          pages: parseInt(parts[3] || "0"),
          notes: parts[4] || "",
          date: s.createdAt.toISOString().slice(0, 10),
        };
      }),
    });
  } catch (error) {
    console.error("GET /api/reading error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — Log a reading session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, category, minutes, pages, notes } = body as {
      title: string;
      category: string;
      minutes: number;
      pages: number;
      notes: string;
    };

    if (!title) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // EXP: 1 EXP per minute, min 5
    const expGain = Math.max(5, Math.floor(minutes * 1));
    const description = `${title}|${category}|${minutes}|${pages}|${notes || ""}`;
    const newExp = user.exp + expGain;
    const newLevel = getLevelFromExp(newExp);

    await prisma.$transaction([
      prisma.activityLog.create({
        data: {
          userId: user.id,
          source: "reading",
          amount: expGain,
          description,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { exp: newExp, level: newLevel },
      }),
    ]);

    return NextResponse.json({ success: true, expGain });
  } catch (error) {
    console.error("POST /api/reading error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
