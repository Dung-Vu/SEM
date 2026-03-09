import { prisma } from "@/lib/prisma";

// ─── Event Type Enum ──────────────────────────────────────────────────────

export type LearningEventType =
  // Anki
  | "anki_card_reviewed"
  | "anki_session_complete"
  | "anki_word_added"
  // Speak
  | "speak_session_start"
  | "speak_session_end"
  | "speak_correction"
  // Quest
  | "quest_completed"
  // Journal
  | "journal_written"
  // Shadow
  | "shadow_session"
  // Check-in
  | "daily_checkin"
  // Milestone
  | "milestone_unlocked";

// ─── logEvent() ───────────────────────────────────────────────────────────

export async function logEvent(
  userId: string,
  type: LearningEventType,
  skill?: string,
  score?: number,
  durationSec?: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.learningEvent.create({
      data: {
        userId,
        eventType: type,
        skill: skill ?? null,
        score: score ?? null,
        durationSec: durationSec ?? null,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  } catch {
    // Non-blocking — analytics should never break core functionality
  }
}

// ─── Query helpers (used by profile engine) ───────────────────────────────

export async function getRecentEvents(userId: string, days: number) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return prisma.learningEvent.findMany({
    where: { userId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getEventsByType(
  userId: string,
  type: LearningEventType,
  days: number
) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return prisma.learningEvent.findMany({
    where: { userId, eventType: type, createdAt: { gte: since } },
    orderBy: { createdAt: "asc" },
  });
}

export async function countEventsByDay(userId: string, days: number) {
  // Returns map of date-string → { totalMinutes, totalEvents }
  // Uses UTC+7 local date (Vietnam timezone) instead of UTC ISO to prevent off-by-one errors
  const TZ_OFFSET_MS = parseInt(process.env.USER_TIMEZONE_OFFSET_MINS ?? "420") * 60000;
  const events = await getRecentEvents(userId, days);
  const map: Record<string, { totalMin: number; events: number }> = {};

  for (const e of events) {
    const localDate = new Date(e.createdAt.getTime() + TZ_OFFSET_MS);
    const dateKey = localDate.toISOString().slice(0, 10);
    if (!map[dateKey]) map[dateKey] = { totalMin: 0, events: 0 };
    map[dateKey].events++;
    if (e.durationSec) map[dateKey].totalMin += Math.round(e.durationSec / 60);
  }

  return map;
}
