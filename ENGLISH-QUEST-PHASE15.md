# 🧠 PHASE 15 — AI TUTOR MEMORY

> Phase 14 ✅ All Done → Phase 15: Speak AI nhớ bạn, hiểu bạn, dạy đúng bạn
> Stack: Next.js · PostgreSQL · Prisma · Qwen 3.5-plus
> Updated: 2026-03-08

---

## 🎯 VISION

**Codename: SENSEI**

Mục tiêu: Biến Speak AI từ **chatbot vô tri** thành **gia sư cá nhân thật sự** —
biết bạn hay mắc lỗi gì, đã học vocab nào, đang ở trình độ thật nào,
và tự điều chỉnh cách dạy theo từng buổi.

> "Lần trước bạn hay nhầm past perfect. Hôm nay mình sẽ chú ý điều đó."

---

## 📋 TỔNG QUAN

| #    | Item                        | Nhóm         | Priority |
| ---- | --------------------------- | ------------ | -------- |
| 15.1 | Tutor Memory Schema         | Foundation   | 🔴 P0   |
| 15.2 | Error Pattern Tracker       | Core         | 🔴 P0   |
| 15.3 | Vocab Context Memory        | Core         | 🔴 P0   |
| 15.4 | Adaptive Difficulty Engine  | Core         | 🔴 P0   |
| 15.5 | Memory-Aware System Prompt  | Core         | 🔴 P0   |
| 15.6 | Session Debrief (AI)        | Feature      | 🟡 P1   |
| 15.7 | Topic Recommendation Engine | Feature      | 🟡 P1   |
| 15.8 | Memory Dashboard UI         | UI           | 🟡 P1   |
| 15.9 | Long-term Progress Narrative| Feature      | 🟢 P2   |
| 15.10| Tutor Personality Config    | Polish       | 🟢 P2   |

---

## 🔴 15.1 — TUTOR MEMORY SCHEMA

### Concept
Mỗi user có một **Tutor Memory** — một bộ nhớ sống động, cập nhật sau mỗi buổi Speak.
AI đọc bộ nhớ này trước khi bắt đầu conversation.

```sql
-- Core memory table
CREATE TABLE tutor_memory (
  user_id               TEXT PRIMARY KEY,

  -- Error patterns (từ speak corrections)
  error_patterns        JSONB DEFAULT '[]',
  -- [{ type: 'tense', subtype: 'past_perfect', count: 12, last_seen: date, examples: [...] }]

  -- Vocab context (từ Anki mastered + speak usage)
  known_vocab           JSONB DEFAULT '[]',
  -- [{ word: 'eloquent', level: 'B2', mastered_at: date, used_in_speak: 2 }]

  active_vocab_targets  JSONB DEFAULT '[]',
  -- Vocab đang học (Anki due), AI nên cố dùng trong conversation

  -- Difficulty state
  current_difficulty    INTEGER DEFAULT 5,   -- 1-10
  difficulty_history    JSONB DEFAULT '[]',  -- [{ session_id, score, difficulty, date }]
  auto_adjust           BOOLEAN DEFAULT TRUE,

  -- Session memory
  total_sessions        INTEGER DEFAULT 0,
  last_session_at       TIMESTAMPTZ,
  last_session_mode     TEXT,
  last_session_summary  TEXT,               -- AI-generated 1-2 câu

  -- Learning style (detected)
  preferred_topics      TEXT[] DEFAULT '{}',
  avoid_topics          TEXT[] DEFAULT '{}',
  response_style        TEXT DEFAULT 'balanced', -- 'detailed' | 'concise' | 'balanced'

  -- Long-term narrative
  journey_summary       TEXT,               -- AI viết 1 đoạn về hành trình học
  strengths             TEXT[] DEFAULT '{}',
  persistent_weaknesses TEXT[] DEFAULT '{}',

  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Session log (để track history)
CREATE TABLE tutor_sessions (
  id              SERIAL PRIMARY KEY,
  user_id         TEXT NOT NULL,
  session_id      TEXT NOT NULL,
  mode            TEXT,
  topic           TEXT,
  duration_sec    INTEGER,
  message_count   INTEGER,
  difficulty_used INTEGER,
  performance_score INTEGER,  -- 0-100, calculated sau session
  corrections     JSONB,      -- raw corrections array
  new_errors      JSONB,      -- lỗi mới xuất hiện lần này
  vocab_used      TEXT[],     -- vocab từ active_targets user đã dùng
  ai_debrief      TEXT,       -- AI-generated debrief
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tutor_sessions_user ON tutor_sessions(user_id, created_at DESC);
```

---

## 🔴 15.2 — ERROR PATTERN TRACKER

### Concept
Sau mỗi buổi Speak, parse corrections → classify → update error patterns trong memory.

### Error Classification

```typescript
// src/lib/error-classifier.ts

type ErrorType =
  | 'tense'           // Nhầm thì: "I go yesterday" → "I went"
  | 'article'         // a/an/the: "I have dog" → "I have a dog"
  | 'preposition'     // on/in/at: "good in English" → "good at English"
  | 'subject_verb'    // "He go" → "He goes"
  | 'word_choice'     // Dùng sai từ: "make homework" → "do homework"
  | 'word_order'      // "I very like it" → "I like it very much"
  | 'pronunciation'   // (nếu có transcript)
  | 'vocab_missing'   // Dùng từ đơn giản khi có từ tốt hơn
  | 'other'

interface ErrorPattern {
  type: ErrorType
  subtype?: string          // e.g. 'past_perfect', 'present_perfect'
  count: number
  last_seen: string         // ISO date
  examples: string[]        // tối đa 3 examples gần nhất
  trend: 'increasing' | 'decreasing' | 'stable'
}

export async function classifyAndUpdateErrors(
  userId: string,
  corrections: { original: string; corrected: string }[]
) {
  // 1. Classify mỗi correction
  const classified = await Promise.all(
    corrections.map(c => classifyError(c.original, c.corrected))
  );

  // 2. Load existing patterns
  const memory = await getTutorMemory(userId);
  const patterns: ErrorPattern[] = memory.errorPatterns || [];

  // 3. Update counts + examples
  for (const error of classified) {
    const existing = patterns.find(
      p => p.type === error.type && p.subtype === error.subtype
    );

    if (existing) {
      existing.count++;
      existing.last_seen = new Date().toISOString();
      existing.examples = [
        error.example,
        ...existing.examples
      ].slice(0, 3); // giữ 3 gần nhất
    } else {
      patterns.push({
        type: error.type,
        subtype: error.subtype,
        count: 1,
        last_seen: new Date().toISOString(),
        examples: [error.example],
        trend: 'stable'
      });
    }
  }

  // 4. Update trends (so sánh với 2 tuần trước)
  const updatedPatterns = updateTrends(patterns, userId);

  // 5. Save
  await updateTutorMemory(userId, { errorPatterns: updatedPatterns });
}

// Dùng Qwen để classify (nhanh, 1 API call cho tất cả corrections)
async function classifyError(original: string, corrected: string) {
  const prompt = `
    Classify this grammar correction:
    Original: "${original}"
    Corrected: "${corrected}"
    
    Return JSON: { "type": "tense|article|preposition|subject_verb|word_choice|word_order|vocab_missing|other", "subtype": "optional detail" }
    Only JSON, no explanation.
  `;
  // ... Qwen call
}
```

---

## 🔴 15.3 — VOCAB CONTEXT MEMORY

### Concept
AI biết user đang học vocab gì trong Anki → chủ động dùng trong conversation
để reinforce → user thấy từ quen trong context thật → nhớ lâu hơn.

### Sync Anki → Tutor Memory

```typescript
// src/lib/vocab-memory.ts

// Chạy sau mỗi Anki session
export async function syncVocabMemory(userId: string) {
  // 1. Lấy cards mastered (rating Good/Easy >= 3 lần)
  const mastered = await getMasteredCards(userId);

  // 2. Lấy cards đang học (due trong 7 ngày tới)
  const activeTargets = await getDueCards(userId, 7);

  // 3. Update memory
  await updateTutorMemory(userId, {
    knownVocab: mastered.map(c => ({
      word: c.word,
      level: c.level,
      mastered_at: c.masteredAt,
      used_in_speak: c.speakUsageCount || 0
    })),
    activeVocabTargets: activeTargets.map(c => ({
      word: c.word,
      definition: c.definition,
      level: c.level,
      due_date: c.dueDate
    }))
  });
}

// Track khi AI dùng target vocab trong conversation
export async function trackVocabUsage(
  userId: string,
  aiMessage: string,
  userMessage: string
) {
  const memory = await getTutorMemory(userId);
  const targets = memory.activeVocabTargets;

  // Check xem user có dùng target vocab không
  const usedByUser = targets.filter(v =>
    userMessage.toLowerCase().includes(v.word.toLowerCase())
  );

  if (usedByUser.length > 0) {
    // Update usage count
    await incrementVocabUsage(userId, usedByUser.map(v => v.word));
    // Log event
    await logEvent(userId, 'vocab_used_in_speak', 'vocab', null, null, {
      words: usedByUser.map(v => v.word)
    });
  }
}
```

---

## 🔴 15.4 — ADAPTIVE DIFFICULTY ENGINE

### Concept
Sau mỗi buổi Speak, tính **performance score** → tự động điều chỉnh độ khó
buổi tiếp theo. User không cần tự chọn.

### Performance Scoring

```typescript
// src/lib/difficulty-engine.ts

export function calcSessionPerformance(session: {
  corrections: any[];
  messageCount: number;
  durationSec: number;
  vocabTargetsUsed: number;
  vocabTargetsAvailable: number;
}): number {
  // Score 0-100

  // 1. Corrections rate (40% weight)
  // Ít corrections = tốt
  const correctionsPerMsg = session.corrections.length / Math.max(session.messageCount, 1);
  const correctionScore = Math.max(0, 100 - correctionsPerMsg * 25);

  // 2. Session completion (25% weight)
  // Đủ thời gian = engaged
  const durationScore = Math.min(100, (session.durationSec / 600) * 100); // 10 min = 100

  // 3. Vocab usage (20% weight)
  // Dùng được target vocab = retention tốt
  const vocabScore = session.vocabTargetsAvailable > 0
    ? (session.vocabTargetsUsed / session.vocabTargetsAvailable) * 100
    : 70; // default nếu không có targets

  // 4. Message length (15% weight)
  // Câu dài = confident
  const avgMsgLength = session.messageCount > 0
    ? session.totalUserChars / session.messageCount
    : 0;
  const lengthScore = Math.min(100, (avgMsgLength / 80) * 100); // 80 chars = good

  return Math.round(
    correctionScore * 0.40 +
    durationScore   * 0.25 +
    vocabScore      * 0.20 +
    lengthScore     * 0.15
  );
}

export async function adjustDifficulty(userId: string, performanceScore: number) {
  const memory = await getTutorMemory(userId);
  let difficulty = memory.currentDifficulty; // 1-10

  // Điều chỉnh theo performance
  if (performanceScore >= 85) {
    difficulty = Math.min(10, difficulty + 1);  // Tăng độ khó
  } else if (performanceScore <= 45) {
    difficulty = Math.max(1, difficulty - 1);   // Giảm độ khó
  }
  // 46-84: giữ nguyên

  await updateTutorMemory(userId, {
    currentDifficulty: difficulty,
    difficultyHistory: [
      ...memory.difficultyHistory,
      { date: new Date().toISOString(), score: performanceScore, difficulty }
    ].slice(-20) // giữ 20 sessions gần nhất
  });

  return difficulty;
}
```

### Difficulty → AI Behavior Mapping

```typescript
const DIFFICULTY_PROMPTS: Record<number, string> = {
  1:  "Dùng câu đơn giản, vocab A2. Sửa lỗi nhẹ nhàng, giải thích rõ.",
  2:  "Dùng câu đơn giản, vocab A2-B1. Sửa lỗi quan trọng.",
  3:  "Vocab B1. Đặt câu hỏi follow-up đơn giản.",
  4:  "Vocab B1. Follow-up questions. Sửa grammar errors.",
  5:  "Vocab B1-B2. Câu phức tạp hơn. Yêu cầu elaborate.",
  6:  "Vocab B2. Dùng idioms đơn giản. Challenge user explain more.",
  7:  "Vocab B2. Idioms. Yêu cầu reasoning và opinion.",
  8:  "Vocab B2-C1. Debate-style. Phản biện nhẹ ý kiến của user.",
  9:  "Vocab C1. Phản biện mạnh. Yêu cầu precise language.",
  10: "Vocab C1-C2. Native-speed conversation. Không simplify."
};
```

---

## 🔴 15.5 — MEMORY-AWARE SYSTEM PROMPT

### Concept
Đây là **trái tim của Phase 15** — inject toàn bộ Tutor Memory vào system prompt
trước khi bắt đầu mỗi Speak session.

```typescript
// src/lib/sensei-prompt.ts

export async function buildSenseiSystemPrompt(
  userId: string,
  mode: string,
  topic?: string
): Promise<string> {
  const memory = await getTutorMemory(userId);
  const profile = await getLearningProfile(userId); // từ Phase 14

  // Top 3 errors (persistent)
  const topErrors = memory.errorPatterns
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Active vocab targets (tối đa 10)
  const vocabTargets = memory.activeVocabTargets.slice(0, 10);

  // Difficulty instruction
  const difficultyGuide = DIFFICULTY_PROMPTS[memory.currentDifficulty];

  const prompt = `
You are SENSEI, a personal English tutor for ${userId}.
Mode: ${mode}${topic ? ` — Topic: ${topic}` : ''}

## YOUR STUDENT'S PROFILE
- Current level: ${profile.overallLevel} (actual performance-based)
- Total speak sessions: ${memory.totalSessions}
- Last session: ${memory.lastSessionAt ? formatRelative(memory.lastSessionAt) : 'First session'}
${memory.lastSessionSummary ? `- Last session summary: ${memory.lastSessionSummary}` : ''}

## KNOWN PERSISTENT ERRORS (address these actively)
${topErrors.map(e => `- ${e.type}${e.subtype ? `/${e.subtype}` : ''}: ${e.count} occurrences
  Example: "${e.examples[0] || 'N/A'}"
  → When you see this pattern, correct immediately and explain briefly.`).join('\n')}

## VOCABULARY TO REINFORCE (naturally weave these into conversation)
${vocabTargets.map(v => `- "${v.word}" (${v.level}): ${v.definition}`).join('\n')}
→ When appropriate, use these words naturally. If user uses them correctly, affirm briefly.

## DIFFICULTY SETTING: ${memory.currentDifficulty}/10
${difficultyGuide}

## STUDENT'S STRENGTHS
${memory.strengths.length > 0 ? memory.strengths.join(', ') : 'Still being assessed'}

## PERSISTENT WEAKNESSES
${memory.persistentWeaknesses.length > 0 ? memory.persistentWeaknesses.join(', ') : 'Still being assessed'}

## RESPONSE STYLE
- Style: ${memory.responseStyle}
- After each user message: respond naturally, THEN if there's an error, add a correction in format: ❌ [original] → ✅ [corrected] (brief explanation)
- Do NOT correct every small error — focus on patterns above
- Keep conversation flowing naturally
- Language: Mix English + Vietnamese explanations when correcting

## SESSION GOAL
Help the student practice ${mode} naturally while subtly reinforcing weak areas.
Track if they use any vocab from the reinforce list above.
  `.trim();

  return prompt;
}
```

### Inject vào Speak API

```typescript
// api/speak/chat/route.ts — thay system prompt cũ

const systemPrompt = await buildSenseiSystemPrompt(
  userId,
  sessionMode,
  sessionTopic
);

const response = await qwen.chat({
  model: 'qwen3.5-plus',
  messages: [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,  // existing messages
    { role: 'user', content: userMessage }
  ]
});
```

---

## 🟡 15.6 — SESSION DEBRIEF (AI)

### Concept
Cuối mỗi buổi Speak, AI generate **debrief ngắn** — tóm tắt buổi học,
điểm tốt, điểm cần cải thiện, và 1 việc cụ thể.

```typescript
export async function generateSessionDebrief(
  userId: string,
  session: TutorSession
): Promise<string> {
  const memory = await getTutorMemory(userId);

  const prompt = `
    Session summary:
    - Mode: ${session.mode}, Duration: ${Math.round(session.durationSec / 60)} min
    - Messages: ${session.messageCount}
    - Corrections: ${session.corrections.length}
    - New errors (first time): ${session.newErrors.length}
    - Vocab targets used: ${session.vocabUsed.join(', ') || 'none'}
    - Performance score: ${session.performanceScore}/100
    - Difficulty: ${session.difficultyUsed}/10
    
    Top errors this session:
    ${session.corrections.slice(0, 5).map(c => `"${c.original}" → "${c.corrected}"`).join('\n')}
    
    Write a 3-sentence debrief in Vietnamese:
    1. What went well
    2. Main area to improve
    3. One specific action for next session
    
    Be encouraging but honest. Mention specific examples.
  `;

  const debrief = await qwen.complete(prompt);

  // Save to memory
  await updateTutorMemory(userId, {
    lastSessionSummary: debrief,
    lastSessionAt: new Date().toISOString(),
    lastSessionMode: session.mode,
    totalSessions: memory.totalSessions + 1
  });

  return debrief;
}
```

### UI — End Session Screen

```
┌─────────────────────────────────┐
│  ⚔️  SESSION COMPLETE           │
│                                 │
│  18 phút · 24 tin nhắn          │
│  Performance: 72/100            │
│  Difficulty: 6/10               │
│                                 │
│  ─────────────────────────────  │
│  🧠 SENSEI DEBRIEF              │
│                                 │
│  "Bạn dùng được từ 'elaborate'  │
│  rất tự nhiên — tốt lắm. Lỗi   │
│  past perfect vẫn xuất hiện 3   │
│  lần. Buổi tới thử shadow B2    │
│  script về career để luyện thì."│
│                                 │
│  ─────────────────────────────  │
│  📈 Difficulty → 7/10 next time │
│                                 │
│  [Xem chi tiết] [Về trang chủ]  │
└─────────────────────────────────┘
```

---

## 🟡 15.7 — TOPIC RECOMMENDATION ENGINE

### Concept
Dựa trên weakness + error patterns → gợi ý topic/mode phù hợp nhất cho buổi tiếp theo.

```typescript
export async function recommendNextSession(
  userId: string
): Promise<SessionRecommendation> {
  const memory = await getTutorMemory(userId);
  const profile = await getLearningProfile(userId);

  const recommendations: SessionRecommendation[] = [];

  // Rule 1: Nếu speaking score thấp → Free Talk hoặc Job Interview
  if (profile.speakingScore < 55) {
    recommendations.push({
      mode: 'free_talk',
      reason: 'Speaking score cần cải thiện — Free Talk giúp luyện fluency',
      priority: 10
    });
  }

  // Rule 2: Nếu có error pattern 'tense' nhiều → shadow B1/B2
  const tenseErrors = memory.errorPatterns.find(e => e.type === 'tense');
  if (tenseErrors && tenseErrors.count > 5) {
    recommendations.push({
      mode: 'shadowing',
      level: 'B1',
      reason: `Lỗi thì xuất hiện ${tenseErrors.count} lần — Shadowing giúp internalize grammar qua nghe`,
      priority: 8
    });
  }

  // Rule 3: Nếu vocab targets nhiều từ business → Job Interview / Business Meeting
  const businessVocab = memory.activeVocabTargets.filter(v =>
    ['negotiate', 'stakeholder', 'revenue', 'strategic'].includes(v.word)
  );
  if (businessVocab.length >= 3) {
    recommendations.push({
      mode: 'job_interview',
      reason: `Bạn đang học ${businessVocab.length} từ business — luyện trong context thật`,
      priority: 7
    });
  }

  // Sort by priority, return top 3
  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 3);
}
```

### UI — Speak Page Top Banner

```
┌─────────────────────────────────┐
│  🧠 SENSEI GỢI Ý HÔM NAY       │
│                                 │
│  1. Free Talk — luyện fluency   │
│  2. Job Interview — dùng vocab  │
│     business đang học           │
│  3. Shadow B1 — fix lỗi thì     │
└─────────────────────────────────┘
```

---

## 🟡 15.8 — MEMORY DASHBOARD UI

### `/speak/memory` page

```
┌─────────────────────────────────┐
│  🧠 TUTOR MEMORY                │
│  SENSEI biết gì về bạn          │
├─────────────────────────────────┤
│  DIFFICULTY                     │
│  Current: 6/10                  │
│  [●●●●●●○○○○]                   │
│  "Tự động điều chỉnh"           │
├─────────────────────────────────┤
│  LỖI THƯỜNG GẶP                 │
│  🔴 Tense/Past Perfect  ×12     │
│  🟡 Preposition         ×7      │
│  🟡 Word Choice         ×5      │
│  🟢 Article             ×3      │
├─────────────────────────────────┤
│  VOCAB ĐANG REINFORCE           │
│  elaborate · B2 · 2× used       │
│  consensus · B2 · 0× used       │
│  nuanced · C1 · 1× used         │
│  [+7 more...]                   │
├─────────────────────────────────┤
│  HÀNH TRÌNH                     │
│  23 sessions · 340 phút tổng    │
│  [AI narrative paragraph]       │
└─────────────────────────────────┘
```

---

## 🟢 15.9 — LONG-TERM PROGRESS NARRATIVE

### Concept
Mỗi 10 sessions, Qwen generate **1 đoạn văn** mô tả hành trình học của user —
như nhật ký được AI viết hộ.

```typescript
export async function generateJourneyNarrative(userId: string) {
  const memory = await getTutorMemory(userId);
  const profile = await getLearningProfile(userId);

  // Chỉ generate mỗi 10 sessions
  if (memory.totalSessions % 10 !== 0) return;

  const prompt = `
    Student journey summary:
    - Total sessions: ${memory.totalSessions}
    - Current difficulty: ${memory.currentDifficulty}/10
    - Biggest improvement: ${memory.strengths[0]}
    - Still working on: ${memory.persistentWeaknesses[0]}
    - Error reduction: ${calcErrorReduction(memory)}%
    
    Write 2-3 sentences in Vietnamese describing this student's learning journey.
    Tone: warm, encouraging, personal. Mention specific progress.
  `;

  const narrative = await qwen.complete(prompt);
  await updateTutorMemory(userId, { journeySummary: narrative });
}
```

---

## 🟢 15.10 — TUTOR PERSONALITY CONFIG

### Settings option

```tsx
// /settings — SENSEI section

<SenseiConfig>
  <Setting
    title="Độ nghiêm khắc"
    description="Sửa lỗi nhiều hay ít"
    options={['Nhẹ nhàng', 'Cân bằng', 'Nghiêm khắc']}
    default="Cân bằng"
  />
  <Setting
    title="Ngôn ngữ giải thích"
    description="Khi sửa lỗi, giải thích bằng"
    options={['Tiếng Việt', 'English', 'Mix']}
    default="Mix"
  />
  <Setting
    title="Tự động điều chỉnh độ khó"
    type="toggle"
    default={true}
  />
  <Setting
    title="Reinforce vocab trong Speak"
    type="toggle"
    default={true}
  />
</SenseiConfig>
```

---

## 📊 DATA FLOW TỔNG THỂ

```
Anki session end
      ↓
syncVocabMemory() → update activeVocabTargets

Speak session start
      ↓
buildSenseiSystemPrompt()
  ← errorPatterns
  ← activeVocabTargets
  ← currentDifficulty
  ← lastSessionSummary
      ↓
Conversation với memory-aware AI

Speak session end
      ↓
classifyAndUpdateErrors()    → update errorPatterns
trackVocabUsage()            → update vocab usage counts
calcSessionPerformance()     → performance score
adjustDifficulty()           → update difficulty
generateSessionDebrief()     → update lastSessionSummary
generateJourneyNarrative()   → every 10 sessions
recommendNextSession()       → show on Speak page
```

---

## 📊 DATABASE SUMMARY

```sql
-- Bảng mới:
tutor_memory      -- core memory (1 row/user, upsert)
tutor_sessions    -- session history log

-- Liên kết với Phase 14:
learning_events   -- logEvent() vẫn dùng
learning_profile  -- getLearningProfile() dùng trong prompt
```

---

## 📊 IMPLEMENTATION ORDER

### Sprint 1 — Memory Foundation
```
1. Schema: tutor_memory + tutor_sessions — 1h
2. getTutorMemory / updateTutorMemory helpers — 1h
3. Error classifier (Qwen) — 2h
4. classifyAndUpdateErrors() — 1.5h
```

### Sprint 2 — Core Intelligence
```
5. syncVocabMemory() từ Anki — 1.5h
6. Adaptive Difficulty Engine — 2h
7. buildSenseiSystemPrompt() — 2h
8. Inject vào Speak API — 1h
```

### Sprint 3 — Session Flow
```
9.  trackVocabUsage() trong chat loop — 1h
10. generateSessionDebrief() — 1.5h
11. End session screen redesign — 1.5h
12. recommendNextSession() — 1.5h
```

### Sprint 4 — UI & Polish
```
13. Memory Dashboard /speak/memory — 2h
14. Speak page recommendation banner — 1h
15. Tutor personality settings — 1h
16. Journey narrative (every 10 sessions) — 1h
```

**Total estimate: ~28h**

---

## 🔑 KEY PRINCIPLES

1. **Memory nhẹ, không bloat prompt** — system prompt tối đa ~800 tokens, chỉ inject top 3 errors + 10 vocab targets
2. **Sửa lỗi có chọn lọc** — AI chỉ focus error patterns đã track, không sửa mọi thứ → không làm user nản
3. **Vocab reinforcement tự nhiên** — AI weave vocab vào conversation, không force
4. **Difficulty tự điều chỉnh** — user không cần nghĩ về setting này
5. **Debrief ngắn gọn** — 3 câu, không hơn → user đọc hết
6. **Privacy** — memory chỉ dùng để improve experience, không expose raw data ra ngoài

---

_Phase 15: SENSEI — AI Tutor Memory_
_Player: Dũng Vũ · Phase 15 start: 2026-03-08_
