import { prisma } from "@/lib/prisma";
import { getTutorMemory } from "@/lib/tutor-memory";
import { DIFFICULTY_PROMPTS } from "@/lib/difficulty-engine";

// ─── Sprint 2: in-memory LRU cache for system prompts ────────────────────
// The system prompt only depends on (userId, mode, optional topic). Building it
// is several DB round-trips, so we cache the result for 5 minutes per key.
// Cache is best-effort — a builder failure must NEVER poison the cache and
// must NEVER crash the chat route, so the wrapper wraps in try/catch.

// Per-process counters. Exposed via /api/admin/sensei-cache-stats for runtime
// observability.
export const senseiCacheStats = {
  hits: 0,
  misses: 0,
  errors: 0,
};

const TTL_MS = 5 * 60_000; // 5 minutes
const MAX_ENTRIES = 50;

interface CacheEntry {
  expiresAt: number;
  topic: string | undefined;
  value: string;
}

const senseiCache = new Map<string, CacheEntry>();

function cacheKey(userId: string, mode: string, topic: string | undefined): string {
  // topic is part of the rendered prompt; include it in the key.
  return `${userId}::${mode}::${topic ?? ""}`;
}

function rememberEntry(key: string, entry: CacheEntry) {
  if (!senseiCache.has(key) && senseiCache.size >= MAX_ENTRIES) {
    // Map iteration order = insertion order → drop the oldest.
    const oldest = senseiCache.keys().next().value;
    if (oldest) senseiCache.delete(oldest);
  }
  senseiCache.set(key, entry);
}

/** Reset cache + counters. Tests-only. */
export function _resetSenseiCacheForTests(): void {
  senseiCache.clear();
  senseiCacheStats.hits = 0;
  senseiCacheStats.misses = 0;
  senseiCacheStats.errors = 0;
}

export interface SenseiCacheSnapshot {
  hits: number;
  misses: number;
  errors: number;
  size: number;
}

export function getSenseiCacheStats(): SenseiCacheSnapshot {
  return {
    hits: senseiCacheStats.hits,
    misses: senseiCacheStats.misses,
    errors: senseiCacheStats.errors,
    size: senseiCache.size,
  };
}

// ─── SENSEI System Prompt Builder ────────────────────────────────────────

/**
 * Build a memory-aware system prompt for Speak AI sessions.
 * Injects:
 * - Top 3 error patterns (persistent)
 * - Up to 10 active vocab targets
 * - Difficulty setting + behavior guide
 * - Last session summary
 * - Student strengths & weaknesses
 * - Personality config
 *
 * Target: ~800 tokens max system prompt.
 */
export async function buildSenseiSystemPrompt(
  userId: string,
  mode: string,
  topic?: string
): Promise<string> {
  const key = cacheKey(userId, mode, topic);
  const now = Date.now();
  const cached = senseiCache.get(key);
  if (cached && cached.expiresAt > now) {
    senseiCacheStats.hits++;
    // Touch — re-insert to mark as recently used. Cheap because the cache is
    // small (<=50 entries).
    senseiCache.delete(key);
    senseiCache.set(key, cached);
    return cached.value;
  }
  // Drop expired entry proactively.
  if (cached) senseiCache.delete(key);

  senseiCacheStats.misses++;
  try {
    const value = await buildSenseiSystemPromptUncached(userId, mode, topic);
    rememberEntry(key, { expiresAt: now + TTL_MS, topic, value });
    return value;
  } catch (err) {
    senseiCacheStats.errors++;
    console.error("[sensei-prompt] build failed; not caching:", err);
    throw err;
  }
}

async function buildSenseiSystemPromptUncached(
  userId: string,
  mode: string,
  topic?: string
): Promise<string> {
  const memory = await getTutorMemory(userId);

  // Get profile for overall level (from Phase 14)
  const profile = await prisma.learningProfile.findUnique({ where: { userId } });

  // Derive CEFR level from profile scores
  const overallScore = profile
    ? Math.round(
        (profile.vocabScore +
          profile.speakingScore +
          profile.listeningScore +
          profile.writingScore +
          profile.grammarScore) /
          5
      )
    : 50;
  const currentCEFR =
    overallScore >= 90
      ? "C2"
      : overallScore >= 80
        ? "C1"
        : overallScore >= 65
          ? "B2"
          : overallScore >= 50
            ? "B1"
            : overallScore >= 35
              ? "A2"
              : "A1";

  // Top 3 errors (sorted by count desc)
  const topErrors = memory.errorPatterns
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Active vocab targets (max 10)
  const vocabTargets = memory.activeVocabTargets.slice(0, 10);

  // Difficulty instruction
  const difficultyGuide =
    DIFFICULTY_PROMPTS[memory.currentDifficulty] ?? DIFFICULTY_PROMPTS[5];

  // Strictness mapping
  const strictnessGuide =
    memory.strictnessLevel === "strict"
      ? "Correct ALL errors you notice. Be direct and thorough."
      : memory.strictnessLevel === "gentle"
        ? "Only correct critical errors that impede understanding. Be very encouraging."
        : "Correct important errors but keep conversation flowing. Balance feedback with encouragement.";

  // Explanation language
  const langGuide =
    memory.explanationLanguage === "vi"
      ? "Always explain corrections in Vietnamese."
      : memory.explanationLanguage === "en"
        ? "Explain corrections in English only."
        : "Mix English and Vietnamese when explaining corrections.";

  // ─── Build prompt sections ─────────────────────────────────────────

  const sections: string[] = [];

  sections.push(`You are SENSEI, a personal English tutor.
Mode: ${mode}${topic ? ` — Topic: ${topic}` : ""}

## STUDENT PROFILE
- Level: ${currentCEFR} (performance-based, score ${overallScore}/100)
- Total speak sessions: ${memory.totalSessions}
- Last session: ${memory.lastSessionAt ? formatRelative(memory.lastSessionAt) : "First session"}${
    memory.lastSessionSummary
      ? `\n- Last session: ${memory.lastSessionSummary}`
      : ""
  }`);

  // Error patterns
  if (topErrors.length > 0) {
    const errLines = topErrors.map(
      (e) =>
        `- ${e.type}${e.subtype ? `/${e.subtype}` : ""}: ${e.count}× | Example: ${e.examples[0] ?? "N/A"}`
    );
    sections.push(`## KNOWN ERRORS (correct these when you see them)
${errLines.join("\n")}`);
  }

  // Vocab targets
  if (vocabTargets.length > 0 && memory.vocabReinforce) {
    const vocabLines = vocabTargets.map(
      (v) => `- "${v.word}" (${v.level}): ${v.definition}`
    );
    sections.push(`## VOCAB TO REINFORCE (weave naturally into conversation)
${vocabLines.join("\n")}
→ If user uses these words correctly, briefly affirm.`);
  }

  // Difficulty + behavior
  sections.push(`## DIFFICULTY: ${memory.currentDifficulty}/10
${difficultyGuide}`);

  // Strengths & weaknesses
  if (memory.strengths.length > 0 || memory.persistentWeaknesses.length > 0) {
    const lines: string[] = [];
    if (memory.strengths.length > 0) {
      lines.push(`Strengths: ${memory.strengths.join(", ")}`);
    }
    if (memory.persistentWeaknesses.length > 0) {
      lines.push(`Weaknesses: ${memory.persistentWeaknesses.join(", ")}`);
    }
    sections.push(`## STUDENT TRAITS
${lines.join("\n")}`);
  }

  // Response style
  sections.push(`## INSTRUCTIONS
- ${strictnessGuide}
- ${langGuide}
- After each user message: respond naturally. If there's an error from the patterns above, add: ❌ [original] → ✅ [corrected] (brief explanation)
- Do NOT correct every small error — focus on persistent patterns
- Keep conversation flowing naturally
- Help student practice ${mode} while subtly reinforcing weak areas`);

  return sections.join("\n\n").trim();
}

// ─── Helpers ────────────────────────────────────────────────────────────

function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "yesterday";
  return `${diffD} days ago`;
}
