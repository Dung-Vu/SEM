import { prisma } from "@/lib/prisma";
import { logEvent } from "@/lib/analytics";

// ─── Types ──────────────────────────────────────────────────────────────

export interface GrammarError {
  original: string;
  corrected: string;
  explanation: string;
  type: string;
}

export interface VocabSuggestion {
  original: string;
  better_option: string;
  reason: string;
}

export interface GradingResult {
  overallScore: number;
  grammarScore: number;
  vocabScore: number;
  coherenceScore: number;
  taskScore: number;
  aiFeedback: string;
  grammarErrors: GrammarError[];
  vocabSuggestions: VocabSuggestion[];
  rewriteSample: string;
  strengths: string[];
  improvements: string[];
  improvementVsLast: number | null;
  isPersonalBest: boolean;
}

export interface ComparisonResult {
  improvements: string[];
  remainingIssues: string[];
  scoreChangeEstimate: number;
  summary: string;
}

// ─── Grading Rubric ─────────────────────────────────────────────────────

const RUBRIC_WEIGHTS = {
  grammar: 0.30,
  vocabulary: 0.25,
  coherence: 0.25,
  task_achievement: 0.20,
};

// ─── Grade Submission ───────────────────────────────────────────────────

export async function gradeSubmission(
  content: string,
  promptInstruction: string,
  userLevel: string,
  previousScore?: number
): Promise<GradingResult> {
  const baseUrl = process.env.AI_BASE_URL || "https://coding-intl.dashscope.aliyuncs.com/v1";
  const apiKey = process.env.AI_API_KEY || "";
  const model = process.env.AI_MODEL || "qwen3.5-plus";

  const gradingPrompt = `You are an expert English writing examiner grading a ${userLevel} level student.

WRITING PROMPT:
"${promptInstruction}"

STUDENT'S SUBMISSION:
"${content}"

Grade this submission and return ONLY valid JSON (no markdown, no explanation outside JSON):

{
  "grammar_score": <0-100>,
  "vocab_score": <0-100>,
  "coherence_score": <0-100>,
  "task_score": <0-100>,

  "ai_feedback": "<3-4 sentences in Vietnamese: overall assessment, main strength, main weakness, encouragement>",

  "grammar_errors": [
    {
      "original": "<exact text from submission>",
      "corrected": "<corrected version>",
      "explanation": "<brief Vietnamese explanation why>",
      "type": "<tense|article|preposition|subject_verb|word_choice|word_order|other>"
    }
  ],

  "vocab_suggestions": [
    {
      "original": "<word/phrase used>",
      "better_option": "<more sophisticated alternative>",
      "reason": "<why this is better — Vietnamese>"
    }
  ],

  "rewrite_sample": "<Rewrite the weakest paragraph showing improvements. Keep same ideas, improve expression.>",

  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}

IMPORTANT RULES:
- grammar_errors: max 8, most important first. Reference exact quotes from the submission.
- vocab_suggestions: max 5
- strengths and improvements: max 3 each
- Be specific — reference exact text, not generic comments

Grading standards for ${userLevel}:
- B1: 70+ = good, 50-69 = average, <50 = needs work
- B2: 75+ = good, 55-74 = average, <55 = needs work
- C1: 80+ = good, 60-79 = average, <60 = needs work`;

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
          { role: "system", content: "You are an English writing examiner. Return ONLY valid JSON." },
          { role: "user", content: gradingPrompt },
        ],
        stream: false,
        max_tokens: 1500,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) throw new Error(`AI API error: ${res.status}`);
    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content?.trim() ?? "";

    // Extract JSON from response (may be wrapped in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in AI response");

    const parsed = JSON.parse(jsonMatch[0]);

    // Recalculate overall from weighted components (don't trust AI's overall)
    const grammarScore = clampScore(parsed.grammar_score);
    const vocabScore = clampScore(parsed.vocab_score);
    const coherenceScore = clampScore(parsed.coherence_score);
    const taskScore = clampScore(parsed.task_score);

    const overallScore = Math.round(
      grammarScore * RUBRIC_WEIGHTS.grammar +
      vocabScore * RUBRIC_WEIGHTS.vocabulary +
      coherenceScore * RUBRIC_WEIGHTS.coherence +
      taskScore * RUBRIC_WEIGHTS.task_achievement
    );

    const grammarErrors: GrammarError[] = Array.isArray(parsed.grammar_errors)
      ? parsed.grammar_errors.slice(0, 8).map((e: Record<string, string>) => ({
          original: String(e.original ?? ""),
          corrected: String(e.corrected ?? ""),
          explanation: String(e.explanation ?? ""),
          type: String(e.type ?? "other"),
        }))
      : [];

    const vocabSuggestions: VocabSuggestion[] = Array.isArray(parsed.vocab_suggestions)
      ? parsed.vocab_suggestions.slice(0, 5).map((s: Record<string, string>) => ({
          original: String(s.original ?? ""),
          better_option: String(s.better_option ?? ""),
          reason: String(s.reason ?? ""),
        }))
      : [];

    return {
      overallScore,
      grammarScore,
      vocabScore,
      coherenceScore,
      taskScore,
      aiFeedback: String(parsed.ai_feedback ?? ""),
      grammarErrors,
      vocabSuggestions,
      rewriteSample: String(parsed.rewrite_sample ?? ""),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3).map(String) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 3).map(String) : [],
      improvementVsLast: previousScore !== undefined ? overallScore - previousScore : null,
      isPersonalBest: false, // set later by checkPersonalBest
    };
  } catch (error) {
    console.error("gradeSubmission AI error:", error);
    return getFallbackGrading(content, previousScore);
  }
}

// ─── Fallback Grading ───────────────────────────────────────────────────

function getFallbackGrading(content: string, previousScore?: number): GradingResult {
  const wordCount = content.trim().split(/\s+/).length;
  // Simple heuristic scoring
  const lengthScore = Math.min(100, Math.round((wordCount / 200) * 70));
  const avgSentenceLen = content.split(/[.!?]+/).filter(Boolean).length;
  const complexityBonus = Math.min(30, avgSentenceLen * 3);
  const baseScore = Math.min(100, lengthScore + complexityBonus);

  return {
    overallScore: baseScore,
    grammarScore: baseScore,
    vocabScore: Math.max(40, baseScore - 5),
    coherenceScore: Math.max(40, baseScore - 3),
    taskScore: Math.max(40, baseScore - 8),
    aiFeedback: "Bài viết đã được nộp thành công. Hệ thống chấm AI tạm thời không khả dụng, điểm được tính tạm dựa trên độ dài và cấu trúc câu. Hãy thử nộp lại sau để nhận feedback chi tiết.",
    grammarErrors: [],
    vocabSuggestions: [],
    rewriteSample: "",
    strengths: ["Hoàn thành bài viết"],
    improvements: ["Thử nộp lại để nhận feedback chi tiết từ AI"],
    improvementVsLast: previousScore !== undefined ? baseScore - previousScore : null,
    isPersonalBest: false,
  };
}

// ─── Generate Custom Prompt ─────────────────────────────────────────────

export async function generateCustomPrompt(params: {
  type: string;
  level: string;
  topic?: string;
  focusSkill?: string;
}): Promise<{ title: string; instruction: string; minWords: number; maxWords: number; timeLimit: number | null }> {
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
            content: "Generate a writing assignment. Return ONLY valid JSON.",
          },
          {
            role: "user",
            content: `Generate a writing assignment:
- Type: ${params.type}
- Level: ${params.level}
- Topic: ${params.topic || "general"}
- Focus: ${params.focusSkill || "overall"}

Return JSON:
{
  "title": "short title (3-5 words)",
  "instruction": "full prompt 2-3 sentences, specific and engaging",
  "min_words": number,
  "max_words": number,
  "time_limit": minutes or null
}`,
          },
        ],
        stream: false,
        max_tokens: 300,
        temperature: 0.8,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`AI API error: ${res.status}`);
    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content?.trim() ?? "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      title: String(parsed.title ?? "Custom Assignment"),
      instruction: String(parsed.instruction ?? "Write about the given topic."),
      minWords: Number(parsed.min_words) || 150,
      maxWords: Number(parsed.max_words) || 350,
      timeLimit: parsed.time_limit != null ? Number(parsed.time_limit) : null,
    };
  } catch (error) {
    console.error("generateCustomPrompt error:", error);
    // Fallback
    return {
      title: `${params.type} — ${params.topic || "General"}`,
      instruction: `Write a ${params.level} level ${params.type} about ${params.topic || "a topic of your choice"}. Focus on ${params.focusSkill || "overall writing quality"}.`,
      minWords: 150,
      maxWords: 350,
      timeLimit: null,
    };
  }
}

// ─── Compare Versions (Rewrite) ─────────────────────────────────────────

export async function compareVersions(v1: string, v2: string): Promise<ComparisonResult> {
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
            content: "Compare two versions of a writing assignment. Return ONLY valid JSON.",
          },
          {
            role: "user",
            content: `Compare these two versions of the same writing assignment:

VERSION 1 (original): "${v1}"

VERSION 2 (rewrite): "${v2}"

Return JSON:
{
  "improvements": ["what got better — Vietnamese"],
  "remaining_issues": ["what still needs work — Vietnamese"],
  "score_change_estimate": <-20 to +20>,
  "summary": "<2 sentences Vietnamese: what improved, what to focus on next>"
}`,
          },
        ],
        stream: false,
        max_tokens: 400,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`AI API error: ${res.status}`);
    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content?.trim() ?? "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String) : [],
      remainingIssues: Array.isArray(parsed.remaining_issues) ? parsed.remaining_issues.map(String) : [],
      scoreChangeEstimate: Number(parsed.score_change_estimate) || 0,
      summary: String(parsed.summary ?? ""),
    };
  } catch (error) {
    console.error("compareVersions error:", error);
    return {
      improvements: ["Bạn đã viết lại bài — đây là bước tiến tốt!"],
      remainingIssues: ["Hãy nộp để xem điểm chính xác."],
      scoreChangeEstimate: 0,
      summary: "Không thể so sánh tự động lúc này. Hãy nộp bài viết lại để nhận điểm mới.",
    };
  }
}

// ─── Personal Best Check ────────────────────────────────────────────────

export async function checkPersonalBest(
  userId: string,
  submissionId: string,
  overallScore: number,
  promptType: string
): Promise<boolean> {
  // Find the best previous score for this type
  const bestPrevious = await prisma.writingSubmission.findFirst({
    where: {
      userId,
      id: { not: submissionId },
      prompt: { type: promptType },
      overallScore: { not: null },
    },
    orderBy: { overallScore: "desc" },
    select: { overallScore: true },
  });

  const previousBest = bestPrevious?.overallScore ?? 0;

  if (overallScore > previousBest) {
    // Mark as personal best
    await prisma.writingSubmission.update({
      where: { id: submissionId },
      data: { isPersonalBest: true },
    });

    // Log milestone event
    void logEvent(userId, "writing_personal_best", "writing", overallScore, undefined, {
      type: promptType,
      score: overallScore,
      previousBest,
    });

    return true;
  }

  return false;
}

// ─── Get Previous Score ─────────────────────────────────────────────────

export async function getPreviousScore(
  userId: string,
  promptType: string
): Promise<number | undefined> {
  const previous = await prisma.writingSubmission.findFirst({
    where: {
      userId,
      prompt: { type: promptType },
      overallScore: { not: null },
    },
    orderBy: { submittedAt: "desc" },
    select: { overallScore: true },
  });

  return previous?.overallScore ?? undefined;
}

// ─── Sync Writing Errors to Tutor Memory ────────────────────────────────

export async function syncWritingToMemory(
  userId: string,
  grammarErrors: GrammarError[]
): Promise<void> {
  if (grammarErrors.length === 0) return;

  try {
    const { getTutorMemory, updateTutorMemory } = await import("@/lib/tutor-memory");
    const memory = await getTutorMemory(userId);

    // Merge writing errors into existing error patterns
    const patterns = [...memory.errorPatterns];

    for (const error of grammarErrors) {
      const existing = patterns.find(p => p.type === error.type);
      if (existing) {
        existing.count++;
        existing.lastSeen = new Date().toISOString();
        existing.examples = [
          `"${error.original}" → "${error.corrected}"`,
          ...existing.examples,
        ].slice(0, 3);
      } else {
        patterns.push({
          type: error.type,
          subtype: undefined,
          count: 1,
          lastSeen: new Date().toISOString(),
          examples: [`"${error.original}" → "${error.corrected}"`],
          trend: "stable" as const,
        });
      }
    }

    // Keep top 20
    const sorted = patterns.sort((a, b) => b.count - a.count).slice(0, 20);
    await updateTutorMemory(userId, { errorPatterns: sorted });
  } catch {
    // Non-blocking — tutor memory sync is optional
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────

function clampScore(val: unknown): number {
  const n = Number(val);
  if (isNaN(n)) return 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}
