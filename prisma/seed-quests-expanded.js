require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Weekly boss challenges — 12 for the first 3 months
const weeklyChallenges = [
    {
        key: "weekly_vocab_sprint",
        name: "📖 Vocab Sprint",
        description: "Review 50 flashcards in one day",
        expReward: 100,
        type: "weekly",
        icon: "📖",
    },
    {
        key: "weekly_writing_marathon",
        name: "✍️ Writing Marathon",
        description: "Write a 200+ word journal entry",
        expReward: 100,
        type: "weekly",
        icon: "✍️",
    },
    {
        key: "weekly_listening_beast",
        name: "🎧 Listening Beast",
        description: "Complete an English podcast (mark as Done in Resources)",
        expReward: 100,
        type: "weekly",
        icon: "🎧",
    },
    {
        key: "weekly_word_collector",
        name: "📚 Word Collector",
        description: "Add 10 new words to your Anki deck this week",
        expReward: 120,
        type: "weekly",
        icon: "📚",
    },
    {
        key: "weekly_streak_guardian",
        name: "🔥 Streak Guardian",
        description: "Maintain a 7-day streak without breaking",
        expReward: 150,
        type: "weekly",
        icon: "🔥",
    },
    {
        key: "weekly_conversation_prep",
        name: "💬 Conversation Prep",
        description: "Write 5 journal entries about different topics",
        expReward: 120,
        type: "weekly",
        icon: "💬",
    },
    {
        key: "weekly_grammar_detective",
        name: "🧠 Grammar Detective",
        description: "Review 30 cards with 80%+ accuracy",
        expReward: 100,
        type: "weekly",
        icon: "🧠",
    },
    {
        key: "weekly_daily_warrior",
        name: "🎯 Daily Warrior",
        description: "Complete all daily quests for 5 consecutive days",
        expReward: 150,
        type: "weekly",
        icon: "🎯",
    },
    {
        key: "weekly_reflection",
        name: "📝 Reflection Master",
        description: "Write a monthly review with all 3 sections",
        expReward: 100,
        type: "weekly",
        icon: "📝",
    },
    {
        key: "weekly_resource_explorer",
        name: "🌟 Resource Explorer",
        description: "Start 3 new learning resources",
        expReward: 100,
        type: "weekly",
        icon: "🌟",
    },
    {
        key: "weekly_speed_reviewer",
        name: "⚡ Speed Reviewer",
        description: "Complete 100 SRS card reviews total this week",
        expReward: 150,
        type: "weekly",
        icon: "⚡",
    },
    {
        key: "weekly_perfect_day",
        name: "🏆 Perfect Day",
        description: "Earn 100+ EXP in a single day",
        expReward: 200,
        type: "weekly",
        icon: "🏆",
    },
];

async function main() {
    console.log("🌱 Seeding weekly challenges...");
    let count = 0;
    for (const q of weeklyChallenges) {
        const existing = await prisma.dailyQuestTemplate.findUnique({
            where: { key: q.key },
        });
        if (existing) continue;
        await prisma.dailyQuestTemplate.create({ data: q });
        count++;
    }
    console.log(`✅ ${count} weekly challenges seeded`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
