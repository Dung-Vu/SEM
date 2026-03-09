import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLevelFromExp } from "@/lib/exp";
import { logEvent } from "@/lib/analytics";

// GET — List shadowing sessions
export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const sessions = await prisma.activityLog.findMany({
      where: { userId: user.id, source: "shadowing" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      sessions: sessions.map((s) => {
        const parts = s.description.split("|");
        return {
          id: s.id,
          source: parts[0] || "",
          minutes: parseInt(parts[1] || "0"),
          rating: parseInt(parts[2] || "3"),
          date: s.createdAt.toISOString().slice(0, 10),
        };
      }),
    });
  } catch (error) {
    console.error("GET /api/shadow error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — Log a shadowing session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source, minutes: rawMin, rating: rawRating } = body as {
      source: unknown;
      minutes: unknown;
      rating: unknown;
    };

    // Input validation
    if (typeof source !== "string" || source.trim().length === 0) {
      return NextResponse.json({ error: "source must be a non-empty string" }, { status: 400 });
    }
    const minutes = Math.min(120, Math.max(1, Math.round(Number(rawMin) || 1)));
    const rating  = Math.min(5,   Math.max(1, Math.round(Number(rawRating) || 3)));

    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // EXP: 2 EXP per minute
    const expGain = Math.max(5, Math.floor(minutes * 2));
    const description = `${source}|${minutes}|${rating}`;
    const newExp = user.exp + expGain;
    const newLevel = getLevelFromExp(newExp);

    await prisma.$transaction([
      prisma.activityLog.create({
        data: {
          userId: user.id,
          source: "shadowing",
          amount: expGain,
          description,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { exp: newExp, level: newLevel },
      }),
    ]);

    // Phase 14: log analytics event
    void logEvent(user.id, "shadow_session", "listening", Math.min(100, rating * 25), minutes * 60, {
      source,
      rating,
      completed: true,
    });

    return NextResponse.json({ success: true, expGain });
  } catch (error) {
    console.error("POST /api/shadow error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
