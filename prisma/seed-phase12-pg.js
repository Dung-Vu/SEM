// Direct PostgreSQL seed script using pg (no Prisma binary)
require("dotenv").config();
const { Client } = require("pg");

const DB_URL = process.env.DATABASE_URL;
const client = new Client({ connectionString: DB_URL, ssl: false });

async function main() {
    await client.connect();
    console.log("✅ Connected to PostgreSQL");

    // Create tables
    await client.query(`
    CREATE TABLE IF NOT EXISTS "Milestone" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "key" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "targetType" TEXT NOT NULL,
      "targetValue" INTEGER NOT NULL,
      "rewardDesc" TEXT NOT NULL DEFAULT '',
      "expReward" INTEGER NOT NULL DEFAULT 0,
      "order" INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "Milestone_key_key" UNIQUE ("key")
    )
  `);
    console.log("✅ Milestone table ready");

    await client.query(`
    CREATE TABLE IF NOT EXISTS "UserMilestone" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "userId" TEXT NOT NULL,
      "milestoneId" TEXT NOT NULL,
      "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "UserMilestone_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "UserMilestone_userId_milestoneId_key" UNIQUE ("userId","milestoneId")
    )
  `);
    console.log("✅ UserMilestone table ready");

    await client.query(`
    CREATE TABLE IF NOT EXISTS "ShadowScript" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "title" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "level" TEXT NOT NULL DEFAULT 'B1',
      "topic" TEXT NOT NULL DEFAULT '',
      "durationSeconds" INTEGER NOT NULL DEFAULT 60,
      "accent" TEXT NOT NULL DEFAULT 'US',
      "tags" TEXT NOT NULL DEFAULT '',
      "source" TEXT NOT NULL DEFAULT '',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ShadowScript_pkey" PRIMARY KEY ("id")
    )
  `);
    console.log("✅ ShadowScript table ready");

    await client.query(`
    CREATE TABLE IF NOT EXISTS "WeeklyBossCompletion" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "userId" TEXT NOT NULL,
      "weekKey" TEXT NOT NULL,
      "bossName" TEXT NOT NULL DEFAULT '',
      "score" INTEGER NOT NULL DEFAULT 0,
      "expReward" INTEGER NOT NULL DEFAULT 0,
      "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "WeeklyBossCompletion_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "WeeklyBossCompletion_userId_weekKey_key" UNIQUE ("userId","weekKey")
    )
  `);
    console.log("✅ WeeklyBossCompletion table ready");

    await client.query(`
    CREATE TABLE IF NOT EXISTS "PushSubscription" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "userId" TEXT NOT NULL,
      "endpoint" TEXT NOT NULL,
      "auth" TEXT NOT NULL DEFAULT '',
      "p256dh" TEXT NOT NULL DEFAULT '',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "PushSubscription_endpoint_key" UNIQUE ("endpoint")
    )
  `);
    console.log("✅ PushSubscription table ready");

    await client.query(`
    CREATE TABLE IF NOT EXISTS "ConversationPrompt" (
      "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
      "modeKey" TEXT NOT NULL,
      "level" TEXT NOT NULL DEFAULT 'B1',
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL DEFAULT '',
      "tips" TEXT NOT NULL DEFAULT '',
      "keywords" TEXT NOT NULL DEFAULT '',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ConversationPrompt_pkey" PRIMARY KEY ("id")
    )
  `);
    console.log("✅ ConversationPrompt table ready");

    // Seed milestones
    const milestones = [
        [
            "M01",
            "First Steps",
            "Complete your first Anki review session",
            "anki_sessions",
            1,
            "Scholar's Badge",
            100,
            1,
        ],
        [
            "M02",
            "Word Collector",
            "Master 25 vocabulary cards",
            "cards_mastered",
            25,
            "Lexicon Badge",
            200,
            2,
        ],
        [
            "M03",
            "First Conversation",
            "Complete your first AI speaking session",
            "ai_sessions",
            1,
            "Speaker's Badge",
            150,
            3,
        ],
        [
            "M04",
            "Streak Starter",
            "Maintain a 3-day learning streak",
            "streak",
            3,
            "Flame Badge I",
            200,
            4,
        ],
        [
            "M05",
            "Journal Keeper",
            "Write 5 journal entries",
            "journal_entries",
            5,
            "Scribe's Badge",
            250,
            5,
        ],
        [
            "M06",
            "Word Master I",
            "Master 100 vocabulary cards",
            "cards_mastered",
            100,
            "Centurion Badge",
            500,
            6,
        ],
        [
            "M07",
            "Weekly Champion",
            "Complete your first Weekly Challenge",
            "boss_completions",
            1,
            "Boss Slayer Badge",
            300,
            7,
        ],
        [
            "M08",
            "Polyglot Streak",
            "Maintain a 7-day learning streak",
            "streak",
            7,
            "Flame Badge II",
            400,
            8,
        ],
        [
            "M09",
            "Level Up",
            "Reach Level 5",
            "level",
            5,
            "Knight's Badge",
            500,
            9,
        ],
        [
            "M10",
            "Word Master II",
            "Master 250 vocabulary cards",
            "cards_mastered",
            250,
            "Elite Lexicon Badge",
            750,
            10,
        ],
        [
            "M11",
            "Iron Streak",
            "Maintain a 30-day learning streak",
            "streak",
            30,
            "Iron Will Badge",
            1000,
            11,
        ],
        [
            "M12",
            "Legend",
            "Reach Level 10 — True Language Master",
            "level",
            10,
            "Legendary Crown",
            2000,
            12,
        ],
    ];
    let msAdded = 0;
    for (const [
        key,
        title,
        desc,
        targetType,
        targetValue,
        rewardDesc,
        expReward,
        order,
    ] of milestones) {
        const res = await client.query(
            `INSERT INTO "Milestone" ("key","title","description","targetType","targetValue","rewardDesc","expReward","order")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT("key") DO NOTHING`,
            [
                key,
                title,
                desc,
                targetType,
                targetValue,
                rewardDesc,
                expReward,
                order,
            ],
        );
        if (res.rowCount > 0) msAdded++;
    }
    console.log(`✅ Milestones: ${msAdded}/12 seeded`);

    // Seed shadow scripts
    const scripts = [
        [
            "First Day at Work",
            "Hi everyone, I'm Alex. Today is my first day here.\n\nCan you tell me where the kitchen is? I'd like to know about the lunch break schedule.\n\nI'm going to work hard and learn as much as I can. Please feel free to ask me for help.\n\nThank you for the warm welcome. I look forward to working with all of you.",
            "A2",
            "work",
            45,
            "US",
            "a2,work",
            "SEM",
        ],
        [
            "Ordering at a Café",
            "Good morning! I'd like to order a large latte, please.\n\nCan I also get a blueberry muffin? Is it fresh today?\n\nActually, can I change that to a croissant instead? Sorry for the confusion.\n\nHow much is it? Here's my card. Thank you!",
            "A2",
            "food",
            40,
            "US",
            "a2,food",
            "SEM",
        ],
        [
            "Planning a Weekend Trip",
            "I've been planning a weekend trip to Da Nang!\n\nI'm checking out the Marble Mountains on Saturday morning, then relaxing at My Khe Beach.\n\nOn Sunday, I'll explore Hoi An and try bánh mì, cao lầu, and white rose dumplings.\n\nI've already booked a hotel. It's going to be an amazing trip.",
            "B1",
            "travel",
            55,
            "US",
            "b1,travel",
            "SEM",
        ],
        [
            "Talking About Work Challenges",
            "This week has been really challenging. We have a major project deadline on Friday.\n\nMy manager asked me to prepare a client presentation — something I'd never done.\n\nI spent extra time organizing slides and practicing. My colleague gave great feedback.\n\nThe more I prepared, the more confident I felt. Preparation beats anxiety every time.",
            "B1",
            "work",
            60,
            "US",
            "b1,work",
            "SEM",
        ],
        [
            "Discussing Investment Strategy",
            "When building a portfolio, diversification is the cornerstone of risk management.\n\nSpreading exposure across equities, bonds, real estate, and commodities mitigates market downturn impact.\n\nConsider your risk tolerance. A younger investor can accept short-term volatility for superior long-term returns.\n\nAs you approach your goals, shift towards conservative, income-generating assets to preserve wealth.",
            "B2",
            "finance",
            65,
            "US",
            "b2,finance",
            "SEM",
        ],
        [
            "Technology and the Future of Work",
            "Artificial intelligence is fundamentally reshaping the employment landscape.\n\nWhile automation displaces routine tasks, it generates new roles that didn't exist a decade ago.\n\nThe critical skill gap isn't just technical — it's adaptability, problem-solving, and human empathy.\n\nOrganizations that invest in continuous upskilling will navigate this transition most successfully.",
            "B2",
            "technology",
            70,
            "US",
            "b2,tech",
            "SEM",
        ],
        [
            "Ethical Dilemmas in Business",
            "Ethical decision-making rarely presents a clear binary between right and wrong.\n\nLeaders navigate complex trade-offs between competing legitimate interests — shareholder value vs stakeholder responsibilities.\n\nThe most pragmatic framework integrates consequentialist and deontological thinking, establishing non-negotiable boundaries.\n\nExceptional leaders confront dilemmas with intellectual honesty and transparency.",
            "C1",
            "business",
            80,
            "US",
            "c1,ethics",
            "SEM",
        ],
        [
            "The Neuroscience of Language Learning",
            "Language acquisition leverages the brain's most sophisticated neural machinery.\n\nLearning vocabulary in context encodes not just words, but emotions and situational cues.\n\nThe spaced repetition effect capitalizes on memory consolidation processes during sleep.\n\nEmotional engagement amplifies encoding — why immersive conversation practice accelerates acquisition so dramatically.",
            "C1",
            "academic",
            75,
            "US",
            "c1,neuroscience",
            "SEM",
        ],
    ];
    let ssAdded = 0;
    for (const [
        title,
        content,
        level,
        topic,
        dur,
        accent,
        tags,
        source,
    ] of scripts) {
        const res = await client.query(
            `INSERT INTO "ShadowScript" ("title","content","level","topic","durationSeconds","accent","tags","source")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`,
            [title, content, level, topic, Number(dur), accent, tags, source],
        );
        if (res.rowCount > 0) ssAdded++;
    }
    console.log(`✅ Shadow Scripts: ${ssAdded}/8 seeded`);

    const msCount = (await client.query('SELECT COUNT(*) FROM "Milestone"'))
        .rows[0].count;
    const ssCount = (await client.query('SELECT COUNT(*) FROM "ShadowScript"'))
        .rows[0].count;
    console.log(
        `\n📊 DB totals: Milestones=${msCount}, ShadowScripts=${ssCount}`,
    );

    await client.end();
}

main().catch((e) => {
    console.error("❌ Seed failed:", e.message);
    client.end();
    process.exit(1);
});
