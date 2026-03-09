import { getTutorMemory, updateTutorMemory } from "@/lib/tutor-memory";

// ─── Performance Scoring ────────────────────────────────────────────────

interface SessionMetrics {
  correctionsCount: number;
  messageCount: number;
  durationSec: number;
  vocabTargetsUsed: number;
  vocabTargetsAvailable: number;
  totalUserChars: number;
}

/**
 * Calculate a 0-100 performance score for a Speak session.
 *
 * Weights:
 * - Corrections rate: 40% (fewer = better)
 * - Session duration: 25% (10 min = 100%)
 * - Vocab usage: 20% (used target vocab = good retention)
 * - Message length: 15% (longer = more confident)
 */
export function calcSessionPerformance(metrics: SessionMetrics): number {
  const { correctionsCount, messageCount, durationSec, vocabTargetsUsed, vocabTargetsAvailable, totalUserChars } = metrics;

  // 1. Corrections rate (40%)
  const correctionsPerMsg = correctionsCount / Math.max(messageCount, 1);
  const correctionScore = Math.max(0, 100 - correctionsPerMsg * 25);

  // 2. Duration (25%) — 10 min = 100
  const durationScore = Math.min(100, (durationSec / 600) * 100);

  // 3. Vocab usage (20%)
  const vocabScore = vocabTargetsAvailable > 0
    ? (vocabTargetsUsed / vocabTargetsAvailable) * 100
    : 70; // default when no targets

  // 4. Message length (15%) — 80 chars avg = good
  const avgMsgLength = messageCount > 0 ? totalUserChars / messageCount : 0;
  const lengthScore = Math.min(100, (avgMsgLength / 80) * 100);

  return Math.round(
    correctionScore * 0.40 +
    durationScore * 0.25 +
    vocabScore * 0.20 +
    lengthScore * 0.15
  );
}

// ─── Adaptive Difficulty ────────────────────────────────────────────────

/**
 * Auto-adjust difficulty (1-10) based on performance.
 * - Performance >= 85 → difficulty + 1
 * - Performance <= 45 → difficulty - 1
 * - 46-84 → keep current
 *
 * Returns the new difficulty level.
 */
export async function adjustDifficulty(
  userId: string,
  performanceScore: number
): Promise<number> {
  const memory = await getTutorMemory(userId);

  if (!memory.autoAdjust) return memory.currentDifficulty;

  let difficulty = memory.currentDifficulty;

  if (performanceScore >= 85) {
    difficulty = Math.min(10, difficulty + 1);
  } else if (performanceScore <= 45) {
    difficulty = Math.max(1, difficulty - 1);
  }

  const history = [
    ...memory.difficultyHistory,
    {
      date: new Date().toISOString(),
      score: performanceScore,
      difficulty,
    },
  ].slice(-20); // keep 20 most recent

  await updateTutorMemory(userId, {
    currentDifficulty: difficulty,
    difficultyHistory: history,
  });

  return difficulty;
}

// ─── Difficulty → AI Behavior Mapping ───────────────────────────────────

export const DIFFICULTY_PROMPTS: Record<number, string> = {
  1: "Use very simple sentences, A2 vocab. Correct errors gently, explain clearly in Vietnamese.",
  2: "Use simple sentences, A2–B1 vocab. Correct important errors only.",
  3: "B1 vocab. Ask simple follow-up questions.",
  4: "B1 vocab. Follow-up questions. Correct grammar errors.",
  5: "B1–B2 vocab. More complex sentences. Ask user to elaborate.",
  6: "B2 vocab. Use simple idioms. Challenge user to explain more.",
  7: "B2 vocab. Use idioms. Ask for reasoning and opinions.",
  8: "B2–C1 vocab. Debate-style. Lightly challenge user's opinions.",
  9: "C1 vocab. Strong counterarguments. Require precise language.",
  10: "C1–C2 vocab. Native-speed conversation. Do not simplify.",
};
