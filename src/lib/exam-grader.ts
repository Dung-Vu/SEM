import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/analytics";

// ─── Types ──────────────────────────────────────────────────────────────

export interface SectionScore {
  section: string;
  correct: number;
  total: number;
  score: number; // 0-100
}

export interface ExamResultData {
  totalScore: number;
  grammarScore: number;
  vocabScore: number;
  readingScore: number;
  listeningScore: number;
  totalCorrect: number;
  totalWrong: number;
  totalSkipped: number;
  accuracyRate: number;
  sectionScores: SectionScore[];
  weakTopics: string[];
  strongTopics: string[];
  vsLastExam: number | null;
  isPersonalBest: boolean;
  aiAnalysis: string;
}

// ─── Calculate Exam Result ──────────────────────────────────────────────

export async function calculateExamResult(
  examId: string,
  userId: string,
): Promise<ExamResultData> {
  // Fetch all answers with their questions
  const answers = await prisma.examAnswer.findMany({
    where: { examId },
    include: { question: true },
  });

  // Grade each answer
  for (const ans of answers) {
    if (ans.userAnswer) {
      const correct = ans.userAnswer.toUpperCase() === ans.question.correct.toUpperCase();
      await prisma.examAnswer.update({
        where: { id: ans.id },
        data: { isCorrect: correct },
      });
      ans.isCorrect = correct;
    } else {
      await prisma.examAnswer.update({
        where: { id: ans.id },
        data: { isCorrect: false },
      });
      ans.isCorrect = false;
    }
  }

  // Calculate section scores
  const sections = ["grammar", "vocabulary", "reading", "listening"];
  const sectionScores: SectionScore[] = [];
  const topicResults: Record<string, { correct: number; total: number }> = {};

  for (const section of sections) {
    const sectionAnswers = answers.filter(a => a.question.section === section);
    if (sectionAnswers.length === 0) continue;

    const correct = sectionAnswers.filter(a => a.isCorrect === true).length;
    sectionScores.push({
      section,
      correct,
      total: sectionAnswers.length,
      score: Math.round((correct / sectionAnswers.length) * 100),
    });

    // Track per-topic performance
    for (const a of sectionAnswers) {
      const topic = a.question.topic || section;
      if (!topicResults[topic]) topicResults[topic] = { correct: 0, total: 0 };
      topicResults[topic].total++;
      if (a.isCorrect) topicResults[topic].correct++;
    }
  }

  // Overall stats
  const totalCorrect = answers.filter(a => a.isCorrect === true).length;
  const totalSkipped = answers.filter(a => !a.userAnswer).length;
  const totalWrong = answers.length - totalCorrect - totalSkipped;
  const answered = answers.length - totalSkipped;
  const accuracyRate = answered > 0 ? Math.round((totalCorrect / answered) * 100) / 100 : 0;

  // Overall score: weighted average of section scores
  const grammarScore = sectionScores.find(s => s.section === "grammar")?.score ?? 0;
  const vocabScore = sectionScores.find(s => s.section === "vocabulary")?.score ?? 0;
  const readingScore = sectionScores.find(s => s.section === "reading")?.score ?? 0;
  const listeningScore = sectionScores.find(s => s.section === "listening")?.score ?? 0;

  const totalSections = sectionScores.length;
  const totalScore = totalSections > 0
    ? Math.round(sectionScores.reduce((sum, s) => sum + s.score, 0) / totalSections)
    : 0;

  // Weak/strong topics
  const topicEntries = Object.entries(topicResults)
    .map(([topic, { correct, total }]) => ({
      topic,
      accuracy: total > 0 ? correct / total : 0,
      total,
    }))
    .filter(t => t.total >= 2); // need at least 2 questions to be meaningful

  const weakTopics = topicEntries
    .filter(t => t.accuracy < 0.5)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5)
    .map(t => t.topic);

  const strongTopics = topicEntries
    .filter(t => t.accuracy >= 0.8)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 5)
    .map(t => t.topic);

  // Compare with last exam
  const vsLastExam = await getVsLastExam(userId, totalScore);

  // Personal best check
  const isPersonalBest = await checkExamPersonalBest(userId, totalScore, examId);

  // AI analysis
  const aiAnalysis = await generateExamAnalysis({
    totalScore,
    grammarScore,
    vocabScore,
    readingScore,
    listeningScore,
    weakTopics,
    strongTopics,
    vsLastExam,
  });

  return {
    totalScore,
    grammarScore,
    vocabScore,
    readingScore,
    listeningScore,
    totalCorrect,
    totalWrong,
    totalSkipped,
    accuracyRate,
    sectionScores,
    weakTopics,
    strongTopics,
    vsLastExam,
    isPersonalBest,
    aiAnalysis,
  };
}

// ─── AI Analysis ────────────────────────────────────────────────────────

async function generateExamAnalysis(result: {
  totalScore: number;
  grammarScore: number;
  vocabScore: number;
  readingScore: number;
  listeningScore: number;
  weakTopics: string[];
  strongTopics: string[];
  vsLastExam: number | null;
}): Promise<string> {
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
          { role: "system", content: "Write a brief exam analysis in Vietnamese. Return plain text, no JSON." },
          {
            role: "user",
            content: `Student exam result:
- Total: ${result.totalScore}/100
- Grammar: ${result.grammarScore}/100
- Vocabulary: ${result.vocabScore}/100
- Reading: ${result.readingScore}/100
- Listening: ${result.listeningScore}/100
- Weak topics: ${result.weakTopics.join(", ") || "none"}
- Strong topics: ${result.strongTopics.join(", ") || "none"}
- vs last exam: ${result.vsLastExam != null ? (result.vsLastExam > 0 ? "+" : "") + result.vsLastExam : "first exam"}

Write exactly 3 sentences in Vietnamese:
1. Overall honest assessment (not generic)
2. Strongest section + why it matters
3. Weakest section + 1 specific action to improve`,
          },
        ],
        stream: false,
        max_tokens: 300,
        temperature: 0.5,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`AI error: ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? getFallbackAnalysis(result);
  } catch {
    return getFallbackAnalysis(result);
  }
}

function getFallbackAnalysis(result: { totalScore: number; weakTopics: string[] }): string {
  if (result.totalScore >= 80) {
    return "Kết quả tốt! Bạn nắm vững hầu hết các kiến thức. Tiếp tục ôn luyện để duy trì phong độ.";
  }
  if (result.totalScore >= 60) {
    return `Kết quả khá. Cần cải thiện: ${result.weakTopics.slice(0, 2).join(", ") || "một số chủ đề"}. Hãy luyện tập thêm.`;
  }
  return `Cần cố gắng hơn. Tập trung vào: ${result.weakTopics.slice(0, 3).join(", ") || "các kiến thức cơ bản"}. Đừng nản!`;
}

// ─── Personal Best ──────────────────────────────────────────────────────

async function checkExamPersonalBest(
  userId: string,
  totalScore: number,
  currentExamId: string,
): Promise<boolean> {
  const best = await prisma.examResult.findFirst({
    where: {
      userId,
      exam: { id: { not: currentExamId } },
    },
    orderBy: { totalScore: "desc" },
    select: { totalScore: true },
  });

  return totalScore > (best?.totalScore ?? 0);
}

// ─── Compare with Last Exam ─────────────────────────────────────────────

async function getVsLastExam(
  userId: string,
  currentScore: number,
): Promise<number | null> {
  const last = await prisma.examResult.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { totalScore: true },
  });

  return last ? currentScore - last.totalScore : null;
}

// ─── Sync Exam to Tutor Memory ──────────────────────────────────────────

export async function syncExamToMemory(
  userId: string,
  weakTopics: string[],
): Promise<void> {
  if (weakTopics.length === 0) return;

  try {
    const { getTutorMemory, updateTutorMemory } = await import("@/lib/tutor-memory");
    const memory = await getTutorMemory(userId);

    // Merge weak topics into persistent weaknesses
    const existing = new Set(memory.persistentWeaknesses);
    for (const topic of weakTopics) {
      existing.add(topic);
    }
    // Keep top 10
    const merged = Array.from(existing).slice(0, 10);
    await updateTutorMemory(userId, { persistentWeaknesses: merged });
  } catch {
    // Non-blocking
  }
}

// ─── Log Exam Completion ────────────────────────────────────────────────

export async function logExamCompletion(
  userId: string,
  totalScore: number,
  mode: string,
  level: string,
  isPersonalBest: boolean,
): Promise<void> {
  void logEvent(userId, "exam_completed", "exam", totalScore, undefined, {
    mode,
    level,
    score: totalScore,
    isPersonalBest,
  });
}
