# 📝 PHASE 16B — EXAM MODE (MULTIPLE CHOICE)

> Phase 16 Writing Lab → 16B: Nhánh ABCD Exam
> Stack: Next.js · PostgreSQL · Prisma · Qwen 3.5-plus · Web Speech API
> Updated: 2026-03-09

---

## 🎯 VISION

**Codename: TRIBUNAL**

Mục tiêu: Full 40-câu exam giống TOEIC/IELTS format — Grammar + Vocab + Reading + Listening —
AI generate đề theo level thật, chấm tức thì, giải thích từng đáp án sai.

> "Không phải quiz nhỏ. Là bài thi thật, có áp lực, có giải thích."

---

## 📋 TỔNG QUAN

| #     | Item                       | Nhóm       | Priority |
| ----- | -------------------------- | ---------- | -------- |
| 16B.1 | Exam Schema                | Foundation | 🔴 P0   |
| 16B.2 | Question Generator (AI)    | Core       | 🔴 P0   |
| 16B.3 | Pre-built Question Bank    | Content    | 🔴 P0   |
| 16B.4 | Exam UI — Question Flow    | UI         | 🔴 P0   |
| 16B.5 | Listening Section (TTS)    | Feature    | 🔴 P0   |
| 16B.6 | Result & Explanation UI    | UI         | 🔴 P0   |
| 16B.7 | Exam History & Stats       | Feature    | 🟡 P1   |
| 16B.8 | Adaptive Exam Engine       | Feature    | 🟡 P1   |
| 16B.9 | Quest & Memory Integration | Integration| 🟢 P2   |

---

## 🔴 16B.1 — EXAM SCHEMA

```sql
-- Câu hỏi (pre-built + AI generated)
CREATE TABLE exam_questions (
  id           SERIAL PRIMARY KEY,
  section      TEXT NOT NULL,    -- 'grammar' | 'vocabulary' | 'reading' | 'listening'
  level        TEXT NOT NULL,    -- 'B1' | 'B2' | 'C1'
  topic        TEXT,             -- 'tense' | 'idiom' | 'business' ...

  -- Content
  passage      TEXT,             -- Bài đọc (reading) hoặc transcript (listening)
  question     TEXT NOT NULL,    -- Câu hỏi
  option_a     TEXT NOT NULL,
  option_b     TEXT NOT NULL,
  option_c     TEXT NOT NULL,
  option_d     TEXT NOT NULL,
  correct      TEXT NOT NULL,    -- 'A' | 'B' | 'C' | 'D'
  explanation  TEXT NOT NULL,    -- Giải thích tại sao đáp án đúng

  is_ai_generated BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_section_level ON exam_questions(section, level);

-- Đề thi
CREATE TABLE exams (
  id           SERIAL PRIMARY KEY,
  user_id      TEXT NOT NULL,
  level        TEXT NOT NULL,
  mode         TEXT NOT NULL,    -- 'full' (40 câu) | 'quick' (20) | 'section' (10)
  sections     TEXT[],           -- ['grammar','vocabulary','reading','listening']
  question_ids INTEGER[],        -- 40 câu được chọn
  time_limit   INTEGER,          -- phút: full=60, quick=30, section=15
  started_at   TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  time_spent   INTEGER,          -- giây thực tế làm bài
  status       TEXT DEFAULT 'pending' -- 'pending'|'in_progress'|'submitted'
);

-- Đáp án user
CREATE TABLE exam_answers (
  id           SERIAL PRIMARY KEY,
  exam_id      INTEGER REFERENCES exams(id),
  question_id  INTEGER REFERENCES exam_questions(id),
  user_answer  TEXT,             -- 'A'|'B'|'C'|'D'|NULL (bỏ qua)
  is_correct   BOOLEAN,
  time_spent   INTEGER,          -- giây cho câu này
  flagged      BOOLEAN DEFAULT FALSE -- user đánh dấu review lại
);

-- Kết quả
CREATE TABLE exam_results (
  id                SERIAL PRIMARY KEY,
  exam_id           INTEGER REFERENCES exams(id) UNIQUE,
  user_id           TEXT NOT NULL,

  -- Scores
  total_score       INTEGER,    -- 0-100
  grammar_score     INTEGER,
  vocab_score       INTEGER,
  reading_score     INTEGER,
  listening_score   INTEGER,

  -- Stats
  total_correct     INTEGER,
  total_wrong       INTEGER,
  total_skipped     INTEGER,
  accuracy_rate     FLOAT,      -- correct / answered

  -- Comparison
  vs_last_exam      INTEGER,    -- +5, -3, 0
  is_personal_best  BOOLEAN DEFAULT FALSE,

  -- AI Analysis
  ai_analysis       TEXT,       -- Qwen viết nhận xét tổng quan
  weak_topics       TEXT[],     -- ['past_perfect', 'preposition', ...]
  strong_topics     TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_results_user ON exam_results(user_id, created_at DESC);
```

---

## 🔴 16B.2 — QUESTION GENERATOR (AI)

### Generate theo section

```typescript
// src/lib/exam-generator.ts

export async function generateQuestions(params: {
  section: 'grammar' | 'vocabulary' | 'reading' | 'listening';
  level: string;
  count: number;
  topic?: string;
  avoidTopics?: string[]; // từ exam history — không lặp lại
}): Promise<ExamQuestion[]> {

  const sectionPrompts = {
    grammar: `
      Generate ${params.count} grammar multiple choice questions for ${params.level} level.
      ${params.topic ? `Focus on: ${params.topic}` : 'Mix of: tenses, articles, prepositions, conditionals, passive voice'}
      ${params.avoidTopics?.length ? `Avoid: ${params.avoidTopics.join(', ')}` : ''}
      
      Each question: fill in the blank or choose correct form.
      Example: "She ___ to the store yesterday." A) go B) goes C) went D) gone
    `,

    vocabulary: `
      Generate ${params.count} vocabulary questions for ${params.level} level.
      Mix of: word meaning, synonym, antonym, word in context, collocation.
      Include some advanced words relevant to: business, technology, academic contexts.
    `,

    reading: `
      Generate 1 reading passage (150-200 words) for ${params.level} level.
      Then generate ${params.count} comprehension questions about the passage.
      Topics: current affairs, science, business, culture.
      Question types: main idea, inference, detail, vocabulary in context.
    `,

    listening: `
      Generate ${params.count} listening-style questions for ${params.level} level.
      Format: short transcript (2-4 sentences) + question about it.
      Topics: conversations, announcements, short talks.
      The transcript will be read aloud via TTS.
    `
  };

  const prompt = `
    ${sectionPrompts[params.section]}
    
    Return ONLY a JSON array (no markdown):
    [
      {
        "section": "${params.section}",
        "level": "${params.level}",
        "topic": "specific grammar/vocab topic",
        "passage": "only for reading/listening sections, else null",
        "question": "the question text",
        "option_a": "...",
        "option_b": "...",
        "option_c": "...",
        "option_d": "...",
        "correct": "A|B|C|D",
        "explanation": "Vietnamese explanation of why correct answer is right and why others are wrong"
      }
    ]
    
    Make distractors (wrong answers) plausible — not obviously wrong.
  `;

  const raw = await qwen.complete(prompt);
  return JSON.parse(raw);
}
```

### Full Exam Assembly (40 câu)

```typescript
export async function assembleFullExam(
  userId: string,
  level: string
): Promise<ExamQuestion[]> {
  // 40 câu phân bổ theo section:
  // Grammar:     12 câu (30%)
  // Vocabulary:  12 câu (30%)
  // Reading:     10 câu (25%) — 2 passages × 5 câu
  // Listening:    6 câu (15%) — 3 đoạn × 2 câu

  const [grammarQ, vocabQ, readingQ, listeningQ] = await Promise.all([
    getOrGenerateQuestions('grammar', level, 12, userId),
    getOrGenerateQuestions('vocabulary', level, 12, userId),
    getOrGenerateQuestions('reading', level, 10, userId),
    getOrGenerateQuestions('listening', level, 6, userId),
  ]);

  // Shuffle within sections, then concat in order
  return [
    ...shuffle(grammarQ),
    ...shuffle(vocabQ),
    ...shuffle(readingQ),
    ...shuffle(listeningQ),
  ];
}

// Smart selection: ưu tiên câu từ weak_topics của user
async function getOrGenerateQuestions(
  section: string,
  level: string,
  count: number,
  userId: string
): Promise<ExamQuestion[]> {
  const history = await getExamHistory(userId);
  const weakTopics = history?.weakTopics || [];

  // 60% từ weak topics (nếu có đủ)
  // 40% random từ question bank
  const fromBank = await prisma.examQuestion.findMany({
    where: { section, level },
    orderBy: { id: 'asc' },
    take: count * 3, // lấy nhiều hơn rồi random
  });

  // Mix weak topics + random
  return selectQuestions(fromBank, weakTopics, count);
}
```

---

## 🔴 16B.3 — PRE-BUILT QUESTION BANK

### Seed data — 200 câu ban đầu

**Grammar — B1 (40 câu)**
```
Topics: Present Perfect vs Past Simple, Conditionals (0,1,2),
Passive Voice, Modal Verbs, Articles, Prepositions of time/place
```

**Grammar — B2 (30 câu)**
```
Topics: Past Perfect, Mixed Conditionals, Inversion,
Subjunctive, Cleft Sentences, Ellipsis
```

**Vocabulary — B1 (30 câu)**
```
Topics: Work & Career, Daily Life, Technology basics,
Collocations (make/do/have/take), Common Idioms
```

**Vocabulary — B2 (30 câu)**
```
Topics: Business English, Academic Vocabulary, Advanced Idioms,
Formal/Informal register, Word Formation
```

**Reading — B1/B2 (30 câu)**
```
10 passages × 3 câu:
- Technology, Environment, Lifestyle, Business, Science
```

**Listening — B1/B2 (20 câu)**
```
10 transcripts × 2 câu:
- Conversations, Announcements, Short interviews
```

```typescript
// prisma/seed-exam-questions.js
// 200 câu pre-built → seed vào DB
```

---

## 🔴 16B.4 — EXAM UI — QUESTION FLOW

### Page: `/exam`

```
┌─────────────────────────────────┐
│  📝 EXAM MODE                   │
├─────────────────────────────────┤
│  Chọn level:                    │
│  [B1] [B2] [C1]                 │
│                                 │
│  Chọn mode:                     │
│  ┌──────────┐ ┌──────────┐      │
│  │ Full Exam│ │  Quick   │      │
│  │ 40 câu  │ │  20 câu  │      │
│  │ 60 phút │ │  30 phút │      │
│  └──────────┘ └──────────┘      │
│                                 │
│  ┌──────────────────────────┐   │
│  │   Section Only — 10 câu  │   │
│  │ [Grammar][Vocab][Reading] │   │
│  └──────────────────────────┘   │
│                                 │
│  [Bắt đầu thi]                  │
└─────────────────────────────────┘
```

### Page: `/exam/[examId]` — Exam Interface

```
┌─────────────────────────────────┐
│  Câu 12/40    ⏱️  48:23         │
│  [●●●●●●●●●●●●○○○○...] 30%     │
│                           [Flag]│
├─────────────────────────────────┤
│  GRAMMAR                        │
│                                 │
│  She ___ in Paris for 3 years   │
│  before moving to London.       │
│                                 │
│  ○ A  has lived                 │
│  ● B  had lived        ← chọn   │
│  ○ C  was living                │
│  ○ D  lived                     │
│                                 │
├─────────────────────────────────┤
│  [← Trước]    [Câu tiếp →]     │
│         [Nộp bài]               │
└─────────────────────────────────┘
```

### Exam UI Features

```tsx
<ExamInterface>
  {/* Progress: "Câu 12/40" + progress bar */}
  {/* Timer: countdown, đỏ khi còn 5 phút */}
  {/* Flag button: đánh dấu review lại */}

  {/* Question navigator: grid 40 ô nhỏ */}
  {/* Màu: trắng (chưa làm), gold (đã chọn), blue (flagged) */}
  {/* Tap → jump tới câu đó */}

  {/* Option selection: */}
  {/* - Tap once → selected (gold border) */}
  {/* - Tap again → deselect */}
  {/* - Chuyển câu → auto-save answer */}

  {/* Auto-submit khi hết giờ */}
  {/* Confirm dialog khi bấm nộp sớm: */}
  {/* "Còn X câu chưa trả lời. Nộp bài?" */}
</ExamInterface>

// Question Navigator Drawer (swipe up)
<QuestionNav>
  {questions.map((q, i) => (
    <NavDot
      key={i}
      status={
        answers[q.id]?.flagged ? 'flagged' :
        answers[q.id]?.answer ? 'answered' : 'unanswered'
      }
      onTap={() => jumpTo(i)}
    />
  ))}
  <SubmitButton />
</QuestionNav>
```

---

## 🔴 16B.5 — LISTENING SECTION (TTS)

### Concept
Listening questions dùng **Web Speech API TTS** đọc transcript to —
user nghe rồi chọn đáp án. Không có text transcript hiển thị.

```tsx
<ListeningQuestion>
  {/* Hiển thị: icon headphone + "Đang phát..." */}
  {/* KHÔNG show transcript text */}

  {/* Controls */}
  <PlayButton onClick={playTranscript} />
  {/* Chỉ cho nghe tối đa 2 lần */}
  <ReplayCount>Nghe lại: {2 - playCount}/2</ReplayCount>

  {/* TTS settings */}
  {/* Rate: 0.9 (B1) | 1.0 (B2) | 1.1 (C1) */}
  {/* Voice: US English */}

  {/* Sau khi play xong hoặc user ready → show options */}
  <Options visible={hasPlayed} />
</ListeningQuestion>
```

```typescript
// Khi load listening question
async function prepareListening(question: ExamQuestion) {
  // Pre-load TTS (nếu device offline → fallback show text)
  const utterance = new SpeechSynthesisUtterance(question.passage);
  utterance.rate = LEVEL_RATES[question.level]; // 0.9 | 1.0 | 1.1
  utterance.lang = 'en-US';
  return utterance;
}
```

---

## 🔴 16B.6 — RESULT & EXPLANATION UI

### Page: `/exam/result/[examId]`

```
┌─────────────────────────────────┐
│  📊 KẾT QUẢ THI                 │
│  Full Exam · B2 · 52 phút       │
├─────────────────────────────────┤
│  ĐIỂM TỔNG                      │
│                                 │
│         82                      │
│        /100                     │
│                                 │
│  ↑ +7 so với lần trước  🏆      │
├─────────────────────────────────┤
│  BREAKDOWN                      │
│  Grammar    33/40  ████████░░   │
│  Vocabulary 28/40  ███████░░░   │
│  Reading    36/40  █████████░   │
│  Listening  22/30  ███████░░░   │
├─────────────────────────────────┤
│  THỐNG KÊ                       │
│  Đúng: 28  Sai: 9  Bỏ qua: 3   │
│  Accuracy: 76%                  │
│  Thời gian TB/câu: 1:18         │
├─────────────────────────────────┤
│  🧠 AI NHẬN XÉT                 │
│  [ai_analysis — 3 câu]          │
├─────────────────────────────────┤
│  [Xem chi tiết] [Thi lại]       │
└─────────────────────────────────┘
```

### Detail Review Page

```
┌─────────────────────────────────┐
│  XEM LẠI BÀI THI                │
│  [Tất cả] [Sai] [Bỏ qua] [Flag]│
├─────────────────────────────────┤
│  Câu 3 — Grammar ❌             │
│                                 │
│  "She ___ in Paris for 3 years" │
│                                 │
│  ❌ Bạn chọn: D  lived          │
│  ✅ Đáp án: B  had lived        │
│                                 │
│  💡 Giải thích:                 │
│  Dùng Past Perfect (had + V3)   │
│  vì hành động xảy ra TRƯỚC      │
│  "moving to London" trong quá   │
│  khứ. "lived" đơn thuần không   │
│  diễn tả được mối quan hệ thời  │
│  gian này.                      │
├─────────────────────────────────┤
│  Câu 4 — Vocabulary ✅          │
│  ...                            │
└─────────────────────────────────┘
```

### AI Analysis Generation

```typescript
export async function generateExamAnalysis(result: ExamResult): Promise<string> {
  const prompt = `
    Student exam result:
    - Level: ${result.level}
    - Total: ${result.totalScore}/100
    - Grammar: ${result.grammarScore}/100
    - Vocabulary: ${result.vocabScore}/100
    - Reading: ${result.readingScore}/100
    - Listening: ${result.listeningScore}/100
    - Weak topics: ${result.weakTopics.join(', ')}
    - Strong topics: ${result.strongTopics.join(', ')}
    - vs last exam: ${result.vsLastExam > 0 ? '+' : ''}${result.vsLastExam}
    
    Write 3 sentences in Vietnamese:
    1. Overall assessment (honest, not generic)
    2. Strongest section + why it matters
    3. Weakest section + 1 specific action to improve
  `;

  return await qwen.complete(prompt);
}
```

---

## 🟡 16B.7 — EXAM HISTORY & STATS

### Page: `/exam/history`

```
┌─────────────────────────────────┐
│  LỊCH SỬ THI                    │
├─────────────────────────────────┤
│  Score trend (line chart)       │
│  [───●───●─────●──●────●]       │
│   72  75   71  79   82          │
├─────────────────────────────────┤
│  SECTION PERFORMANCE            │
│  Grammar    avg 78  ↑ trending  │
│  Vocabulary avg 71  → stable    │
│  Reading    avg 83  ↑ trending  │
│  Listening  avg 65  ↓ weak      │
├─────────────────────────────────┤
│  WEAK TOPICS (all time)         │
│  Past Perfect      ×14 wrong    │
│  Listening Detail  ×11 wrong    │
│  Prepositions       ×8 wrong    │
├─────────────────────────────────┤
│  RECENT EXAMS                   │
│  Full B2 · 82pts · Hôm nay      │
│  Full B2 · 79pts · 3 ngày trước │
│  Quick B2 · 74pts · 1 tuần trước│
└─────────────────────────────────┘
```

---

## 🟡 16B.8 — ADAPTIVE EXAM ENGINE

### Smart Question Selection

```typescript
// Sau 3+ lần thi, exam tự thích nghi

export async function buildAdaptiveExam(userId: string, level: string) {
  const history = await getExamHistory(userId, 3); // 3 lần gần nhất

  // Phân tích weak areas
  const weakTopics = analyzeWeakTopics(history);
  // e.g. ['past_perfect', 'listening_detail', 'prepositions']

  // 40 câu phân bổ adaptive:
  // 50% từ weak topics (nhiều câu hơn về chỗ yếu)
  // 30% mixed topics (maintain strengths)
  // 20% new topics chưa từng gặp (exposure)

  return assembleAdaptiveExam(weakTopics, level, userId);
}
```

### Difficulty Progression

```
Lần 1: Standard B2 exam
Lần 2: Nếu score > 80 → tăng 20% câu C1
Lần 3: Nếu score > 85 → recommend lên C1 level
        Nếu score < 60 → suggest thêm B1 section
```

---

## 🟢 16B.9 — QUEST & MEMORY INTEGRATION

### Quest Integration

```typescript
// Thêm quest mới:
{
  id: 'exam_complete',
  title: 'Take an Exam',
  description: 'Hoàn thành 1 bài Full Exam',
  exp: 80,
  type: 'weekly_challenge'
}

{
  id: 'exam_improvement',
  title: 'Score Improvement',
  description: 'Đạt điểm cao hơn lần thi trước',
  exp: 50,
  type: 'side_quest'
}
```

### Tutor Memory Integration

```typescript
// Sau khi thi xong → sync weak topics → SENSEI biết
export async function syncExamToMemory(userId: string, result: ExamResult) {
  await updateTutorMemory(userId, {
    // Merge với error patterns từ Speak
    // SENSEI sẽ nói: "Trong bài thi, bạn hay sai Past Perfect.
    //                 Hôm nay mình chú ý điều đó."
    persistentWeaknesses: mergeWeaknesses(
      existingMemory.persistentWeaknesses,
      result.weakTopics
    )
  });

  // Log event cho Analytics (Phase 14)
  await logEvent(userId, 'exam_completed', null, result.totalScore);
}
```

---

## 📊 EXAM vs WRITING LAB — PHÂN BIỆT

| | Writing Lab (16) | Exam Mode (16B) |
|---|---|---|
| **Dạng bài** | Viết luận, email, paragraph | Khoanh ABCD 40 câu |
| **Thời gian** | Không giới hạn | 60 phút countdown |
| **Áp lực** | Thấp — sáng tạo | Cao — thi cử |
| **AI role** | Chấm + nhận xét bài viết | Generate đề + giải thích đáp án |
| **Phù hợp** | Luyện Writing, IELTS Task 2 | Luyện Grammar, TOEIC, TOEFL |
| **EXP** | +40 per submission | +80 per full exam |

---

## 📊 DATA FLOW

```
User chọn level + mode
      ↓
assembleFullExam() hoặc buildAdaptiveExam()
  → 60% pre-built bank + 40% AI generated
      ↓
Exam Interface (timer + navigator)
  → auto-save mỗi câu trả lời
      ↓
Submit → calculate scores → generateExamAnalysis()
      ↓
      ├─→ Save exam_results
      ├─→ checkPersonalBest()
      ├─→ syncExamToMemory() (Phase 15)
      ├─→ logEvent() (Phase 14)
      └─→ Result page
```

---

## 📊 IMPLEMENTATION ORDER

### Sprint 1 — Foundation
```
1. Schema migration: exam_questions, exams, exam_answers, exam_results — 1.5h
2. Seed 200 pre-built questions — 3h
3. generateQuestions() cho 4 sections — 3h
4. assembleFullExam() + getOrGenerateQuestions() — 2h
```

### Sprint 2 — Exam UI
```
5. /exam — Start page — 1.5h
6. /exam/[id] — Question interface + navigator — 4h
7. Timer + auto-submit — 1h
8. Listening section TTS — 2h
```

### Sprint 3 — Results
```
9.  Score calculation + AI analysis — 2h
10. /exam/result — Result page — 2h
11. /exam/result/review — Detail review — 2h
12. Personal best + celebration — 1h
```

### Sprint 4 — Intelligence & Integration
```
13. Exam history + stats — 2h
14. Adaptive exam engine — 2h
15. Quest + Memory sync — 1.5h
16. Add to navigation — 30min
```

**Total estimate: ~34h**

---

## 🔑 KEY PRINCIPLES

1. **Distractors phải plausible** — đáp án sai không được obvious, phải khiến user suy nghĩ
2. **Giải thích mọi câu sai** — user xem review phải hiểu *tại sao* sai, không chỉ biết sai
3. **Listening không show text** — tính thật, không cho đọc transcript trong lúc thi
4. **Navigator luôn visible** — user biết đang ở đâu, câu nào chưa làm
5. **Adaptive sau 3 lần** — đủ data mới adaptive, không sớm quá
6. **Exam ≠ Anki** — Anki là repetition, Exam là assessment — hai mục đích khác nhau

---

_Phase 16B: TRIBUNAL — Multiple Choice Exam Engine_
_Player: Dũng Vũ · Phase 16B start: 2026-03-09_
