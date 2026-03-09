require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const quests = [
    // Main Quests (daily)
    {
        key: "anki_review",
        name: "Anki Review",
        description: "Review tất cả cards due hôm nay",
        expReward: 30,
        type: "main",
        icon: "📚",
    },
    {
        key: "listen_15min",
        name: "Listen 15 min",
        description: "Nghe tiếng Anh ít nhất 15 phút",
        expReward: 25,
        type: "main",
        icon: "👂",
    },
    {
        key: "speak_practice",
        name: "Speak Practice",
        description: "Luyện nói ít nhất 10 phút",
        expReward: 25,
        type: "main",
        icon: "🗣️",
    },
    {
        key: "read_article",
        name: "Read Article",
        description: "Đọc 1 bài báo tiếng Anh",
        expReward: 20,
        type: "main",
        icon: "📰",
    },
    // Side Quests (daily)
    {
        key: "learn_10_words",
        name: "Learn 10 Words",
        description: "Thêm 10 từ mới vào Anki deck",
        expReward: 20,
        type: "side",
        icon: "📝",
    },
    {
        key: "write_journal",
        name: "Write Journal",
        description: "Viết nhật ký tiếng Anh (100+ từ)",
        expReward: 30,
        type: "side",
        icon: "✍️",
    },
    {
        key: "shadowing",
        name: "Shadowing",
        description: "Shadow 1 đoạn audio 5 phút",
        expReward: 20,
        type: "side",
        icon: "🎙️",
    },
    {
        key: "watch_nosub",
        name: "Watch No-Sub",
        description: "Xem video tiếng Anh không phụ đề 10 phút",
        expReward: 25,
        type: "side",
        icon: "🎬",
    },
    // Weekly Challenge
    {
        key: "weekly_podcast_summary",
        name: "Podcast Summary",
        description: "Nghe + tóm tắt 1 podcast bằng tiếng Anh",
        expReward: 100,
        type: "weekly",
        icon: "🎧",
    },
    {
        key: "weekly_writing_analysis",
        name: "Writing Analysis",
        description: "Viết 1 bài phân tích 300+ từ bằng tiếng Anh",
        expReward: 100,
        type: "weekly",
        icon: "📊",
    },
    {
        key: "weekly_debate",
        name: "AI Debate",
        description: "Debate với AI 20 phút về 1 chủ đề",
        expReward: 100,
        type: "weekly",
        icon: "⚔️",
    },
    {
        key: "weekly_stats_review",
        name: "Weekly Review",
        description: "Review tuần + tự chấm stats",
        expReward: 50,
        type: "weekly",
        icon: "📋",
    },
];

async function main() {
    console.log("🌱 Seeding quest templates...");
    for (const q of quests) {
        await prisma.dailyQuestTemplate.upsert({
            where: { key: q.key },
            update: {},
            create: q,
        });
    }
    console.log(`✅ ${quests.length} quests seeded`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
