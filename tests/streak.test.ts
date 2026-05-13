import test from "node:test";
import assert from "node:assert/strict";

import {
  addLocalDays,
  getLocalDateKey,
  getLocalDayOfWeek,
  getLocalDayOfWeekFromDateKey,
  getLocalMonthInfo,
  getLocalStartOfMonth,
  getLocalStartOfDay,
  getLocalStartOfWeek,
  getLocalWeekInfo,
} from "@/lib/streak";

test("getLocalDateKey uses configured UTC+7 day boundaries", () => {
  const lateUtc = new Date("2026-05-13T17:30:00.000Z");
  assert.equal(getLocalDateKey(lateUtc), "2026-05-14");

  const earlyUtc = new Date("2026-05-13T01:30:00.000Z");
  assert.equal(getLocalDateKey(earlyUtc), "2026-05-13");
});

test("getLocalStartOfDay returns UTC instant for local midnight", () => {
  const date = new Date("2026-05-13T17:30:00.000Z");
  assert.equal(getLocalStartOfDay(date).toISOString(), "2026-05-13T17:00:00.000Z");
});

test("getLocalDayOfWeek follows local timezone instead of UTC", () => {
  const saturdayUtc = new Date("2026-05-16T20:30:00.000Z");
  assert.equal(getLocalDayOfWeek(saturdayUtc), 0);
});

test("getLocalStartOfWeek returns Sunday midnight in local timezone", () => {
  const wednesdayUtc = new Date("2026-05-13T17:30:00.000Z");
  assert.equal(getLocalStartOfWeek(wednesdayUtc).toISOString(), "2026-05-09T17:00:00.000Z");
});

test("addLocalDays shifts by local day boundaries instead of host timezone", () => {
  const lateUtc = new Date("2026-05-13T17:30:00.000Z");
  assert.equal(getLocalDateKey(addLocalDays(lateUtc, -1)), "2026-05-13");
  assert.equal(getLocalDateKey(addLocalDays(lateUtc, 1)), "2026-05-15");
});

test("getLocalDayOfWeekFromDateKey is stable for date-only keys", () => {
  assert.equal(getLocalDayOfWeekFromDateKey("2026-05-14"), 4);
});

test("getLocalWeekInfo uses local date for ISO week boundaries", () => {
  assert.deepEqual(getLocalWeekInfo(new Date("2026-01-01T00:30:00.000Z")), {
    weekNumber: 1,
    year: 2026,
  });
});

test("getLocalMonthInfo and start of month use local timezone", () => {
  const lateUtc = new Date("2026-04-30T18:30:00.000Z");
  assert.deepEqual(getLocalMonthInfo(lateUtc), { month: 5, year: 2026 });
  assert.equal(getLocalStartOfMonth(lateUtc).toISOString(), "2026-04-30T17:00:00.000Z");
});
