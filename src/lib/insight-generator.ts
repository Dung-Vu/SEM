import { prisma } from "@/lib/prisma";
import { aiCall, parallelWithLimit } from "@/lib/ai-call";

type InsightType =
  | "weekly_summary"
  | "weakness_alert"
  | "strength_highlight"
  | "pattern_detected"
  | "prediction"
  | "recommendation"
  | "streak_analysis";

interface InsightProfile {
  vocabScore: number;
  speakingScore: number;
  writingScore: number;
  grammarScore: number;
  listeningScore: number;
  vocabVelocity: number;
  speakingVelocity: number;
  consistencyScore: number;
  avgCorrectionsPerSession: number;
  commonErrorTypes: string;
  bestTimeOfDay: string | null;
  weakestSkill: string | null;
  strongestSkill: string | null;
  ankiRetentionRate: number;
}

// Insights are short, low-stakes — use qwen-turbo for cost savings.
const INSIGHTS_MODEL = process.env.AI_MODEL_INSIGHTS ?? "qwen-turbo";
const INSIGHT_CONCURRENCY = 3; // Cap parallel upstream calls to 3.

function buildPrompt(
  type: InsightType,
  profile: InsightProfile,
  stats: {
    ankiSessions: number;
    retentionRate: number;
    speakSessions: number;
    journalCount: number;
    questsCompleted: number;
    speakMinutes: number;
  }
): string {
  const errors = JSON.parse(profile.commonErrorTypes || "[]").join(", ") || "không rõ";
  return `
Learning Profile:
- Vocab: ${profile.vocabScore}/100 (velocity: ${profile.vocabVelocity > 0 ? "+" : ""}${profile.vocabVelocity}/tuần)
- Speaking: ${profile.speakingScore}/100 (tb ${profile.avgCorrectionsPerSession.toFixed(1)} corrections/session)
- Writing: ${profile.writingScore}/100
- Grammar: ${profile.grammarScore}/100
- Listening: ${profile.listeningScore}/100
- Yếu nhất: ${profile.weakestSkill ?? "chưa xác định"}
- Mạnh nhất: ${profile.strongestSkill ?? "chưa xác định"}
- Consistency: ${profile.consistencyScore}/100
- Lỗi thường gặp: ${errors}
- Giờ học tốt nhất: ${profile.bestTimeOfDay ?? "không rõ"}
- Retention Anki: ${profile.ankiRetentionRate.toFixed(0)}%

7 ngày gần đây:
- Anki sessions: ${stats.ankiSessions}, retention: ${stats.retentionRate.toFixed(0)}%
- Speak sessions: ${stats.speakSessions} (tổng ${stats.speakMinutes} phút)
- Journal entries: ${stats.journalCount}
- Quests hoàn thành: ${stats.questsCompleted}

Loại insight cần generate: ${type}
`;
}

async function getStats(userId: string) {
  const since7 = new Date(Date.now() - 7 * 864e5);
  const [ankiSessions, speakSessions, journalCount, questsCompleted, reviewLogs30, journalWords] =
    await Promise.all([
      prisma.reviewLog.count({ where: { userId, reviewedAt: { gte: since7 } } }),
      prisma.conversationSession.findMany({
        where: { userId, createdAt: { gte: since7 } },
        select: { duration: true },
      }),
      prisma.journalEntry.count({ where: { userId, createdAt: { gte: since7 } } }),
      prisma.learningEvent.count({
        where: { userId, eventType: "quest_completed", createdAt: { gte: since7 } },
      }),
      prisma.reviewLog.findMany({
        where: { userId, reviewedAt: { gte: since7 } },
        select: { rating: true },
      }),
      prisma.journalEntry.findMany({
        where: { userId, createdAt: { gte: since7 } },
        select: { wordCount: true },
      }),
    ]);

  const retentionRate =
    reviewLogs30.length > 0
      ? (reviewLogs30.filter((r) => r.rating >= 3).length / reviewLogs30.length) * 100
      : 0;
  const speakMinutes = speakSessions.reduce((s, e) => s + Math.round(e.duration / 60), 0);

  return {
    ankiSessions,
    retentionRate,
    speakSessions: speakSessions.length,
    speakMinutes,
    journalCount,
    questsCompleted,
    journalWords: journalWords.reduce((s, e) => s + e.wordCount, 0),
  };
}

export async function generateInsight(
  userId: string,
  type: InsightType,
  profile: InsightProfile
): Promise<string> {
  const stats = await getStats(userId);
  const prompt = buildPrompt(type, profile, stats);

  try {
    const result = await aiCall({
      messages: [
        {
          role: "system",
          content:
            "Bạn là AI tutor tiếng Anh. Phân tích data học tập và đưa ra insight ngắn gọn, cụ thể, có thể hành động được. Trả lời bằng tiếng Việt. Tối đa 3 câu. Không chung chung. Không dùng emoji.",
        },
        { role: "user", content: prompt },
      ],
      model: INSIGHTS_MODEL,
      maxTokens: 400,
      temperature: 0.7,
      userId,
      route: `insight:${type}`,
    });
    return result.content.trim() || "Chưa có đủ data để đưa ra insight.";
  } catch {
    return "Chưa có đủ data để đưa ra insight.";
  }
}

export async function generateAndCacheInsights(userId: string): Promise<void> {
  const profile = await prisma.learningProfile.findUnique({ where: { userId } });
  if (!profile) return;

  const types: InsightType[] = [
    "weekly_summary",
    "weakness_alert",
    "strength_highlight",
    "pattern_detected",
    "prediction",
    "recommendation",
    "streak_analysis",
  ];

  // Delete old non-read insights older than 7 days
  await prisma.insightCache.deleteMany({
    where: {
      userId,
      isRead: false,
      createdAt: { lt: new Date(Date.now() - 7 * 864e5) },
    },
  });

  // Find which insight types already have a fresh cache (skip those).
  const freshCutoff = new Date(Date.now() - 24 * 3600e3);
  const existing = await prisma.insightCache.findMany({
    where: { userId, createdAt: { gte: freshCutoff } },
    select: { type: true },
  });
  const freshTypes = new Set(existing.map((e) => e.type));
  const toGenerate = types.filter((t) => !freshTypes.has(t));

  if (toGenerate.length === 0) return;

  // Run insight generation in parallel, capped to INSIGHT_CONCURRENCY.
  // Each worker is independent — one failure must not break the batch.
  await parallelWithLimit(
    toGenerate,
    INSIGHT_CONCURRENCY,
    async (type) => {
      try {
        let content: string;
        try {
          content = await generateInsight(userId, type, profile);
        } catch {
          // Qwen timeout/error — use pre-written fallback template
          content = getFallbackInsight(type, profile);
        }

        await prisma.insightCache.create({
          data: {
            userId,
            type,
            content,
            expiresAt: new Date(Date.now() + 24 * 3600e3),
          },
        });
      } catch {
        // Non-blocking — insight generation should never break core features
      }
    }
  );
}

// ─── Fallback Templates (when AI is unavailable) ───────────────────────────

// Typed lookup map — avoids unsafe dynamic key access via template literals
const SKILL_SCORE_MAP: Record<string, (p: InsightProfile) => number> = {
  vocab:     (p) => p.vocabScore,
  speaking:  (p) => p.speakingScore,
  writing:   (p) => p.writingScore,
  listening: (p) => p.listeningScore,
  grammar:   (p) => p.grammarScore,
};

function getFallbackInsight(type: InsightType, profile: InsightProfile): string {
  const weak = profile.weakestSkill ?? "speaking";
  const strong = profile.strongestSkill ?? "vocab";
  const strongScore = Math.round((SKILL_SCORE_MAP[strong] ?? SKILL_SCORE_MAP["vocab"])(profile));

  switch (type) {
    case "weekly_summary":
      return `Tuần này: ${strong} là kỹ năng mạnh nhất (${strongScore}/100). ${weak} cần cải thiện nhiều nhất. Retention Anki: ${profile.ankiRetentionRate.toFixed(0)}%.`;
    case "weakness_alert":
      return `${weak} đang yếu (dưới 50). Trung bình ${profile.avgCorrectionsPerSession.toFixed(1)} lỗi/phiên Speak. Tăng tần suất luyện tập kỹ năng này lên 2x.`;
    case "strength_highlight":
      return `${strong} đang rất tốt! Vocab velocity: ${profile.vocabVelocity > 0 ? "+" : ""}${profile.vocabVelocity}/tuần. Duy trì đà này và tập trung cải thiện ${weak}.`;
    case "pattern_detected":
      return `Giờ học tốt nhất của bạn là ${profile.bestTimeOfDay ?? "evening"}. Consistency score: ${profile.consistencyScore}/100. Học đều đặn mỗi ngày quan trọng hơn học nhiều 1 ngày.`;
    case "prediction":
      return `Với consistency ${profile.consistencyScore}/100 và velocity hiện tại, bạn cần duy trì nhịp độ học để tiếp tục tiến bộ. Tập trung vào ${weak} để tăng tổng điểm nhanh hơn.`;
    case "recommendation":
      return `Đề xuất: Tăng ${weak} bằng cách luyện mỗi ngày 15 phút. Giảm Anki new cards nếu retention dưới 70%. Viết Journal ít nhất 1 bài/ngày dù chỉ 50 từ.`;
    case "streak_analysis":
      return `Consistency ${profile.consistencyScore}/100. ${profile.consistencyScore >= 70 ? "Bạn đang học rất đều!" : "Hãy cố check-in mỗi ngày để xây dựng thói quen."} Giờ ${profile.bestTimeOfDay ?? "evening"} là lúc bạn học hiệu quả nhất.`;
    default:
      return "Chưa có đủ data để đưa ra insight. Hãy học thêm vài ngày nữa!";
  }
}

export async function getInsights(userId: string) {
  return prisma.insightCache.findMany({
    where: { userId, isRead: false },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}
