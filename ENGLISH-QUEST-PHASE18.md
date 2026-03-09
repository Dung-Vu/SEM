# 🔔 PHASE 18 — SMART NOTIFICATIONS

> Phase 12 có Web Push cơ bản ✅ → Phase 18: Nâng cấp toàn diện
> Stack: Next.js · Web Push · Service Worker · node-cron · Qwen 3.5-plus
> Updated: 2026-03-09

---

## 🎯 VISION

**Codename: HERALD**

Mục tiêu: Notification đúng lúc, đúng nội dung, không spam.
Mỗi thông báo phải có lý do tồn tại — user thấy → muốn mở app ngay.

> "Thông báo tốt không phải nhiều. Là đúng lúc user cần nhất."

---

## 📋 TỔNG QUAN

| #    | Item                        | Nhóm      | Priority |
| ---- | --------------------------- | --------- | -------- |
| 18.1 | Notification Schema         | Foundation| 🔴 P0   |
| 18.2 | Streak Warning              | Core      | 🔴 P0   |
| 18.3 | Anki Reminder               | Core      | 🔴 P0   |
| 18.4 | Quest Reminder              | Core      | 🔴 P0   |
| 18.5 | Level Up Notification       | Core      | 🔴 P0   |
| 18.6 | Weekly Report               | Feature   | 🟡 P1   |
| 18.7 | AI Insight Alert            | Feature   | 🟡 P1   |
| 18.8 | Smart Scheduling Engine     | Core      | 🟡 P1   |
| 18.9 | Rich Notification UI        | Polish    | 🟡 P1   |
| 18.10| Notification Settings UI    | Polish    | 🟢 P2   |

---

## 🔴 18.1 — NOTIFICATION SCHEMA

### Bổ sung vào DB hiện tại

```sql
-- Notification log (track đã gửi gì, tránh spam)
CREATE TABLE notification_log (
  id            SERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL,
  type          TEXT NOT NULL,       -- enum bên dưới
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  sent_at       TIMESTAMPTZ DEFAULT NOW(),
  opened        BOOLEAN DEFAULT FALSE,
  opened_at     TIMESTAMPTZ
);

CREATE INDEX idx_notif_user_type ON notification_log(user_id, type, sent_at DESC);

-- User notification preferences (mở rộng settings hiện tại)
-- Thêm columns vào bảng settings hiện có, hoặc tạo riêng:
CREATE TABLE notification_settings (
  user_id               TEXT PRIMARY KEY,

  -- Per-type toggles
  streak_warning        BOOLEAN DEFAULT TRUE,
  anki_reminder         BOOLEAN DEFAULT TRUE,
  quest_reminder        BOOLEAN DEFAULT TRUE,
  level_up              BOOLEAN DEFAULT TRUE,
  weekly_report         BOOLEAN DEFAULT TRUE,
  ai_insight            BOOLEAN DEFAULT TRUE,

  -- Timing preferences
  anki_reminder_time    TEXT DEFAULT '08:00',    -- HH:MM
  quest_reminder_time   TEXT DEFAULT '20:00',    -- HH:MM
  streak_warning_hour   INTEGER DEFAULT 21,      -- 9PM
  quiet_hours_start     INTEGER DEFAULT 23,      -- 11PM
  quiet_hours_end       INTEGER DEFAULT 7,       -- 7AM

  -- Smart settings
  skip_if_already_done  BOOLEAN DEFAULT TRUE,    -- Không nhắc nếu đã làm rồi
  max_per_day           INTEGER DEFAULT 3,       -- Tối đa 3 noti/ngày

  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Notification Types Enum

```typescript
type NotificationType =
  | 'streak_warning'      // Sắp mất streak
  | 'streak_milestone'    // Đạt 7/14/30/100 ngày
  | 'anki_reminder'       // Có cards cần review
  | 'anki_overdue'        // Quá hạn review nhiều ngày
  | 'quest_reminder'      // Chưa xong quest
  | 'quest_almost_done'   // Còn 1-2 quest nữa là xong
  | 'level_up'            // Lên level
  | 'weekly_report'       // Báo cáo thứ Hai
  | 'ai_insight'          // ORACLE phát hiện pattern
  | 'personal_best'       // Phá kỷ lục
  | 'milestone_unlocked'  // Mở khóa milestone
```

---

## 🔴 18.2 — STREAK WARNING

### Logic

```typescript
// src/lib/notifications/streak-warning.ts

export async function checkAndSendStreakWarning(userId: string) {
  const settings = await getNotifSettings(userId);
  if (!settings.streakWarning) return;

  const now = new Date();
  const hour = now.getHours();

  // Chỉ gửi trong khung giờ streak_warning_hour (default 21:00)
  if (hour !== settings.streakWarningHour) return;

  // Check quiet hours
  if (isQuietHours(hour, settings)) return;

  // Check đã check-in hôm nay chưa
  const checkedIn = await hasCheckedInToday(userId);
  if (checkedIn && settings.skipIfAlreadyDone) return;

  // Check đã gửi loại này hôm nay chưa (tránh duplicate)
  const alreadySent = await wasNotifSentToday(userId, 'streak_warning');
  if (alreadySent) return;

  // Lấy streak hiện tại
  const streak = await getCurrentStreak(userId);
  if (streak === 0) return; // Không có streak thì không cần warning

  // Build notification content theo streak length
  const content = buildStreakWarningContent(streak);

  await sendPushNotification(userId, content);
  await logNotification(userId, 'streak_warning', content);
}

function buildStreakWarningContent(streak: number) {
  // Nội dung thay đổi theo streak dài ngắn — tạo urgency
  if (streak >= 30) {
    return {
      title: `🔥 ${streak} ngày streak sắp mất!`,
      body: `Đừng để mất ${streak} ngày nỗ lực. Check-in ngay!`,
      icon: '/icons/streak-fire.png',
      badge: '/icons/badge.png',
      data: { url: '/', action: 'checkin' }
    };
  }
  if (streak >= 7) {
    return {
      title: `⚡ Streak ${streak} ngày của bạn`,
      body: 'Còn vài tiếng nữa là hết ngày. Check-in để giữ streak!',
      data: { url: '/', action: 'checkin' }
    };
  }
  return {
    title: '🔥 Đừng quên check-in hôm nay',
    body: `Streak ${streak} ngày — giữ đà đi!`,
    data: { url: '/', action: 'checkin' }
  };
}
```

---

## 🔴 18.3 — ANKI REMINDER

### Logic

```typescript
export async function checkAndSendAnkiReminder(userId: string) {
  const settings = await getNotifSettings(userId);
  if (!settings.ankiReminder) return;

  // Check đúng giờ reminder (default 8:00 sáng)
  const [hour, minute] = settings.ankiReminderTime.split(':').map(Number);
  if (!isCurrentHour(hour, minute)) return;
  if (isQuietHours(hour, settings)) return;
  if (await wasNotifSentToday(userId, 'anki_reminder')) return;

  // Đếm số cards due hôm nay
  const dueCards = await getDueCardCount(userId);
  if (dueCards === 0) return; // Không có gì để review

  // Check đã review hôm nay chưa
  const reviewedToday = await hasReviewedAnkiToday(userId);
  if (reviewedToday && settings.skipIfAlreadyDone) return;

  // Check overdue (chưa review nhiều ngày)
  const daysSinceReview = await getDaysSinceLastAnkiReview(userId);

  const content = buildAnkiReminderContent(dueCards, daysSinceReview);
  await sendPushNotification(userId, content);
  await logNotification(userId, 'anki_reminder', content);
}

function buildAnkiReminderContent(dueCards: number, daysSinceReview: number) {
  if (daysSinceReview >= 3) {
    return {
      title: `📚 ${dueCards} cards đang chờ bạn lâu rồi`,
      body: `${daysSinceReview} ngày chưa review. Cards overdue sẽ khó hơn!`,
      data: { url: '/anki' }
    };
  }
  if (dueCards >= 20) {
    return {
      title: `📚 ${dueCards} cards cần review hôm nay`,
      body: 'Nhiều đấy — bắt đầu sớm để không bị dồn nhé',
      data: { url: '/anki' }
    };
  }
  return {
    title: `📚 ${dueCards} cards đang chờ`,
    body: 'Review nhanh thôi, khoảng 10 phút là xong',
    data: { url: '/anki' }
  };
}
```

---

## 🔴 18.4 — QUEST REMINDER

### Logic

```typescript
export async function checkAndSendQuestReminder(userId: string) {
  const settings = await getNotifSettings(userId);
  if (!settings.questReminder) return;

  const [hour, minute] = settings.questReminderTime.split(':').map(Number);
  if (!isCurrentHour(hour, minute)) return;
  if (isQuietHours(hour, settings)) return;
  if (await wasNotifSentToday(userId, 'quest_reminder')) return;

  const questStats = await getQuestStats(userId);
  // { completed: 3, total: 8, remaining: 5 }

  // Đã xong hết rồi → không nhắc
  if (questStats.remaining === 0 && settings.skipIfAlreadyDone) return;

  const content = buildQuestReminderContent(questStats);
  await sendPushNotification(userId, content);
  await logNotification(userId, 'quest_reminder', content);
}

function buildQuestReminderContent(stats: QuestStats) {
  const { completed, total, remaining } = stats;

  // Gần xong rồi — tạo momentum
  if (remaining <= 2) {
    return {
      title: `⚔️ Còn ${remaining} quest nữa là xong!`,
      body: `${completed}/${total} hoàn thành. Về đích thôi!`,
      data: { url: '/quests' }
    };
  }
  if (completed === 0) {
    return {
      title: '⚔️ Quest hôm nay chưa bắt đầu',
      body: `${total} nhiệm vụ đang chờ. Bắt đầu từ Anki Review nhé!`,
      data: { url: '/quests' }
    };
  }
  return {
    title: `⚔️ ${remaining} quest còn lại hôm nay`,
    body: `Đã xong ${completed}/${total}. Tiếp tục nào!`,
    data: { url: '/quests' }
  };
}
```

---

## 🔴 18.5 — LEVEL UP NOTIFICATION

### Trigger: Realtime (không cần cron)

```typescript
// Gọi ngay sau khi user lên level
// Trong API route /api/exp hoặc /api/quests khi EXP vượt ngưỡng

export async function sendLevelUpNotification(
  userId: string,
  newLevel: number,
  newTitle: string
) {
  // Level up notification gửi ngay — không cần check giờ
  // (Vì đây là sự kiện đặc biệt, user vừa làm xong)

  const content = {
    title: `🏆 LEVEL UP! Bạn đạt Level ${newLevel}`,
    body: `"${newTitle}" — Tiếp tục chinh phục nhé!`,
    icon: '/icons/level-up.png',
    badge: '/icons/badge.png',
    // Vibration pattern — festive
    data: {
      url: '/',
      action: 'level_up',
      level: newLevel
    }
  };

  await sendPushNotification(userId, content);
  await logNotification(userId, 'level_up', content);
}

// Gọi trong exp calculation:
const prevLevel = calcLevel(prevExp);
const newLevel = calcLevel(newExp);
if (newLevel > prevLevel) {
  await sendLevelUpNotification(userId, newLevel, getLevelTitle(newLevel));
}
```

---

## 🟡 18.6 — WEEKLY REPORT

### Trigger: Thứ Hai 8:00 sáng

```typescript
// src/lib/notifications/weekly-report.ts
// Chạy bởi cron job

export async function sendWeeklyReportNotification(userId: string) {
  const settings = await getNotifSettings(userId);
  if (!settings.weeklyReport) return;

  // Chỉ gửi thứ Hai
  if (new Date().getDay() !== 1) return;
  if (await wasNotifSentThisWeek(userId, 'weekly_report')) return;

  // Lấy quick stats tuần vừa rồi (không generate full report ở đây)
  const weekStats = await getWeeklyStats(userId);

  // Tạo teaser ngắn — dụ user mở app xem full report
  const content = buildWeeklyReportContent(weekStats);
  await sendPushNotification(userId, content);
  await logNotification(userId, 'weekly_report', content);
}

function buildWeeklyReportContent(stats: WeeklyStats) {
  const trend = stats.scoreChange > 0 ? '📈' : stats.scoreChange < 0 ? '📉' : '➡️';

  return {
    title: `📊 Báo cáo tuần ${stats.weekNumber} của bạn`,
    body: `${stats.studyMinutes} phút · ${stats.expGained} EXP · ${trend} ${Math.abs(stats.scoreChange)} điểm`,
    data: { url: '/analytics/weekly' }
  };
}
```

---

## 🟡 18.7 — AI INSIGHT ALERT

### Trigger: Sau khi ORACLE phát hiện pattern đáng chú ý

```typescript
export async function checkAndSendInsightAlert(userId: string) {
  const settings = await getNotifSettings(userId);
  if (!settings.aiInsight) return;

  // Tối đa 1 AI insight/tuần (không spam)
  if (await wasNotifSentThisWeek(userId, 'ai_insight')) return;

  const profile = await getLearningProfile(userId);

  // Chỉ gửi khi có insight đáng gửi
  const insight = detectNotifiableInsight(profile);
  if (!insight) return;

  const content = await generateInsightNotification(insight, profile);
  await sendPushNotification(userId, content);
  await logNotification(userId, 'ai_insight', content);
}

function detectNotifiableInsight(profile: LearningProfile): string | null {
  // Velocity âm mạnh — đang tụt
  if (profile.speakingVelocity < -5) return 'speaking_declining';

  // Một skill bị bỏ bê hoàn toàn
  if (profile.daysSinceWriting > 7) return 'writing_neglected';

  // Đang tăng mạnh — reinforce
  if (profile.vocabVelocity > 10) return 'vocab_surge';

  // Consistency giảm
  if (profile.consistencyScore < 40) return 'consistency_low';

  return null; // Không có gì đáng gửi
}

async function generateInsightNotification(
  insightType: string,
  profile: LearningProfile
): Promise<NotificationContent> {
  // Dùng template thay vì call Qwen (nhanh hơn cho notification)
  const templates = {
    'speaking_declining': {
      title: '🧠 ORACLE phát hiện điều này',
      body: `Speaking giảm ${Math.abs(profile.speakingVelocity)} điểm/tuần. Thử Free Talk 10 phút hôm nay?`,
      data: { url: '/speak' }
    },
    'writing_neglected': {
      title: '✍️ Writing đang bị bỏ quên',
      body: `${profile.daysSinceWriting} ngày chưa viết Journal. Writing score đang giảm dần.`,
      data: { url: '/journal' }
    },
    'vocab_surge': {
      title: '🔥 Vocab đang tăng mạnh!',
      body: `+${profile.vocabVelocity} điểm tuần này. Duy trì Anki mỗi ngày nhé!`,
      data: { url: '/anki' }
    },
    'consistency_low': {
      title: '📊 ORACLE có nhận xét',
      body: 'Tuần này học không đều. 15 phút mỗi ngày tốt hơn 2 tiếng 1 lần.',
      data: { url: '/analytics' }
    }
  };

  return templates[insightType];
}
```

---

## 🟡 18.8 — SMART SCHEDULING ENGINE

### Anti-spam Logic

```typescript
// src/lib/notifications/scheduler.ts

export async function shouldSendNotification(
  userId: string,
  type: NotificationType
): Promise<boolean> {
  const settings = await getNotifSettings(userId);
  const now = new Date();
  const hour = now.getHours();

  // 1. Quiet hours check
  if (isQuietHours(hour, settings)) {
    return false;
  }

  // 2. Max per day check
  const todayCount = await getNotifCountToday(userId);
  if (todayCount >= settings.maxPerDay) {
    return false;
  }

  // 3. Duplicate check (đã gửi loại này trong timeframe?)
  const cooldowns: Record<NotificationType, number> = {
    streak_warning:    24 * 60,   // 1 lần/ngày
    anki_reminder:     24 * 60,   // 1 lần/ngày
    quest_reminder:    24 * 60,   // 1 lần/ngày
    level_up:          0,          // Gửi ngay, không cooldown
    weekly_report:     7 * 24 * 60, // 1 lần/tuần
    ai_insight:        7 * 24 * 60, // 1 lần/tuần
    personal_best:     24 * 60,   // 1 lần/ngày
    milestone_unlocked: 60,        // 1 lần/giờ (có thể unlock nhiều)
  };

  const lastSent = await getLastNotifTime(userId, type);
  const cooldown = cooldowns[type];
  if (lastSent && cooldown > 0) {
    const minutesSince = (Date.now() - lastSent.getTime()) / 60_000;
    if (minutesSince < cooldown) return false;
  }

  // 4. Skip if already done (context-aware)
  if (settings.skipIfAlreadyDone) {
    if (type === 'anki_reminder' && await hasReviewedAnkiToday(userId)) return false;
    if (type === 'quest_reminder' && await hasCompletedAllQuests(userId)) return false;
    if (type === 'streak_warning' && await hasCheckedInToday(userId)) return false;
  }

  return true;
}
```

### Cron Jobs Setup

```typescript
// src/lib/notifications/cron.ts
import cron from 'node-cron';

// Chạy trong timezone Vietnam (UTC+7)
// Cần set TZ=Asia/Ho_Chi_Minh trong .env

// Anki reminder — 8:00 sáng hàng ngày
cron.schedule('0 8 * * *', async () => {
  const users = await getActiveUsers();
  await Promise.allSettled(
    users.map(u => checkAndSendAnkiReminder(u.id))
  );
});

// Quest reminder — 20:00 tối hàng ngày
cron.schedule('0 20 * * *', async () => {
  const users = await getActiveUsers();
  await Promise.allSettled(
    users.map(u => checkAndSendQuestReminder(u.id))
  );
});

// Streak warning — 21:00 tối hàng ngày
cron.schedule('0 21 * * *', async () => {
  const users = await getActiveUsers();
  await Promise.allSettled(
    users.map(u => checkAndSendStreakWarning(u.id))
  );
});

// Weekly report — Thứ Hai 8:00 sáng
cron.schedule('0 8 * * 1', async () => {
  const users = await getActiveUsers();
  await Promise.allSettled(
    users.map(u => sendWeeklyReportNotification(u.id))
  );
});

// AI Insight check — Thứ Tư 9:00 sáng
cron.schedule('0 9 * * 3', async () => {
  const users = await getActiveUsers();
  await Promise.allSettled(
    users.map(u => checkAndSendInsightAlert(u.id))
  );
});

// Helper: chỉ lấy users đã subscribe push
async function getActiveUsers() {
  return prisma.user.findMany({
    where: {
      pushSubscriptions: { some: {} }  // có subscription
    },
    select: { id: true }
  });
}
```

---

## 🟡 18.9 — RICH NOTIFICATION UI

### Service Worker — Push Handler

```javascript
// public/sw.js — update push handler

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192.png',
    badge: '/icons/badge-72.png',

    // Rich notification features
    image: data.image || null,          // optional hero image
    vibrate: data.vibrate || [100, 50, 100],

    // Action buttons (tối đa 2)
    actions: buildActions(data.type),

    // Data để handle click
    data: {
      url: data.data?.url || '/',
      type: data.type,
      ...data.data
    },

    // iOS PWA
    requireInteraction: data.type === 'streak_warning', // streak warning không tự dismiss
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Action buttons theo loại notification
function buildActions(type) {
  const actionMap = {
    'streak_warning': [
      { action: 'checkin', title: '✅ Check-in ngay' },
      { action: 'dismiss', title: 'Để sau' }
    ],
    'anki_reminder': [
      { action: 'open_anki', title: '📚 Review ngay' },
      { action: 'dismiss', title: 'Nhắc lại sau' }
    ],
    'quest_reminder': [
      { action: 'open_quests', title: '⚔️ Xem Quest' },
      { action: 'dismiss', title: 'OK' }
    ],
    'weekly_report': [
      { action: 'open_report', title: '📊 Xem báo cáo' },
    ],
    'level_up': [
      { action: 'open_home', title: '🏆 Xem Level mới' },
    ],
  };
  return actionMap[type] || [];
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { url, type } = event.notification.data;
  const action = event.action;

  // Map action → URL
  const actionUrls = {
    'checkin':      '/?action=checkin',
    'open_anki':    '/anki',
    'open_quests':  '/quests',
    'open_report':  '/analytics/weekly',
    'open_home':    '/',
    'dismiss':      null,   // không mở app
  };

  const targetUrl = action ? actionUrls[action] : url;
  if (!targetUrl) return;

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // App đang mở → focus + navigate
      const existing = windowClients.find(c => c.focused);
      if (existing) {
        existing.focus();
        existing.navigate(targetUrl);
      } else {
        // App chưa mở → mở mới
        clients.openWindow(targetUrl);
      }
    })
  );
});
```

---

## 🟢 18.10 — NOTIFICATION SETTINGS UI

### `/settings` — Notification section

```tsx
<NotificationSettings>
  <SectionHeader title="Thông báo" icon={<Bell />} />

  {/* Master toggle */}
  <SettingRow
    title="Cho phép thông báo"
    description={permissionStatus} // "Đã bật" | "Chưa cấp quyền"
    action={<PermissionButton />}
  />

  {/* Per-type toggles */}
  <SettingGroup title="Loại thông báo">
    <Toggle
      label="Streak Warning"
      sublabel="Nhắc trước khi mất streak lúc 21:00"
      value={settings.streakWarning}
      onChange={v => update('streakWarning', v)}
    />
    <Toggle
      label="Anki Reminder"
      sublabel={`Nhắc review cards lúc ${settings.ankiReminderTime}`}
      value={settings.ankiReminder}
      onChange={v => update('ankiReminder', v)}
      extra={<TimePicker value={settings.ankiReminderTime} />}
    />
    <Toggle
      label="Quest Reminder"
      sublabel={`Nhắc hoàn thành quest lúc ${settings.questReminderTime}`}
      value={settings.questReminder}
      extra={<TimePicker value={settings.questReminderTime} />}
    />
    <Toggle
      label="Level Up"
      sublabel="Thông báo ngay khi lên level"
      value={settings.levelUp}
    />
    <Toggle
      label="Báo cáo tuần"
      sublabel="Mỗi thứ Hai 8:00 sáng"
      value={settings.weeklyReport}
    />
    <Toggle
      label="AI Insight"
      sublabel="ORACLE phát hiện pattern (tối đa 1 lần/tuần)"
      value={settings.aiInsight}
    />
  </SettingGroup>

  {/* Quiet hours */}
  <SettingGroup title="Giờ yên tĩnh">
    <SettingRow
      title="Không làm phiền"
      sublabel="Không gửi thông báo trong khoảng giờ này"
      value={`${settings.quietHoursStart}:00 - ${settings.quietHoursEnd}:00`}
    />
  </SettingGroup>

  {/* Max per day */}
  <SettingRow
    title="Tối đa mỗi ngày"
    value={`${settings.maxPerDay} thông báo`}
  />
</NotificationSettings>
```

---

## 📊 NOTIFICATION FLOW TỔNG THỂ

```
Cron Jobs (node-cron, UTC+7)
      ↓
shouldSendNotification()
  → Quiet hours? → Skip
  → Max/day reached? → Skip
  → Cooldown active? → Skip
  → Already done? → Skip
      ↓
Build notification content
  (dynamic based on user data)
      ↓
sendPushNotification()
  → web-push library
  → VAPID keys
      ↓
Service Worker nhận push
  → showNotification() với rich options
  → Action buttons
      ↓
User tap notification
  → notificationclick handler
  → Open/focus app → navigate to URL
      ↓
logNotification() → notification_log table
```

---

## 📊 NOTIFICATION SCHEDULE TỔNG HỢP

| Loại | Giờ gửi | Tần suất | Điều kiện |
|------|---------|----------|-----------|
| Anki Reminder | 8:00 sáng | Hàng ngày | Có cards due + chưa review |
| Streak Warning | 21:00 tối | Hàng ngày | Chưa check-in + có streak |
| Quest Reminder | 20:00 tối | Hàng ngày | Còn quest chưa xong |
| Level Up | Realtime | Khi xảy ra | Vừa lên level |
| Weekly Report | 8:00 Thứ Hai | Hàng tuần | Luôn gửi |
| AI Insight | 9:00 Thứ Tư | Hàng tuần | Có insight đáng gửi |

---

## 📊 IMPLEMENTATION ORDER

### Sprint 1 — Foundation
```
1. Schema: notification_log + notification_settings — 1h
2. shouldSendNotification() anti-spam engine — 2h
3. Update Service Worker push handler + actions — 2h
4. notificationclick handler — 1h
```

### Sprint 2 — Core Notifications
```
5. Streak Warning logic + content builder — 2h
6. Anki Reminder logic + content builder — 1.5h
7. Quest Reminder logic + content builder — 1.5h
8. Level Up realtime trigger — 1h
```

### Sprint 3 — Smart Notifications
```
9.  Weekly Report notification — 1.5h
10. AI Insight alert (template-based) — 2h
11. Cron jobs setup (node-cron + TZ) — 1h
12. getActiveUsers() helper — 30min
```

### Sprint 4 — UI & Polish
```
13. Notification Settings UI — 2h
14. TimePicker component — 1h
15. Permission request flow (iOS PWA đặc biệt) — 1.5h
16. Test toàn bộ flow trên iPhone thật — 1h
```

**Total estimate: ~27h**

---

## ⚠️ LƯU Ý iOS PWA ĐẶC BIỆT

```
iOS 16.4+ mới hỗ trợ Web Push cho PWA.
Yêu cầu:
  1. App phải được Add to Home Screen (không hoạt động từ Safari browser)
  2. User phải grant permission TRONG app (không phải browser prompt)
  3. HTTPS bắt buộc

Permission request flow cho iOS:
  → Lần đầu mở app từ Home Screen
  → Show in-app prompt đẹp: "Cho phép SEM gửi nhắc nhở?"
  → User tap "Cho phép" → gọi Notification.requestPermission()
  → Subscribe push → lưu subscription vào DB
```

```tsx
// In-app permission prompt (iOS-friendly)
function NotificationPermissionPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Chỉ show nếu chưa grant và đang trên iOS PWA
    if (Notification.permission === 'default' && isStandalone()) {
      setTimeout(() => setShow(true), 3000); // Delay 3s sau khi load
    }
  }, []);

  const handleAllow = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await subscribePush();
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <BottomSheet>
      <Bell size={32} className="text-[var(--gold)]" />
      <h3>Nhắc nhở thông minh</h3>
      <p>SEM sẽ nhắc bạn đúng lúc — streak warning, anki reminder, và insight từ ORACLE</p>
      <button onClick={handleAllow}>Cho phép thông báo</button>
      <button onClick={() => setShow(false)}>Để sau</button>
    </BottomSheet>
  );
}
```

---

## 🔑 KEY PRINCIPLES

1. **Mỗi notification có lý do tồn tại** — không gửi nếu user đã làm rồi
2. **Max 3 noti/ngày** — tránh notification fatigue
3. **Quiet hours tôn trọng** — không phá giấc ngủ
4. **Content dynamic** — streak 30 ngày khác streak 3 ngày → nội dung khác nhau
5. **Action buttons** — user không cần mở app mới action được
6. **iOS PWA permission** — phải handle đặc biệt, không dùng browser prompt

---

_Phase 18: HERALD — Smart Notifications_
_Player: Dũng Vũ · iPhone 15 Pro Max_
