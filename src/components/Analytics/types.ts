// ─── Shared types for Analytics components ────────────────────────────────
//     Centralised here so components can import without circular deps

export interface LearningProfile {
  vocabScore: number;
  speakingScore: number;
  listeningScore: number;
  writingScore: number;
  grammarScore: number;
  vocabVelocity: number;
  speakingVelocity: number;
  listeningVelocity: number;
  writingVelocity: number;
  grammarVelocity: number;
  strongestSkill: string;
  weakestSkill: string;
  consistencyScore: number;
  bestTimeOfDay: string;
  ankiRetentionRate: number;
  avgCorrectionsPerSession: number;
  commonErrorTypes: string[];
  avgSessionMin: number;
}

export interface Weakness {
  skill: string;
  severity: "high" | "medium" | "low";
  evidence: string;
  recommendation: string;
}

export interface Prediction {
  possible: boolean;
  currentScore: number;
  targetScore: number;
  weeksNeeded?: number;
  targetDate?: string;
  avgVelocity?: number;
  message: string;
}

export interface Insight {
  id: string;
  type: string;
  content: string;
  createdAt: string;
}

export interface StreamEvent {
  id: string;
  icon: string;
  text: string;
  time: string;
}

export interface AnalyticsData {
  profile: LearningProfile;
  weaknesses: Weakness[];
  prediction: Prediction;
  heatmap: Record<string, { totalMin: number; events: number }>;
  weeklyActivity: Record<string, { totalMin: number; events: number }>;
  weeklyExp: number;
  velocityHistory: {
    date: string;
    anki: number;
    journal: number;
    speak: number;
  }[];
}
