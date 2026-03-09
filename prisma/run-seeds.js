// run-seeds.js — Safely run all Phase 12 vocab seeds using upsert
// Usage: node prisma/run-seeds.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Import word arrays from each seed file directly
const b1Words = require("./seed-words-b1-expanded.js");
const b2Words = require("./seed-words-b2.js");
const c1Words = require("./seed-words-c1.js");
const specialtyWords = require("./seed-words-specialty.js");

async function seedWords(words, label) {
    let added = 0,
        skipped = 0,
        errors = 0;
    for (const w of words) {
        try {
            const result = await prisma.word.upsert({
                where: { english: w.english },
                update: {}, // don't overwrite existing
                create: {
                    english: w.english,
                    vietnamese: w.vietnamese || "",
                    definition: w.definition || "",
                    exampleSentence: w.exampleSentence || "",
                    level: w.level || "B1",
                    tags: Array.isArray(w.tags)
                        ? w.tags.join(",")
                        : w.tags || "",
                },
            });
            if (result) added++;
        } catch {
            errors++;
        }
    }
    console.log(
        `${label}: ${added} upserted, ${skipped} skipped, ${errors} errors`,
    );
}

async function main() {
    console.log("🚀 Starting Phase 12 vocab seed...");

    const [b1, b2, c1, spec] = await Promise.all([
        prisma.word.count({ where: { level: "B1" } }),
        prisma.word.count({ where: { level: "B2" } }),
        prisma.word.count({ where: { level: "C1" } }),
        prisma.word.count({ where: { level: { in: ["B1", "B2", "C1"] } } }),
    ]);
    console.log(`📊 Before: B1=${b1}, B2=${b2}, C1=${c1}`);

    if (Array.isArray(b1Words)) await seedWords(b1Words, "B1 Expanded");
    if (Array.isArray(b2Words)) await seedWords(b2Words, "B2");
    if (Array.isArray(c1Words)) await seedWords(c1Words, "C1");
    if (Array.isArray(specialtyWords))
        await seedWords(specialtyWords, "Specialty");

    const total = await prisma.word.count();
    const b1After = await prisma.word.count({ where: { level: "B1" } });
    const b2After = await prisma.word.count({ where: { level: "B2" } });
    const c1After = await prisma.word.count({ where: { level: "C1" } });
    console.log(`\n✅ Done! Total: ${total} words`);
    console.log(`   B1: ${b1After}, B2: ${b2After}, C1: ${c1After}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
