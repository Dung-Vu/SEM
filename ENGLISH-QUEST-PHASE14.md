# 📊 PHASE 14 — ANALYTICS & INSIGHTS ENGINE

> Phase 13 ✅ All Done → Phase 14: Deep Learning Intelligence
> Stack: Next.js · PostgreSQL · Prisma · Recharts · Qwen 3.5-plus
> **Updated: 2026-03-08 — ✅ HOÀN THÀNH 100% (FINAL AUDIT x3)**
> **TypeScript: 0 errors | Build: Exit 0**

---

## ✅ FINAL STATUS — POST-AUDIT LOG

### Audit Pass 1 (Core Implementation)

- Schema + migrations: `LearningEvent`, `LearningProfile`, `InsightCache`, `WeeklyReport`
- `src/lib/analytics.ts` — `logEvent()` helper + query helpers
- `src/lib/profile-engine.ts` — calculateLearningProfile()
- `src/lib/insight-generator.ts` — generateInsight() + Qwen AI
- `src/lib/weekly-report.ts` — generateWeeklyReport() + AI summary
- APIs: `/api/analytics/profile`, `/api/analytics/recalculate`, `/api/analytics/insights`, `/api/analytics/weekly-report`
- `/analytics` page — Radar Chart, Heatmap, Velocity sparklines, Weakness panel, Prediction, Insights
- `/analytics/weekly` page — Full weekly report UI (bar chart, highlights, vs last week)
- `/analytics/weekly` thêm vào AppShell navigation

### Audit Pass 2 (Missing Details)

- `anki_word_added` → injected vào `POST /api/anki/words`
- `sendPushToSubscriptions` batch helper → `src/lib/push.ts`
- `/api/analytics/cron` → weekly report generation + push trigger
- `/api/analytics/activity-stream` → 10 recent events với human-readable labels
- Activity Stream UI widget → analytics page (timeline 10 events + Lucide icons)
- Unread Report badge → analytics page (chấm đỏ khi có report chưa đọc)
- `vercel.json` → Cron config `0 1 * * 1` (Mon 08:00 ICT)
- Insight types: 3 → **7** (thêm `strength_highlight`, `pattern_detected`, `streak_analysis`, `prediction`)
- `speak_session_start` → `api/ai/chat/stream/route.ts` (khi first message)
- `milestone_unlocked` → `api/milestones/route.ts` (mỗi khi unlock)
- `PATCH /api/analytics/weekly-report` → mark isRead=true
- `/analytics/weekly` page → gọi PATCH khi load (badge biến mất)

### Audit Pass 3 (Events & Notifications)

- `anki_session_complete` → `api/anki/review/route.ts` (khi daily count = 10, kèm retention %)
- `weakness_alert` push → cron khi speakingScore < 45
- `strength_highlight` push → cron khi vocabVelocity > 10
- `neglect_alert (journal)` push → cron khi >5 ngày không viết Journal
- `neglect_alert (speak)` push → cron khi >7 ngày không tập Speaking
- Cron dùng static import + `sendInsightPush()` helper reusable

---

## 📋 TỔNG QUAN

| #     | Item                       | Nhóm         | Priority | Status  |
| ----- | -------------------------- | ------------ | -------- | ------- |
| 14.1  | Data Collection Layer      | Foundation   | 🔴 P0    | ✅ Done |
| 14.2  | Learning Profile Engine    | Core         | 🔴 P0    | ✅ Done |
| 14.3  | Insight Generator (AI)     | Core         | 🔴 P0    | ✅ Done |
| 14.4  | Analytics Dashboard        | UI           | 🔴 P0    | ✅ Done |
| 14.5  | Weakness Detector          | Intelligence | 🟡 P1    | ✅ Done |
| 14.6  | Progress Prediction        | Intelligence | 🟡 P1    | ✅ Done |
| 14.7  | Weekly Intelligence Report | Feature      | 🟡 P1    | ✅ Done |
| 14.8  | Heatmap & Activity Graph   | UI           | 🟡 P1    | ✅ Done |
| 14.9  | Skill Velocity Tracker     | Intelligence | 🟢 P2    | ✅ Done |
| 14.10 | Insight Notifications      | Feature      | 🟢 P2    | ✅ Done |

---

## 📡 EVENT COVERAGE (tất cả 10 event types)

| Event                   | Route được inject                      | Metadata                                |
| ----------------------- | -------------------------------------- | --------------------------------------- |
| `anki_card_reviewed`    | `POST /api/anki/review`                | rating, wordId, level, status           |
| `anki_session_complete` | `POST /api/anki/review` (khi count=10) | cards_total, cards_mastered, retention% |
| `anki_word_added`       | `POST /api/anki/words`                 | word, level                             |
| `speak_session_start`   | `POST /api/ai/chat/stream` (first msg) | mode                                    |
| `speak_session_end`     | `POST /api/ai/conversations`           | mode, message_count, duration_sec       |
| `quest_completed`       | `POST /api/quests`                     | quest_id, quest_type, exp_gained        |
| `journal_written`       | `POST /api/journal`                    | word_count, ai_feedback_score           |
| `shadow_session`        | `POST /api/shadow`                     | script_level, completed, speed          |
| `daily_checkin`         | `POST /api/checkin`                    | streak_day                              |
| `milestone_unlocked`    | `POST /api/milestones`                 | milestone_id, title, exp_reward         |

---

## 🔴 14.1 — DATA COLLECTION LAYER

### Vấn đề hiện tại

Data đang có (từ Phase 1-12) nhưng **scattered** — EXP ở bảng này, Anki ở bảng kia, Speak sessions ở bảng khác. Chưa có unified learning event stream.

### Solution: Learning Event Log

```sql
-- Bảng mới: learning_events
CREATE TABLE learning_events (
  id            SERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL,
  event_type    TEXT NOT NULL,   -- xem enum bên dưới
  skill         TEXT,            -- vocab / speaking / listening / writing / grammar
  score         INTEGER,         -- 0-100, tùy context
  duration_sec  INTEGER,         -- thời gian thực hiện
  metadata      JSONB,           -- chi tiết thêm
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_user_date ON learning_events(user_id, created_at DESC);
CREATE INDEX idx_events_skill ON learning_events(user_id, skill);
```

### Event Types Enum

```typescript
type LearningEventType =
    // Anki
    | "anki_card_reviewed" // metadata: { rating: 1|2|3|4, word_id, level }
    | "anki_session_complete" // metadata: { cards_total, cards_mastered, duration }
    | "anki_word_added" // metadata: { word, level }

    // Speak
    | "speak_session_start" // metadata: { mode, topic }
    | "speak_session_end" // metadata: { duration, message_count, corrections_count }
    | "speak_correction" // metadata: { original, corrected, error_type }

    // Quest
    | "quest_completed" // metadata: { quest_id, quest_type, exp_gained }

    // Journal
    | "journal_written" // metadata: { word_count, ai_feedback_score }

    // Shadow
    | "shadow_session" // metadata: { script_level, completed, speed }

    // Check-in
    | "daily_checkin" // metadata: { streak_day }

    // Milestone
    | "milestone_unlocked"; // metadata: { milestone_id }
```

### Auto-logging

Thêm `logEvent()` helper vào các action hiện có:

```typescript
// src/lib/analytics.ts
export async function logEvent(
    userId: string,
    type: LearningEventType,
    skill?: string,
    score?: number,
    durationSec?: number,
    metadata?: Record<string, any>,
) {
    await prisma.learningEvent.create({
        data: { userId, eventType: type, skill, score, durationSec, metadata },
    });
}

// Dùng trong existing API routes:
// POST /api/anki/review → logEvent(userId, 'anki_card_reviewed', 'vocab', ratingScore, ...)
// POST /api/speak/end   → logEvent(userId, 'speak_session_end', 'speaking', ...)
// POST /api/quests      → logEvent(userId, 'quest_completed', ...)
```

---

## 🔴 14.2 — LEARNING PROFILE ENGINE

### Mục tiêu

Từ raw events → tính toán **Learning Profile** của user: điểm mạnh/yếu thật sự, không phải số user tự chọn trong onboarding.

### Schema

```sql
-- Bảng: learning_profile (upsert daily)
CREATE TABLE learning_profile (
  user_id           TEXT PRIMARY KEY,

  -- Skill scores (0-100, calculated)
  vocab_score       INTEGER DEFAULT 50,
  speaking_score    INTEGER DEFAULT 50,
  listening_score   INTEGER DEFAULT 50,
  writing_score     INTEGER DEFAULT 50,
  grammar_score     INTEGER DEFAULT 50,

  -- Velocity (điểm tăng/tuần, có thể âm)
  vocab_velocity    FLOAT DEFAULT 0,
  speaking_velocity FLOAT DEFAULT 0,
  listening_velocity FLOAT DEFAULT 0,
  writing_velocity  FLOAT DEFAULT 0,
  grammar_velocity  FLOAT DEFAULT 0,

  -- Patterns
  strongest_skill   TEXT,
  weakest_skill     TEXT,
  avg_session_min   INTEGER,
  best_time_of_day  TEXT,    -- 'morning' | 'afternoon' | 'evening' | 'night'
  consistency_score INTEGER, -- 0-100 dựa trên streak + regularity

  -- Anki specific
  anki_retention_rate FLOAT, -- % cards rated Good/Easy / total
  avg_anki_score      FLOAT, -- trung bình rating

  -- Speak specific
  avg_corrections_per_session FLOAT,
  common_error_types  TEXT[], -- array: ['grammar', 'pronunciation', 'vocab']

  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Score Calculation Logic

```typescript
// src/lib/profile-engine.ts

export async function calculateLearningProfile(userId: string) {
  const last30days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 1. Vocab Score = f(anki retention rate, mastered cards, new words/week)
  const ankiEvents = await getAnkiEvents(userId, last30days);
  const retentionRate = calcRetention(ankiEvents); // Good+Easy / total reviews
  const masteredCount = await getMasteredCount(userId);
  const vocabScore = calcVocabScore(retentionRate, masteredCount);

  // 2. Speaking Score = f(corrections/session, session duration, frequency)
  const speakEvents = await getSpeakEvents(userId, last30days);
  const avgCorrections = calcAvgCorrections(speakEvents);
  const speakFrequency = speakEvents.length / 30; // sessions/day
  const speakingScore = calcSpeakingScore(avgCorrections, speakFrequency);

  // 3. Writing Score = f(journal entries, word count, AI feedback score)
  const journalEvents = await getJournalEvents(userId, last30days);
  const writingScore = calcWritingScore(journalEvents);

  // 4. Listening Score = f(shadow sessions, reading completions)
  const shadowEvents = await getShadowEvents(userId, last30days);
  const listeningScore = calcListeningScore(shadowEvents);

  // 5. Grammar Score = derived từ speak corrections type + anki grammar cards
  const grammarScore = calcGrammarScore(speakEvents, ankiEvents);

  // 6. Velocity = (current_week_score - last_week_score) * 4 (weekly rate)
  const velocities = await calcVelocities(userId);

  // 7. Best time of day
  const bestTime = calcBestTimeOfDay(await getAllEvents(userId, last30days));

  // 8. Consistency score
  const consistency = calcConsistencyScore(userId);

  await upsertProfile(userId, {
    vocabScore, speakingScore, writingScore, listeningScore, grammarScore,
    ...velocities,
    weakestSkill: findMin([vocabScore, speakingScore, writingScore, listeningScore, grammarScore]),
    strongestSkill: findMax([...]),
    bestTime,
    consistency,
  });
}
```

### API

```
POST /api/analytics/recalculate   → trigger recalculation (gọi sau mỗi session)
GET  /api/analytics/profile       → trả về learning profile hiện tại
```

---

## 🔴 14.3 — INSIGHT GENERATOR (AI-POWERED)

### Concept

Thay vì chỉ show số, dùng **Qwen 3.5-plus** để generate **natural language insights** — như có một personal tutor đang phân tích tiến độ của bạn.

### Insight Types

```typescript
type InsightType =
    | "weekly_summary" // Tóm tắt tuần vừa rồi
    | "weakness_alert" // "Bạn đang mắc lỗi grammar liên tục"
    | "strength_highlight" // "Vocab của bạn tăng mạnh tuần này"
    | "pattern_detected" // "Bạn học tốt hơn vào buổi tối"
    | "prediction" // "Với tốc độ này, bạn đạt B2 sau 3 tháng"
    | "recommendation" // "Nên tập trung vào shadowing tuần này"
    | "streak_analysis"; // "Streak của bạn ổn định hơn tháng trước"
```

### Insight Generator

```typescript
// src/lib/insight-generator.ts

export async function generateInsight(
    userId: string,
    type: InsightType,
): Promise<string> {
    const profile = await getLearningProfile(userId);
    const recentEvents = await getRecentEvents(userId, 7); // 7 ngày
    const stats = await getDetailedStats(userId);

    const prompt = buildInsightPrompt(type, profile, recentEvents, stats);

    const response = await qwen.chat({
        model: "qwen3.5-plus",
        messages: [
            {
                role: "system",
                content: `Bạn là AI tutor tiếng Anh. Phân tích data học tập và đưa ra insight 
      ngắn gọn, cụ thể, có thể hành động được. Trả lời bằng tiếng Việt. 
      Tối đa 3 câu. Không chung chung.`,
            },
            {
                role: "user",
                content: prompt,
            },
        ],
    });

    return response.content;
}

function buildInsightPrompt(type, profile, events, stats) {
    return `
    Learning Profile:
    - Vocab: ${profile.vocabScore}/100 (velocity: ${profile.vocabVelocity > 0 ? "+" : ""}${profile.vocabVelocity}/week)
    - Speaking: ${profile.speakingScore}/100 (avg ${profile.avgCorrectionsPerSession} corrections/session)
    - Writing: ${profile.writingScore}/100
    - Grammar: ${profile.grammarScore}/100
    - Weakest: ${profile.weakestSkill}
    - Consistency: ${profile.consistencyScore}/100
    - Common errors: ${profile.commonErrorTypes.join(", ")}
    - Best study time: ${profile.bestTimeOfDay}
    
    Last 7 days:
    - Anki sessions: ${stats.ankiSessions}, retention: ${stats.retentionRate}%
    - Speak sessions: ${stats.speakSessions}, total ${stats.speakMinutes} min
    - Journal entries: ${stats.journalCount}
    - Quests completed: ${stats.questsCompleted}/8 per day avg
    
    Generate insight type: ${type}
  `;
}
```

### Insight Cache

```sql
CREATE TABLE insights_cache (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL,
  type        TEXT NOT NULL,
  content     TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ,  -- weekly summary: 7 ngày, daily: 1 ngày
  is_read     BOOLEAN DEFAULT FALSE
);
```

---

## 🔴 14.4 — ANALYTICS DASHBOARD

### Layout — `/analytics` page

```
┌─────────────────────────────────┐
│  📊 YOUR ORACLE                 │
│  "Tuần này bạn đang tụt..."     │  ← AI Insight banner (AI-generated)
├─────────────────────────────────┤
│  SKILL RADAR      CONSISTENCY   │
│  [Hexagon chart]  [Score 78%]   │
├─────────────────────────────────┤
│  ACTIVITY HEATMAP               │
│  [GitHub-style calendar]        │
├─────────────────────────────────┤
│  SKILL VELOCITY                 │
│  Vocab  ↑+8  [spark line]       │
│  Speak  ↓-3  [spark line]       │
│  Write  →+1  [spark line]       │
├─────────────────────────────────┤
│  THIS WEEK                      │
│  [Bar chart: activity by day]   │
├─────────────────────────────────┤
│  TOP INSIGHTS                   │
│  [3 AI insight cards]           │
└─────────────────────────────────┘
```

### Skill Radar Chart

```tsx
// Dùng Recharts RadarChart
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    Radar,
    ResponsiveContainer,
} from "recharts";

const data = [
    { skill: "Vocab", value: profile.vocabScore, fullMark: 100 },
    { skill: "Speaking", value: profile.speakingScore, fullMark: 100 },
    { skill: "Listening", value: profile.listeningScore, fullMark: 100 },
    { skill: "Writing", value: profile.writingScore, fullMark: 100 },
    { skill: "Grammar", value: profile.grammarScore, fullMark: 100 },
];

<RadarChart data={data}>
    <PolarGrid stroke="var(--border-subtle)" />
    <PolarAngleAxis
        dataKey="skill"
        tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
    />
    <Radar
        dataKey="value"
        stroke="var(--gold)"
        fill="var(--gold)"
        fillOpacity={0.15}
        strokeWidth={2}
    />
</RadarChart>;
```

### Skill Velocity Cards

```tsx
// Mỗi skill: tên + velocity badge + sparkline 7 ngày
<VelocityCard
    skill="Vocab"
    score={78}
    velocity={+8} // +8 points this week
    trend={[65, 68, 70, 71, 74, 76, 78]} // 7 ngày gần nhất
    status="rising" // rising | falling | stable
/>

// Visual:
// "Vocab" · 78pts
// ↑ +8 this week [spark line gold]
// status badge: 🟢 Rising
```

---

## 🟡 14.5 — WEAKNESS DETECTOR

### Logic

```typescript
// Phát hiện weakness thật sự từ data, không phải self-report

export function detectWeaknesses(profile: LearningProfile): Weakness[] {
    const weaknesses: Weakness[] = [];

    // 1. Skill score dưới 50
    if (profile.speakingScore < 50) {
        weaknesses.push({
            skill: "speaking",
            severity: "high",
            evidence: `Trung bình ${profile.avgCorrectionsPerSession} corrections/session`,
            recommendation:
                "Tăng số buổi Speak lên 2x/ngày, focus vào Free Talk 10 phút",
        });
    }

    // 2. Velocity âm (đang tụt lùi)
    if (profile.vocabVelocity < -2) {
        weaknesses.push({
            skill: "vocab",
            severity: "medium",
            evidence: `Anki retention rate giảm ${Math.abs(profile.vocabVelocity)} điểm/tuần`,
            recommendation:
                "Review lại deck Again cards, giảm new cards/day xuống còn 5",
        });
    }

    // 3. Skill bị bỏ quên (0 events trong 7 ngày)
    const neglectedSkills = findNeglectedSkills(profile, 7);
    neglectedSkills.forEach((skill) => {
        weaknesses.push({
            skill,
            severity: "low",
            evidence: `Không có activity nào trong 7 ngày`,
            recommendation: getSkillRecommendation(skill),
        });
    });

    // 4. Grammar error patterns (từ speak corrections)
    if (profile.commonErrorTypes.includes("tense")) {
        weaknesses.push({
            skill: "grammar",
            severity: "high",
            evidence: "Lỗi thì chiếm 60% corrections trong tuần",
            recommendation:
                "Học Anki grammar cards level B1 + Shadow B1 scripts",
        });
    }

    return weaknesses.sort(
        (a, b) => severityOrder[b.severity] - severityOrder[a.severity],
    );
}
```

### UI — Weakness Panel

```
┌─────────────────────────────────┐
│  ⚠️  ĐIỂM YẾU CẦN CẢI THIỆN    │
├─────────────────────────────────┤
│  🔴 Speaking — HIGH             │
│  "8.3 corrections/session"      │
│  → Tập Free Talk 10 phút/ngày   │
├─────────────────────────────────┤
│  🟡 Grammar — MEDIUM            │
│  "Lỗi thì chiếm 60%"            │
│  → Học Anki grammar B1          │
└─────────────────────────────────┘
```

---

## 🟡 14.6 — PROGRESS PREDICTION

### "Khi nào tôi đạt B2?"

```typescript
export function predictLevelUp(profile: LearningProfile, targetLevel: string) {
    const currentScore = getOverallScore(profile);
    const weeklyGrowth = getAverageVelocity(profile); // points/week

    if (weeklyGrowth <= 0) {
        return {
            possible: false,
            message: "Tốc độ hiện tại chưa đủ để dự đoán",
        };
    }

    const targetScore = LEVEL_THRESHOLDS[targetLevel]; // B2 = 75
    const pointsNeeded = targetScore - currentScore;
    const weeksNeeded = Math.ceil(pointsNeeded / weeklyGrowth);

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + weeksNeeded * 7);

    return {
        possible: true,
        weeksNeeded,
        targetDate,
        requiredDailyMinutes: calcRequiredStudyTime(weeklyGrowth, targetScore),
        message: `Với tốc độ hiện tại, bạn đạt ${targetLevel} sau ${weeksNeeded} tuần (${formatDate(targetDate)})`,
    };
}
```

### UI Component

```
┌─────────────────────────────────┐
│  🎯 LEVEL PREDICTION            │
│                                 │
│  Mục tiêu: B2                   │
│  Hiện tại: B1 (62/100)          │
│                                 │
│  ████████░░░░░░░░  62%          │
│                                 │
│  📅 Dự kiến đạt: 14/06/2026     │
│  ⏱️  ~14 tuần với tốc độ này    │
│                                 │
│  Để nhanh hơn:                  │
│  "+15 min/ngày → sớm 3 tuần"    │
└─────────────────────────────────┘
```

---

## 🟡 14.7 — WEEKLY INTELLIGENCE REPORT

### Concept

Mỗi thứ Hai, app generate **Weekly Report** — như báo cáo của coach gửi cho học viên.

### Report Structure

```typescript
interface WeeklyReport {
    weekNumber: number;
    period: string; // "03/03 - 09/03/2026"

    // Summary stats
    totalStudyMinutes: number;
    totalEXP: number;
    questCompletionRate: number; // %

    // Skill breakdown
    skillStats: {
        skill: string;
        sessionsCount: number;
        scoreChange: number; // +5, -2, 0
        trend: "up" | "down" | "stable";
    }[];

    // Highlights
    bestDay: string; // "Thứ 4 — 45 phút"
    topAchievement: string; // "Hoàn thành 7/7 ngày streak"
    biggestImprovement: string; // "Vocab +12 điểm"

    // AI narrative (Qwen generated)
    summary: string; // 3-4 câu AI viết
    topRecommendation: string; // 1 việc cụ thể cần làm tuần tới

    // Comparison
    vsLastWeek: {
        studyTime: number; // +15 phút so với tuần trước
        exp: number;
        consistency: number;
    };
}
```

### UI — `/analytics/weekly`

```
┌─────────────────────────────────┐
│  📋 WEEKLY REPORT               │
│  Tuần 10 · 03/03 - 09/03        │
├─────────────────────────────────┤
│  TỔNG KẾT                       │
│  185 phút · 1,240 EXP · 86%     │
│  [AI summary 3 câu]             │
├─────────────────────────────────┤
│  SKILL CHANGES                  │
│  Vocab   +12 ↑  ██████████      │
│  Speaking -3 ↓  ████████        │
│  Writing  +5 ↑  ███████         │
├─────────────────────────────────┤
│  HOẠT ĐỘNG THEO NGÀY            │
│  [Bar chart T2→CN]              │
├─────────────────────────────────┤
│  TUẦN NÀY SO VỚI TUẦN TRƯỚC    │
│  Thời gian: +15 phút ↑         │
│  EXP:       -80 ↓               │
│  Consistency: = ổn định         │
├─────────────────────────────────┤
│  🎯 VIỆC CẦN LÀM TUẦN TỚI      │
│  [AI recommendation]            │
└─────────────────────────────────┘
```

### Trigger

- Auto-generate mỗi thứ Hai 8:00 sáng (cron job)
- Push notification: "📊 Báo cáo tuần của bạn đã sẵn sàng"
- Badge đỏ trên Analytics icon nếu chưa đọc

---

## 🟡 14.8 — HEATMAP & ACTIVITY GRAPH

### GitHub-style Heatmap

```tsx
// Hiển thị 90 ngày gần nhất (3 tháng)
// Màu: void → gold gradient theo intensity

const intensityColors = {
    0: "var(--bg-elevated)", // Không học
    1: "rgba(245,200,66,0.2)", // < 15 min
    2: "rgba(245,200,66,0.45)", // 15-30 min
    3: "rgba(245,200,66,0.7)", // 30-60 min
    4: "var(--gold)", // > 60 min
};

// Tooltip khi hover: "Thứ 3, 04/03 · 42 phút · +320 EXP"
```

### Activity Stream (recent)

```tsx
// Timeline 10 events gần nhất
<ActivityStream>
    <Event
        icon={<BookOpen />}
        text="Anki: 25 cards · 92% retention"
        time="2h ago"
    />
    <Event icon={<Mic2 />} text="Speak: Job Interview 18 phút" time="5h ago" />
    <Event
        icon={<Swords />}
        text="Quest: Anki Review ✓ +30 EXP"
        time="6h ago"
    />
    <Event icon={<PenLine />} text="Journal: 145 từ" time="Yesterday" />
</ActivityStream>
```

---

## 🟢 14.9 — SKILL VELOCITY TRACKER

### Concept

Track không chỉ điểm hiện tại mà **tốc độ thay đổi** — dùng 14-day rolling average.

```typescript
// 14-day rolling score cho mỗi skill
// Plot thành line chart → user thấy trend ngay
const velocityData = {
    vocab: [65, 66, 67, 68, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
    speaking: [72, 71, 71, 70, 69, 70, 70, 69, 68, 68, 69, 70, 71, 72],
    //...
};

// Velocity badge:
// +5/week → "↑ Growing"  (green)
// -2/week → "↓ Declining" (red)
//  0/week → "→ Stable"   (gray)
```

---

## 🟢 14.10 — INSIGHT NOTIFICATIONS

```typescript
// Thêm vào existing push notification system

const insightNotifications = [
    {
        type: "weakness_alert",
        trigger: () => profile.speakingScore < 45,
        title: "⚠️ Speaking đang yếu",
        body: "Tuần này có 12 corrections. Tập thêm 10 phút hôm nay?",
    },
    {
        type: "strength_highlight",
        trigger: () => profile.vocabVelocity > 10,
        title: "🔥 Vocab đang tăng mạnh!",
        body: "+12 điểm tuần này. Duy trì đà này!",
    },
    {
        type: "weekly_report",
        trigger: () => isMonday() && hour() === 8,
        title: "📊 Báo cáo tuần của bạn",
        body: "Xem tiến độ học tập 7 ngày qua",
    },
    {
        type: "neglect_alert",
        trigger: () => daysSinceLastEvent("writing") > 5,
        title: "✍️ Lâu rồi chưa viết Journal",
        body: "5 ngày không viết. Writing score đang giảm dần",
    },
];
```

---

## 📊 DATA FLOW TỔNG THỂ

```
User actions
     ↓
Learning Events (14.1)
     ↓
Profile Engine recalculates (14.2) ← trigger sau mỗi session
     ↓
     ├─→ Analytics Dashboard (14.4)
     ├─→ Weakness Detector (14.5)
     ├─→ Progress Prediction (14.6)
     ├─→ Insight Generator / AI (14.3) ← Qwen 3.5-plus
     │        ↓
     │   Insights Cache
     │        ↓
     │   Weekly Report (14.7)
     │   Insight Notifications (14.10)
     └─→ Heatmap & Velocity (14.8, 14.9)
```

---

## 📊 DATABASE SUMMARY

```sql
-- Bảng mới cần tạo:
learning_events      -- raw event log
learning_profile     -- computed profile (upsert)
insights_cache       -- AI-generated insights
weekly_reports       -- generated weekly reports
```

---

## 📦 DEPENDENCIES MỚI

```bash
npm install recharts          # Charts (RadarChart, LineChart, BarChart)
# Qwen 3.5-plus đã có sẵn ✅
# Prisma đã có sẵn ✅
# Push notifications đã có sẵn ✅
```

---

## 📊 IMPLEMENTATION ORDER

### Sprint 1 — Data Foundation (làm trước)

```
1. Schema migration: learning_events + learning_profile — 1h
2. logEvent() helper + inject vào existing API routes — 3h
3. Profile Engine calculation logic — 3h
4. API: /api/analytics/profile — 1h
```

### Sprint 2 — Core Dashboard

```
5. Analytics page layout — 2h
6. Skill Radar Chart (Recharts) — 1.5h
7. Activity Heatmap — 2h
8. Skill Velocity sparklines — 1.5h
```

### Sprint 3 — Intelligence

```
9.  Weakness Detector — 2h
10. Insight Generator (Qwen) — 2h
11. Progress Prediction — 1.5h
12. Insight cards UI — 1h
```

### Sprint 4 — Reports & Notifications

```
13. Weekly Report generator — 3h
14. Weekly Report UI page — 2h
15. Insight push notifications — 1.5h
16. Add Analytics to nav/More drawer — 30min
```

**Total estimate: ~32h**

---

## 🔑 KEY PRINCIPLES

1. **Data-driven, không self-report** — profile tính từ actual behavior, không phải onboarding answers
2. **Actionable insights chỉ** — mỗi insight phải có 1 việc cụ thể cần làm
3. **AI supplement, không phải replace** — charts/numbers là ground truth, AI viết narrative
4. **Velocity quan trọng hơn score** — đang tăng 50 → 55 tốt hơn stuck ở 70
5. **Recalculate nhẹ** — profile update sau mỗi session, không phải real-time

---

_Phase 14: ORACLE — Analytics & Insights Engine_
_Player: Dũng Vũ · Phase 14 start: 2026-03-08_
