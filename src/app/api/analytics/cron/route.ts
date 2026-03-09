import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateWeeklyReport } from "@/lib/weekly-report";
import { sendPushToSubscriptions } from "@/lib/push";

// GET /api/analytics/cron — Triggered every Monday 01:00 UTC (08:00 ICT) via Vercel Cron
// Generates weekly reports + sends push notifications for all users
// Also fires 14.10 insight push notifications: weakness_alert, strength_highlight, neglect_alert
export async function GET(request: NextRequest) {
  // Auth: verify CRON_SECRET to prevent unauthorized triggers
  const secret = request.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    let generated = 0;

    for (const user of users) {
      const userId = user.id;

      // ── 1. Weekly Report ─────────────────────────────────────────────────
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const existing = await prisma.weeklyReport.findFirst({
        where: { userId, createdAt: { gte: weekStart } },
      });

      if (!existing) {
        const data = await generateWeeklyReport(userId);
        if (data) {
          await prisma.weeklyReport.create({
            data: {
              userId,
              weekNumber: data.weekNumber,
              year: data.year,
              period: data.period,
              totalStudyMinutes: data.totalStudyMinutes,
              totalExp: data.totalExp,
              questCompletionRate: data.questCompletionRate,
              summary: data.summary,
              topRecommendation: data.topRecommendation,
              bestDay: data.bestDay,
              topAchievement: data.topAchievement,
              biggestImprovement: data.biggestImprovement,
              skillStats: JSON.stringify(data.skillStats),
              vsLastWeek: JSON.stringify(data.vsLastWeek),
            },
          });
          generated++;

          // Push: weekly report ready
          await sendInsightPush(userId, {
            title: "Báo cáo tuần của bạn",
            body: "Xem tiến độ học tập 7 ngày qua",
            url: "/analytics/weekly",
            tag: "weekly-report",
          });
        }
      }

      // ── 2. Insight Push Notifications (14.10) ─────────────────────────
      const profile = await prisma.learningProfile.findUnique({ where: { userId } });
      if (profile) {
        const now = new Date();
        const since7 = new Date(now.getTime() - 7 * 864e5);

        // weakness_alert — speaking score < 45
        if (profile.speakingScore < 45) {
          const corrections = Number(profile.avgCorrectionsPerSession ?? 0).toFixed(1);
          await sendInsightPush(userId, {
            title: "Speaking đang yếu",
            body: `Tuần này có ${corrections} corrections/session. Tập thêm 10 phút hôm nay?`,
            url: "/analytics",
            tag: "weakness-alert",
          });
        }

        // strength_highlight — vocab velocity > 10 (strong positive trend)
        if (profile.vocabVelocity > 10) {
          await sendInsightPush(userId, {
            title: "Vocab đang tăng mạnh!",
            body: `+${profile.vocabVelocity.toFixed(0)} điểm tuần này. Duy trì đà này!`,
            url: "/analytics",
            tag: "strength-highlight",
          });
        }

        // neglect_alert — no writing event in last 5 days
        const recentJournal = await prisma.learningEvent.findFirst({
          where: {
            userId,
            eventType: "journal_written",
            createdAt: { gte: new Date(now.getTime() - 5 * 864e5) },
          },
        });
        if (!recentJournal) {
          const lastJournal = await prisma.learningEvent.findFirst({
            where: { userId, eventType: "journal_written" },
            orderBy: { createdAt: "desc" },
          });
          if (lastJournal) {
            const daysSince = Math.floor((now.getTime() - lastJournal.createdAt.getTime()) / 864e5);
            if (daysSince >= 5) {
              await sendInsightPush(userId, {
                title: "Lâu rồi chưa viết Journal",
                body: `${daysSince} ngày không viết. Writing score đang giảm dần.`,
                url: "/journal",
                tag: "neglect-alert",
              });
            }
          }
        }

        // Also check speak neglect
        const recentSpeak = await prisma.learningEvent.findFirst({
          where: {
            userId,
            eventType: { in: ["speak_session_end", "speak_session_start"] },
            createdAt: { gte: since7 },
          },
        });
        if (!recentSpeak) {
          await sendInsightPush(userId, {
            title: "Lâu rồi chưa tập Speaking",
            body: "7 ngày không tập Speak. Speaking score đang giảm dần.",
            url: "/speak",
            tag: "speak-neglect-alert",
          });
        }
      }
    }

    return NextResponse.json({ success: true, generated, usersProcessed: users.length });
  } catch (error) {
    console.error("GET /api/analytics/cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper — sends push to all user's subscriptions, silently fails if none or push fails
async function sendInsightPush(
  userId: string,
  payload: { title: string; body: string; url?: string; tag?: string }
) {
  try {
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    if (subs.length > 0) {
      await sendPushToSubscriptions(subs, payload);
    }
  } catch {
    // Push is always optional — never block cron
  }
}
