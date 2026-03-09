import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLevelFromExp } from "@/lib/exp";
import { logEvent } from "@/lib/analytics";

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

// GET — List journal entries
export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const entries = await prisma.journalEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Calendar data — dates with entries
    const calendarDates = entries.map((e) => e.date);

    // Stats
    const totalEntries = entries.length;
    const totalWords = entries.reduce((s, e) => s + e.wordCount, 0);
    const avgWords = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;

    // Journal streak — O(n) with Set instead of O(n²) with Array.includes
    let journalStreak = 0;
    const today = getTodayString();
    const dateSet = new Set(calendarDates);

    for (let i = 0; i < 365; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expected = expectedDate.toISOString().slice(0, 10);

      if (dateSet.has(expected)) {
        journalStreak++;
      } else {
        if (i === 0 && !dateSet.has(today)) {
          continue;
        }
        break;
      }
    }

    return NextResponse.json({
      entries: entries.map((e) => ({ ...e, createdAt: e.createdAt.toISOString(), updatedAt: e.updatedAt.toISOString() })),
      calendarDates,
      stats: { totalEntries, totalWords, avgWords, journalStreak },
    });
  } catch (error) {
    console.error("GET /api/journal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — Create/update journal entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content: rawContent, newWords, grammar, difficulty } = body as {
      content: unknown;
      newWords?: string;
      grammar?: string;
      difficulty?: string;
    };

    // Type guard — body.content must be a string
    if (typeof rawContent !== "string") {
      return NextResponse.json({ error: "content must be a string" }, { status: 400 });
    }
    const content = rawContent;

    if (!content || content.trim().length < 10) {
      return NextResponse.json({ error: "Entry must be at least 10 characters" }, { status: 400 });
    }

    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const today = getTodayString();
    const wordCount = content.trim().split(/\s+/).length;

    const entry = await prisma.journalEntry.upsert({
      where: { userId_date: { userId: user.id, date: today } },
      update: { content, wordCount, newWords: newWords ?? "", grammar: grammar ?? "", difficulty: difficulty ?? "medium", },
      create: { userId: user.id, content, wordCount, newWords: newWords ?? "", grammar: grammar ?? "", difficulty: difficulty ?? "medium", date: today, },
    });

    // Check if EXP already awarded today (prevent farming by re-saving)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const alreadyAwarded = await prisma.activityLog.findFirst({
      where: { userId: user.id, source: "journal", createdAt: { gte: todayStart } },
    });

    if (alreadyAwarded) {
      // Just update content, no EXP this time
      return NextResponse.json({ success: true, entry, expGain: 0, wordCount, newLevel: user.level, alreadyAwarded: true });
    }

    // Award EXP (25 for journal, bonus for 100+ words)
    const expGain = wordCount >= 100 ? 35 : 25;

    // Use transaction to avoid race condition
    const newExp = user.exp + expGain;
    const newLevel = getLevelFromExp(newExp);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { exp: newExp, level: newLevel },
    });

    await prisma.activityLog.create({
      data: { userId: user.id, source: "journal", amount: expGain, description: `\u270d\ufe0f Journal (${wordCount} words)` },
    });

    // Phase 14: log analytics event
    void logEvent(user.id, "journal_written", "writing", Math.min(100, Math.round(wordCount / 2)), Math.round(wordCount * 0.6), {
      word_count: wordCount,
    });

    return NextResponse.json({ success: true, entry, expGain, wordCount, newLevel: updatedUser.level });
  } catch (error) {
    console.error("POST /api/journal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
