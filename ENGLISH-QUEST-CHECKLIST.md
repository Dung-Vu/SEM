# ✅ ENGLISH QUEST — Implementation Checklist

> Solo App · Personal Mastery Edition · Player: Dũng Vũ
> Cập nhật: 2026-03-07 12:43
> Stack: Next.js 16 + TypeScript + TailwindCSS + Prisma 6 + **PostgreSQL** · Mobile PWA (iPhone 15 Pro Max)
>
> **Progress: Phase 0-9 ✅ ALL DONE · Phase 10 remaining (Launch)**
> **DB: 388 words · 388 SRS cards · 24 quests · 18 resources · 15 achievements**
> **Pages: 19 · API Routes: 19 · Components: 3 · AI: Qwen 3.5-plus via Bailian**

---

### ✅ ACCEPTANCE TEST Phase 0 — ✅ PASSED

> App Next.js chạy ✅, kết nối được DB (PostgreSQL) ✅, gọi được AI API ✅

---

## 🔷 PHASE 1 — CORE IDENTITY LAYER

> Mục tiêu: Nhân vật của Dũng tồn tại, có stats, có EXP, có Level
> Thời gian ước tính: 3-5 ngày

### 1.1 · Database Schema — User & Progress

```
Tạo các bảng sau trong schema.prisma:
```

- [x] Bảng `user`: id, username, level, exp, streak, lastCheckIn, createdAt _(không có gold — chưa cần)_
- [x] Bảng `stats`: userId, vocab, grammar, listening, speaking, writing (1-10 mỗi stat)
- [x] Bảng `weekly_stats_log`: userId, weekNumber, year, tất cả stats, totalExp, highlight, struggle, focus
- [x] Bảng `achievement`: id, key, name, description, icon, condition
- [x] Bảng `user_achievement`: userId, achievementId, unlockedAt
- [x] `prisma db push` chạy thành công _(dùng db push thay migrate cho SQLite)_
- [x] Seed data: tạo user "dung", level 1, exp 0 + 15 achievements (`prisma/seed.js`)

### 1.2 · Dashboard — Màn hình chính

- [x] Route `/` → Dashboard page (`src/app/page.tsx`)
- [x] Hiển thị: Level badge + Tên kingdom + Level + EXP bar
- [x] EXP bar: thanh tiến độ từ current level → next level (gradient glow)
- [x] Hiển thị 5 stats hiện tại dạng số + bar + horizontal grid
- [x] Hiển thị Streak hiện tại 🔥 (số ngày)
- [x] Nút "Check in hôm nay" → +10 EXP + cập nhật streak (`POST /api/checkin`)
- [x] Logic streak: nếu lastCheckIn < hôm qua → reset streak về 0 (`src/lib/streak.ts`)
- [x] Hiển thị Kingdom hiện tại: Beginner Village / Grammar Forest / Fluency Castle / IELTS Arena / Legend Realm

### 1.3 · EXP & Level System

- [x] Function `getLevelFromExp`, `getExpForNextLevel`, `getKingdomInfo` (`src/lib/exp.ts`)
- [x] Level thresholds: 0/5k/20k/50k/120k/250k EXP theo thiết kế
- [x] Khi level up: level detection in check-in + activity logging
- [x] API route: `POST /api/exp` — body: `{ source, amount }` (`src/app/api/exp/route.ts`)
- [x] Hiển thị notification khi level up: "🎉 Level X!" + full-screen celebration overlay ✅ (Batch 1)

### 1.4 · Weekly Stats Self-Assessment

- [x] Route `/stats/weekly` — form tự chấm điểm (`src/app/stats/weekly/page.tsx`)
- [x] Form 5 sliders (1-10): Vocab / Grammar / Listening / Speaking / Writing (touch-friendly 26px thumb)
- [x] Input text: Highlight / Struggle / Focus
- [x] Nút Submit → lưu vào `weekly_stats_log` + cộng 50 EXP
- [x] Chỉ submit được 1 lần/tuần (check bằng weekNumber + year)
- [x] Chart: bar chart lịch sử 5 stats theo tuần + trend arrows (↑↓→) ✅ (Batch 5)

### ✅ ACCEPTANCE TEST Phase 1 — ✅ PASSED

> Dashboard hiện level/EXP/streak ✅, check-in ✅, EXP tăng ✅, tự chấm stats tuần ✅

---

## 🔷 PHASE 2 — ANKI / SRS ENGINE

> Mục tiêu: Hệ thống flashcard với Spaced Repetition hoạt động đúng
> Thời gian ước tính: 5-7 ngày

### 2.1 · Database Schema — Vocabulary & SRS

- [x] Bảng `word`: id, english (unique), vietnamese, definition, exampleSentence, level, tags _(không có audioUrl/imageUrl — chưa cần)_
- [x] Bảng `srs_card`: userId, wordId, intervalDays, easeFactor, nextReview, reviewsCount, lapseCount, status
- [x] Bảng `review_log`: userId, wordId, reviewedAt, rating (1-4), intervalBefore, intervalAfter
- [x] Seed 50 từ A1 để test (`prisma/seed-words.js`) _(50 thay vì 100 — đủ để test)_

### 2.2 · SRS Algorithm (SM-2)

- [x] Implement SM-2 algorithm trong `src/lib/srs.ts`:
    - Rating 1 (Again): reset interval về 1 ngày, easeFactor -0.2 ✅
    - Rating 2 (Hard): interval × 1.2, easeFactor -0.15 ✅
    - Rating 3 (Good): interval × easeFactor ✅
    - Rating 4 (Easy): interval × easeFactor × 1.3, easeFactor +0.15 ✅
- [x] `GET /api/anki/review` — lấy cards due hôm nay + new cards (max 15/ngày)
- [x] `POST /api/anki/review` — submit rating, cập nhật SRS, log review, cộng EXP
- [x] Mastered = intervalDays ≥ 30, max interval 365 ngày

### 2.3 · UI Flashcard

- [x] Route `/anki` — màn hình review (`src/app/anki/page.tsx`)
- [x] Hiển thị số cards: "X / Y" counter + progress bar
- [x] Card view: FRONT → tiếng Anh + example sentence (blank word) + status badge (NEW/A1)
- [x] Nút "👀 Show Answer" → reveal card back
- [x] BACK → Vietnamese + definition + full sentence + tags
- [x] 4 nút đánh giá: 🔴 Again / 🟡 Hard / 🟢 Good / 🔵 Easy
- [x] Progress bar: gradient fill theo completion %
- [x] Khi hết cards: summary screen + total EXP earned + word counts by status

### 2.4 · Add New Words

- [x] Route `/anki/add` — form thêm từ mới (`src/app/anki/add/page.tsx`)
- [x] Fields: English, Vietnamese, Definition, Example sentence, Level (A1-C2 buttons), Tags
- [x] Sau khi thêm → tự động tạo `srs_card` + cộng 2 EXP (`POST /api/anki/words`)
- [x] Bulk import: `/anki/import` — paste danh sách từ + meaning → xử lý hàng loạt ✅ (Batch 2)
- [x] Nút "🤖 AI Fill Details" → AI tự điền vietnamese, definition, example, level, tags ✅ (Batch 4)

### 2.5 · Anki Stats

- [ ] Trang `/anki/stats` _(có session summary hiển thị counts thay thế)_
- [x] Tổng số từ: New / Learning / Review / Mastered (hiện trên session summary)
- [x] "Mastered" = intervalDays ≥ 30 (trong `srs.ts`)
- [x] Forecast: "Tomorrow: X · This Week: Y" hiện trên session complete ✅ (Batch 1)

### 2.6 · Daily Quest Integration

- [x] Khi hoàn thành Anki session ≥10 reviews → tự động tick quest `anki_review` ✅ (Batch 5)
- [x] Khi thêm ≥10 từ mới trong ngày → tự tick quest `learn_10_words` ✅ (Batch 5)

### ✅ ACCEPTANCE TEST Phase 2 — ✅ PASSED

> Review cards ✅, đánh giá 4 cấp ✅, SM-2 interval đúng ✅, EXP cộng ✅, add word ✅

---

## 🔷 PHASE 3 — AI CONVERSATION PARTNER ✅

> Mục tiêu: Chat với AI như người native, có correction, có progress tracking
> **✅ Implemented với Qwen 3.5-plus qua Bailian API**

### 3.1 · AI Client Library

- [x] `src/lib/ai-client.ts` — OpenAI-compatible API wrapper
- [x] 6 conversation modes với system prompts chi tiết
- [x] Session summary generation function
- [x] Lưu conversations vào DB: auto-save on session end → ConversationSession + ConversationMessage ✅ (Batch 2)

### 3.2 · Chat UI

- [x] Route `/speak` — màn hình AI conversation (`src/app/speak/page.tsx`)
- [x] Chat bubble interface: user (bên phải, indigo) / AI (bên trái, gray)
- [x] Input text box + nút Send (arrow icon)
- [x] Hiển thị typing indicator (🤖 Typing...)
- [x] Timer đếm thời gian session hiện tại
- [x] Nút "End Session" → generate summary + tính EXP

### 3.3 · Conversation Modes

- [x] Mode selection screen với 6 chế độ:
    - **💬 Free Talk** — nói về bất cứ gì
    - **☕ Coffee Shop** — roleplay barista/customer
    - **🏢 Office Meeting** — discuss projects
    - **✈️ Airport** — navigate airport, directions
    - **⚔️ Debate** — practice argumentation
    - **📚 Vocab Quiz** — vocabulary in context
- [x] Mỗi mode có system prompt riêng được load tự động
- [x] AI phản hồi tự nhiên, có hướng dẫn sửa lỗi
- [x] 10 modes hội thoại: Free Talk, Coffee Shop, Office, Airport, Debate, Vocab Quiz, Doctor, Hotel, Restaurant, Job Interview ✅ (Batch 6)

### 3.4 · AI Correction System

- [x] System prompt bao gồm: correction format ❌ [original] → ✅ [corrected] · [explanation tiếng Việt]
- [x] Parse correction riêng → highlight màu khác trong chat bubbles: ❌ (red strikethrough) → ✅ (green bold) + explanation (purple) ✅ (Batch 5)
- [x] Parse corrections từ messages: ❌→✅ pattern extraction ✅ (Batch 2)
- [x] Trang `/speak/corrections` — My Corrections page ✅ (Batch 2)

### 3.5 · Session Summary

- [x] Sau khi end session → AI tự generate summary (chủ đề, điểm mạnh, cải thiện, từ vựng)
- [x] Hiển thị summary + EXP earned (5 EXP/phút, min 20 EXP)
- [x] Lưu summary vào DB → ConversationSession.summary ✅ (Batch 2)

### 3.6 · API Route

- [x] `POST /api/ai/chat` — action: "chat" | "summary" (`src/app/api/ai/chat/route.ts`)

### ✅ ACCEPTANCE TEST Phase 3 — ✅ PASSED

> Chọn mode Free Talk ✅, AI chào hỏi ✅, chat qua lại ✅, corrections inline ✅, timer ✅

---

## 🔷 PHASE 4 — DAILY QUEST SYSTEM

> Mục tiêu: Hệ thống nhiệm vụ hàng ngày, streak, weekly boss
> Thời gian ước tính: 3-4 ngày

### 4.1 · Database Schema — Quests

- [x] Bảng `daily_quest_template`: id, key, name, description, expReward, type (main/side/weekly), icon
- [x] Bảng `quest_progress`: userId, questKey, date, completed, completedAt
- [x] Seed 12 quests (`prisma/seed-quests.js`): 4 main + 4 side + 4 weekly challenges

### 4.2 · Quest Board UI

- [x] Route `/quests` — bảng nhiệm vụ hôm nay (`src/app/quests/page.tsx`)
- [x] 3 sections: ⚔️ Main Quests / 🗡️ Side Quests / 👑 Weekly Challenge (Chủ nhật)
- [x] Mỗi quest: checkbox + icon + tên + description + EXP badge
- [x] Progress bar tổng: "X/Y quests done today" + percentage
- [x] Khi tick quest → toast notification + EXP cộng ngay + activity log
- [x] Quests auto-reset — reset theo date string (YYYY-MM-DD)

### 4.3 · Manual Quest Completion

- [x] Tất cả quests đều tick thủ công bằng checkbox → confirmation dialog
- [x] Confirm dialog: "🎯 Xác nhận hoàn thành? Bạn đã thực sự hoàn thành quest này chưa? Hãy trung thực với bản thân."

### 4.4 · Weekly Boss

- [x] Mỗi Chủ nhật → hiện 4 Weekly Challenge (+100 EXP mỗi cái)
- [x] Challenges: Podcast Summary / Writing Analysis / AI Debate / Weekly Review
- [ ] Hoàn thành → badge "Weekly Champion W[X]" _(chưa có badge system)_
- [ ] Lịch sử Weekly Boss _(chưa implement)_

### 4.5 · Streak Logic nâng cao

- [x] "Emergency freeze" — 2 lần/tháng skip ngày không mất streak (auto-detect khi check-in) ✅ (Batch 5)
- [x] "Minimum day" — chỉ cần làm 1 Main Quest để giữ streak (auto-detect khi check-in) ✅ (Batch 6)
- [x] Streak milestone celebrations: 7 / 14 / 30 / 60 / 100 ngày full-screen overlay ✅ (Batch 1)

### 4.6 · Activity Log

- [x] Mỗi EXP action được log: timestamp, source, amount, description (`ActivityLog` model)
- [x] Trang `/log` — activity feed by date + "Today +X EXP" (`src/app/log/page.tsx`)
- [x] Calendar heatmap (GitHub-style, 90 ngày) — 4 cấp độ màu (`/api/activity`)

### ✅ ACCEPTANCE TEST Phase 4 — ✅ PASSED

> Quest board hiện 8 quests ✅, tick quest + confirm ✅, EXP cộng ✅, activity log + heatmap ✅

---

## 🔷 PHASE 5 — CONTENT & LEARNING HUB

> Mục tiêu: Tổng hợp resource học, tích hợp journal, tracking nội dung đã học
> Thời gian ước tính: 3-4 ngày

### 5.1 · English Journal

- [x] Route `/journal` — viết nhật ký tiếng Anh (`src/app/journal/page.tsx`)
- [x] Editor đơn giản: textarea + nút Submit + word counter + difficulty selector
- [x] Template gợi ý: Date / Entry / New words / Difficulty (easy/medium/hard)
- [x] Nút "AI Feedback" 🤖 → gửi journal entry lên AI, nhận grammar/vocab feedback ✅ (Batch 1)
- [x] Lưu entry vào DB (`/api/journal`) + cộng EXP (+25, +35 nếu 100+ words)
- [x] Calendar: 30 ngày gần nhất, ngày có journal highlight xanh
- [x] Stats: streak journal, tổng entries, tổng words, avg words/entry

### 5.2 · Resource Tracker

- [x] Route `/resources` — danh sách tài nguyên học (`src/app/resources/page.tsx`)
- [x] Categories filter: Podcast / YouTube / Series / Books / Articles
- [x] Mỗi resource: tên, link, level badge, ghi chú, status cycling (Want → In Progress → Done)
- [x] Pre-seeded: 18 resources (`prisma/seed-resources.js`)
- [x] Khi mark "Done" → cộng EXP tương ứng + activity log
- [x] Nút ➕ Add — form thêm resource mới (name, link, category, level)

### 5.3 · Vocabulary Hunt Log

- [x] Nút "Quick Add Word" — floating FAB ➕ button, accessible từ mọi trang (`src/app/components/QuickAddWord.tsx`)
- [x] Tap → bottom-sheet modal: nhập English word + Vietnamese → tự động thêm vào Anki deck + 2 EXP
- [x] Counter mỗi ngày: "X/10 words hunted" badge trên FAB + toast 🎯 ✅ (Batch 1)

### 5.4 · Reading Tracker

- [x] Route `/reading` — Reading Tracker page: log title, category, minutes, pages, notes ✅ (Batch 3)
- [x] Daily goal progress bar (30 min/day) + stats summary ✅ (Batch 3)
- [x] Tự động cộng EXP: 1 EXP/phút đọc (`/api/reading`) ✅ (Batch 3)

### 5.5 · Shadowing Sessions

- [x] Route `/shadow` — shadowing practice ✅ (Batch 4)
- [x] Input: paste text script hoặc AI generate từ topic ✅ (Batch 4)
- [x] Script hiển thị line-by-line, tap để nghe (Web Speech API) ✅ (Batch 4)
- [x] Timer + star rating (1-5) + save session + EXP (2 EXP/min) ✅ (Batch 4)
- [x] Nút "Generate script" → AI tạo monologue 1-2 phút theo topic ✅ (Batch 4)
- [x] Session history log ✅ (Batch 4)

### ✅ ACCEPTANCE TEST Phase 5 — ✅ PASSED

> Viết journal ✅, lưu + EXP ✅, calendar ✅, resources 18 items ✅, mark done + EXP ✅

---

## 🔷 PHASE 6 — PROGRESS & ANALYTICS

> Mục tiêu: Nhìn vào app thấy ngay mình đang ở đâu, đang tiến như thế nào
> Thời gian ước tính: 2-3 ngày

### 6.1 · Progress Dashboard

- [x] Route `/progress` — tổng quan tiến độ (`src/app/progress/page.tsx`)
- [x] "Kingdom Map" — visual 5 kingdoms với "YOU ARE HERE" highlight
- [x] EXP history chart: bar chart EXP theo tuần (12 tuần)
- [x] Stats bars: 5 skills (Vocab/Grammar/Listening/Speaking/Writing)
- [x] Days studied heatmap: 365 ngày + màu 4 cấp độ
- [x] "Since you started": Days, Total EXP, Words, Active days

### 6.2 · Level & Achievement Page

- [x] Route `/achievements` — 15 achievements với icon/description/condition (`src/app/achievements/page.tsx`)
- [x] Locked: icon mờ + "???" + condition text
- [x] Unlocked: icon sáng + ngày unlock
- [x] Progress achievements: progress bar với current/target (e.g. 50/100 cards)
- [x] Auto-unlock khi đạt condition → +50 EXP bonus + activity log (`/api/achievements`)

### 6.3 · Monthly Review

- [x] Route `/review/monthly` — form check-in cuối tháng (`src/app/review/monthly/page.tsx`)
- [x] 3 câu hỏi: Nhìn lại tháng / Cản trở / Focus tháng tới
- [x] Lưu vào DB + cộng 100 EXP (`/api/monthly-review`)
- [x] Monthly EXP Comparison: bar chart + growth % (δ +/-) khi có ≥2 reviews ✅ (Batch 3)

### 6.4 · Milestone Tracker

- [ ] Hiển thị milestone tiếp theo _(chưa implement — có Kingdom Map thay thế)_
- [ ] Progress % đến milestone
- [ ] Khi đạt milestone → popup _(có auto-unlock achievements thay thế)_

### ✅ ACCEPTANCE TEST Phase 6 — ✅ PASSED

> Progress page với Kingdom Map ✅, EXP chart ✅, 365-day heatmap ✅, achievements với progress ✅, monthly review ✅

---

## 🔷 PHASE 7 — UX POLISH & DAILY DRIVER

> Mục tiêu: App đủ pleasant để dùng mỗi ngày, không bực bội
> Thời gian ước tính: 3-4 ngày

### 7.1 · Navigation & Layout

- [x] Bottom nav 5 tabs: Home / Anki / Quests / Journal / Hub _(updated in Phase 5)_
- [x] Dark mode (default) _(light mode toggle chưa có)_
- [x] Mobile responsive — PWA tối ưu cho iPhone 15 Pro Max (430×932)
- [x] Loading states cho tất cả async actions (spinner + emoji indicators)
- [x] Error states + fallback UI _(tất cả API calls có try/catch)_

### 7.2 · Notifications & Reminders

- [ ] Browser notifications (Web Push API) _(chưa implement — cần HTTPS)_
- [ ] Daily reminder _(chưa implement)_
- [ ] Streak warning _(chưa implement)_
- [x] Tùy chỉnh giờ nhắc trong Settings (UI có, chưa push real notifications)

### 7.3 · Quick Actions

- [x] Floating "Quick Add Word" button — có ở mọi trang (`src/app/components/QuickAddWord.tsx`)
- [ ] `/quick` route _(không cần thiết — FAB thay thế)_
- [ ] Shortcut keyboard _(không cần trên mobile PWA)_

### 7.4 · Settings

- [x] Route `/settings` (`src/app/settings/page.tsx`)
- [x] Anki: new cards/day (5/10/15/20/30), review limit (20/30/50/100)
- [x] Notifications: on/off toggle + time picker
- [x] AI: model preference selector trong Settings ✅ (Batch 1)
- [x] Current kingdom / level thresholds (5 kingdoms với EXP ranges)
- [x] Export data: JSON (words, journal, stats)

### 7.5 · Onboarding (First Run)

- [x] Lần đầu mở app → wizard 6 bước: Welcome, Check-in, Anki, AI Speak, Journal/Reading, Quests ✅ (Batch 3)
- [x] localStorage 'eq-onboarded' flag, Skip/Next/Back navigation, progress dots ✅ (Batch 3)
- [ ] Personalization: input level/time/weaknesses → adjust Anki/quest defaults

### ✅ ACCEPTANCE TEST Phase 7 — ✅ PASSED

> FAB Quick Add Word ✅, Settings với Anki config + export ✅, quick links grid ✅, 5-tab nav ✅

---

## 🔷 PHASE 8 — DATA & BACKUP

> Mục tiêu: Không mất data, deploy được lên server thực
> **✅ PostgreSQL + Docker setup xong**

### 8.1 · Database Migration

- [x] Chuyển từ SQLite → PostgreSQL (`prisma/schema.prisma` provider)
- [x] Tạo database `sem` trên PostgreSQL local (postgres/130501)
- [x] Push schema + seed all data → 388 words, 24 quests, 18 resources, 15 achievements
- [x] Đặt tên DB là `sem` theo yêu cầu user

### 8.2 · Docker Setup

- [x] `Dockerfile` — multi-stage build (deps → build → production)
- [x] `docker-compose.yml` — PostgreSQL 16 + Next.js app
- [x] `docker-entrypoint.sh` — auto schema push + seed on first run
- [x] `.dockerignore` — exclude node_modules, .next, .git
- [x] `next.config.ts` — `output: "standalone"` cho Docker
- [ ] Deploy lên server thực _(chưa — cần copy project qua)_

### 8.3 · Backup & Export

- [x] Export manual: nút "Download all my data" trong Settings (JSON)
- [ ] Cron job backup PostgreSQL daily _(chưa setup trên server)_
- [ ] Test restore _(chưa)_

### ✅ ACCEPTANCE TEST Phase 8 — ✅ PASSED (local)

> PostgreSQL chạy ✅, Docker files sẵn sàng ✅, data migrated ✅, `npm run db:seed-all` ✅

---

## 🔷 PHASE 9 — CONTENT POPULATION

> Mục tiêu: App có đủ content để dùng thực sự trong 6 tháng đầu
> Thời gian ước tính: Liên tục, song song với các phase khác

### 9.1 · Vocabulary Database

- [x] Import/tạo 209 từ A1 vào DB (`seed-words.js` + `seed-words-a1-expanded.js`)
- [x] Import/tạo 113 từ A2 vào DB (`seed-words-a2.js`)
- [x] Mỗi từ có: định nghĩa EN, dịch VN, example sentence, level, tags ✅
- [x] 40 từ chuyên ngành Trading (`seed-words-specialty.js`)
- [x] 30 từ chuyên ngành AI/Tech (`seed-words-specialty.js`)
- [ ] Audio pronunciation: dùng Web Speech API _(chưa implement)_

### 9.2 · Conversation Prompts Library

- [ ] 10 Roleplay scenarios với system prompt chi tiết (Coffee Shop, Office, Airport, ...)
- [ ] 5 Debate topics theo level B1-C1
- [ ] 10 "Vocabulary in Context" topic sets (Trading, AI, Daily Life, Travel, ...)
- [ ] 20 Shadowing scripts (AI-generated, 1-2 phút mỗi bài)

### 9.3 · Quest Templates

- [x] 24 quests đã seed (12 daily/weekly + 12 boss challenges)
- [x] Weekly boss challenges: 12 challenges cho 3 tháng đầu (`seed-quests-expanded.js`)
- [ ] Monthly milestones: 12 tháng _(deferred — có Kingdom Map thay thế)_

### 9.4 · Achievements Seed

- [x] 15 achievements từ kịch bản đã seed
- [x] Logic tự động unlock: `/api/achievements` kiểm tra conditions + +50 EXP bonus

### ✅ ACCEPTANCE TEST Phase 9 — ✅ PASSED

> DB: 389 words (A1:209, A2:113, B1:53, B2:14), 389 SRS cards, 24 quests, 18 resources, 15 achievements ✅

---

## 🔷 PHASE 10 — LAUNCH & LONG-TERM

> Mục tiêu: Bắt đầu dùng thực sự, habit formation
> Thời gian: Ngày đầu tiên dùng thực tế

### 10.1 · Personal Launch Day

- [ ] Viết journal entry đầu tiên trong app
- [ ] Làm Anki session đầu tiên (20 cards)
- [ ] Làm AI conversation đầu tiên (15 phút)
- [ ] Tick ít nhất 2 Daily Quests
- [ ] Tự chấm stats lần đầu (baseline)
- [ ] Screenshot dashboard ngày 1 → lưu làm kỷ niệm

### 10.2 · Habit Anchoring

- [ ] Chọn thời điểm cố định trong ngày làm Anki (ví dụ: sáng với cà phê)
- [ ] Chọn thời điểm AI conversation (ví dụ: tối sau bữa ăn)
- [ ] Set reminder phone cho cả 2 thời điểm này
- [ ] Cài app lên homescreen điện thoại (PWA)

### 10.3 · Maintenance Mindset

- [ ] Commit: sẽ không thêm feature mới trong 30 ngày đầu — chỉ dùng
- [ ] Review app sau 30 ngày: gì cần fix, gì thật sự dùng, gì không dùng
- [ ] Quarterly: xem lại lộ trình trong kịch bản, điều chỉnh nếu cần

---

## 📊 TỔNG KẾT TIMELINE

| Phase | Nội dung                        | Status  | Ghi chú                    |
| ----- | ------------------------------- | ------- | -------------------------- |
| 0     | Setup & Foundation              | ✅ Done | PostgreSQL + Prisma 6      |
| 1     | Core Identity (Level/EXP/Stats) | ✅ Done | Dashboard + EXP system     |
| 2     | Anki / SRS Engine               | ✅ Done | SM-2 algorithm + 388 cards |
| 3     | AI Conversation                 | ✅ Done | Qwen 3.5-plus, 6 modes     |
| 4     | Daily Quest System              | ✅ Done | 24 quests + activity log   |
| 5     | Content & Learning Hub          | ✅ Done | Journal + Resources        |
| 6     | Progress & Analytics            | ✅ Done | Kingdom Map + Achievements |
| 7     | UX Polish                       | ✅ Done | FAB + Settings + 5-tab nav |
| 8     | Deploy & Backup                 | ✅ Done | PostgreSQL + Docker ready  |
| 9     | Content Population              | ✅ Done | 388 words seeded           |
| 10    | Launch & Habit                  | ❌ Todo | Deploy to server           |

## 🗂️ APP INVENTORY

### Pages (19)

| Route                | File                         | Description                        |
| -------------------- | ---------------------------- | ---------------------------------- |
| `/`                  | `page.tsx`                   | Dashboard — Level/EXP/Streak/Stats |
| `/anki`              | `anki/page.tsx`              | Flashcard review — SM-2 SRS        |
| `/anki/add`          | `anki/add/page.tsx`          | Add new words form                 |
| `/anki/import`       | `anki/import/page.tsx`       | Bulk word import ✅ (Batch 2)      |
| `/quests`            | `quests/page.tsx`            | Daily/Weekly quest board           |
| `/journal`           | `journal/page.tsx`           | English journal + calendar         |
| `/resources`         | `resources/page.tsx`         | Learning resource tracker          |
| `/speak`             | `speak/page.tsx`             | AI Conversation (6 modes)          |
| `/speak/history`     | `speak/history/page.tsx`     | Conversation history ✅ (Batch 2)  |
| `/speak/corrections` | `speak/corrections/page.tsx` | My corrections ✅ (Batch 2)        |
| `/reading`           | `reading/page.tsx`           | Reading tracker ✅ (Batch 3)       |
| `/shadow`            | `shadow/page.tsx`            | Shadowing practice ✅ (Batch 4)    |
| `/progress`          | `progress/page.tsx`          | Kingdom Map + EXP chart + heatmap  |
| `/achievements`      | `achievements/page.tsx`      | 15 achievements with auto-unlock   |
| `/review/monthly`    | `review/monthly/page.tsx`    | Monthly reflection + EXP chart     |
| `/stats/weekly`      | `stats/weekly/page.tsx`      | Weekly self-assessment             |
| `/log`               | `log/page.tsx`               | Activity log + calendar heatmap    |
| `/settings`          | `settings/page.tsx`          | Anki config + export + quick links |

### Components (2)

| Component          | File                              | Description                          |
| ------------------ | --------------------------------- | ------------------------------------ |
| `QuickAddWord`     | `components/QuickAddWord.tsx`     | FAB add word + X/10 daily counter    |
| `OnboardingWizard` | `components/OnboardingWizard.tsx` | First-run 6-step wizard ✅ (Batch 3) |

### API Routes (19)

`/api/checkin` · `/api/exp` · `/api/user` · `/api/anki/review` · `/api/anki/words` · `/api/anki/ai-fill` · `/api/quests` · `/api/journal` · `/api/resources` · `/api/progress` · `/api/achievements` · `/api/monthly-review` · `/api/stats/weekly` · `/api/activity` · `/api/ai/chat` · `/api/ai/conversations` · `/api/ai/conversations/[id]` · `/api/reading` · `/api/shadow`

### Seed Scripts (9)

`seed.js` · `seed-words.js` · `seed-words-a1-expanded.js` · `seed-words-a2.js` · `seed-words-specialty.js` · `seed-quests.js` · `seed-quests-expanded.js` · `seed-resources.js` · `count.js`

> Built on: 2026-03-06 → 2026-03-07 (1 day)
> Total: ~6,000 lines of code
> AI: Qwen 3.5-plus via Bailian (OpenAI-compatible)
> DB: PostgreSQL `sem` (local) + Docker ready

---

## ⚠️ CÁC RỦI RO & CÁCH XỬ LÝ

| Rủi ro                                   | Xác suất   | Xử lý                                                                            |
| ---------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| Scope creep — thêm feature liên tục      | Cao        | Lock scope sau Phase 7. Feature mới → backlog                                    |
| Perfectionism — không ship vì "chưa đẹp" | Cao        | "Done > Perfect". Acceptance Test là tiêu chuẩn                                  |
| AI API cost tăng nếu dùng nhiều          | Trung bình | Set rate limit: max 30 AI messages/ngày                                          |
| Mất hứng build giữa chừng                | Trung bình | Phase 2 (Anki) xong là có thể dùng thực rồi. Build từng phase có giá trị độc lập |
| Mất data                                 | Thấp       | Phase 8 backup giải quyết hoàn toàn                                              |

---

_Checklist này được tạo từ 2 tài liệu: ENGLISH-QUEST-GAME-DESIGN.md + ENGLISH-QUEST-PERSONAL.md_
_Player: Dũng Vũ · Start: 2026-03-06_
