export interface UserData {
  id: string;
  username: string;
  level: number;
  exp: number;
  streak: number;
  lastCheckIn: string | null;
  createdAt: string;
  stats: StatsData | null;
}

export interface StatsData {
  vocab: number;
  grammar: number;
  listening: number;
  speaking: number;
  writing: number;
}

export interface KingdomInfo {
  name: string;
  title: string;
  cefr: string;
  icon: string;
}

export interface LevelProgress {
  current: number;
  needed: number;
}

export interface WeeklyStatsLogData {
  id: string;
  weekNumber: number;
  year: number;
  vocab: number;
  grammar: number;
  listening: number;
  speaking: number;
  writing: number;
  totalExp: number;
  highlight: string;
  struggle: string;
  focus: string;
  createdAt: string;
}

export interface ActivityLogData {
  id: string;
  source: string;
  amount: number;
  description: string;
  createdAt: string;
}
