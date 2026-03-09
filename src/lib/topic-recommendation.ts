import { prisma } from "@/lib/prisma";
import { getTutorMemory } from "@/lib/tutor-memory";

// ─── Types ──────────────────────────────────────────────────────────────

export interface SessionRecommendation {
  mode: string;
  reason: string;
  priority: number;
  level?: string;
}

// ─── Topic Recommendation Engine ────────────────────────────────────────

/**
 * Generate session recommendations based on error patterns, profile data,
 * and vocab targets. Returns top 3 sorted by priority.
 */
export async function recommendNextSession(
  userId: string
): Promise<SessionRecommendation[]> {
  const memory = await getTutorMemory(userId);
  const profile = await prisma.learningProfile.findUnique({ where: { userId } });

  const recommendations: SessionRecommendation[] = [];

  // Rule 1: Speaking score low → Free Talk for fluency
  if (profile && profile.speakingScore < 55) {
    recommendations.push({
      mode: "free_talk",
      reason: "Speaking score cần cải thiện — Free Talk giúp luyện fluency",
      priority: 10,
    });
  }

  // Rule 2: Tense errors > 5 → Shadow B1 to internalize grammar
  const tenseErrors = memory.errorPatterns.find(e => e.type === "tense");
  if (tenseErrors && tenseErrors.count > 5) {
    recommendations.push({
      mode: "shadowing",
      level: "B1",
      reason: `Lỗi thì xuất hiện ${tenseErrors.count} lần — Shadowing giúp internalize grammar`,
      priority: 8,
    });
  }

  // Rule 3: Many corrections per session → Guided Practice
  if (memory.errorPatterns.length > 3) {
    recommendations.push({
      mode: "role_play",
      reason: `Có ${memory.errorPatterns.length} loại lỗi khác nhau — Role Play giúp luyện trong context cụ thể`,
      priority: 6,
    });
  }

  // Rule 4: Low difficulty → Topic Discussion to build confidence
  if (memory.currentDifficulty <= 3) {
    recommendations.push({
      mode: "topic_discussion",
      reason: "Difficulty thấp — Topic Discussion giúp build confidence từng bước",
      priority: 5,
    });
  }

  // Rule 5: High difficulty → Job Interview or Debate for challenge
  if (memory.currentDifficulty >= 7) {
    recommendations.push({
      mode: "job_interview",
      reason: "Difficulty cao — Job Interview challenge speaking under pressure",
      priority: 7,
    });
  }

  // Rule 6: No session in 3+ days → gentle return
  if (memory.lastSessionAt) {
    const daysSince = Math.floor(
      (Date.now() - memory.lastSessionAt.getTime()) / 864e5
    );
    if (daysSince >= 3) {
      recommendations.push({
        mode: "free_talk",
        reason: `${daysSince} ngày chưa tập Speak — Free Talk nhẹ nhàng để warm up`,
        priority: 9,
      });
    }
  }

  // Rule 7: Grammar score low → Structured practice
  if (profile && profile.grammarScore < 45) {
    recommendations.push({
      mode: "shadowing",
      level: "B1",
      reason: "Grammar score thấp — Shadowing B1 scripts giúp nhập tâm cấu trúc câu",
      priority: 7,
    });
  }

  // Sort by priority desc, return top 3, deduplicate by mode
  const seen = new Set<string>();
  return recommendations
    .sort((a, b) => b.priority - a.priority)
    .filter(r => {
      if (seen.has(r.mode)) return false;
      seen.add(r.mode);
      return true;
    })
    .slice(0, 3);
}
