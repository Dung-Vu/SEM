import { generateWeeklyReport } from "@/lib/weekly-report";
import { getLocalDayOfWeek } from "@/lib/streak";
import { shouldSendNotification } from "./scheduler";
import { sendUserPushNotification } from "./push-handler";

export async function checkAndSendWeeklyReport(userId: string) {
  // Only send on Mondays (day 1 in Vi timezone)
  if (getLocalDayOfWeek() !== 1) return;

  if (!(await shouldSendNotification(userId, "weekly_report"))) {
    return;
  }

  const report = await generateWeeklyReport(userId);
  if (!report) return;

  const trend =
    report.vsLastWeek.exp > 0 ? "📈" : report.vsLastWeek.exp < 0 ? "📉" : "➡️";
  const expChange = Math.abs(report.vsLastWeek.exp);

  await sendUserPushNotification(userId, "weekly_report", {
    title: `📊 Báo cáo tuần ${report.weekNumber} của bạn`,
    body: `${report.totalStudyMinutes} phút · ${report.totalExp} EXP · ${trend} ${expChange > 0 ? `${trend === "📈" ? "+" : "-"}${expChange}` : "±0"} vs tuần trước`,
    data: { url: "/analytics/weekly" },
  });
}
