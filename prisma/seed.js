require("dotenv/config");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const achievements = [
    {
        key: "first_flame",
        name: "First Flame",
        description: "Streak 7 ngày đầu tiên",
        icon: "🔥",
        condition: "streak >= 7",
    },
    {
        key: "word_collector_1",
        name: "Word Collector I",
        description: "100 Anki cards đã master",
        icon: "📚",
        condition: "mastered_cards >= 100",
    },
    {
        key: "word_collector_2",
        name: "Word Collector II",
        description: "500 Anki cards đã master",
        icon: "📚",
        condition: "mastered_cards >= 500",
    },
    {
        key: "word_collector_3",
        name: "Word Collector III",
        description: "2,000 Anki cards đã master",
        icon: "📚",
        condition: "mastered_cards >= 2000",
    },
    {
        key: "first_words",
        name: "First Words",
        description: "AI conversation 15 phút không bị stuck",
        icon: "🎙️",
        condition: "ai_conversation_15min",
    },
    {
        key: "smooth_talker",
        name: "Smooth Talker",
        description: "AI conversation 30 phút bất kỳ topic",
        icon: "🎙️",
        condition: "ai_conversation_30min",
    },
    {
        key: "journaler",
        name: "Journaler",
        description: "30 English journal entries",
        icon: "✍️",
        condition: "journal_entries >= 30",
    },
    {
        key: "wordsmith",
        name: "Wordsmith",
        description: "Viết bài 500 từ được AI rate C1",
        icon: "✍️",
        condition: "writing_c1_rated",
    },
    {
        key: "sharp_ears",
        name: "Sharp Ears",
        description: "Nghe podcast không cần rewind",
        icon: "👂",
        condition: "podcast_no_rewind",
    },
    {
        key: "no_subtitles",
        name: "No Subtitles",
        description: "Xem phim no-sub, hiểu 70%+",
        icon: "👂",
        condition: "movie_no_subtitles",
    },
    {
        key: "month_warrior",
        name: "Month Warrior",
        description: "Streak 30 ngày",
        icon: "🌟",
        condition: "streak >= 30",
    },
    {
        key: "iron_discipline",
        name: "Iron Discipline",
        description: "Streak 100 ngày",
        icon: "🌟",
        condition: "streak >= 100",
    },
    {
        key: "pro_mode",
        name: "Pro Mode",
        description: "Viết trading analysis bằng tiếng Anh",
        icon: "💼",
        condition: "trading_analysis_en",
    },
    {
        key: "think_different",
        name: "Think Different",
        description: "Nhận ra mình đang think bằng tiếng Anh",
        icon: "🧠",
        condition: "think_in_english",
    },
    {
        key: "the_wanderer",
        name: "The Wanderer",
        description: "Đạt Level 100 · C2 Master",
        icon: "👑",
        condition: "level >= 100",
    },
];

async function main() {
    console.log("🌱 Seeding database...");
    const user = await prisma.user.upsert({
        where: { username: "dung" },
        update: {},
        create: {
            username: "dung",
            level: 1,
            exp: 0,
            streak: 0,
            stats: {
                create: {
                    vocab: 1,
                    grammar: 1,
                    listening: 1,
                    speaking: 1,
                    writing: 1,
                },
            },
        },
    });
    console.log("✅ User created:", user.username);

    for (const ach of achievements) {
        await prisma.achievement.upsert({
            where: { key: ach.key },
            update: {},
            create: ach,
        });
    }
    console.log("✅", achievements.length, "achievements seeded");
    console.log("🎉 Seeding complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
