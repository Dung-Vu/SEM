# ✍️ PHASE 16 — WRITING LAB

> Phase 15 ✅ All Done → Phase 16: AI-graded Writing Assignments
> Stack: Next.js · PostgreSQL · Prisma · Qwen 3.5-plus
> Updated: 2026-03-09

---

## 🎯 VISION

**Codename: EXAMINER**

Mục tiêu: Tạo môi trường luyện viết có cấu trúc — user viết bài → AI chấm như giám khảo IELTS thật → track tiến bộ theo thời gian.

> "Không phải chỉ 'bài viết của bạn tốt'. Mà là: 'Câu 3 dùng sai thì, đây là cách viết lại.'"

---

## 📋 TỔNG QUAN

| #    | Item                      | Nhóm        | Priority |
| ---- | ------------------------- | ----------- | -------- |
| 16.1 | Assignment Schema         | Foundation  | 🔴 P0   |
| 16.2 | Prompt Library            | Content     | 🔴 P0   |
| 16.3 | Writing Editor            | UI          | 🔴 P0   |
| 16.4 | AI Grading Engine         | Core        | 🔴 P0   |
| 16.5 | Detailed Feedback UI      | UI          | 🔴 P0   |
| 16.6 | Progress Comparison       | Feature     | 🟡 P1   |
| 16.7 | Rewrite Assistant         | Feature     | 🟡 P1   |
| 16.8 | Writing Stats Dashboard   | UI          | 🟡 P1   |
| 16.9 | Quest Integration         | Integration | 🟢 P2   |
| 16.10| Tutor Memory Integration  | Integration | 🟢 P2   |

---

## 🔴 16.1 — ASSIGNMENT SCHEMA

```sql
-- Đề bài
CREATE TABLE writing_prompts (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  instruction  TEXT NOT NULL,       -- Đề bài đầy đủ
  type         TEXT NOT NULL,       -- 'essay' | 'paragraph' | 'email' | 'report' | 'story'
  level        TEXT NOT NULL,       -- 'B1' | 'B2' | 'C1' | 'C2'
  topic        TEXT,                -- 'technology' | 'environment' | 'business' | 'society' ...
  min_words    INTEGER DEFAULT 150,
  max_words    INTEGER DEFAULT 350,
  time_limit   INTEGER,             -- phút, NULL = không giới hạn
  is_ai_generated BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Bài làm của user
CREATE TABLE writing_submissions (
  id             SERIAL PRIMARY KEY,
  user_id        TEXT NOT NULL,
  prompt_id      INTEGER REFERENCES writing_prompts(id),
  custom_prompt  TEXT,              -- Nếu user tự đặt đề
  content        TEXT NOT NULL,     -- Bài viết
  word_count     INTEGER,
  time_spent_sec INTEGER,

  -- AI Grading
  overall_score     INTEGER,        -- 0-100
  grammar_score     INTEGER,        -- 0-100
  vocab_score       INTEGER,        -- 0-100
  coherence_score   INTEGER,        -- 0-100
  task_score        INTEGER,        -- 0-100 (có đúng yêu cầu đề không)

  -- Feedback
  ai_feedback       TEXT,           -- Nhận xét tổng quan (AI viết)
  grammar_errors    JSONB,          -- [{original, corrected, explanation, position}]
  vocab_suggestions JSONB,          -- [{original, better_option, reason}]
  rewrite_sample    TEXT,           -- AI viết lại 1 đoạn mẫu

  -- Comparison
  improvement_vs_last INTEGER,      -- +5, -3, 0 so với bài trước cùng type
  is_personal_best   BOOLEAN DEFAULT FALSE,

  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_submissions_user ON writing_submissions(user_id, submitted_at DESC);
CREATE INDEX idx_submissions_type ON writing_submissions(user_id, prompt_id);
```

---

## 🔴 16.2 — PROMPT LIBRARY

### Pre-built prompts (seed data)

**Essay — B1 (5 đề)**
```
1. "Do you think technology makes people more or less social? Give your opinion with examples."
2. "Should students be required to wear uniforms at school? Discuss both sides."
3. "Is it better to live in a big city or a small town? Why?"
4. "How has social media changed the way people communicate?"
5. "Should young people take a gap year before university?"
```

**Essay — B2 (5 đề)**
```
1. "Some argue that economic growth should be prioritized over environmental protection. To what extent do you agree?"
2. "Remote work has transformed the modern workplace. Discuss advantages and disadvantages."
3. "Is artificial intelligence a threat or an opportunity for employment?"
4. "The gap between rich and poor continues to widen. What are the causes and solutions?"
5. "Should governments invest more in space exploration or focus on Earth's problems?"
```

**Essay — C1 (5 đề)**
```
1. "Globalization has eroded cultural identity. Critically evaluate this statement."
2. "The commodification of education undermines its fundamental purpose. Discuss."
3. "To what extent should individual freedoms be restricted for the collective good?"
4. "Cryptocurrency represents the future of finance. Assess this claim."
5. "Is meritocracy a myth in modern societies?"
```

**Paragraph — B1/B2 (5 đề)**
```
1. "Describe a person who has influenced your life significantly."
2. "Write a paragraph about the pros and cons of online learning."
3. "Describe your ideal work environment."
4. "Write about a challenge you overcame and what you learned."
5. "Explain how you manage stress in daily life."
```

**Email — B1/B2 (5 đề)**
```
1. "Write a formal email to your manager requesting a day off."
2. "Write a complaint email to a hotel about poor service."
3. "Write a follow-up email after a job interview."
4. "Write an email to a colleague explaining a project delay."
5. "Write a professional email introducing yourself to a new team."
```

**Specialty — Trading/Business (phù hợp với profile)**
```
1. "Explain the concept of risk management in financial trading."
2. "What are the psychological challenges of being a trader?"
3. "Write a brief analysis of how AI is changing financial markets."
4. "Describe the key differences between fundamental and technical analysis."
```

### AI Prompt Generator

```typescript
// User có thể yêu cầu AI tạo đề theo yêu cầu
export async function generateCustomPrompt(params: {
  type: string;
  level: string;
  topic?: string;
  focusSkill?: string; // 'vocabulary' | 'grammar' | 'argumentation'
}): Promise<WritingPrompt> {
  const prompt = `
    Generate a writing assignment:
    - Type: ${params.type}
    - Level: ${params.level}
    - Topic: ${params.topic || 'general'}
    - Focus: ${params.focusSkill || 'overall'}
    
    Return JSON:
    {
      "title": "short title",
      "instruction": "full prompt 2-3 sentences",
      "min_words": number,
      "max_words": number,
      "time_limit": minutes or null
    }
    
    Make it specific and engaging, not generic.
  `;

  return await qwen.complete(prompt, { json: true });
}
```

---

## 🔴 16.3 — WRITING EDITOR

### Page: `/writing`

```
┌─────────────────────────────────┐
│  ✍️  WRITING LAB                │
├─────────────────────────────────┤
│  [Browse Prompts] [AI Generate] │
│  [My Submissions]               │
└─────────────────────────────────┘
```

### Page: `/writing/[promptId]`

```
┌─────────────────────────────────┐
│  ← Back           B2 · Essay    │
│                                 │
│  "Is AI a threat or             │
│  opportunity for employment?"   │
│  150-350 words · No time limit  │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │  [Textarea — large]       │  │
│  │                           │  │
│  │                           │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  Word count: 0 / 150-350        │
│  [●●●●●●●○○○] — progress bar   │
│                                 │
│  [Submit for Grading]           │
│  (disabled until min words met) │
└─────────────────────────────────┘
```

### Editor Features
```tsx
<WritingEditor>
  {/* Auto word count */}
  {/* Progress bar: 0 → min_words → max_words */}
  {/* Color: red (under min) → gold (in range) → orange (over max) */}

  {/* Timer (optional) */}
  {/* Nếu có time_limit: countdown timer góc trên phải */}

  {/* Auto-save draft mỗi 30 giây → localStorage */}

  {/* Submit button */}
  {/* Disabled khi word_count < min_words */}
  {/* Loading state khi đang chấm: "SENSEI đang chấm bài..." */}
</WritingEditor>
```

---

## 🔴 16.4 — AI GRADING ENGINE

### Grading Rubric

```typescript
// 4 tiêu chí chấm điểm, mỗi cái 0-100

const GRADING_RUBRIC = {
  grammar: {
    weight: 0.30,
    description: 'Grammar accuracy, sentence structure, punctuation'
  },
  vocabulary: {
    weight: 0.25,
    description: 'Range, appropriacy, precision of vocabulary'
  },
  coherence: {
    weight: 0.25,
    description: 'Logic flow, paragraph structure, cohesive devices'
  },
  task_achievement: {
    weight: 0.20,
    description: 'How well the writing addresses the prompt'
  }
};

// overall_score = weighted average
```

### Grading Prompt

```typescript
export async function gradeSubmission(
  submission: string,
  prompt: WritingPrompt,
  userLevel: string,
  previousScore?: number
): Promise<GradingResult> {

  const gradingPrompt = `
You are an expert English writing examiner grading a ${userLevel} level student.

WRITING PROMPT:
"${prompt.instruction}"

STUDENT'S SUBMISSION:
"${submission}"

Grade this submission and return ONLY valid JSON (no markdown, no explanation outside JSON):

{
  "overall_score": <0-100>,
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
      "type": "<tense|article|preposition|subject_verb|word_order|other>"
    }
    // max 8 errors, most important first
  ],

  "vocab_suggestions": [
    {
      "original": "<word/phrase used>",
      "better_option": "<more sophisticated alternative>",
      "reason": "<why this is better — Vietnamese>"
    }
    // max 5 suggestions
  ],

  "rewrite_sample": "<Rewrite the weakest paragraph showing improvements. Keep same ideas, improve expression.>",

  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}

Grading standards for ${userLevel}:
- B1: 70+ = good, 50-69 = average, <50 = needs work
- B2: 75+ = good, 55-74 = average, <55 = needs work  
- C1: 80+ = good, 60-79 = average, <60 = needs work

Be specific with errors — reference exact quotes from the submission.
  `;

  const raw = await qwen.complete(gradingPrompt);
  const result = JSON.parse(raw);

  // Calculate overall
  result.overall_score = Math.round(
    result.grammar_score * 0.30 +
    result.vocab_score   * 0.25 +
    result.coherence_score * 0.25 +
    result.task_score    * 0.20
  );

  // Compare với bài trước
  if (previousScore !== undefined) {
    result.improvement_vs_last = result.overall_score - previousScore;
  }

  return result;
}
```

---

## 🔴 16.5 — DETAILED FEEDBACK UI

### Page: `/writing/result/[submissionId]`

```
┌─────────────────────────────────┐
│  ← Back                         │
│                                 │
│  📊 GRADING RESULT              │
│  "Is AI a threat..."            │
├─────────────────────────────────┤
│  OVERALL SCORE                  │
│                                 │
│         78                      │
│        /100                     │
│                                 │
│  ↑ +5 từ bài trước  🏆 Best!   │
├─────────────────────────────────┤
│  BREAKDOWN                      │
│  Grammar    ████████░░  82      │
│  Vocabulary ███████░░░  74      │
│  Coherence  ████████░░  79      │
│  Task       ███████░░░  76      │
├─────────────────────────────────┤
│  🧠 SENSEI NHẬN XÉT             │
│  [ai_feedback text]             │
├─────────────────────────────────┤
│  ❌ LỖI CẦN SỬA (5)            │
│                                 │
│  #1 Tense Error                 │
│  ❌ "AI are replacing"          │
│  ✅ "AI is replacing"           │
│  💡 AI là danh từ số ít         │
│                                 │
│  #2 Word Choice                 │
│  ❌ "make a lot of jobs"        │
│  ✅ "create numerous jobs"      │
│  💡 Dùng từ chính xác hơn       │
│  ...                            │
├─────────────────────────────────┤
│  💡 GỢI Ý TỪ VỰNG (3)         │
│                                 │
│  "important" → "crucial"        │
│  "show" → "demonstrate"         │
│  "use" → "leverage"             │
├─────────────────────────────────┤
│  ✨ BÀI MẪU (đoạn yếu nhất)    │
│  [rewrite_sample — highlighted] │
├─────────────────────────────────┤
│  [Viết lại] [Đề mới]            │
└─────────────────────────────────┘
```

### Error Highlighting

```tsx
// Highlight lỗi trực tiếp trong bài viết
<SubmissionViewer content={submission.content} errors={submission.grammarErrors}>
  {/* Mỗi error: underline đỏ + tooltip khi tap */}
  {/* Tap → popup: original → corrected + explanation */}
</SubmissionViewer>
```

---

## 🟡 16.6 — PROGRESS COMPARISON

### Track theo thời gian

```tsx
// /writing/progress

// Line chart: overall score theo thời gian
// Separate lines: grammar / vocab / coherence / task
// Filter: 'essay' | 'paragraph' | 'email' | 'all'

<ProgressChart>
  <LineChart data={submissionHistory}>
    <Line dataKey="overall_score" stroke="var(--gold)" />
    <Line dataKey="grammar_score" stroke="var(--cyan)" />
    <Line dataKey="vocab_score" stroke="var(--violet)" />
  </LineChart>
</ProgressChart>

// Stats summary
<StatsRow>
  <Stat label="Bài đã nộp" value={totalSubmissions} />
  <Stat label="Điểm TB" value={avgScore} />
  <Stat label="Best score" value={bestScore} />
  <Stat label="Tiến bộ" value={`+${improvement}pts`} trend="up" />
</StatsRow>
```

### Personal Best System

```typescript
// Sau khi chấm, check xem có phá kỷ lục không
async function checkPersonalBest(userId: string, result: GradingResult, type: string) {
  const previousBest = await getBestScore(userId, type);

  if (result.overall_score > (previousBest || 0)) {
    await markPersonalBest(submissionId);
    // Trigger celebration animation
    // Log milestone event
    await logEvent(userId, 'writing_personal_best', 'writing', result.overall_score);
  }
}
```

---

## 🟡 16.7 — REWRITE ASSISTANT

### Concept
Sau khi xem feedback, user có thể **viết lại bài** → AI so sánh 2 phiên bản → show improvement.

```
[Viết lại] button → mở editor với:
  - Bài cũ hiển thị bên cạnh (reference)
  - Errors highlighted để fix
  - Submit → AI chấm lại + so sánh v1 vs v2
```

```typescript
// So sánh 2 phiên bản
export async function compareVersions(v1: string, v2: string): Promise<ComparisonResult> {
  const prompt = `
    Compare these two versions of the same writing assignment:
    
    VERSION 1: "${v1}"
    VERSION 2: "${v2}"
    
    Return JSON:
    {
      "improvements": ["what got better"],
      "remaining_issues": ["what still needs work"],
      "score_change_estimate": <-20 to +20>,
      "summary": "<2 sentences Vietnamese: what improved, what to focus on next>"
    }
  `;

  return await qwen.complete(prompt, { json: true });
}
```

---

## 🟡 16.8 — WRITING STATS DASHBOARD

```
/writing — Main page với 3 tabs:

[Prompts] [My Work] [Stats]

Stats tab:
┌─────────────────────────────────┐
│  WRITING OVERVIEW               │
│  12 bài · Avg 76pts · ↑ +8/month│
├─────────────────────────────────┤
│  STRONGEST SKILL                │
│  Grammar 84 ████████░░          │
│                                 │
│  NEEDS WORK                     │
│  Vocabulary 68 ██████░░░░       │
├─────────────────────────────────┤
│  COMMON ERRORS (top 3)          │
│  1. Tense errors ×14            │
│  2. Article usage ×9            │
│  3. Word choice ×7              │
├─────────────────────────────────┤
│  RECENT SUBMISSIONS             │
│  Essay B2 · 78pts · 2 ngày trước│
│  Email B1 · 82pts · 5 ngày trước│
│  Essay B2 · 73pts · 1 tuần trước│
└─────────────────────────────────┘
```

---

## 🟢 16.9 — QUEST INTEGRATION

```typescript
// Thêm vào quest system

{
  id: 'writing_lab',
  title: 'Submit Writing',
  description: 'Nộp 1 bài Writing Lab',
  exp: 40,
  type: 'side_quest',
  trigger: 'writing_submission'
}

{
  id: 'writing_improvement',
  title: 'Writing Improvement',
  description: 'Đạt điểm cao hơn bài trước',
  exp: 50,
  type: 'weekly_challenge',
  trigger: 'writing_personal_best'
}
```

---

## 🟢 16.10 — TUTOR MEMORY INTEGRATION

```typescript
// Sau mỗi submission, sync writing errors → Tutor Memory
// Để SENSEI biết lỗi viết → nhắc trong Speak sessions

export async function syncWritingToMemory(
  userId: string,
  grammarErrors: GrammarError[]
) {
  // Classify errors giống Phase 15
  // Update tutor_memory.error_patterns
  // AI sẽ mention: "Trong bài viết của bạn hay nhầm thì,
  //                 hôm nay mình chú ý điều đó trong Speak nhé"
}
```

---

## 📊 DATA FLOW

```
User chọn prompt (pre-built hoặc AI generate)
      ↓
Writing Editor (auto-save draft)
      ↓
Submit → gradeSubmission() → Qwen 3.5-plus
      ↓
      ├─→ Save to writing_submissions
      ├─→ checkPersonalBest()
      ├─→ syncWritingToMemory() (Phase 15 integration)
      ├─→ logEvent('writing_submitted') (Phase 14 integration)
      └─→ Redirect to /writing/result/[id]
```

---

## 📊 IMPLEMENTATION ORDER

### Sprint 1 — Foundation
```
1. Schema: writing_prompts + writing_submissions — 1h
2. Seed 25 prompts — 1.5h
3. AI generateCustomPrompt() — 1h
4. Writing Editor UI — 2.5h
```

### Sprint 2 — Grading Engine
```
5. gradeSubmission() với full rubric — 3h
6. POST /api/writing/submit → grade → save — 1.5h
7. Result page UI — 2.5h
8. Error highlighting trong submission text — 2h
```

### Sprint 3 — Progress & Comparison
```
9.  Progress chart (Recharts) — 1.5h
10. Personal Best system — 1h
11. Rewrite Assistant — 2h
12. Compare versions UI — 1.5h
```

### Sprint 4 — Integration & Polish
```
13. Writing Stats dashboard — 2h
14. Quest integration — 1h
15. Tutor Memory sync — 1h
16. Navigation: thêm Writing vào More drawer — 30min
```

**Total estimate: ~29h**

---

## 🔑 KEY PRINCIPLES

1. **Specific errors only** — AI reference exact quotes từ bài viết, không nói chung chung
2. **Level-calibrated scoring** — 78/100 ở B2 khác 78/100 ở B1
3. **Max 8 errors** — không overwhelm user với 20 corrections
4. **Rewrite sample là bắt buộc** — user cần thấy "thế này trông như thế nào khi viết tốt"
5. **Progress over perfection** — celebrate improvement, không chỉ absolute score
6. **Draft auto-save** — không mất bài khi thoát app

---

_Phase 16: EXAMINER — Writing Lab & AI Grading_
_Player: Dũng Vũ · Phase 16 start: 2026-03-09_
