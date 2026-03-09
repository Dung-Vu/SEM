// Timezone offset in minutes — read from env (default 420 = UTC+7 Vietnam)
const TIMEZONE_OFFSET = parseInt(process.env.USER_TIMEZONE_OFFSET_MINS ?? "420");

function toLocalDate(date: Date): Date {
  // Convert to user's local timezone
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const local = new Date(utc + (TIMEZONE_OFFSET * 60000));
  return local;
}

export function isToday(date: Date | null): boolean {
  if (!date) return false;
  const now = toLocalDate(new Date());
  const checkDate = toLocalDate(date);
  return (
    checkDate.getFullYear() === now.getFullYear() &&
    checkDate.getMonth() === now.getMonth() &&
    checkDate.getDate() === now.getDate()
  );
}

export function isYesterday(date: Date | null): boolean {
  if (!date) return false;
  const now = toLocalDate(new Date());
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const checkDate = toLocalDate(date);
  return (
    checkDate.getFullYear() === yesterday.getFullYear() &&
    checkDate.getMonth() === yesterday.getMonth() &&
    checkDate.getDate() === yesterday.getDate()
  );
}

export function calculateStreak(lastCheckIn: Date | null, currentStreak: number): number {
  if (!lastCheckIn) return 0;
  if (isToday(lastCheckIn)) return currentStreak;
  if (isYesterday(lastCheckIn)) return currentStreak;
  return 0; // streak broken
}

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
