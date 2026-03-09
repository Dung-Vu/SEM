import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/analytics/activity-stream — Returns 10 most recent learning events with human-readable labels
export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const events = await prisma.learningEvent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const now = new Date();

    function relativeTime(date: Date): string {
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 60) return diffMin <= 1 ? "Just now" : `${diffMin}m ago`;
      const diffH = Math.floor(diffMin / 60);
      if (diffH < 24) return `${diffH}h ago`;
      const diffD = Math.floor(diffH / 24);
      if (diffD === 1) return "Yesterday";
      return `${diffD}d ago`;
    }

    function labelEvent(event: {
      eventType: string;
      skill: string | null;
      score: number | null;
      durationSec: number | null;
      metadata: unknown;
      createdAt: Date;
    }) {
      const meta = (event.metadata ?? {}) as Record<string, unknown>;
      switch (event.eventType) {
        case "anki_card_reviewed":
          return {
            icon: "BookOpen",
            text: `Anki review${meta.rating ? ` · Rating ${meta.rating}` : ""}`,
            time: relativeTime(event.createdAt),
          };
        case "anki_session_complete": {
          const total = meta.cards_total ?? "?";
          const mastered = meta.cards_mastered ?? "?";
          return {
            icon: "BookOpen",
            text: `Anki session · ${total} cards · ${mastered} mastered`,
            time: relativeTime(event.createdAt),
          };
        }
        case "anki_word_added":
          return {
            icon: "Plus",
            text: `Added word: ${meta.word ?? ""}${meta.level ? ` (${meta.level})` : ""}`,
            time: relativeTime(event.createdAt),
          };
        case "speak_session_end": {
          const dur = event.durationSec ? `${Math.round(event.durationSec / 60)} min` : "";
          const msgs = meta.message_count ? ` · ${meta.message_count} messages` : "";
          return {
            icon: "Mic2",
            text: `Speak session${meta.mode ? ` · ${meta.mode}` : ""}${dur ? ` · ${dur}` : ""}${msgs}`,
            time: relativeTime(event.createdAt),
          };
        }
        case "speak_session_start":
          return {
            icon: "Mic2",
            text: `Started Speak${meta.mode ? ` · ${meta.mode}` : ""}`,
            time: relativeTime(event.createdAt),
          };
        case "speak_correction":
          return {
            icon: "PenLine",
            text: `Correction: ${meta.original ?? ""} → ${meta.corrected ?? ""}`,
            time: relativeTime(event.createdAt),
          };
        case "quest_completed":
          return {
            icon: "Swords",
            text: `Quest completed${meta.quest_type ? ` · ${meta.quest_type}` : ""}${meta.exp_gained ? ` · +${meta.exp_gained} EXP` : ""}`,
            time: relativeTime(event.createdAt),
          };
        case "journal_written":
          return {
            icon: "PenLine",
            text: `Journal entry${meta.word_count ? ` · ${meta.word_count} words` : ""}`,
            time: relativeTime(event.createdAt),
          };
        case "shadow_session":
          return {
            icon: "Headphones",
            text: `Shadow session${event.durationSec ? ` · ${Math.round(event.durationSec / 60)} min` : ""}`,
            time: relativeTime(event.createdAt),
          };
        case "daily_checkin":
          return {
            icon: "Flame",
            text: `Daily check-in${meta.streak_day ? ` · Day ${meta.streak_day}` : ""}`,
            time: relativeTime(event.createdAt),
          };
        case "milestone_unlocked":
          return {
            icon: "Trophy",
            text: `Milestone unlocked${meta.milestone_id ? `: ${meta.milestone_id}` : ""}`,
            time: relativeTime(event.createdAt),
          };
        default:
          return {
            icon: "Activity",
            text: event.eventType.replace(/_/g, " "),
            time: relativeTime(event.createdAt),
          };
      }
    }

    const stream = events.map((e) => ({
      id: e.id,
      ...labelEvent(e),
    }));

    return NextResponse.json({ stream });
  } catch (error) {
    console.error("GET /api/analytics/activity-stream error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
