import { prisma } from "@/lib/prisma";

// ─── AI Error Classification Helper ──────────────────────────────────────

async function classifySpeakCorrections(corrections: string[]): Promise<string[]> {
  if (!corrections.length) return [];
  const apiKey = process.env.AI_API_KEY || "";
  if (!apiKey || corrections.length < 3) {
    // Heuristic fallback — too few corrections for AI to be useful
    return corrections.some((c) => /tense|past|present|was|were|had/i.test(c))
      ? ["tense", "grammar"]
      : ["grammar", "vocab"];
  }
  const baseUrl = process.env.AI_BASE_URL || "https://coding-intl.dashscope.aliyuncs.com/v1";
  const model = process.env.AI_MODEL || "qwen3.5-plus";
  try {
    // Random sample up to 15 — more representative than always using oldest/first 15
    const pool = corrections.length <= 15
      ? corrections
      : corrections.sort(() => Math.random() - 0.5).slice(0, 15);
    const sample = pool.join("\n");
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "Classify English learning errors. Return ONLY a JSON array of error type strings. Valid types: tense, vocab, preposition, article, agreement, spelling, fluency, grammar, word_order. No explanation.",
          },
          {
            role: "user",
            content: `Classify these corrections into error types:\n${sample}`,
          },
        ],
        stream: false,
        max_tokens: 100,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() ?? "";
    // Parse JSON array from AI response
    const match = content.match(/\[([^\]]+)\]/);
    if (match) {
      const types = JSON.parse(`[${match[1]}]`) as string[];
      return types.filter((t): t is string => typeof t === "string");
    }
    return [];
  } catch {
    return [];
  }
}

// ─── Score Calculation Helpers ────────────────────────────────────────────

function clamp(val: number, min = 0, max = 100) {
  return Math.round(Math.max(min, Math.min(max, val)));
}

function calcRetentionRate(reviewLogs: { rating: number }[]): number {
  if (!reviewLogs.length) return 0;
  const good = reviewLogs.filter((r) => r.rating >= 3).length;
  return (good / reviewLogs.length) * 100;
}

function calcConsistencyScore(checkIns: number, days: number): number {
  return clamp(Math.round((checkIns / days) * 100));
}

function calcBestTimeOfDay(
  events: { createdAt: Date }[]
): "morning" | "afternoon" | "evening" | "night" {
  const counts = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  for (const e of events) {
    const h = e.createdAt.getHours();
    if (h >= 5 && h < 12) counts.morning++;
    else if (h >= 12 && h < 17) counts.afternoon++;
    else if (h >= 17 && h < 22) counts.evening++;
    else counts.night++;
  }
  return (Object.keys(counts) as Array<keyof typeof counts>).reduce((a, b) =>
    counts[a] >= counts[b] ? a : b
  );
}

// ─── calculateLearningProfile ─────────────────────────────────────────────

export async function calculateLearningProfile(userId: string) {
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 864e5);
  const since7  = new Date(now.getTime() - 7 * 864e5);
  const since14 = new Date(now.getTime() - 14 * 864e5);

  // ── Anki / Vocab ─────────────────────────────────────────────────────
  const reviewLogs30 = await prisma.reviewLog.findMany({
    where: { userId, reviewedAt: { gte: since30 } },
    select: { rating: true, reviewedAt: true },
  });
  const retentionRate = calcRetentionRate(reviewLogs30);
  const masteredCount = await prisma.srsCard.count({
    where: { userId, status: "mastered" },
  });

  // Base vocab score: retention (60%) + mastered progress (40%)
  const masteredProgress = clamp(masteredCount / 2); // 200 mastered = 100
  const vocabScore = clamp(retentionRate * 0.6 + masteredProgress * 0.4);

  // ── Speaking ─────────────────────────────────────────────────────────
  const speakSessions = await prisma.conversationSession.findMany({
    where: { userId, createdAt: { gte: since30 } },
    select: { duration: true, createdAt: true },
  });
  const speakEventsAnalytics = await prisma.learningEvent.findMany({
    where: { userId, eventType: "speak_session_end", createdAt: { gte: since30 } },
    select: { metadata: true, score: true },
  });
  const avgCorrections =
    speakEventsAnalytics.length > 0
      ? speakEventsAnalytics.reduce((s, e) => {
          const m = e.metadata as Record<string, number> | null;
          return s + (m?.corrections_count ?? 0);
        }, 0) / speakEventsAnalytics.length
      : 0;
  const speakFreq = speakSessions.length / 30;
  // Lower corrections = better; more frequent = better
  const correctionPenalty = clamp(avgCorrections * 5, 0, 40);
  const speakingScore = clamp(50 + speakFreq * 200 - correctionPenalty);

  // ── Writing / Journal ─────────────────────────────────────────────────
  const journalEntries = await prisma.journalEntry.findMany({
    where: { userId, createdAt: { gte: since30 } },
    select: { wordCount: true, createdAt: true },
  });
  const avgWordCount =
    journalEntries.length > 0
      ? journalEntries.reduce((s, e) => s + e.wordCount, 0) / journalEntries.length
      : 0;
  const writingFreq = journalEntries.length / 30;
  const writingScore = clamp(writingFreq * 200 + avgWordCount / 2);

  // ── Listening / Shadow ────────────────────────────────────────────────
  const shadowEvents = await prisma.learningEvent.findMany({
    where: { userId, eventType: "shadow_session", createdAt: { gte: since30 } },
  });
  const listeningScore = clamp(50 + shadowEvents.length * 5);

  // ── Grammar ───────────────────────────────────────────────────────────
  // Derived from: speak corrections type + anki retention
  const grammarScore = clamp((speakingScore + vocabScore) / 2);

  // ── Velocity (compare last 7 vs prev 7 days) ──────────────────────────
  const prev7Start = new Date(now.getTime() - 14 * 864e5);

  const [ankiThisWeek, ankiLastWeek] = await Promise.all([
    prisma.reviewLog.count({ where: { userId, reviewedAt: { gte: since7 } } }),
    prisma.reviewLog.count({ where: { userId, reviewedAt: { gte: prev7Start, lt: since7 } } }),
  ]);
  const [journalThisWeek, journalLastWeek] = await Promise.all([
    prisma.journalEntry.count({ where: { userId, createdAt: { gte: since7 } } }),
    prisma.journalEntry.count({ where: { userId, createdAt: { gte: prev7Start, lt: since7 } } }),
  ]);
  const [speakThisWeek, speakLastWeek] = await Promise.all([
    prisma.conversationSession.count({ where: { userId, createdAt: { gte: since7 } } }),
    prisma.conversationSession.count({ where: { userId, createdAt: { gte: prev7Start, lt: since7 } } }),
  ]);

  const vocabVelocity = parseFloat(((ankiThisWeek - ankiLastWeek) * 0.3).toFixed(1));
  const writingVelocity = parseFloat(((journalThisWeek - journalLastWeek) * 2).toFixed(1));
  const speakingVelocity = parseFloat(((speakThisWeek - speakLastWeek) * 3).toFixed(1));
  const listeningVelocity = parseFloat((shadowEvents.length * 0.5).toFixed(1));
  const grammarVelocity = parseFloat(((vocabVelocity + speakingVelocity) / 2).toFixed(1));

  // ── Strongest / Weakest ───────────────────────────────────────────────
  const scores: Record<string, number> = {
    vocab: vocabScore,
    speaking: speakingScore,
    listening: listeningScore,
    writing: writingScore,
    grammar: grammarScore,
  };
  const strongestSkill = Object.keys(scores).reduce((a, b) => scores[a] >= scores[b] ? a : b);
  const weakestSkill = Object.keys(scores).reduce((a, b) => scores[a] <= scores[b] ? a : b);

  // ── Best time of day (use already-fetched data instead of re-querying) ─
  const combinedDates: { createdAt: Date }[] = [
    ...speakSessions.map((s) => ({ createdAt: s.createdAt })),
    ...shadowEvents.map((s) => ({ createdAt: s.createdAt })),
    ...reviewLogs30.map((r) => ({ createdAt: r.reviewedAt })),
    ...journalEntries.map((j) => ({ createdAt: j.createdAt })),
  ];
  const bestTimeOfDay = combinedDates.length > 0 ? calcBestTimeOfDay(combinedDates) : "evening";

  // ── Consistency ───────────────────────────────────────────────────────
  const checkIns30 = await prisma.learningEvent.count({
    where: { userId, eventType: "daily_checkin", createdAt: { gte: since30 } },
  });
  const consistencyScore = calcConsistencyScore(checkIns30, 30);

  // ── Avg session minutes ───────────────────────────────────────────────
  const avgSessionMin =
    speakSessions.length > 0
      ? Math.round(speakSessions.reduce((s, e) => s + e.duration, 0) / speakSessions.length / 60)
      : 0;

  // ── Common error types (AI-classified from speak corrections) ──────────
  const speakCorrections = await prisma.learningEvent.findMany({
    where: { userId, eventType: "speak_correction", createdAt: { gte: since30 } },
    select: { metadata: true },
    take: 20,
  });
  const correctionTexts = speakCorrections
    .map((e) => {
      const m = e.metadata as Record<string, string> | null;
      return m?.original && m?.corrected ? `"${m.original}" → "${m.corrected}"` : null;
    })
    .filter((t): t is string => t !== null);

  let commonErrorTypes: string[];
  if (correctionTexts.length >= 3) {
    // Use AI to classify
    commonErrorTypes = await classifySpeakCorrections(correctionTexts);
    // If AI fails, fall back to heuristics
    if (!commonErrorTypes.length) {
      commonErrorTypes = [];
      if (avgCorrections > 5) commonErrorTypes.push("grammar");
      if (vocabScore < 50) commonErrorTypes.push("vocab");
      if (speakingScore < 50) commonErrorTypes.push("fluency");
    }
  } else {
    // Not enough corrections for AI — heuristic
    commonErrorTypes = [];
    if (avgCorrections > 5) commonErrorTypes.push("grammar");
    if (vocabScore < 50) commonErrorTypes.push("vocab");
    if (speakingScore < 50) commonErrorTypes.push("fluency");
  }

  // ── Upsert profile ────────────────────────────────────────────────────
  await prisma.learningProfile.upsert({
    where: { userId },
    update: {
      vocabScore,
      speakingScore,
      listeningScore,
      writingScore,
      grammarScore,
      vocabVelocity,
      speakingVelocity,
      listeningVelocity,
      writingVelocity,
      grammarVelocity,
      strongestSkill,
      weakestSkill,
      avgSessionMin,
      bestTimeOfDay,
      consistencyScore,
      ankiRetentionRate: parseFloat(retentionRate.toFixed(1)),
      avgAnkiScore: reviewLogs30.length
        ? parseFloat((reviewLogs30.reduce((s, r) => s + r.rating, 0) / reviewLogs30.length).toFixed(2))
        : 0,
      avgCorrectionsPerSession: parseFloat(avgCorrections.toFixed(1)),
      commonErrorTypes: JSON.stringify(commonErrorTypes),
    },
    create: {
      userId,
      vocabScore,
      speakingScore,
      listeningScore,
      writingScore,
      grammarScore,
      vocabVelocity,
      speakingVelocity,
      listeningVelocity,
      writingVelocity,
      grammarVelocity,
      strongestSkill,
      weakestSkill,
      avgSessionMin,
      bestTimeOfDay,
      consistencyScore,
      ankiRetentionRate: parseFloat(retentionRate.toFixed(1)),
      avgAnkiScore: 0,
      avgCorrectionsPerSession: parseFloat(avgCorrections.toFixed(1)),
      commonErrorTypes: JSON.stringify(commonErrorTypes),
    },
  });

  return { vocabScore, speakingScore, listeningScore, writingScore, grammarScore,
           vocabVelocity, speakingVelocity, listeningVelocity, writingVelocity, grammarVelocity,
           strongestSkill, weakestSkill, consistencyScore, bestTimeOfDay,
           retentionRate, avgCorrections, commonErrorTypes };
}

// ─── Weakness Detector ────────────────────────────────────────────────────

export interface Weakness {
  skill: string;
  severity: "high" | "medium" | "low";
  evidence: string;
  recommendation: string;
}

export function detectWeaknesses(profile: {
  speakingScore: number;
  vocabScore: number;
  writingScore: number;
  listeningScore: number;
  grammarScore: number;
  vocabVelocity: number;
  speakingVelocity: number;
  writingVelocity: number;
  avgCorrectionsPerSession: number;
  commonErrorTypes: string;
}): Weakness[] {
  const weaknesses: Weakness[] = [];
  const errorTypes: string[] = JSON.parse(profile.commonErrorTypes || "[]");

  if (profile.speakingScore < 50) {
    weaknesses.push({
      skill: "Speaking",
      severity: "high",
      evidence: `${profile.avgCorrectionsPerSession.toFixed(1)} corrections/session average`,
      recommendation: "Tăng số buổi Speak lên 2x/ngày — bắt đầu với Free Talk 10 phút",
    });
  }

  if (profile.vocabVelocity < -2) {
    weaknesses.push({
      skill: "Vocabulary",
      severity: "medium",
      evidence: `Anki performance giảm ${Math.abs(profile.vocabVelocity)} điểm/tuần`,
      recommendation: "Review lại lỗi sai, giảm new cards/day xuống 5",
    });
  }

  if (profile.writingScore < 40) {
    weaknesses.push({
      skill: "Writing",
      severity: profile.writingVelocity < 0 ? "high" : "medium",
      evidence: "Số lần viết Journal rất thấp",
      recommendation: "Cố gắng viết ít nhất 1 Journal entry/ngày, dù chỉ 50 từ",
    });
  }

  if (profile.listeningScore < 45) {
    weaknesses.push({
      skill: "Listening",
      severity: "low",
      evidence: "Rất ít Shadow sessions trong 30 ngày",
      recommendation: "Thêm 15 phút Shadow mỗi ngày — bắt đầu với script B1",
    });
  }

  if (errorTypes.includes("grammar")) {
    weaknesses.push({
      skill: "Grammar",
      severity: "medium",
      evidence: "Lỗi ngữ pháp chiếm phần lớn corrections",
      recommendation: "Học Anki grammar cards level B1 + Shadow B1 scripts",
    });
  }

  const severityOrder = { high: 3, medium: 2, low: 1 };
  return weaknesses.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
}

// ─── Progress Prediction ──────────────────────────────────────────────────

const LEVEL_THRESHOLDS: Record<string, number> = {
  A1: 20, A2: 35, B1: 50, B2: 70, C1: 85, C2: 95,
};

export function predictLevelUp(
  scores: { vocab: number; speaking: number; listening: number; writing: number; grammar: number },
  velocities: { vocab: number; speaking: number; listening: number; writing: number; grammar: number },
  targetLevel: string
) {
  const currentScore = Math.round(
    (scores.vocab + scores.speaking + scores.listening + scores.writing + scores.grammar) / 5
  );
  const avgVelocity =
    (velocities.vocab + velocities.speaking + velocities.listening + velocities.writing + velocities.grammar) / 5;

  const target = LEVEL_THRESHOLDS[targetLevel] ?? 75;

  if (avgVelocity <= 0) {
    return {
      possible: false,
      currentScore,
      targetScore: target,
      message: "Tốc độ hiện tại chưa đủ để dự đoán. Hãy học đều hơn mỗi ngày!",
    };
  }

  const pointsNeeded = Math.max(0, target - currentScore);
  const weeksNeeded = Math.ceil(pointsNeeded / avgVelocity);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + weeksNeeded * 7);

  return {
    possible: true,
    currentScore,
    targetScore: target,
    weeksNeeded,
    targetDate: targetDate.toISOString(),
    avgVelocity: parseFloat(avgVelocity.toFixed(1)),
    message: `Với tốc độ hiện tại, bạn đạt ${targetLevel} sau khoảng ${weeksNeeded} tuần (${targetDate.toLocaleDateString("vi-VN")})`,
    disclaimer: "Dự kiến — tốc độ thực tế có thể thay đổi dựa trên mức độ luyện tập",
  };
}
