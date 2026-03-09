import { prisma } from "@/lib/prisma";

// ─── Types ──────────────────────────────────────────────────────────────

export interface ErrorPattern {
  type: string;
  subtype?: string;
  count: number;
  lastSeen: string;
  examples: string[];
  trend: "increasing" | "decreasing" | "stable";
}

export interface VocabTarget {
  word: string;
  definition: string;
  level: string;
  dueDate?: string;
}

export interface KnownVocab {
  word: string;
  level: string;
  masteredAt: string;
  usedInSpeak: number;
}

export interface DifficultyEntry {
  date: string;
  score: number;
  difficulty: number;
}

export interface TutorMemoryData {
  id: string;
  userId: string;
  errorPatterns: ErrorPattern[];
  knownVocab: KnownVocab[];
  activeVocabTargets: VocabTarget[];
  currentDifficulty: number;
  difficultyHistory: DifficultyEntry[];
  autoAdjust: boolean;
  totalSessions: number;
  lastSessionAt: Date | null;
  lastSessionMode: string | null;
  lastSessionSummary: string | null;
  preferredTopics: string[];
  avoidTopics: string[];
  responseStyle: string;
  journeySummary: string | null;
  strengths: string[];
  persistentWeaknesses: string[];
  strictnessLevel: string;
  explanationLanguage: string;
  vocabReinforce: boolean;
}

// ─── CRUD Helpers ───────────────────────────────────────────────────────

/**
 * Get or create TutorMemory for a user.
 * Always returns a memory record (upserts on first access).
 */
export async function getTutorMemory(userId: string): Promise<TutorMemoryData> {
  const memory = await prisma.tutorMemory.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  return {
    ...memory,
    errorPatterns: parseJson<ErrorPattern[]>(memory.errorPatterns, []),
    knownVocab: parseJson<KnownVocab[]>(memory.knownVocab, []),
    activeVocabTargets: parseJson<VocabTarget[]>(memory.activeVocabTargets, []),
    difficultyHistory: parseJson<DifficultyEntry[]>(memory.difficultyHistory, []),
  };
}

/**
 * Partial update of TutorMemory fields.
 * JSON fields must be passed as already-serializable objects.
 */
export async function updateTutorMemory(
  userId: string,
  data: Partial<{
    errorPatterns: ErrorPattern[];
    knownVocab: KnownVocab[];
    activeVocabTargets: VocabTarget[];
    currentDifficulty: number;
    difficultyHistory: DifficultyEntry[];
    autoAdjust: boolean;
    totalSessions: number;
    lastSessionAt: Date;
    lastSessionMode: string;
    lastSessionSummary: string;
    preferredTopics: string[];
    avoidTopics: string[];
    responseStyle: string;
    journeySummary: string;
    strengths: string[];
    persistentWeaknesses: string[];
    strictnessLevel: string;
    explanationLanguage: string;
    vocabReinforce: boolean;
  }>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON fields need flexible typing
  const d = data as Record<string, any>;
  await prisma.tutorMemory.upsert({
    where: { userId },
    update: d,
    create: { userId, ...d },
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────

function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}
