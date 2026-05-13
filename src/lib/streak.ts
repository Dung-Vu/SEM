// Timezone offset in minutes — read from env (default 420 = UTC+7 Vietnam)
const TIMEZONE_OFFSET = parseInt(process.env.USER_TIMEZONE_OFFSET_MINS ?? "420");

function toLocalDate(date: Date): Date {
  return new Date(date.getTime() + (TIMEZONE_OFFSET * 60000));
}

export function getLocalDateKey(date = new Date()): string {
  return toLocalDate(date).toISOString().slice(0, 10);
}

export function getLocalStartOfDay(date = new Date()): Date {
  const local = toLocalDate(date);
  const utcMidnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  return new Date(utcMidnight - (TIMEZONE_OFFSET * 60000));
}

export function addLocalDays(date: Date, days: number): Date {
  const shifted = getLocalStartOfDay(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
}

export function getLocalStartOfNextDay(date = new Date()): Date {
  const start = getLocalStartOfDay(date);
  start.setUTCDate(start.getUTCDate() + 1);
  return start;
}

export function getLocalDayOfWeek(date = new Date()): number {
  return toLocalDate(date).getUTCDay();
}

export function getLocalStartOfWeek(date = new Date()): Date {
  return addLocalDays(date, -getLocalDayOfWeek(date));
}

export function getLocalDayOfWeekFromDateKey(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function getLocalMonthInfo(date = new Date()): { month: number; year: number } {
  const local = toLocalDate(date);
  return { month: local.getUTCMonth() + 1, year: local.getUTCFullYear() };
}

export function getLocalStartOfMonth(date = new Date()): Date {
  const local = toLocalDate(date);
  const utcMonthStart = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1);
  return new Date(utcMonthStart - (TIMEZONE_OFFSET * 60000));
}

export function isToday(date: Date | null): boolean {
  if (!date) return false;
  return getLocalDateKey(date) === getLocalDateKey();
}

export function isYesterday(date: Date | null): boolean {
  if (!date) return false;
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return getLocalDateKey(date) === getLocalDateKey(yesterday);
}

export function calculateStreak(lastCheckIn: Date | null, currentStreak: number): number {
  if (!lastCheckIn) return 0;
  if (isToday(lastCheckIn)) return currentStreak;
  if (isYesterday(lastCheckIn)) return currentStreak;
  return 0; // streak broken
}

export function getLocalWeekInfo(date: Date): { weekNumber: number; year: number } {
  const local = toLocalDate(date);
  const d = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { weekNumber, year: d.getUTCFullYear() };
}
