const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const QUESTS = [
    {
        key: "exam_complete",
        name: "Take an Exam",
        icon: "📝",
        description: "Hoàn thành 1 bài Full Exam",
        type: "weekly_challenge",
        expReward: 80,
    },
    {
        key: "exam_improvement",
        name: "Score Improvement",
        icon: "📈",
        description: "Đạt điểm cao hơn lần thi trước",
        type: "side_quest",
        expReward: 50,
    },
];

async function main() {
    console.log("Seeding exam quests...");
    for (const quest of QUESTS) {
        const existing = await prisma.dailyQuestTemplate.findUnique({
            where: { key: quest.key },
        });
        if (!existing) {
            await prisma.dailyQuestTemplate.create({ data: quest });
            console.log(`  ✓ ${quest.key}`);
        } else {
            console.log(`  ⏭ ${quest.key} (exists)`);
        }
    }
    console.log("Done!");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
