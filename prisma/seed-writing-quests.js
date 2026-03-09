const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const WRITING_QUESTS = [
    {
        key: "writing_lab",
        name: "Submit Writing",
        description: "Nộp 1 bài Writing Lab",
        expReward: 40,
        type: "side_quest",
        icon: "✍️",
    },
    {
        key: "writing_improvement",
        name: "Writing Improvement",
        description: "Đạt điểm cao hơn bài trước",
        expReward: 50,
        type: "weekly_challenge",
        icon: "🏆",
    },
];

async function main() {
    console.log("Seeding writing quests...");

    for (const q of WRITING_QUESTS) {
        await prisma.dailyQuestTemplate.upsert({
            where: { key: q.key },
            update: {},
            create: q,
        });
        console.log(`  ✓ ${q.icon} ${q.key}: ${q.name} (${q.expReward} EXP)`);
    }

    console.log("Done!");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
