import { prisma } from "@/lib/prisma";
import { getTutorMemory, updateTutorMemory } from "@/lib/tutor-memory";
import type { KnownVocab, VocabTarget } from "@/lib/tutor-memory";
import { logEvent } from "@/lib/analytics";

// ─── Sync Anki → Tutor Memory ──────────────────────────────────────────

/**
 * Sync mastered cards and due cards from Anki into TutorMemory.
 * Called after Anki review sessions.
 */
export async function syncVocabMemory(userId: string): Promise<void> {
  // 1. Mastered cards: status = 'mastered' OR high reviewsCount with good easeFactor
  const masteredCards = await prisma.srsCard.findMany({
    where: {
      userId,
      OR: [
        { status: "mastered" },
        { reviewsCount: { gte: 5 }, easeFactor: { gte: 2.3 } },
      ],
    },
    include: { word: true },
    take: 100,
    orderBy: { updatedAt: "desc" },
  });

  const knownVocab: KnownVocab[] = masteredCards.map(card => ({
    word: card.word.english,
    level: card.word.level,
    masteredAt: card.updatedAt.toISOString(),
    usedInSpeak: 0, // will be updated by trackVocabUsage
  }));

  // 2. Due cards (next 7 days) — these are active learning targets
  const sevenDaysLater = new Date(Date.now() + 7 * 864e5);
  const dueCards = await prisma.srsCard.findMany({
    where: {
      userId,
      nextReview: { lte: sevenDaysLater },
      status: { notIn: ["mastered"] },
    },
    include: { word: true },
    take: 20,
    orderBy: { nextReview: "asc" },
  });

  const activeTargets: VocabTarget[] = dueCards.map(card => ({
    word: card.word.english,
    definition: card.word.definition || card.word.vietnamese,
    level: card.word.level,
    dueDate: card.nextReview.toISOString(),
  }));

  // 3. Preserve existing usedInSpeak counts
  const memory = await getTutorMemory(userId);
  const existingUsage = new Map(
    memory.knownVocab.map(v => [v.word, v.usedInSpeak])
  );
  for (const v of knownVocab) {
    v.usedInSpeak = existingUsage.get(v.word) ?? 0;
  }

  await updateTutorMemory(userId, {
    knownVocab,
    activeVocabTargets: activeTargets,
  });
}

// ─── Track Vocab Usage in Speak ─────────────────────────────────────────

/**
 * Check if user used any target vocab words in their message.
 * Updates usage counts in TutorMemory.
 * Returns list of target words the user successfully used.
 */
export async function trackVocabUsage(
  userId: string,
  userMessage: string
): Promise<string[]> {
  const memory = await getTutorMemory(userId);
  const targets = memory.activeVocabTargets;
  if (targets.length === 0) return [];

  const lowerMsg = userMessage.toLowerCase();
  const usedWords = targets
    .filter(v => lowerMsg.includes(v.word.toLowerCase()))
    .map(v => v.word);

  if (usedWords.length > 0) {
    // Update known vocab usage counts
    const updatedKnown = memory.knownVocab.map(v => {
      if (usedWords.includes(v.word)) {
        return { ...v, usedInSpeak: v.usedInSpeak + 1 };
      }
      return v;
    });
    await updateTutorMemory(userId, { knownVocab: updatedKnown });

    // Log analytics event
    void logEvent(userId, "vocab_used_in_speak", "vocab", undefined, undefined, {
      words: usedWords,
    });
  }

  return usedWords;
}
