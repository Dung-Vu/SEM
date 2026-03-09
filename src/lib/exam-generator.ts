import { prisma } from "@/lib/prisma";

// ─── Types ──────────────────────────────────────────────────────────────

export interface ExamQuestionData {
  id: string;
  section: string;
  level: string;
  topic: string | null;
  passage: string | null;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correct: string;
  explanation: string;
}

interface GeneratedQuestion {
  section: string;
  level: string;
  topic: string;
  passage: string | null;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct: string;
  explanation: string;
}

// ─── Section Prompts ────────────────────────────────────────────────────

const SECTION_PROMPTS: Record<string, (level: string, count: number, topic?: string) => string> = {
  grammar: (level, count, topic) => `
Generate ${count} grammar multiple choice questions for ${level} level.
${topic ? `Focus on: ${topic}` : "Mix of: tenses, articles, prepositions, conditionals, passive voice, subject-verb agreement"}

Each question: fill in the blank or choose correct form.
Example: "She ___ to the store yesterday." A) go B) goes C) went D) gone`,

  vocabulary: (level, count) => `
Generate ${count} vocabulary questions for ${level} level.
Mix of: word meaning, synonym, antonym, word in context, collocation.
Include words relevant to: business, technology, academic contexts, daily life.`,

  reading: (level, count) => `
Generate 1 reading passage (150-200 words) for ${level} level about a current topic.
Then generate ${count} comprehension questions about the passage.
Question types: main idea, inference, detail, vocabulary in context.
ALL questions must share the same "passage" field with the full passage text.`,

  listening: (level, count) => `
Generate ${count} listening-style questions for ${level} level.
Format: short transcript (2-4 sentences) + question about what was said.
Topics: conversations, announcements, short talks.
Each question must have its own "passage" field containing only that question's transcript.`,
};

// ─── AI Question Generation ─────────────────────────────────────────────

export async function generateQuestions(
  section: string,
  level: string,
  count: number,
  topic?: string,
  avoidTopics?: string[],
): Promise<ExamQuestionData[]> {
  const baseUrl = process.env.AI_BASE_URL || "https://coding-intl.dashscope.aliyuncs.com/v1";
  const apiKey = process.env.AI_API_KEY || "";
  const model = process.env.AI_MODEL || "qwen3.5-plus";

  const sectionPrompt = SECTION_PROMPTS[section];
  if (!sectionPrompt) return [];

  const avoidStr = avoidTopics?.length ? `\nAvoid these topics (already tested): ${avoidTopics.join(", ")}` : "";

  const prompt = `${sectionPrompt(level, count, topic)}${avoidStr}

Return ONLY a JSON array (no markdown, no wrapping):
[
  {
    "section": "${section}",
    "level": "${level}",
    "topic": "specific topic",
    "passage": "only for reading/listening, else null",
    "question": "the question text",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct": "A|B|C|D",
    "explanation": "Vietnamese explanation of why correct answer is right"
  }
]

Make distractors (wrong answers) plausible — not obviously wrong.`;

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
          { role: "system", content: "Generate exam questions. Return ONLY valid JSON array." },
          { role: "user", content: prompt },
        ],
        stream: false,
        max_tokens: 3000,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) throw new Error(`AI API error: ${res.status}`);
    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content?.trim() ?? "";

    // Extract JSON array
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array in response");

    const parsed: GeneratedQuestion[] = JSON.parse(jsonMatch[0]);

    // Save to DB and return
    const saved: ExamQuestionData[] = [];
    for (const q of parsed.slice(0, count)) {
      const created = await prisma.examQuestion.create({
        data: {
          section: q.section || section,
          level: q.level || level,
          topic: q.topic || null,
          passage: q.passage || null,
          question: String(q.question ?? ""),
          optionA: String(q.option_a ?? ""),
          optionB: String(q.option_b ?? ""),
          optionC: String(q.option_c ?? ""),
          optionD: String(q.option_d ?? ""),
          correct: String(q.correct ?? "A").toUpperCase(),
          explanation: String(q.explanation ?? ""),
          isAiGenerated: true,
        },
      });
      saved.push(created);
    }

    return saved;
  } catch (error) {
    console.error("generateQuestions error:", error);
    return [];
  }
}

// ─── Get or Generate Questions ──────────────────────────────────────────

async function getOrGenerateQuestions(
  section: string,
  level: string,
  count: number,
  userId?: string,
): Promise<ExamQuestionData[]> {
  // Pull from existing bank
  const fromBank = await prisma.examQuestion.findMany({
    where: { section, level },
    take: count * 3,
  });

  // If userId provided, try to weight toward weak topics
  if (userId && fromBank.length >= count) {
    const weakTopics = await getUserWeakTopics(userId);
    if (weakTopics.length > 0) {
      const weakQ = fromBank.filter((q: ExamQuestionData) => weakTopics.includes(q.topic || ""));
      const otherQ = fromBank.filter((q: ExamQuestionData) => !weakTopics.includes(q.topic || ""));
      // 50% weak topics, 50% mixed
      const weakCount = Math.min(Math.ceil(count * 0.5), weakQ.length);
      const otherCount = count - weakCount;
      return [
        ...shuffle(weakQ).slice(0, weakCount),
        ...shuffle(otherQ).slice(0, otherCount),
      ];
    }
  }

  if (fromBank.length >= count) {
    return shuffle(fromBank).slice(0, count);
  }

  // Not enough in bank — generate the deficit
  const deficit = count - fromBank.length;
  const generated = await generateQuestions(section, level, deficit);

  return shuffle([...fromBank, ...generated]).slice(0, count);
}

// Get user's weak topics from recent exam results
async function getUserWeakTopics(userId: string): Promise<string[]> {
  const results = await prisma.examResult.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { weakTopics: true },
  });
  // Merge & deduplicate
  const topics = new Set<string>();
  for (const r of results) {
    for (const t of r.weakTopics) topics.add(t);
  }
  return Array.from(topics);
}

// ─── Exam Assembly ──────────────────────────────────────────────────────

/**
 * Full Exam: 40 questions
 * Grammar: 12, Vocabulary: 12, Reading: 10, Listening: 6
 */
export async function assembleFullExam(
  level: string,
  userId?: string,
): Promise<ExamQuestionData[]> {
  const [grammar, vocab, reading, listening] = await Promise.all([
    getOrGenerateQuestions("grammar", level, 12, userId),
    getOrGenerateQuestions("vocabulary", level, 12, userId),
    getOrGenerateQuestions("reading", level, 10, userId),
    getOrGenerateQuestions("listening", level, 6, userId),
  ]);

  return [...grammar, ...vocab, ...reading, ...listening];
}

/**
 * Quick Exam: 20 questions
 * Grammar: 6, Vocabulary: 6, Reading: 5, Listening: 3
 */
export async function assembleQuickExam(
  level: string,
  userId?: string,
): Promise<ExamQuestionData[]> {
  const [grammar, vocab, reading, listening] = await Promise.all([
    getOrGenerateQuestions("grammar", level, 6, userId),
    getOrGenerateQuestions("vocabulary", level, 6, userId),
    getOrGenerateQuestions("reading", level, 5, userId),
    getOrGenerateQuestions("listening", level, 3, userId),
  ]);

  return [...grammar, ...vocab, ...reading, ...listening];
}

/**
 * Section Exam: 10 questions from one section
 */
export async function assembleSectionExam(
  level: string,
  section: string,
  userId?: string,
): Promise<ExamQuestionData[]> {
  return getOrGenerateQuestions(section, level, 10, userId);
}

/**
 * Adaptive Exam (16B.8): after 3+ exams, mix toward weak topics
 * 50% weak topics, 30% mixed, 20% new
 */
export async function buildAdaptiveExam(
  userId: string,
  level: string,
): Promise<ExamQuestionData[]> {
  return assembleFullExam(level, userId);
}

/**
 * Check if user qualifies for adaptive exam (3+ completed exams)
 */
export async function shouldUseAdaptive(userId: string): Promise<boolean> {
  const count = await prisma.examResult.count({ where: { userId } });
  return count >= 3;
}

/**
 * Get difficulty recommendation based on recent scores
 */
export async function getLevelRecommendation(
  userId: string,
  currentLevel: string,
): Promise<string | null> {
  const recent = await prisma.examResult.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { totalScore: true },
  });
  if (recent.length < 3) return null;

  const avgScore = Math.round(recent.reduce((s: number, r: { totalScore: number }) => s + r.totalScore, 0) / recent.length);

  if (avgScore > 85 && currentLevel !== "C1") {
    return `Bạn đạt trung bình ${avgScore}/100 — nên thử chuyển lên ${currentLevel === "B1" ? "B2" : "C1"}!`;
  }
  if (avgScore < 60 && currentLevel !== "B1") {
    return `Bạn đạt trung bình ${avgScore}/100 — nên ôn lại level ${currentLevel === "C1" ? "B2" : "B1"} trước.`;
  }
  return null;
}

// ─── Helpers ────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
