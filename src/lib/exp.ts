// Level thresholds from game design
const LEVEL_THRESHOLDS = [
  { minLevel: 1, maxLevel: 10, title: "Beginner Warrior", cefr: "A1-A2", kingdom: "Beginner Village", expStart: 0, expEnd: 5000 },
  { minLevel: 11, maxLevel: 25, title: "Grammar Knight", cefr: "B1", kingdom: "Grammar Forest", expStart: 5000, expEnd: 20000 },
  { minLevel: 26, maxLevel: 45, title: "Fluency Mage", cefr: "B2", kingdom: "Fluency Castle", expStart: 20000, expEnd: 50000 },
  { minLevel: 46, maxLevel: 70, title: "Language Champion", cefr: "C1", kingdom: "IELTS Arena", expStart: 50000, expEnd: 120000 },
  { minLevel: 71, maxLevel: 100, title: "English Master", cefr: "C2", kingdom: "Legend Realm", expStart: 120000, expEnd: 250000 },
];

export function getLevelFromExp(totalExp: number): number {
  if (totalExp <= 0) return 1;
  if (totalExp >= 250000) return 100 + Math.floor((totalExp - 250000) / 5000);

  for (const tier of LEVEL_THRESHOLDS) {
    if (totalExp < tier.expEnd) {
      const tierRange = tier.expEnd - tier.expStart;
      const levelRange = tier.maxLevel - tier.minLevel;
      const progress = (totalExp - tier.expStart) / tierRange;
      return tier.minLevel + Math.floor(progress * levelRange);
    }
  }
  return 100;
}

export function getExpForNextLevel(currentLevel: number): { current: number; needed: number } {
  const tier = LEVEL_THRESHOLDS.find(
    (t) => currentLevel >= t.minLevel && currentLevel <= t.maxLevel
  ) ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];

  const tierRange = tier.expEnd - tier.expStart;
  const levelRange = tier.maxLevel - tier.minLevel;
  const expPerLevel = tierRange / levelRange;

  const levelInTier = currentLevel - tier.minLevel;
  const currentLevelStart = Math.floor(tier.expStart + levelInTier * expPerLevel);
  const nextLevelStart = Math.floor(tier.expStart + (levelInTier + 1) * expPerLevel);

  return { current: currentLevelStart, needed: nextLevelStart };
}

export function getKingdomInfo(level: number) {
  const tier = LEVEL_THRESHOLDS.find(
    (t) => level >= t.minLevel && level <= t.maxLevel
  ) ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];

  return {
    name: tier.kingdom,
    title: tier.title,
    cefr: tier.cefr,
    icon: getKingdomIcon(tier.kingdom),
  };
}

function getKingdomIcon(kingdom: string): string {
  const icons: Record<string, string> = {
    "Beginner Village": "🏠",
    "Grammar Forest": "🌲",
    "Fluency Castle": "🏰",
    "IELTS Arena": "⚔️",
    "Legend Realm": "🌟",
  };
  return icons[kingdom] ?? "🏠";
}

// Streak bonus multiplier
export function getStreakBonus(streak: number): number {
  if (streak >= 100) return 2.0;
  if (streak >= 60) return 1.75;
  if (streak >= 30) return 1.5;
  if (streak >= 14) return 1.3;
  if (streak >= 7) return 1.25;
  if (streak >= 3) return 1.1;
  return 1.0;
}
