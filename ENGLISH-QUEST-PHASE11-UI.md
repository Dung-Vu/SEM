# 🎨 PHASE 11 — VISUAL REDESIGN · "Dark RPG Premium"

> Viết tiếp từ ENGLISH-QUEST-CHECKLIST.md (Phase 0-9 ✅ Done)
> Mục tiêu: Biến app từ "functional" → "addictive to look at"
> Stack: Next.js 16 · TailwindCSS · CSS Animations (thay Framer Motion) · Mobile PWA · iPhone 15 Pro Max
> Updated: 2026-03-07
> **Status: Phase 11.0–11.9 COMPLETE ✅ · 11.10 Special Screens COMPLETE ✅**

---

## 🎯 DESIGN DIRECTION

**Aesthetic:** Dark RPG Premium — như một game AAA trên mobile, không phải edu-app

**Không phải:**

- ❌ Generic dark mode với màu gray nhàm
- ❌ Bootstrap/Material clone
- ❌ "Looks like Duolingo but darker"
- ❌ Purple gradient trên white (AI slop)

**Là:**

- ✅ Deep space dark với glow effects tinh tế
- ✅ Gold/Amber cho achievements — cảm giác "earned"
- ✅ Glassmorphism cards có depth thật sự
- ✅ Micro-animations mượt mà, có mục đích
- ✅ Typography mạnh, có cá tính
- ✅ Mỗi trang có visual identity riêng

---

## 🔷 PHASE 11.0 — DESIGN SYSTEM FOUNDATION

> Setup 1 lần, dùng cho toàn app

### 11.0.1 · Font Setup ✅

- [x] Cài Google Fonts trong `app/layout.tsx`:
    ```
    Display font:  "Syne" (weight 700, 800) — cho headings, level, kingdom names
    Body font:     "DM Sans" (weight 400, 500, 600) — cho text, UI
    Mono/Data:     "JetBrains Mono" (weight 400, 600) — cho EXP numbers, stats, codes
    ```
- [x] Cấu hình CSS vars: `--font-display`, `--font-body`, `--font-mono`
- [x] Apply global: `body { font-family: 'DM Sans' }`, headings `font-display`
- [x] Không dùng Inter, Roboto, Arial ở bất cứ đâu

### 11.0.2 · Color Token System

Thêm vào `tailwind.config.ts`:

```ts
colors: {
  // Backgrounds — layered depth
  bg: {
    void:    '#07080D',   // Nền sâu nhất — body background
    base:    '#0D1117',   // Page background
    surface: '#131920',   // Card background
    raised:  '#1A2332',   // Elevated cards, modals
    overlay: '#202D3D',   // Hover states, active items
  },

  // Gold system — EXP, achievements, level
  gold: {
    dim:     '#6B5A2A',
    muted:   '#C49A2A',
    DEFAULT: '#F5C842',
    bright:  '#FFE066',
    glow:    '#FFD700',
  },

  // Cyan — actions, links, interactive
  cyan: {
    dim:     '#0A3040',
    muted:   '#0E7490',
    DEFAULT: '#22D3EE',
    bright:  '#67E8F9',
    glow:    '#A5F3FC',
  },

  // Emerald — success, correct, done
  emerald: {
    dim:     '#052E16',
    muted:   '#059669',
    DEFAULT: '#34D399',
    bright:  '#6EE7B7',
  },

  // Ruby — errors, streak danger, wrong
  ruby: {
    dim:     '#300A0A',
    muted:   '#DC2626',
    DEFAULT: '#F87171',
    bright:  '#FCA5A5',
  },

  // Violet — AI features, speaking, magic
  violet: {
    dim:     '#1E0A3C',
    muted:   '#7C3AED',
    DEFAULT: '#A78BFA',
    bright:  '#C4B5FD',
  },

  // Text hierarchy
  text: {
    primary:   '#F0F4F8',
    secondary: '#8B9EB7',
    muted:     '#4A5A6E',
    disabled:  '#2A3444',
  },
}
```

### 11.0.3 · Global CSS Variables & Effects

Thêm vào `app/globals.css`:

```css
/* Noise texture overlay — subtle grain on backgrounds */
body::before {
    content: "";
    position: fixed;
    inset: 0;
    z-index: 0;
    opacity: 0.025;
    background-image: url("data:image/svg+xml,..."); /* SVG noise */
    pointer-events: none;
}

/* Gold glow utility */
.glow-gold {
    box-shadow:
        0 0 20px rgba(245, 200, 66, 0.15),
        0 0 60px rgba(245, 200, 66, 0.05);
}
.glow-cyan {
    box-shadow:
        0 0 20px rgba(34, 211, 238, 0.15),
        0 0 60px rgba(34, 211, 238, 0.05);
}
.glow-text-gold {
    text-shadow: 0 0 20px rgba(245, 200, 66, 0.5);
}

/* Glass card */
.glass {
    background: rgba(19, 25, 32, 0.7);
    backdrop-filter: blur(16px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.06);
}

/* Gradient border trick */
.border-gradient-gold {
    border: 1px solid transparent;
    background-clip: padding-box;
    background-image:
        linear-gradient(#131920, #131920),
        linear-gradient(135deg, #f5c842 0%, transparent 50%);
    background-origin: border-box;
}

/* EXP bar shimmer animation */
@keyframes shimmer {
    0% {
        background-position: -200% center;
    }
    100% {
        background-position: 200% center;
    }
}
.exp-bar-fill {
    background: linear-gradient(
        90deg,
        #c49a2a 0%,
        #f5c842 40%,
        #ffe066 50%,
        #f5c842 60%,
        #c49a2a 100%
    );
    background-size: 200% auto;
    animation: shimmer 3s linear infinite;
}
```

### 11.0.4 · CSS Animation Setup ✅ (không dùng Framer Motion — tránh bundle bloat)

- [x] CSS keyframes: `shimmer`, `goldPulse`, `floatUpFade`, `fadeIn`, `fadeInUp`, `scaleIn`, `slideUp`
- [x] Stagger utility classes: `.stagger-1` → `.stagger-6` (animation-delay 0.05s → 0.3s)
- [x] Class `.animate-fade-in-up`, `.animate-scale-in` áp dụng trên mọi page
- [x] Không cần `PageTransition` wrapper riêng — mỗi page tự animate elements

### ✅ ACCEPTANCE TEST Phase 11.0

> Fonts load đúng (verify bằng DevTools), color tokens available trong Tailwind, globals.css applied

---

## 🔷 PHASE 11.1 — BOTTOM NAV REDESIGN

> Component được nhìn nhiều nhất — phải perfect

### 11.1.1 · Structure ✅

File: `src/components/AppShell.tsx`

- [x] 5 tabs: **Home** / **Anki** / **Speak** / **Quests** / **More**
    - "More" → slide-up drawer với: Progress, Awards, Journal, Reading, Shadow, Hub, Activity, Settings
- [x] Tab active: icon + label hiển thị, gold color
- [x] Active indicator: gold dot dưới icon

### 11.1.2 · Visual Design ✅

- [x] Background: glass với blur effect
- [x] Border top: `1px solid rgba(255,255,255,0.05)`
- [x] Padding bottom: safe area inset (iPhone notch/home bar)
- [x] Active icon: màu gold + dot glow
- [x] Inactive icon: màu text-muted
- [x] Tab press: CSS active scale
- [x] Active dot indicator: 4px circle, gold

### 11.1.3 · "More" Drawer ✅

- [x] Slide up từ bottom
- [x] Backdrop: dark overlay với click-to-close
- [x] Handle bar ở top
- [x] Grid 4×2 với icon buttons cho 8 trang phụ
- [x] Tap mục → navigate + đóng drawer

### ✅ ACCEPTANCE TEST Phase 11.1

> Nav đẹp với glass effect, active state có glow, press có spring animation, More drawer smooth

---

## 🔷 PHASE 11.2 — DASHBOARD REDESIGN

> Trang mở app đầu tiên — phải "wow" ngay lập tức

File: `src/app/page.tsx`

### 11.2.1 · Header Section

- [x] Full-width hero area, không phải navbar
- [x] Background: radial gradient glow ở góc trên phải (gold/amber subtle)
- [x] Avatar placeholder: 72px hexagon shape với `gold` border gradient, animated pulse
- [x] Username: font Syne 700, `text-text-primary`
- [x] Kingdom badge: pill shape với icon + tên kingdom, border-gradient-gold, nhỏ gọn

### 11.2.2 · Level & EXP Block

- [x] Level number: Syne 800, size 4xl, `text-gold glow-text-gold`
- [x] "LEVEL" label: uppercase tracking-widest, `text-text-muted`, size xs
- [x] EXP bar: full width, height 8px, rounded-full
    - Background: `bg-bg-raised`
    - Fill: `exp-bar-fill` (shimmer animation)
    - Glow: `box-shadow: 0 0 8px rgba(245,200,66,0.4)`
- [x] EXP text: `X / Y EXP` với JetBrains Mono
- [x] Streak badge: 🔥 icon + số ngày, pill shape `bg-ruby-dim border border-ruby-muted`
    - Khi streak ≥ 7: border đổi sang gold + glow

### 11.2.3 · Stats Block

- [x] 5 stats layout: horizontal scroll hoặc 2-col grid
- [x] Mỗi stat: icon + label + bar + số điểm
- [x] Màu bar theo stat:
    - Vocab → cyan / Grammar → violet / Listening → emerald / Speaking → gold / Writing → ruby
- [x] Stats bars: height 4px, animated fill khi page load (left → right, 0.8s, stagger 0.1s)

### 11.2.4 · Check-in Button

- [x] Size: large full-width button, height 56px
- [x] Màu: gold gradient background `from-gold-muted to-gold-DEFAULT`
- [x] Text: "⚔️ Check In Today" Syne 700
- [x] Glow: `glow-gold` + subtle pulse khi chưa check-in hôm nay
- [x] Sau khi check-in: disabled state, text → "✅ Checked In", màu emerald
- [x] Tap animation: scale 0.96 → 1.0 spring + confetti particles (canvas 5 particles)

### 11.2.5 · Quick Actions Grid

- [x] 2×2 grid: Anki / Speak / Quests / Journal
- [x] Mỗi card: `glass` background + gradient border theo màu đặc trưng
    - Anki → cyan border / Speak → violet border / Quests → gold border / Journal → emerald border
- [x] Icon: 32px, màu matching
- [x] Label: DM Sans 500
- [x] Count badge nhỏ: "X due today" cho Anki, "X quests" cho Quests
- [x] Hover/press: scale 0.97, overlay sáng nhẹ

### ✅ ACCEPTANCE TEST Phase 11.2 — **DONE**

> Mở app: thấy gold glow ở header, EXP bar shimmer, check-in button glow, quick cards đẹp

---

## 🔷 PHASE 11.3 — ANKI FLASHCARD REDESIGN

> Trải nghiệm chính — dùng nhiều nhất — phải satisfying mỗi swipe

File: `src/app/anki/page.tsx`

### 11.3.1 · Card Design

- [x] Card size: chiếm 60% viewport height, full-width với margin 16px
- [x] Card background: `glass` với gradient cạnh bên trái (3px, màu theo level: A1=cyan, A2=emerald, B1=gold, B2=violet)
- [x] Card flip: 3D flip animation (rotateY 180deg, Framer Motion `animate`)
    - Front face: tiếng Anh, center-aligned, Syne 700 size 2xl
    - Back face: dịch + định nghĩa + example
- [x] Level badge (A1/A2/B1...): top-right corner, pill, màu theo level

### 11.3.2 · Progress Area

- [x] Top bar: "Card X / Y" — JetBrains Mono + progress bar mỏng 2px (cyan fill, full width)
- [x] Bên cạnh: streak indicator nhỏ "🔥 5 correct in a row"

### 11.3.3 · Answer Buttons

- [x] Layout: 4 buttons horizontal, equal width
- [x] Design: tall buttons 56px với icon + label + next interval
    ```
    🔴 Again     🟡 Hard     🟢 Good     🔵 Easy
    "1d"        "3d"        "7d"        "14d"
    ```
- [x] Màu: mỗi button có border + background tương ứng:
    - Again: ruby border, ruby-dim bg
    - Hard: amber border, amber-dim bg
    - Good: emerald border, emerald-dim bg
    - Easy: cyan border, cyan-dim bg
- [x] Press: scale spring + màu fill nhanh
- [x] Sau khi chọn: button được chọn "flash" full color → next card slide in từ bên phải

### 11.3.4 · Session Complete Screen

- [x] Full-page celebration layout
- [x] Large EXP earned: Syne 800 size 5xl, gold color, glow-text-gold
- [x] Animated số EXP count up (0 → X trong 1.5s)
- [x] Stats row: Correct / Hard / Wrong với icons + số
- [x] Word counts: New → Learning → Review → Mastered (4 pills)
- [x] "🔮 Tomorrow: X cards · 📅 This week: Y cards" forecast
- [x] Background: subtle particle float animation (10-15 gold dots)

### ✅ ACCEPTANCE TEST Phase 11.3 — **DONE**

> Card flip smooth, progress bar update ngay, 4 answer buttons đẹp rõ ràng, complete screen satisfying

---

## 🔷 PHASE 11.4 — AI CONVERSATION REDESIGN

> Feature độc đáo nhất — phải feel premium, không giống ChatGPT clone

File: `src/app/speak/page.tsx`

### 11.4.1 · Mode Selection Screen

- [x] Grid 2×3 của 6 modes (thêm modes tới 10 → scroll vertical)
- [x] Mỗi mode card: `glass`, height 120px, centered
    - Icon: 40px emoji
    - Title: DM Sans 600
    - Level badge: nhỏ, màu level
    - Hover: scale 1.02, border glow theo màu
- [x] Mode màu riêng:
    - Free Talk → cyan / Coffee Shop → emerald / Office → gold
    - Airport → violet / Debate → ruby / Vocab Quiz → amber

### 11.4.2 · Chat Interface

- [x] Header: mode name + timer
    - Timer: JetBrains Mono, `text-gold` khi đang chạy
    - Glow nhẹ khi timer > 5 phút (milestone color change)
- [x] Messages area: scroll, padding bottom 80px (clearance cho input)
- [x] User bubble: right-aligned
    - Background: `bg-cyan-dim border border-cyan/20`
    - Max-width 75%, border-radius 18px 18px 4px 18px
- [x] AI bubble: left-aligned
    - Background: `glass`
    - Max-width 82%, border-radius 18px 18px 18px 4px
    - AI avatar: 28px circle với violet gradient, "Q" letter (Qwen)
- [x] Typing indicator: 3 animated dots (bounce stagger), trong AI bubble mờ
- [x] Correction block (❌→✅): riêng biệt
    - Background: `bg-violet-dim border border-violet/30`
    - Border-left: 3px solid violet
    - ❌ text: `line-through text-ruby` / ✅ text: `text-emerald font-medium` / explanation: `text-violet-bright italic text-sm`

### 11.4.3 · Input Area

- [x] Sticky bottom, `glass` background
- [x] Input: textarea auto-resize (1→4 lines)
    - Background: `bg-bg-raised border border-text-disabled/30`
    - Focus: `border-cyan/50 glow-cyan` (subtle)
- [x] Send button: 44px circle, cyan gradient, arrow icon
    - Disabled (empty): muted / Active: cyan glow
    - Press: scale 0.9 spring
- [x] End Session button: text-only, `text-ruby-muted`, top-right

### 11.4.4 · Session Summary Screen

- [x] Full-screen overlay, slide up animation
- [x] EXP earned: count-up animation, gold large
- [x] Summary sections với collapsible panels:
    - "💪 Strengths" → emerald accent
    - "📈 Areas to improve" → gold accent
    - "📚 Words to learn" → cyan accent (có nút "+ Add to Anki" mỗi từ)
- [x] Close → return to mode selection với smooth transition

### ✅ ACCEPTANCE TEST Phase 11.4

> Mode cards đẹp, chat bubbles phân biệt rõ, corrections highlight đẹp, summary screen smooth

---

## 🔷 PHASE 11.5 — QUEST BOARD REDESIGN

> Gamification core — phải feel như mở quest log trong RPG

File: `src/app/quests/page.tsx`

### 11.5.1 · Page Header

- [x] Title "QUEST LOG" — Syne 800, uppercase, letter-spacing wide
- [x] Date badge: ngày hôm nay + "Day X of streak"
- [x] Overall progress: circle progress ring (SVG) — percentage quests done
    - Ring: cyan stroke, track: `bg-bg-raised`
    - Center: số % lớn (Syne 700) + "completed"

### 11.5.2 · Quest Section Headers

- [x] ⚔️ MAIN QUESTS — section header với gold accent line bên trái
- [x] 🗡️ SIDE QUESTS — cyan accent
- [x] 👑 WEEKLY CHALLENGE — violet accent (Chủ nhật) / grayed out (ngày khác)
- [x] Section header font: Syne 700 uppercase tracking-widest, smaller size

### 11.5.3 · Quest Card Design

- [x] Card: `glass` background, border: `1px solid rgba(255,255,255,0.05)`
- [x] Layout: checkbox (left) + icon + tên + description (flex-1) + EXP badge (right)
- [x] EXP badge: pill `bg-gold-dim text-gold border border-gold/30` + "+X EXP"
- [x] Incomplete → completed transition:
    - Checkbox: empty circle → filled gold checkmark (scale spring animation)
    - Card: `opacity-60 + line-through` cho quest name
    - Left border: `transparent` → `gold-DEFAULT` (3px border-left)
- [x] Press area: full card tappable, scale 0.98 feedback

### 11.5.4 · Confirm Dialog

- [x] Bottom sheet modal (không phải popup giữa màn)
- [x] Handle bar + quest name lớn + "Have you actually done this?" text
- [x] 2 buttons: ✅ Confirm (emerald) · ✗ Cancel (text-only)
- [x] Spring animation vào/ra

### ✅ ACCEPTANCE TEST Phase 11.5

> Quest log feel RPG-ish, circular progress ring update, quest complete animation satisfying, confirm sheet smooth

---

## 🔷 PHASE 11.6 — JOURNAL REDESIGN

> Creative/reflective space — nên feel calmer, focused

File: `src/app/journal/page.tsx`

### 11.6.1 · Writing Area

- [x] Full-screen writing mode khi focus vào textarea
    - Bottom nav ẩn đi, chỉ còn editor + toolbar
    - Background: tối hơn 1 shade, tập trung vào text
- [x] Textarea: full-width, min-height 200px, no border — just background
    - Font: DM Sans 400, size 16px (không nhỏ hơn — tránh zoom iPhone)
    - Placeholder: italic, `text-text-muted`
    - Line-height: 1.8 (dễ đọc)
- [x] Word count: `text-text-muted text-sm` — float bottom-right của textarea
- [x] Difficulty selector: 3 pills Easy/Medium/Hard (không phải dropdown)
    - Active: filled màu tương ứng (emerald/gold/ruby)

### 11.6.2 · AI Feedback Display

- [x] Feedback container: `glass border border-violet/20`
- [x] Header: "🤖 AI Feedback" + level badge được AI rate (e.g. "B1")
- [x] Sections:
    - ✅ Good → emerald text
    - ❌ Corrections → bảng nhỏ: Original | Corrected | Explanation
    - 💡 Suggestions → violet text, bullet list
- [x] Corrections table: striped rows, nhỏ gọn, font mono cho original/corrected
- [x] "Add correction to Anki" button nhỏ bên mỗi correction

### 11.6.3 · Calendar Strip

- [x] Horizontal scroll, 30 ngày
- [x] Mỗi ngày: 32px circle
    - No journal: `bg-bg-raised text-text-muted`
    - Has journal: `bg-emerald-dim text-emerald border border-emerald/30`
    - Today: gold border
- [x] Tap ngày → load journal entry của ngày đó (read-only view)

### ✅ ACCEPTANCE TEST Phase 11.6

> Writing mode focus clean, AI feedback sections clear, calendar strip smooth scroll

---

## 🔷 PHASE 11.7 — PROGRESS PAGE REDESIGN

> Phải cho Dũng cảm giác "wow mình đã đi được xa thế này"

File: `src/app/progress/page.tsx`

### 11.7.1 · Kingdom Map

- [x] Vertical "path" visual — không phải list text nữa
- [x] 5 nodes trên đường path, connected bằng dashed line
- [x] Current kingdom: pulsing gold ring + "YOU ARE HERE" label
- [x] Completed kingdoms: filled, gold checkmark
- [x] Future kingdoms: muted, locked icon
- [x] Node hover: tooltip với EXP range + description
- [x] Path line: animated dash flow (CSS animation) từ start → current node

### 11.7.2 · Stats Radar

- [x] SVG radar chart (hoặc Recharts RadarChart) — 5 skills
- [x] Fill: cyan với opacity 0.2 + cyan border
- [x] Grid lines: subtle `rgba(255,255,255,0.05)`
- [x] Labels: 5 skill names ở các góc
- [x] Animation: scale from center khi page load

### 11.7.3 · EXP History Chart

- [x] Recharts BarChart, 12 tuần
- [x] Bar fill: gold gradient (bottom → top)
- [x] Current week bar: brighter gold + glow
- [x] Tooltip: `glass` style, custom component
- [x] X axis: "W1", "W2"... JetBrains Mono
- [x] Animate bars vào từ bottom (custom animation)

### 11.7.4 · Activity Heatmap

- [x] 365 ngày, 7 rows × 52 columns
- [x] 5 màu levels:
    - 0 days: `bg-bg-raised` (gần như invisible)
    - Level 1-4: `bg-cyan-dim/30` → `bg-cyan-dim/60` → `bg-cyan/40` → `bg-cyan` (full)
- [x] Hover: tooltip "March 6 · +230 EXP"
- [x] Month labels bên trên
- [x] Tháng hiện tại scroll vào view tự động

### 11.7.5 · "Since You Started" Stats

- [x] 4 large number cards (2×2 grid)
- [x] Mỗi card: `glass`, số lớn (Syne 800 3xl), label dưới
    - 📅 Days Active / ⚡ Total EXP / 📚 Words Learned / 🔥 Best Streak
- [x] Số animate count-up khi scroll vào view (Intersection Observer)

### ✅ ACCEPTANCE TEST Phase 11.7

> Kingdom path visual clear, radar chart đẹp, heatmap 365 days render đúng, count-up animation

---

## 🔷 PHASE 11.8 — ACHIEVEMENTS REDESIGN

> Mỗi achievement phải feel "earned"

File: `src/app/achievements/page.tsx`

### 11.8.1 · Achievement Card

- [x] Grid 2 columns
- [x] Locked card: icon mờ 30% opacity, blurred slightly, "???" text, muted border
- [x] Unlocked card: `glass`, gold border gradient, icon sáng full, ngày unlock nhỏ
- [x] In-progress card: progress bar dưới icon + "X / Y"
- [x] Unlock animation (khi vừa unlock):
    - Golden flash overlay → scale 1.1 → 1.0 → glow settle
    - Confetti particles từ card (canvas)

### 11.8.2 · Page Header

- [x] "X / 15 Unlocked" counter lớn
- [x] Progress ring cho overall completion
- [x] Recent unlock badge nếu có unlock trong 7 ngày gần nhất: "🏆 New: [achievement name]"

### ✅ ACCEPTANCE TEST Phase 11.8

> Locked vs unlocked visual rõ ràng, progress badges dễ đọc, unlock animation đẹp

---

## 🔷 PHASE 11.9 — MICRO-INTERACTIONS & POLISH

> 100 chi tiết nhỏ tạo nên cảm giác premium

### 11.9.1 · Page Transitions

- [x] Tất cả pages wrap trong `<PageTransition>` component
- [x] Enter: `fadeUp` — opacity 0→1, y 16→0, duration 0.25s ease-out
- [x] Bottom nav taps: thêm subtle haptic feedback (Web Vibration API, 10ms)

### 11.9.2 · Loading States

- [x] Skeleton loading cho mọi content block (không phải spinner)
    - Skeleton: `bg-bg-raised` với shimmer animation (gradient sweep)
    - Shape khớp với content sẽ load (card-shaped, text-line-shaped)
- [x] API fetch states: không dùng loading text — dùng skeleton

### 11.9.3 · Toast Notifications

- [x] Custom toast system (không dùng thư viện mặc định xấu)
- [x] Position: top-center, dưới status bar iPhone
- [x] Design: `glass border border-emerald/30 text-emerald` cho success
    - Error: ruby border / Info: cyan border / EXP: gold border
- [x] Enter: slide down + fade in / Exit: slide up + fade out
- [x] Icon: emoji phù hợp + text ngắn
- [x] Auto-dismiss 2.5s, tap để dismiss sớm

### 11.9.4 · EXP Gain Animation

- [x] Mỗi khi EXP được cộng: floating "+X EXP" text xuất hiện từ điểm trigger
    - Float up 40px → fade out, duration 1.2s
    - Màu gold, Syne 700
    - Ví dụ: tap "✅ Check In" → "+10 EXP" float lên từ button đó

### 11.9.5 · Empty States

- [x] Mỗi trang có custom empty state khi no data
- [x] Không dùng "No data found" text thô
- [x] Format: large emoji + heading + sub-text + CTA button
    - Anki no cards: "🎉 All caught up! · No cards due today · [Browse Words]"
    - Journal no entries: "📝 Start your first entry · Track your journey · [Write Now]"
    - Quests all done: "⚔️ Quest Complete! · All done for today · Come back tomorrow"

### 11.9.6 · Number Formatting

- [x] EXP numbers: dùng `toLocaleString()` — "12,450 EXP" không phải "12450"
- [x] Tất cả số đều dùng JetBrains Mono
- [x] Streak: nếu 0 → hiển thị "Start your streak!" thay vì "0 days"

### 11.9.7 · iOS-Specific Polish

- [x] `safe-area-inset` padding cho bottom nav và header
- [x] `-webkit-tap-highlight-color: transparent` — bỏ flash xanh khi tap
- [x] `touch-action: manipulation` — loại bỏ 300ms delay
- [x] Scroll: `scroll-behavior: smooth`, `-webkit-overflow-scrolling: touch`
- [x] PWA splash screen: dark background + app icon (update `manifest.json`)
- [x] Status bar: `theme-color: #07080D` trong `<head>`

### ✅ ACCEPTANCE TEST Phase 11.9

> Page transitions smooth, skeletons thay spinner, toast đẹp, EXP float animation, iOS không có tap lag

---

## 🔷 PHASE 11.10 — SPECIAL SCREENS ✅

### 11.10.1 · Level Up Celebration ✅

File: `src/app/special-screens/page.tsx` — `LevelUpOverlay` component

- [x] Full-screen overlay (fixed, z-index 999)
- [x] Background: rgba(7,8,13,0.96) + backdrop blur
- [x] 16 floating gold particles (CSS keyframe animation)
- [x] Center: old level (mờ) → new level (gold 80px, glow)
- [x] Kingdom name mới nếu có (gold-bright, with glow)
- [x] Text: "YOU HAVE LEVELED UP" — Syne 800 uppercase
- [x] +EXP count-up animation (0 → X trong 1.2s)
- [x] Tap to dismiss (onClick)
- [x] Auto-dismiss sau 5s

### 11.10.2 · Streak Milestones ✅

File: `src/app/special-screens/page.tsx` — `StreakMilestone` component

- [x] 5 milestone themes: 7=cyan / 14=gold / 30=violet / 60=ruby / 100=gold-bright
- [x] Streak number: 96px Syne 800, center screen, themed color + glow
- [x] Flame emoji: goldPulse animation
- [x] "X DAY STREAK" text bên dưới với milestone label ("ONE WEEK MILESTONE 🏆")
- [x] Tap to dismiss + auto-dismiss sau 5s
- [x] Demo có thể truy cập tại `/special-screens`

### 11.10.3 · Onboarding

File: `src/components/OnboardingWizard.tsx` — existing, partially themed

- [x] Update styles để match design tokens mới (gold/cyan thay indigo)

### ✅ ACCEPTANCE TEST Phase 11.10 — **MOSTLY DONE**

> Level up screen epic ✅, streak screen theo màu milestone ✅, onboarding cần update tokens

---

## 📊 PHASE 11 — TIMELINE & EFFORT

| Sub-phase | Tên                | Độ khó   | Ước tính     |
| --------- | ------------------ | -------- | ------------ |
| 11.0      | Design System      | ⭐⭐     | 1 ngày       |
| 11.1      | Bottom Nav         | ⭐⭐     | 0.5 ngày     |
| 11.2      | Dashboard          | ⭐⭐⭐   | 1.5 ngày     |
| 11.3      | Anki Cards         | ⭐⭐⭐   | 1.5 ngày     |
| 11.4      | AI Conversation    | ⭐⭐⭐⭐ | 2 ngày       |
| 11.5      | Quest Board        | ⭐⭐     | 1 ngày       |
| 11.6      | Journal            | ⭐⭐     | 1 ngày       |
| 11.7      | Progress           | ⭐⭐⭐⭐ | 2 ngày       |
| 11.8      | Achievements       | ⭐⭐     | 0.5 ngày     |
| 11.9      | Micro-interactions | ⭐⭐⭐   | 1.5 ngày     |
| 11.10     | Special screens    | ⭐⭐⭐   | 1 ngày       |
| **TOTAL** |                    |          | **~14 ngày** |

---

## 🎯 THỨ TỰ LÀM KHUYÊN DÙNG

```
Ngày 1:      11.0 Design System → 11.1 Nav     (foundation trước)
Ngày 2-3:    11.2 Dashboard                    (trang nhìn nhiều nhất)
Ngày 4-5:    11.3 Anki                         (dùng nhiều nhất)
Ngày 6-7:    11.4 AI Conversation              (feature star)
Ngày 8:      11.5 Quests + 11.6 Journal        (đơn giản hơn)
Ngày 9-10:   11.7 Progress                     (charts phức tạp)
Ngày 11:     11.8 Achievements + 11.10 Special (finisher)
Ngày 12-14:  11.9 Polish toàn bộ               (pass qua mọi trang, fix nhỏ)
```

---

## ⚠️ NGUYÊN TẮC TRONG QUÁ TRÌNH REDESIGN

1. **Một page một lúc** — đừng global refactor, dễ break
2. **Mobile-first** — test trên iPhone simulator sau mỗi component
3. **Design System trước** — 11.0 phải xong trước khi làm bất cứ page nào
4. **Performance** — Framer Motion dùng đúng (`animate` thay `style`), tránh layout thrash
5. **Không xóa functionality** — chỉ thay đổi UI layer, logic API không đổi

---

_Phase 11 viết tiếp từ ENGLISH-QUEST-CHECKLIST.md (Phase 0-9 ✅ All Done)_
_Player: Dũng Vũ · Phase 11 Start: 2026-03-07_
