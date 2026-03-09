/**
 * SM-2 Spaced Repetition Algorithm
 * Based on SuperMemo SM-2 with modifications
 *
 * Rating scale: 1-4
 *   1 = Again (forgot completely)
 *   2 = Hard  (recalled with difficulty)
 *   3 = Good  (recalled correctly)
 *   4 = Easy  (recalled effortlessly)
 */

interface SrsState {
  intervalDays: number;
  easeFactor: number;
  reviewsCount: number;
  lapseCount: number;
  status: string;
}

interface SrsResult {
  intervalDays: number;
  easeFactor: number;
  nextReview: Date;
  reviewsCount: number;
  lapseCount: number;
  status: string;
}

export function calculateSrs(state: SrsState, rating: number): SrsResult {
  let { intervalDays, easeFactor, reviewsCount, lapseCount, status } = state;

  // Clamp rating
  rating = Math.max(1, Math.min(4, rating));

  if (rating === 1) {
    // Again: reset interval, increase lapse count
    intervalDays = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    lapseCount += 1;
    status = "learning";
  } else if (rating === 2) {
    // Hard: small increase
    if (intervalDays === 0) {
      intervalDays = 1;
    } else {
      intervalDays = Math.max(1, Math.ceil(intervalDays * 1.2));
    }
    easeFactor = Math.max(1.3, easeFactor - 0.15);
    status = "review";
  } else if (rating === 3) {
    // Good: standard increase
    if (intervalDays === 0) {
      intervalDays = 1;
    } else if (intervalDays === 1) {
      intervalDays = 3;
    } else {
      intervalDays = Math.ceil(intervalDays * easeFactor);
    }
    status = "review";
  } else {
    // Easy: larger increase
    if (intervalDays === 0) {
      intervalDays = 3;
    } else if (intervalDays === 1) {
      intervalDays = 4;
    } else {
      intervalDays = Math.ceil(intervalDays * easeFactor * 1.3);
    }
    easeFactor = Math.min(3.0, easeFactor + 0.15);
    status = "review";
  }

  reviewsCount += 1;

  // Cap max interval at 365 days
  intervalDays = Math.min(365, intervalDays);

  // Mastered if interval >= 30
  if (intervalDays >= 30) {
    status = "mastered";
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + intervalDays);
  nextReview.setHours(0, 0, 0, 0);

  return {
    intervalDays,
    easeFactor: Math.round(easeFactor * 100) / 100,
    nextReview,
    reviewsCount,
    lapseCount,
    status,
  };
}

export function getRatingLabel(rating: number): { label: string; color: string; emoji: string } {
  switch (rating) {
    case 1: return { label: "Again", color: "#f87171", emoji: "🔴" };
    case 2: return { label: "Hard", color: "#fbbf24", emoji: "🟡" };
    case 3: return { label: "Good", color: "#34d399", emoji: "🟢" };
    case 4: return { label: "Easy", color: "#818cf8", emoji: "🔵" };
    default: return { label: "Unknown", color: "#64748b", emoji: "⚪" };
  }
}
