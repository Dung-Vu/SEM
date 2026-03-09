import { prisma } from "@/lib/prisma";
import { getTutorMemory, updateTutorMemory } from "@/lib/tutor-memory";
import { classifyAndUpdateErrors, parseCorrectionsFromMessages } from "@/lib/error-classifier";
import { calcSessionPerformance, adjustDifficulty } from "@/lib/difficulty-engine";
import { syncVocabMemory, trackVocabUsage } from "@/lib/vocab-memory";
import { logEvent } from "@/lib/analytics";

// ─── Types ──────────────────────────────────────────────────────────────

interface SessionData {
  mode: string;
  topic?: string;
  durationSec: number;
  messages: { role: string; content: string }[];
}

export interface DebriefResult {
  performanceScore: number;
  difficultyUsed: number;
  nextDifficulty: number;
  correctionsCount: number;
  vocabUsed: string[];
  debrief: string;
}

// ─── Session Debrief Generator ──────────────────────────────────────────

/**
 * Full post-session processing pipeline:
 * 1. Parse corrections from AI messages
 * 1b. Log speak_correction events (Phase 14)
 * 2. Classify errors → update patterns
 * 3. Track vocab usage
 * 4. Calculate performance score
 * 5. Adjust difficulty
 * 6. Generate AI debrief
 * 7. Save TutorSession
 * 8. Update memory metadata
 * 9. Sync vocab from Anki
 * 10. Generate journey narrative (every 10 sessions)
 */
export async function processSessionEnd(
  userId: string,
  sessionId: string,
  data: SessionData
): Promise<DebriefResult> {
  const memory = await getTutorMemory(userId);

  // 1. Parse corrections from AI responses
  const corrections = parseCorrectionsFromMessages(data.messages);

  // 1b. Phase 14: log each correction as a speak_correction event
  for (const c of corrections) {
    void logEvent(userId, "speak_correction", "speaking", undefined, undefined, {
      original: c.original,
      corrected: c.corrected,
    });
  }

  // 2. Classify errors → update error patterns
  const classifiedErrors = await classifyAndUpdateErrors(userId, corrections);
  const newErrors = classifiedErrors.filter(e => {
    const existing = memory.errorPatterns.find(
      p => p.type === e.type && p.subtype === e.subtype
    );
    return !existing;
  });

  // 3. Track vocab usage in user messages
  const userMessages = data.messages.filter(m => m.role === "user");
  const allVocabUsed: string[] = [];
  for (const msg of userMessages) {
    const used = await trackVocabUsage(userId, msg.content);
    allVocabUsed.push(...used);
  }
  const uniqueVocabUsed = [...new Set(allVocabUsed)];

  // 4. Calculate performance score
  const totalUserChars = userMessages.reduce((s, m) => s + m.content.length, 0);
  const performanceScore = calcSessionPerformance({
    correctionsCount: corrections.length,
    messageCount: userMessages.length,
    durationSec: data.durationSec,
    vocabTargetsUsed: uniqueVocabUsed.length,
    vocabTargetsAvailable: memory.activeVocabTargets.length,
    totalUserChars,
  });

  // 5. Adjust difficulty
  const difficultyUsed = memory.currentDifficulty;
  const nextDifficulty = await adjustDifficulty(userId, performanceScore);

  // 6. Generate AI debrief
  const debrief = await generateDebrief(
    data, corrections.length, uniqueVocabUsed, performanceScore, difficultyUsed
  );

  // 7. Save TutorSession
  await prisma.tutorSession.create({
    data: {
      userId,
      sessionId,
      mode: data.mode,
      topic: data.topic,
      durationSec: data.durationSec,
      messageCount: data.messages.length,
      difficultyUsed,
      performanceScore,
      corrections: corrections as unknown as import("@prisma/client").Prisma.InputJsonValue,
      newErrors: newErrors as unknown as import("@prisma/client").Prisma.InputJsonValue,
      vocabUsed: uniqueVocabUsed,
      aiDebrief: debrief,
    },
  });

  // 8. Update memory metadata
  await updateTutorMemory(userId, {
    totalSessions: memory.totalSessions + 1,
    lastSessionAt: new Date(),
    lastSessionMode: data.mode,
    lastSessionSummary: debrief,
  });

  // 9. Update strengths & weaknesses
  await updateStrengthsWeaknesses(userId);

  // 10. Sync vocab from Anki
  void syncVocabMemory(userId);

  // 11. Generate journey narrative every 10 sessions
  if ((memory.totalSessions + 1) % 10 === 0) {
    void generateJourneyNarrative(userId);
  }

  return {
    performanceScore,
    difficultyUsed,
    nextDifficulty,
    correctionsCount: corrections.length,
    vocabUsed: uniqueVocabUsed,
    debrief,
  };
}

// ─── AI Debrief ─────────────────────────────────────────────────────────

async function generateDebrief(
  data: SessionData,
  correctionsCount: number,
  vocabUsed: string[],
  performanceScore: number,
  difficulty: number
): Promise<string> {
  const baseUrl = process.env.AI_BASE_URL || "https://coding-intl.dashscope.aliyuncs.com/v1";
  const apiKey = process.env.AI_API_KEY || "";
  const model = process.env.AI_MODEL || "qwen3.5-plus";

  const durationMin = Math.round(data.durationSec / 60);
  const userMsgCount = data.messages.filter(m => m.role === "user").length;

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "Bạn là AI tutor. Viết debrief buổi học tiếng Anh. Trả lời bằng tiếng Việt, 3 câu: (1) điểm tốt, (2) cần cải thiện, (3) 1 việc cụ thể cho buổi tới. Encouraging nhưng honest. Không emoji.",
          },
          {
            role: "user",
            content: `Mode: ${data.mode}, Duration: ${durationMin} min, Messages: ${userMsgCount}, Corrections: ${correctionsCount}, Vocab targets used: ${vocabUsed.join(", ") || "none"}, Performance: ${performanceScore}/100, Difficulty: ${difficulty}/10`,
          },
        ],
        stream: false,
        max_tokens: 200,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`AI error: ${res.status}`);
    const json = await res.json();
    return json.choices?.[0]?.message?.content?.trim() ?? getFallbackDebrief(correctionsCount, vocabUsed, performanceScore);
  } catch {
    return getFallbackDebrief(correctionsCount, vocabUsed, performanceScore);
  }
}

function getFallbackDebrief(
  correctionsCount: number,
  vocabUsed: string[],
  performanceScore: number
): string {
  const good = vocabUsed.length > 0
    ? `Bạn đã dùng được ${vocabUsed.length} từ vựng mục tiêu trong cuộc trò chuyện.`
    : `Bạn đã hoàn thành buổi tập với performance ${performanceScore}/100.`;
  const improve = correctionsCount > 3
    ? `Có ${correctionsCount} lỗi cần chú ý — hãy review lại các patterns đã sửa.`
    : `Số lỗi ít (${correctionsCount}) — foundation grammar đang tốt.`;
  const next = performanceScore >= 70
    ? "Buổi tới thử topic khó hơn hoặc thời gian dài hơn để challenge bản thân."
    : "Buổi tới tập trung vào các lỗi thường gặp, practice slow và rõ ràng.";
  return `${good} ${improve} ${next}`;
}

// ─── Strengths & Weaknesses Updater ─────────────────────────────────────

async function updateStrengthsWeaknesses(userId: string): Promise<void> {
  const sessions = await prisma.tutorSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (sessions.length < 3) return;

  const avgPerf = sessions.reduce((s: number, t: { performanceScore: number }) => s + t.performanceScore, 0) / sessions.length;
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (avgPerf >= 75) strengths.push("consistent_performer");
  if (avgPerf < 50) weaknesses.push("needs_more_practice");

  // Check error trends
  const memory = await getTutorMemory(userId);
  for (const pattern of memory.errorPatterns.slice(0, 3)) {
    if (pattern.trend === "increasing") {
      weaknesses.push(`${pattern.type}${pattern.subtype ? `_${pattern.subtype}` : ""}`);
    } else if (pattern.trend === "decreasing" && pattern.count > 5) {
      strengths.push(`improving_${pattern.type}`);
    }
  }

  await updateTutorMemory(userId, {
    strengths: strengths.slice(0, 5),
    persistentWeaknesses: weaknesses.slice(0, 5),
  });
}

// ─── Journey Narrative ──────────────────────────────────────────────────

async function generateJourneyNarrative(userId: string): Promise<void> {
  const memory = await getTutorMemory(userId);
  const baseUrl = process.env.AI_BASE_URL || "https://coding-intl.dashscope.aliyuncs.com/v1";
  const apiKey = process.env.AI_API_KEY || "";
  const model = process.env.AI_MODEL || "qwen3.5-plus";

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "Viết 2-3 câu tiếng Việt mô tả hành trình học tiếng Anh. Warm, encouraging, cụ thể. Không emoji.",
          },
          {
            role: "user",
            content: `Sessions: ${memory.totalSessions}, Difficulty: ${memory.currentDifficulty}/10, Strengths: ${memory.strengths.join(", ") || "đang đánh giá"}, Weaknesses: ${memory.persistentWeaknesses.join(", ") || "đang đánh giá"}`,
          },
        ],
        stream: false,
        max_tokens: 150,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return;
    const json = await res.json();
    const narrative = json.choices?.[0]?.message?.content?.trim();
    if (narrative) {
      await updateTutorMemory(userId, { journeySummary: narrative });
    }
  } catch {
    // non-blocking
  }
}
