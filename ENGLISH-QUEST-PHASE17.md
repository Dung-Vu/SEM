# ⚡ PHASE 17 — PERFORMANCE & UX MAGIC

> Phase 16 ✅ All Done → Phase 17: Zero Wait Feel — "App này nhanh vãi"
> Stack: Next.js · React · Framer Motion · TanStack Query · Service Worker
> Updated: 2026-03-09

---

## 🎯 VISION

**Codename: PHANTOM**

Mục tiêu: User không bao giờ cảm thấy chờ đợi — dù data chưa load xong.
Không phải làm app nhanh hơn (đó là bonus).
Mà là làm user **cảm thấy** app nhanh hơn thực tế.

> "Duolingo mất 2s load. SEM cũng mất 2s — nhưng user không biết."

### 2 Loại Performance cần phân biệt

| | Real Performance | Perceived Performance |
|---|---|---|
| **Là gì** | Thời gian thật (ms) | Cảm giác của user |
| **Tool đo** | Lighthouse, WebVitals | User feedback |
| **Phase 17 focus** | 40% | 60% |

---

## 📋 TỔNG QUAN

| #    | Item                          | Nhóm              | Priority |
| ---- | ----------------------------- | ----------------- | -------- |
| 17.1 | Skeleton Screen System        | Perceived Perf    | 🔴 P0   |
| 17.2 | Optimistic UI Updates         | Perceived Perf    | 🔴 P0   |
| 17.3 | Instant Navigation (Prefetch) | Real + Perceived  | 🔴 P0   |
| 17.4 | Smart Data Caching            | Real Perf         | 🔴 P0   |
| 17.5 | Progressive Loading           | Perceived Perf    | 🔴 P0   |
| 17.6 | Loading State Magic           | Perceived Perf    | 🟡 P1   |
| 17.7 | Micro-animation Polish        | UX Delight        | 🟡 P1   |
| 17.8 | Haptic Feedback               | UX Delight        | 🟡 P1   |
| 17.9 | Error State UX                | UX Polish         | 🟡 P1   |
| 17.10| Image & Asset Optimization    | Real Perf         | 🟢 P2   |
| 17.11| PWA Offline Layer             | Real Perf         | 🟢 P2   |
| 17.12| Performance Monitoring        | Observability     | 🟢 P2   |

---

## 🔴 17.1 — SKELETON SCREEN SYSTEM

### Concept
Không dùng spinner. **Không bao giờ dùng spinner.**
Thay bằng skeleton — placeholder có đúng shape của content thật.
User thấy layout ngay → não không nhận ra đang loading.

### Skeleton Design Rules
```
1. Match exact layout của real content
2. Shimmer animation: left → right, 1.5s, subtle
3. Màu: var(--bg-elevated) → var(--bg-overlay) gradient
4. Không có border-radius khác với real component
5. Animate ngay — không delay
```

### Base Skeleton Component

```tsx
// src/components/ui/Skeleton.tsx

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-[var(--bg-elevated)]",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-transparent",
        "before:via-white/5 before:to-transparent",
        "before:animate-shimmer",
        className
      )}
    />
  );
}

// CSS:
// @keyframes shimmer {
//   0%   { transform: translateX(-100%) }
//   100% { transform: translateX(100%) }
// }
// .animate-shimmer { animation: shimmer 1.5s infinite }
```

### Skeleton cho từng page

```tsx
// Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Hero card */}
      <Skeleton className="h-40 w-full rounded-2xl" />
      {/* Streak widget */}
      <Skeleton className="h-20 w-full rounded-xl" />
      {/* Skill stats */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />  {/* title */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3 flex-1 rounded-full" />
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>
      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  );
}

// Anki Card Skeleton
export function AnkiSkeleton() {
  return (
    <div className="flex flex-col items-center p-6 space-y-6">
      <Skeleton className="h-64 w-full rounded-2xl" />  {/* card */}
      <Skeleton className="h-4 w-32" />                 {/* progress */}
      <div className="grid grid-cols-4 gap-2 w-full">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// Speak Mode Cards Skeleton
export function SpeakSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <Skeleton className="h-6 w-40" />    {/* title */}
      <Skeleton className="h-4 w-56" />    {/* subtitle */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// Quest List Skeleton
export function QuestSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-28 w-full rounded-2xl" />  {/* header */}
      <Skeleton className="h-5 w-32" />                  {/* section title */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// Analytics Skeleton
export function AnalyticsSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-20 w-full rounded-xl" />   {/* insight banner */}
      <Skeleton className="h-56 w-full rounded-xl" />   {/* radar chart */}
      <Skeleton className="h-32 w-full rounded-xl" />   {/* heatmap */}
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}
```

---

## 🔴 17.2 — OPTIMISTIC UI UPDATES

### Concept
Khi user làm action → UI cập nhật **ngay lập tức** không chờ API.
Nếu API fail → rollback về state cũ + show error.
User cảm thấy app "instant" dù thật ra đang gọi API.

### Key Actions cần Optimistic

```typescript
// 1. QUEST COMPLETE — quan trọng nhất
// User tick quest → EXP tăng ngay, quest grayout ngay
// Không chờ POST /api/quests

function useCompleteQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questId: string) => completeQuestAPI(questId),

    // Optimistic: cập nhật UI ngay
    onMutate: async (questId) => {
      await queryClient.cancelQueries({ queryKey: ['quests'] });
      const prev = queryClient.getQueryData(['quests']);

      queryClient.setQueryData(['quests'], (old: Quest[]) =>
        old.map(q => q.id === questId
          ? { ...q, completed: true }
          : q
        )
      );

      // Trigger EXP animation ngay
      triggerExpGain(getQuestExp(questId));

      return { prev }; // snapshot để rollback
    },

    // Nếu fail → rollback
    onError: (err, questId, ctx) => {
      queryClient.setQueryData(['quests'], ctx.prev);
      showToast('Có lỗi xảy ra, thử lại nhé');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
    }
  });
}

// 2. DAILY CHECK-IN
// Streak tăng ngay khi tap

// 3. ANKI CARD RATING
// Rating badge hiện ngay, next card flip ngay
// Không chờ save API

// 4. JOURNAL SAVE
// "Saved ✓" hiện ngay (optimistic)
// Auto-save mỗi 3s không block UI

// 5. SETTINGS TOGGLE
// Toggle bật ngay, sync background
```

### Optimistic Pattern Template

```typescript
// Pattern tái sử dụng cho tất cả optimistic mutations

function createOptimisticMutation<T>(
  queryKey: string[],
  mutationFn: (data: T) => Promise<any>,
  updateFn: (old: any, data: T) => any
) {
  return useMutation({
    mutationFn,
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) => updateFn(old, data));
      return { prev };
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(queryKey, ctx?.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });
}
```

---

## 🔴 17.3 — INSTANT NAVIGATION (PREFETCH)

### Concept
Khi user đang xem page A, prefetch data của page B mà user **khả năng cao sẽ vào tiếp**.
Khi user tap → data đã có sẵn → instant load.

### Prefetch Strategy

```typescript
// src/lib/prefetch-strategy.ts

// Rule: prefetch những page hay đi sau page hiện tại
const PREFETCH_MAP: Record<string, string[]> = {
  '/':          ['/anki', '/quests'],       // từ home hay vào anki/quests
  '/anki':      ['/quests', '/'],           // sau anki hay về home
  '/speak':     ['/speak/chat', '/'],
  '/quests':    ['/', '/achievements'],
  '/analytics': ['/analytics/weekly'],
};

// Prefetch khi user hover/touch bottom nav
function usePrefetchOnHover() {
  const router = useRouter();
  const pathname = usePathname();

  const prefetchPage = useCallback((href: string) => {
    router.prefetch(href);
    // Đồng thời prefetch data
    const targets = PREFETCH_MAP[pathname] || [];
    targets.forEach(target => {
      if (target === href) prefetchPageData(target);
    });
  }, [pathname]);

  return prefetchPage;
}

// Prefetch data cho page
async function prefetchPageData(page: string) {
  const queryClient = getQueryClient();

  switch(page) {
    case '/anki':
      await queryClient.prefetchQuery({
        queryKey: ['anki-cards'],
        queryFn: () => fetch('/api/anki/due').then(r => r.json()),
        staleTime: 30_000
      });
      break;
    case '/quests':
      await queryClient.prefetchQuery({
        queryKey: ['quests'],
        queryFn: () => fetch('/api/quests').then(r => r.json()),
        staleTime: 60_000
      });
      break;
  }
}
```

### Link Prefetch trên Bottom Nav

```tsx
<NavItem
  href="/anki"
  onMouseEnter={() => prefetchPage('/anki')}
  onTouchStart={() => prefetchPage('/anki')}  // mobile: prefetch khi bắt đầu touch
>
  <BookOpen size={24} />
  <span>Anki</span>
</NavItem>
```

---

## 🔴 17.4 — SMART DATA CACHING

### TanStack Query Setup

```typescript
// src/lib/query-client.ts

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,          // 1 phút — không refetch nếu data mới
      gcTime: 5 * 60_000,         // 5 phút — giữ trong memory
      refetchOnWindowFocus: false, // Không refetch khi switch tab
      refetchOnMount: false,       // Không refetch nếu đã có cache
      retry: 1,                    // Retry 1 lần nếu fail
    }
  }
});
```

### Stale Time Strategy (per query)

```typescript
// Mỗi loại data có stale time khác nhau

const STALE_TIMES = {
  // Thay đổi thường xuyên — stale nhanh
  'quests':           30_000,    // 30s — user có thể complete quest bất cứ lúc
  'streak':           60_000,    // 1 phút
  'exp':              30_000,    // 30s

  // Thay đổi ít — cache lâu
  'anki-cards':       5 * 60_000,   // 5 phút
  'speak-modes':      30 * 60_000,  // 30 phút — không đổi
  'learning-profile': 10 * 60_000,  // 10 phút

  // Gần như static
  'achievements':     60 * 60_000,  // 1 giờ
  'milestones':       60 * 60_000,  // 1 giờ
  'prompts-library':  24 * 60 * 60_000, // 24 giờ
};

// Dùng:
useQuery({
  queryKey: ['quests'],
  queryFn: fetchQuests,
  staleTime: STALE_TIMES['quests']
});
```

### Background Sync

```typescript
// Refetch data quan trọng khi app được focus lại
// (user switch từ app khác về)

useEffect(() => {
  const handleFocus = () => {
    // Chỉ invalidate data "hot" — không invalidate tất cả
    queryClient.invalidateQueries({ queryKey: ['streak'] });
    queryClient.invalidateQueries({ queryKey: ['quests'] });
  };

  window.addEventListener('visibilitychange', () => {
    if (!document.hidden) handleFocus();
  });
}, []);
```

---

## 🔴 17.5 — PROGRESSIVE LOADING

### Concept
Load content theo priority: **critical first, rest later**.
User thấy nội dung quan trọng nhất ngay lập tức.

### Dashboard Progressive Load

```tsx
// Thay vì chờ tất cả data rồi mới render

// STEP 1: Render skeleton ngay (0ms)
// STEP 2: Load hero card data trước (critical) — ~200ms
// STEP 3: Fade in hero card, skeleton còn lại vẫn shimmer
// STEP 4: Load quests, streak — ~400ms
// STEP 5: Load skill stats, quick actions — ~600ms
// STEP 6: Tất cả hiện đầy đủ — ~600ms

// User thấy content ngay từ 200ms, không chờ 600ms

function DashboardPage() {
  // Split thành multiple queries với priority
  const { data: heroData } = useQuery({
    queryKey: ['dashboard-hero'],
    queryFn: fetchHeroData,    // chỉ lấy: level, exp, name
    staleTime: STALE_TIMES['exp']
  });

  const { data: streakData } = useQuery({
    queryKey: ['streak'],
    queryFn: fetchStreak,
    staleTime: STALE_TIMES['streak']
  });

  const { data: skillStats } = useQuery({
    queryKey: ['skill-stats'],
    queryFn: fetchSkillStats,  // nặng hơn, load sau
    staleTime: STALE_TIMES['learning-profile']
  });

  return (
    <div>
      {/* Hero — hiện ngay khi có data */}
      {heroData
        ? <HeroCard data={heroData} />
        : <Skeleton className="h-40" />
      }

      {/* Streak — hiện khi có */}
      {streakData
        ? <StreakWidget data={streakData} />
        : <Skeleton className="h-20" />
      }

      {/* Skill stats — hiện sau */}
      {skillStats
        ? <SkillStats data={skillStats} />
        : <SkillStatsSkeleton />
      }
    </div>
  );
}
```

### API Splitting

```typescript
// Bỏ: 1 API call trả về tất cả dashboard data (nặng)
// GET /api/dashboard → { hero, streak, skills, quests, quicklinks }

// Thêm: Split thành lightweight calls
// GET /api/dashboard/hero    → { name, level, exp, expMax }    ~50ms
// GET /api/dashboard/streak  → { streak, checkedIn }           ~30ms
// GET /api/dashboard/stats   → { skillScores[] }               ~80ms
// GET /api/quests             → { quests[] }                    ~100ms

// Chạy parallel, render từng phần khi ready
```

---

## 🟡 17.6 — LOADING STATE MAGIC

### "Làm phép" khi đang load

Thay vì show loading indicator → show **meaningful content** trong thời gian chờ.

**Trick 1: Instant feedback on tap**
```tsx
// Khi user tap button → hiện feedback ngay (không chờ API)
function ActionButton({ onClick, children }) {
  const [pressed, setPressed] = useState(false);

  const handlePress = async () => {
    setPressed(true);                    // Visual feedback ngay
    await onClick();                     // API call (background)
    setPressed(false);
  };

  return (
    <motion.button
      onTap={handlePress}
      animate={{ scale: pressed ? 0.96 : 1 }}
      transition={{ duration: 0.08 }}   // 80ms — barely perceptible
    >
      {children}
    </motion.button>
  );
}
```

**Trick 2: Staggered reveal thay vì bulk load**
```tsx
// Thay vì: tất cả items hiện cùng lúc
// Dùng: stagger 50ms per item → cảm giác app đang "build up" nội dung

const container = {
  show: { transition: { staggerChildren: 0.05 } }
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } }
};

<motion.div variants={container} initial="hidden" animate="show">
  {quests.map(q => (
    <motion.div key={q.id} variants={item}>
      <QuestItem quest={q} />
    </motion.div>
  ))}
</motion.div>
```

**Trick 3: AI loading — show "đang suy nghĩ"**
```tsx
// Khi chờ Qwen response (có thể 2-5s)
// Thay vì spinner → hiện typing indicator có personality

function AITypingIndicator({ context }: { context: string }) {
  const messages = {
    'grading':   ['SENSEI đang đọc bài...', 'Đang phân tích...', 'Đang chấm điểm...'],
    'insight':   ['ORACLE đang phân tích data...', 'Đang tìm pattern...'],
    'speak':     ['Đang suy nghĩ...', 'Chuẩn bị phản hồi...'],
    'debrief':   ['SENSEI đang tổng kết buổi học...'],
  };

  const [msgIdx, setMsgIdx] = useState(0);
  const msgs = messages[context];

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx(i => (i + 1) % msgs.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      key={msgIdx}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 text-[var(--text-secondary)]"
    >
      <ThinkingDots />  {/* 3 dots bouncing */}
      <span className="text-sm">{msgs[msgIdx]}</span>
    </motion.div>
  );
}
```

**Trick 4: Progress bar cho AI calls**
```tsx
// AI calls thường mất 2-5s
// Fake progress bar tăng dần (không phản ánh thật nhưng user feel tốt hơn)

function AIProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Tăng nhanh lúc đầu, chậm dần khi gần 90%
    // Không bao giờ reach 100% cho đến khi done thật
    const schedule = [
      { target: 30, duration: 500 },
      { target: 60, duration: 800 },
      { target: 80, duration: 1200 },
      { target: 90, duration: 2000 },
    ];
    // ... animate theo schedule
  }, []);

  return (
    <div className="h-0.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-[var(--gold)]"
        animate={{ width: `${progress}%` }}
        transition={{ ease: 'easeOut' }}
      />
    </div>
  );
}
```

---

## 🟡 17.7 — MICRO-ANIMATION POLISH

### Các animation tạo delight

**1. EXP Counter — số đếm lên**
```tsx
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = display;
    const end = value;
    const duration = 600;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value]);

  return <span>{display.toLocaleString()}</span>;
}
// Dùng: EXP total, streak count, score
```

**2. Streak flame — pulse khi mới check-in**
```tsx
// Khi user check-in thành công
<motion.div
  animate={justCheckedIn ? {
    scale: [1, 1.4, 0.9, 1.1, 1],
    filter: [
      'drop-shadow(0 0 4px rgba(245,166,35,0.3))',
      'drop-shadow(0 0 20px rgba(245,166,35,0.8))',
      'drop-shadow(0 0 8px rgba(245,166,35,0.5))',
      'drop-shadow(0 0 4px rgba(245,166,35,0.3))',
    ]
  } : {}}
  transition={{ duration: 0.6, ease: 'easeOut' }}
>
  <Flame size={32} className="text-[var(--gold)]" />
</motion.div>
```

**3. Quest complete — checkmark draw**
```tsx
// SVG checkmark tự vẽ khi complete
<motion.path
  d="M 4 12 L 9 17 L 20 6"
  stroke="var(--green)"
  strokeWidth={2.5}
  fill="none"
  strokeLinecap="round"
  initial={{ pathLength: 0 }}
  animate={{ pathLength: 1 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
/>
```

**4. Level up — số scale bounce**
```tsx
<motion.div
  key={level}
  initial={{ scale: 0.5, opacity: 0 }}
  animate={{ scale: [0.5, 1.3, 0.95, 1.05, 1], opacity: 1 }}
  transition={{ duration: 0.5, ease: 'easeOut' }}
>
  {level}
</motion.div>
```

**5. Card hover — lift effect**
```tsx
<motion.div
  whileHover={{
    y: -3,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px var(--border-gold)',
    transition: { duration: 0.15 }
  }}
  whileTap={{ scale: 0.97, transition: { duration: 0.08 } }}
>
  {children}
</motion.div>
```

**6. Bottom nav tap — spring bounce**
```tsx
<motion.div
  whileTap={{ scale: 0.85 }}
  animate={isActive ? { scale: [1, 0.9, 1.1, 1] } : {}}
  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
>
  <Icon />
</motion.div>
```

**7. Page transition — slide + fade**
```tsx
// Tất cả page transitions đồng nhất
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

---

## 🟡 17.8 — HAPTIC FEEDBACK

### Concept
iPhone 15 Pro Max có Taptic Engine — dùng haptic để tạo "physical feel".

```typescript
// src/lib/haptics.ts

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function haptic(style: HapticStyle = 'light') {
  // iOS Safari: vibration API
  if (!navigator.vibrate) return;

  const patterns: Record<HapticStyle, number | number[]> = {
    light:   10,
    medium:  20,
    heavy:   40,
    success: [10, 50, 10],   // double tap feel
    warning: [20, 40, 20],
    error:   [40, 20, 40],   // harsh
  };

  navigator.vibrate(patterns[style]);
}

// Hoặc dùng Capacitor Haptics nếu có native wrapper
// import { Haptics, ImpactStyle } from '@capacitor/haptics';
```

### Haptic Map

```typescript
// Mỗi action có haptic phù hợp

const HAPTIC_MAP = {
  // Navigation
  'tab_switch':         'light',
  'modal_open':         'light',
  'modal_close':        'light',

  // Positive actions
  'quest_complete':     'success',   // satisfying
  'checkin_done':       'success',
  'level_up':          'heavy',     // big moment
  'personal_best':     'success',
  'anki_easy':         'light',
  'anki_good':         'light',

  // Negative / warning
  'anki_again':        'medium',    // slight resistance
  'streak_broken':     'error',
  'wrong_answer':      'medium',

  // UI interactions
  'button_tap':        'light',
  'card_flip':         'light',
  'swipe_action':      'medium',
};

// Usage:
function QuestItem({ quest }) {
  const complete = useCompleteQuest();

  return (
    <button onClick={() => {
      haptic('success');
      complete.mutate(quest.id);
    }}>
      ...
    </button>
  );
}
```

---

## 🟡 17.9 — ERROR STATE UX

### Concept
Errors không được làm user frustrated. Phải: thân thiện, giải thích rõ, có action.

### Error Components

```tsx
// Thay vì: "Error: Failed to fetch" (horrible)
// Dùng: contextual error với action

function ErrorState({ type, onRetry }: { type: string; onRetry: () => void }) {
  const errors = {
    'network': {
      icon: <WifiOff size={32} />,
      title: 'Mất kết nối',
      message: 'Kiểm tra internet rồi thử lại nhé',
      action: 'Thử lại'
    },
    'ai_timeout': {
      icon: <Bot size={32} />,
      title: 'AI đang bận',
      message: 'SENSEI đang xử lý nhiều request, thử lại sau 30 giây',
      action: 'Thử lại'
    },
    'empty_deck': {
      icon: <CheckCircle size={32} className="text-[var(--green)]" />,
      title: 'Hết cards rồi!',
      message: 'Bạn đã review tất cả cards hôm nay. Quay lại sau nhé.',
      action: 'Thêm từ mới',
      isSuccess: true   // không phải lỗi — treat as success
    },
    'server': {
      icon: <AlertTriangle size={32} />,
      title: 'Có lỗi xảy ra',
      message: 'Hệ thống đang gặp sự cố, thử lại sau vài phút',
      action: 'Thử lại'
    }
  };

  const config = errors[type] || errors['server'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4 p-8 text-center"
    >
      <div className="text-[var(--text-secondary)]">{config.icon}</div>
      <h3 className="text-[var(--text-primary)] font-semibold">{config.title}</h3>
      <p className="text-[var(--text-secondary)] text-sm">{config.message}</p>
      <button onClick={onRetry} className="btn-primary">
        {config.action}
      </button>
    </motion.div>
  );
}
```

### Toast Notifications

```tsx
// Toast system — không dùng alert()

type ToastType = 'success' | 'error' | 'info' | 'warning';

function Toast({ type, message }: { type: ToastType; message: string }) {
  const icons = {
    success: <CheckCircle size={16} className="text-[var(--green)]" />,
    error:   <XCircle size={16} className="text-[var(--ruby)]" />,
    info:    <Info size={16} className="text-[var(--cyan)]" />,
    warning: <AlertTriangle size={16} className="text-[var(--amber)]" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="flex items-center gap-2 px-4 py-3 rounded-xl
                 bg-[var(--bg-overlay)] border border-[var(--border-subtle)]
                 shadow-lg text-sm"
    >
      {icons[type]}
      <span>{message}</span>
    </motion.div>
  );
}

// Auto-dismiss sau 3s
// Stack tối đa 3 toasts
// Position: top center (không che bottom nav)
```

---

## 🟢 17.10 — IMAGE & ASSET OPTIMIZATION

```typescript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,  // 24h cache
  },
  experimental: {
    optimizeCss: true,
  }
};

// Font preload (đã có từ Phase 13, verify):
<link rel="preload" href="/fonts/Sora-Variable.woff2"
      as="font" type="font/woff2" crossOrigin="anonymous"
      fetchPriority="high" />

// Route-based code splitting (Next.js auto, verify không import heavy libs globally)
// recharts → lazy load chỉ ở Analytics page
// framer-motion → tree-shake, chỉ import cần dùng
```

---

## 🟢 17.11 — PWA OFFLINE LAYER

### Offline-first cho core features

```javascript
// public/sw.js — update service worker

// Cache strategy per route:
const CACHE_STRATEGIES = {
  // App shell — cache first
  '/':          'cache-first',
  '/anki':      'cache-first',
  '/quests':    'cache-first',

  // API — stale-while-revalidate
  '/api/quests':    'stale-while-revalidate',
  '/api/dashboard': 'stale-while-revalidate',

  // Dynamic — network first
  '/api/speak':     'network-first',
  '/api/analytics': 'network-first',
};

// Offline fallback:
// - Anki: dùng cached cards từ last session
// - Quests: show cached state, disable complete action
// - Dashboard: show cached stats với "Offline" badge
// - Speak/AI: show "Cần kết nối internet" error state
```

---

## 🟢 17.12 — PERFORMANCE MONITORING

### Track metrics thật

```typescript
// src/lib/performance.ts

// Web Vitals
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

function reportWebVital(metric: any) {
  // Log to console (dev) hoặc analytics (prod)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Perf] ${metric.name}: ${metric.value}ms`);
  }
}

onLCP(reportWebVital);   // Largest Contentful Paint (target: < 2.5s)
onFID(reportWebVital);   // First Input Delay (target: < 100ms)
onCLS(reportWebVital);   // Cumulative Layout Shift (target: < 0.1)
onFCP(reportWebVital);   // First Contentful Paint (target: < 1.8s)
onTTFB(reportWebVital);  // Time to First Byte (target: < 800ms)

// Custom: track API response times
export function trackApiTime(endpoint: string, duration: number) {
  if (duration > 3000) {
    console.warn(`[Slow API] ${endpoint}: ${duration}ms`);
  }
}
```

### Target Metrics

```
LCP (load main content):  < 1.5s   ← better than 2.5s standard
FID (first interaction):  < 50ms   ← better than 100ms standard
CLS (layout shift):       < 0.05   ← better than 0.1 standard
FCP (first paint):        < 1.0s
TTFB (server response):   < 500ms

Perceived load time:      < 200ms  ← skeleton hiện ngay
AI response feel:         < 500ms  ← progress bar + typing indicator
Navigation feel:          < 100ms  ← prefetch + optimistic
```

---

## 📊 IMPLEMENTATION ORDER

### Sprint 1 — Foundation (impact lớn nhất, làm trước)
```
1. Skeleton components cho tất cả pages — 4h
2. TanStack Query setup + stale times — 2h
3. API splitting (dashboard hero/streak/stats) — 3h
4. Progressive loading Dashboard — 2h
```

### Sprint 2 — Optimistic + Prefetch
```
5. Optimistic UI: Quest complete — 2h
6. Optimistic UI: Check-in, Anki rating — 2h
7. Prefetch strategy + bottom nav hover — 2h
8. Background sync on app focus — 1h
```

### Sprint 3 — Loading Magic
```
9.  AI typing indicator (context-aware messages) — 2h
10. AI progress bar (fake but feels real) — 1.5h
11. Staggered reveal animations — 2h
12. AnimatedNumber counter — 1h
```

### Sprint 4 — Delight + Polish
```
13. Haptic feedback map — 2h
14. Micro-animations (flame, checkmark, level up) — 3h
15. Error states + Toast system — 2h
16. PWA offline layer update — 2h
```

**Total estimate: ~38h**

---

## 🔑 KEY PRINCIPLES

1. **Skeleton > Spinner, luôn luôn** — spinner báo hiệu "chờ đi", skeleton nói "content sắp đến"
2. **Optimistic first** — tin tưởng action sẽ thành công, rollback khi fail (hiếm)
3. **Prefetch silently** — user không biết đang prefetch, chỉ thấy "nhanh thật"
4. **AI phải có personality khi loading** — "SENSEI đang đọc bài..." > spinner
5. **Haptic = physical connection** — mỗi action có physical feedback = app "real" hơn
6. **Error = cơ hội** — error state tốt không làm user frustrated mà guide họ về
7. **Đo trước, optimize sau** — track Web Vitals, biết chỗ chậm thật trước khi optimize
8. **Perceived > Real** — 200ms với skeleton tốt hơn 100ms với blank screen

---

_Phase 17: PHANTOM — Performance & UX Magic_
_Player: Dũng Vũ · iPhone 15 Pro Max · 120Hz ProMotion_
_"Make them feel it's fast. Then make it actually fast."_
