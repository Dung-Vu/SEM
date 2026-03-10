import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/notifications/settings — load user's notification prefs
export async function GET() {
  const user = await prisma.user.findFirst({ select: { id: true } });
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
  const user = await prisma.user.findFirst({ select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();

  // Allowlist of patchable fields
  const allowed = [
    "streakWarning", "ankiReminder", "questReminder", "levelUp",
    "weeklyReport", "aiInsight",
    "ankiReminderTime", "questReminderTime", "streakWarningHour",
    "quietHoursStart", "quietHoursEnd",
    "skipIfAlreadyDone", "maxPerDay",
  ];

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
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
