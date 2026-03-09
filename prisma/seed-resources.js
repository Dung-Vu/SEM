require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const resources = [
    // Podcasts
    {
        name: "6 Minute English (BBC)",
        link: "https://www.bbc.co.uk/learningenglish/english/features/6-minute-english",
        category: "podcast",
        level: "B1",
        expReward: 15,
        notes: "Short episodes, perfect for daily listening",
    },
    {
        name: "All Ears English",
        link: "https://www.allearsenglish.com/",
        category: "podcast",
        level: "B1",
        expReward: 15,
        notes: "Natural conversation between hosts",
    },
    {
        name: "TED Talks Daily",
        link: "https://www.ted.com/podcasts/ted-talks-daily",
        category: "podcast",
        level: "B2",
        expReward: 20,
        notes: "Diverse topics, clear speakers",
    },
    {
        name: "The Daily (NYT)",
        link: "https://www.nytimes.com/column/the-daily",
        category: "podcast",
        level: "C1",
        expReward: 25,
        notes: "News analysis, fast speech",
    },
    // YouTube
    {
        name: "English with Lucy",
        link: "https://www.youtube.com/@EnglishwithLucy",
        category: "youtube",
        level: "A2",
        expReward: 10,
        notes: "Grammar & pronunciation",
    },
    {
        name: "TED-Ed",
        link: "https://www.youtube.com/@TEDEd",
        category: "youtube",
        level: "B1",
        expReward: 15,
        notes: "Educational animations, clear narration",
    },
    {
        name: "Kurzgesagt",
        link: "https://www.youtube.com/@kurzgesagt",
        category: "youtube",
        level: "B2",
        expReward: 20,
        notes: "Science topics, vocabulary building",
    },
    {
        name: "Fireship",
        link: "https://www.youtube.com/@Fireship",
        category: "youtube",
        level: "B2",
        expReward: 20,
        notes: "Tech/coding content, fast-paced",
    },
    // Series & Film
    {
        name: "Friends",
        link: "",
        category: "series",
        level: "B1",
        expReward: 30,
        notes: "Casual conversation, humor",
    },
    {
        name: "The Office (US)",
        link: "",
        category: "series",
        level: "B1",
        expReward: 30,
        notes: "Office vocabulary, sarcasm",
    },
    {
        name: "Breaking Bad",
        link: "",
        category: "series",
        level: "B2",
        expReward: 40,
        notes: "Drama, complex dialogue",
    },
    {
        name: "Sherlock (BBC)",
        link: "",
        category: "series",
        level: "C1",
        expReward: 50,
        notes: "Rapid speech, British accent",
    },
    // Books
    {
        name: "Harry Potter (Book 1)",
        link: "",
        category: "book",
        level: "B1",
        expReward: 80,
        notes: "Start with Philosopher's Stone",
    },
    {
        name: "Atomic Habits",
        link: "",
        category: "book",
        level: "B2",
        expReward: 100,
        notes: "Non-fiction, useful vocabulary",
    },
    {
        name: "The Alchemist",
        link: "",
        category: "book",
        level: "B1",
        expReward: 80,
        notes: "Simple prose, inspiring story",
    },
    // Articles
    {
        name: "Medium (Tech articles)",
        link: "https://medium.com/",
        category: "article",
        level: "B2",
        expReward: 10,
        notes: "Read 1 article per day",
    },
    {
        name: "The Guardian",
        link: "https://www.theguardian.com/",
        category: "article",
        level: "B2",
        expReward: 10,
        notes: "News, opinion pieces",
    },
    {
        name: "Hacker News",
        link: "https://news.ycombinator.com/",
        category: "article",
        level: "B2",
        expReward: 10,
        notes: "Tech community discussions",
    },
];

async function main() {
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error("No user found");
        return;
    }
    console.log("🌱 Seeding resources...");
    for (const r of resources) {
        const existing = await prisma.resource.findFirst({
            where: { userId: user.id, name: r.name },
        });
        if (!existing) {
            await prisma.resource.create({ data: { ...r, userId: user.id } });
        }
    }
    console.log(`✅ ${resources.length} resources seeded`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
