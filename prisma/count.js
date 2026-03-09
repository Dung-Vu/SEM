require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
    const words = await p.word.count();
    const a1 = await p.word.count({ where: { level: "A1" } });
    const a2 = await p.word.count({ where: { level: "A2" } });
    const b1 = await p.word.count({ where: { level: "B1" } });
    const b2 = await p.word.count({ where: { level: "B2" } });
    const cards = await p.srsCard.count();
    const quests = await p.dailyQuestTemplate.count();
    const resources = await p.resource.count();
    const achievements = await p.achievement.count();
    console.log(`📊 Database Stats:`);
    console.log(
        `   Words: ${words} (A1: ${a1}, A2: ${a2}, B1: ${b1}, B2: ${b2})`,
    );
    console.log(`   SRS Cards: ${cards}`);
    console.log(`   Quests: ${quests}`);
    console.log(`   Resources: ${resources}`);
    console.log(`   Achievements: ${achievements}`);
}

main().then(() => p.$disconnect());
