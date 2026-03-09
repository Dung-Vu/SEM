import { getTutorMemory, updateTutorMemory } from "@/lib/tutor-memory";
import type { ErrorPattern } from "@/lib/tutor-memory";

// ─── Error Types ────────────────────────────────────────────────────────

type ErrorType =
  | "tense"
  | "article"
  | "preposition"
  | "subject_verb"
  | "word_choice"
  | "word_order"
  | "vocab_missing"
  | "other";

interface ClassifiedError {
  type: ErrorType;
  subtype?: string;
  example: string;
}

interface Correction {
  original: string;
  corrected: string;
}

// ─── AI Classification ──────────────────────────────────────────────────

/**
 * Batch-classify corrections using Qwen AI.
 * Sends all corrections in a single API call for efficiency.
 */
async function batchClassifyErrors(corrections: Correction[]): Promise<ClassifiedError[]> {
  if (corrections.length === 0) return [];

  const baseUrl = process.env.AI_BASE_URL || "https://coding-intl.dashscope.aliyuncs.com/v1";
  const apiKey = process.env.AI_API_KEY || "";
  const model = process.env.AI_MODEL || "qwen3.5-plus";

  const correctionsText = corrections
    .map((c, i) => `${i + 1}. "${c.original}" → "${c.corrected}"`)
    .join("\n");

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
            content: `You classify English grammar corrections. For each correction, identify the error type.
Available types: tense, article, preposition, subject_verb, word_choice, word_order, vocab_missing, other.
Return ONLY a JSON array. Example: [{"type":"tense","subtype":"past_simple"},{"type":"article"}]
One entry per correction, in the same order. No explanation.`,
          },
          { role: "user", content: correctionsText },
        ],
        stream: false,
        max_tokens: 300,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`AI API error: ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() ?? "[]";

    // Extract JSON from response (might have markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return corrections.map(c => fallbackClassify(c));

    const parsed = JSON.parse(jsonMatch[0]) as { type?: string; subtype?: string }[];
    return parsed.map((entry, i) => ({
      type: (isValidErrorType(entry.type) ? entry.type : "other") as ErrorType,
      subtype: entry.subtype,
      example: `"${corrections[i].original}" → "${corrections[i].corrected}"`,
    }));
  } catch {
    // Fallback: simple rule-based classification
    return corrections.map(c => fallbackClassify(c));
  }
}

// ─── Fallback Rule-based Classifier ─────────────────────────────────────

function fallbackClassify(c: Correction): ClassifiedError {
  const orig = c.original.toLowerCase();
  const corr = c.corrected.toLowerCase();

  // Tense indicators
  const tenseWords = ["was", "were", "had", "has", "have", "did", "will", "would", "been"];
  if (tenseWords.some(w => corr.includes(w) && !orig.includes(w))) {
    return { type: "tense", example: `"${c.original}" → "${c.corrected}"` };
  }

  // Article
  if (/\b(a|an|the)\b/.test(corr) && !/\b(a|an|the)\b/.test(orig)) {
    return { type: "article", example: `"${c.original}" → "${c.corrected}"` };
  }

  // Preposition
  const preps = ["in", "on", "at", "for", "with", "to", "from", "by", "about"];
  for (const p of preps) {
    if (corr.includes(` ${p} `) && !orig.includes(` ${p} `)) {
      return { type: "preposition", subtype: p, example: `"${c.original}" → "${c.corrected}"` };
    }
  }

  // Subject-verb agreement
  if (/\b(goes|does|has|is)\b/.test(corr) && /\b(go|do|have|are)\b/.test(orig)) {
    return { type: "subject_verb", example: `"${c.original}" → "${c.corrected}"` };
  }

  return { type: "other", example: `"${c.original}" → "${c.corrected}"` };
}

function isValidErrorType(t: string | undefined): t is ErrorType {
  return [
    "tense", "article", "preposition", "subject_verb",
    "word_choice", "word_order", "vocab_missing", "other",
  ].includes(t ?? "");
}

// ─── Main: Classify and Update Patterns ─────────────────────────────────

/**
 * Classify corrections from a Speak session and update error patterns in TutorMemory.
 * Returns the classified errors for use in session logging.
 */
export async function classifyAndUpdateErrors(
  userId: string,
  corrections: Correction[]
): Promise<ClassifiedError[]> {
  if (corrections.length === 0) return [];

  // 1. Classify all corrections (batch AI call)
  const classified = await batchClassifyErrors(corrections);

  // 2. Load existing patterns
  const memory = await getTutorMemory(userId);
  const patterns: ErrorPattern[] = [...memory.errorPatterns];

  // 3. Track which errors are new
  const newErrors: ClassifiedError[] = [];

  // 4. Update counts + examples
  for (const error of classified) {
    const existing = patterns.find(
      p => p.type === error.type && p.subtype === error.subtype
    );

    if (existing) {
      existing.count++;
      existing.lastSeen = new Date().toISOString();
      existing.examples = [error.example, ...existing.examples].slice(0, 3);
    } else {
      newErrors.push(error);
      patterns.push({
        type: error.type,
        subtype: error.subtype,
        count: 1,
        lastSeen: new Date().toISOString(),
        examples: [error.example],
        trend: "stable",
      });
    }
  }

  // 5. Update trends
  for (const p of patterns) {
    const daysSinceLastSeen = Math.floor(
      (Date.now() - new Date(p.lastSeen).getTime()) / 864e5
    );
    if (daysSinceLastSeen > 14) {
      p.trend = "decreasing";
    } else if (p.count > 5 && daysSinceLastSeen < 3) {
      p.trend = "increasing";
    }
    // else keep current trend
  }

  // 6. Save — keep top 20 patterns, sorted by count desc
  const sorted = patterns.sort((a, b) => b.count - a.count).slice(0, 20);
  await updateTutorMemory(userId, { errorPatterns: sorted });

  return classified;
}

/**
 * Parse corrections from AI message text.
 * Looks for patterns like: ❌ "original" → ✅ "corrected"
 * or simpler: "original" → "corrected"
 */
export function parseCorrectionsFromMessages(
  messages: { role: string; content: string }[]
): Correction[] {
  const corrections: Correction[] = [];
  const seen = new Set<string>();

  for (const msg of messages) {
    if (msg.role !== "assistant") continue;

    // Pattern 1: ❌ ... → ✅ ...
    const crossArrowMatches = msg.content.matchAll(
      /❌\s*["""]?(.+?)["""]?\s*→\s*✅\s*["""]?(.+?)["""]?\s*(?:\(|$|\n)/g
    );
    for (const match of crossArrowMatches) {
      const key = `${match[1].trim()}→${match[2].trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        corrections.push({ original: match[1].trim(), corrected: match[2].trim() });
      }
    }

    // Pattern 2: "original" → "corrected" (without emoji) — always check, dedup
    const quoteArrowMatches = msg.content.matchAll(
      /["""](.+?)["""]\s*→\s*["""](.+?)["""]/g
    );
    for (const match of quoteArrowMatches) {
      const key = `${match[1].trim()}→${match[2].trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        corrections.push({ original: match[1].trim(), corrected: match[2].trim() });
      }
    }
  }

  return corrections;
}
