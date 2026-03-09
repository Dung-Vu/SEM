import { prisma } from "@/lib/prisma";
import { getTutorMemory } from "@/lib/tutor-memory";
import { DIFFICULTY_PROMPTS } from "@/lib/difficulty-engine";

// ─── SENSEI System Prompt Builder ───────────────────────────────────────

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
