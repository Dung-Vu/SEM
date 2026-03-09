# ⚡ PHASE 13 — WOW FRONTEND REDESIGN

> Phase 12 ✅ All Done → Phase 13: Full UI/UX Overhaul — "WOW on first touch"
> Stack: Next.js · TypeScript · Lucide React · CSS Custom Properties · Framer Motion
> **Status: ✅ COMPLETED + POST-AUDIT CLEAN — 2026-03-08**
> **Final: TypeScript 0 errors | Build Exit 0**

---

## 🎯 DESIGN VISION — "DARK FORGE"

Aesthetic: **RPG Command Center** — như một game AAA mobile nhưng clean.
Cảm giác mục tiêu: Mở app → "Ồ, cái này build xịn vãi"

Tham khảo vibe:

- **Arc Browser** — depth, glow, purposeful motion
- **Linear App** — spacing, typography, micro-detail
- **Genshin Impact UI** — RPG atmosphere không lòe loẹt
- **Raycast** — command-driven, snappy, dark + accent

---

## ✅ TRẠNG THÁI HOÀN THÀNH

| #     | Item                        | Nhóm       | Priority | Status  |
| ----- | --------------------------- | ---------- | -------- | ------- |
| 13.1  | Design System Foundation    | Foundation | 🔴 P0    | ✅ Done |
| 13.2  | Icon System Overhaul        | Foundation | 🔴 P0    | ✅ Done |
| 13.3  | Bottom Navigation           | Layout     | 🔴 P0    | ✅ Done |
| 13.4  | Dashboard Redesign          | Page       | 🔴 P0    | ✅ Done |
| 13.5  | Speak Page Redesign         | Page       | 🔴 P0    | ✅ Done |
| 13.6  | Quest Log Redesign          | Page       | 🟡 P1    | ✅ Done |
| 13.7  | Onboarding Redesign         | Page       | 🟡 P1    | ✅ Done |
| 13.8  | Anki Card Redesign          | Page       | 🟡 P1    | ✅ Done |
| 13.9  | Motion & Micro-interactions | Polish     | 🟡 P1    | ✅ Done |
| 13.10 | More Drawer & Navigation    | Layout     | 🟢 P2    | ✅ Done |
| 13.11 | Typography Overhaul         | Foundation | 🟢 P2    | ✅ Done |
| 13.12 | iPhone 15 Pro Max Tuning    | Device     | 🟢 P2    | ✅ Done |
| 13.13 | Light Theme Overhaul        | Theme      | 🟡 P1    | ✅ Done |
| 13.14 | Emoji → Lucide Final Audit  | Polish     | 🔴 P0    | ✅ Done |

---

## 🎨 13.1 — DESIGN SYSTEM FOUNDATION ✅

### Color Palette — "Dark Forge"

```css
:root {
    /* Background layers */
    --bg-void: #060608;
    --bg-base: #0d0d12;
    --bg-surface: #10141c;
    --bg-elevated: #13131a;
    --bg-overlay: #1a1a24;
    --bg-raised: #1c2030;

    /* Brand accents */
    --gold: #f5c842;
    --gold-glow: rgba(245, 200, 66, 0.25);
    --cyan: #00d4ff;
    --cyan-glow: rgba(0, 212, 255, 0.2);
    --violet: #a78bfa;
    --violet-glow: rgba(167, 139, 250, 0.2);
    --emerald: #34d399;
    --ruby: #f87171;
    --amber: #fbbf24;

    /* Text */
    --text-primary: #e8eaf0;
    --text-secondary: #7a8299;
    --text-muted: #4a5068;
    --text-disabled: #2e3248;

    /* Borders */
    --border-subtle: rgba(255, 255, 255, 0.06);
    --border-subtler: rgba(255, 255, 255, 0.04);

    /* Fonts */
    --font-display: "Sora", sans-serif;
    --font-body: "Inter", sans-serif;
    --font-mono: "JetBrains Mono", monospace;
}
```

### Light Theme — "Light Forge" ✅

```css
.light {
    --bg-void: #f0f4ff;
    --bg-base: #ffffff;
    --bg-surface: #f8faff;
    --bg-elevated: #eef2ff;
    --bg-raised: #e8eeff;
    --text-primary: #0f1020;
    --text-secondary: #4a5080;
    --text-muted: #8890b0;
    --border-subtle: rgba(0, 0, 0, 0.08);
    /* Gold/Cyan/Violet giữ nguyên — màu accent không đổi */
}
```

---

## 🎨 13.2 — ICON SYSTEM OVERHAUL ✅

**100% Lucide React** — không còn emoji functional icons. Final mapping:

| Tính năng     | Emoji cũ | Lucide component |
| ------------- | -------- | ---------------- |
| Home          | 🏠       | `Home`           |
| Anki / Study  | 📚       | `BookOpen`       |
| Speak         | 🗣️       | `Mic2`           |
| Quests / Boss | ⚔️       | `Swords`         |
| Progress      | 📊       | `BarChart3`      |
| Journal       | ✍️       | `PenLine`        |
| Shadow        | 🎧       | `Headphones`     |
| Awards        | 🏆       | `Trophy`         |
| Settings      | ⚙️       | `Settings2`      |
| Streak Flame  | 🔥       | `Flame` (filled) |
| EXP / Level   | ⭐/⚡    | `Zap`            |
| Reading       | 📖       | `BookMarked`     |
| Activity Log  | 📜       | `ScrollText`     |
| Collections   | 🔮       | `Compass`        |
| Empty State   | 📭       | `Inbox`          |
| AI Bot        | 🤖       | `Bot`            |
| KT Kingdom    | 🏰       | `Castle`         |
| Forest        | 🌲       | `TreePine`       |
| Crown         | 👑       | `Crown`          |
| Monthly       | 📅       | `CalendarDays`   |
| Skill Speak   | 🗣️       | `Mic2`           |
| Skill Write   | ✍️       | `PenLine`        |
| Skill Listen  | 👂       | `Ear`            |
| Skill Read    | 📖       | `BookMarked`     |
| Skill Grammar | 📐       | `Ruler`          |

**Intentional emojis giữ lại:**

- 😊🤔😤 — difficulty badges (emotional indicators)
- ❤️ — footer branding
- ✨ — EXP particle celebation animation
- 🇬🇧🇻🇳 — language flag indicators (Add Word form)

**Icon sizing tokens:**

```
nav-icon:    24px
card-icon:   20px
inline-icon: 16px
hero-icon:   32px
```

---

## 🎨 13.3 — BOTTOM NAVIGATION ✅

Floating pill navigation với glass morphism:

- Background: `rgba(13,13,18,0.85)` + `blur(20px)`
- Border: `1px solid var(--border-medium)`
- Border-radius: `28px`
- Active state: gold icon + glow + 3px gold dot indicator
- 5 items: Home, Anki, Speak, Quests, More

---

## 🎨 13.4 — DASHBOARD ✅

- **Hero card**: animated gradient, Level badge với glow ring, EXP bar shimmer
- **Streak widget**: `Flame` Lucide icon (filled, colored), số lớn 30px
- **Streak bonus**: text label, không emoji
- **Quick Links**: BarChart3 / Trophy / CalendarDays / ScrollText icons
- **Level-up overlay**: `PartyPopper` Lucide icon, text "Level Up" (không emoji)
- **Streak milestones**: plain text messages (emoji đã xoá)
- **More drawer**: Lucide icons 2×4 grid, accent colors

---

## 🎨 13.5 — SPEAK PAGE ✅

- Mode cards đồng nhất nền dark, chỉ icon đổi màu
- AI response: `Bot` icon thay 🤖
- Error toasts: `⚠️` giữ lại (warning semantics OK)
- End Session button: plain "Ending..." không emoji

---

## 🎨 13.6 — QUEST LOG ✅

- EXP particle animation: `+X EXP ✨` (✨ intentional celebratory)
- Confirmation messages: plain text, không emoji
- Progress ring: circular stroke animation

---

## 🎨 13.7 — ONBOARDING ✅

Full-screen immersive slides:

- Spring physics transition (horizontal)
- "Step X of Y" progress bar ở top
- Gold gradient CTA button
- Staggered fade-in text

---

## 🎨 13.8 — ANKI CARD ✅

- 3D card flip animation (`rotateY(180deg)`)
- Glass card material với noise texture nhẹ
- Rating buttons: Again (red) / Hard (orange) / Good (gold) / Easy (green)
- Session complete screen: `Clock` / `PartyPopper` / `Sparkles` Lucide icons
- Forecast labels: "Tomorrow" / "This Week" (không emoji)
- Empty states: Lucide icons thay emoji

---

## 🎨 13.9 — MOTION & MICRO-INTERACTIONS ✅

Motion tokens:

```
duration-instant: 80ms    → button press
duration-fast:    150ms   → hover state
duration-base:    250ms   → card transition
duration-slow:    400ms   → page transition
duration-crawl:   600ms   → celebration
```

Animations đã implement:

- Page slide-up + fade (`translateY: 20px → 0`)
- EXP particle burst (`+X EXP` flies up, fade out 1.5s)
- Level-up overlay (scale bounce + gold glow)
- Streak flame pulse khi check-in
- Card press: `scale(0.98)` 80ms
- Skeleton shimmer (left → right gradient sweep)

---

## 🎨 13.10 — MORE DRAWER ✅

- 8 items với Lucide icons + accent colors
- Active page: gold icon + gold tint background
- Drawer handle bar
- Press animation: scale(0.96)

---

## 🎨 13.11 — TYPOGRAPHY ✅

```
Display/Heading: "Sora"         — geometric, futuristic
Body:            "Inter"        — readable, clean
Mono/Numbers:    "JetBrains Mono" — EXP, level, stats
```

Loaded via `<link>` in layout.tsx với `fetchpriority="high"`.

---

## 🎨 13.12 — IPHONE 15 PRO MAX TUNING ✅

- Safe area insets: top + bottom padding đầy đủ
- Bottom nav: `64px + safe-area-inset-bottom`
- Content bottom padding: `114px`
- ProMotion: `cubic-bezier(0.16, 1, 0.3, 1)` cho tất cả animations
- `will-change: transform, opacity` cho heavy animations
- Font size ≥ 16px trên inputs (no iOS auto-zoom)

---

## 🎨 13.13 — LIGHT THEME ✅

Light Forge override:

- Cards: white/blue-gray tints
- Borders: `rgba(0,0,0,0.08)`
- Text: `#0F1020` primary, `#4A5080` secondary
- Bottom nav light: white glass
- Buttons restyle cho light mode
- Icon glow đã điều chỉnh cho nền sáng

---

## 🎨 13.14 — EMOJI → LUCIDE FINAL AUDIT ✅

Files đã clean hoàn toàn:

| File                              | Emojis replaced                          |
| --------------------------------- | ---------------------------------------- |
| `page.tsx` (Dashboard)            | 🔥→Flame, 📊🏆📅📜→Lucide, ⚡ removed    |
| `settings/page.tsx`               | KT Kingdom icons, toast messages         |
| `speak/page.tsx`                  | 🤖→Bot, ⏳ removed                       |
| `shadow/page.tsx`                 | ⏳ removed                               |
| `speak/history/page.tsx`          | `Scale`→`Swords` bug fix, 📭→Inbox       |
| `speak/corrections/page.tsx`      | ❌✅💡⏳ → text                          |
| `resources/page.tsx`              | CATEGORIES→Lucide, 📭→Inbox, 🔗→Link2    |
| `reading/page.tsx`                | CATEGORY_CONFIG→Lucide, 📭→Library       |
| `progress/page.tsx`               | KINGDOMS + SKILL_CONFIG→Lucide           |
| `quests/page.tsx`                 | ✅⚔️ → plain text                        |
| `journal/page.tsx`                | header, tabs, buttons, AI, history       |
| `log/page.tsx`                    | SOURCE_CFG 9 icons→Lucide, 📜📭→Lucide   |
| `achievements/page.tsx`           | 🏆📈⚔️→Lucide/text                       |
| `anki/page.tsx`                   | ⏳🎉✨🔮📅🏠➕ → Lucide/text             |
| `anki/add/page.tsx`               | 🤖➕📖💬📊🏷️→text                        |
| `anki/import/page.tsx`            | 📥📋⏳📊❌📚→text                        |
| `speak/corrections/page.tsx`      | ❌✅�→XCircle/CheckCircle2/Lightbulb     |
| `review/monthly/page.tsx`         | ✅ Completed→text                        |
| `stats/weekly/page.tsx`           | ✅ Submitted→text                        |
| `reading/page.tsx`                | ✅ goal→text                             |
| `achievements/page.tsx`           | ✅ UNLOCKED header, ✅ date→CheckCircle2 |
| `settings/page.tsx`               | 🔔❌✅🚫🔕 statusConfig, ✅ toast        |
| `components/OnboardingWizard.tsx` | 🚀→text                                  |
| `anki/add/page.tsx`               | ✅ toast, 🤖➕📖💬📊🏷️→text              |
| `anki/import/page.tsx`            | ✅ toast, 📥📋⏳📊❌→text                |

**Intentional emojis giữ lại (final):**

- 😊🤔😤 — difficulty badges (emotional state)
- ❤️ — Settings footer branding
- ✨ — EXP particle celebration animation
- 🇬🇧🇻🇳 — language flag indicators
- ⚠️ — warning semantics in error messages (accessible)
- `❌/✅` trong regex `/❌(.+?)→✅/` — AI output parser (must keep)
- Emojis trong AI system prompt strings — nội dung gửi cho AI

**TypeScript: 0 errors sau khi hoàn thành**

---

## 🔑 KEY PRINCIPLES

1. **Dark là #060608** — không #000 (harsh) hay #1a1a1a (light)
2. **Gold là màu primary duy nhất** — không pha thêm accent thứ 3, 4
3. **Mỗi card cùng 1 nền** — differentiate bằng icon color
4. **Animation luôn có purpose** — không animate vì đẹp
5. **100% Lucide** — không functional emoji trong UI components
6. **Light theme = đồng nhất** — cùng cấu trúc, đổi bảng màu

---

## 📦 DEPENDENCIES ĐÃ CÀI

```bash
# Đã có sẵn:
lucide-react     ✅
framer-motion    ✅  (animations, spring physics)
next             ✅
typescript       ✅
```

---

_Phase 13: ✅ COMPLETED — 2026-03-08_  
_Player: Dũng Vũ · iPhone 15 Pro Max · Dark Mode · 120Hz ProMotion_
