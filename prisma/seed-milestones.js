// Seed Milestones — Phase 12.6
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const milestones = [
    {
        key: "M01",
        title: "First Steps",
        description: "Complete your first Anki review session",
        targetType: "anki_sessions",
        targetValue: 1,
        rewardDesc: "Scholar's Badge",
        expReward: 100,
        order: 1,
    },
    {
        key: "M02",
        title: "Word Collector",
        description: "Master 25 vocabulary cards",
        targetType: "cards_mastered",
        targetValue: 25,
        rewardDesc: "Lexicon Badge",
        expReward: 200,
        order: 2,
    },
    {
        key: "M03",
        title: "First Conversation",
        description: "Complete your first AI speaking session",
        targetType: "ai_sessions",
        targetValue: 1,
        rewardDesc: "Speaker's Badge",
        expReward: 150,
        order: 3,
    },
    {
        key: "M04",
        title: "Streak Starter",
        description: "Maintain a 3-day learning streak",
        targetType: "streak",
        targetValue: 3,
        rewardDesc: "Flame Badge I",
        expReward: 200,
        order: 4,
    },
    {
        key: "M05",
        title: "Journal Keeper",
        description: "Write 5 journal entries",
        targetType: "journal_entries",
        targetValue: 5,
        rewardDesc: "Scribe's Badge",
        expReward: 250,
        order: 5,
    },
    {
        key: "M06",
        title: "Word Master I",
        description: "Master 100 vocabulary cards",
        targetType: "cards_mastered",
        targetValue: 100,
        rewardDesc: "Centurion Badge",
        expReward: 500,
        order: 6,
    },
    {
        key: "M07",
        title: "Weekly Champion",
        description: "Complete your first Weekly Boss Challenge",
        targetType: "boss_completions",
        targetValue: 1,
        rewardDesc: "Boss Slayer Badge",
        expReward: 300,
        order: 7,
    },
    {
        key: "M08",
        title: "Polyglot Streak",
        description: "Maintain a 7-day learning streak",
        targetType: "streak",
        targetValue: 7,
        rewardDesc: "Flame Badge II",
        expReward: 400,
        order: 8,
    },
    {
        key: "M09",
        title: "Level Up",
        description: "Reach Level 5",
        targetType: "level",
        targetValue: 5,
        rewardDesc: "Knight's Badge",
        expReward: 500,
        order: 9,
    },
    {
        key: "M10",
        title: "Word Master II",
        description: "Master 250 vocabulary cards",
        targetType: "cards_mastered",
        targetValue: 250,
        rewardDesc: "Elite Lexicon Badge",
        expReward: 750,
        order: 10,
    },
    {
        key: "M11",
        title: "Iron Streak",
        description: "Maintain a 30-day learning streak",
        targetType: "streak",
        targetValue: 30,
        rewardDesc: "Iron Will Badge",
        expReward: 1000,
        order: 11,
    },
    {
        key: "M12",
        title: "Legend",
        description: "Reach Level 10 — True Language Master",
        targetType: "level",
        targetValue: 10,
        rewardDesc: "Legendary Crown",
        expReward: 2000,
        order: 12,
    },
];

async function main() {
    let added = 0;
    for (const m of milestones) {
        await prisma.milestone.upsert({
            where: { key: m.key },
            update: {},
            create: m,
        });
        added++;
    }
    const count = await prisma.milestone.count();
    console.log(`✅ Milestones: ${count} total in DB`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
