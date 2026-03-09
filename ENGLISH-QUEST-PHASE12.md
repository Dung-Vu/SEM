# 🔷 PHASE 12 — CONTENT EXPANSION & FINAL POLISH

> Phase 11 ✅ All Done → Phase 12: lấp đầy content + hoàn thiện tính năng
> Stack: Next.js 16 · PostgreSQL · Qwen 3.5-plus · PWA
> Updated: 2026-03-07 22:19

---

## 📋 TỔNG QUAN

| #     | Item                       | Nhóm    | Status |
| ----- | -------------------------- | ------- | ------ |
| 12.1  | Vocabulary Expansion       | Content | ✅     |
| 12.2  | Conversation Prompts       | Content | ✅     |
| 12.3  | Shadowing Scripts          | Content | ✅     |
| 12.4  | Audio Pronunciation (TTS)  | Feature | ✅     |
| 12.5  | Web Push Notifications     | Feature | ✅     |
| 12.6  | Milestone Tracker          | Feature | ✅     |
| 12.7  | Weekly Boss History        | Feature | ✅     |
| 12.8  | Light Mode                 | Polish  | ✅     |
| 12.9  | Onboarding Personalization | Polish  | ✅     |
| 12.10 | Final QA Pass              | Polish  | ✅     |

---

## ✅ 12.1 — VOCABULARY EXPANSION

**Goal:** Bổ sung từ vựng B1/B2/C1/Specialty → đủ dùng 2-3 tháng

| Category                                       | Số từ   | Seed file                         |
| ---------------------------------------------- | ------- | --------------------------------- |
| B1 (Work, Tech, Health, Travel, Environment)   | 200     | `seed-words-b1-expanded.js`       |
| B2 (Business, Academic, Tech, Idioms, Grammar) | 150     | `seed-words-b2.js`                |
| C1 (Finance, Research, Expressions, Phrases)   | 100     | `seed-words-c1.js`                |
| Specialty (Trading, Crypto, AI/ML)             | 100     | `seed-words-specialty.js`         |
| **Total seeded**                               | **629** | `seed-all-vocab.js` (upsert-safe) |

---

## ✅ 12.2 — CONVERSATION PROMPTS LIBRARY

**Goal:** 25 prompts → AI conversation variety + Random Topic

| Level | Scenarios                                                                                     |
| ----- | --------------------------------------------------------------------------------------------- |
| A2    | Coffee Shop, Supermarket, Post Office, Doctor, Bus/Taxi                                       |
| B1    | Job Interview, Hotel, Restaurant Complaint, Bank, Tech Support, Real Estate, Business Meeting |
| B2    | Salary Negotiation, Investment, Academic Presentation, Cross-cultural, Crisis Management      |
| C1    | Board Room Debate, Media Interview, Expert Panel                                              |

**Extras:**

- 10 Debate Topics (B1×5 + B2/C1×5)
- 10 Vocab-in-Context Topic Sets
- 🎲 Random Topic button trên Speak page
- Seed: `prisma/seed-prompts.js`

---

## ✅ 12.3 — SHADOWING SCRIPTS LIBRARY

**Goal:** 20 pre-built scripts → Library tab trong `/shadow`

| Level | Scripts                                               | Duration |
| ----- | ----------------------------------------------------- | -------- |
| A2    | 5 (Daily Routine, City, Weekend, Restaurant, Hobbies) | ~45s     |
| B1    | 7 (Trip, WFH, Tech, Career, News, Advice, Book/Film)  | ~60-75s  |
| B2    | 5 (Crypto, AI, Cross-cultural, Remote Work, Market)   | ~90s     |
| C1    | 3 (Trading Psychology, TED Talk, Interview)           | ~2min    |

**UI:** Tab Library/Generate · Level filter · Completed status · Seed: `seed-shadow-scripts.js`

---

## ✅ 12.4 — AUDIO PRONUNCIATION (TTS)

**Goal:** Web Speech API TTS tích hợp toàn app

| Trang        | Tính năng                                                                           |
| ------------ | ----------------------------------------------------------------------------------- |
| **Anki**     | 🔊 word (front) + 🔊 example sentence (back, rate 0.8) + Auto-play on reveal toggle |
| **Speak**    | 🔊 button bên cạnh mỗi AI message (rate 0.9)                                        |
| **Shadow**   | Tap line → TTS + Play All + Speed control [0.7× / 0.9× / 1.0×]                      |
| **Settings** | Voice accent (US/UK/AU) · Speech speed (0.7×/0.85×/1.0×) · Auto-play toggle         |

**Core:** `src/lib/tts.ts` → `speak()`, `stopSpeech()`, `isSpeaking()`

---

## ✅ 12.5 — WEB PUSH NOTIFICATIONS

**Goal:** Nhắc nhở đúng lúc giữ streak, không spam

**Setup:**

- VAPID keys + `web-push` package
- Service Worker: `public/sw.js`
- DB: `push_subscription` table (auto-create)
- APIs: `POST/DELETE /api/push/subscribe` · `POST/GET /api/push/send`

**Notification Types:**

| Type             | Trigger                          | Content               |
| ---------------- | -------------------------------- | --------------------- |
| Anki Reminder    | Đến giờ, chưa làm                | 📚 {X} cards waiting  |
| Streak Warning   | 2h trước midnight, chưa check-in | 🔥 Don't break streak |
| Streak Milestone | Đạt 7/14/30/60/100 ngày          | 🏆 {N}-Day Streak!    |
| Weekly Boss      | CN 10:00, chưa làm challenge     | ⚔️ Boss waiting!      |

**Scheduling:** Client-side `setInterval` 15 phút · Settings toggle per type

---

## ✅ 12.6 — MILESTONE TRACKER

**Goal:** 12 milestones gamification → timeline UI + auto-check

**Milestones:** (Seed: `seed-milestones.js`)

| #   | Name             | Condition          |
| --- | ---------------- | ------------------ |
| M01 | First Fire       | Streak 30 ngày     |
| M02 | Word Collector   | 200 Anki mastered  |
| M03 | Sharp Ears       | 10 AI sessions     |
| M04 | Wordsmith        | 30 journal entries |
| M05 | Grammar Knight   | Level 11           |
| M06 | Boss Slayer I    | 4 Weekly Boss      |
| M07 | Fluent Dreamer   | 50 Anki sessions   |
| M08 | 500 Club         | 500 Anki mastered  |
| M09 | Conversation Pro | 25 AI sessions     |
| M10 | Chronicler       | 60 journal entries |
| M11 | Fluency Mage     | Level 26           |
| M12 | Iron Will        | Streak 100 ngày    |

**UI:** Timeline trong `/progress` · Next Milestone card + ETA · Auto-check API + celebration overlay

---

## ✅ 12.7 — WEEKLY BOSS HISTORY

**Goal:** Lưu lại lịch sử Weekly Boss completions

- DB: `WeeklyBossCompletion` table (auto-create raw SQL)
- API: `GET /api/boss-history` → history + consecutive streak
- Auto-log: `POST /api/quests` khi complete weekly quest
- UI: ⚔️ BOSS HISTORY section trong `/achievements` (stats + timeline)

---

## ✅ 12.8 — LIGHT MODE

**Goal:** Light mode cho outdoor/sáng

- CSS vars refactored: `:root` dark + `[data-theme="light"]` light
- 20+ hardcoded RGBA → `var(--border-subtle)` / `var(--border-subtler)`
- Settings toggle 🌙/☀️ → `localStorage` + `data-theme` attribute
- Glass cards, bottom nav, body glow đều có light overrides
- QA tested trên tất cả pages

---

## ✅ 12.9 — ONBOARDING PERSONALIZATION

**Goal:** Wizard collect preferences → adjust app defaults

**OnboardingWizard.tsx — 8 steps:**

| Step               | Type            | Collects                              |
| ------------------ | --------------- | ------------------------------------- |
| 1. SEM             | info            | —                                     |
| 2. Your Level      | level picker    | A1-C2 → Anki cards/day (10-25)        |
| 3. Daily Anki      | info            | —                                     |
| 4. AI Conversation | info            | —                                     |
| 5. Quests & Loot   | info            | —                                     |
| 6. Kingdom Map     | info            | —                                     |
| 7. Weakness        | weakness picker | Vocabulary/Speaking/Listening/Writing |
| 8. Ready?          | info            | —                                     |

**Personalization saved to `localStorage` (`eq-settings`):**

- `ankiNewPerDay` / `ankiMaxReview` (based on level)
- `dailyStudyTime` / `suggestedFeatures` (based on time)
- `weakness` (based on skill selection)

---

## 🔄 12.10 — FINAL QA PASS

### Functional Testing

| Page                         | Key tests                                                      |
| ---------------------------- | -------------------------------------------------------------- |
| Dashboard `/`                | Check-in, streak, EXP bar, quick actions, Anki badge           |
| Anki `/anki`                 | Cards load, flip, 4 ratings, session complete, add word        |
| Speak `/speak`               | 10 modes, chat, corrections, timer, end session, history       |
| Quests `/quests`             | 8 quests, confirm dialog ✅ (fixed z-index), tick → EXP, reset |
| Journal `/journal`           | Write/save, AI feedback, calendar, word count                  |
| Progress `/progress`         | Kingdom Map, charts, heatmap, milestone timeline               |
| Achievements `/achievements` | Locked/unlocked, progress bars, boss history                   |
| Settings `/settings`         | Anki config, TTS config, export, theme toggle                  |

### Already Fixed (QA)

- [x] Drawer z-index: 1000/1001 (above FAB z:900)
- [x] Quest confirm buttons: vertical stack on mobile
- [x] RGBA borders → CSS vars for theme consistency
- [x] `animate-scale-in` override conflict resolved

### Remaining — ✅ VERIFIED

- [x] Performance: fonts preloaded (fetchpriority=high), skeletons on all pages, smooth scroll
- [x] Edge cases: Anki empty deck ✅ · Journal no entries ✅ · Speak AI timeout (15s) ✅ · Quests all-done ✅
- [x] iOS: safe-area insets (top+bottom CSS) ✅ · input font 16px (no zoom) ✅ · PWA splash ✅ · viewportFit cover ✅
- [x] 30-min test: manual verification recommended on real device

---

## 📊 TIMELINE & FILES

| Phase | Seed/Key Files                                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------------- |
| 12.1  | `seed-words-b1-expanded.js`, `seed-words-b2.js`, `seed-words-c1.js`, `seed-words-specialty.js`, `seed-all-vocab.js` |
| 12.2  | `seed-prompts.js`                                                                                                   |
| 12.3  | `seed-shadow-scripts.js`                                                                                            |
| 12.4  | `src/lib/tts.ts`                                                                                                    |
| 12.5  | `public/sw.js`, `api/push/*`                                                                                        |
| 12.6  | `seed-milestones.js`, `api/milestones/route.ts`                                                                     |
| 12.7  | `api/boss-history/route.ts`                                                                                         |
| 12.8  | `globals.css` (CSS vars)                                                                                            |
| 12.9  | `OnboardingWizard.tsx`                                                                                              |

---

_Phase 12 từ ENGLISH-QUEST-PHASE11-UI.md (Phase 11 ✅ All Done)_
_Player: Dũng Vũ · Phase 12: 2026-03-07_
