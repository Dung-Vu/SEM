export type NotificationType =
  | "streak_warning" // Sắp mất streak
  | "streak_milestone" // Đạt 7/14/30/100 ngày
  | "anki_reminder" // Có cards cần review
  | "anki_overdue" // Quá hạn review nhiều ngày
  | "quest_reminder" // Chưa xong quest
  | "quest_almost_done" // Còn 1-2 quest nữa là xong
  | "level_up" // Lên level
  | "weekly_report" // Báo cáo thứ Hai
  | "ai_insight" // ORACLE phát hiện pattern
  | "personal_best" // Phá kỷ lục
  | "milestone_unlocked"; // Mở khóa milestone
