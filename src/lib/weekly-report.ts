import { prisma } from "@/lib/prisma";

interface WeeklyReportData {
  weekNumber: number;
  year: number;
  period: string;
  totalStudyMinutes: number;
  totalExp: number;
  questCompletionRate: number;
  summary: string;
  topRecommendation: string;
  bestDay: string;
  topAchievement: string;
  biggestImprovement: string;
  skillStats: SkillStat[];
  vsLastWeek: VsLastWeek;
}

interface SkillStat {
  skill: string;
  sessionsCount: number;
  scoreChange: number;
  trend: "up" | "down" | "stable";
}

interface VsLastWeek {
  studyTime: number;
  exp: number;
  consistency: number;
}

function getWeekNumber(date: Date): { weekNumber: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { weekNumber, year: d.getUTCFullYear() };
}

function formatPeriod(weekAgo: Date, now: Date): string {
  const fmt = (d: Date) => d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  return `${fmt(weekAgo)} - ${fmt(now)}`;
}

async function callQwen(prompt: string): Promise<string> {
  const baseUrl = process.env.AI_BASE_URL || "https://coding-intl.dashscope.aliyuncs.com/v1";
  const apiKey = process.env.AI_API_KEY || "";
  const model = process.env.AI_MODEL || "qwen3.5-plus";

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Bạn là coach tiếng Anh. Viết tóm tắt tuần học tập ngắn gọn bằng tiếng Việt, tối đa 3 câu. Cụ thể, không sáo rỗng.",
          },
          { role: "user", content: prompt },
        ],
        stream: false,
        max_tokens: 200,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  } catch {
    return "";
  }
}

export async function generateWeeklyReport(userId: string): Promise<WeeklyReportData | null> {
  const now = new Date();
  const since7 = new Date(now.getTime() - 7 * 864e5);
  const since14 = new Date(now.getTime() - 14 * 864e5);

  const { weekNumber, year } = getWeekNumber(now);
  const period = formatPeriod(since7, now);

  // Total study minutes from activity logs
  const thisWeekLogs = await prisma.activityLog.findMany({
    where: { userId, createdAt: { gte: since7 } },
    select: { amount: true, createdAt: true, source: true, description: true },
  });
  const lastWeekLogs = await prisma.activityLog.findMany({
    where: { userId, createdAt: { gte: since14, lt: since7 } },
    select: { amount: true },
  });

  const totalExp = thisWeekLogs.reduce((s, l) => s + l.amount, 0);
  const lastWeekExp = lastWeekLogs.reduce((s, l) => s + l.amount, 0);

  // Speak sessions for duration
  const speakSessions = await prisma.conversationSession.findMany({
    where: { userId, createdAt: { gte: since7 } },
    select: { duration: true, createdAt: true },
  });
  const speakMinutesThisWeek = speakSessions.reduce((s, e) => s + Math.round(e.duration / 60), 0);

  // Anki review counts
  const ankiCount = await prisma.reviewLog.count({ where: { userId, reviewedAt: { gte: since7 } } });

  // Journal
  const journalEntries = await prisma.journalEntry.findMany({
    where: { userId, createdAt: { gte: since7 } },
    select: { wordCount: true, createdAt: true },
  });

  // Total study minutes approx: anki (1 min/5 cards) + speak + journal
  const totalStudyMinutes = Math.round(ankiCount / 5) + speakMinutesThisWeek + journalEntries.length * 5;

  // Quest completion rate
  const questsThisWeek = await prisma.learningEvent.count({
    where: { userId, eventType: "quest_completed", createdAt: { gte: since7 } },
  });
  const questCompletionRate = Math.min(100, Math.round((questsThisWeek / (8 * 7)) * 100));

  // Best day (most minutes)
  const dayMap: Record<string, number> = {};
  const dayNames = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  for (const log of thisWeekLogs) {
    const key = log.createdAt.toISOString().slice(0, 10);
    dayMap[key] = (dayMap[key] ?? 0) + log.amount;
  }
  const bestDayKey = Object.keys(dayMap).reduce((a, b) => (dayMap[a] >= dayMap[b] ? a : b), Object.keys(dayMap)[0] ?? "");
  const bestDay = bestDayKey
    ? `${dayNames[new Date(bestDayKey).getDay()]} — ${dayMap[bestDayKey]} EXP`
    : "Chưa có data";

  // Vs last week
  const lastWeekSpeakMinutes = await prisma.conversationSession.findMany({
    where: { userId, createdAt: { gte: since14, lt: since7 } },
    select: { duration: true },
  }).then(sessions => sessions.reduce((s, e) => s + Math.round(e.duration / 60), 0));

  const vsLastWeek: VsLastWeek = {
    studyTime: totalStudyMinutes - Math.round(lastWeekSpeakMinutes + ankiCount / 5),
    exp: totalExp - lastWeekExp,
    consistency: questCompletionRate,
  };

  // Skill stats
  const skillStats: SkillStat[] = [
    {
      skill: "Vocab",
      sessionsCount: ankiCount,
      scoreChange: ankiCount > 10 ? 3 : ankiCount > 5 ? 1 : -1,
      trend: ankiCount > 10 ? "up" : ankiCount > 0 ? "stable" : "down",
    },
    {
      skill: "Speaking",
      sessionsCount: speakSessions.length,
      scoreChange: speakSessions.length >= 3 ? 2 : speakSessions.length > 0 ? 0 : -2,
      trend: speakSessions.length >= 3 ? "up" : speakSessions.length > 0 ? "stable" : "down",
    },
    {
      skill: "Writing",
      sessionsCount: journalEntries.length,
      scoreChange: journalEntries.length >= 5 ? 3 : journalEntries.length > 0 ? 1 : -1,
      trend: journalEntries.length >= 5 ? "up" : journalEntries.length > 0 ? "stable" : "down",
    },
  ];

  // Top achievement
  const topAchievement =
    questsThisWeek >= 8 * 7
      ? "Hoàn thành tất cả quests trong tuần!"
      : ankiCount >= 100
      ? `Học ${ankiCount} thẻ Anki trong tuần`
      : speakSessions.length >= 5
      ? `Tập Speaking ${speakSessions.length} buổi`
      : journalEntries.length >= 5
      ? `Viết Journal ${journalEntries.length} ngày`
      : totalExp > 500
      ? `Kiếm được ${totalExp} EXP`
      : "Tiếp tục học đều mỗi ngày";

  const biggestImprovement = skillStats
    .filter((s) => s.trend === "up")
    .sort((a, b) => b.scoreChange - a.scoreChange)[0]?.skill ?? "Chưa có cải thiện rõ rệt";

  // AI summary
  const summaryPrompt = `
Tuần ${weekNumber}/${year} (${period}):
- Tổng EXP: ${totalExp} (tuần trước: ${lastWeekExp})
- Anki: ${ankiCount} cards
- Speaking: ${speakSessions.length} sessions (${speakMinutesThisWeek} phút)
- Journal: ${journalEntries.length} entries
- Quests: ${questsThisWeek} completed
- Ngày học nhiều nhất: ${bestDay}

Hãy tóm tắt tuần học tập này và đưa ra 1 khuyến nghị cụ thể cho tuần tới.`;

  const aiResponse = await callQwen(summaryPrompt);
  const [summary, ...recParts] = aiResponse.split(/\n\n|\. Tuần tới/);
  const topRecommendation = recParts.join(" ").trim() || "Duy trì thói quen học mỗi ngày, tập trung vào kỹ năng yếu nhất.";

  return {
    weekNumber,
    year,
    period,
    totalStudyMinutes,
    totalExp,
    questCompletionRate,
    summary: summary || aiResponse,
    topRecommendation,
    bestDay,
    topAchievement,
    biggestImprovement,
    skillStats,
    vsLastWeek,
  };
}
