import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { awardExp } from "@/lib/exp";
import { getLocalDateKey } from "@/lib/streak";
import type { Prisma } from "@prisma/client";

// GET — List reading sessions
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
          date: getLocalDateKey(s.createdAt),
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
    const { title, category, minutes, pages, notes } = body as Record<string, unknown>;

    const safeMinutes = Math.min(240, Math.max(1, Math.round(Number(minutes) || 1)));
    const safePages = Math.max(0, Math.round(Number(pages) || 0));

    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }

    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // EXP: 1 EXP per minute, min 5
    const expGain = Math.max(5, safeMinutes);
    const safeTitle = title.trim().slice(0, 200);
    const safeCategory = typeof category === "string" && category.trim() ? category.trim().slice(0, 60) : "book";
    const safeNotes = typeof notes === "string" ? notes.trim().slice(0, 1000) : "";
    const description = `${safeTitle}|${safeCategory}|${safeMinutes}|${safePages}|${safeNotes}`;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.activityLog.create({
        data: {
          userId: user.id,
          source: "reading",
          amount: expGain,
          description,
        },
      });
      await awardExp(tx, user.id, expGain);
    });

    return NextResponse.json({ success: true, expGain });
  } catch (error) {
    console.error("POST /api/reading error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
