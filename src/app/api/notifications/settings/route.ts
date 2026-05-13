import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

// GET /api/notifications/settings — load user's notification prefs
export async function GET() {
  const user = await getCurrentUser({ id: true });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let settings = await prisma.notificationSetting.findUnique({
    where: { userId: user.id },
  });

  // Auto-create with defaults on first visit
  if (!settings) {
    settings = await prisma.notificationSetting.create({
      data: { userId: user.id },
    });
  }

  return NextResponse.json({ settings });
}

// PATCH /api/notifications/settings — update user's notification prefs
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser({ id: true });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();

  const data: Record<string, unknown> = {};
  const booleanFields = [
    "streakWarning", "ankiReminder", "questReminder", "levelUp",
    "weeklyReport", "aiInsight", "skipIfAlreadyDone",
  ];

  for (const key of booleanFields) {
    if (key in body) {
      if (typeof body[key] !== "boolean") {
        return NextResponse.json({ error: `${key} must be boolean` }, { status: 400 });
      }
      data[key] = body[key];
    }
  }

  for (const key of ["ankiReminderTime", "questReminderTime"]) {
    if (key in body) {
      if (typeof body[key] !== "string" || !isValidTime(body[key])) {
        return NextResponse.json({ error: `${key} must be HH:mm` }, { status: 400 });
      }
      data[key] = body[key];
    }
  }

  for (const key of ["streakWarningHour", "quietHoursStart", "quietHoursEnd"]) {
    if (key in body) {
      const hour = Number(body[key]);
      if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
        return NextResponse.json({ error: `${key} must be an hour from 0 to 23` }, { status: 400 });
      }
      data[key] = hour;
    }
  }

  if ("maxPerDay" in body) {
    const maxPerDay = Number(body.maxPerDay);
    if (!Number.isInteger(maxPerDay) || maxPerDay < 1 || maxPerDay > 10) {
      return NextResponse.json({ error: "maxPerDay must be from 1 to 10" }, { status: 400 });
    }
    data.maxPerDay = maxPerDay;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const settings = await prisma.notificationSetting.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });

  return NextResponse.json({ settings });
}

function isValidTime(value: string): boolean {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}
